import React, { useState } from 'react';
import { CaseItem } from '../types';
import { useI18n } from '../i18n';
import { api } from '../services/api';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Upload,
  Calendar,
  Hash,
  FileText,
  Coins,
} from 'lucide-react';

interface RecordNeakDecisionPanelProps {
  caseItem: CaseItem;
  onSuccess: (updated: CaseItem) => void;
  onCancel?: () => void;
  isModal?: boolean;
}

export const RecordNeakDecisionPanel: React.FC<RecordNeakDecisionPanelProps> = ({
  caseItem,
  onSuccess,
  onCancel,
  isModal = false,
}) => {
  const { language } = useI18n();
  const isHu = language === 'hu';

  const todayStr = new Date().toISOString().split('T')[0];

  const isDirective = caseItem.branch === 'NonPA';

  // Form states
  const [decision, setDecision] = useState<'Authorised' | 'Rejected' | 'Still pending'>('Authorised');
  const [decisionDate, setDecisionDate] = useState<string>(todayStr);
  const [referenceNumber, setReferenceNumber] = useState<string>(
    caseItem.referenceNumber || (isDirective ? 'NEAK-CLAIM-2026/DIR-881' : 'NEAK-883-2026/S2-491')
  );
  const [decisionLetterName, setDecisionLetterName] = useState<string>(
    isDirective ? 'NEAK_Koltsegteritesi_Hatarozat.pdf' : 'NEAK_Hatarozat_S2_Engedely.pdf'
  );
  const [reimbursementAmount, setReimbursementAmount] = useState<string>(
    caseItem.reimbursementAmount || '480 000 Ft'
  );
  const [notes, setNotes] = useState<string>(
    isDirective
      ? (isHu
          ? 'A NEAK Nemzetközi Főosztály határozata beérkezett, a 2011/24/EU irányelv szerinti utólagos költségtérítés jóváhagyva.'
          : 'Official decision received from NEAK International Affairs Department. Post-treatment reimbursement claim approved.')
      : (isHu
          ? 'A NEAK Nemzetközi Főosztály határozata beérkezett, az S2 engedély kiadása megerősítve.'
          : 'Official decision received from NEAK International Affairs Department. S2 prior authorisation issued.')
  );

  // Travel support options (for Authorised S2)
  const [travelSupportDecision, setTravelSupportDecision] = useState<'not_requested' | 'not_granted' | 'granted'>(
    caseItem.travelSupportDecision || 'granted'
  );
  const [travelSupportAmount, setTravelSupportAmount] = useState<string>(
    caseItem.travelSupportAmount || '45 000 Ft'
  );
  const [travelSupportTiming, setTravelSupportTiming] = useState<'before_travel' | 'after_travel'>(
    caseItem.travelSupportTiming || 'before_travel'
  );

  // Rejection grounds (for Rejected)
  const [rejectionReason, setRejectionReason] = useState<string>(
    caseItem.rejectionReason ||
      (isDirective
        ? (isHu
            ? 'A NEAK megtagadta az utólagos költségtérítést hiányzó adminisztratív vagy biztosítási hivatkozásra támaszkodva.'
            : 'NEAK refused reimbursement claim under Directive 2011/24/EU.')
        : (isHu
            ? 'A NEAK elutasította a kérelmet elméleti hazai kórházi kapacitásra hivatkozva (1997. évi LXXXIII. tv.).'
            : 'NEAK refused authorisation citing theoretical domestic hospital capacity availability.'))
  );

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDecisionChange = (newDecision: 'Authorised' | 'Rejected' | 'Still pending') => {
    setDecision(newDecision);
    if (newDecision === 'Authorised') {
      setNotes(
        isDirective
          ? (isHu
              ? 'A NEAK Nemzetközi Főosztály határozata beérkezett, a 2011/24/EU irányelv szerinti utólagos költségtérítés jóváhagyva.'
              : 'Official decision received from NEAK International Affairs Department. Post-treatment reimbursement claim approved.')
          : (isHu
              ? 'A NEAK Nemzetközi Főosztály határozata beérkezett, az S2 engedély kiadása megerősítve.'
              : 'Official decision received from NEAK International Affairs Department. S2 prior authorisation issued.')
      );
      if (!decisionLetterName) {
        setDecisionLetterName(isDirective ? 'NEAK_Koltsegteritesi_Hatarozat.pdf' : 'NEAK_Hatarozat_S2_Engedely.pdf');
      }
    } else if (newDecision === 'Rejected') {
      setNotes(
        isDirective
          ? (isHu
              ? 'A NEAK elutasította az utólagos költségtérítési kérelmet. SOLVIT jogorvoslati beadvány előkészítve.'
              : 'NEAK refused reimbursement claim. SOLVIT appeal brief drafted.')
          : (isHu
              ? 'A NEAK elutasította az S2 engedélyt belföldi kapacitásra hivatkozva. SOLVIT jogorvoslati beadvány előkészítve.'
              : 'NEAK refused S2 authorisation citing domestic capacity. SOLVIT appeal brief drafted.')
      );
      if (!decisionLetterName) setDecisionLetterName('NEAK_Elutasito_Hatarozat.pdf');
    } else {
      setNotes(
        isHu
          ? 'Telefonos egyeztetés az illetékes NEAK ügyintézővel: az eljárás folyamatban, orvosi szakvéleményre várnak.'
          : 'Phone follow-up with NEAK desk officer: application remains under active evaluation.'
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate required fields
    if (!referenceNumber.trim()) {
      setErrorMessage(
        isHu
          ? 'A NEAK iktatószám / hivatkozási szám megadása kötelező!'
          : 'NEAK reference number is required.'
      );
      return;
    }

    if ((decision === 'Authorised' || decision === 'Rejected') && !decisionLetterName.trim()) {
      setErrorMessage(
        isHu
          ? 'A hivatalos határozat feltöltése / megnevezése kötelező engedélyezés vagy elutasítás esetén!'
          : 'Official decision letter scan is required for Authorised or Rejected decisions.'
      );
      return;
    }

    if (isDirective && decision === 'Authorised' && !reimbursementAmount.trim()) {
      setErrorMessage(
        isHu
          ? 'A megtérített összeg megadása kötelező!'
          : 'Reimbursement amount is required.'
      );
      return;
    }

    if (!notes.trim()) {
      setErrorMessage(isHu ? 'Kérjük, adjon meg feljegyzést!' : 'Notes field is required.');
      return;
    }

    setSaving(true);
    try {
      const updated = await api.updateNeakFollowUp(caseItem.id, {
        decisionDate,
        callDate: decisionDate,
        referenceNumber: referenceNumber.trim(),
        decision,
        outcome: decision,
        notes: notes.trim(),
        decisionLetterName: decisionLetterName.trim() || undefined,
        travelSupportDecision: !isDirective && decision === 'Authorised' ? travelSupportDecision : undefined,
        travelSupportAmount:
          !isDirective && decision === 'Authorised' && travelSupportDecision === 'granted'
            ? travelSupportAmount.trim()
            : undefined,
        travelSupportTiming:
          !isDirective && decision === 'Authorised' && travelSupportDecision === 'granted'
            ? travelSupportTiming
            : undefined,
        rejectionReason: decision === 'Rejected' ? rejectionReason.trim() : undefined,
        reimbursementAmount: isDirective && decision === 'Authorised' ? reimbursementAmount.trim() : undefined,
      });

      onSuccess(updated);
      if (onCancel) {
        onCancel();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save NEAK decision');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      id="record-neak-decision-panel"
      className={`bg-white rounded-2xl border-2 border-[#1E2761]/30 p-6 sm:p-7 shadow-sm transition-all duration-300 ${
        isModal ? '' : 'my-4'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1E2761] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Award className="w-5 h-5 text-[#C9A24B]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#1E2761]">
                {isDirective
                  ? (isHu ? 'NEAK-költségtérítési döntés rögzítése' : 'Record NEAK Reimbursement Decision')
                  : (isHu ? 'NEAK-döntés rögzítése' : 'Record NEAK decision')}
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                {isHu ? 'Esetmenedzser feladat' : 'Case Manager Duty'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isDirective
                ? (isHu
                    ? 'Rögzítse a NEAK Nemzetközi Főosztály hivatalos döntését a 2011/24/EU szerinti utólagos költségtérítésről.'
                    : 'Log official outcome from NEAK International Affairs Department regarding post-treatment reimbursement claim.')
                : (isHu
                    ? 'Rögzítse a NEAK Nemzetközi Főosztály hivatalos döntését az S2 előzetes engedélyről.'
                    : 'Log official outcome from NEAK International Affairs Department regarding S2 prior authorisation.')}
            </p>
          </div>
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            type="button"
            className="text-xs text-slate-400 hover:text-slate-700 px-2 py-1 rounded cursor-pointer self-start sm:self-auto"
          >
            ✕ {isHu ? 'Bezárás' : 'Close'}
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {/* 1. Decision selection: 3 pills (Authorised / Rejected / Still pending) */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
            {isHu ? 'NEAK döntési eredmény' : 'Decision'} <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Authorised / Reimbursed */}
            <button
              type="button"
              onClick={() => handleDecisionChange('Authorised')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                decision === 'Authorised'
                  ? 'border-emerald-600 bg-emerald-50/90 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    {isDirective
                      ? (isHu ? 'Jóváhagyva (Reimbursed)' : 'Reimbursed (Approved)')
                      : (isHu ? 'Engedélyezve (Authorised)' : 'Authorised')}
                  </span>
                </span>
                {decision === 'Authorised' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                {isDirective
                  ? (isHu ? 'Költségtérítés jóváhagyva, átlép Reimbursed szakaszba' : 'Reimbursement approved; moves case to Reimbursed')
                  : (isHu ? 'Teljesíti a döntési lépést, S2 engedély kiadva' : 'Completes NEAK decision step; moves case to Authorised')}
              </p>
            </button>

            {/* Rejected */}
            <button
              type="button"
              onClick={() => handleDecisionChange('Rejected')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                decision === 'Rejected'
                  ? 'border-rose-600 bg-rose-50/90 text-rose-950 ring-2 ring-rose-500/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs flex items-center gap-1.5 text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>{isHu ? 'Elutasítva (Rejected)' : 'Rejected'}</span>
                </span>
                {decision === 'Rejected' && (
                  <span className="w-2 h-2 rounded-full bg-rose-600" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                {isHu
                  ? 'Elutasítottként jelöli, megnyitja a SOLVIT vitarendezést'
                  : 'Marks rejected & opens SOLVIT appeal draft'}
              </p>
            </button>

            {/* Still pending */}
            <button
              type="button"
              onClick={() => handleDecisionChange('Still pending')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                decision === 'Still pending'
                  ? 'border-blue-600 bg-blue-50/90 text-blue-950 ring-2 ring-blue-500/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs flex items-center gap-1.5 text-blue-800">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>{isHu ? 'Folyamatban (Still pending)' : 'Still pending'}</span>
                </span>
                {decision === 'Still pending' && (
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                {isDirective
                  ? (isHu ? 'Csak a feljegyzést menti, a kérelem folyamatban' : 'Logs follow-up note; claim remains pending')
                  : (isHu ? 'Csak a feljegyzést menti, az állapot változatlan marad' : 'Logs follow-up note; case remains Submitted')}
              </p>
            </button>
          </div>
        </div>

        {/* 2. Decision Date & NEAK Reference Number */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#1E2761]" />
              <span>{isHu ? 'Döntés / Hívás dátuma' : 'Decision Date'}</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={decisionDate}
              onChange={(e) => setDecisionDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E2761] bg-white font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-[#1E2761]" />
              <span>{isHu ? 'NEAK iktatószám / Hivatkozás' : 'NEAK Reference Number'}</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="NEAK-883-2026/S2-491"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E2761] bg-white font-mono"
            />
          </div>
        </div>

        {/* 3. Upload Decision Letter (Required for Authorised or Rejected) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Upload className="w-3.5 h-3.5 text-[#1E2761]" />
              <span>{isHu ? 'Határozat másolat feltöltése' : 'Decision Letter Scan'}</span>
              {(decision === 'Authorised' || decision === 'Rejected') && (
                <span className="text-rose-500">*</span>
              )}
            </span>
            <span className="text-[11px] text-slate-400 font-normal">
              {decision === 'Still pending'
                ? isHu
                  ? '(Csak engedély vagy elutasítás esetén kötelező)'
                  : '(Optional for Still pending)'
                : isHu
                ? '(Kötelező mező)'
                : '(Required)'}
            </span>
          </label>

          <div className="border border-dashed border-slate-300 rounded-xl p-3 bg-slate-50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 truncate">
              <FileText className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="text-xs text-slate-700 truncate font-mono">
                {decisionLetterName || (isHu ? 'Nincs fájl kiválasztva' : 'No document selected')}
              </span>
            </div>

            <label className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg hover:bg-slate-100 font-semibold cursor-pointer text-slate-700 shrink-0 shadow-2xs">
              {isHu ? 'Feltöltés / Tallózás' : 'Browse'}
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setDecisionLetterName(e.target.files[0].name);
                  }
                }}
              />
            </label>
          </div>
        </div>

        {/* 4. Directive Reimbursement Amount Section */}
        {decision === 'Authorised' && isDirective && (
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3 animate-in fade-in">
            <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-[#C9A24B]" />
              <span>{isHu ? 'Megtérített összeg rögzítése' : 'Reimbursement Amount Record'}</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {isHu ? 'Kifizetett megtérítés összege' : 'Reimbursement Amount'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={reimbursementAmount}
                onChange={(e) => setReimbursementAmount(e.target.value)}
                placeholder={isHu ? 'pl. 480 000 Ft' : 'e.g. 480,000 HUF'}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-semibold"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                {isHu
                  ? 'A NEAK által jóváhagyott és a páciens számlájára átutalt hivatalos összeg.'
                  : 'Official amount approved and transferred by NEAK to the patient.'}
              </p>
            </div>
          </div>
        )}

        {/* 4b. S2 Travel Support Section (If Authorised and S2) */}
        {decision === 'Authorised' && !isDirective && (
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3 animate-in fade-in">
            <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-[#C9A24B]" />
              <span>{isHu ? 'Utazási támogatási döntés rögzítése' : 'Travel Support Decision Record'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {isHu ? 'Támogatási döntés' : 'Travel Support'}
                </label>
                <select
                  value={travelSupportDecision}
                  onChange={(e) => setTravelSupportDecision(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="granted">{isHu ? 'Megítélve (Granted)' : 'Granted'}</option>
                  <option value="not_granted">{isHu ? 'Nem megítélt (Not granted)' : 'Not granted'}</option>
                  <option value="not_requested">{isHu ? 'Nem kért (Not requested)' : 'Not requested'}</option>
                </select>
              </div>

              {travelSupportDecision === 'granted' && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {isHu ? 'Összeg' : 'Amount'}
                    </label>
                    <input
                      type="text"
                      required
                      value={travelSupportAmount}
                      onChange={(e) => setTravelSupportAmount(e.target.value)}
                      placeholder="45,000 HUF"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {isHu ? 'Kifizetés ütemezése' : 'Timing'}
                    </label>
                    <select
                      value={travelSupportTiming}
                      onChange={(e) => setTravelSupportTiming(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="before_travel">{isHu ? 'Utazás előtt' : 'Before travel'}</option>
                      <option value="after_travel">{isHu ? 'Utazás után' : 'After travel'}</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* 5. Rejection Grounds (If Rejected) */}
        {decision === 'Rejected' && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2 animate-in fade-in">
            <label className="block text-xs font-bold text-rose-900">
              {isHu
                ? 'Hivatalos elutasítási indoklás (automatikusan a SOLVIT kérelembe kerül)'
                : 'NEAK Refusal Grounds (feeds into SOLVIT appeal draft)'}{' '}
              <span className="text-rose-600">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-rose-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 font-sans leading-relaxed"
            />
          </div>
        )}

        {/* 6. Notes Field */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
            <span>{isHu ? 'Műveleti és határozati feljegyzések' : 'Notes'}</span>
            <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            required
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E2761] font-sans leading-relaxed"
            placeholder={
              isHu
                ? 'Rögzítse az ügyintézői egyeztetést, határozat részleteit és a következő lépéseket...'
                : 'Enter call details, officer remarks, and operational next steps...'
            }
          />
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              {isHu ? 'Mégse' : 'Cancel'}
            </button>
          )}

          <button
            type="submit"
            disabled={saving}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
              decision === 'Authorised'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : decision === 'Rejected'
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-[#1E2761] hover:bg-[#151B45]'
            }`}
          >
            {saving ? (
              <span>{isHu ? 'Mentés folyamatban...' : 'Saving...'}</span>
            ) : (
              <>
                <Award className="w-4 h-4" />
                <span>
                  {decision === 'Authorised'
                    ? isDirective
                      ? isHu ? 'Döntés rögzítése: Megtérítve (Reimbursed)' : 'Record Decision: Reimbursed'
                      : isHu ? 'Döntés rögzítése: Engedély kiadva' : 'Record Decision: Authorised'
                    : decision === 'Rejected'
                    ? isHu
                      ? 'Elutasítás rögzítése & SOLVIT indítása'
                      : 'Record Decision: Rejected (Open SOLVIT)'
                    : isHu
                    ? 'Egyeztetés rögzítése (Folyamatban)'
                    : 'Record Follow-up (Still pending)'}
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
