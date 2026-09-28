import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db, INITIAL_USERS } from './server/db.js';
import { TREATMENT_RULES, MOK_REGISTRY, PARTNER_CLINICS } from './server/rules.js';
import { evaluateEligibilityWithGemini } from './server/gemini.js';
import { CaseItem, ApplicantRole, isTerminalCase } from './src/types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// In-memory demo session tracking (or header-based)
let currentUserId = 'user-patient-01';

export function getRequestUser(req: Request) {
  const headerUserId = (req.headers['x-user-id'] || req.headers['authorization']) as string;
  const bodyUserId = req.body?.currentUserId;
  const targetId = headerUserId || bodyUserId || currentUserId;
  return db.getUserById(targetId) || db.findUser(targetId) || db.getUserById(currentUserId) || db.getUsers()[0];
}

// --- API ROUTES ---

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', name: 'CuraLink API', timestamp: new Date().toISOString() });
});

// Auth & Users
app.get('/api/auth/users', (req: Request, res: Response) => {
  const users = db.getUsers();
  res.json(users);
});

app.get('/api/auth/current', (req: Request, res: Response) => {
  const user = db.getUserById(currentUserId) || db.getUsers()[0];
  res.json(user);
});

app.post('/api/auth/switch', (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(200).json({ success: false, error: 'User ID is required' });
  }

  // Look in existing database schema
  let user = db.getUserById(userId) || db.findUser(userId);

  // If not found in database schema, search INITIAL_USERS
  if (!user) {
    user = INITIAL_USERS.find(
      (u) =>
        u.id === userId ||
        u.email.toLowerCase() === userId.toLowerCase() ||
        u.name.toLowerCase() === userId.toLowerCase()
    );
    if (user) {
      db.addUser(user);
    }
  }

  if (user) {
    currentUserId = user.id;
    return res.json({ success: true, user });
  }

  // Graceful fallback to first user rather than breaking client
  const fallback = db.getUsers()[0] || INITIAL_USERS[0];
  if (fallback) {
    currentUserId = fallback.id;
    return res.json({ success: true, user: fallback });
  }

  res.json({ success: false, error: 'User not found' });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { identifier } = req.body;
  if (!identifier) {
    return res.status(400).json({ error: 'Please enter your email, TAJ number, or name.' });
  }
  const user = db.findUser(identifier);
  if (user) {
    currentUserId = user.id;
    return res.json({ success: true, user });
  }
  return res.status(404).json({
    error: 'Account not found. Please check your credentials or sign up as a new patient.',
  });
});

app.post('/api/auth/signup', (req: Request, res: Response) => {
  const { name, email, tajNumber, role } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required to register.' });
  }

  let formattedTaj = tajNumber ? tajNumber.trim() : '';
  if (!formattedTaj) {
    formattedTaj = Math.floor(100000000 + Math.random() * 900000000)
      .toString()
      .replace(/(\d{3})(\d{3})(\d{3})/, '$1-$2-$3');
  }

  const existing = db.findUser(email) || (formattedTaj ? db.findUser(formattedTaj) : undefined);
  if (existing) {
    currentUserId = existing.id;
    return res.json({ success: true, user: existing, alreadyExisted: true });
  }

  const newUser = {
    id: 'user-patient-' + Date.now().toString(36),
    name: name.trim(),
    email: email.trim(),
    role: role || ('patient' as const),
    tajDemo: formattedTaj,
  };

  db.addUser(newUser);
  currentUserId = newUser.id;
  return res.status(201).json({ success: true, user: newUser });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  currentUserId = '';
  return res.json({ success: true });
});

// Rules & Seed Data
app.get('/api/rules/treatments', (req: Request, res: Response) => {
  res.json(TREATMENT_RULES);
});

app.get('/api/mok-registry/verify/:license', (req: Request, res: Response) => {
  const license = req.params.license.trim().toUpperCase();
  const doctor = MOK_REGISTRY.find(
    (d) => d.licenseNumber.toUpperCase() === license
  );
  if (doctor) {
    res.json({ verified: true, doctor });
  } else {
    res.json({ verified: false, message: 'License number not found in mock MOK chamber registry' });
  }
});

app.get('/api/clinics', (req: Request, res: Response) => {
  const { procedure, route, country } = req.query;
  let clinics = [...PARTNER_CLINICS];

  if (procedure && typeof procedure === 'string') {
    clinics = clinics.filter((c) =>
      c.procedures.some((p) => p.toLowerCase().includes(procedure.toLowerCase()))
    );
  }

  if (route && typeof route === 'string') {
    if (route === 'S2') {
      clinics = clinics.filter((c) => c.providerType === 'public' || c.routeType === 'S2');
    } else if (route === 'Directive') {
      // Directive accepts both public and private
    }
  }

  if (country && typeof country === 'string') {
    clinics = clinics.filter((c) => c.country.toLowerCase() === country.toLowerCase());
  }

  res.json(clinics);
});

// Case Management
app.get('/api/cases', (req: Request, res: Response) => {
  const allCases = db.getCases();
  res.json(allCases);
});

app.get('/api/cases/:id', (req: Request, res: Response) => {
  const caseItem = db.getCaseById(req.params.id);
  if (!caseItem) {
    return res.status(404).json({ error: 'Case not found' });
  }
  res.json(caseItem);
});

