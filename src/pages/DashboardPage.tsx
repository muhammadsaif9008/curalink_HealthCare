import React, { useState } from 'react';
import { CaseItem, UserProfile, isCaseActive, isTerminalCase } from '../types';
import { useI18n } from '../i18n';
import {
  FileText,
  PlusCircle,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  User,
  Building2,
  Calendar,
  Filter,
  Plane,
  Archive,
  ChevronDown,
  ChevronUp,
  Lock,
  History,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Send,
  FileSpreadsheet,
} from 'lucide-react';

interface DashboardPageProps {
  cases: CaseItem[];
  currentUser: UserProfile | null;
  onNavigate: (tab: string, caseId?: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  cases,
  currentUser,
  onNavigate,
}) => {
  const { language, t } = useI18n();
  const [filterBranch, setFilterBranch] = useState<'all' | 'PA' | 'NonPA'>('all');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [showPastCases, setShowPastCases] = useState<boolean>(true);
  const [staffPatientFilter, setStaffPatientFilter] = useState<string>('all');

  const isPatientUser = currentUser?.role === 'patient';

  // Base case scope: if logged in as a patient, show only their cases
  const scopedCases = cases.filter((c) => {
    if (isPatientUser && currentUser) {
      return (
        c.userId === currentUser.id ||
        c.patientName.trim().toLowerCase() === currentUser.name.trim().toLowerCase() ||
        (currentUser.tajDemo && c.tajNumber.trim() === currentUser.tajDemo.trim())
      );
    }
    if (!isPatientUser && staffPatientFilter !== 'all') {
      return c.userId === staffPatientFilter || c.patientName === staffPatientFilter;
    }
    return true;
  });

  // Apply route and stage filters
  const filteredCases = scopedCases.filter((c) => {
    if (filterBranch !== 'all' && c.branch !== filterBranch) return false;
    if (filterStage !== 'all') {
      if (filterStage === 'active' && isTerminalCase(c)) return false;
      if (filterStage === 'closed' && isCaseActive(c)) return false;
      if (filterStage === 'review' && c.currentStage !== 'Reviewed' && c.currentStage !== 'Drafted') return false;
      if (filterStage === 'authorised' && c.currentStage !== 'Authorised') return false;
      if (filterStage === 'travelling' && c.currentStage !== 'Travelling / In Treatment') return false;
      if (filterStage === 'treated' && c.currentStage !== 'Treated') return false;
      if (filterStage === 'rejected' && c.currentStage !== 'Rejected') return false;
    }
    return true;
  });

  // Partition into Active (only one at a time for a patient) vs Past (closed) cases
  const activeCases = filteredCases.filter((c) => isCaseActive(c));
  const pastCases = filteredCases.filter((c) => isTerminalCase(c));

  // Counts for KPI summary
  const paCount = scopedCases.filter((c) => c.branch === 'PA').length;
  const nonPaCount = scopedCases.filter((c) => c.branch === 'NonPA').length;
  const authorisedCount = scopedCases.filter((c) => c.currentStage === 'Authorised').length;
  const travellingCount = scopedCases.filter((c) => c.currentStage === 'Travelling / In Treatment').length;

  // Unique patients list for staff filtering
  const uniquePatients = Array.from(
    new Map(cases.map((c) => [c.userId, { id: c.userId, name: c.patientName, taj: c.tajNumber }])).values()
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & New Case CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#1E2761]">
              {currentUser?.role === 'case_manager'
                ? (language === 'hu' ? 'Műveletek és ügyek' : 'Operations & Cases')
                : t('dash.title')}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#CADCFC] text-[#1E2761] font-semibold">
              {scopedCases.length} {language === 'hu' ? 'ügy' : 'Total'}
            </span>
            {isPatientUser && currentUser && (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                <User className="w-3 h-3 text-slate-500" />
                {currentUser.name}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isPatientUser
              ? (language === 'hu'
                  ? 'A páciens határon átnyúló ellátási portfóliója: egyidejűleg legfeljebb egy aktív ügy, a korábbi lezárt ügyek archívumban érhetők el.'
                  : 'Your cross-border healthcare portfolio: one active case in progress at a time, with historical closed dossiers archived below.')
              : t('dash.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('new-case')}
            className="px-4 py-2.5 rounded-lg bg-[#1E2761] hover:bg-[#151B45] text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-[#C9A24B]" />
            <span>{t('dash.startNew')}</span>
          </button>
        </div>
      </div>

      {/* Staff Patient Filter (only shown to advisors/managers) */}
      {!isPatientUser && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="font-semibold text-amber-900">
              {language === 'hu' ? 'Tanácsadói / Ügykezelői Nézet' : 'Staff Case Manager View'}:
            </span>
            <span className="text-amber-800">
              {language === 'hu' ? 'Szűrés beteg szerint a portfólió vizsgálatához:' : 'Filter by patient portfolio:'}
            </span>
          </div>
          <select
            value={staffPatientFilter}
            onChange={(e) => setStaffPatientFilter(e.target.value)}
            className="border border-amber-300 rounded-lg px-3 py-1.5 bg-white text-slate-800 text-xs font-medium cursor-pointer"
          >
            <option value="all">
              {language === 'hu' ? 'Minden páciens összes ügye' : 'All Patients (Full Roster)'}
            </option>
            {uniquePatients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (TAJ: {p.taj})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">
            {language === 'hu' ? 'Előzetes engedélyezési út' : 'Fast-Track Pre-Approval'}
          </div>
          <div className="text-2xl font-extrabold text-[#1E2761] mt-1">{paCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {language === 'hu' ? 'Kórházi bentfekvéses eljárás (S2)' : 'Inpatient hospital care (S2)'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">
            {language === 'hu' ? 'Utólagos elszámolási út' : 'Standard Claim Path'}
          </div>
          <div className="text-2xl font-extrabold text-[#1E2761] mt-1">{nonPaCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {language === 'hu' ? 'Egynapos sebészet és járóbeteg' : 'Outpatient day-surgery'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">
            {language === 'hu' ? 'Utazás / Kezelés alatt' : 'Travelling / In Treatment'}
          </div>
          <div className="text-2xl font-extrabold text-blue-700 mt-1">{travellingCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {language === 'hu' ? 'Személyes helyszíni kísérettel' : 'With in-person chaperone'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">
            {language === 'hu' ? 'NEAK engedéllyel' : 'NEAK Authorised'}
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">{authorisedCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {language === 'hu' ? 'Műtét és utazás szervezhető' : 'Ready for treatment'}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-700">{t('dash.filterRoute')}:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterBranch('all')}
              className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                filterBranch === 'all'
                  ? 'bg-[#1E2761] text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t('dash.allRoutes')}
            </button>
            <button
              onClick={() => setFilterBranch('PA')}
              className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                filterBranch === 'PA'
                  ? 'bg-[#1E2761] text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t('dash.fastTrackOnly')}
            </button>
            <button
              onClick={() => setFilterBranch('NonPA')}
              className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                filterBranch === 'NonPA'
                  ? 'bg-[#1E2761] text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t('dash.standardOnly')}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">
            {language === 'hu' ? 'Státusz szűrő:' : 'Stage Filter:'}
          </span>
          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            className="border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800 bg-white cursor-pointer"
          >
            <option value="all">{language === 'hu' ? 'Minden státusz' : 'All Stages'}</option>
            <option value="active">{language === 'hu' ? 'Csak aktív folyamatban lévő' : 'Active In-Progress Only'}</option>
            <option value="closed">{language === 'hu' ? 'Csak lezárt / archivált ügyek' : 'Closed / Settled Only'}</option>
            <option value="review">{language === 'hu' ? 'Szakértői ellenőrzés alatt' : 'Under Review'}</option>
            <option value="authorised">{language === 'hu' ? 'Engedélyezve' : 'Authorised'}</option>
            <option value="travelling">{language === 'hu' ? 'Utazás / Kezelés alatt' : 'Travelling / In Treatment'}</option>
            <option value="treated">{language === 'hu' ? 'Ellátva / Költségtérítés (Treated)' : 'Treated / Claims'}</option>
            <option value="rejected">{language === 'hu' ? 'Elutasítva / SOLVIT' : 'Rejected / SOLVIT'}</option>
          </select>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SECTION 1: ACTIVE CASE IN PROGRESS (Only one at a time for a patient) */}
      {/* ==================================================================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
            </span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {t('dash.activeCaseSection')}
            </h2>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
              {activeCases.length} {language === 'hu' ? 'aktív' : 'active'}
            </span>
          </div>

          <div className="text-xs text-slate-500 hidden sm:block">
            {language === 'hu'
              ? 'Páciensenként egyidejűleg 1 aktív ügy engedélyezett'
              : 'Limit: 1 active case per patient at a time'}
          </div>
        </div>

        {activeCases.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-bold text-slate-800">
                {t('dash.noActiveCaseTitle')}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t('dash.noActiveCaseDesc')}
              </p>
            </div>
            <div>
              <button
                onClick={() => onNavigate('new-case')}
                className="px-5 py-2.5 bg-[#1E2761] hover:bg-[#151B45] text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-2 cursor-pointer transition-all"
              >
                <PlusCircle className="w-4 h-4 text-[#C9A24B]" />
                <span>{t('dash.startNew')}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {activeCases.map((c) => {
              const isPa = c.branch === 'PA';
              const isPendingReview = c.verification.clinicalJudgment.status === 'pending';
              const isAttested = c.verification.clinicalJudgment.status === 'attested';
              const isTravelling = c.currentStage === 'Travelling / In Treatment';
              const isSolvit = c.currentStage === 'SOLVIT Appeal Drafted';
              const pathLabel = isPa ? t('path.pa.badge') : t('path.nonPa.badge');

              return (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl border-2 border-[#1E2761]/30 hover:border-[#1E2761]/60 transition-all p-5 sm:p-6 shadow-md space-y-4 relative overflow-hidden"
                >
                  {/* Subtle top indicator bar */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#1E2761] via-blue-600 to-[#C9A24B]" />

                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg font-bold text-[#1E2761]">
                          {c.procedure}
                        </span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                            isPa
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                          }`}
                        >
                          {pathLabel}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-900 font-semibold border border-blue-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                          {language === 'hu' ? 'Folyamatban lévő aktív ügy' : 'Active Case in Progress'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        <span>
                          <strong className="text-slate-800">{c.patientName}</strong> (TAJ: {c.tajNumber})
                        </span>
                        <span>·</span>
                        <span>
                          {language === 'hu' ? 'Igazolt várakozás:' : 'Documented Wait:'}{' '}
                          <strong className="text-slate-800">
                            {c.monthsWaited} {language === 'hu' ? 'hónap' : 'months'}
                          </strong>
                        </span>
                        <span>·</span>
                        <span>{c.doctorName}</span>
                      </div>
                    </div>

                    {/* Current Stage Badge & Ready to send tag */}
                    <div className="shrink-0 flex items-center gap-2 flex-wrap">
                      {currentUser?.role === 'case_manager' && c.currentStage === 'Reviewed' && c.branch === 'PA' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-xs animate-pulse">
                          <Send className="w-3.5 h-3.5" />
                          <span>{language === 'hu' ? 'NEAK-nak küldésre kész' : 'Ready to send to NEAK'}</span>
                        </span>
                      )}
                      {currentUser?.role === 'case_manager' && c.currentStage === 'Reviewed' && c.branch === 'NonPA' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs">
                          <Plane className="w-3.5 h-3.5" />
                          <span>{language === 'hu' ? 'Készen áll az utazásra' : 'Ready for Travel & Treatment'}</span>
                        </span>
                      )}
                      {currentUser?.role === 'case_manager' && c.currentStage === 'Treated' && c.branch === 'NonPA' && (
                        c.claimReviewStatus === 'submitted_to_neak' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs">
                            <Send className="w-3.5 h-3.5" />
                            <span>{language === 'hu' ? 'NEAK-hoz benyújtva' : 'Submitted to NEAK'}</span>
                          </span>
                        ) : c.claimReviewStatus === 'complete' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{language === 'hu' ? 'Feladásra kész' : 'Ready to dispatch'}</span>
                          </span>
                        ) : c.claimReviewStatus === 'needs_more' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-xs shadow-xs">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{language === 'hu' ? 'Kiegészítésre vár' : 'Needs more from patient'}</span>
                          </span>
                        ) : (c.claimSlots?.paidInvoice || c.claimReviewStatus === 'ready_to_prepare') ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-xs animate-pulse">
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            <span>{language === 'hu' ? 'Költségtérítés előkészítésére kész' : 'Ready to prepare claim'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-medium text-[11px] border border-slate-200">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{language === 'hu' ? 'Számlára vár' : 'Awaiting patient invoice'}</span>
                          </span>
                        )
                      )}
                      <div
                        className={`text-xs px-3.5 py-1.5 rounded-xl font-bold border flex items-center gap-2 shadow-xs ${
                          isTravelling
                            ? 'bg-blue-600 text-white border-blue-700 animate-pulse'
                            : isSolvit
                            ? 'bg-purple-100 text-purple-950 border-purple-300 font-bold'
                            : c.currentStage === 'Authorised'
                            ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                            : c.currentStage === 'Submitted'
                            ? 'bg-blue-100 text-blue-950 border-blue-300'
                            : 'bg-slate-100 text-slate-800 border-slate-300'
                        }`}
                      >
                        {isTravelling && <Plane className="w-4 h-4 text-white" />}
                        <span>{t('stage.' + c.currentStage)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Travelling In-Person Support Highlight Banner (if in travelling stage) */}
                  {isTravelling && (
                    <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-950">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                          ✈
                        </div>
                        <div>
                          <div className="font-bold">
                            {language === 'hu'
                              ? 'Személyes helyszíni kísérő biztosítva a kezelés alatt'
                              : 'Universal Dedicated Airport & Hospital Support Active'}
                          </div>
                          <div className="text-[11px] text-blue-800">
                            {c.supportContact
                              ? `${c.supportContact.name} · ${c.supportContact.phone}`
                              : 'Dedicated CuraLink chaperone on-site'}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold px-2.5 py-1 bg-white text-blue-900 rounded-md border border-blue-200 self-start sm:self-auto">
                        {t('support.badgeClinic')}
                      </span>
                    </div>
                  )}

                  {/* Verification Check Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          c.verification.structuralCheck.passed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        ✓
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">
                          {language === 'hu' ? 'Strukturális ellenőrzés' : 'Structural Check'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {c.verification.structuralCheck.passed
                            ? (language === 'hu' ? 'Hiánytalan adatok' : 'Passed & complete')
                            : (language === 'hu' ? 'Hiányos' : 'Pending')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          c.verification.mokVerification.passed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        ✓
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">
                          {language === 'hu' ? 'Kamarai nyilvántartás' : 'MOK Registry'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {c.verification.mokVerification.licenseNumber || c.doctorLicense}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isAttested
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isAttested ? '✓' : '!'}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">
                          {language === 'hu' ? 'Orvosszakértői jóváhagyás' : 'Clinical Gate'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {isAttested
                            ? (language === 'hu' ? 'Jóváhagyva' : 'Attested by advisor')
                            : (language === 'hu' ? 'Jóváhagyásra vár' : 'Awaiting review')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Bar with Direct Action */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs">
                    <div className="text-slate-500 text-[11px]">
                      {c.referenceNumber && (
                        <span className="font-mono text-slate-700 font-semibold mr-2">
                          #{c.referenceNumber}
                        </span>
                      )}
                      <span>
                        {language === 'hu' ? 'Utolsó frissítés:' : 'Last updated:'}{' '}
                        {new Date(c.updatedAt).toLocaleDateString(language === 'hu' ? 'hu-HU' : 'en-US')}
                      </span>
                    </div>

                    <button
                      onClick={() => onNavigate('case-detail', c.id)}
                      className="px-5 py-2.5 bg-[#1E2761] hover:bg-[#151B45] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                    >
                      <span>
                        {language === 'hu' ? 'Ügy megnyitása és dokumentumok' : 'Open Active Case & View Progress'}
                      </span>
                      <ArrowRight className="w-4 h-4 text-[#C9A24B]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ==================================================================== */}
      {/* SECTION 2: PAST (CLOSED) CASES — DISTINCTLY GREYED OUT & COLLAPSIBLE */}
      {/* ==================================================================== */}
      <section className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Archive className="w-4 h-4 text-slate-400" />
            <h2 className="text-base font-bold text-slate-600 tracking-tight">
              {t('dash.pastCasesSection')}
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
              {pastCases.length} {language === 'hu' ? 'lezárt' : 'closed'}
            </span>
          </div>

          {pastCases.length > 0 && (
            <button
              onClick={() => setShowPastCases((prev) => !prev)}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>
                {showPastCases
                  ? (language === 'hu' ? 'Archívum összecsukása' : 'Collapse Archive')
                  : (language === 'hu' ? 'Archívum kibontása' : 'Expand Archive')}
              </span>
              {showPastCases ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>

        {pastCases.length === 0 ? (
          <div className="text-xs text-slate-400 italic py-3">
            {language === 'hu'
              ? 'Nincs korábbi lezárt vagy archivált ügy.'
              : 'No past closed or settled cases on record.'}
          </div>
        ) : showPastCases ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              {language === 'hu'
                ? 'Ezek az ügyek elérték végleges státuszukat (megtérítve vagy jogorvoslat nélkül lezárva). A teljes iratanyag és pénzügyi elszámolás archiválva elérhető.'
                : 'These cases have reached terminal status (reimbursed or closed without further appeal). The full legal dossier and settlement record remain archived for your files.'}
            </p>

            <div className="space-y-3">
              {pastCases.map((c) => {
                const isReimbursed = c.currentStage === 'Reimbursed';
                const isRejected = c.currentStage === 'Rejected';

                return (
                  <div
                    key={c.id}
                    className="bg-slate-50/80 border border-dashed border-slate-300 rounded-xl p-4 sm:p-5 opacity-80 hover:opacity-100 hover:bg-slate-50 transition-all text-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-700 text-sm line-through decoration-slate-400">
                            {c.procedure}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
                            {c.branch === 'PA' ? t('path.pa.badge') : t('path.nonPa.badge')}
                          </span>
                          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600 font-semibold inline-flex items-center gap-1">
                            <Lock className="w-3 h-3 text-slate-400" />
                            {c.currentStage === 'Case closed' || isReimbursed
                              ? (language === 'hu' ? 'Lezárt · Elszámolva' : 'Closed · Settled')
                              : (language === 'hu' ? 'Lezárt · Nincs fellebbezés' : 'Closed · Terminal')}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          <span>{c.patientName}</span> ·{' '}
                          <span>TAJ: {c.tajNumber}</span> ·{' '}
                          <span>{c.doctorName}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span
                          className={`text-xs px-3 py-1 rounded-md font-semibold border ${
                            isReimbursed || c.currentStage === 'Case closed'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-slate-200 text-slate-700 border-slate-300'
                          }`}
                        >
                          {t('stage.' + c.currentStage)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
                      <div>
                        {c.referenceNumber && (
                          <span className="font-mono text-slate-600 mr-3">
                            Ref: {c.referenceNumber}
                          </span>
                        )}
                        <span>
                          {language === 'hu' ? 'Lezárva:' : 'Closed date:'}{' '}
                          {new Date(c.updatedAt).toLocaleDateString(language === 'hu' ? 'hu-HU' : 'en-US')}
                        </span>
                        {c.rejectionReason && (
                          <span className="block sm:inline sm:ml-2 text-rose-700 font-medium">
                            ({c.rejectionReason.slice(0, 60)}...)
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => onNavigate('case-detail', c.id)}
                        className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                      >
                        <History className="w-3.5 h-3.5 text-slate-500" />
                        <span>{t('dash.viewArchive')}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
};
