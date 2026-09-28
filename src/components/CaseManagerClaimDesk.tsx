import React, { useState } from 'react';
import { CaseItem } from '../types';
import { useI18n } from '../i18n';
import { api } from '../services/api';
import { DispatchChecklist } from './DispatchChecklist';
import { RecordNeakDecisionPanel } from './RecordNeakDecisionPanel';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Send,
  FileCheck,
  Download,
  Eye,
  EyeOff,
  Clock,
  Sparkles,
  PhoneCall,
  Award,
} from 'lucide-react';

interface CaseManagerClaimDeskProps {
  caseItem: CaseItem;
  onCaseUpdated: (updated: CaseItem) => void;
}

export const CaseManagerClaimDesk: React.FC<CaseManagerClaimDeskProps> = ({
  caseItem,
  onCaseUpdated,
}) => {
  const { language } = useI18n();
  const isHu = language === 'hu';

  const [reviewing, setReviewing] = useState(false);
  const [showNeedsMoreForm, setShowNeedsMoreForm] = useState(false);
  const [needsMoreMessage, setNeedsMoreMessage] = useState(
    isHu
      ? 'Kérjük, töltse fel a kórházi számla hiteles magyar fordítását és a részletes beavatkozási kódokat tartalmazó zárójelentést.'
      : 'Please upload the certified Hungarian translation of the clinic invoice and the discharge summary.'
  );
  const [showCoverSheetPreview, setShowCoverSheetPreview] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const claimSlots = caseItem.claimSlots || {};
  const hasInvoice = Boolean(claimSlots.paidInvoice?.fileName);
  const isComplete = caseItem.claimReviewStatus === 'complete';
  const isSubmittedToNeak =
    caseItem.claimReviewStatus === 'submitted_to_neak' || Boolean(caseItem.claimDispatchInfo?.dateSent);

  const coverSheet = caseItem.claimCoverSheet || '';

  const handleDownloadCoverSheet = () => {
    const blob = new Blob([coverSheet], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${caseItem.patientName.replace(/\s+/g, '_')}_NEAK_Koltsegteritesi_Fedolap.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleMarkComplete = async () => {
    setReviewing(true);
    setErrorMessage(null);
    try {
      const updated = await api.reviewClaim(caseItem.id, 'complete');
      onCaseUpdated(updated);
      setShowNeedsMoreForm(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to mark claim complete');
    } finally {
      setReviewing(false);
    }
  };

  const handleRequestMore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!needsMoreMessage.trim()) return;

    setReviewing(true);
    setErrorMessage(null);
    try {
      const updated = await api.reviewClaim(caseItem.id, 'needs_more', needsMoreMessage.trim());
      onCaseUpdated(updated);
      setShowNeedsMoreForm(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit info request');
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Card: Upload Review & Cover Sheet Generation */}
      <div className="bg-white rounded-2xl border-2 border-[#1E2761]/25 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1E2761] text-white flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-4 h-4 text-[#C9A24B]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#1E2761]">
                  {isHu
                    ? 'Utólagos költségtérítés előkészítése (Esetmenedzseri ellenőrzés)'
                    : 'Reimbursement Claim Preparation & Review'}
                </h3>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200 text-[10px] font-bold">
                  Directive 2011/24/EU
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {isHu
                  ? 'Ellenőrizze a beteg által feltöltött számlákat, generálja a fedőlapot, és készítse elő a NEAK-feladást.'
                  : 'Review patient uploaded documents, inspect the generated claim cover sheet, and advance to postal dispatch.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isSubmittedToNeak ? (
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-900 border border-blue-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                <Send className="w-3.5 h-3.5 text-blue-700" />
                <span>{isHu ? 'NEAK-hoz beküldve' : 'Submitted to NEAK'}</span>
              </span>
            ) : isComplete ? (
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>{isHu ? 'Dokumentumok hiánytalanok' : 'Documents Complete'}</span>
              </span>
            ) : hasInvoice ? (
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-950 border border-amber-300 text-xs font-bold flex items-center gap-1.5 animate-pulse shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                <span>{isHu ? 'Elszámolás előkészítésére kész' : 'Ready to prepare claim'}</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300 text-xs font-medium">
                {isHu ? 'Beteg feltöltésére vár' : 'Awaiting patient invoice'}
              </span>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 4 Slots Inspection Table */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-800">
            {isHu ? 'Páciens által feltöltött igazolások (4 tételes lista):' : 'Patient Uploaded Evidence (4 Checklist Slots):'}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Slot 1: Paid invoice */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#1E2761] text-white flex items-center justify-center text-[10px]">1</span>
                  <span>{isHu ? 'Kifizetett kórházi számla' : 'Paid invoice'}</span>
                </span>
                {claimSlots.paidInvoice ? (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                    {isHu ? 'Feltöltve' : 'Uploaded'}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    {isHu ? 'Kötelező — Hiányzik' : 'Required — Missing'}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-mono text-slate-600 truncate">
                {claimSlots.paidInvoice?.fileName || (isHu ? 'Nincs fájl feltöltve' : 'No file uploaded')}
              </p>
            </div>

            {/* Slot 2: Translated invoice */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#1E2761] text-white flex items-center justify-center text-[10px]">2</span>
                  <span>{isHu ? 'Hiteles fordítás' : 'Translated invoice'}</span>
                </span>
                {claimSlots.translatedInvoice ? (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                    {isHu ? 'Feltöltve' : 'Uploaded'}
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {isHu ? 'Nem csatolt / Eredetileg HU' : 'Optional / Not provided'}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-mono text-slate-600 truncate">
                {claimSlots.translatedInvoice?.fileName || (isHu ? 'Nem szükséges / nincs külön fordítás' : 'Not uploaded')}
              </p>
            </div>

            {/* Slot 3: Discharge summary */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#1E2761] text-white flex items-center justify-center text-[10px]">3</span>
                  <span>{isHu ? 'Kórházi zárójelentés' : 'Discharge summary'}</span>
                </span>
                {claimSlots.dischargeSummary ? (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                    {isHu ? 'Feltöltve' : 'Uploaded'}
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {isHu ? 'Nem csatolt' : 'Optional / Not provided'}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-mono text-slate-600 truncate">
                {claimSlots.dischargeSummary?.fileName || (isHu ? 'Számla részletezi a műtétet' : 'Not uploaded')}
              </p>
            </div>

            {/* Slot 4: Prescription documentation */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#1E2761] text-white flex items-center justify-center text-[10px]">4</span>
                  <span>{isHu ? 'Recept / rendelvényi irat' : 'Prescription documentation'}</span>
                </span>
                {claimSlots.prescriptionDoc ? (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                    {isHu ? 'Feltöltve' : 'Uploaded'}
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {isHu ? 'Nem csatolt' : 'Optional / Not provided'}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-mono text-slate-600 truncate">
                {claimSlots.prescriptionDoc?.fileName || (isHu ? 'Nem készült recept' : 'Not uploaded')}
              </p>
            </div>
          </div>
        </div>

        {/* System Generated Reimbursement Cover Sheet */}
        {coverSheet && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-900">
                  {isHu
                    ? 'Rendszer által generált NEAK-költségtérítési fedőlap és mellékletjegyzék'
                    : 'System Generated NEAK Reimbursement Claim Cover Sheet'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCoverSheetPreview(!showCoverSheetPreview)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer flex items-center gap-1 transition-colors"
                >
                  {showCoverSheetPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showCoverSheetPreview ? (isHu ? 'Elrejtés' : 'Hide') : (isHu ? 'Megtekintés' : 'Preview')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCoverSheet}
                  className="px-3 py-1 text-[11px] font-bold text-white bg-[#1E2761] hover:bg-[#151B45] rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-[#C9A24B]" />
                  <span>{isHu ? 'Fedőlap letöltése' : 'Download Cover Sheet'}</span>
                </button>
              </div>
            </div>

            {showCoverSheetPreview && (
              <pre className="p-3 bg-white rounded-lg border border-slate-200 text-[11px] font-mono whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed text-slate-800">
                {coverSheet}
              </pre>
            )}

            <div className="text-[11px] text-slate-500">
              {isHu
                ? 'A kérelem hivatalos kérelmezője a páciens marad; a kinyomtatott fedőlapot a beteg írja alá a postázás előtt.'
                : 'The patient remains the official applicant and signs this generated filing before registered mail dispatch.'}
            </div>
          </div>
        )}

        {/* Case Manager Decision Actions (When not yet submitted to NEAK) */}
        {!isSubmittedToNeak && (
          <div className="pt-2 border-t border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-600">
                {isHu ? 'Esetmenedzseri ellenőrzési döntés:' : 'Case Manager Review Action:'}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowNeedsMoreForm(!showNeedsMoreForm)}
                  className="px-3.5 py-2 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl transition-colors cursor-pointer"
                >
                  {isHu ? 'Hiánypótlás kérése a betegtől' : 'Needs more from patient'}
                </button>

                <button
                  type="button"
                  disabled={!hasInvoice || reviewing}
                  onClick={handleMarkComplete}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>{reviewing ? (isHu ? 'Mentés...' : 'Saving...') : (isHu ? 'Iratok hiánytalanok (Complete)' : 'Mark Documents Complete')}</span>
                </button>
              </div>
            </div>

            {/* Needs More Form */}
            {showNeedsMoreForm && (
              <form onSubmit={handleRequestMore} className="p-4 bg-amber-50/80 rounded-xl border border-amber-200 space-y-3 animate-in fade-in">
                <label className="block text-xs font-bold text-amber-950">
                  {isHu ? 'Üzenet a páciens számára (mi hiányzik / mit kell feltöltenie):' : 'Message to patient (what is missing):'}
                </label>
                <textarea
                  rows={2}
                  required
                  value={needsMoreMessage}
                  onChange={(e) => setNeedsMoreMessage(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-amber-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed font-sans"
                  placeholder={isHu ? 'Írja le a hiányzó dokumentumot vagy fordítást...' : 'Specify missing documents...'}
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNeedsMoreForm(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg cursor-pointer"
                  >
                    {isHu ? 'Mégse' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={reviewing || !needsMoreMessage.trim()}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-lg cursor-pointer disabled:opacity-50 shadow-2xs"
                  >
                    {reviewing ? (isHu ? 'Küldés...' : 'Sending...') : (isHu ? 'Hiánypótlás elküldése a betegnek' : 'Send Request to Patient')}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Requirement 3: Reuse the existing dispatch checklist once the claim is marked complete */}
      {isComplete && !isSubmittedToNeak && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 px-1">
            <Send className="w-4 h-4 text-[#1E2761]" />
            <span>
              {isHu
                ? 'Hivatalos postai feladás ajánlott küldeményként (Meglévő Dispatch Checklist)'
                : 'Signed Form & Registered-Mail Dispatch Checklist'}
            </span>
          </div>
          <DispatchChecklist
            caseItem={caseItem}
            isClaimDispatch={true}
            onSuccess={onCaseUpdated}
          />
        </div>
      )}

      {/* Requirement 4: NEAK's reimbursement decision, case manager only */}
      {/* Logs outcome: amount reimbursed and date, or rejected with a reason using the same panel pattern */}
      {isSubmittedToNeak && (
        <div className="space-y-4">
          {/* Internal Claim Status Banner */}
          <div className="p-4 rounded-xl bg-blue-50/90 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-950">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#1E2761] text-white flex items-center justify-center font-bold">
                <Send className="w-3.5 h-3.5 text-[#C9A24B]" />
              </div>
              <div>
                <div className="font-bold">
                  {isHu ? 'Belső elszámolási státusz: NEAK-hoz beküldve' : 'Internal Claim Status: Submitted to NEAK'}
                </div>
                <div className="text-[11px] text-blue-800">
                  {caseItem.claimDispatchInfo?.dateSent && (
                    <span>
                      {isHu
                        ? `Feladva ajánlott küldeményként: ${caseItem.claimDispatchInfo.dateSent}, Ragszám: ${caseItem.claimDispatchInfo.trackingNumber}`
                        : `Sent by registered mail on ${caseItem.claimDispatchInfo.dateSent}, tracking ${caseItem.claimDispatchInfo.trackingNumber}`}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white text-blue-900 border border-blue-200 self-start sm:self-auto">
              {isHu ? 'Csak esetmenedzser látja' : 'Case Manager Internal View'}
            </span>
          </div>

          {/* Record NEAK Reimbursement Decision Panel */}
          <RecordNeakDecisionPanel
            caseItem={caseItem}
            onSuccess={onCaseUpdated}
          />
        </div>
      )}
    </div>
  );
};