// Create new case intake
app.post('/api/cases', async (req: Request, res: Response) => {
  try {
    const {
      patientName,
      tajNumber,
      applicantRole,
      procedure,
      monthsWaited,
      scheduledDomesticDate,
      conditionNotes,
      hasEhic,
      requestTravelCost,
      travelCompanion,
      eesztDocumentName,
      doctorName,
      doctorLicense,
      selectedClinicId,
    } = req.body;

    if (!procedure) {
      return res.status(400).json({ error: 'Missing procedure field' });
    }

    // Check whether this patient already has a case in any status other than a terminal one
    const allCases = db.getCases();
    const existingActiveCase = allCases.find((c) => {
      const isSameUser = c.userId === currentUserId;
      const isSameName = Boolean(patientName && c.patientName.trim().toLowerCase() === patientName.trim().toLowerCase());
      const isSameTaj = Boolean(tajNumber && c.tajNumber.trim() === tajNumber.trim());
      const belongsToThisPatient = isSameUser || isSameName || isSameTaj;
      return belongsToThisPatient && !isTerminalCase(c);
    });

    if (existingActiveCase) {
      return res.status(409).json({
        error: `You already have an active case in progress — ${existingActiveCase.procedure}, currently at ${existingActiveCase.currentStage}.`,
        activeCaseId: existingActiveCase.id,
        procedure: existingActiveCase.procedure,
        stage: existingActiveCase.currentStage,
      });
    }

    // Step 1: Treatment classification rules lookup
    const rule = TREATMENT_RULES.find(
      (r) => r.procedure.toLowerCase() === procedure.toLowerCase()
    ) || {
      procedure,
      requiresPA: true,
      category: 'inpatient' as const,
      reason: 'Requires inpatient admission or specialised equipment',
      domesticAverageWaitMonths: 18,
      isPlaceholderDefault: true,
    };

    const requiresPA = rule.requiresPA;
    const branch: 'PA' | 'NonPA' = requiresPA ? 'PA' : 'NonPA';

    // Step 3: Verification Layers
    // A. Structural check (automatable)
    const hasPastDate = Boolean(monthsWaited && monthsWaited > 0);
    const hasEesztAttachment = Boolean(eesztDocumentName && eesztDocumentName.length > 0);

    const structuralDetails: string[] = [];
    if (hasPastDate) structuralDetails.push(`Documented wait of ${monthsWaited} months logged.`);
    if (hasEesztAttachment) structuralDetails.push(`EESZT record: '${eesztDocumentName}' uploaded as proof.`);
    if (scheduledDomesticDate) structuralDetails.push(`Scheduled domestic hospital date: ${scheduledDomesticDate}.`);

    const structuralPassed = hasPastDate && hasEesztAttachment;

    // Target clinic name for prompt
    const targetClinic = PARTNER_CLINICS.find((c) => c.id === selectedClinicId);

    // Call server-side Gemini 3.8 Flash
    const aiResult = await evaluateEligibilityWithGemini({
      procedure,
      monthsWaited: Number(monthsWaited) || 0,
      conditionNotes: conditionNotes || 'No additional condition notes provided',
      doctorName: doctorName || 'Pending CuraLink Medical Advisor Clinical Review',
      clinicName: targetClinic?.name,
      requestTravelCost: Boolean(requestTravelCost),
      travelCompanion: Boolean(travelCompanion),
    });

    const nowIso = new Date().toISOString();
    const caseId = 'case-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);

    const newCase: CaseItem = {
      id: caseId,
      createdAt: nowIso,
      updatedAt: nowIso,
      userId: currentUserId,
      patientName: patientName || 'Kérelmező Beteg',
      tajNumber: tajNumber || '000-000-000',
      applicantRole: (applicantRole as ApplicantRole) || 'patient',
      procedure,
      requiresPA,
      branch,
      monthsWaited: Number(monthsWaited) || 0,
      scheduledDomesticDate: scheduledDomesticDate || undefined,
      conditionNotes: conditionNotes || '',
      hasEhic: Boolean(hasEhic),
      requestTravelCost: Boolean(requestTravelCost),
      travelCompanion: Boolean(travelCompanion),
      eesztDocumentName: eesztDocumentName || 'EESZT_Elektronikus_Kivonat.pdf',
      doctorName: doctorName || '',
      doctorLicense: doctorLicense || '',
      selectedClinicId: selectedClinicId || 'clinic-akh-vienna',
      currentStage: 'Awaiting Advisor Review',
      history: [
        {
          id: 'hist-' + Date.now() + '-1',
          stage: 'Awaiting Advisor Review',
          timestamp: nowIso,
          title: 'Case Submitted — Awaiting Medical Advisor Review',
          note: `Case created for ${procedure} (${branch} branch). Uploaded EESZT proof '${eesztDocumentName || 'EESZT_Elektronikus_Kivonat.pdf'}'. Your case has been sent to a CuraLink medical advisor for clinical review. You don't need to visit your own doctor.`,
          author: 'Patient Self-Service Portal',
        },
      ],
      verification: {
        structuralCheck: {
          passed: structuralPassed,
          details: structuralDetails,
          checkedAt: nowIso,
        },
        mokVerification: {
          passed: false,
          licenseNumber: '',
          verifiedAt: '',
        },
        clinicalJudgment: {
          status: 'pending',
          advisorName: undefined,
          attestedAt: undefined,
          notes: 'Your case has been sent to a CuraLink medical advisor for clinical review. You don\'t need to visit your own doctor.',
        },
      },
      aiReasoning: aiResult.reasoning,
      documentTitle: aiResult.documentTitle,
      fullDocument: aiResult.fullDocument,
    };

    db.createCase(newCase);
    res.status(201).json(newCase);
  } catch (error) {
    console.error('Error creating case:', error);
    res.status(500).json({ error: 'Failed to process case intake' });
  }
});

// Advisor Decision Gate (Approve, Request More Info, Reject)
app.post('/api/cases/:id/advisor-decision', (req: Request, res: Response) => {
  const caller = getRequestUser(req);
  if (caller.role !== 'advisor') {
    return res.status(403).json({ error: 'Permission denied: Clinical advisor decisions can only be made by a medical advisor.' });
  }

  const {
    action,
    clinicalJustification,
    moreInfoMessage,
    rejectionReason,
    advisorName,
    advisorMokLicense,
    advisorSpecialty,
  } = req.body;

  const caseItem = db.getCaseById(req.params.id);
  if (!caseItem) {
    return res.status(404).json({ error: 'Case not found' });
  }

  const nowIso = new Date().toISOString();
  const effectiveAdvisorName = advisorName || caller.name || 'Dr. Varga Zsuzsa';
  const effectiveAdvisorMok = advisorMokLicense || caller.mokLicense || 'MOK-HU-48192';
  const effectiveSpecialty = advisorSpecialty || caller.specialty || 'Ortopédia és Traumatológia';

  if (action === 'approve') {
    caseItem.currentStage = 'Reviewed';
    caseItem.advisorClinicalJustification = clinicalJustification || 'Clinical delay medically unjustifiable; treatment abroad indicated.';
    caseItem.advisorNotes = caseItem.advisorClinicalJustification;
    caseItem.doctorName = effectiveAdvisorName;
    caseItem.doctorLicense = effectiveAdvisorMok;

    caseItem.verification.clinicalJudgment = {
      status: 'attested',
      advisorName: effectiveAdvisorName,
      attestedAt: nowIso,
      notes: caseItem.advisorClinicalJustification,
    };
    caseItem.verification.mokVerification = {
      passed: true,
      licenseNumber: effectiveAdvisorMok,
      doctorName: effectiveAdvisorName,
      specialty: effectiveSpecialty,
      verifiedAt: nowIso,
      institution: 'CuraLink Orvosszakértői Testület',
    };

    // Update document with advisor details in treating doctor position
    const endorsementClause = `\n\n[KEZELŐORVOSI ÉS ORVOSSZAKÉRTŐI ZÁRADÉK]\nSzakvéleményt kiállító orvosszakértő: ${effectiveAdvisorName}\nMOK Kamarai nyilvántartási szám: ${effectiveAdvisorMok} (${effectiveSpecialty})\nKlinikai indoklás: ${caseItem.advisorClinicalJustification}\nMegállapítás: A hazai várólistás várakozási idő a beteg állapota és a bemutatott EESZT leletek alapján orvosilag nem indokolható a 883/2004/EK rendelet 20. cikke szerint.`;
    if (!caseItem.fullDocument.includes('[KEZELŐORVOSI ÉS ORVOSSZAKÉRTŐI ZÁRADÉK]')) {
      caseItem.fullDocument += endorsementClause;
    }

    if (caseItem.branch === 'NonPA') {
      // Standard Treatment and Claim Path (Directive 2011/24/EU):
      // Patient does not need any documentation before travel.
      // After Reviewed, it directly goes to Travelling / In Treatment.
      db.addHistoryEntry(caseItem.id, {
        stage: 'Reviewed',
        title: 'Clinical Review Approved by Medical Advisor',
        note: `Dr. ${effectiveAdvisorName} (${effectiveAdvisorMok}) attested: "${caseItem.advisorClinicalJustification}". Standard treatment and claim path confirmed (Directive 2011/24/EU).`,
        author: effectiveAdvisorName,
      });

      caseItem.currentStage = 'Travelling / In Treatment';
      db.addHistoryEntry(caseItem.id, {
        stage: 'Travelling / In Treatment',
        title: 'Patient En Route / In Treatment (Directive 2011/24/EU)',
        note: 'Clinical review passed. Under Directive 2011/24/EU, no prior authorization or documentation is needed before travel. Case transferred directly to Travelling / In Treatment with case manager and on-site chaperone support.',
        author: effectiveAdvisorName,
      });
    } else {
      caseItem.currentStage = 'Reviewed';
      db.addHistoryEntry(caseItem.id, {
        stage: 'Reviewed',
        title: 'Clinical Review Approved by Medical Advisor',
        note: `Dr. ${effectiveAdvisorName} (${effectiveAdvisorMok}) attested: "${caseItem.advisorClinicalJustification}". Document generation & NEAK submission unlocked.`,
        author: effectiveAdvisorName,
      });
    }
  } else if (action === 'request_info') {
    caseItem.currentStage = 'More Info Requested';
    caseItem.moreInfoMessage = moreInfoMessage || clinicalJustification || 'Please provide more details on waitlist status or imaging reports.';
    caseItem.verification.clinicalJudgment = {
      status: 'flagged',
      advisorName: effectiveAdvisorName,
      attestedAt: nowIso,
      notes: caseItem.moreInfoMessage,
    };

    db.addHistoryEntry(caseItem.id, {
      stage: 'More Info Requested',
      title: 'Medical Advisor Requested Additional Information',
      note: `Advisor note to patient: ${caseItem.moreInfoMessage}`,
      author: effectiveAdvisorName,
    });
  } else if (action === 'reject') {
    caseItem.currentStage = 'Rejected';
    caseItem.rejectionReason = rejectionReason || clinicalJustification || 'Domestic delay determined to be within allowable medical tolerance.';
    caseItem.verification.clinicalJudgment = {
      status: 'flagged',
      advisorName: effectiveAdvisorName,
      attestedAt: nowIso,
      notes: caseItem.rejectionReason,
    };

    db.addHistoryEntry(caseItem.id, {
      stage: 'Rejected',
      title: 'Medical Advisor Clinical Review: Not Medically Justifiable',
      note: `Advisor rejection reason: ${caseItem.rejectionReason}`,
      author: effectiveAdvisorName,
    });
  } else {
    return res.status(400).json({ error: 'Invalid action. Must be approve, request_info, or reject.' });
  }

  db.updateCase(caseItem.id, caseItem);
  return res.json(caseItem);
});

