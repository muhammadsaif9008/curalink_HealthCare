import React, { useState } from 'react';
import { CaseItem } from '../types';
import { api } from '../services/api';
import { useI18n } from '../i18n';
import {
  Upload,
  Check,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowLeft,
  FileText,
  ShieldCheck,
  CheckCircle2,
  X,
} from 'lucide-react';

interface EvidenceGateWizardProps {
  caseItem: CaseItem;
  onClose: () => void;
  onSuccess: (updatedCase: CaseItem) => void;
}

export const EvidenceGateWizard: React.FC<EvidenceGateWizardProps> = ({
  caseItem,
  onClose,
  onSuccess,
}) => {
  const { language, t } = useI18n();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form states initialized with caseItem values or defaults
  const [monthsWaited, setMonthsWaited] = useState<number | string>(caseItem.monthsWaited ?? 14);
  const [scheduledDomesticDate, setScheduledDomesticDate] = useState<string>(
    caseItem.scheduledDomesticDate ?? '2027-08-15'
  );

  const [eesztFileName, setEesztFileName] = useState<string>(
    caseItem.eesztDocumentName || 'EESZT_Varolista_Kovacs_Laszlo_Ortopedia.pdf'
  );
  const [showWhyWeAsk, setShowWhyWeAsk] = useState<boolean>(false);

  const [doctorNoteFileName, setDoctorNoteFileName] = useState<string>(
    caseItem.doctorNoteFileName || 'Szakorvosi_Javaslat_Kovacs_Signed_Stamped.pdf'
  );
  const [conditionNotes, setConditionNotes] = useState<string>(
    caseItem.conditionNotes ||
      'Severe functional impairment, rest pain and immobility. Delay exceeds clinical threshold.'
  );

  const [doctorName, setDoctorName] = useState<string>(caseItem.doctorName || 'Dr. Kovács Péter');
  const [doctorLicense, setDoctorLicense] = useState<string>(
    caseItem.doctorLicense || 'MOK-HU-48192'
  );
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verifiedRegistryName, setVerifiedRegistryName] = useState<string | null>(
    caseItem.verification?.mokVerification?.passed ? (caseItem.verification.mokVerification.doctorName || caseItem.doctorName) : null
  );

  const [saving, setSaving] = useState<boolean>(false);

  const handleVerifyLicense = async () => {
    if (!doctorLicense) return;
    setIsVerifying(true);
    try {
      const res = await api.verifyMokLicense(doctorLicense);
      if (res.verified && res.doctor) {
        setVerifiedRegistryName(res.doctor.name);
        setDoctorName(res.doctor.name);
      } else {
        setVerifiedRegistryName(null);
      }
    } catch {
      setVerifiedRegistryName(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFinalSubmit = async () => {
    setSaving(true);
    try {
      const updated = await api.updateEvidence(caseItem.id, {
        monthsWaited: Number(monthsWaited),
        scheduledDomesticDate,
        eesztDocumentName: eesztFileName,
        doctorNoteFileName,
        conditionNotes,
        doctorName,
        doctorLicense,
      });
      onSuccess(updated);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in">
        {/* Header with Title and Close button */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-[#1E2761]">
              {language === 'hu' ? 'Orvosi Igazolás Ellenőrző (4 lépés)' : 'Evidence Gate Wizard'}
            </h3>
            <p className="text-xs text-slate-500">
              {caseItem.procedure} · {caseItem.patientName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slim Progress Indicator at Top */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-[#1E2761]">
              {language === 'hu' ? `${currentStep}. / 4 lépés` : `Step ${currentStep} of 4`}
            </span>
            <span className="text-[11px] text-slate-400">
              {currentStep === 1 && (language === 'hu' ? 'Várakozási idő' : 'How long have you waited?')}
              {currentStep === 2 && (language === 'hu' ? 'EESZT igazolás' : 'Upload your proof')}
              {currentStep === 3 && (language === 'hu' ? 'Orvosi szakvélemény' : 'Your doctor\'s note')}
              {currentStep === 4 && (language === 'hu' ? 'Orvos ellenőrzése' : 'Verify your doctor')}
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#1E2761] h-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[220px]">
          {/* STEP 1: How long have you waited? */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  {language === 'hu' ? 'Mennyi ideje várakozik belföldön?' : 'How long have you waited?'}
                </h4>
                <p className="text-xs text-slate-500">
                  {language === 'hu'
                    ? 'Adja meg a hazai várólistán eltöltött időt és a kitűzött időpontot.'
                    : 'Provide your domestic hospital waiting record details.'}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'hu'
                      ? 'Hazai várólistán már eltöltött hónapok száma'
                      : 'Months Already Waited on Domestic Waitlist'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="72"
                    required
                    value={monthsWaited}
                    onChange={(e) => setMonthsWaited(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E2761]"
                    placeholder="e.g. 14"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'hu'
                      ? 'Jelenleg kitűzött hazai műtéti időpont (ha van)'
                      : 'Current Scheduled Domestic Date (if set)'}
                  </label>
                  <input
                    type="date"
                    value={scheduledDomesticDate}
                    onChange={(e) => setScheduledDomesticDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E2761]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Upload your proof */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  {language === 'hu' ? 'Töltse fel az igazolást' : 'Upload your proof'}
                </h4>
                <p className="text-xs text-slate-500">
                  {language === 'hu'
                    ? 'Csatolja az EESZT várólista-kivonatot vagy kórházi előjegyzési lapot.'
                    : 'Upload your official waitlist record from the EESZT portal.'}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'hu'
                      ? 'EESZT Várólista Igazolás Dokumentum'
                      : 'EESZT Waitlist Proof Document'}
                  </label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 bg-slate-50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-5 h-5 text-[#1E2761] shrink-0" />
                      <span className="text-xs text-slate-700 font-medium truncate">
                        {eesztFileName}
                      </span>
                    </div>
                    <label className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium hover:bg-slate-50 text-slate-700 cursor-pointer shrink-0">
                      {language === 'hu' ? 'Tallózás...' : 'Browse...'}
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            setEesztFileName(e.target.files[0].name);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {language === 'hu'
                      ? 'Töltse fel az EESZT felületéről letöltött várólista igazolást PDF vagy kép formátumban.'
                      : 'Upload your EESZT waitlist record as proof — automatic verification will be possible once we\'re a certified integration partner.'}
                  </span>
                </div>

                {/* Collapsed expandable section "Why we ask this" */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowWhyWeAsk(!showWhyWeAsk)}
                    className="flex items-center gap-1.5 text-xs text-[#1E2761] font-medium hover:underline cursor-pointer"
                  >
                    <span>{language === 'hu' ? 'Miért kérjük ezt? (Jogi háttér)' : 'Why we ask this'}</span>
                    {showWhyWeAsk ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {showWhyWeAsk && (
                    <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 leading-relaxed animate-in fade-in">
                      {language === 'hu'
                        ? 'A 883/2004/EK uniós rendelet és az Európai Unió Bíróságának ítéletei (C-372/04 Watts-ügy) alapján a NEAK csak akkor utasíthatja el a külföldi ellátás engedélyezését, ha az adott beavatkozás belföldön orvosilag indokolható időn belül elvégezhető. Az EESZT igazolás a hivatalos bizonyíték arra, hogy a várakozási idő ezt túllépi.'
                        : 'Under Article 20 of EU Regulation 883/2004 and Court of Justice case law (Case C-372/04 Watts), NEAK cannot refuse pre-approval if the treatment cannot be provided domestically within a medically justifiable time limit based on your clinical assessment. The uploaded EESZT document establishes official objective proof of this delay.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Your doctor's note */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  {language === 'hu' ? 'A kezelőorvos igazolása' : 'Your doctor\'s note'}
                </h4>
                <p className="text-xs text-slate-500">
                  {language === 'hu'
                    ? 'Csatolja az aláírt, lepecsételt orvosi igazolást és adja meg a rövid leírást.'
                    : 'Upload the signed and stamped doctor\'s note and provide condition details.'}
                </p>
              </div>

              <div className="space-y-3">
                {/* Doctor Note File Upload */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'hu'
                      ? 'Aláírt és lepecsételt orvosi igazolás feltöltése'
                      : 'Signed & Stamped Doctor\'s Note Document'}
                  </label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 bg-slate-50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-5 h-5 text-[#1E2761] shrink-0" />
                      <span className="text-xs text-slate-700 font-medium truncate">
                        {doctorNoteFileName}
                      </span>
                    </div>
                    <label className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium hover:bg-slate-50 text-slate-700 cursor-pointer shrink-0">
                      {language === 'hu' ? 'Tallózás...' : 'Browse...'}
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            setDoctorNoteFileName(e.target.files[0].name);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {language === 'hu'
                      ? 'Pecséttel és működési nyilvántartási számmal ellátott szakorvosi javaslat.'
                      : 'Signed and stamped medical note from your specialist or treating physician.'}
                  </span>
                </div>

                {/* Condition Severity Notes as Caption */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'hu'
                      ? 'Klinikai állapot súlyossága és leírás (a feltöltött fájl összefoglalása)'
                      : 'Clinical Condition Severity & Doctor Notes (caption/description of file)'}
                  </label>
                  <textarea
                    rows={3}
                    value={conditionNotes}
                    onChange={(e) => setConditionNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E2761]"
                    placeholder="Brief description of pain, functional impairment, or clinical severity..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Verify your doctor */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  {language === 'hu' ? 'Kezelőorvos kamarai azonosítása' : 'Verify your doctor'}
                </h4>
                <p className="text-xs text-slate-500">
                  {language === 'hu'
                    ? 'Ellenőrizze orvosa érvényes kamarai nyilvántartási számát.'
                    : 'Check your doctor\'s registration in the Hungarian Medical Chamber (MOK) registry.'}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'hu' ? 'Kezelőorvos neve' : 'Doctor Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E2761]"
                    placeholder="e.g. Dr. Kovács Péter"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'hu' ? 'MOK / Orvosi Nyilvántartási Szám' : 'MOK License Number'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={doctorLicense}
                      onChange={(e) => {
                        setDoctorLicense(e.target.value);
                        setVerifiedRegistryName(null);
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E2761] font-mono uppercase"
                      placeholder="MOK-HU-48192"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyLicense}
                      disabled={isVerifying || !doctorLicense}
                      className="px-4 py-2 bg-[#1E2761] hover:bg-[#151B45] text-white text-xs font-semibold rounded-lg shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      {isVerifying ? (language === 'hu' ? 'Keresés...' : 'Verifying...') : (language === 'hu' ? 'Ellenőrzés' : 'Verify')}
                    </button>
                  </div>
                </div>

                {/* Quiet inline checkmark and disclaimer */}
                {verifiedRegistryName ? (
                  <div className="pt-2 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        {language === 'hu'
                          ? `A ${doctorLicense} nyilvántartási szám aktív és regisztrált (${verifiedRegistryName}).`
                          : `License number ${doctorLicense} is active and registered to ${verifiedRegistryName}`}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      {language === 'hu'
                        ? 'Ez megerősíti, hogy a működési nyilvántartási szám valós és érvényes. Nem erősíti meg, hogy ezt a konkrét igazolást ez az orvos írta — ezt orvosszakértőnk ellenőrzi.'
                        : 'This confirms the license is real and active. It does not confirm this doctor wrote this note — that\'s part of our advisor review.'}
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 pt-1">
                    {language === 'hu'
                      ? 'Kattintson az Ellenőrzés gombra a kamarai státusz megtekintéséhez.'
                      : 'Click Verify to check the Medical Chamber license database.'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation: Back & Next / Submit buttons */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{language === 'hu' ? 'Vissza' : 'Back'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-500 hover:bg-slate-50 cursor-pointer"
              >
                {language === 'hu' ? 'Mégse' : 'Cancel'}
              </button>
            )}
          </div>

          <div>
            {currentStep < 4 ? (
              <button
                type="button"
                disabled={
                  (currentStep === 1 && (monthsWaited === '' || Number(monthsWaited) < 0)) ||
                  (currentStep === 2 && !eesztFileName) ||
                  (currentStep === 3 && !doctorNoteFileName)
                }
                onClick={() => setCurrentStep((prev) => (prev + 1) as any)}
                className="px-5 py-2 rounded-lg bg-[#1E2761] hover:bg-[#151B45] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                <span>{language === 'hu' ? 'Tovább' : 'Next'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={saving || !doctorLicense}
                onClick={handleFinalSubmit}
                className="px-6 py-2 rounded-lg bg-[#C9A24B] hover:bg-[#b8913d] text-[#1E2761] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-40"
              >
                <span>
                  {saving
                    ? (language === 'hu' ? 'Mentés...' : 'Saving...')
                    : (language === 'hu' ? 'Bizonyíték Csomag Mentése' : 'Submit Evidence')}
                </span>
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
