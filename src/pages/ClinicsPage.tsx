import React, { useState } from 'react';
import { Clinic, TreatmentRule } from '../types';
import {
  Building2,
  MapPin,
  Clock,
  Coins,
  Phone,
  Mail,
  Languages,
  CheckCircle,
  Filter,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface ClinicsPageProps {
  clinics: Clinic[];
  rules: TreatmentRule[];
  onNavigate: (tab: string, caseId?: string) => void;
}

export const ClinicsPage: React.FC<ClinicsPageProps> = ({
  clinics,
  rules,
  onNavigate,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedRoute, setSelectedRoute] = useState<'all' | 'S2' | 'Directive'>('all');
  const [selectedProcedure, setSelectedProcedure] = useState<string>('all');

  const filteredClinics = clinics.filter((c) => {
    if (selectedCountry !== 'all' && c.country !== selectedCountry) return false;
    if (selectedRoute === 'S2' && c.providerType !== 'public' && c.routeType !== 'S2') return false;
    if (selectedRoute === 'Directive' && c.routeType !== 'Directive' && c.routeType !== 'Both') return false;
    if (selectedProcedure !== 'all' && !c.procedures.some((p) => p.toLowerCase().includes(selectedProcedure.toLowerCase()))) {
      return false;
    }
    return true;
  });

  const countries = ['all', 'Austria', 'Slovakia', 'Poland', 'Hungary'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#1E2761]">
              Cross-Border Partner Clinics Directory
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-[#CADCFC] text-[#1E2761] font-semibold">
              {clinics.length} Seeded Providers
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pre-evaluated hospital centers in Austria, Slovakia, Poland, and Hungary accepting EU cross-border patients.
          </p>
        </div>

        <button
          onClick={() => onNavigate('new-case')}
          className="px-4 py-2 bg-[#1E2761] hover:bg-[#151B45] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <span>Start Case with a Clinic</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#C9A24B]" />
        </button>
      </div>

      {/* Route Explainer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 text-xs space-y-1">
          <div className="font-bold text-amber-950 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
            <span>Public / State Providers (S2 Prior Authorisation Compatible)</span>
          </div>
          <p className="text-amber-900 leading-relaxed text-[11px]">
            Must be paired with S2 pre-approval for inpatient surgeries (knee, hip, cardiac). Patients are treated on equal terms with local insured residents under the host country&apos;s public tariff, requiring zero out-of-pocket for standard care.
          </p>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 text-xs space-y-1">
          <div className="font-bold text-emerald-950 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <span>Private & Public Providers (Directive 2011/24/EU Compatible)</span>
          </div>
          <p className="text-emerald-900 leading-relaxed text-[11px]">
            Patients can choose accredited private or public clinics. In non-PA cases (like cataract surgery), patients pay the clinic directly and claim reimbursement from NEAK up to the Hungarian domestic tariff ceiling.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Procedure Filter */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Procedure:</span>
          <select
            value={selectedProcedure}
            onChange={(e) => setSelectedProcedure(e.target.value)}
            className="border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800 bg-white"
          >
            <option value="all">All Procedures</option>
            {rules.map((r) => (
              <option key={r.procedure} value={r.procedure}>
                {r.procedure}
              </option>
            ))}
          </select>
        </div>

        {/* Route Filter */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Route Type:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedRoute('all')}
              className={`px-2.5 py-1 rounded cursor-pointer ${
                selectedRoute === 'all'
                  ? 'bg-[#1E2761] text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Routes
            </button>
            <button
              onClick={() => setSelectedRoute('S2')}
              className={`px-2.5 py-1 rounded cursor-pointer ${
                selectedRoute === 'S2'
                  ? 'bg-[#1E2761] text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Public (S2 Only)
            </button>
            <button
              onClick={() => setSelectedRoute('Directive')}
              className={`px-2.5 py-1 rounded cursor-pointer ${
                selectedRoute === 'Directive'
                  ? 'bg-[#1E2761] text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Directive Compatible
            </button>
          </div>
        </div>

        {/* Country Filter */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Country:</span>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800 bg-white"
          >
            {countries.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? 'All Countries' : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Clinic Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClinics.map((clinic) => {
          const isPublic = clinic.providerType === 'public';

          return (
            <div
              key={clinic.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm p-5 flex flex-col justify-between space-y-4 transition-all"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-[#1E2761] leading-tight">
                      {clinic.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{clinic.city}, {clinic.country}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] px-2 py-0.5 rounded font-semibold border shrink-0 ${
                      isPublic
                        ? 'bg-amber-50 text-amber-900 border-amber-200'
                        : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    }`}
                  >
                    {isPublic ? 'Public / S2' : 'Private / Directive'}
                  </span>
                </div>

                {/* Universal In-Person Support Badge */}
                <div className="bg-blue-50/90 border border-blue-200/80 rounded-md px-2.5 py-1.5 flex items-center gap-1.5 text-[11px] text-[#1E2761] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1E2761] shrink-0" />
                  <span>In-person airport & hospital support included</span>
                </div>

                {/* Procedures Accepted */}
                <div className="space-y-1">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">
                    Offered Procedures
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {clinic.procedures.map((p) => (
                      <span
                        key={p}
                        className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Average Wait Time:</span>
                    </span>
                    <span className="font-bold text-emerald-700">~{clinic.averageWaitDays} days</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-slate-400" />
                      <span>Cost / Coverage:</span>
                    </span>
                    <span className="font-semibold text-slate-800">{clinic.estimatedCost}</span>
                  </div>

                  <p className="text-[11px] text-slate-600 pt-1.5 border-t border-slate-200 leading-relaxed">
                    {clinic.coverageNote}
                  </p>
                </div>

                {/* Contact info */}
                <div className="text-[11px] text-slate-500 space-y-1 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{clinic.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Languages className="w-3 h-3 text-slate-400" />
                    <span>Languages: {clinic.languages.join(', ')}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onNavigate('new-case')}
                className="w-full py-2 bg-[#1E2761] hover:bg-[#151B45] text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Select for Case Intake</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