// Update User Profile (e.g. advisor MOK license and specialty)
app.post('/api/auth/profile', (req: Request, res: Response) => {
  const { id, name, mokLicense, specialty } = req.body;
  const targetId = id || currentUserId;
  const updated = db.updateUser(targetId, { name, mokLicense, specialty });
  if (updated) {
    return res.json({ success: true, user: updated });
  }
  return res.status(404).json({ error: 'User not found' });
});

// Step 7: Human Advisor Review Gate
app.post('/api/cases/:id/review', (req: Request, res: Response) => {
  const caller = getRequestUser(req);
  if (caller.role !== 'advisor') {
    return res.status(403).json({ error: 'Permission denied: Only medical advisors can perform review actions.' });
  }

  const { advisorName, notes } = req.body;
  const caseItem = db.getCaseById(req.params.id);

  if (!caseItem) {
    return res.status(404).json({ error: 'Case not found' });
  }

  const nowIso = new Date().toISOString();
  caseItem.verification.clinicalJudgment = {
    status: 'attested',
    advisorName: advisorName || caller.name || 'Dr. Varga Zsuzsa (CuraLink Healthcare Advisor)',
    attestedAt: nowIso,
    notes: notes || 'Medical urgency and domestic delay evaluated. Ground for cross-border care verified.',
  };
  caseItem.advisorNotes = notes || 'Advisor attested to medical justification.';

  if (caseItem.branch === 'NonPA') {
    db.addHistoryEntry(caseItem.id, {
      stage: 'Reviewed',
      title: 'Reviewed by Advisor Gate Passed',
      note: `Human advisor ${caseItem.verification.clinicalJudgment.advisorName} attested to medical necessity. Directive 2011/24/EU path confirmed.`,
      author: caseItem.verification.clinicalJudgment.advisorName || 'Advisor',
    });

    caseItem.currentStage = 'Travelling / In Treatment';
    db.addHistoryEntry(caseItem.id, {
      stage: 'Travelling / In Treatment',
      title: 'Patient En Route / In Treatment (Directive Route)',
      note: 'No prior authorization or documentation required before travel under Directive 2011/24/EU. Case moved directly to Travelling / In Treatment with case manager support.',
      author: caseItem.verification.clinicalJudgment.advisorName || 'Advisor',
    });
  } else {
    caseItem.currentStage = 'Reviewed';
    db.addHistoryEntry(caseItem.id, {
      stage: 'Reviewed',
      title: 'Reviewed by Advisor Gate Passed',
      note: `Human advisor ${caseItem.verification.clinicalJudgment.advisorName} attested to medical necessity. Document unlocked for physical dispatch.`,
      author: caseItem.verification.clinicalJudgment.advisorName || 'Advisor',
    });
  }

  db.updateCase(caseItem.id, caseItem);
  res.json(caseItem);
});

function generateReimbursementCoverSheet(caseItem: CaseItem): string {
  const clinic = PARTNER_CLINICS.find((c) => c.id === caseItem.selectedClinicId);
  const paidInv = caseItem.claimSlots?.paidInvoice?.fileName || 'Eredeti kifizetett számla';
  const transInv = caseItem.claimSlots?.translatedInvoice?.fileName || 'Nem csatolt / Eredetileg magyar vagy kétnyelvű bizonylat';
  const discSum = caseItem.claimSlots?.dischargeSummary?.fileName || 'Kórházi ambuláns lap / zárójelentés';
  const rxDoc = caseItem.claimSlots?.prescriptionDoc?.fileName || 'Nem releváns / Nincs külön recept';

  return `Tisztelt Nemzeti Egészségbiztosítási Alapkezelő!
Nemzetközi és Európai Integrációs Főosztály
1139 Budapest, Váci út 73/A.

Tárgy: Költségtérítési Kérelem és Mellékletjegyzék (Directive 2011/24/EU)
Iktatószám / Hivatkozás: ${caseItem.referenceNumber || 'NEAK-CLAIM-' + caseItem.id.toUpperCase()}

1. KÉRELMEZŐ BIZTOSÍTOTT
Név: [Patient name on file]
TAJ-szám: [TAJ number on file]
Eljárási minőség: Kérelmező saját jogán (Páciens)

2. KÜLFÖLDÖN IGÉNYBE VETT ELLÁTÁS ADATAI
Külföldi intézmény: ${clinic?.name || 'Külföldi partnerintézmény'} (${clinic?.city || 'Bratislava'}, ${clinic?.country || 'Szlovákia'})
Beavatkozás: ${caseItem.procedure}
Jogalap: A határon átnyúló egészségügyi ellátásra vonatkozó 2011/24/EU európai parlamenti és tanácsi irányelv, valamint a 340/2013. (IX. 25.) Korm. rendelet.

3. KÖLTSÉGTÉRÍTÉSI IGÉNY
Kérem a fenti ellátás kifizetett díjának utólagos megtérítését a magyarországi társadalombiztosítási finanszírozási referenciaérték és megtérítési plafon mértékéig.

4. ELLENŐRZÖTT CSATOLT MELLÉKLETEK JEGYZÉKE:
[X] 1. Kifizetett eredeti számla: ${paidInv}
${caseItem.claimSlots?.translatedInvoice ? '[X]' : '[ ]'} 2. Hiteles fordítás: ${transInv}
${caseItem.claimSlots?.dischargeSummary ? '[X]' : '[ ]'} 3. Zárójelentés / ambuláns lap: ${discSum}
${caseItem.claimSlots?.prescriptionDoc ? '[X]' : '[ ]'} 4. Recept / rendelvényi dokumentáció: ${rxDoc}

5. NYILATKOZAT
Kijelentem, hogy a csatolt számlák szerinti összeget megfizettem, más forrásból megtérítésben nem részesültem.

Kelt: Budapest, ${new Date().toLocaleDateString('hu-HU')}

_____________________________________
[Patient name on file] (Kérelmező)`;
}

