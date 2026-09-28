import React, { useState, useEffect } from 'react';
import { TreatmentRule, Clinic, ApplicantRole, CaseItem, UserProfile, isCaseActive, isTerminalCase } from '../types';
import { api } from '../services/api';
import { useI18n } from '../i18n';
import {
  FileText,
  Upload,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Building2,
  User,
  Info,
  ChevronDown,
  ChevronUp,
  Check,
  ExternalLink,
} from 'lucide-react';

interface NewCasePageProps {
  rules: TreatmentRule[];
  clinics: Clinic[];
  cases: CaseItem[];
  currentUser: UserProfile | null;
  onCaseCreated: (newCase: CaseItem) => void;
  onNavigate: (tab: string, caseId?: string) => void;
}

export const NewCasePage: React.FC<NewCasePageProps> = ({
  rules,
  clinics,
  cases,
  currentUser,
  onCaseCreated,
  onNavigate,
}) => {
  const { language, t } = useI18n();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // If staff role (advisor or case manager), allow selecting which patient
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    currentUser?.role === 'patient' ? (currentUser?.id || 'user-patient-01') : 'user-patient-01'
  );

  // Form Fields - initialized to patient's real credentials when available
  const [patientName, setPatientName] = useState(currentUser?.name || 'Kovács László');
  const [tajNumber, setTajNumber] = useState(currentUser?.tajDemo || '042-881-934');
  const [applicantRole, setApplicantRole] = useState<ApplicantRole>('patient');
  const [procedure, setProcedure] = useState(rules[1]?.procedure || 'Knee replacement');

  const [monthsWaited, setMonthsWaited] = useState<number | string>(16);
  const [scheduledDomesticDate, setScheduledDomesticDate] = useState('2027-10-20');
  const [eesztFileName, setEesztFileName] = useState('EESZT_Varolista_Igazolas_2026.pdf');
  const [showWhyWaitlist, setShowWhyWaitlist] = useState(false);

  const [hasEhic, setHasEhic] = useState(true);
  const [requestTravelCost, setRequestTravelCost] = useState(true);
  const [travelCompanion, setTravelCompanion] = useState(true);
  const [selectedClinicId, setSelectedClinicId] = useState(clinics[1]?.id || 'clinic-akh-vienna');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedCase, setSubmittedCase] = useState<CaseItem | null>(null);

  // Sync patient name/TAJ if currentUser changes
  useEffect(() => {
    if (currentUser?.role === 'patient') {
      setSelectedPatientId(currentUser.id);
      setPatientName(currentUser.name);
      setTajNumber(currentUser.tajDemo || '042-881-934');
    }
  }, [currentUser]);

  // Determine active case for this patient
  const targetPatientId = currentUser?.role === 'patient' ? currentUser.id : selectedPatientId;
  const targetPatientName = currentUser?.role === 'patient' ? currentUser.name : patientName;

  const patientCases = (cases || []).filter((c) => {
    if (currentUser?.role === 'patient') {
      return (
        c.userId === currentUser.id ||
        c.patientName.trim().toLowerCase() === currentUser.name.trim().toLowerCase() ||
        (currentUser.tajDemo && c.tajNumber.trim() === currentUser.tajDemo.trim())
      );
    }
    // When staff role, match selected patient id or current patientName field
    return (
      c.userId === targetPatientId ||
      c.patientName.trim().toLowerCase() === targetPatientName.trim().toLowerCase()
    );
  });

  // Find any active (non-terminal) case
  const activeCase = patientCases.find((c) => isCaseActive(c));

  // Active procedure rule determination
  const selectedRule = rules.find((r) => r.procedure === procedure) || rules[0];
  const requiresPA = selectedRule?.requiresPA ?? true;
  const branch = requiresPA ? 'PA' : 'NonPA';

  // Filter clinics based on branch
  const filteredClinics = clinics.filter((c) => {
    const procedureMatch = c.procedures.some((p) =>
      p.toLowerCase().includes(procedure.toLowerCase())
    );
    if (!procedureMatch) return false;
    if (branch === 'PA') {
      return c.providerType === 'public' || c.routeType === 'S2';
    }
    return true;
  });

  const handlePreFillScenario = (type: 'knee' | 'cataract') => {
    if (type === 'knee') {
      setProcedure('Knee replacement');
      setMonthsWaited(16);
      setScheduledDomesticDate('2027-10-20');
      setHasEhic(true);
      setRequestTravelCost(true);
      setTravelCompanion(true);
      setEesztFileName('EESZT_Varolista_Kovacs_Istvan_Ortopedia.pdf');
      setSelectedClinicId('clinic-akh-vienna');
    } else {
      setProcedure('Cataract surgery');
      setMonthsWaited(10);
      setScheduledDomesticDate('2026-12-10');
      setHasEhic(true);
      setRequestTravelCost(false);
      setTravelCompanion(false);
      setEesztFileName('EESZT_Szemeszet_Elojegyzes_Horvath.pdf');
      setSelectedClinicId('clinic-bratislava-eye');
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (activeCase) {
      setErrorMsg(
        `You already have an active case in progress — ${activeCase.procedure}, currently at ${activeCase.currentStage}.`
      );
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);

    try {
      const created = await api.createCase({
        patientName,
        tajNumber,
        applicantRole,
        procedure,
        monthsWaited: Number(monthsWaited),
        scheduledDomesticDate,
        conditionNotes: '',
        hasEhic,
        requestTravelCost,
        travelCompanion,
        eesztDocumentName: eesztFileName,
        selectedClinicId,
      });

      setSubmittedCase(created);
      onCaseCreated(created);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit case');
      setSubmitting(false);
    }
  };

  const plainPathName = branch === 'PA' ? t('path.pa') : t('path.nonPa');
  const plainPathDesc = branch === 'PA' ? t('path.pa.desc') : t('path.nonPa.desc');

  // =========================================================================
  // REQUIREMENT 1:
  // After the patient submits, show: "Your case has been sent to a CuraLink
  // medical advisor for clinical review. You don't need to visit your own doctor."
  // =========================================================================
  if (submittedCase) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 animate-in fade-in">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button
            onClick={() => onNavigate('dashboard')}
            className="hover:text-slate-800 cursor-pointer font-medium"
          >
            ← {t('nav.myCases')}
          </button>
          <span>/</span>
          <span className="font-semibold text-slate-700">Submission Confirmation</span>
        </div>

        {/* Confirmation Card */}
        <div className="bg-white rounded-2xl border border-emerald-300 shadow-xl p-6 sm:p-10 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center shadow-inner">
            <CheckCircle2 className="w-8 h-8 text-emerald-700" />
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-950 text-xs font-bold uppercase tracking-wider border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
              <span>Awaiting Advisor Review</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              Your case has been sent to a CuraLink medical advisor for clinical review. You don&apos;t need to visit your own doctor.
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
              A licensed CuraLink healthcare advisor is now reviewing your EESZT waitlist proof and documented wait time. Once verified, the advisor signs the medical attestation and unlocks your official NEAK application documents.
            </p>
          </div>

          {/* Details Snippet */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2.5">
            <div className="flex justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-500">Scheduled Procedure:</span>
              <strong className="text-[#1E2761] font-bold">{submittedCase.procedure}</strong>
            </div>
            <div className="flex justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-500">Documented Domestic Wait:</span>
              <strong className="text-slate-900">{submittedCase.monthsWaited} months</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">EESZT Waitlist Proof:</span>
              <strong className="font-mono text-slate-700 truncate max-w-[200px]">{submittedCase.eesztDocumentName}</strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('case-detail', submittedCase.id)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#1E2761] hover:bg-[#151B45] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>View Case Tracker & Status</span>
              <ArrowRight className="w-4 h-4 text-[#C9A24B]" />
            </button>

            <button
              onClick={() => onNavigate('dashboard')}
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
            >
              Go to My Cases
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // CRITICAL REQUIREMENT:
  // Before showing the "New Case" intake form, check whether this patient
  // already has a case in any status other than a terminal one.
  // If an active case exists, DO NOT show the intake form.
  // Instead show the exact message and a button to go to that case's detail page.
  // =========================================================================
  if (activeCase) {
    const blockingMessage =
      language === 'hu'
        ? `Már van egy aktív folyamatban lévő ügye — ${activeCase.procedure}, jelenleg ${activeCase.currentStage} státuszban.`
        : `You already have an active case in progress — ${activeCase.procedure}, currently at ${activeCase.currentStage}.`;

    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 animate-in fade-in">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button
            onClick={() => onNavigate('dashboard')}
            className="hover:text-slate-800 cursor-pointer font-medium"
          >
            ← {t('nav.myCases')}
          </button>
          <span>/</span>
          <span className="font-semibold text-slate-700">{t('nav.newCase')}</span>
        </div>

        {/* Blocking Active Case Card */}
        <div className="bg-white rounded-2xl border border-amber-300 shadow-xl p-6 sm:p-10 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-900 mx-auto flex items-center justify-center shadow-inner">
            <AlertCircle className="w-8 h-8 text-amber-700" />
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-950 text-xs font-bold uppercase tracking-wider border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
              <span>{t('activeCase.blockingTitle')}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              {blockingMessage}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
              {t('activeCase.blockingExplanation')}
            </p>
          </div>

          {/* Active Case Details Snippet */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-3 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">
                  {language === 'hu' ? 'Folyamatban lévő beavatkozás' : 'Active Procedure'}
                </span>
                <span className="text-base font-bold text-[#1E2761]">
                  {activeCase.procedure}
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-900 border border-blue-200 self-start sm:self-auto">
                <Clock className="w-3.5 h-3.5" />
                <span>{activeCase.currentStage}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
              <div>
                <span className="text-slate-500">{language === 'hu' ? 'Beteg neve:' : 'Patient:'}</span>{' '}
                <strong className="text-slate-900">{activeCase.patientName}</strong>
              </div>
              {activeCase.referenceNumber && (
                <div>
                  <span className="text-slate-500">{language === 'hu' ? 'Iktatószám:' : 'Reference:'}</span>{' '}
                  <strong className="font-mono text-slate-900">{activeCase.referenceNumber}</strong>
                </div>
              )}
              <div>
                <span className="text-slate-500">{language === 'hu' ? 'Igazolt várakozás:' : 'Documented Wait:'}</span>{' '}
                <strong className="text-slate-900">{activeCase.monthsWaited} {language === 'hu' ? 'hónap' : 'months'}</strong>
              </div>
              <div>
                <span className="text-slate-500">{language === 'hu' ? 'Kezelőorvos:' : 'Doctor:'}</span>{' '}
                <strong className="text-slate-900">{activeCase.doctorName}</strong>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('case-detail', activeCase.id)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#1E2761] hover:bg-[#151B45] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t('activeCase.goToCaseBtn')}</span>
              <ArrowRight className="w-4 h-4 text-[#C9A24B]" />
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
            >
              {t('activeCase.viewAllCasesBtn')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // When no active case exists, show the full 4-step intake form:
  // =========================================================================
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Quick Pre-fills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-[#1E2761]">
            {t('intake.title')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('intake.subtitle')}
          </p>
        </div>

        {/* Quick Demo Pre-fill Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-500">
            {language === 'hu' ? 'Gyors kitöltés:' : 'Presets:'}
          </span>
          <button
            type="button"
            onClick={() => handlePreFillScenario('knee')}
            className="px-2.5 py-1.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-medium transition-colors cursor-pointer"
          >
            {language === 'hu' ? 'Térd (Előzetes)' : 'Knee (Fast-track)'}
          </button>
          <button
            type="button"
            onClick={() => handlePreFillScenario('cataract')}
            className="px-2.5 py-1.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-medium transition-colors cursor-pointer"
          >
            {language === 'hu' ? 'Szürkehályog (Utólagos)' : 'Cataract (Claim)'}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Slim Progress Indicator (Step X of 4) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-[#1E2761]">
            {language === 'hu' ? `${currentStep}. / 3 lépés` : `Step ${currentStep} of 3`}
          </span>
          <span className="text-slate-500 font-medium">
            {currentStep === 1 && t('intake.step1')}
            {currentStep === 2 && t('intake.step2')}
            {currentStep === 3 && t('intake.step3')}
          </span>
        </div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#1E2761] h-full transition-all duration-300"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Guided Wizard Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        {/* SCREEN 1: What treatment do you need? */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-[#1E2761]">
                {t('intake.step1')}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'hu'
                  ? 'Válassza ki a szükséges beavatkozást és adja meg a kérelmező adatait.'
                  : 'Select your scheduled surgery or procedure and confirm patient details.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'hu' ? 'Beteg teljes neve' : 'Patient Full Name'}
                </label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E2761]"
                  placeholder="e.g. Kovács László"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'hu' ? 'TAJ szám' : 'TAJ Number (Demo Placeholder)'}
                </label>
                <input
                  type="text"
                  required
                  value={tajNumber}
                  onChange={(e) => setTajNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E2761]"
                  placeholder="000-000-000"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'hu' ? 'Kérelmező minősége (NEAK által elfogadott)' : 'Applicant Role (NEAK Recognized)'}
                </label>
                <select
                  value={applicantRole}
                  onChange={(e) => setApplicantRole(e.target.value as ApplicantRole)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E2761] bg-white"
                >
                  <option value="patient">{t('label.patient')}</option>
                  <option value="legal_representative">{t('label.rep')}</option>
                  <option value="treating_doctor">{t('label.doctor')}</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'hu' ? 'Szükséges kezelés / műtét' : 'Required Treatment / Procedure'}
                </label>
                <select
                  value={procedure}
                  onChange={(e) => setProcedure(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E2761] bg-white"
                >
                  {rules.map((r) => (
                    <option key={r.procedure} value={r.procedure}>
                      {r.procedure} ({r.requiresPA ? (language === 'hu' ? 'Fekvőbeteg / Előzetes engedély' : 'Inpatient / Pre-approval') : (language === 'hu' ? 'Egynapos / Utólagos elszámolás' : 'Outpatient / Claim')})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Plain language path explanation card */}
            <div
              className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                requiresPA
                  ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                  : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              }`}
            >
              <div className="font-bold text-xs uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-current" />
                <span>{plainPathName}</span>
              </div>
              <p className="text-xs leading-relaxed opacity-90">
                {plainPathDesc}
              </p>
              <div className="text-[11px] font-medium pt-1 border-t border-current/20">
                {language === 'hu' ? 'Hazai átlagos várakozási idő:' : 'Average domestic wait:'} ~{selectedRule?.domesticAverageWaitMonths} {language === 'hu' ? 'hónap' : 'months'}
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 2: How long have you been waiting? */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-[#1E2761]">
                {t('intake.step2')}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'hu'
                  ? 'Az uniós jog alapján a hazai várakozási idő hossza alapozza meg a külföldi ellátás jogosságát.'
                  : 'Under EU law, excessive domestic delay establishes your right to funded cross-border treatment.'}
              </p>
            </div>

            <div className="space-y-4">
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
                  placeholder="e.g. 16"
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
                    ? 'Töltse fel az EESZT felületéről letöltött várólista igazolását.'
                    : 'Upload your EESZT waitlist record as proof of domestic waitlist placement.'}
                </span>
              </div>

              {/* Collapsed Expandable Section "Why we ask this" */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowWhyWaitlist(!showWhyWaitlist)}
                  className="flex items-center gap-1.5 text-xs text-[#1E2761] font-medium hover:underline cursor-pointer"
                >
                  <span>{t('evidence.whyAsk')}</span>
                  {showWhyWaitlist ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showWhyWaitlist && (
                  <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 leading-relaxed animate-in fade-in">
                    {t('evidence.whyAskText')}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 3: Let's check your options & clinic */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-[#1E2761]">
                {t('intake.step3')}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'hu'
                  ? 'Válassza ki a célkórházat és igényeljen utazási költségtérítést.'
                  : 'Select your preferred partner clinic and request discretionary travel reimbursement.'}
              </p>
            </div>

            <div className="space-y-4">
              {/* EHIC checkbox */}
              <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasEhic}
                  onChange={(e) => setHasEhic(e.target.checked)}
                  className="mt-0.5 rounded text-[#1E2761]"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-900">
                    {language === 'hu'
                      ? 'Rendelkezem érvényes Európai Egészségbiztosítási Kártyával (EU-kártya)'
                      : 'Patient holds a valid European Health Insurance Card (EHIC)'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {language === 'hu'
                      ? 'Igazolja a magyar biztosítási jogviszonyt külföldön.'
                      : 'Proves Hungarian social security coverage abroad; facilitates local hospital billing.'}
                  </div>
                </div>
              </label>

              {/* Travel reimbursement */}
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-2.5">
                <div className="text-xs font-bold text-slate-900">
                  {language === 'hu'
                    ? 'Utazási költségtérítési kérelem (NEAK nyomtatvány része)'
                    : 'Travel Cost Reimbursement (Dedicated NEAK Section)'}
                </div>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requestTravelCost}
                    onChange={(e) => setRequestTravelCost(e.target.checked)}
                    className="mt-0.5 rounded text-[#1E2761]"
                  />
                  <span className="text-xs text-slate-700">
                    {language === 'hu'
                      ? 'Kérem a beteg saját utazási költségének megtérítését'
                      : 'Request reimbursement for patient\'s own cross-border travel costs'}
                  </span>
                </label>

                {requestTravelCost && (
                  <label className="flex items-start gap-2 cursor-pointer pl-4">
                    <input
                      type="checkbox"
                      checked={travelCompanion}
                      onChange={(e) => setTravelCompanion(e.target.checked)}
                      className="mt-0.5 rounded text-[#1E2761]"
                    />
                    <span className="text-xs text-slate-700">
                      {language === 'hu'
                        ? 'Kísérő személy utazási költségének megtérítését is kérem (egészségi állapot miatt szükséges kíséret)'
                        : 'Include travel cost for an accompanying person (companion required due to mobility/medical need)'}
                    </span>
                  </label>
                )}

                <div className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200">
                  {language === 'hu'
                    ? 'Figyelem: Az utazási költségtérítés méltányossági jellegű, megítélése nem automatikus.'
                    : 'Note: Travel-cost reimbursement is discretionary (\'méltányosság\') and considered alongside the doctor\'s recommendation.'}
                </div>
              </div>

              {/* Target clinic selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'hu' ? 'Választott partnerkórház' : 'Target EU Partner Clinic'}
                </label>
                <select
                  value={selectedClinicId}
                  onChange={(e) => setSelectedClinicId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E2761] bg-white mb-2"
                >
                  {filteredClinics.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.city}, {c.country} ({c.providerType === 'public' ? 'Public/S2' : 'Private/Directive'})
                    </option>
                  ))}
                </select>

                {/* Clinic preview */}
                {(() => {
                  const c = clinics.find((cl) => cl.id === selectedClinicId);
                  if (!c) return null;
                  return (
                    <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs space-y-1.5">
                      <div className="flex items-center justify-between font-bold text-[#1E2761]">
                        <span>{c.name}</span>
                        <span className="text-[11px] text-slate-500">{c.country}</span>
                      </div>
                      <div className="text-slate-600 text-[11px]">{c.coverageNote}</div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
                        <span>Avg. wait: ~{c.averageWaitDays} days</span>
                        <span className="text-emerald-700 font-semibold">{c.estimatedCost}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Wizard Controls Footer */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-200">
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t('intake.back')}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-500 hover:bg-slate-50 cursor-pointer"
              >
                {t('btn.cancel')}
              </button>
            )}
          </div>

          <div>
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev + 1) as any)}
                className="px-6 py-2.5 rounded-lg bg-[#1E2761] hover:bg-[#151B45] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <span>{t('intake.next')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit()}
                className="px-6 py-2.5 rounded-lg bg-[#1E2761] hover:bg-[#151B45] text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-[#C9A24B]" />
                <span>{submitting ? t('intake.submitting') : 'Submit for Medical Advisor Review'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
