import React, { useState } from 'react';
import { CaseItem, Clinic, UserProfile, PostTreatmentDocument } from '../types';
import { StepTracker } from '../components/StepTracker';
import { EvidenceGateWizard } from '../components/EvidenceGateWizard';
import { DispatchChecklist } from '../components/DispatchChecklist';
import { OperationsPanel } from '../components/OperationsPanel';
import { RecordNeakDecisionPanel } from '../components/RecordNeakDecisionPanel';
import { api } from '../services/api';
import { useI18n } from '../i18n';
import {
  FileText,
  ShieldCheck,
  Send,
  Download,
  Copy,
  Check,
  AlertTriangle,
  Scale,
  PhoneCall,
  Calendar,
  Building2,
  User,
  ArrowRight,
  Clock,
  Sparkles,
  Plane,
  HeartPulse,
  Info,
  UploadCloud,
  CheckCircle2,
  Phone,
  HelpCircle,
  FileCheck,
  Lock,
  Stethoscope,
  Coins,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  Plus,
  HeartHandshake,
  Upload,
} from 'lucide-react';

interface CaseDetailPageProps {
  caseItem: CaseItem;
  currentUser?: UserProfile | null;
  clinics: Clinic[];
  onCaseUpdated: (updated: CaseItem) => void;
  onNavigate: (tab: string, caseId?: string) => void;
}