// Directive Post-Treatment: Patient Upload Claim Slot
app.post('/api/cases/:id/claim-slot-upload', (req: Request, res: Response) => {
  const caseItem = db.getCaseById(req.params.id);
  if (!caseItem) return res.status(404).json({ error: 'Case not found' });
  if (caseItem.branch !== 'NonPA' || caseItem.currentStage !== 'Treated') {
    return res.status(400).json({ error: 'Claim uploads are only available for Directive cases at Treated stage.' });
  }

  const { slotKey, fileName } = req.body;
  if (!slotKey || !fileName) {
    return res.status(400).json({ error: 'slotKey and fileName are required.' });
  }

  if (!caseItem.claimSlots) {
    caseItem.claimSlots = {};
  }

  const validKeys = ['paidInvoice', 'translatedInvoice', 'dischargeSummary', 'prescriptionDoc'];
  if (!validKeys.includes(slotKey)) {
    return res.status(400).json({ error: 'Invalid slotKey.' });
  }

  (caseItem.claimSlots as any)[slotKey] = {
    fileName: fileName.trim(),
    uploadedAt: new Date().toISOString(),
  };

  caseItem.claimCoverSheet = generateReimbursementCoverSheet(caseItem);

  if (caseItem.claimReviewStatus !== 'complete' && caseItem.claimReviewStatus !== 'submitted_to_neak') {
    caseItem.claimReviewStatus = 'ready_to_prepare';
  }

  const slotTitles: Record<string, string> = {
    paidInvoice: 'Paid invoice',
    translatedInvoice: 'Translated invoice',
    dischargeSummary: 'Discharge summary',
    prescriptionDoc: 'Prescription documentation',
  };

  db.addHistoryEntry(caseItem.id, {
    stage: 'Treated',
    title: `Claim Document Uploaded: ${slotTitles[slotKey] || slotKey}`,
    note: `Uploaded '${fileName.trim()}' into ${slotTitles[slotKey] || slotKey} slot for reimbursement claim.`,
    author: 'Patient Self-Service Checklist',
  });

  db.updateCase(caseItem.id, caseItem);
  res.json(caseItem);
});

// Directive Post-Treatment: Case Manager Claim Review
app.post('/api/cases/:id/claim-review', (req: Request, res: Response) => {
  const caller = getRequestUser(req);
  if (caller.role !== 'case_manager') {
    return res.status(403).json({ error: 'Permission denied: Claim review is a case manager duty.' });
  }

  const caseItem = db.getCaseById(req.params.id);
  if (!caseItem) return res.status(404).json({ error: 'Case not found' });
  if (caseItem.branch !== 'NonPA' || caseItem.currentStage !== 'Treated') {
    return res.status(400).json({ error: 'Claim review is only available for Directive cases at Treated stage.' });
  }

  const { status, message } = req.body;
  if (status === 'complete') {
    caseItem.claimReviewStatus = 'complete';
    caseItem.claimNeedsMoreMessage = undefined;
    caseItem.claimCoverSheet = generateReimbursementCoverSheet(caseItem);

    db.addHistoryEntry(caseItem.id, {
      stage: 'Treated',
      title: 'Reimbursement Claim Documents Marked Complete',
      note: `Case manager verified all required claim documents. Cover sheet generated. Dispatch checklist unlocked.`,
      author: `Case Manager (${caller.name})`,
    });
  } else if (status === 'needs_more') {
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'A message for the patient is required when requesting more info.' });
    }
    caseItem.claimReviewStatus = 'needs_more';
    caseItem.claimNeedsMoreMessage = message.trim();

    db.addHistoryEntry(caseItem.id, {
      stage: 'Treated',
      title: 'Reimbursement Claim: More Information Requested from Patient',
      note: `Case manager requested: "${message.trim()}".`,
      author: `Case Manager (${caller.name})`,
    });
  } else {
    return res.status(400).json({ error: 'Invalid status. Must be complete or needs_more.' });
  }

  db.updateCase(caseItem.id, caseItem);
  res.json(caseItem);
});

// Step 8: Case Manager Dispatch Checklist:
// (a) Signed form received: scan uploaded & original in hand ticked
// (b) Mark as mailed: date sent and tracking number (both required)
// (c) Stage becomes "Submitted", tracker shows "Sent by registered mail on [date], tracking [number]"
app.post('/api/cases/:id/dispatch-submit', (req: Request, res: Response) => {
  const caller = getRequestUser(req);
  if (caller.role !== 'case_manager') {
    return res.status(403).json({ error: 'Permission denied: Dispatch to NEAK is a case manager task.' });
  }

  const caseItem = db.getCaseById(req.params.id);
  if (!caseItem) {
    return res.status(404).json({ error: 'Case not found' });
  }

  const {
    signedScanFileName,
    signedOriginalInHand,
    dateSent,
    trackingNumber,
    isClaimDispatch,
  } = req.body;

  if (!isClaimDispatch && caseItem.branch === 'NonPA') {
    return res.status(400).json({
      error: 'Dispatch to NEAK before travel is not needed for Standard treatment and claim path (Directive 2011/24/EU). Patients do not need any documentation before travel.',
    });
  }

  if (!signedOriginalInHand) {
    return res.status(400).json({ error: 'Checklist requirement incomplete: You must confirm signed original in hand.' });
  }
  if (!dateSent || !trackingNumber || !trackingNumber.trim()) {
    return res.status(400).json({ error: 'Date sent and registered-mail tracking number are required.' });
  }

  const nowIso = new Date().toISOString();
  const trimmedTracking = trackingNumber.trim();

  if (isClaimDispatch) {
    caseItem.claimDispatchInfo = {
      signedScanFileName: signedScanFileName || 'Patient_Signed_Reimbursement_Claim.pdf',
      signedOriginalInHand: true,
      dateSent,
      trackingNumber: trimmedTracking,
      submittedAt: nowIso,
    };
    caseItem.claimReviewStatus = 'submitted_to_neak';

    db.addHistoryEntry(caseItem.id, {
      stage: caseItem.currentStage,
      title: 'Reimbursement Claim Dispatched to NEAK by Registered Mail',
      note: `Sent by registered mail on ${dateSent}, tracking ${trimmedTracking}. Signed original in hand verified.`,
      author: `Case Manager (${caller.name})`,
      referenceNumber: trimmedTracking,
    });
  } else {
    if (caseItem.currentStage !== 'Reviewed') {
      return res.status(400).json({
        error: 'Dispatch blocked: Case must be Reviewed by advisor before sending to NEAK.',
      });
    }

    caseItem.currentStage = 'Submitted';
    caseItem.submissionTimestamp = nowIso;
    caseItem.referenceNumber = trimmedTracking;
    caseItem.dispatchInfo = {
      signedScanFileName: signedScanFileName || 'Patient_Signed_S2_Form.pdf',
      signedOriginalInHand: true,
      dateSent,
      trackingNumber: trimmedTracking,
      submittedAt: nowIso,
    };

    db.addHistoryEntry(caseItem.id, {
      stage: 'Submitted',
      title: 'Dispatched to NEAK by Registered Mail',
      note: `Sent by registered mail on ${dateSent}, tracking ${trimmedTracking}. Signed original in hand verified.`,
      author: `Case Manager (${caller.name})`,
      referenceNumber: trimmedTracking,
    });
  }

  db.updateCase(caseItem.id, caseItem);
  return res.json(caseItem);
});

