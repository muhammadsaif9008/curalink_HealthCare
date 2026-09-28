import React, { useState } from 'react';
import { CaseItem, Clinic, UserProfile } from '../types';
import { useI18n } from '../i18n';
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  FileText,
  Calendar,
  Building2,
  ChevronRight,
  ExternalLink,
  History,
} from 'lucide-react';

interface AdvisorReviewedCasesPageProps {
  cases: CaseItem[];
  currentUser: UserProfile | null;
  clinics: Clinic[];
  onNavigate: (tab: string, caseId?: string) => void;
}

export const AdvisorReviewedCasesPage: React.FC<AdvisorReviewedCasesPageProps> = ({
  cases,
  currentUser,
  clinics,
  onNavigate,
}) => {
  const { language } = useI18n();
  const [filterType, setFilterType] = useState<'all' | 'approved' | 'more_info' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // All cases that have passed through advisor hands (not in Awaiting Advisor Review)
  const decidedCases = cases
    .filter((c) => c.currentStage !== 'Awaiting Advisor Review')
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

  const filtered = decidedCases.filter((c) => {
    // Stage category
    if (filterType === 'approved') {
      const isApproved =
        c.currentStage === 'Reviewed' ||
        c.currentStage === 'Submitted' ||
        c.currentStage === 'Authorised' ||
        c.currentStage === 'Travelling / In Treatment' ||
        c.currentStage === 'Treated' ||
        c.currentStage === 'Reimbursed';
      if (!isApproved) return false;
    }
    if (filterType === 'more_info') {
      if (c.currentStage !== 'More Info Requested') return false;
    }
    if (filterType === 'rejected') {
      if (c.currentStage !== 'Rejected') return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.patientName.toLowerCase().includes(q);
      const matchProc = c.procedure.toLowerCase().includes(q);
      const matchTaj = c.tajNumber.toLowerCase().includes(q);
      const matchNotes = (c.advisorNotes || c.advisorClinicalJustification || '').toLowerCase().includes(q);
      if (!matchName && !matchProc && !matchTaj && !matchNotes) return false;
    }

    return true;
  });

  const getDecisionBadge = (stage: CaseItem['currentStage']) => {
    if (
      stage === 'Reviewed' ||
      stage === 'Submitted' ||
      stage === 'Authorised' ||
      stage === 'Travelling / In Treatment' ||
      stage === 'Treated' ||
      stage === 'Reimbursed'
    ) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
          <span>Approved ({stage})</span>
        </span>
      );
    }
    if (stage === 'More Info Requested') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold">
          <Clock className="w-3.5 h-3.5 text-amber-700" />
          <span>More Info Requested</span>
        </span>
      );
    }
    if (stage === 'Rejected') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-900 border border-rose-200 text-xs font-bold">
          <XCircle className="w-3.5 h-3.5 text-rose-700" />
          <span>Rejected</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold">
        <span>{stage}</span>
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#1E2761] uppercase tracking-wider">
            <History className="w-3.5 h-3.5" />
            <span>Clinical Audit Log</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Reviewed Cases History</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log of all patient applications evaluated and signed off by CuraLink medical advisors.
          </p>
        </div>

        <button
          onClick={() => onNavigate('review-queue')}
          className="px-4 py-2 bg-[#1E2761] hover:bg-[#151B45] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 self-start cursor-pointer"
        >
          <span>← Back to Review Queue</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterType === 'all'
                ? 'bg-[#1E2761] text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            All Decisions ({decidedCases.length})
          </button>
          <button
            onClick={() => setFilterType('approved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterType === 'approved'
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilterType('more_info')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterType === 'more_info'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            More Info
          </button>
          <button
            onClick={() => setFilterType('rejected')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterType === 'rejected'
                ? 'bg-rose-700 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Rejected
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by patient, procedure, or notes..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1E2761] outline-hidden"
          />
        </div>
      </div>

      {/* Case List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-500">
          No past reviewed cases found matching criteria.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const matchedClinic = clinics.find((cl) => cl.id === c.selectedClinicId);
            const justificationText =
              c.advisorClinicalJustification || c.advisorNotes || c.verification.clinicalJudgment.notes;

            return (
              <div
                key={c.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition-shadow space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    {getDecisionBadge(c.currentStage)}
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{c.procedure}</h3>
                      <div className="text-xs text-slate-500">
                        Patient: <strong>{c.patientName}</strong> · TAJ: {c.tajNumber}
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-xs text-slate-400">
                    <div>Last updated: {new Date(c.updatedAt || c.createdAt).toLocaleDateString()}</div>
                    {c.referenceNumber && (
                      <div className="font-mono text-slate-600 font-semibold">{c.referenceNumber}</div>
                    )}
                  </div>
                </div>

                {/* Clinical Justification snippet */}
                {justificationText && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs text-slate-700 space-y-1">
                    <span className="text-[11px] font-bold text-[#1E2761] uppercase tracking-wider block">
                      Clinical Justification Recorded on Filing:
                    </span>
                    <p className="leading-relaxed italic">&ldquo;{justificationText}&rdquo;</p>
                  </div>
                )}

                {/* More Info message */}
                {c.currentStage === 'More Info Requested' && c.moreInfoMessage && (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 space-y-1">
                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                      Requested from Patient:
                    </span>
                    <p className="leading-relaxed">&ldquo;{c.moreInfoMessage}&rdquo;</p>
                  </div>
                )}

                {/* Rejection reason */}
                {c.currentStage === 'Rejected' && c.rejectionReason && (
                  <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-xs text-rose-900 space-y-1">
                    <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
                      Reason for Rejection:
                    </span>
                    <p className="leading-relaxed">&ldquo;{c.rejectionReason}&rdquo;</p>
                  </div>
                )}

                {/* Bottom Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-slate-500">
                  <div className="flex items-center gap-4">
                    <span>
                      Wait time: <strong>{c.monthsWaited} months</strong>
                    </span>
                    {matchedClinic && (
                      <span>
                        Target: <strong>{matchedClinic.name}</strong> ({matchedClinic.country})
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onNavigate('case-detail', c.id)}
                    className="inline-flex items-center gap-1 font-semibold text-[#1E2761] hover:underline cursor-pointer"
                  >
                    <span>Inspect Full Legal Filing & Documents</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
