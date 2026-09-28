import React, { useState } from 'react';
import { CaseItem, Clinic, UserProfile } from '../types';
import { useI18n } from '../i18n';
import { api } from '../services/api';
import {
  Stethoscope,
  Clock,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
  Calendar,
  User,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface AdvisorReviewQueuePageProps {
  cases: CaseItem[];
  currentUser: UserProfile | null;
  clinics: Clinic[];
  onCaseUpdated: (updatedCase: CaseItem) => void;
  onNavigate: (tab: string, caseId?: string) => void;
}

export const AdvisorReviewQueuePage: React.FC<AdvisorReviewQueuePageProps> = ({
  cases,
  currentUser,
  clinics,
  onCaseUpdated,
  onNavigate,
}) => {
  const { language } = useI18n();

  // Filter cases awaiting advisor review, sorted oldest first
  const pendingCases = cases
    .filter((c) => c.currentStage === 'Awaiting Advisor Review')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Active reviewing case modal
  const [activeCase, setActiveCase] = useState<CaseItem | null>(null);
  const [clinicalJustification, setClinicalJustification] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'request_info' | 'reject'>('approve');
  const [customReasonOrMessage, setCustomReasonOrMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [showDocPreview, setShowDocPreview] = useState<string | null>(null);

  const calculateTimeInQueue = (createdAtIso: string) => {
    const created = new Date(createdAtIso).getTime();
    const now = Date.now();
    const diffHours = Math.max(1, Math.round((now - created) / (1000 * 60 * 60)));
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} in queue`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} in queue`;
  };

  const handleOpenReview = (c: CaseItem) => {
    setActiveCase(c);
    setErrorMsg(null);
    setActionType('approve');
    setCustomReasonOrMessage('');
    // Default clinical suggestion based on procedure & months waited
    setClinicalJustification(
      `Based on the documented ${c.monthsWaited}-month wait and verified EESZT records, patient's condition presents progressive functional deterioration refractory to conservative measures. Domestic delay exceeds what is medically justifiable under EU Regulation 883/2004 Article 20 / Directive 2011/24/EU jurisprudence.`
    );
  };

  const handleExecuteDecision = async () => {
    if (!activeCase) return;

    if (actionType === 'approve' && !clinicalJustification.trim()) {
      setErrorMsg(
        language === 'hu'
          ? 'Kérjük, adja meg a szakorvosi indoklást a jóváhagyáshoz.'
          : 'Please provide a clinical justification note before approving.'
      );
      return;
    }

    if (actionType === 'request_info' && !customReasonOrMessage.trim()) {
      setErrorMsg(
        language === 'hu'
          ? 'Kérjük, fogalmazza meg a páciensnek szóló kiegészítő tájékoztatáskérést.'
          : 'Please write the message explaining what additional medical information is requested.'
      );
      return;
    }

    if (actionType === 'reject' && !customReasonOrMessage.trim()) {
      setErrorMsg(
        language === 'hu'
          ? 'Kérjük, indokolja meg az elutasítás orvosszakmai okát.'
          : 'Please provide the medical reason for rejecting this application.'
      );
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const effectiveAdvisorName = currentUser?.name || 'Dr. Varga Zsuzsa';
      const effectiveMok = currentUser?.mokLicense || 'MOK-HU-48192';
      const effectiveSpecialty = currentUser?.specialty || 'Ortopédia és Traumatológia';

      const updated = await api.advisorDecision(activeCase.id, {
        action: actionType,
        clinicalJustification: clinicalJustification.trim(),
        moreInfoMessage: actionType === 'request_info' ? customReasonOrMessage.trim() : undefined,
        rejectionReason: actionType === 'reject' ? customReasonOrMessage.trim() : undefined,
        advisorName: effectiveAdvisorName,
        advisorMokLicense: effectiveMok,
        advisorSpecialty: effectiveSpecialty,
      });

      onCaseUpdated(updated);
      setActiveCase(null);

      const actionLabel =
        actionType === 'approve'
          ? (activeCase.branch === 'NonPA'
              ? 'Approved & Directed to Travelling / In Treatment (Directive Route)'
              : 'Approved & Unlocked for NEAK submission')
          : actionType === 'request_info'
          ? 'More Info Requested from patient'
          : 'Rejected with medical explanation';

      setSuccessToast(`Case ${updated.procedure} (${updated.patientName}) — ${actionLabel}.`);
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit advisor decision.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-[#1E2761] text-white rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9A24B]/20 text-[#C9A24B] border border-[#C9A24B]/30 text-xs font-bold uppercase tracking-wider">
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Medical Advisor Clinical Review Desk</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Review Queue</h1>
          <p className="text-xs text-[#CADCFC] max-w-2xl leading-relaxed">
            Clinical evaluation of patient intake dossiers. Review documented wait times and EESZT waitlist proof to assess whether domestic delay is medically justifiable under EU cross-border healthcare rules.
          </p>
        </div>

        {/* Advisor Credentials Pill */}
        <div className="bg-white/10 border border-white/20 rounded-xl p-3 text-xs text-left shrink-0">
          <div className="text-[11px] text-[#CADCFC] uppercase tracking-wider font-semibold">Active Reviewer</div>
          <div className="font-bold text-white text-sm mt-0.5">{currentUser?.name || 'Dr. Varga Zsuzsa'}</div>
          <div className="text-[#C9A24B] font-mono text-[11px] mt-0.5">
            {currentUser?.mokLicense || 'MOK-HU-48192'} · {currentUser?.specialty || 'Ortopédia és Traumatológia'}
          </div>
        </div>
      </div>

      {/* Toast */}
      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Queue Statistics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Pending Review</span>
          <div className="text-2xl font-bold text-[#1E2761] mt-1 flex items-baseline gap-2">
            <span>{pendingCases.length}</span>
            <span className="text-xs font-medium text-amber-600">Oldest First</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Oldest Case In Queue</span>
          <div className="text-xs font-bold text-slate-800 mt-2 truncate">
            {pendingCases.length > 0 ? (
              <>
                <span>{pendingCases[0].procedure}</span>{' '}
                <span className="text-slate-400 font-normal">({calculateTimeInQueue(pendingCases[0].createdAt)})</span>
              </>
            ) : (
              <span className="text-slate-400 font-normal">No pending cases</span>
            )}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Past Decisions</span>
            <div className="text-base font-bold text-slate-800 mt-0.5">
              {cases.filter((c) => c.currentStage !== 'Awaiting Advisor Review').length} Reviewed
            </div>
          </div>
          <button
            onClick={() => onNavigate('reviewed-cases')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            History →
          </button>
        </div>
      </div>

      {/* Main Queue List */}
      {pendingCases.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Review Queue is Clear</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            There are currently no patient dossiers awaiting clinical review. New submissions will automatically appear here ordered by submission timestamp.
          </p>
          <button
            onClick={() => onNavigate('reviewed-cases')}
            className="px-4 py-2 rounded-lg bg-[#1E2761] hover:bg-[#151B45] text-white text-xs font-semibold cursor-pointer"
          >
            View Past Reviewed Cases →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
            <span>Dossiers awaiting clinical decision ({pendingCases.length})</span>
            <span>Sorted oldest first</span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
            {pendingCases.map((c, index) => {
              const matchedClinic = clinics.find((cl) => cl.id === c.selectedClinicId);
              const timeInQueue = calculateTimeInQueue(c.createdAt);

              return (
                <div
                  key={c.id}
                  className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Left Column: Patient & Procedure */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                        #{index + 1}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-200">
                        Awaiting Advisor Review
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <div className="flex items-center gap-1 text-xs text-slate-600 font-medium">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>{timeInQueue}</span>
                      </div>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500">
                        Submitted: {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-[#1E2761] flex items-center gap-2">
                        <span>{c.procedure}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {c.branch === 'PA' ? 'S2 Pre-Approval' : 'Directive Day-Surgery'}
                        </span>
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-1">
                        <div className="flex items-center gap-1 font-semibold text-slate-900">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{c.patientName}</span>
                          <span className="font-mono text-slate-500 text-[11px]">({c.tajNumber})</span>
                        </div>
                        <div className="flex items-center gap-1 text-rose-800 font-semibold bg-rose-50 px-2 py-0.5 rounded">
                          <Calendar className="w-3.5 h-3.5 text-rose-600" />
                          <span>{c.monthsWaited} months waited</span>
                        </div>
                        {c.scheduledDomesticDate && (
                          <div className="text-slate-500">
                            Domestic date: <strong className="text-slate-700">{c.scheduledDomesticDate}</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Clinic & Proof Document */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                      {matchedClinic && (
                        <div className="flex items-center gap-1 text-slate-600">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            Target: <strong className="text-slate-800">{matchedClinic.name}</strong> ({matchedClinic.country})
                          </span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowDocPreview(c.eesztDocumentName || 'EESZT_Proof.pdf')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-medium transition-colors cursor-pointer border border-slate-200"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#1E2761]" />
                        <span>{c.eesztDocumentName || 'EESZT Waitlist Proof'}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0">
                    <button
                      onClick={() => handleOpenReview(c)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#1E2761] hover:bg-[#151B45] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Stethoscope className="w-3.5 h-3.5 text-[#C9A24B]" />
                      <span>Review Case</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                    </button>

                    <button
                      onClick={() => onNavigate('case-detail', c.id)}
                      className="text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                    >
                      View full dossier →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Review Modal / Desk */}
      {activeCase && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8">
            {/* Modal Header */}
            <div className="border-b border-slate-100 pb-4 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center">
                    <Stethoscope className="w-4 h-4" />
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">
                    Clinical Attestation & Verification
                  </h2>
                </div>
                <p className="text-xs text-slate-500">
                  Case ID: <span className="font-mono">{activeCase.id}</span> · Patient: <strong>{activeCase.patientName}</strong>
                </p>
              </div>

              <button
                onClick={() => setActiveCase(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Case Patient Summary Card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                  <span className="text-[11px] text-slate-500 block">Procedure</span>
                  <span className="font-bold text-slate-900 text-sm">{activeCase.procedure}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Governing EU Route</span>
                  <span className="font-bold text-[#1E2761]">
                    {activeCase.branch === 'PA' ? 'EU Reg 883/2004 (S2 Voucher)' : 'Directive 2011/24/EU (Claim)'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-500 block text-[11px]">Months Waited</span>
                  <strong className="text-rose-700 text-sm font-bold">{activeCase.monthsWaited} months</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Scheduled Domestic Date</span>
                  <strong className="text-slate-800">{activeCase.scheduledDomesticDate || 'Not scheduled'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">EESZT Proof</span>
                  <button
                    type="button"
                    onClick={() => setShowDocPreview(activeCase.eesztDocumentName)}
                    className="text-[#1E2761] hover:underline font-semibold flex items-center gap-1 cursor-pointer truncate"
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{activeCase.eesztDocumentName || 'EESZT_Proof.pdf'}</span>
                  </button>
                </div>
              </div>

              {activeCase.conditionNotes && (
                <div className="pt-2 border-t border-slate-200/80 text-slate-600">
                  <span className="text-[11px] font-semibold text-slate-700 block mb-0.5">Reported Notes:</span>
                  <p className="italic text-[11px] leading-relaxed">&ldquo;{activeCase.conditionNotes}&rdquo;</p>
                </div>
              )}
            </div>

            {/* Action Type Selection (3 Options) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Select Clinical Action
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setActionType('approve')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    actionType === 'approve'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs flex items-center gap-1.5 text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve</span>
                    </span>
                    {actionType === 'approve' && <span className="w-2 h-2 rounded-full bg-emerald-600" />}
                  </div>
                  <p className="text-[11px] opacity-80 leading-snug">
                    {activeCase.branch === 'NonPA'
                      ? 'Validates clinical necessity and moves directly to Travelling / In Treatment.'
                      : 'Sets to Reviewed; unlocks legal document generation and NEAK dispatch.'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActionType('request_info')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    actionType === 'request_info'
                      ? 'border-amber-600 bg-amber-50 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs flex items-center gap-1.5 text-amber-700">
                      <MessageSquare className="w-4 h-4" />
                      <span>Request More Info</span>
                    </span>
                    {actionType === 'request_info' && <span className="w-2 h-2 rounded-full bg-amber-600" />}
                  </div>
                  <p className="text-[11px] opacity-80 leading-snug">
                    Returns case to patient with specific guidance or missing diagnostic requests.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActionType('reject')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    actionType === 'reject'
                      ? 'border-rose-600 bg-rose-50 text-rose-950 ring-2 ring-rose-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs flex items-center gap-1.5 text-rose-700">
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </span>
                    {actionType === 'reject' && <span className="w-2 h-2 rounded-full bg-rose-600" />}
                  </div>
                  <p className="text-[11px] opacity-80 leading-snug">
                    Domestic wait time is clinically tolerable; rejects with reasoned medical justification.
                  </p>
                </button>
              </div>
            </div>

            {/* Input Areas depending on Action */}
            {actionType === 'approve' ? (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Clinical Justification Note <span className="text-rose-500">*</span>
                </label>
                <p className="text-[11px] text-slate-500">
                  This note is stored on the case and included in the generated NEAK documents. Your name (<strong>{currentUser?.name || 'Dr. Varga Zsuzsa'}</strong>) and MOK license number (<strong>{currentUser?.mokLicense || 'MOK-HU-48192'}</strong>) will appear in the treating-doctor position.
                </p>
                <textarea
                  rows={4}
                  value={clinicalJustification}
                  onChange={(e) => setClinicalJustification(e.target.value)}
                  className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E2761] outline-hidden text-slate-900 leading-relaxed font-sans"
                  placeholder="State whether the excessive wait is medically justifiable for this condition, irreversible deterioration, chronic pain refractory to analgesics..."
                />
              </div>
            ) : actionType === 'request_info' ? (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-amber-900">
                  Message to Patient (Request for Additional Information) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={customReasonOrMessage}
                  onChange={(e) => setCustomReasonOrMessage(e.target.value)}
                  className="w-full p-3 text-xs border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden text-slate-900 bg-amber-50/30 font-sans"
                  placeholder="e.g. Please provide an updated orthopaedic MRI scan or EESZT log showing exact surgical indication dates..."
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-rose-900">
                  Medical Reason for Rejection <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={customReasonOrMessage}
                  onChange={(e) => setCustomReasonOrMessage(e.target.value)}
                  className="w-full p-3 text-xs border border-rose-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-hidden text-slate-900 bg-rose-50/30 font-sans"
                  placeholder="e.g. Based on current clinical guidelines, the documented wait of 3 months does not exceed acceptable clinical delay thresholds..."
                />
              </div>
            )}

            {/* Modal Footer Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveCase(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleExecuteDecision}
                className={`px-6 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                  actionType === 'approve'
                    ? 'bg-emerald-700 hover:bg-emerald-800'
                    : actionType === 'request_info'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-rose-700 hover:bg-rose-800'
                }`}
              >
                {submitting ? (
                  <span>Recording Decision...</span>
                ) : actionType === 'approve' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>{activeCase.branch === 'NonPA' ? 'Approve & Move to Travel' : 'Approve & Unlock Case'}</span>
                  </>
                ) : actionType === 'request_info' ? (
                  <>
                    <MessageSquare className="w-4 h-4 text-amber-200" />
                    <span>Send Request to Patient</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-200" />
                    <span>Confirm Rejection</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Document Inspector Modal */}
      {showDocPreview && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-[#1E2761]">
                <FileText className="w-4 h-4 text-[#C9A24B]" />
                <span className="truncate">{showDocPreview}</span>
              </div>
              <button
                onClick={() => setShowDocPreview(null)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-700 space-y-2 leading-relaxed">
              <div className="font-bold text-slate-900 border-b border-slate-200 pb-1">
                EESZT — Elektronikus Egészségügyi Szolgáltatási Tér
              </div>
              <div>Dokumentum azonosító: EESZT-HU-WAITLIST-VERIFIED</div>
              <div>Kiadás dátuma: 2026. március</div>
              <div>Intézmény: Országos Ortopédiai és Traumatológiai Klinika</div>
              <div>Várólista nyilvántartási bejegyzés igazolása (BNO kód érvényes).</div>
              <div className="pt-2 text-[11px] text-emerald-700 font-sans font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>EESZT elektronikus aláírás és időbélyeg érvényesítve.</span>
              </div>
            </div>

            <div className="text-right">
              <button
                onClick={() => setShowDocPreview(null)}
                className="px-4 py-2 bg-[#1E2761] text-white text-xs font-semibold rounded-lg hover:bg-[#151B45] cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