// Backward-compatible submit endpoint
app.post('/api/cases/:id/submit', (req: Request, res: Response) => {
  const caller = getRequestUser(req);
  if (caller.role !== 'case_manager') {
    return res.status(403).json({ error: 'Permission denied: Dispatch to NEAK is a case manager task.' });
  }

  const caseItem = db.getCaseById(req.params.id);
  if (!caseItem) {
    return res.status(404).json({ error: 'Case not found' });
  }

  if (caseItem.currentStage !== 'Reviewed') {
    return res.status(400).json({
      error: 'Submission blocked: No application can move to Submitted until Reviewed by advisor.',
    });
  }

  const refNumber = 'RL-' + Math.floor(100000000 + Math.random() * 900000000) + 'HU';
  const nowIso = new Date().toISOString();
  const todayStr = nowIso.split('T')[0];

  caseItem.submissionTimestamp = nowIso;
  caseItem.referenceNumber = refNumber;
  caseItem.dispatchInfo = {
    signedScanFileName: 'Patient_Signed_S2_Form.pdf',
    signedOriginalInHand: true,
    dateSent: todayStr,
    trackingNumber: refNumber,
    submittedAt: nowIso,
  };

  db.addHistoryEntry(caseItem.id, {
    stage: 'Submitted',
    title: 'Submitted to NEAK International Affairs (Registered Mail)',
    note: `Sent by registered mail on ${todayStr}, tracking ${refNumber}.`,
    author: `Case Manager (${caller.name})`,
    referenceNumber: refNumber,
  });

  db.updateCase(caseItem.id, caseItem);
  res.json(caseItem);
});

// NEAK Follow-up Call (case manager only)
// Logs call date, notes, and outcome: Approved, Rejected, More info requested, or Still pending.
// Approved moves case to "Authorised". Upload decision letter & record travel support decision.
// Rejected opens existing SOLVIT appeal flow.
app.post('/api/cases/:id/neak-followup', (req: Request, res: Response) => {
  const caller = getRequestUser(req);
  if (caller.role !== 'case_manager') {
    return res.status(403).json({ error: 'Permission denied: Only a case manager can record NEAK follow-up updates.' });
  }

  const caseItem = db.getCaseById(req.params.id);
  if (!caseItem) {
    return res.status(404).json({ error: 'Case not found' });
  }

  const {
    callDate,
    decisionDate,
    referenceNumber,
    notes,
    outcome,
    decision,
    officerName,
    decisionLetterName,
    travelSupportDecision,
    travelSupportAmount,
    travelSupportTiming,
    rejectionReason,
  } = req.body;

  const effectiveOutcomeRaw = (decision || outcome || 'Still pending') as string;
  const isAuthorised = effectiveOutcomeRaw === 'Authorised' || effectiveOutcomeRaw === 'Approved';
  const isRejected = effectiveOutcomeRaw === 'Rejected';
  const isStillPending = effectiveOutcomeRaw === 'Still pending';

  const effectiveOutcome: 'Authorised' | 'Approved' | 'Rejected' | 'More info requested' | 'Still pending' =
    isAuthorised
      ? 'Authorised'
      : isRejected
      ? 'Rejected'
      : effectiveOutcomeRaw === 'More info requested'
      ? 'More info requested'
      : 'Still pending';

  // Rule 2 & 3: For Authorised or Rejected, decision letter is required
  if ((isAuthorised || isRejected) && (!decisionLetterName || !decisionLetterName.trim())) {
    return res.status(400).json({
      error: 'Upload of the official NEAK decision letter is required for Authorised or Rejected decisions.',
    });
  }

  // Rule 3: Allowed transition from Submitted is Authorised or Rejected (or Still pending)
  if (caseItem.branch === 'PA') {
    if (caseItem.currentStage !== 'Submitted' && !isStillPending) {
      return res.status(400).json({
        error: `Invalid transition: NEAK decision can only be recorded from Submitted stage (current stage: ${caseItem.currentStage}).`,
      });
    }
  }

  const nowIso = new Date().toISOString();
  const effectiveDate = decisionDate || callDate || nowIso.split('T')[0];
  caseItem.neakCallDate = effectiveDate;
  caseItem.neakDecisionDate = effectiveDate;
  caseItem.neakCallNotes = notes || '';
  caseItem.neakCallOutcome = effectiveOutcome;
  caseItem.neakOfficerName = officerName || 'NEAK International Affairs Desk';
  if (referenceNumber && referenceNumber.trim()) {
    caseItem.referenceNumber = referenceNumber.trim();
  }

  if (isAuthorised) {
    if (caseItem.branch === 'NonPA') {
      caseItem.currentStage = 'Reimbursed';
      caseItem.decisionLetterName = decisionLetterName.trim();
      caseItem.reimbursementAmount = req.body.reimbursementAmount || req.body.travelSupportAmount || '480,000 HUF';
      caseItem.reimbursementDate = effectiveDate;

      db.addHistoryEntry(caseItem.id, {
        stage: 'Reimbursed',
        title: 'NEAK Decision Recorded: Reimbursement Approved',
        note: `NEAK approved domestic tariff reimbursement of ${caseItem.reimbursementAmount} on ${caseItem.reimbursementDate} (Ref: ${caseItem.referenceNumber || 'N/A'}, Decision letter: ${caseItem.decisionLetterName}). Notes: "${notes || 'Reimbursement issued.'}"`,
        author: `Case Manager (${caller.name})`,
      });
    } else {
      caseItem.currentStage = 'Authorised';
      caseItem.decisionLetterName = decisionLetterName.trim();
      caseItem.travelSupportDecision = travelSupportDecision || 'not_requested';
      caseItem.travelSupportAmount = travelSupportAmount || '';
      caseItem.travelSupportTiming = travelSupportTiming || 'before_travel';
      caseItem.travelSupportPaid = false;

      let travelSummary = '';
      if (caseItem.travelSupportDecision === 'granted') {
        travelSummary = ` Travel support granted: ${caseItem.travelSupportAmount || 'amount on file'} (${caseItem.travelSupportTiming === 'before_travel' ? 'payable before travel' : 'settled after travel'}).`;
      } else if (caseItem.travelSupportDecision === 'not_granted') {
        travelSummary = ' Travel support decision: Not granted.';
      }

      db.addHistoryEntry(caseItem.id, {
        stage: 'Authorised',
        title: "NEAK Decision Recorded: Authorised",
        note: `NEAK issued S2 Prior Authorisation (Ref: ${caseItem.referenceNumber || 'N/A'}, Decision letter: ${caseItem.decisionLetterName}).${travelSummary} Notes: "${notes || 'Authorisation granted.'}"`,
        author: `Case Manager (${caller.name})`,
      });
    }
  } else if (isRejected) {
    caseItem.currentStage = 'Rejected';
    caseItem.decisionLetterName = decisionLetterName.trim();
    caseItem.rejectionReason = rejectionReason || notes || (caseItem.branch === 'NonPA' ? 'NEAK refused reimbursement claim under Directive 2011/24/EU.' : 'NEAK cited domestic capacity availability.');

    if (caseItem.branch === 'NonPA') {
      caseItem.solvitDocument = `SOLVIT Cross-Border Healthcare Complaint & Appeal
To: SOLVIT Centre Hungary (Prime Minister's Office) & SOLVIT Cross-Border Network
Re: Contestation of NEAK Denial of Reimbursement under Directive 2011/24/EU
Reference Number: ${caseItem.referenceNumber || 'NEAK-2026-REFUSED'}
Applicant: ${caseItem.patientName} (TAJ: ${caseItem.tajNumber})
Procedure: ${caseItem.procedure}

1. SUMMARY OF GRIEVANCE
The applicant underwent medically justified planned treatment in an EU Member State under Directive 2011/24/EU. NEAK denied post-treatment reimbursement, violating the patient's freedom to receive healthcare services across borders as established in Article 56 TFEU and Directive 2011/24/EU.

2. REMEDY REQUESTED
Immediate SOLVIT intervention to ensure NEAK recalculates and transfers the reimbursement up to the Hungarian domestic tariff.`;

      db.addHistoryEntry(caseItem.id, {
        stage: 'Rejected',
        title: "NEAK Decision Recorded: Reimbursement Rejected",
        note: `NEAK refused reimbursement claim (Ref: ${caseItem.referenceNumber || 'N/A'}, Decision letter: ${caseItem.decisionLetterName}): "${caseItem.rejectionReason}". SOLVIT appeal draft opened.`,
        author: `Case Manager (${caller.name})`,
      });
    } else {
      caseItem.solvitDocument = `SOLVIT Cross-Border Healthcare Complaint & Appeal
To: SOLVIT Centre Hungary (Prime Minister's Office) & SOLVIT Cross-Border Network
Re: Contestation of NEAK Denial of Prior Authorisation / Tariff Clearance
Reference Number: ${caseItem.referenceNumber || 'NEAK-2026-REFUSED'}
Applicant: ${caseItem.patientName} (TAJ: ${caseItem.tajNumber})
Procedure: ${caseItem.procedure}
Wait Time Endured: ${caseItem.monthsWaited} months

1. SUMMARY OF GRIEVANCE
The applicant applied for cross-border care under EU Regulation 883/2004 (S2 Portable Document). NEAK issued a refusal citing theoretical domestic capacity, disregarding the ${caseItem.monthsWaited} months already elapsed and treating doctor ${caseItem.doctorName}'s clinical assessment of irreversible condition deterioration.

2. LEGAL INFRINGEMENT
Under CJEU settled case-law (Case C-372/04 Watts, Case C-56/01 Inizan), a competent institution cannot refuse prior authorisation when the required treatment cannot be obtained within a timeframe that is medically acceptable based on an objective clinical assessment of the patient's individual condition.

3. SOUGHT RELIEF
Immediate intervention by the Hungarian and Destination Country SOLVIT desks to compel NEAK to issue S2 prior authorisation.`;

      db.addHistoryEntry(caseItem.id, {
        stage: 'Rejected',
        title: "NEAK Decision Recorded: Rejected",
        note: `NEAK refused authorisation (Ref: ${caseItem.referenceNumber || 'N/A'}, Decision letter: ${caseItem.decisionLetterName}): "${caseItem.rejectionReason}". SOLVIT appeal draft opened.`,
        author: `Case Manager (${caller.name})`,
      });
    }
  } else if (effectiveOutcome === 'More info requested') {
    caseItem.currentStage = 'More Info Requested';
    caseItem.moreInfoMessage = notes || 'NEAK requested supplementary clinical or administrative details.';
    db.addHistoryEntry(caseItem.id, {
      stage: 'More Info Requested',
      title: "Update from case manager's NEAK follow-up call: More info requested",
      note: `NEAK officer requested: "${caseItem.moreInfoMessage}".`,
      author: `Case Manager (${caller.name})`,
    });
  } else {
    // Still pending
    db.addHistoryEntry(caseItem.id, {
      stage: caseItem.currentStage,
      title: "Update from case manager's NEAK follow-up call: Still pending",
      note: `Case manager contacted NEAK desk (${officerName || 'International Affairs'}). Application status remains pending evaluation. Notes: "${notes || 'Under review.'}"`,
      author: `Case Manager (${caller.name})`,
    });
  }

  db.updateCase(caseItem.id, caseItem);
  return res.json(caseItem);
});

