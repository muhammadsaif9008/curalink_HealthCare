import React from 'react';
import { CaseStage, Branch } from '../types';
import { useI18n } from '../i18n';
import {
  Check,
  Clock,
  AlertTriangle,
  ShieldCheck,
  FileText,
  Send,
  Award,
  Stethoscope,
  Coins,
  Scale,
  Plane,
} from 'lucide-react';

interface StepTrackerProps {
  branch: Branch;
  currentStage: CaseStage;
  isRejected: boolean;
  isSolvit: boolean;
  dispatchInfo?: {
    dateSent?: string;
    trackingNumber?: string;
  };
  travelSupportInfo?: {
    decision?: string;
    amount?: string;
    timing?: string;
    paid?: boolean;
    paidAmount?: string;
  };
}

export const StepTracker: React.FC<StepTrackerProps> = ({
  branch,
  currentStage,
  isRejected,
  isSolvit,
  dispatchInfo,
  travelSupportInfo,
}) => {
  const { t, language } = useI18n();

  // Define stages per branch
  // Pre-approval (S2) path: Drafted, Reviewed, Submitted, NEAK decision (Authorised), Travelling / In Treatment, Treated, Case closed
  const paStages: { id: CaseStage; label: string; sublabel: string; icon: React.ReactNode }[] = [
    {
      id: 'Drafted',
      label: t('stage.Drafted'),
      sublabel: t('stage.Drafted.sub'),
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'Reviewed',
      label: t('stage.Reviewed'),
      sublabel: t('stage.Reviewed.sub'),
      icon: <ShieldCheck className="w-4 h-4" />,
    },
    {
      id: 'Submitted',
      label: t('stage.Submitted'),
      sublabel: t('stage.Submitted.sub'),
      icon: <Send className="w-4 h-4" />,
    },
    {
      id: 'Authorised',
      label: language === 'hu' ? 'NEAK-döntés' : 'NEAK decision',
      sublabel: language === 'hu' ? 'Engedélyezve vagy elutasítva' : 'Authorised or rejected',
      icon: <Award className="w-4 h-4" />,
    },
    {
      id: 'Travelling / In Treatment',
      label: t('stage.Travelling / In Treatment'),
      sublabel: t('stage.Travelling / In Treatment.sub'),
      icon: <Plane className="w-4 h-4" />,
    },
    {
      id: 'Treated',
      label: t('stage.Treated'),
      sublabel: t('stage.Treated.sub'),
      icon: <Stethoscope className="w-4 h-4" />,
    },
    {
      id: 'Case closed',
      label: language === 'hu' ? 'Ügy lezárva: Elszámolva a NEAK-kal' : 'Case closed: Settled with NEAK',
      sublabel: t('stage.Case closed.sub'),
      icon: <Coins className="w-4 h-4" />,
    },
  ];

  // Treat-now-and-claim-back (Directive) path: Drafted, Reviewed, Travelling / In Treatment, Treated, Reimbursed
  // Under Directive 2011/24/EU, patient does not need any documentation before travel; after Reviewed it goes directly to Travelling / In Treatment.
  const nonPaStages: { id: CaseStage; label: string; sublabel: string; icon: React.ReactNode }[] = [
    {
      id: 'Drafted',
      label: t('stage.Drafted'),
      sublabel: t('stage.Drafted.sub'),
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'Reviewed',
      label: t('stage.Reviewed'),
      sublabel: t('stage.Reviewed.sub'),
      icon: <ShieldCheck className="w-4 h-4" />,
    },
    {
      id: 'Travelling / In Treatment',
      label: t('stage.Travelling / In Treatment'),
      sublabel: t('stage.Travelling / In Treatment.sub'),
      icon: <Plane className="w-4 h-4" />,
    },
    {
      id: 'Treated',
      label: t('stage.Treated'),
      sublabel: t('stage.Treated.sub'),
      icon: <Stethoscope className="w-4 h-4" />,
    },
    {
      id: 'Reimbursed',
      label: language === 'hu' ? 'Megtérítve: Elszámolva a NEAK-kal' : 'Reimbursed: Settled with NEAK',
      sublabel: t('stage.Reimbursed.sub'),
      icon: <Coins className="w-4 h-4" />,
    },
  ];

  const activeStageList = branch === 'PA' ? paStages : nonPaStages;

  // Compute status index
  const stageOrder = activeStageList.map((s) => s.id);
  const currentIndex = stageOrder.indexOf(currentStage);

  const pathLabel = branch === 'PA' ? t('path.pa') : t('path.nonPa');
  const pathLegal = branch === 'PA' ? 'EU Reg 883/2004 (S2)' : 'Directive 2011/24/EU';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-[#1E2761]">
              {language === 'hu' ? 'Eljárási Folyamatkövető' : 'Procedural Progress Tracker'}
            </h3>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                branch === 'PA'
                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-200'
              }`}
            >
              {pathLabel} · <span className="opacity-75 font-mono text-[11px]">{pathLegal}</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'hu'
              ? 'Átlátható lépések az orvosi jóváhagyástól a helyszíni kíséreten át a teljes NEAK-elszámolásig.'
              : 'Transparent milestones from verified advisor attestation to in-person support and final NEAK settlement.'}
          </p>
        </div>

        {/* Status Callout Pill */}
        <div className="flex items-center gap-2">
          {isRejected ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>{language === 'hu' ? 'NEAK Nemzeti Elutasítás' : 'NEAK Refused Authorisation'}</span>
            </div>
          ) : isSolvit ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-purple-50 border border-purple-200 text-purple-900 text-xs font-semibold">
              <Scale className="w-4 h-4 text-purple-600" />
              <span>{language === 'hu' ? 'SOLVIT Határon Átnyúló Jogorvoslat' : 'SOLVIT Cross-Border Appeal Active'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#CADCFC]/40 border border-[#1E2761]/20 text-[#1E2761] text-xs font-semibold">
              <Clock className="w-4 h-4 text-[#1E2761]" />
              <span>{language === 'hu' ? 'Jelenlegi szakasz' : 'Current Stage'}: {t(`stage.${currentStage}`)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main horizontal step progression */}
      <div className="relative">
        {/* Background track line */}
        <div className="hidden md:block absolute top-5 left-6 right-6 h-0.5 bg-slate-200 z-0" />

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-flow-col md:auto-cols-fr gap-3 relative z-10">
          {activeStageList.map((step, idx) => {
            const isDecisionStep = branch === 'PA' && step.id === 'Authorised';
            const isDecisionRejected = isDecisionStep && isRejected;

            let stepLabel = step.label;
            let stepSublabel = step.sublabel;
            let stepIcon = step.icon;

            if (isDecisionStep) {
              if (isRejected) {
                stepLabel = language === 'hu' ? 'Elutasítva' : 'Rejected';
                stepSublabel = language === 'hu' ? 'Engedélyezve vagy elutasítva' : 'Authorised or rejected';
                stepIcon = <AlertTriangle className="w-5 h-5 text-white" />;
              } else if (currentStage === 'Authorised' || currentIndex > idx) {
                stepLabel = language === 'hu' ? 'Engedélyezve' : 'Authorised';
                stepSublabel = language === 'hu' ? 'Engedélyezve vagy elutasítva' : 'Authorised or rejected';
                stepIcon = <Check className="w-5 h-5 stroke-[2.5]" />;
              } else {
                stepLabel = language === 'hu' ? 'NEAK-döntés' : 'NEAK decision';
                stepSublabel = language === 'hu' ? 'Engedélyezve vagy elutasítva' : 'Authorised or rejected';
                stepIcon = <Award className="w-4 h-4" />;
              }
            }

            // When NEAK authorises, the step shows "Authorised" in the normal completed style.
            // When NEAK rejects, it shows "Rejected" in red and the later steps stay greyed out.
            const isDecisionCompleted = isDecisionStep && !isRejected && (currentStage === 'Authorised' || currentIndex > idx);
            const isCompleted = isRejected
              ? idx < 3
              : isDecisionCompleted || currentIndex > idx;
            const isCurrent = isRejected
              ? false
              : isDecisionCompleted
              ? false
              : currentStage === step.id;

            return (
              <div key={step.id} className="flex flex-col items-center text-center group">
                {/* Node circle */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm ${
                    isDecisionRejected
                      ? 'bg-rose-600 text-white ring-4 ring-rose-100 border-2 border-white'
                      : isCompleted
                      ? 'bg-[#1E2761] text-white border-2 border-[#1E2761]'
                      : isCurrent
                      ? 'bg-[#C9A24B] text-white ring-4 ring-[#C9A24B]/20 border-2 border-white'
                      : 'bg-white text-slate-400 border-2 border-slate-300'
                  }`}
                >
                  {isDecisionRejected ? (
                    <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
                  ) : isCompleted ? (
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  ) : (
                    stepIcon
                  )}
                </div>

                {/* Node labels */}
                <div className="mt-2.5">
                  <div
                    className={`text-xs font-semibold leading-tight ${
                      isDecisionRejected
                        ? 'text-rose-600 font-bold'
                        : isCurrent
                        ? 'text-[#1E2761] font-bold'
                        : isCompleted
                        ? 'text-slate-800'
                        : 'text-slate-500'
                    }`}
                  >
                    {stepLabel}
                  </div>
                  <div
                    className={`text-[10px] mt-0.5 hidden sm:block ${
                      isDecisionRejected ? 'text-rose-500 font-medium' : 'text-slate-400'
                    }`}
                  >
                    {stepSublabel}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dispatch Info Callout: "Sent by registered mail on [date], tracking [number]" (S2 Pre-Approval route only) */}
      {branch === 'PA' && dispatchInfo?.dateSent && dispatchInfo?.trackingNumber && (
        <div className="mt-4 p-3 rounded-lg bg-blue-50/80 border border-blue-200 text-xs text-blue-900 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-700 shrink-0" />
            <span className="font-semibold">
              {language === 'hu'
                ? `Ajánlott küldeményként feladva: ${dispatchInfo.dateSent}, ragszám: ${dispatchInfo.trackingNumber}`
                : `Sent by registered mail on ${dispatchInfo.dateSent}, tracking ${dispatchInfo.trackingNumber}`}
            </span>
          </div>
          <span className="text-[11px] font-mono bg-blue-100 px-2 py-0.5 rounded text-blue-800 font-bold">
            {dispatchInfo.trackingNumber}
          </span>
        </div>
      )}

      {/* Travel Support Paid on Authorised stage */}
      {currentStage === 'Authorised' && travelSupportInfo?.decision === 'granted' && travelSupportInfo?.timing === 'before_travel' && travelSupportInfo?.paid && (
        <div className="mt-4 p-3 rounded-lg bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
          <Award className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">
            {language === 'hu'
              ? `${travelSupportInfo.paidAmount || travelSupportInfo.amount || '45 000 Ft'} összegű utazási támogatás utazás előtt kifizetve`
              : `Travel support of ${travelSupportInfo.paidAmount || travelSupportInfo.amount || '45,000 HUF'} paid before travel`}
          </span>
        </div>
      )}

      {/* Rejection / SOLVIT Branch visualization if applicable */}
      {(isRejected || isSolvit) && (
        <div className="mt-6 pt-4 border-t border-rose-100 bg-rose-50/60 rounded-lg p-3.5 flex items-start gap-3">
          <Scale className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-900 leading-relaxed">
            <span className="font-bold">
              {language === 'hu' ? 'Jogi Jogorvoslati Útvonal Elérhető: ' : 'Alternative Legal Recourse Path Active: '}
            </span>
            {language === 'hu'
              ? 'A belföldi elutasítás nem végállomás. Az Európai Bíróság C-372/04. sz. (Watts) precedensítélete és a 883/2004/EK rendelet alapján az elméleti hazai kapacitásra hivatkozó elutasítások hivatalosan vitathatóak az Európai Bizottság ingyenes SOLVIT hálózatán keresztül.'
              : 'A domestic refusal is not a dead end. Under CJEU Case C-372/04 (Watts) and Regulation 883/2004, refusals citing theoretical national capacity are actionable through the European Commission\'s SOLVIT dispute resolution mechanism.'}
          </div>
        </div>
      )}
    </div>
  );
};
