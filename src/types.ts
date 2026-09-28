export type ApplicantRole = 'patient' | 'legal_representative' | 'treating_doctor';

export type Branch = 'PA' | 'NonPA';

export type CaseStage =
  | 'Drafted'
  | 'Awaiting Advisor Review'
  | 'More Info Requested'
  | 'Reviewed'
  | 'Submitted'
  | 'Authorised'
  | 'Travelling / In Treatment'
  | 'Treated'
  | 'Reimbursed'
  | 'Case closed'
  | 'Rejected'
  | 'SOLVIT Appeal Drafted';

export function isTerminalCase(c: { currentStage: CaseStage; solvitDocument?: string }): boolean {
  if (c.currentStage === 'Reimbursed') return true;
  if (c.currentStage === 'Case closed') return true;
  if (c.currentStage === 'Rejected' && !c.solvitDocument) {
    return true;
  }
  return false;
}

export function isCaseActive(c: { currentStage: CaseStage; solvitDocument?: string }): boolean {
  return !isTerminalCase(c);
}

export interface DispatchInfo {
  signedScanFileName: string;
  signedOriginalInHand: boolean;
  dateSent: string;
  trackingNumber: string;
  submittedAt: string;
}

export interface OperationalNote {
  id: string;
  timestamp: string;
  author: string;
  text: string;
}

export interface PostTreatmentDocument {
  id: string;
  name: string;
  type: 'Invoice' | 'Translation' | 'Discharge Summary' | 'Other';
  timestamp: string;
}

export interface HistoryEntry {
  id: string;
  stage: CaseStage;
  timestamp: string;
  title: string;
  note: string;
  author: string;
  referenceNumber?: string;
}

export interface VerificationBundle {
  structuralCheck: {
    passed: boolean;
    details: string[];
    checkedAt: string;
  };
  mokVerification: {
    passed: boolean;
    licenseNumber: string;
    doctorName?: string;
    specialty?: string;
    verifiedAt: string;
    institution?: string;
  };
  clinicalJudgment: {
    status: 'pending' | 'attested' | 'flagged';
    advisorName?: string;
    attestedAt?: string;
    notes?: string;
  };
}

export interface CaseItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  patientName: string; // Stored locally, placeholders used in generated docs
  tajNumber: string; // Demo placeholder
  applicantRole: ApplicantRole;
  procedure: string;
  requiresPA: boolean;
  branch: Branch;
  monthsWaited: number;
  scheduledDomesticDate?: string;
  conditionNotes: string;
  hasEhic: boolean;
  requestTravelCost: boolean;
  travelCompanion: boolean;
  eesztDocumentName: string;
  doctorNoteFileName?: string;
  doctorName: string;
  doctorLicense: string;
  selectedClinicId: string;
  currentStage: CaseStage;
  referenceNumber?: string;
  submissionTimestamp?: string;
  supportContact?: {
    name: string;
    phone: string;
  };
  uploadedDocuments?: {
    id: string;
    name: string;
    timestamp: string;
    type: string;
  }[];
  history: HistoryEntry[];
  verification: VerificationBundle;
  aiReasoning: string;
  documentTitle: string;
  fullDocument: string;
  article9_5Document?: string;
  solvitDocument?: string;
  advisorNotes?: string;
  advisorClinicalJustification?: string;
  advisorMokLicense?: string;
  moreInfoMessage?: string;
  rejectionReason?: string;
  // Dispatch Checklist info (NEAK submission)
  dispatchInfo?: DispatchInfo;
  // Post-treatment Directive Claim Dispatch info
  claimDispatchInfo?: DispatchInfo;
  // NEAK Follow-up & Decision info
  neakCallDate?: string;
  neakDecisionDate?: string;
  neakCallNotes?: string;
  neakCallOutcome?: 'Authorised' | 'Approved' | 'Rejected' | 'More info requested' | 'Still pending';
  neakDecision?: 'Authorised' | 'Rejected' | 'Still pending';
  neakOfficerName?: string;
  decisionLetterName?: string;
  travelSupportDecision?: 'not_requested' | 'not_granted' | 'granted';
  travelSupportAmount?: string;
  travelSupportTiming?: 'before_travel' | 'after_travel';
  travelSupportPaid?: boolean;
  travelSupportPaidAmount?: string;
  // Operations Panel & Care Logistics
  patientPhone?: string;
  chaperone?: {
    name: string;
    phone: string;
  };
  travelDates?: string;
  managerNotes?: OperationalNote[];
  // Directive post-treatment uploaded documents
  postTreatmentDocuments?: PostTreatmentDocument[];
  // Directive post-treatment required upload checklist & claim review
  claimSlots?: {
    paidInvoice?: { fileName: string; uploadedAt: string };
    translatedInvoice?: { fileName: string; uploadedAt: string };
    dischargeSummary?: { fileName: string; uploadedAt: string };
    prescriptionDoc?: { fileName: string; uploadedAt: string };
  };
  claimReviewStatus?: 'not_started' | 'ready_to_prepare' | 'needs_more' | 'complete' | 'submitted_to_neak';
  claimNeedsMoreMessage?: string;
  claimCoverSheet?: string;
  // S2 Case Closing Form fields
  settlementConfirmed?: boolean;
  otherPaymentAmount?: string;
  // Directive reimbursement fields
  reimbursementAmount?: string;
  reimbursementDate?: string;
}

export interface TreatmentRule {
  procedure: string;
  requiresPA: boolean;
  category: 'inpatient' | 'outpatient';
  reason: string;
  domesticAverageWaitMonths: number;
  isPlaceholderDefault?: boolean;
}

export interface Clinic {
  id: string;
  name: string;
  country: string;
  city: string;
  providerType: 'public' | 'private';
  routeType: 'S2' | 'Directive' | 'Both';
  procedures: string[];
  averageWaitDays: number;
  coverageNote: string;
  estimatedCost: string;
  address: string;
  phone: string;
  email: string;
  languages: string[];
}

export interface MokDoctor {
  licenseNumber: string;
  name: string;
  institution: string;
  specialty: string;
  status: 'active' | 'suspended';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'advisor' | 'case_manager';
  tajDemo: string;
  mokLicense?: string;
  specialty?: string;
}