// Non-PA Article 9(5) Voluntary Prior Notification
app.post('/api/cases/:id/article-9-5', (req: Request, res: Response) => {
  const caseItem = db.getCaseById(req.params.id);
  if (!caseItem) {
    return res.status(404).json({ error: 'Case not found' });
  }

  const art9Doc = `Tisztelt Nemzeti Egészségbiztosítási Alapkezelő!
Nemzetközi és Európai Integrációs Főosztály

Hivatkozással a határon átnyúló egészségügyi ellátásra vonatkozó 2011/24/EU irányelv 9. cikk (5) bekezdésére, alulírott [Patient name on file] (TAJ: [TAJ number on file]) kérem a NEAK hivatalos írásbeli előzetes visszaigazolását a tervezett külföldi beavatkozás (${caseItem.procedure}) várható hazai finanszírozási referenciaértékéről és megtérítési plafonjáról.

Tervezett külföldi szolgáltató: ${PARTNER_CLINICS.find((c) => c.id === caseItem.selectedClinicId)?.name || 'Külföldi partnerintézmény'}.

Kelt: Budapest, ${new Date().toLocaleDateString('hu-HU')}`;

  caseItem.article9_5Document = art9Doc;
  db.updateCase(caseItem.id, { article9_5Document: art9Doc });

  db.addHistoryEntry(caseItem.id, {
    stage: caseItem.currentStage,
    title: 'Article 9(5) Voluntary Prior Notification Drafted',
    note: 'Generated formal request for written confirmation of expected NEAK reimbursement before travel.',
    author: 'CuraLink Advisor Desk',
  });

  res.json(caseItem);
});

// SOLVIT Appeal Trigger
app.post('/api/cases/:id/solvit-appeal', (req: Request, res: Response) => {
  const caseItem = db.getCaseById(req.params.id);
  if (!caseItem) {
    return res.status(404).json({ error: 'Case not found' });
  }

  if (!caseItem.solvitDocument) {
    caseItem.solvitDocument = `SOLVIT Cross-Border Healthcare Complaint & Appeal
To: SOLVIT Centre Hungary & SOLVIT Cross-Border Network
Re: Contestation of NEAK Denial of Cross-Border Healthcare
Reference: ${caseItem.referenceNumber || 'NEAK-2026-REFUSED'}
Complainant: [Patient name on file] (TAJ: [TAJ number on file])
Procedure: ${caseItem.procedure} (${caseItem.monthsWaited} months waited)

1. DISPUTE SUMMARY:
NEAK refused prior authorisation / reimbursement citing general domestic capacity, failing the test of medically justifiable time established under Article 20 of Regulation (EC) 883/2004 and CJEU Case C-372/04 (Watts).

2. REMEDY REQUESTED:
Urgent SOLVIT mediation with the Hungarian National Health Insurance Fund to reconsider and issue appropriate authorisation documents.`;
  }

  db.addHistoryEntry(caseItem.id, {
    stage: 'SOLVIT Appeal Drafted',
    title: 'SOLVIT Appeal Prepared & Action Surfaced',
    note: 'Administrative refusal countered by drafting formal complaint to the EU SOLVIT network. Patient provided with mediation package.',
    author: 'CuraLink Legal Navigation Engine',
  });

  res.json(caseItem);
});

