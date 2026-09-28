import React, { useState } from 'react';
import { UserProfile } from '../types';
import { useI18n } from '../i18n';
import { api } from '../services/api';
import {
  Stethoscope,
  ShieldCheck,
  User,
  FileCheck2,
  Save,
  CheckCircle2,
  AlertCircle,
  Building2,
  Info,
} from 'lucide-react';

interface AdvisorProfilePageProps {
  currentUser: UserProfile | null;
  onUserUpdated: (user: UserProfile) => void;
}

export const AdvisorProfilePage: React.FC<AdvisorProfilePageProps> = ({
  currentUser,
  onUserUpdated,
}) => {
  const { language } = useI18n();

  const [name, setName] = useState(currentUser?.name || 'Dr. Varga Zsuzsa');
  const [mokLicense, setMokLicense] = useState(currentUser?.mokLicense || 'MOK-HU-48192');
  const [specialty, setSpecialty] = useState(currentUser?.specialty || 'Ortopédia és Traumatológia');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Advisor name is required.');
      return;
    }
    if (!mokLicense.trim()) {
      setErrorMsg('MOK License number is required.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await api.updateProfile({
        id: currentUser?.id,
        name: name.trim(),
        mokLicense: mokLicense.trim().toUpperCase(),
        specialty: specialty.trim(),
      });

      if (res.success && res.user) {
        onUserUpdated(res.user);
        setSuccessMsg('Advisor profile updated successfully. Your credentials are now active on all generated legal filings.');
        setTimeout(() => setSuccessMsg(null), 5000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update advisor profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-[#1E2761] text-white rounded-2xl p-6 sm:p-8 shadow-sm space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9A24B]/20 text-[#C9A24B] border border-[#C9A24B]/30 text-xs font-bold uppercase tracking-wider">
          <Stethoscope className="w-3.5 h-3.5" />
          <span>Medical Advisor Credential Registry</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile & Clinical License</h1>
        <p className="text-xs text-[#CADCFC] max-w-2xl leading-relaxed">
          Your credentials configured here are stamped in the treating-doctor position on official NEAK S2 prior-authorisation applications and Directive cross-border reimbursement filings when you endorse patient cases.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Form & Credentials Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Physician Identity & Chamber Information
          </h2>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Legal & Professional Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#1E2761] outline-hidden font-medium text-slate-900"
                  placeholder="Dr. Varga Zsuzsa"
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Appears on NEAK applications as the endorsing physician.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                MOK (Magyar Orvosi Kamara) License Number
              </label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 text-[#C9A24B] absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={mokLicense}
                  onChange={(e) => setMokLicense(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#1E2761] outline-hidden font-mono uppercase text-slate-900 font-bold"
                  placeholder="MOK-HU-48192"
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Official Hungarian Chamber registration ID required for S2 cross-border prior authorisation endorsements.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Medical Specialty / Qualification
              </label>
              <div className="relative">
                <Stethoscope className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#1E2761] outline-hidden text-slate-900 font-medium"
                  placeholder="Ortopédia és Traumatológia"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Advisor Email (Internal)
              </label>
              <input
                type="email"
                disabled
                value={currentUser?.email || 'varga.zsuzsa@curalink.hu'}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-500 font-mono"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-[#1E2761] hover:bg-[#151B45] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5 text-[#C9A24B]" />
                <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Legal & Compliance Sidebar Card */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-[#1E2761]">
              <FileCheck2 className="w-4 h-4 text-emerald-600" />
              <span>Legal Document Binding</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Under EU Regulation 883/2004 Article 20, an application for S2 pre-authorisation requires treating doctor credentials demonstrating that required care cannot be given domestically without medically unjustifiable delay.
            </p>
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 space-y-1">
              <div className="font-bold text-emerald-950 text-[11px] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Active Treating-Doctor Stamp</span>
              </div>
              <p className="text-[10px] text-emerald-800 leading-normal">
                {name} ({mokLicense}) is currently attached to all reviewed dossiers.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <Building2 className="w-4 h-4 text-[#1E2761]" />
              <span>Chamber Affiliation</span>
            </div>
            <div className="text-[11px] text-slate-600 space-y-1">
              <div>Organization: <strong>Magyar Orvosi Kamara (MOK)</strong></div>
              <div>Status: <strong className="text-emerald-700 font-semibold">Active & Registered</strong></div>
              <div>Specialist Registry: <strong>{specialty}</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