export const CaseDetailPage: React.FC<CaseDetailPageProps> = ({
  caseItem,
  currentUser,
  clinics,
  onCaseUpdated,
  onNavigate,
}) => {
  const { language, t } = useI18n();

  const isPatient = currentUser?.role === 'patient' || (!currentUser?.role || (currentUser?.role !== 'case_manager' && currentUser?.role !== 'advisor'));
  const isCaseManager = currentUser?.role === 'case_manager';
  const isAdvisor = currentUser?.role === 'advisor';

  // Copy states for documents
  const [copiedDoc, setCopiedDoc] = useState(false);
  const [copiedSolvit, setCopiedSolvit] = useState(false);
  const [copiedArt9, setCopiedArt9] = useState(false);
  const [activeDocTab, setActiveDocTab] = useState<'main' | 'art9' | 'solvit'>('main');

  // Wizard and Abroad Upload States
  const [showEvidenceWizard, setShowEvidenceWizard] = useState(false);
  const [showUploadAbroadModal, setShowUploadAbroadModal] = useState(false);
  const [abroadDocName, setAbroadDocName] = useState('Hospital_Discharge_Summary_Signed.pdf');
  const [abroadDocType, setAbroadDocType] = useState('Discharge Summary');
  const [uploadingAbroad, setUploadingAbroad] = useState(false);

  // Directive Post-Treatment Claim Slots (for Patient & Case Manager)
  const [uploadingSlotKey, setUploadingSlotKey] = useState<string | null>(null);
  const [claimNeedsMoreText, setClaimNeedsMoreText] = useState(caseItem.claimNeedsMoreMessage || '');
  const [showNeedsMoreForm, setShowNeedsMoreForm] = useState(false);
  const [reviewingClaim, setReviewingClaim] = useState(false);
  const [showCoverSheetPreview, setShowCoverSheetPreview] = useState(false);
  const [claimActionError, setClaimActionError] = useState<string | null>(null);

  // Advisor Review Modal / State
  const [showAdvisorModal, setShowAdvisorModal] = useState(false);
  const [advisorAction, setAdvisorAction] = useState<'approve' | 'request_info' | 'reject'>('approve');
  const [advisorClinicalJustification, setAdvisorClinicalJustification] = useState(
    caseItem.advisorClinicalJustification ||
    `Based on the documented ${caseItem.monthsWaited}-month domestic wait and verified EESZT records, patient's condition presents progressive functional deterioration refractory to conservative measures. Domestic delay exceeds what is medically justifiable under EU Regulation 883/2004 Article 20 / Directive 2011/24/EU jurisprudence.`
  );
  const [advisorCustomReason, setAdvisorCustomReason] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [advisorReviewError, setAdvisorReviewError] = useState<string | null>(null);

  // Case Manager NEAK Follow-up Modal / State (Requirement 1 & 3)
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpCallDate, setFollowUpCallDate] = useState(new Date().toISOString().split('T')[0]);
  const [followUpOutcome, setFollowUpOutcome] = useState<'Approved' | 'Rejected' | 'More info requested' | 'Still pending'>('Approved');
  const [followUpNote, setFollowUpNote] = useState('NEAK international desk officer confirmed approval of S2 form.');
  const [followUpOfficer, setFollowUpOfficer] = useState('Dr. Kiss Andrea (NEAK Nemzetközi Főosztály)');
  const [decisionLetterName, setDecisionLetterName] = useState('NEAK_Hatarozat_S2_Engedely.pdf');
  const [travelSupportDecision, setTravelSupportDecision] = useState<'not_requested' | 'not_granted' | 'granted'>('granted');
  const [travelSupportAmount, setTravelSupportAmount] = useState('45,000 HUF');
  const [travelSupportTiming, setTravelSupportTiming] = useState<'before_travel' | 'after_travel'>('before_travel');
  const [rejectionReason, setRejectionReason] = useState(
    'NEAK cited domestic hospital theoretical capacity within 12 months, despite patient already having waited 18+ months.'
  );
  const [updatingFollowUp, setUpdatingFollowUp] = useState(false);

  // S2 Case Closing Modal / State (Requirement 4)
  const [showCloseS2Modal, setShowCloseS2Modal] = useState(false);
  const [closeSettlementConfirmed, setCloseSettlementConfirmed] = useState(true);
  const [closeTravelSupportPaid, setCloseTravelSupportPaid] = useState(caseItem.travelSupportPaidAmount || caseItem.travelSupportAmount || '45,000 HUF');
  const [closeOtherPayment, setCloseOtherPayment] = useState('');
  const [closeNotes, setCloseNotes] = useState('NEAK and foreign clinic direct S2 voucher settlement verified. Case dossier fully resolved.');
  const [closingS2, setClosingS2] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  // Directive Reimbursement Finalizing Modal / State (Requirement 5)
  const [showReimburseModal, setShowReimburseModal] = useState(false);
  const [reimbursementAmount, setReimbursementAmount] = useState(caseItem.reimbursementAmount || '480,000 HUF (1,220 EUR)');
  const [reimbursementDate, setReimbursementDate] = useState(new Date().toISOString().split('T')[0]);
  const [reimburseNotes, setReimburseNotes] = useState('NEAK domestic reference reimbursement transferred directly to patient bank account.');
  const [finalizingReimburse, setFinalizingReimburse] = useState(false);
  const [reimburseError, setReimburseError] = useState<string | null>(null);

  // Document generation states
  const [generatingArt9, setGeneratingArt9] = useState(false);
  const [generatingSolvit, setGeneratingSolvit] = useState(false);

  const matchedClinic = clinics.find((c) => c.id === caseItem.selectedClinicId);
  const isRejected = caseItem.currentStage === 'Rejected';
  const isSolvit = caseItem.currentStage === 'SOLVIT Appeal Drafted';
  const isTerminal = caseItem.currentStage === 'Case closed' || caseItem.currentStage === 'Reimbursed';

  const isReviewed =
    caseItem.currentStage === 'Reviewed' ||
    caseItem.currentStage === 'Submitted' ||
    caseItem.currentStage === 'Authorised' ||
    caseItem.currentStage === 'Travelling / In Treatment' ||
    caseItem.currentStage === 'Treated' ||
    caseItem.currentStage === 'Reimbursed' ||
    caseItem.currentStage === 'Case closed';

  const handleCopy = (text: string, type: 'main' | 'art9' | 'solvit') => {
    navigator.clipboard.writeText(text);
    if (type === 'main') setCopiedDoc(true);
    if (type === 'art9') setCopiedArt9(true);
    if (type === 'solvit') setCopiedSolvit(true);
    setTimeout(() => {
      setCopiedDoc(false);
      setCopiedArt9(false);
      setCopiedSolvit(false);
    }, 2000);
  };

  const handleDownload = (filename: string, content: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleAdvisorReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (advisorAction === 'approve' && !advisorClinicalJustification.trim()) {
      setAdvisorReviewError('Please provide a clinical justification note before approving.');
      return;
    }
    if (advisorAction === 'request_info' && !advisorCustomReason.trim()) {
      setAdvisorReviewError('Please write the message explaining what additional medical information is requested.');
      return;
    }
    if (advisorAction === 'reject' && !advisorCustomReason.trim()) {
      setAdvisorReviewError('Please provide the medical reason for rejecting this application.');
      return;
    }

    setReviewing(true);
    setAdvisorReviewError(null);
    try {
      const updated = await api.advisorDecision(caseItem.id, {
        action: advisorAction,
        clinicalJustification: advisorClinicalJustification.trim(),
        moreInfoMessage: advisorAction === 'request_info' ? advisorCustomReason.trim() : undefined,
        rejectionReason: advisorAction === 'reject' ? advisorCustomReason.trim() : undefined,
      });
      onCaseUpdated(updated);
      setShowAdvisorModal(false);
    } catch (err: any) {
      setAdvisorReviewError(err.message || 'Failed to submit clinical decision');
    } finally {
      setReviewing(false);
    }
  };

  const handleUploadAbroadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingAbroad(true);
    try {
      const updated = await api.uploadDocument(caseItem.id, abroadDocName, abroadDocType);
      onCaseUpdated(updated);
      setShowUploadAbroadModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingAbroad(false);
    }
  };

  const CLAIM_SLOTS_DEF = [
    {
      key: 'paidInvoice' as const,
      titleEn: 'Paid invoice',
      titleHu: 'Kifizetett kórházi számla',
      descEn: 'Itemized official clinic bill showing proof of payment.',
      descHu: 'Részletezett kórházi számla, amely igazolja a befizetést.',
      required: true,
      presetFileName: 'Kifizetett_Korhazi_Szamla_Eredeti.pdf',
    },
    {
      key: 'translatedInvoice' as const,
      titleEn: 'Translated invoice (if not in Hungarian)',
      titleHu: 'Hiteles fordítás (ha nem magyar nyelvű)',
      descEn: 'Certified translation if the invoice is in Slovak, German, etc.',
      descHu: 'Hiteles magyar nyelvű fordítás idegen nyelvű számla esetén.',
      required: false,
      presetFileName: 'Szamla_Hiteles_Magyar_Forditas.pdf',
    },
    {
      key: 'dischargeSummary' as const,
      titleEn: 'Discharge summary (if the invoice lacks medical detail)',
      titleHu: 'Kórházi zárójelentés / ambuláns lap',
      descEn: 'Hospital discharge summary detailing surgery and clinical diagnosis.',
      descHu: 'Kórházi zárójelentés a beavatkozás orvosi részleteivel.',
      required: false,
      presetFileName: 'Klinikai_Zarojelentes_Ambulans_Lap.pdf',
    },
    {
      key: 'prescriptionDoc' as const,
      titleEn: 'Prescription documentation (if applicable)',
      titleHu: 'Recept és rendelvényi dokumentáció',
      descEn: 'Cross-border prescription notes or medication receipts.',
      descHu: 'Külföldi recept, rendelvény vagy gyógyszerbizonylat.',
      required: false,
      presetFileName: 'Kulfoldi_Recept_Es_Rendelveny.pdf',
    },
  ];

  const getClaimCoverSheetText = (item: CaseItem, clinic?: Clinic): string => {
    if (item.claimCoverSheet) return item.claimCoverSheet;
    const paidInv = item.claimSlots?.paidInvoice?.fileName || 'Eredeti kifizetett számla';
    const transInv = item.claimSlots?.translatedInvoice?.fileName || 'Nem csatolt / Eredetileg magyar vagy kétnyelvű bizonylat';
    const discSum = item.claimSlots?.dischargeSummary?.fileName || 'Kórházi ambuláns lap / zárójelentés';
    const rxDoc = item.claimSlots?.prescriptionDoc?.fileName || 'Nem releváns / Nincs külön recept';

    return `Tisztelt Nemzeti Egészségbiztosítási Alapkezelő!
Nemzetközi és Európai Integrációs Főosztály
1139 Budapest, Váci út 73/A.

Tárgy: Költségtérítési Kérelem és Mellékletjegyzék (Directive 2011/24/EU)
Iktatószám / Hivatkozás: ${item.referenceNumber || 'NEAK-CLAIM-' + item.id.toUpperCase()}

1. KÉRELMEZŐ BIZTOSÍTOTT
Név: ${item.patientName}
TAJ-szám: ${item.tajNumber}
Eljárási minőség: Kérelmező saját jogán (Páciens)

2. KÜLFÖLDÖN IGÉNYBE VETT ELLÁTÁS ADATAI
Külföldi intézmény: ${clinic?.name || 'Külföldi partnerintézmény'} (${clinic?.city || 'Bratislava'}, ${clinic?.country || 'Szlovákia'})
Beavatkozás: ${item.procedure}
Jogalap: A határon átnyúló egészségügyi ellátásra vonatkozó 2011/24/EU európai parlamenti és tanácsi irányelv, valamint a 340/2013. (IX. 25.) Korm. rendelet.

3. KÖLTSÉGTÉRÍTÉSI IGÉNY
Kérem a fenti ellátás kifizetett díjának utólagos megtérítését a magyarországi társadalombiztosítási finanszírozási referenciaérték és megtérítési plafon mértékéig.

4. ELLENŐRZÖTT CSATOLT MELLÉKLETEK JEGYZÉKE:
[X] 1. Kifizetett eredeti számla: ${paidInv}
${item.claimSlots?.translatedInvoice ? '[X]' : '[ ]'} 2. Hiteles fordítás: ${transInv}
${item.claimSlots?.dischargeSummary ? '[X]' : '[ ]'} 3. Zárójelentés / ambuláns lap: ${discSum}
${item.claimSlots?.prescriptionDoc ? '[X]' : '[ ]'} 4. Recept / rendelvényi dokumentáció: ${rxDoc}

5. NYILATKOZAT
Kijelentem, hogy a csatolt számlák szerinti összeget megfizettem, más forrásból megtérítésben nem részesültem.

Kelt: Budapest, ${new Date().toLocaleDateString('hu-HU')}

_____________________________________
${item.patientName} (Kérelmező)`;
  };

  const handleUploadSlot = async (slotKey: string, fileName: string) => {
    if (!fileName.trim()) return;
    setUploadingSlotKey(slotKey);
    setClaimActionError(null);
    try {
      const updated = await api.uploadClaimSlot(caseItem.id, slotKey, fileName.trim());
      onCaseUpdated(updated);
    } catch (err: any) {
      console.error(err);
      setClaimActionError(err.message || 'Failed to upload claim document');
    } finally {
      setUploadingSlotKey(null);
    }
  };

  const handleMarkClaimComplete = async () => {
    setReviewingClaim(true);
    setClaimActionError(null);
    try {
      const updated = await api.reviewClaim(caseItem.id, 'complete');
      onCaseUpdated(updated);
    } catch (err: any) {
      console.error(err);
      setClaimActionError(err.message || 'Failed to complete claim review');
    } finally {
      setReviewingClaim(false);
    }
  };

  const handleRequestMoreClaimInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimNeedsMoreText.trim()) {
      setClaimActionError(language === 'hu' ? 'Kérjük, írja meg a betegnek, hogy milyen dokumentum hiányzik.' : 'Please enter a message explaining what documents are missing.');
      return;
    }
    setReviewingClaim(true);
    setClaimActionError(null);
    try {
      const updated = await api.reviewClaim(caseItem.id, 'needs_more', claimNeedsMoreText.trim());
      onCaseUpdated(updated);
      setShowNeedsMoreForm(false);
    } catch (err: any) {
      console.error(err);
      setClaimActionError(err.message || 'Failed to request more info');
    } finally {
      setReviewingClaim(false);
    }
  };

  const handleNeakFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingFollowUp(true);
    try {
      const updated = await api.updateNeakFollowUp(caseItem.id, {
        callDate: followUpCallDate,
        notes: followUpNote,
        outcome: followUpOutcome,
        officerName: followUpOfficer,
        decisionLetterName: followUpOutcome === 'Approved' ? decisionLetterName : undefined,
        travelSupportDecision: followUpOutcome === 'Approved' ? travelSupportDecision : undefined,
        travelSupportAmount: followUpOutcome === 'Approved' && travelSupportDecision === 'granted' ? travelSupportAmount : undefined,
        travelSupportTiming: followUpOutcome === 'Approved' && travelSupportDecision === 'granted' ? travelSupportTiming : undefined,
        rejectionReason: followUpOutcome === 'Rejected' ? rejectionReason : undefined,
      });
      onCaseUpdated(updated);
      setShowFollowUpModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingFollowUp(false);
    }
  };

  const handleCloseS2Case = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closeSettlementConfirmed) {
      setCloseError(language === 'hu' ? 'A NEAK–klinika elszámolás visszaigazolása kötelező!' : 'NEAK–clinic settlement confirmation is required.');
      return;
    }
    setClosingS2(true);
    setCloseError(null);
    try {
      const updated = await api.closeS2Case(caseItem.id, {
        settlementConfirmed: true,
        travelSupportPaidAmount: closeTravelSupportPaid.trim() || undefined,
        otherPaymentAmount: closeOtherPayment.trim() || undefined,
        notes: closeNotes.trim() || undefined,
      });
      onCaseUpdated(updated);
      setShowCloseS2Modal(false);
    } catch (err: any) {
      setCloseError(err.message || 'Failed to close case');
    } finally {
      setClosingS2(false);
    }
  };

  const handleReimburseDirective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reimbursementAmount.trim() || !reimbursementDate.trim()) {
      setReimburseError(language === 'hu' ? 'Az összeg és a dátum megadása kötelező!' : 'Amount and date are required.');
      return;
    }
    setFinalizingReimburse(true);
    setReimburseError(null);
    try {
      const updated = await api.reimburseDirective(caseItem.id, {
        reimbursementAmount: reimbursementAmount.trim(),
        reimbursementDate: reimbursementDate.trim(),
        notes: reimburseNotes.trim() || undefined,
      });
      onCaseUpdated(updated);
      setShowReimburseModal(false);
    } catch (err: any) {
      setReimburseError(err.message || 'Failed to finalize reimbursement');
    } finally {
      setFinalizingReimburse(false);
    }
  };

  const handleGenerateArticle95 = async () => {
    setGeneratingArt9(true);
    try {
      const updated = await api.generateArticle95(caseItem.id);
      onCaseUpdated(updated);
      setActiveDocTab('art9');
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingArt9(false);
    }
  };

  const handleTriggerSolvit = async () => {
    setGeneratingSolvit(true);
    try {
      const updated = await api.triggerSolvitAppeal(caseItem.id);
      onCaseUpdated(updated);
      setActiveDocTab('solvit');
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingSolvit(false);
    }
  };

  const supportContact = caseItem.supportContact || {
    name: 'Balogh Zoltán (CuraLink In-Person Chaperone)',
    phone: '+43 676 812 4901',
  };

  const plainPathName =
    caseItem.branch === 'PA' ? t('path.pa') : t('path.nonPa');

  // =========================================================================
  // REQUIREMENT 6: Patient Screen After Case Closes
  // Calm congratulation screen hiding AI analysis, docs, notes, tracker
  // =========================================================================
  if (isPatient && isTerminal) {
    const isDirective = caseItem.branch === 'NonPA';
    const travelPaid = caseItem.travelSupportPaid && (caseItem.travelSupportPaidAmount || caseItem.travelSupportAmount);

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 space-y-10 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center shadow-inner">
            <HeartHandshake className="w-8 h-8 text-emerald-700" />
          </div>

          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 inline-block">
              {language === 'hu' ? 'Ügy sikeresen lezárva' : 'Case Successfully Concluded'}
            </span>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 leading-tight">
              {isDirective
                ? (language === 'hu'
                    ? `Gratulálunk, a(z) ${caseItem.reimbursementAmount || 'jóváhagyott'} összegű költségtérítése megérkezett.`
                    : `Congratulations, your reimbursement of ${caseItem.reimbursementAmount || 'approved amount'} has been received.`)
                : (language === 'hu'
                    ? 'Gratulálunk, a kezelése sikeresen befejeződött, és a NEAK elszámolása teljeskörűen lezárult.'
                    : 'Congratulations, your treatment is complete and fully settled.')}
            </h1>

            {travelPaid && (
              <p className="text-base font-semibold text-emerald-900">
                {language === 'hu'
                  ? `A(z) ${caseItem.travelSupportPaidAmount || caseItem.travelSupportAmount} összegű utazási támogatása kifizetésre került.`
                  : `Your travel support of ${caseItem.travelSupportPaidAmount || caseItem.travelSupportAmount} has been paid.`}
              </p>
            )}

            <p className="text-sm text-slate-600 max-w-lg mx-auto pt-2 leading-relaxed">
              {language === 'hu'
                ? "Örülünk, hogy Ön mellett lehettünk. Mielőbbi, zökkenőmentes felépülést kívánunk!"
                : "We're glad we could be with you. Wishing you a smooth recovery."}
            </p>
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('new-case')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#1E2761] hover:bg-[#151B45] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <span>{language === 'hu' ? 'Új ügy indítása' : 'Start a new case'}</span>
              <ArrowRight className="w-4 h-4 text-[#C9A24B]" />
            </button>

            <button
              onClick={() => onNavigate('dashboard')}
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              {language === 'hu' ? 'Vissza az ügyeimhez' : 'Back to My Cases'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STANDARD CASE VIEW (Advisor, Case Manager, or Patient in-progress)
  // =========================================================================
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Top Bar with Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (currentUser?.role === 'advisor') {
                  onNavigate('review-queue');
                } else {
                  onNavigate('dashboard');
                }
              }}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer font-medium"
            >
              ← {currentUser?.role === 'advisor'
                ? (language === 'hu' ? 'Vissza a bírálati sorhoz' : 'Back to Review Queue')
                : currentUser?.role === 'case_manager'
                ? (language === 'hu' ? 'Vissza a műveletekhez és ügyekhez' : 'Back to Operations & Cases')
                : (language === 'hu' ? 'Vissza az ügyeimhez' : 'Back to My Cases')}
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-mono text-slate-500">{caseItem.id}</span>
            {caseItem.referenceNumber && (
              <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-mono font-semibold">
                Ref: {caseItem.referenceNumber}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-[#1E2761]">
            {caseItem.procedure}
          </h1>
          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
            <span>
              {language === 'hu' ? 'Jogi útvonal:' : 'Pathway:'}{' '}
              <strong className="text-slate-800">{plainPathName}</strong>
            </span>
            <span>·</span>
            <span>
              {language === 'hu' ? 'Belföldi várakozás:' : 'Domestic Wait:'}{' '}
              <strong className="text-slate-800">{caseItem.monthsWaited} {language === 'hu' ? 'hónap' : 'months'}</strong>
            </span>
            <span>·</span>
            <span>
              {language === 'hu' ? 'Kérelmező:' : 'Applicant:'}{' '}
              <strong className="text-slate-800">{caseItem.patientName}</strong>
            </span>
          </div>
        </div>

        {/* Action Controls for Staff & Advisors */}
        <div className="flex items-center gap-2 flex-wrap">
          {currentUser?.role === 'advisor' && caseItem.currentStage === 'Awaiting Advisor Review' && (
            <button
              onClick={() => setShowAdvisorModal(true)}
              className="px-4 py-2 rounded-lg bg-[#1E2761] hover:bg-[#151B45] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Stethoscope className="w-3.5 h-3.5 text-[#C9A24B]" />
              <span>Review Case & Clinical Decision</span>
            </button>
          )}

          {currentUser?.role === 'case_manager' && (
            (caseItem.branch === 'PA' && caseItem.currentStage === 'Submitted') ||
            (caseItem.branch === 'NonPA' && caseItem.currentStage === 'Treated' && caseItem.claimReviewStatus === 'submitted_to_neak')
          ) && (
            <button
              onClick={() => {
                const el = document.getElementById('record-neak-decision-panel');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  el.classList.add('ring-4', 'ring-[#C9A24B]');
                  setTimeout(() => {
                    el.classList.remove('ring-4', 'ring-[#C9A24B]');
                  }, 2000);
                } else {
                  setShowFollowUpModal(true);
                }
              }}
              className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-300 cursor-pointer shadow-xs"
              title="Record follow-up phone call with NEAK desk or record decision"
            >
              <PhoneCall className="w-3.5 h-3.5 text-[#1E2761]" />
              <span>{language === 'hu' ? 'NEAK telefonos egyeztetés / Döntés' : 'NEAK Follow-up Call / Decision'}</span>
            </button>
          )}

          {currentUser?.role === 'case_manager' && caseItem.currentStage === 'Treated' && caseItem.branch === 'PA' && (
            <button
              onClick={() => setShowCloseS2Modal(true)}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{language === 'hu' ? 'Ügy lezárása (NEAK elszámolva)' : 'Close Case: Settled with NEAK'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Step Tracker (Visual Centerpiece with dispatch and travel callouts) */}
      <StepTracker
        branch={caseItem.branch}
        currentStage={caseItem.currentStage}
        isRejected={isRejected}
        isSolvit={isSolvit}
        dispatchInfo={caseItem.dispatchInfo}
        travelSupportInfo={{
          decision: caseItem.travelSupportDecision,
          amount: caseItem.travelSupportAmount,
          timing: caseItem.travelSupportTiming,
          paid: caseItem.travelSupportPaid,
          paidAmount: caseItem.travelSupportPaidAmount,
        }}
      />

      {/* =================================================================== */}
      {/* CASE MANAGER OPERATIONS PANEL (Replaces "Not Doing This Alone" card) */}
      {/* =================================================================== */}
      {isCaseManager && (
        <OperationsPanel
          caseItem={caseItem}
          clinic={matchedClinic}
          onCaseUpdated={onCaseUpdated}
        />
      )}

      {/* =================================================================== */}
      {/* PATIENT VIEW: "You're Not Doing This Alone" Card (Patient Only) */}
      {/* =================================================================== */}
      {isPatient && caseItem.currentStage === 'Travelling / In Treatment' && (
        <section className="bg-gradient-to-r from-blue-50 via-indigo-50/40 to-slate-50 rounded-2xl border border-blue-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1E2761] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Plane className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#1E2761]">
                  {t('support.aloneTitle')}
                </h2>
                <p className="text-xs text-slate-600">
                  {language === 'hu'
                    ? 'Személyes segítségünk végigkíséri az utazás és a kezelés teljes időtartama alatt.'
                    : 'Personal on-site support from arrival to discharge.'}
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{language === 'hu' ? 'Kísérő a helyszínen aktív' : 'In-Person Support Active'}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Support Card */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1E2761]">
                <HeartPulse className="w-4 h-4 text-[#C9A24B]" />
                <span>{t('support.cardTitle')}</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {t('support.cardText')}
              </p>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 block">{t('support.contact')}</span>
                  <span className="font-bold text-slate-900">{supportContact.name}</span>
                </div>
                <a
                  href={`tel:${supportContact.phone}`}
                  className="px-3 py-1.5 rounded bg-[#1E2761] text-white text-xs font-semibold flex items-center gap-1 hover:bg-[#151B45]"
                >
                  <Phone className="w-3 h-3" />
                  <span>{supportContact.phone}</span>
                </a>
              </div>
            </div>

            {/* Document Upload from Abroad */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1E2761]">
                  <UploadCloud className="w-4 h-4 text-[#1E2761]" />
                  <span>{t('support.uploadAbroadBtn')}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {t('support.uploadAbroadDesc')}
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowUploadAbroadModal(true)}
                  className="px-4 py-2.5 bg-[#1E2761] hover:bg-[#151B45] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <UploadCloud className="w-4 h-4 text-[#C9A24B]" />
                  <span>{t('support.uploadAbroadBtn')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Uploaded Documents List */}
          {caseItem.uploadedDocuments && caseItem.uploadedDocuments.length > 0 && (
            <div className="pt-2 border-t border-blue-100">
              <div className="text-xs font-bold text-slate-800 mb-2">
                {language === 'hu' ? 'Külföldről beérkezett dokumentumok:' : 'Documents Uploaded from Abroad:'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {caseItem.uploadedDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs flex items-center justify-between shadow-2xs"
                  >
                    <div className="truncate mr-2">
                      <div className="font-semibold text-slate-800 truncate">{doc.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {doc.type} · {new Date(doc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* =================================================================== */}
      {/* DISPATCH TO NEAK CHECKLIST (Case Manager Only at Reviewed Stage - S2 PA Path Only) */}
      {/* =================================================================== */}
      {isCaseManager && caseItem.currentStage === 'Reviewed' && caseItem.branch === 'PA' && (
        <DispatchChecklist
          caseItem={caseItem}
          isClaimDispatch={false}
          onSuccess={onCaseUpdated}
        />
      )}

      {/* =================================================================== */}
      {/* DIRECTIVE ROUTE: Case Manager Direct Travel Panel at Reviewed Stage */}
      {/* Standard treatment and claim path requires NO pre-travel NEAK filing */}
      {/* =================================================================== */}
      {isCaseManager && caseItem.currentStage === 'Reviewed' && caseItem.branch === 'NonPA' && (
        <div className="bg-emerald-50/90 border-2 border-emerald-300 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold">
                <Plane className="w-4 h-4 text-[#C9A24B]" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-emerald-950">
                  {language === 'hu'
                    ? 'Utólagos elszámolási út (2011/24/EU irányelv) — Nincs előzetes NEAK-dokumentáció'
                    : 'Standard Treatment & Claim After Path (Directive 2011/24/EU) — No Pre-Travel NEAK Filing'}
                </h3>
                <p className="text-[11px] text-emerald-800">
                  {language === 'hu'
                    ? 'A szakértő jóváhagyta az ellátást. Az utazás előtt nincs szükség NEAK-engedélyre; a beteg közvetlenül utazhat a kezelésre.'
                    : 'Advisor clinical review passed. Under Directive 2011/24/EU, no prior authorization or documentation is needed from NEAK before travel.'}
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-300 self-start sm:self-auto">
              {language === 'hu' ? 'Közvetlenül utazhat' : 'Direct Travel'}
            </span>
          </div>

          <p className="text-xs text-emerald-900 leading-relaxed">
            {language === 'hu'
              ? 'Az ellátásszervező és a helyszíni kísérő közvetlenül koordinálja a beteg utazását és kórházi ellátását. A NEAK-költségtérítési igényt a kezelés befejezése után kell benyújtani az eredeti számlákkal.'
              : 'Our case manager and on-site chaperone support the patient during travel and treatment. The reimbursement claim is submitted to NEAK after treatment with itemized invoices.'}
          </p>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-[11px] text-emerald-800 font-medium">
              {language === 'hu' ? 'Kattintson az utazás és ellátás megkezdésének rögzítéséhez:' : 'Proceed directly to active travel and treatment:'}
            </span>
            <button
              onClick={async () => {
                try {
                  const updated = await api.patientArrived(caseItem.id);
                  onCaseUpdated(updated);
                } catch (err: any) {
                  console.error(err);
                }
              }}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-colors"
            >
              <Plane className="w-4 h-4 text-[#C9A24B]" />
              <span>{language === 'hu' ? 'Tovább az Utazás és Kezelés szakaszba' : 'Proceed to Travelling / In Treatment'}</span>
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* RECORD NEAK DECISION PANEL (Case Manager Only at Submitted Stage - PA) */}
      {/* =================================================================== */}
      {isCaseManager && caseItem.currentStage === 'Submitted' && caseItem.branch === 'PA' && (
        <RecordNeakDecisionPanel
          caseItem={caseItem}
          onSuccess={onCaseUpdated}
        />
      )}

      {/* =================================================================== */}
      {/* READ-ONLY BANNER FOR PATIENT ON STAGES THEY CANNOT ACT ON & CONGRATULATIONS */}
      {/* =================================================================== */}
      {isPatient && (
        <>
          {/* Congratulations Screen on NEAK Approval (Reimbursed) */}
          {caseItem.currentStage === 'Reimbursed' && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-400 text-emerald-950 space-y-4 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
                  🎉
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-emerald-950">
                    {language === 'hu' ? 'Gratulálunk! A NEAK jóváhagyta a költségtérítést' : 'Congratulations! NEAK Reimbursement Approved'}
                  </h3>
                  <p className="text-xs text-emerald-800">
                    {language === 'hu'
                      ? 'Az utólagos költségtérítési igényt a NEAK Nemzetközi Főosztálya jóváhagyta. A térítés kiutalása megtörtént.'
                      : 'Your post-treatment reimbursement claim under Directive 2011/24/EU has been approved and settled by NEAK.'}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/90 border border-emerald-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    {language === 'hu' ? 'Megtérített összeg' : 'Reimbursed Amount'}
                  </div>
                  <div className="text-2xl font-black text-emerald-700 mt-0.5">
                    {caseItem.reimbursementAmount || '480 000 Ft'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {language === 'hu' ? 'Magyar TB referenciaérték szerint' : 'Up to Hungarian domestic tariff ceiling'}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    {language === 'hu' ? 'Jóváírás / Döntés dátuma' : 'Settlement Date'}
                  </div>
                  <div className="text-sm font-bold text-slate-800 mt-1">
                    {caseItem.reimbursementDate || new Date().toISOString().split('T')[0]}
                  </div>
                  {caseItem.referenceNumber && (
                    <div className="text-[10px] text-slate-400 font-mono">
                      Ref: {caseItem.referenceNumber}
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    {language === 'hu' ? 'NEAK Határozat' : 'Official Decision Letter'}
                  </div>
                  <div className="text-xs font-semibold text-emerald-900 mt-1 flex items-center gap-1.5 truncate">
                    <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">{caseItem.decisionLetterName || 'NEAK_Koltsegteritesi_Hatarozat.pdf'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {caseItem.currentStage === 'Reviewed' && (
            <div className="p-5 rounded-2xl bg-amber-50/90 border-2 border-amber-300 text-amber-950 space-y-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0" />
                <h3 className="font-bold text-sm">
                  {language === 'hu' ? 'Szakértői jóváhagyás megtörtént' : 'Clinical Review Approved'}
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-amber-900">
                {caseItem.branch === 'NonPA'
                  ? (language === 'hu'
                      ? 'A szakértő jóváhagyta az ügyét. Az utólagos elszámolási úton (2011/24/EU irányelv) az utazás előtt nincs szükség NEAK-engedélyre vagy dokumentáció benyújtására. Esetmenedzserünk felveszi Önnel a kapcsolatot az utazás és a kezelés támogatásához.'
                      : 'Your advisor approved your case. Under the Standard treatment path (Directive 2011/24/EU), no documentation or approval from NEAK is needed before travel. You can proceed directly to travel and treatment abroad with our case manager and on-site chaperone support.')
                  : (language === 'hu'
                      ? 'A szakértő jóváhagyta az ügyét. Esetmenedzserünk felveszi Önnel a kapcsolatot az aláírás begyűjtése és a NEAK-hoz történő benyújtás érdekében.'
                      : 'Your advisor approved your case. Our case manager will contact you to collect your signature and send your application to NEAK.')}
              </p>
              {caseItem.branch === 'PA' && (
                <div className="pt-1 flex items-center gap-3">
                  <button
                    onClick={() => handleDownload('NEAK_Application_For_Signing.txt', caseItem.fullDocument)}
                    className="px-4 py-2 bg-[#1E2761] hover:bg-[#151B45] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#C9A24B]" />
                    <span>{language === 'hu' ? 'Kérelem letöltése aláíráshoz' : 'Download form for signing'}</span>
                  </button>
                  <span className="text-[11px] text-amber-800">
                    {language === 'hu' ? '(A postai feladást a menedzser végzi)' : '(Official dispatch handled by case manager)'}
                  </span>
                </div>
              )}
            </div>
          )}

          {caseItem.currentStage === 'Submitted' && caseItem.branch === 'PA' && (
            <div className="p-5 rounded-2xl bg-blue-50/90 border border-blue-200 text-blue-950 space-y-2 shadow-xs">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-700" />
                <h3 className="font-bold text-sm">
                  {language === 'hu' ? 'Kérelme a NEAK-nál van' : 'Application with NEAK'}
                </h3>
              </div>
              <p className="text-xs text-blue-900 leading-relaxed font-medium">
                {language === 'hu'
                  ? 'Kérelme a NEAK-nál van. Esetmenedzserünk nyomon követi az ügyet, és amint döntés születik, értesíti Önt.'
                  : 'Your application is with NEAK. Our case manager is following up and will update you as soon as there is a decision.'}
              </p>
              {caseItem.dispatchInfo?.dateSent && (
                <div className="text-[11px] text-blue-800 font-mono pt-1">
                  {language === 'hu'
                    ? `Feladva ajánlott küldeményként: ${caseItem.dispatchInfo.dateSent}, ragszám: ${caseItem.dispatchInfo.trackingNumber}`
                    : `Sent by registered mail on ${caseItem.dispatchInfo.dateSent}, tracking ${caseItem.dispatchInfo.trackingNumber}`}
                </div>
              )}
            </div>
          )}

          {caseItem.currentStage === 'Authorised' && (
            <div className="p-5 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-950 space-y-2 shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-sm">
                  {language === 'hu' ? 'A NEAK engedélyezte a kezelést' : 'NEAK Authorised Treatment'}
                </h3>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                {language === 'hu'
                  ? 'A NEAK engedélyezte a kezelést. Esetmenedzserünk hamarosan egyezteti Önnel az utazási részleteket.'
                  : 'NEAK has authorised your treatment. Your case manager will confirm your travel details.'}
              </p>
              {caseItem.travelSupportDecision === 'granted' && (
                <div className="p-2.5 rounded-lg bg-white/80 border border-emerald-300 text-xs font-semibold text-emerald-950 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-[#C9A24B]" />
                  <span>
                    {caseItem.travelSupportPaid
                      ? (language === 'hu'
                          ? `Utazási támogatás (${caseItem.travelSupportPaidAmount || caseItem.travelSupportAmount}) utazás előtt kifizetve`
                          : `Travel support of ${caseItem.travelSupportPaidAmount || caseItem.travelSupportAmount} paid before travel`)
                      : (language === 'hu'
                          ? `Megítélt utazási támogatás: ${caseItem.travelSupportAmount} (${caseItem.travelSupportTiming === 'before_travel' ? 'utazás előtt folyósítandó' : 'utólagos elszámolás'})`
                          : `Travel support granted: ${caseItem.travelSupportAmount} (${caseItem.travelSupportTiming === 'before_travel' ? 'disbursed before travel' : 'after travel'})`)}
                  </span>
                </div>
              )}
            </div>
          )}

          {isRejected && (
            <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-2 shadow-xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-700" />
                <h3 className="font-bold text-sm">
                  {language === 'hu' ? 'A NEAK nem engedélyezte a kérelmet' : 'NEAK Refused Request'}
                </h3>
              </div>
              <p className="text-xs text-rose-900 leading-relaxed font-medium">
                {language === 'hu'
                  ? 'A NEAK nem engedélyezte a kérelmet. Ismertetjük a lehetőségeit, beleértve a jogorvoslatot is.'
                  : 'NEAK has not authorised this request. We will explain your options, including an appeal.'}
              </p>
            </div>
          )}

          {caseItem.currentStage === 'Treated' && caseItem.branch === 'PA' && (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 space-y-2 shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm">
                  {language === 'hu' ? 'Kezelés befejezve — Hivatalos elszámolás folyamatban' : 'Treatment Complete — Institutional Settlement in Progress'}
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'hu'
                  ? 'A külföldi ellátás megtörtént. Esetmenedzserünk közvetlenül intézi a NEAK és a partnerklinika közötti számlaelszámolást.'
                  : 'Treatment successfully completed abroad. Our case manager is coordinating direct settlement between NEAK and the clinic.'}
              </p>
            </div>
          )}

          {/* DIRECTIVE PATH AFTER TREATED: Patient View (Checklist & Calm Read-Only Messaging) */}
          {caseItem.currentStage === 'Treated' && caseItem.branch === 'NonPA' && (
            <div className="space-y-4">
              {/* Once mailed: Calm read-only banner */}
              {caseItem.claimReviewStatus === 'submitted_to_neak' ? (
                <div className="p-5 rounded-2xl bg-blue-50/90 border border-blue-200 text-blue-950 space-y-2 shadow-xs">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-blue-700" />
                    <h3 className="font-bold text-sm">
                      {language === 'hu' ? 'Költségtérítési igényét elküldtük a NEAK-nak' : 'Reimbursement Claim Dispatched to NEAK'}
                    </h3>
                  </div>
                  <p className="text-xs text-blue-900 leading-relaxed font-medium">
                    {language === 'hu'
                      ? `Költségtérítési igényét a NEAK-nak elküldtük ${caseItem.claimDispatchInfo?.dateSent || ''} napon. Amint döntés születik, azonnal értesítjük.`
                      : `Your claim was sent to NEAK on ${caseItem.claimDispatchInfo?.dateSent || 'record'}. We'll update you as soon as there's a decision.`}
                  </p>
                  {caseItem.claimDispatchInfo?.trackingNumber && (
                    <div className="text-[11px] text-blue-800 font-mono pt-1">
                      {language === 'hu'
                        ? `Feladva ajánlott küldeményként: ${caseItem.claimDispatchInfo.dateSent}, ragszám: ${caseItem.claimDispatchInfo.trackingNumber}`
                        : `Sent by registered mail on ${caseItem.claimDispatchInfo.dateSent}, tracking ${caseItem.claimDispatchInfo.trackingNumber}`}
                    </div>
                  )}
                </div>
              ) : caseItem.claimReviewStatus === 'needs_more' ? (
                /* Case manager requested more from patient */
                <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 space-y-2 shadow-xs">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <h3 className="font-bold text-sm">
                      {language === 'hu' ? 'Esetmenedzseri kérés: További dokumentum szükséges' : 'Needs More From Patient'}
                    </h3>
                  </div>
                  <div className="text-xs text-amber-950 p-3 bg-white/80 rounded-xl border border-amber-200 font-medium leading-relaxed">
                    &ldquo;{caseItem.claimNeedsMoreMessage}&rdquo;
                  </div>
                  <p className="text-[11px] text-amber-800">
                    {language === 'hu'
                      ? 'Kérjük, töltse fel a hiányzó iratot az alábbi jegyzékbe, hogy elindíthassuk a NEAK-költségtérítést.'
                      : 'Please upload the requested document below so we can finalize and dispatch your reimbursement claim.'}
                  </p>
                </div>
              ) : (caseItem.claimSlots?.paidInvoice || caseItem.claimReviewStatus === 'ready_to_prepare' || caseItem.claimReviewStatus === 'complete') ? (
                /* Calm message while preparing or reviewing */
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 space-y-2 shadow-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#1E2761]" />
                    <h3 className="font-bold text-sm text-[#1E2761]">
                      {language === 'hu' ? 'Előkészítjük a költségtérítési kérelmét' : "We're preparing your reimbursement claim"}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {language === 'hu'
                      ? 'Esetmenedzserünk ellenőrzi a feltöltött bizonylatokat és elkészíti a hivatalos NEAK fedőlapot a 2011/24/EU irányelv alapján.'
                      : 'Our case manager is compiling the official Directive 2011/24/EU cover sheet and reviewing your uploaded invoices.'}
                  </p>
                </div>
              ) : null}

              {/* Patient-facing required upload checklist */}
              <div className="p-6 rounded-2xl bg-white border-2 border-[#1E2761]/20 space-y-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#1E2761] flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-[#C9A24B]" />
                      <span>
                        {language === 'hu'
                          ? 'Kötelező költségtérítési iratjegyzék (2011/24/EU Irányelv)'
                          : 'Required Claim Documentation Checklist'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {language === 'hu'
                        ? 'A kezelés befejezése után töltse fel a kórházi számlákat és a zárójelentést az utólagos NEAK-megtérítéshez.'
                        : 'Upload your hospital invoices and discharge papers. Each document has a dedicated slot below.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-3 py-1 rounded-full font-bold border ${
                      CLAIM_SLOTS_DEF.filter((s) => Boolean(caseItem.claimSlots?.[s.key]?.fileName)).length >= 1
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}>
                      {language === 'hu'
                        ? `${CLAIM_SLOTS_DEF.filter((s) => Boolean(caseItem.claimSlots?.[s.key]?.fileName)).length} / 4 dokumentum feltöltve`
                        : `${CLAIM_SLOTS_DEF.filter((s) => Boolean(caseItem.claimSlots?.[s.key]?.fileName)).length} of 4 documents uploaded`}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                    <span>{language === 'hu' ? 'Ellenőrzőlista előrehaladás' : 'Checklist progress'}</span>
                    <span>
                      {Math.round(
                        (CLAIM_SLOTS_DEF.filter((s) => Boolean(caseItem.claimSlots?.[s.key]?.fileName)).length / 4) * 100
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          (CLAIM_SLOTS_DEF.filter((s) => Boolean(caseItem.claimSlots?.[s.key]?.fileName)).length / 4) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {claimActionError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                    {claimActionError}
                  </div>
                )}

                {/* 4 Dedicated Upload Slots */}
                <div className="space-y-3">
                  {CLAIM_SLOTS_DEF.map((slot) => {
                    const slotData = caseItem.claimSlots?.[slot.key];
                    const isUploaded = Boolean(slotData?.fileName);
                    const isUploadingThis = uploadingSlotKey === slot.key;

                    return (
                      <div
                        key={slot.key}
                        className={`p-4 rounded-xl border transition-all ${
                          isUploaded
                            ? 'bg-emerald-50/40 border-emerald-200'
                            : slot.required
                            ? 'bg-amber-50/30 border-amber-200'
                            : 'bg-slate-50/70 border-slate-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">
                                {language === 'hu' ? slot.titleHu : slot.titleEn}
                              </span>
                              {slot.required ? (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                  {language === 'hu' ? 'Kötelező' : 'Required'}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500 font-medium">
                                  {language === 'hu' ? 'Opcionális / Szükség esetén' : 'If applicable'}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500">
                              {language === 'hu' ? slot.descHu : slot.descEn}
                            </p>

                            {slotData?.fileName && (
                              <div className="flex items-center gap-2 pt-1 text-xs text-emerald-900 font-semibold truncate">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span className="font-mono truncate">{slotData.fileName}</span>
                                {slotData.uploadedAt && (
                                  <span className="text-[10px] text-slate-400 font-normal">
                                    · {new Date(slotData.uploadedAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Upload Actions (read-only once mailed to NEAK) */}
                          {caseItem.claimReviewStatus !== 'submitted_to_neak' ? (
                            <div className="flex items-center gap-2 shrink-0">
                              <label className="px-3 py-1.5 text-xs bg-white hover:bg-slate-50 text-[#1E2761] border border-slate-300 rounded-lg font-semibold cursor-pointer shadow-2xs flex items-center gap-1.5 transition-colors">
                                <Upload className="w-3.5 h-3.5 text-[#C9A24B]" />
                                <span>
                                  {isUploadingThis
                                    ? 'Uploading...'
                                    : isUploaded
                                    ? (language === 'hu' ? 'Csere' : 'Replace')
                                    : (language === 'hu' ? 'Tallózás' : 'Browse')}
                                </span>
                                <input
                                  type="file"
                                  className="hidden"
                                  disabled={isUploadingThis}
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                      handleUploadSlot(slot.key, e.target.files[0].name);
                                    }
                                  }}
                                />
                              </label>

                              {!isUploaded && (
                                <button
                                  type="button"
                                  disabled={isUploadingThis}
                                  onClick={() => handleUploadSlot(slot.key, slot.presetFileName)}
                                  className="px-2.5 py-1.5 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 cursor-pointer font-medium transition-colors"
                                  title="Upload realistic sample document"
                                >
                                  {language === 'hu' ? 'Minta' : 'Sample'}
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs font-semibold text-emerald-800 bg-white px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{language === 'hu' ? 'Csatolva' : 'Attached'}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* =================================================================== */}
      {/* DIRECTIVE PATH: Case Manager Claim Review & Dispatch Checklist */}
      {/* =================================================================== */}
      {isCaseManager && caseItem.currentStage === 'Treated' && caseItem.branch === 'NonPA' && (
        <div className="space-y-5">
          {/* Internal Claim Status Header */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-[#1E2761] uppercase tracking-wider flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-[#C9A24B]" />
                    <span>{language === 'hu' ? 'Költségtérítési eljárás ellenőrzése' : 'Reimbursement Claim Review & Cover Sheet'}</span>
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                    {language === 'hu' ? 'Esetmenedzser' : 'Case Manager'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {language === 'hu'
                    ? 'Ellenőrizze a beteg által feltöltött számlákat, generálja a kérelem fedőlapot, és készítse elő a postai feladást.'
                    : 'Review patient-uploaded invoices, verify generated claim cover sheet, and advance through registered mail dispatch.'}
                </p>
              </div>

              {/* Status Badge */}
              <div>
                {caseItem.claimReviewStatus === 'submitted_to_neak' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs">
                    <Send className="w-3.5 h-3.5" />
                    <span>{language === 'hu' ? 'NEAK-hoz benyújtva (Postázva)' : 'Submitted to NEAK'}</span>
                  </span>
                ) : caseItem.claimReviewStatus === 'complete' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{language === 'hu' ? 'Ellenőrizve — Feladásra kész' : 'Verified Complete — Ready to Dispatch'}</span>
                  </span>
                ) : caseItem.claimReviewStatus === 'needs_more' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-xs">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{language === 'hu' ? 'Kiegészítésre vár a betegtől' : 'Needs More From Patient'}</span>
                  </span>
                ) : (caseItem.claimSlots?.paidInvoice || caseItem.claimReviewStatus === 'ready_to_prepare') ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-xs animate-pulse">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>{language === 'hu' ? 'Költségtérítés előkészítésére kész' : 'Ready to prepare claim'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs border border-slate-300">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{language === 'hu' ? 'Számlafeltöltésre vár' : 'Awaiting Patient Uploads'}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Uploaded Documents Grid */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-800">
                {language === 'hu' ? 'Feltöltött iratok áttekintése:' : 'Uploaded Document Slots:'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CLAIM_SLOTS_DEF.map((slot) => {
                  const itemSlot = caseItem.claimSlots?.[slot.key];
                  const hasFile = Boolean(itemSlot?.fileName);

                  return (
                    <div
                      key={slot.key}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                        hasFile ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="truncate mr-2">
                        <div className="font-semibold text-slate-800 truncate">
                          {language === 'hu' ? slot.titleHu : slot.titleEn}
                        </div>
                        <div className="text-[11px] font-mono truncate text-slate-600">
                          {hasFile && itemSlot ? itemSlot.fileName : (language === 'hu' ? 'Nincs csatolva' : 'Not uploaded')}
                        </div>
                      </div>
                      {hasFile ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          {slot.required ? (language === 'hu' ? 'Hiányzik' : 'Missing') : '—'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Generated Cover Sheet Section */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/60">
              <div className="p-3.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#1E2761]" />
                  <span className="text-xs font-bold text-slate-900">
                    {language === 'hu' ? 'Generált Költségtérítési Kérelem Fedőlap' : 'Generated Reimbursement Claim Cover Sheet'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(caseItem.claimCoverSheet || getClaimCoverSheetText(caseItem, matchedClinic), 'main')}
                    className="px-2.5 py-1 text-[11px] bg-white border border-slate-300 rounded hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </button>
                  <button
                    onClick={() => handleDownload('NEAK_Reimbursement_Claim_Cover_Sheet.txt', caseItem.claimCoverSheet || getClaimCoverSheetText(caseItem, matchedClinic))}
                    className="px-2.5 py-1 text-[11px] bg-white border border-slate-300 rounded hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => setShowCoverSheetPreview((prev) => !prev)}
                    className="px-2.5 py-1 text-[11px] text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                  >
                    {showCoverSheetPreview ? (language === 'hu' ? 'Összecsukás' : 'Hide') : (language === 'hu' ? 'Megtekintés' : 'Preview')}
                  </button>
                </div>
              </div>

              {showCoverSheetPreview && (
                <div className="p-4 bg-white font-mono text-[11px] text-slate-800 leading-relaxed whitespace-pre-line border-t border-slate-200 max-h-64 overflow-y-auto">
                  {caseItem.claimCoverSheet || getClaimCoverSheetText(caseItem, matchedClinic)}
                </div>
              )}
            </div>

            {/* Case Manager Actions (if not yet dispatched) */}
            {caseItem.claimReviewStatus !== 'submitted_to_neak' && (
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  {caseItem.claimReviewStatus === 'complete'
                    ? (language === 'hu' ? 'Az iratok jóváhagyva. Töltse ki az alábbi feladási ellenőrzőlistát.' : 'Documents marked complete. Fill out the dispatch checklist below.')
                    : (language === 'hu' ? 'Jelölje az iratokat hiánytalannak a postai feladás feloldásához, vagy kérjen hiánypótlást.' : 'Mark documents complete to unlock registered mail dispatch, or request more information from patient.')}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {caseItem.claimReviewStatus !== 'complete' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowNeedsMoreForm((prev) => !prev)}
                        className="px-3.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        {language === 'hu' ? 'Hiánypótlás kérése' : 'Needs more from patient'}
                      </button>

                      <button
                        type="button"
                        disabled={!caseItem.claimSlots?.paidInvoice || reviewingClaim}
                        onClick={handleMarkClaimComplete}
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {reviewingClaim
                            ? 'Saving...'
                            : (language === 'hu' ? 'Iratok hiánytalanok (Complete)' : 'Mark Documents Complete')}
                        </span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowNeedsMoreForm(true)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg cursor-pointer"
                    >
                      {language === 'hu' ? 'Módosítás / Újbóli hiánypótlás' : 'Re-open Review'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Needs More From Patient Form */}
            {showNeedsMoreForm && (
              <form onSubmit={handleRequestMoreClaimInfo} className="p-4 bg-amber-50/70 border border-amber-300 rounded-xl space-y-3">
                <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>{language === 'hu' ? 'Hiánypótlási üzenet a betegnek' : 'Message to Patient (What is Missing)'}</span>
                </div>
                <textarea
                  rows={2}
                  required
                  value={claimNeedsMoreText}
                  onChange={(e) => setClaimNeedsMoreText(e.target.value)}
                  placeholder={language === 'hu' ? 'pl. Kérjük, töltse fel a kórházi zárójelentést és a számla hiteles fordítását...' : 'e.g. Please upload the discharge summary and translated invoice...'}
                  className="w-full px-3 py-2 text-xs border border-amber-300 rounded-lg bg-white"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNeedsMoreForm(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reviewingClaim || !claimNeedsMoreText.trim()}
                    className="px-4 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg cursor-pointer transition-colors shadow-xs"
                  >
                    {reviewingClaim ? 'Sending...' : (language === 'hu' ? 'Üzenet küldése a betegnek' : 'Send to Patient')}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Reusing existing Dispatch Checklist once marked complete */}
          {caseItem.claimReviewStatus === 'complete' && (
            <DispatchChecklist
              caseItem={caseItem}
              isClaimDispatch={true}
              onSuccess={onCaseUpdated}
            />
          )}

          {/* If already submitted to NEAK: Internal claim status banner & NEAK Decision Panel */}
          {caseItem.claimReviewStatus === 'submitted_to_neak' && (
            <div className="space-y-4">
              <div className="p-5 bg-blue-50/80 border border-blue-200 rounded-2xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-950 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-700" />
                    <span>{language === 'hu' ? 'Belső eljárási státusz: Költségtérítési igény a NEAK-nál' : 'Internal Claim Status: Submitted to NEAK'}</span>
                  </span>
                  <span className="font-mono text-blue-800 text-[11px]">
                    Ref: {caseItem.claimDispatchInfo?.trackingNumber}
                  </span>
                </div>
                <p className="text-blue-900 leading-relaxed">
                  {language === 'hu'
                    ? `Ajánlott küldemény feladva: ${caseItem.claimDispatchInfo?.dateSent}. A páciens felé a státusz "Kezelve" marad a döntésig. Rögzítse a NEAK határozatát a lenti panelen.`
                    : `Mailed by registered mail on ${caseItem.claimDispatchInfo?.dateSent}. Patient-facing stage stays "Treated" until decision comes back. Use the panel below to record NEAK's outcome.`}
                </p>
              </div>

              <RecordNeakDecisionPanel
                caseItem={caseItem}
                onSuccess={onCaseUpdated}
              />
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* MAIN TWO-COLUMN WORKSPACE: Left Docs & AI, Right Case Info & Audit */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Reasoning Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C9A24B]" />
                <h3 className="text-xs font-bold text-[#1E2761] uppercase tracking-wider">
                  AI Eligibility Engine Analysis
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Gemini 3.8 Flash</span>
            </div>

            <div className="text-xs text-slate-700 leading-relaxed p-3.5 rounded-lg bg-slate-50 border border-slate-100">
              {caseItem.aiReasoning}
            </div>

            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                Deterministic rules dictate pathway classification. AI reasons over clinical delay and crafts formal documents without inventing medical facts.
              </span>
            </div>
          </div>

          {/* Generated Documents Viewer */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Document Header & Tabs */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#1E2761]" />
                <span className="text-xs font-bold text-slate-900">
                  Official Filings & Documents
                </span>
              </div>

              {/* Tabs for multiple documents */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveDocTab('main')}
                  className={`px-3 py-1 text-xs rounded-md font-medium cursor-pointer ${
                    activeDocTab === 'main'
                      ? 'bg-white text-[#1E2761] shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {caseItem.branch === 'PA' ? 'S2 Request' : 'Reimbursement Claim'}
                </button>

                {caseItem.branch === 'NonPA' && (
                  <button
                    onClick={() => {
                      if (!caseItem.article9_5Document) {
                        handleGenerateArticle95();
                      } else {
                        setActiveDocTab('art9');
                      }
                    }}
                    className={`px-3 py-1 text-xs rounded-md font-medium cursor-pointer ${
                      activeDocTab === 'art9'
                        ? 'bg-white text-[#1E2761] shadow-sm border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Article 9(5) Pre-Notice
                  </button>
                )}

                {(isRejected || isSolvit || caseItem.solvitDocument) && (
                  <button
                    onClick={() => setActiveDocTab('solvit')}
                    className={`px-3 py-1 text-xs rounded-md font-medium cursor-pointer ${
                      activeDocTab === 'solvit'
                        ? 'bg-white text-purple-900 shadow-sm border border-purple-200'
                        : 'text-purple-700 hover:text-purple-900'
                    }`}
                  >
                    SOLVIT Appeal Brief
                  </button>
                )}
              </div>
            </div>

            {/* Document Body */}
            <div className="p-6 space-y-4">
              {activeDocTab === 'main' && (
                <>
                  {!isReviewed ? (
                    <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl space-y-3">
                      <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-900 mx-auto flex items-center justify-center">
                        <Lock className="w-6 h-6 text-amber-700" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-800">
                          Official NEAK Application Documents Locked
                        </h4>
                        <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                          {caseItem.currentStage === 'Awaiting Advisor Review'
                            ? "Your case has been sent to a CuraLink medical advisor for clinical review. You don't need to visit your own doctor. Document generation and official NEAK submission will unlock automatically upon advisor clinical approval."
                            : caseItem.currentStage === 'More Info Requested'
                            ? `The medical advisor requested additional information: "${caseItem.moreInfoMessage}". Documents will unlock once clinical review is approved.`
                            : 'Document generation and submission remain locked until clinical justification is reviewed and approved by a licensed Medical Advisor.'}
                        </p>
                      </div>
                      {currentUser?.role === 'advisor' && (
                        <button
                          onClick={() => setShowAdvisorModal(true)}
                          className="mt-2 px-4 py-2 bg-[#1E2761] hover:bg-[#151B45] text-white text-xs font-bold rounded-lg cursor-pointer inline-flex items-center gap-2 shadow-xs"
                        >
                          <Stethoscope className="w-3.5 h-3.5 text-[#C9A24B]" />
                          <span>Review Case & Clinical Decision</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            {caseItem.documentTitle}
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Pre-filled formal application for NEAK International Affairs Department.
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopy(caseItem.fullDocument, 'main')}
                            className="px-2.5 py-1 text-xs border border-slate-300 rounded hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                          >
                            {copiedDoc ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedDoc ? 'Copied' : 'Copy'}</span>
                          </button>
                          <button
                            onClick={() => handleDownload('NEAK_Official_Application.txt', caseItem.fullDocument)}
                            className="px-2.5 py-1 text-xs border border-slate-300 rounded hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>

                      {/* Treating Doctor & Clinical Attestation Endorsement Callout */}
                      {caseItem.doctorName && (
                        <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs space-y-1 shadow-2xs">
                          <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Treating Physician / Medical Advisor Attestation</span>
                          </div>
                          <div className="text-emerald-950 font-medium">
                            {caseItem.doctorName} · MOK: <span className="font-mono">{caseItem.doctorLicense || 'Verified'}</span>
                          </div>
                          {(caseItem.advisorClinicalJustification || caseItem.advisorNotes) && (
                            <p className="text-[11px] text-emerald-800 italic pt-1 border-t border-emerald-200/60">
                              &ldquo;{caseItem.advisorClinicalJustification || caseItem.advisorNotes}&rdquo;
                            </p>
                          )}
                        </div>
                      )}

                      <div className="font-serif bg-slate-50/70 border border-slate-200 p-6 rounded-lg text-xs leading-relaxed text-slate-800 whitespace-pre-line shadow-inner max-h-96 overflow-y-auto">
                        {caseItem.fullDocument}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Article 9(5) Tab */}
              {activeDocTab === 'art9' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Article 9(5) Tariff Inquiry Letter
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Formal written request to NEAK confirming the exact domestic reimbursement ceiling.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(caseItem.article9_5Document || '', 'art9')}
                        className="px-2.5 py-1 text-xs border border-slate-300 rounded hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedArt9 ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedArt9 ? 'Copied' : 'Copy'}</span>
                      </button>
                      <button
                        onClick={() => handleDownload('Article_9_5_Tariff_Request.txt', caseItem.article9_5Document || '')}
                        className="px-2.5 py-1 text-xs border border-slate-300 rounded hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>

                  <div className="font-serif bg-slate-50/70 border border-slate-200 p-6 rounded-lg text-xs leading-relaxed text-slate-800 whitespace-pre-line shadow-inner max-h-96 overflow-y-auto">
                    {caseItem.article9_5Document || 'Drafting Article 9(5) voluntary notification...'}
                  </div>

                  <div className="text-xs text-slate-600 p-3 bg-slate-100 rounded-lg">
                    <strong>Why this matters: </strong>
                    Article 9(5) of Directive 2011/24/EU permits patients to request written confirmation of the maximum domestic reimbursement amount prior to traveling. It eliminates financial surprises.
                  </div>
                </div>
              )}

              {/* SOLVIT Appeal Tab */}
              {activeDocTab === 'solvit' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h4 className="text-sm font-bold text-purple-950 flex items-center gap-1.5">
                        <Scale className="w-4 h-4 text-purple-700" />
                        <span>SOLVIT Cross-Border Complaint & Dispute Brief</span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Official dispute resolution brief for the European Commission SOLVIT network.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(caseItem.solvitDocument || '', 'solvit')}
                        className="px-2.5 py-1 text-xs border border-slate-300 rounded hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedSolvit ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSolvit ? 'Copied' : 'Copy'}</span>
                      </button>
                      <button
                        onClick={() => handleDownload('SOLVIT_Complaint_Brief.txt', caseItem.solvitDocument || '')}
                        className="px-2.5 py-1 text-xs border border-slate-300 rounded hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Brief</span>
                      </button>
                    </div>
                  </div>

                  <div className="font-serif bg-purple-50/50 border border-purple-200 p-6 rounded-lg text-xs leading-relaxed text-slate-800 whitespace-pre-line shadow-inner max-h-96 overflow-y-auto">
                    {caseItem.solvitDocument || 'Generating SOLVIT cross-border complaint brief...'}
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                    <div className="font-semibold text-slate-900">
                      SOLVIT Submission Procedure:
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      This formal brief is filed directly at the European Commission&apos;s SOLVIT portal (ec.europa.eu/solvit). SOLVIT acts as a free, informal dispute resolution network where national authorities must resolve misapplications of EU cross-border patient rights within 10 weeks.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col) */}
        <div className="space-y-6">
          {/* Evidence Verification Layers */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#1E2761] uppercase tracking-wider">
                Verification Layers (3 Steps)
              </h3>
              <button
                onClick={() => setShowEvidenceWizard(true)}
                className="text-[11px] text-[#1E2761] font-semibold hover:underline cursor-pointer"
              >
                Launch 4-Step Wizard →
              </button>
            </div>

            {/* Layer 1: Structural Check */}
            <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span>1. Structural Check</span>
                <span className="text-emerald-700 flex items-center gap-1 text-[11px]">
                  <Check className="w-3.5 h-3.5" /> Automatable Passed
                </span>
              </div>
              <ul className="text-[11px] text-slate-600 space-y-0.5 list-disc list-inside">
                {caseItem.verification.structuralCheck.details.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>

            {/* Layer 2: MOK Source Verification */}
            <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span>2. Chamber Source Registry</span>
                <span className="text-emerald-700 flex items-center gap-1 text-[11px]">
                  <Check className="w-3.5 h-3.5" /> MOK Match
                </span>
              </div>
              <div className="text-[11px] text-slate-600 space-y-0.5">
                <div>Doctor: <strong>{caseItem.verification.mokVerification.doctorName || caseItem.doctorName}</strong></div>
                <div>License: <strong className="font-mono">{caseItem.verification.mokVerification.licenseNumber || caseItem.doctorLicense}</strong></div>
                {caseItem.verification.mokVerification.specialty && (
                  <div className="text-slate-500">{caseItem.verification.mokVerification.specialty}</div>
                )}
              </div>
            </div>

            {/* Layer 3: Human Advisor Review Gate */}
            <div
              className={`space-y-2 p-3 rounded-lg border text-xs ${
                caseItem.verification.clinicalJudgment.status === 'attested'
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50/70 border-amber-200 text-amber-950'
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span>3. Human Clinical Gate</span>
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded font-semibold ${
                    caseItem.verification.clinicalJudgment.status === 'attested'
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {caseItem.verification.clinicalJudgment.status === 'attested'
                    ? 'Attested by Human'
                    : 'Human Review Required'}
                </span>
              </div>

              <p className="text-[11px] leading-relaxed">
                {caseItem.verification.clinicalJudgment.notes ||
                  'Clinical justification cannot be automated. Only a human healthcare advisor attests to medical necessity.'}
              </p>

              {caseItem.verification.clinicalJudgment.advisorName && (
                <div className="text-[11px] font-semibold text-slate-700 pt-1 border-t border-slate-200/50">
                  Advisor: {caseItem.verification.clinicalJudgment.advisorName}
                </div>
              )}
            </div>
          </div>

          {/* Matched Target Clinic Card */}
          {matchedClinic && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#1E2761] uppercase tracking-wider">
                  Target Clinic Partner
                </h3>
                <span className="text-[11px] text-slate-500">{matchedClinic.country}</span>
              </div>

              <div>
                <h4 className="font-bold text-sm text-slate-900">{matchedClinic.name}</h4>
                <div className="text-xs text-slate-500">{matchedClinic.address}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1.5 border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Wait Time:</span>
                  <span className="font-semibold text-emerald-700">~{matchedClinic.averageWaitDays} days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Coverage:</span>
                  <span className="font-semibold text-slate-800">
                    {matchedClinic.providerType === 'public' ? '100% S2 Public Voucher' : 'Directive Domestic Cap'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                  {matchedClinic.coverageNote}
                </div>
              </div>

              <div className="text-[11px] text-slate-500">
                Phone: {matchedClinic.phone} · Languages: {matchedClinic.languages.join(', ')}
              </div>
            </div>
          )}

          {/* Permanent Audit Log / History Array */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#1E2761] uppercase tracking-wider">
                Permanent Procedural Log
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                {caseItem.history.length} Events
              </span>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {caseItem.history.map((h) => (
                <div
                  key={h.id}
                  className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-semibold text-slate-900">
                    <span>{h.title}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {h.note}
                  </p>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
                    <span>Author: {h.author}</span>
                    <span>{new Date(h.timestamp).toLocaleDateString('hu-HU')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* MODALS */}
      {/* =================================================================== */}

      {/* Evidence Gate Wizard */}
      {showEvidenceWizard && (
        <EvidenceGateWizard
          caseItem={caseItem}
          onClose={() => setShowEvidenceWizard(false)}
          onSuccess={(updated) => {
            onCaseUpdated(updated);
            setShowEvidenceWizard(false);
          }}
        />
      )}

      {/* Upload Document from Abroad Modal (Patient) */}
      {showUploadAbroadModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-[#1E2761]" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {t('support.uploadAbroadBtn')}
                </h3>
              </div>
              <button
                onClick={() => setShowUploadAbroadModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {t('support.uploadAbroadDesc')}
            </p>

            <form onSubmit={handleUploadAbroadDocument} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Type
                </label>
                <select
                  value={abroadDocType}
                  onChange={(e) => setAbroadDocType(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Discharge Summary">Hospital Discharge Summary (Zárójelentés)</option>
                  <option value="Itemized Invoice">Itemized Treatment Invoice (Kórházi számla)</option>
                  <option value="Proof of Payment">Proof of Payment / Bank Confirmation</option>
                  <option value="Prescription">Cross-Border Prescription / Follow-up Protocol</option>
                  <option value="Other">Other Clinical Document</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document File Name
                </label>
                <div className="border border-dashed border-slate-300 rounded-lg p-3 bg-slate-50 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-700 truncate">{abroadDocName}</span>
                  <label className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded hover:bg-slate-100 cursor-pointer text-slate-700">
                    Browse
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setAbroadDocName(e.target.files[0].name);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadAbroadModal(false)}
                  className="px-4 py-2 text-xs border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingAbroad}
                  className="px-5 py-2 text-xs font-bold bg-[#1E2761] text-white rounded-lg hover:bg-[#151B45] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {uploadingAbroad ? 'Uploading...' : 'Save Document to Case'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Advisor Review Modal */}
      {showAdvisorModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-[#C9A24B]" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Medical Advisor Clinical Review Desk
                </h3>
              </div>
              <button
                onClick={() => setShowAdvisorModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {advisorReviewError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{advisorReviewError}</span>
              </div>
            )}

            {/* Patient & Proof Summary */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{caseItem.patientName}</span>
                <span className="font-mono text-slate-500">{caseItem.tajNumber}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>{caseItem.procedure}</span>
                <span className="text-rose-700 font-semibold">{caseItem.monthsWaited} months waited</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-slate-600">
                <span>EESZT Waitlist Record:</span>
                <span className="font-mono text-[#1E2761] font-semibold truncate max-w-[200px]">
                  {caseItem.eesztDocumentName || 'EESZT_Elektronikus_Kivonat.pdf'}
                </span>
              </div>
            </div>

            <form onSubmit={handleAdvisorReview} className="space-y-4">
              {/* 3 Action Buttons */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Clinical Action Decision <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdvisorAction('approve')}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 text-xs ${
                      advisorAction === 'approve'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </span>
                      {advisorAction === 'approve' && <span className="w-2 h-2 rounded-full bg-emerald-600" />}
                    </div>
                    <span className="text-[10px] text-slate-500 leading-tight">Sets to Reviewed; ready for case manager dispatch</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdvisorAction('request_info')}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 text-xs ${
                      advisorAction === 'request_info'
                        ? 'border-amber-600 bg-amber-50 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-700">Request Info</span>
                      {advisorAction === 'request_info' && <span className="w-2 h-2 rounded-full bg-amber-600" />}
                    </div>
                    <span className="text-[10px] text-slate-500 leading-tight">Returns to patient with inquiry</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdvisorAction('reject')}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 text-xs ${
                      advisorAction === 'reject'
                        ? 'border-rose-600 bg-rose-50 text-rose-950 ring-2 ring-rose-500/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-700">Reject</span>
                      {advisorAction === 'reject' && <span className="w-2 h-2 rounded-full bg-rose-600" />}
                    </div>
                    <span className="text-[10px] text-slate-500 leading-tight">Wait clinically justifiable</span>
                  </button>
                </div>
              </div>

              {/* Clinical Justification Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinical Justification Note (Medically Justifiable Evaluation) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={advisorClinicalJustification}
                  onChange={(e) => setAdvisorClinicalJustification(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E2761] leading-relaxed font-sans"
                  placeholder="State whether the wait is medically justifiable for this condition..."
                />
              </div>

              {advisorAction !== 'approve' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {advisorAction === 'request_info' ? 'Message to Patient (What Info is Needed)' : 'Rejection Medical Reason (Shown to Patient)'} <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={advisorCustomReason}
                    onChange={(e) => setAdvisorCustomReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-amber-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans"
                    placeholder={advisorAction === 'request_info' ? 'Specify diagnostic reports or clinic notes required...' : 'Detail why the domestic wait is medically acceptable...'}
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdvisorModal(false)}
                  className="px-4 py-2 text-xs border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewing}
                  className="px-5 py-2 text-xs font-bold bg-[#1E2761] text-white rounded-lg hover:bg-[#151B45] transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {reviewing ? 'Recording Decision...' : 'Submit Clinical Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Case Manager NEAK Decision / Follow-up Modal (Requirement 2) */}
      {showFollowUpModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <RecordNeakDecisionPanel
              caseItem={caseItem}
              onSuccess={(updated) => {
                onCaseUpdated(updated);
                setShowFollowUpModal(false);
              }}
              onCancel={() => setShowFollowUpModal(false)}
              isModal={true}
            />
          </div>
        </div>
      )}

      {/* S2 Pre-approval Path: Close Case Modal (Requirement 4) */}
      {showCloseS2Modal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {language === 'hu' ? 'S2 ügy lezárása: Elszámolva a NEAK-kal' : 'Close S2 Case: Settled with NEAK'}
                </h3>
              </div>
              <button
                onClick={() => setShowCloseS2Modal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {closeError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                {closeError}
              </div>
            )}

            <form onSubmit={handleCloseS2Case} className="space-y-4">
              {/* Requirement: "NEAK–clinic settlement confirmed" (required) */}
              <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
                <input
                  type="checkbox"
                  required
                  checked={closeSettlementConfirmed}
                  onChange={(e) => setCloseSettlementConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#1E2761]"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">
                    {language === 'hu' ? 'NEAK–klinika elszámolás visszaigazolva' : 'NEAK–clinic settlement confirmed'} <span className="text-rose-500">*</span>
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    {language === 'hu'
                      ? 'Igazolom, hogy a külföldi közkórház közvetlenül elszámolt az S2 garanciavállalással a NEAK felé.'
                      : 'I confirm that the foreign clinic settled directly with NEAK under the S2 voucher scheme.'}
                  </span>
                </div>
              </label>

              {/* Requirement: "Travel or companion support paid" (amount, or not applicable) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'hu' ? 'Utazási vagy kísérői költségtérítés kifizetve' : 'Travel or companion support paid'}
                </label>
                <input
                  type="text"
                  value={closeTravelSupportPaid}
                  onChange={(e) => setCloseTravelSupportPaid(e.target.value)}
                  placeholder={language === 'hu' ? 'pl. 45,000 HUF (vagy hagyja üresen)' : 'e.g. 45,000 HUF (or leave blank)'}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              {/* Requirement: "Other payment to patient" (amount, or not applicable) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'hu' ? 'Egyéb kifizetés a betegnek' : 'Other payment to patient'}
                </label>
                <input
                  type="text"
                  value={closeOtherPayment}
                  onChange={(e) => setCloseOtherPayment(e.target.value)}
                  placeholder={language === 'hu' ? 'pl. 12,000 HUF gyógyszer-hozzájárulás (vagy üres)' : 'e.g. 50 EUR prescription support (or leave blank)'}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'hu' ? 'Lezárási megjegyzések' : 'Closing Notes'}
                </label>
                <textarea
                  rows={2}
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCloseS2Modal(false)}
                  className="px-4 py-2 text-xs border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={closingS2 || !closeSettlementConfirmed}
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {closingS2 ? 'Closing...' : language === 'hu' ? 'Ügy lezárása (Case closed)' : 'Close Case: Settled'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Directive Path: Mark Reimbursed Modal (Requirement 5) */}
      {showReimburseModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {language === 'hu' ? 'NEAK-költségtérítés jóváírása (Reimbursed)' : 'Mark Case Reimbursed'}
                </h3>
              </div>
              <button
                onClick={() => setShowReimburseModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {reimburseError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                {reimburseError}
              </div>
            )}

            <form onSubmit={handleReimburseDirective} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'hu' ? 'Kifizetett megtérítés összege' : 'Reimbursement Amount'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={reimbursementAmount}
                  onChange={(e) => setReimbursementAmount(e.target.value)}
                  placeholder="pl. 480,000 HUF"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'hu' ? 'Jóváírás dátuma' : 'Settlement Date'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={reimbursementDate}
                  onChange={(e) => setReimbursementDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'hu' ? 'Megjegyzések' : 'Notes'}
                </label>
                <textarea
                  rows={2}
                  value={reimburseNotes}
                  onChange={(e) => setReimburseNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReimburseModal(false)}
                  className="px-4 py-2 text-xs border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={finalizingReimburse}
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {finalizingReimburse ? 'Saving...' : language === 'hu' ? 'Megtérítve (Reimbursed)' : 'Mark Reimbursed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