// PART 1: Evidence Wizard Submission
app.post('/api/cases/:id/evidence', (req: Request, res: Response) => {
  const caseItem = db.getCaseById(req.params.id);
  if (!caseItem) {
    return res.status(404).json({ error: 'Case not found' });
  }

  const {
    monthsWaited,
    scheduledDomesticDate,
    eesztDocumentName,
    doctorNoteFileName,
    conditionNotes,
    doctorName,
    doctorLicense,
  } = req.body;

  if (monthsWaited !== undefined) caseItem.monthsWaited = Number(monthsWaited);
  if (scheduledDomesticDate !== undefined) caseItem.scheduledDomesticDate = scheduledDomesticDate;
  if (eesztDocumentName !== undefined) caseItem.eesztDocumentName = eesztDocumentName;
  if (doctorNoteFileName !== undefined) caseItem.doctorNoteFileName = doctorNoteFileName;
  if (conditionNotes !== undefined) caseItem.conditionNotes = conditionNotes;
  if (doctorName !== undefined) caseItem.doctorName = doctorName;
  if (doctorLicense !== undefined) caseItem.doctorLicense = doctorLicense;

  // Run automated structural verification
  const hasWait = Number(caseItem.monthsWaited) > 0;
  const hasEeszt = Boolean(caseItem.eesztDocumentName);
  const hasNote = Boolean(caseItem.doctorNoteFileName);
  const hasDoctor = Boolean(caseItem.doctorName && caseItem.doctorLicense);

  const structPassed = hasWait && hasEeszt && hasNote && hasDoctor;

  const details: string[] = [];
  if (hasWait) details.push(`Documented wait of ${caseItem.monthsWaited} months.`);
  if (hasEeszt) details.push(`EESZT record: '${caseItem.eesztDocumentName}' uploaded.`);
  if (hasNote) details.push(`Signed doctor's note: '${caseItem.doctorNoteFileName}' attached.`);
  if (hasDoctor) details.push(`Treating doctor: ${caseItem.doctorName} (MOK: ${caseItem.doctorLicense}).`);

  // Check MOK
  const normalizedLic = (caseItem.doctorLicense || '').trim().toUpperCase();
  const mokMatch = MOK_REGISTRY.find(
    (m) => m.licenseNumber.toUpperCase() === normalizedLic
  );

  caseItem.verification.structuralCheck = {
    passed: structPassed,
    details,
    checkedAt: new Date().toISOString(),
  };

  caseItem.verification.mokVerification = {
    passed: Boolean(mokMatch),
    licenseNumber: caseItem.doctorLicense,
    doctorName: mokMatch?.name || caseItem.doctorName,
    specialty: mokMatch?.specialty,
    institution: mokMatch?.institution,
    verifiedAt: new Date().toISOString(),
  };

  db.addHistoryEntry(caseItem.id, {
    stage: caseItem.currentStage,
    title: 'Evidence Bundle Updated via Guided Wizard',
    note: `Updated wait duration (${caseItem.monthsWaited}m), EESZT proof, and Dr. ${caseItem.doctorName} note. Structural check passed: ${structPassed}.`,
    author: 'Patient Self-Service Wizard',
  });

  db.updateCase(caseItem.id, caseItem);
  res.json(caseItem);
});

// PART 2: Upload document from abroad during Travelling / In Treatment
app.post('/api/cases/:id/upload-document', (req: Request, res: Response) => {
  const caseItem = db.getCaseById(req.params.id);
  if (!caseItem) {
    return res.status(404).json({ error: 'Case not found' });
  }

  const { documentName, documentType } = req.body;
  const docId = 'doc-abroad-' + Date.now().toString(36);
  const nowIso = new Date().toISOString();

  if (!caseItem.uploadedDocuments) {
    caseItem.uploadedDocuments = [];
  }

  const docRecord = {
    id: docId,
    name: documentName || 'Medical_Record_Abroad.pdf',
    timestamp: nowIso,
    type: documentType || 'Hospital Discharge / Invoice from Abroad',
  };

  caseItem.uploadedDocuments.push(docRecord);

  db.addHistoryEntry(caseItem.id, {
    stage: caseItem.currentStage,
    title: `Document Uploaded from Abroad: ${docRecord.name}`,
    note: `Patient or on-site coordinator uploaded ${docRecord.type} while in treatment. Timestamped and secured in case dossier.`,
    author: 'Patient / On-Site Coordinator',
  });

  db.updateCase(caseItem.id, { uploadedDocuments: caseItem.uploadedDocuments });
  res.json(caseItem);
});

// Travel Support Payment (case manager only)
app.post('/api/cases/:id/pay-travel-support', (req: Request, res: Response) => {
  const caller = getRequestUser(req);
  if (caller.role !== 'case_manager') {
    return res.status(403).json({ error: 'Permission denied: Only case managers can record travel support payment.' });
  }

  const caseItem = db.getCaseById(req.params.id);
  if (!caseItem) {
    return res.status(404).json({ error: 'Case not found' });
  }

  const amount = req.body.amount || caseItem.travelSupportAmount || '45,000 HUF';
  caseItem.travelSupportPaid = true;
  caseItem.travelSupportPaidAmount = amount;

  db.addHistoryEntry(caseItem.id, {
    stage: caseItem.currentStage,
    title: 'Travel Support Disbursed to Patient',
    note: `Travel support of ${amount} paid before travel. Verified and recorded by Case Manager.`,
    author: `Case Manager (${caller.name})`,
  });

  db.updateCase(caseItem.id, caseItem);
  res.json(caseItem);
});

// Patient Arrived (case manager only)
// Precondition: If travel support was granted with timing "before travel", must mark "Travel support paid" first.
app.post('/api/cases/:id/patient-arrived', (req: Request, res: Response) => {
  const caller = getRequestUser(req);
  if (caller.role !== 'case_manager') {
    return res.status(403).json({ error: 'Permission denied: Only case managers can record patient arrival.' });
  }

  const caseItem = db.getCaseById(req.params.id);
  if (!caseItem) {
    return res.status(404).json({ error: 'Case not found' });
  }

  // Rule 3: Patient arrived is active only at Authorised for S2 pre-approval path
  if (caseItem.branch === 'PA' && caseItem.currentStage !== 'Authorised') {
    return res.status(400).json({
      error: 'Invalid transition: Patient arrived is only available once NEAK authorises this case (stage must be Authorised).',
    });
  }

  if (
    caseItem.travelSupportDecision === 'granted' &&
    caseItem.travelSupportTiming === 'before_travel' &&
    !caseItem.travelSupportPaid
  ) {
    return res.status(400).json({
      error: 'Cannot record patient arrived: Travel support of ' + (caseItem.travelSupportAmount || 'granted amount') + ' must be marked paid before travel.',
    });
  }

  caseItem.currentStage = 'Travelling / In Treatment';

  db.addHistoryEntry(caseItem.id, {
    stage: 'Travelling / In Treatment',
    title: 'Patient Arrived at Destination Clinic',
    note: 'In-person chaperone met patient at destination. Admission and care underway.',
    author: `Case Manager (${caller.name})`,
  });

  db.updateCase(caseItem.id, caseItem);
  res.json(caseItem);
});

