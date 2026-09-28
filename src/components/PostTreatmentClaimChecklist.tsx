import React, { useState } from 'react';
import { CaseItem } from '../types';
import { useI18n } from '../i18n';
import { api } from '../services/api';
import {
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  Send,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface PostTreatmentClaimChecklistProps {
  caseItem: CaseItem;
  onCaseUpdated: (updated: CaseItem) => void;
}

interface SlotConfig {
  key: 'paidInvoice' | 'translatedInvoice' | 'dischargeSummary' | 'prescriptionDoc';
  labelEn: string;
  labelHu: string;
  descEn: string;
  descHu: string;
  required: boolean;
  defaultMockName: string;
}

export const PostTreatmentClaimChecklist: React.FC<PostTreatmentClaimChecklistProps> = ({
  caseItem,
  onCaseUpdated,
}) => {
  const { language } = useI18n();
  const isHu = language === 'hu';

  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const slots: SlotConfig[] = [
    {
      key: 'paidInvoice',
      labelEn: 'Paid invoice',
      labelHu: 'Kifizetett kórházi számla',
      descEn: 'Itemized invoice issued by the foreign hospital with proof of zero balance or payment receipt.',
      descHu: 'Részletes kórházi számla és a kiegyenlítést igazoló banki vagy pénztárbizonylat.',
      required: true,
      defaultMockName: `${caseItem.patientName.replace(/\s+/g, '_')}_Paid_Hospital_Invoice.pdf`,
    },
    {
      key: 'translatedInvoice',
      labelEn: 'Translated invoice (if not in Hungarian)',
      labelHu: 'Hiteles fordítás (ha nem magyar nyelvű)',
      descEn: 'Official or certified Hungarian translation if the invoice was issued in a foreign language.',
      descHu: 'Hivatalos magyar nyelvű fordítás, amennyiben a külföldi számla idegen nyelven készült.',
      required: false,
      defaultMockName: `${caseItem.patientName.replace(/\s+/g, '_')}_Invoice_Hungarian_Translation.pdf`,
    },
    {
      key: 'dischargeSummary',
      labelEn: 'Discharge summary (if the invoice lacks medical detail)',
      labelHu: 'Zárójelentés (ha a számla nem tartalmazza az orvosi részleteket)',
      descEn: 'Ambulatory clinical report or discharge paper stating the exact diagnostic and treatment codes.',
      descHu: 'Ambuláns lap vagy zárójelentés, amely igazolja az elvégzett orvosi beavatkozás kódjait.',
      required: false,
      defaultMockName: `${caseItem.patientName.replace(/\s+/g, '_')}_Discharge_Summary.pdf`,
    },
    {
      key: 'prescriptionDoc',
      labelEn: 'Prescription documentation (if applicable)',
      labelHu: 'Recept- és rendelvény-dokumentáció (ha releváns)',
      descEn: 'Cross-border doctor prescriptions or medications issued abroad during care.',
      descHu: 'Külföldön felírt orvosi rendelvények vagy gyógyszeres kezelési protokollok.',
      required: false,
      defaultMockName: `${caseItem.patientName.replace(/\s+/g, '_')}_Prescription_Protocol.pdf`,
    },
  ];

  const claimSlots = caseItem.claimSlots || {};
  const uploadedCount = slots.filter((s) => Boolean(claimSlots[s.key]?.fileName)).length;
  const isInvoiceUploaded = Boolean(claimSlots.paidInvoice?.fileName);

  const isMailed = Boolean(
    caseItem.claimDispatchInfo?.dateSent || caseItem.claimReviewStatus === 'submitted_to_neak'
  );
  const isPreparingOrReviewed =
    !isMailed &&
    (caseItem.claimReviewStatus === 'ready_to_prepare' || caseItem.claimReviewStatus === 'complete');
  const needsMore = caseItem.claimReviewStatus === 'needs_more';

  const handleUploadSlot = async (slotKey: SlotConfig['key'], fileName: string) => {
    setUploadingKey(slotKey);
    setError(null);
    try {
      const updated = await api.uploadClaimSlot(caseItem.id, slotKey, fileName);
      onCaseUpdated(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setUploadingKey(null);
    }
  };

  // Requirement 5: Patient view stays calm and read-only once mailed
  if (isMailed) {
    const mailedDate = caseItem.claimDispatchInfo?.dateSent || caseItem.claimDispatchInfo?.submittedAt?.split('T')[0] || 'recently';
    return (
      <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-slate-50 rounded-2xl border-2 border-blue-200/80 p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1E2761] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Send className="w-5 h-5 text-[#C9A24B]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1E2761]">
              {isHu
                ? `Költségtérítési igényét elküldtük a NEAK-nak (${mailedDate})`
                : `Your claim was sent to NEAK on ${mailedDate}`}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">
              {isHu
                ? 'Értesítjük, amint döntés születik. Esetmenedzserünk nyomon követi a megtérítés folyamatát.'
                : "We'll update you as soon as there's a decision. Our case manager is monitoring the reimbursement."}
            </p>
          </div>
        </div>

        {caseItem.claimDispatchInfo?.trackingNumber && (
          <div className="p-3 bg-white/90 rounded-xl border border-blue-200 text-xs text-blue-950 flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-slate-700">
              {isHu ? 'Ajánlott küldemény azonosító (Ragszám):' : 'Registered mail tracking:'}
            </span>
            <span className="font-mono font-bold text-[#1E2761] bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
              {caseItem.claimDispatchInfo.trackingNumber}
            </span>
          </div>
        )}

        <div className="pt-2 border-t border-blue-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>{isHu ? 'Csatolt és beküldött dokumentumok:' : 'Submitted claim documents:'} {uploadedCount} db</span>
          <span className="flex items-center gap-1 text-emerald-700 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isHu ? 'Postai feladás igazolva' : 'Dispatched by Registered Mail'}</span>
          </span>
        </div>
      </div>
    );
  }

  // Requirement 5: While documents are being prepared or reviewed: "We're preparing your reimbursement claim."
  if (isPreparingOrReviewed && !needsMore) {
    return (
      <div className="bg-white rounded-2xl border-2 border-[#1E2761]/20 p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Clock className="w-5 h-5 text-white animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1E2761]">
                {isHu ? 'Előkészítjük a költségtérítési kérelmét' : "We're preparing your reimbursement claim"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isHu
                  ? 'Esetmenedzserünk ellenőrzi a feltöltött számlákat és összeállítja a hivatalos NEAK-fedőlapot.'
                  : 'Our case manager is reviewing your uploaded documents and generating your official claim cover sheet.'}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold self-start sm:self-auto flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{isHu ? 'Előkészítés alatt' : 'In Preparation'}</span>
          </span>
        </div>

        {/* Read-only list of uploaded documents */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
            <span>{isHu ? 'Feltöltött elszámolási dokumentumok:' : 'Uploaded claim documents:'}</span>
            <span className="text-[11px] font-mono text-slate-500">{uploadedCount} of 4</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {slots.map((slot) => {
              const file = claimSlots[slot.key];
              return (
                <div
                  key={slot.key}
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                    file
                      ? 'bg-slate-50 border-slate-200 text-slate-800'
                      : 'bg-white border-dashed border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="truncate mr-2">
                    <div className="font-semibold truncate">
                      {isHu ? slot.labelHu : slot.labelEn}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate font-mono">
                      {file ? file.fileName : isHu ? 'Nem csatolt' : 'Not provided'}
                    </div>
                  </div>
                  {file ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <span className="text-[10px] text-slate-400 italic shrink-0">
                      {slot.required ? (isHu ? 'Kötelező' : 'Required') : (isHu ? 'Opcionális' : 'Optional')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
          {isHu
            ? 'Amint a kérelem aláírásra kész, esetmenedzserünk elküldi Önnek a nyomtatványt, és intézi a postai feladást.'
            : 'Once the claim package is finalized for your signature, our case manager will coordinate dispatch and notify you.'}
        </p>
      </div>
    );
  }

  // Active Upload View: Required upload checklist with 4 slots and progress
  return (
    <div className="bg-white rounded-2xl border-2 border-[#1E2761]/20 p-6 sm:p-7 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1E2761] text-white flex items-center justify-center shrink-0 shadow-sm">
            <FileText className="w-5 h-5 text-[#C9A24B]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#1E2761]">
                {isHu
                  ? 'Utólagos költségtérítési dokumentumok feltöltése'
                  : 'Post-Treatment Reimbursement Checklist'}
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200">
                Directive 2011/24/EU
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isHu
                ? 'Töltse fel a külföldi kezelés számláját és záróiratát a NEAK-visszatérítéshez.'
                : 'Upload your hospital invoice and medical discharge paper to initiate your NEAK reimbursement claim.'}
            </p>
          </div>
        </div>

        {/* Progress Badge */}
        <div className="flex flex-col items-start sm:items-end gap-1.5 self-start sm:self-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">
              {isHu ? `${uploadedCount} a 4 dokumentumból feltöltve` : `${uploadedCount} of 4 documents uploaded`}
            </span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isInvoiceUploaded ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'
              }`}
            />
          </div>
          <div className="w-36 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div
              className="h-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${(uploadedCount / 4) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Case Manager "Needs More" Message Banner (if requested) */}
      {needsMore && caseItem.claimNeedsMoreMessage && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 space-y-1.5 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-700" />
            <span>
              {isHu ? 'Az ellátásszervező hiánypótlást kért:' : 'Case manager requested more information:'}
            </span>
          </div>
          <p className="text-xs text-amber-900 pl-6 leading-relaxed font-medium">
            "{caseItem.claimNeedsMoreMessage}"
          </p>
          <div className="pl-6 text-[11px] text-amber-800">
            {isHu
              ? 'Kérjük, töltse fel a hiányzó vagy módosított iratot az alábbi megfelelő mezőbe.'
              : 'Please upload the requested document into the designated slot below.'}
          </div>
        </div>
      )}

      {/* 4 Distinct Upload Slots */}
      <div className="space-y-3.5">
        {slots.map((slot, index) => {
          const file = claimSlots[slot.key];
          const isUploading = uploadingKey === slot.key;

          return (
            <div
              key={slot.key}
              className={`p-4 rounded-xl border transition-all ${
                file
                  ? 'bg-slate-50/70 border-emerald-300 ring-1 ring-emerald-500/10'
                  : slot.required
                  ? 'bg-white border-amber-300 shadow-2xs'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-5 h-5 rounded-full bg-[#1E2761] text-white flex items-center justify-center text-[10px] font-bold">
                      {index + 1}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">
                      {isHu ? slot.labelHu : slot.labelEn}
                    </h4>
                    {slot.required ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        {isHu ? 'Kötelező' : 'Required'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        {isHu ? 'Ha releváns' : 'If applicable'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 pl-7">
                    {isHu ? slot.descHu : slot.descEn}
                  </p>
                </div>

                {/* Upload action or uploaded file display */}
                <div className="pl-7 sm:pl-0 shrink-0 flex items-center gap-2">
                  {file ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg text-xs font-mono font-medium max-w-[200px] truncate">
                        <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{file.fileName}</span>
                      </div>
                      <label className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors shadow-2xs">
                        {isHu ? 'Módosítás' : 'Replace'}
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const chosen = e.target.files?.[0];
                            if (chosen) {
                              handleUploadSlot(slot.key, chosen.name);
                            }
                          }}
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <label className="px-3.5 py-1.5 rounded-lg bg-[#1E2761] hover:bg-[#151B45] text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                        <Upload className="w-3.5 h-3.5 text-[#C9A24B]" />
                        <span>{isUploading ? (isHu ? 'Mentés...' : 'Uploading...') : (isHu ? 'Tallózás és feltöltés' : 'Browse & Upload')}</span>
                        <input
                          type="file"
                          className="hidden"
                          disabled={isUploading}
                          onChange={(e) => {
                            const chosen = e.target.files?.[0];
                            if (chosen) {
                              handleUploadSlot(slot.key, chosen.name);
                            } else {
                              handleUploadSlot(slot.key, slot.defaultMockName);
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => handleUploadSlot(slot.key, slot.defaultMockName)}
                        className="text-[11px] text-slate-500 hover:text-slate-800 underline decoration-slate-300 cursor-pointer"
                        title={slot.defaultMockName}
                      >
                        {isHu ? 'Gyorsminta' : 'Sample'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer helper note */}
      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            {isInvoiceUploaded
              ? (isHu
                  ? 'A számla rögzítve. Esetmenedzserünk hamarosan ellenőrzi az iratokat.'
                  : 'Paid invoice recorded. Case manager will review and prepare the official NEAK claim.')
              : (isHu
                  ? 'A költségtérítés indításához a kifizetett számla (1. lépés) feltöltése szükséges.'
                  : 'Uploading the paid hospital invoice (Step 1) is required to prepare your claim.')}
          </span>
        </div>
      </div>
    </div>
  );
};
