import React, { useState } from 'react';
import { CaseItem } from '../types';
import { useI18n } from '../i18n';
import { api } from '../services/api';
import { Send, Upload, CheckSquare, Square, Calendar, Hash, FileCheck, CheckCircle2 } from 'lucide-react';

interface DispatchChecklistProps {
  caseItem: CaseItem;
  isClaimDispatch?: boolean;
  onSuccess: (updated: CaseItem) => void;
}

export const DispatchChecklist: React.FC<DispatchChecklistProps> = ({
  caseItem,
  isClaimDispatch = false,
  onSuccess,
}) => {
  const { language } = useI18n();
  const todayStr = new Date().toISOString().split('T')[0];

  const defaultScanName = isClaimDispatch
    ? `${caseItem.patientName.replace(/\s+/g, '_')}_Alairt_Koltsegterites_Igeny.pdf`
    : `${caseItem.patientName.replace(/\s+/g, '_')}_Alairt_S2_Kerelem.pdf`;

  const [signedScanName, setSignedScanName] = useState(defaultScanName);
  const [signedOriginalInHand, setSignedOriginalInHand] = useState(false);
  const [dateSent, setDateSent] = useState(todayStr);
  const [trackingNumber, setTrackingNumber] = useState(
    'RL' + Math.floor(100000000 + Math.random() * 900000000) + 'HU'
  );
  const [dispatching, setDispatching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = signedOriginalInHand && Boolean(dateSent) && Boolean(trackingNumber.trim());

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setDispatching(true);
    setError(null);
    try {
      const updated = await api.dispatchSubmit(caseItem.id, {
        signedScanFileName: signedScanName,
        signedOriginalInHand: true,
        dateSent,
        trackingNumber: trackingNumber.trim(),
        isClaimDispatch,
      });
      onSuccess(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch case');
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-[#1E2761]/20 p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1E2761] text-white flex items-center justify-center">
            <Send className="w-4 h-4 text-[#C9A24B]" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#1E2761]">
              {language === 'hu'
                ? isClaimDispatch ? 'NEAK-költségtérítési feladási ellenőrzőlista' : 'NEAK-feladási ellenőrzőlista (3 lépés)'
                : isClaimDispatch ? 'NEAK Reimbursement Claim Dispatch Checklist' : 'NEAK Dispatch Checklist (3 Ordered Steps)'}
            </h3>
            <p className="text-[11px] text-slate-500">
              {language === 'hu'
                ? 'Csak esetmenedzser által végezhető hivatalos postai feladás ajánlott küldeményként.'
                : 'Case manager duty: official postal dispatch by registered mail.'}
            </p>
          </div>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300">
          {language === 'hu'
            ? isClaimDispatch ? 'Költségtérítés feladásra kész' : 'NEAK-nak küldésre kész'
            : isClaimDispatch ? 'Claim ready to send to NEAK' : 'Ready to send to NEAK'}
        </span>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleDispatch} className="space-y-4">
        {/* Step 1: Signed form received */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#1E2761] text-white flex items-center justify-center text-[10px] font-bold">1</span>
              <span>{language === 'hu' ? '(a) Aláírt kérelem beérkezése' : '(a) Signed form received'}</span>
            </span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Step 1</span>
          </div>

          <div className="space-y-2 pl-7">
            <div className="flex items-center justify-between gap-3 text-xs bg-white p-2.5 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 truncate">
                <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-mono text-slate-700 truncate">{signedScanName}</span>
              </div>
              <label className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 cursor-pointer shrink-0 font-medium">
                {language === 'hu' ? 'Másik fájl' : 'Browse scan'}
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setSignedScanName(e.target.files[0].name);
                    }
                  }}
                />
              </label>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-800 font-semibold cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={signedOriginalInHand}
                onChange={(e) => setSignedOriginalInHand(e.target.checked)}
                className="w-4 h-4 rounded text-[#1E2761] focus:ring-[#1E2761] cursor-pointer"
              />
              <span className={signedOriginalInHand ? 'text-emerald-900 font-bold' : 'text-slate-700'}>
                {language === 'hu' ? 'Aláírt eredeti kézben (kötelező)' : 'signed original in hand (required)'}
              </span>
            </label>
          </div>
        </div>

        {/* Step 2: Mark as mailed */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#1E2761] text-white flex items-center justify-center text-[10px] font-bold">2</span>
              <span>{language === 'hu' ? '(b) Feladottként megjelölés' : '(b) Mark as mailed'}</span>
            </span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Step 2</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-7">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                {language === 'hu' ? 'Feladás dátuma *' : 'Date sent (required) *'}
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={dateSent}
                  onChange={(e) => setDateSent(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                {language === 'hu' ? 'Ajánlott küldemény ragszáma *' : 'Registered-mail tracking number *'}
              </label>
              <input
                type="text"
                required
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. RL123456789HU"
                className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Advance to Submitted */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-[11px] text-slate-500">
            {language === 'hu'
              ? isClaimDispatch
                ? '(c) Belső státusz: "Benyújtva a NEAK-hoz", a beteg szakasz "Kezelve" marad a döntésig.'
                : '(c) A szakasz "Benyújtva" lesz, a követő megjeleníti a feladási adatokat.'
              : isClaimDispatch
                ? '(c) Moves internal claim status to "Submitted to NEAK", patient-facing stage stays "Treated".'
                : '(c) Stage becomes "Submitted", tracker shows "Sent by registered mail on [date], tracking [number]".'}
          </div>

          <button
            type="submit"
            disabled={!canSubmit || dispatching}
            className="px-5 py-2.5 rounded-xl bg-[#1E2761] hover:bg-[#151B45] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4 text-[#C9A24B]" />
            <span>
              {dispatching
                ? (language === 'hu' ? 'Feladás rögzítése...' : 'Dispatching...')
                : isClaimDispatch
                ? (language === 'hu' ? 'Költségtérítés postázása és rögzítése' : 'Dispatch Claim to NEAK')
                : (language === 'hu' ? 'Feladás rögzítése és benyújtás' : 'Complete Dispatch & Submit')}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