// Mark treatment as complete (case manager only, moves to Treated)
app.post('/api/cases/:id/complete-treatment', (req: Request, res: Response) => {
  const caller = getRequestUser(req);
  if (caller.role !== 'case_manager') {
    return res.status(403).json({ error: 'Permission denied: Only case managers can mark treatment as complete.' });
  }

  const caseItem = db.getCaseById(req.params.id);
  if (!caseItem) {
    return res.status(404).json({ error: 'Case not found' });
  }

  // Rule 3: Mark treatment as complete is active only after Patient arrived (Travelling / In Treatment)
  if (caseItem.branch === 'PA' && caseItem.currentStage !== 'Travelling / In Treatment') {
    return res.status(400).json({
      error: 'Invalid transition: Mark treatment as complete is only available when case is Travelling / In Treatment (after Patient arrived).',
    });
  }

  caseItem.currentStage = 'Treated';

  db.addHistoryEntry(caseItem.id, {
    stage: 'Treated',
    title: 'Medical Treatment Concluded at Clinic',
    note: 'Case manager and on-site chaperone verified successful completion of surgical procedure abroad. Moved to Treated stage for settlement.',
    author: `Case Manager (${caller.name})`,
  });

  db.updateCase(caseItem.id, caseItem);
  res.json(caseItem);
});

// S2 Pre-approval Path: Close Case (case manager only)
// Form: "NEAK–clinic settlement confirmed" (required), "Travel or companion support paid", "Other payment to patient"
app.post('/api/cases/:id/close-s2-case', (req: Request, res: Response) => {
  const caller = getRequestUser(req);
  if (caller.role !== 'case_manager') {
    return res.status(403).json({ error: 'Permission denied: Only case managers can close cases.' });
  }

  const caseItem = db.getCaseById(req.params.id);
  if (!caseItem) {
    return res.status(404).json({ error: 'Case not found' });
  }

  const { settlementConfirmed, travelSupportPaidAmount, otherPaymentAmount, notes } = req.body;

  if (!settlementConfirmed) {
    return res.status(400).json({ error: 'NEAK–clinic settlement confirmation is required to close this case.' });
  }

  // Rule 3: Case closed transition is allowed only from Treated stage
  if (caseItem.currentStage !== 'Treated') {
    return res.status(400).json({
      error: `Invalid transition: Case can only be closed once treatment is complete (current stage: ${caseItem.currentStage}).`,
    });
  }

  caseItem.currentStage = 'Case closed';
  caseItem.settlementConfirmed = true;
  if (travelSupportPaidAmount && travelSupportPaidAmount.trim()) {
    caseItem.travelSupportPaid = true;
    caseItem.travelSupportPaidAmount = travelSupportPaidAmount.trim();
  }
  if (otherPaymentAmount && otherPaymentAmount.trim()) {
    caseItem.otherPaymentAmount = otherPaymentAmount.trim();
  }

  const paymentItems: string[] = ['NEAK–clinic settlement confirmed'];
  if (caseItem.travelSupportPaidAmount) {
    paymentItems.push(`Travel/companion support: ${caseItem.travelSupportPaidAmount}`);
  }
  if (caseItem.otherPaymentAmount) {
    paymentItems.push(`Other payment: ${caseItem.otherPaymentAmount}`);
  }

  db.addHistoryEntry(caseItem.id, {
    stage: 'Case closed',
    title: 'Case closed: Settled with NEAK',
    note: `Case closed. ${paymentItems.join(' · ')}. ${notes || 'All institutional liabilities and patient support resolved.'}`,
    author: `Case Manager (${caller.name})`,
  });

  db.updateCase(caseItem.id, caseItem);
  res.json(caseItem);
});

// Directive Path: Upload post-treatment invoices, translations, discharge summary
app.post('/api/cases/:id/upload-post-treatment-docs', (req: Request, res: Response) => {
  const caseItem = db.getCaseById(req.params.id);
  if (!caseItem) {
    return res.status(404).json({ error: 'Case not found' });
  }

  const { name, type } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Document name is required.' });
  }

  if (!caseItem.postTreatmentDocuments) {
    caseItem.postTreatmentDocuments = [];
  }

  const newDoc = {
    id: 'post-doc-' + Date.now().toString(36),
    name: name.trim(),
    type: type || ('Invoice' as const),
    timestamp: new Date().toISOString(),
  };

  caseItem.postTreatmentDocuments.push(newDoc);

  db.addHistoryEntry(caseItem.id, {
    stage: caseItem.currentStage,
    title: `Post-Treatment Document Uploaded: ${newDoc.name}`,
    note: `Uploaded ${newDoc.type} for reimbursement claim preparation under Directive 2011/24/EU.`,
    author: 'Patient Dossier Intake',
  });

  db.updateCase(caseItem.id, caseItem);
  res.json(caseItem);
});

// Directive Path: Mark Reimbursed (case manager only)
app.post('/api/cases/:id/reimburse-directive', (req: Request, res: Response) => {
  const caller = getRequestUser(req);
  if (caller.role !== 'case_manager') {
    return res.status(403).json({ error: 'Permission denied: Only case managers can mark reimbursement.' });
  }

  const caseItem = db.getCaseById(req.params.id);
  if (!caseItem) {
    return res.status(404).json({ error: 'Case not found' });
  }

  const { reimbursementAmount, reimbursementDate, notes } = req.body;
  if (!reimbursementAmount || !reimbursementDate) {
    return res.status(400).json({ error: 'Reimbursement amount and date are required.' });
  }

  caseItem.currentStage = 'Reimbursed';
  caseItem.reimbursementAmount = reimbursementAmount.trim();
  caseItem.reimbursementDate = reimbursementDate.trim();

  db.addHistoryEntry(caseItem.id, {
    stage: 'Reimbursed',
    title: 'Reimbursement Finalized with NEAK',
    note: `NEAK transferred reimbursement of ${caseItem.reimbursementAmount} on ${caseItem.reimbursementDate}. ${notes || 'Case settled and archived.'}`,
    author: `Case Manager (${caller.name})`,
  });

  db.updateCase(caseItem.id, caseItem);
  res.json(caseItem);
});

// Operational Notes Log (case manager only)
app.post('/api/cases/:id/manager-notes', (req: Request, res: Response) => {
  const caller = getRequestUser(req);
  if (caller.role !== 'case_manager') {
    return res.status(403).json({ error: 'Permission denied: Only case managers can add operational notes.' });
  }

  const caseItem = db.getCaseById(req.params.id);
  if (!caseItem) {
    return res.status(404).json({ error: 'Case not found' });
  }

  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Note text cannot be empty.' });
  }

  if (!caseItem.managerNotes) {
    caseItem.managerNotes = [];
  }

  const newNote = {
    id: 'note-' + Date.now().toString(36),
    timestamp: new Date().toISOString(),
    author: caller.name,
    text: text.trim(),
  };

  caseItem.managerNotes.push(newNote);
  db.updateCase(caseItem.id, caseItem);
  res.json(caseItem);
});

// Reset Demo Data
app.post('/api/reset-demo', (req: Request, res: Response) => {
  db.resetSeedData();
  res.json({ success: true, message: 'Database reset to initial demo state.' });
});

// --- VITE MIDDLEWARE OR STATIC SERVING ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`CuraLink full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
