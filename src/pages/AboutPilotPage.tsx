import React from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  FileCheck,
  Building2,
  Scale,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';

interface AboutPilotPageProps {
  onNavigate: (tab: string) => void;
}

export const AboutPilotPage: React.FC<AboutPilotPageProps> = ({ onNavigate }) => {
  const comparisonItems = [
    {
      domain: 'Decision & Legal Logic',
      realInBuild: 'Deterministic rules table strictly categorizing procedures (inpatient S2 vs outpatient Directive). Medically justifiable time test modeled on CJEU Case C-372/04.',
      simulatedOrPhase2: 'Rules table covers 5 flagship procedures; production requires complete official NEAK BNO/OENO code ontology matching thousands of billing items.',
    },
    {
      domain: 'AI Legal Reasoning',
      realInBuild: 'Live server-side call to Google Gemini 3.8 Flash SDK (@google/genai). Generates plain-language reasoning under 60 words and 120-180 word formal NEAK letters.',
      simulatedOrPhase2: 'All letters use placeholders ([Patient name on file], [TAJ on file]). In production, letters are compiled from authenticated government identity records.',
    },
    {
      domain: 'EESZT Waitlist Verification',
      realInBuild: 'Patient uploads PDF/image proof from their own EESZT citizen-portal record. Structural completeness check validates dates and metadata.',
      simulatedOrPhase2: 'Live automated data pull directly from EESZT requires certified e-Health integration under Act XLVII of 1997, pursued as a regulatory pilot partnership.',
    },
    {
      domain: 'Treating Doctor Verification',
      realInBuild: 'Structural check validates license presence, date, and name. Cross-checked against a seeded mock Hungarian Medical Chamber (MOK) registry.',
      simulatedOrPhase2: 'Production will connect directly to the public ENKK / OKFŐ healthcare professional registry API.',
    },
    {
      domain: 'NEAK Submission & Updates',
      realInBuild: 'Simulated reference number generator (NEAK-2026-XXXXXX) with timestamped audit history and presenter telephone follow-up control.',
      simulatedOrPhase2: 'NEAK operates no public digital submission API today. Real pilot cases are physically printed and sent via registered post, followed up by case managers by phone.',
    },
    {
      domain: 'Legal Representation Model',
      realInBuild: 'Applicant of record is strictly Patient, Guardian, or Doctor. Case manager is logistics support only.',
      simulatedOrPhase2: 'Formal digital representation under Hungary&apos;s Ákr. requires notarized instruments or Qualified Electronic Signatures (QES); not implemented via simple web checkboxes.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#CADCFC]/30 border border-[#CADCFC] text-[#1E2761] text-xs font-semibold">
          <span>Operational Architecture & Regulatory Disclosure</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1E2761]">
          About CuraLink: Real vs. Future Phase Architecture
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
          CuraLink is built with transparency as a core design principle. Here is an honest accounting of our working full-stack implementation versus future regulatory partnership milestones.
        </p>
      </div>

      {/* Honesty Framing Manifesto */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#1E2761]">
          The Thesis: Closing the Awareness and Logistics Gap
        </h2>
        <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
          <p>
            Tens of thousands of Hungarian citizens endure agonizing delays on public hospital waitlists for major joint replacements, cataract surgeries, and cardiovascular procedures. Yet in 2023, NEAK approved only <strong>428 foreign treatments</strong>, 99% of which were processed as exceptional discretionary &apos;equity&apos; petitions.
          </p>
          <p>
            The standard legal route — guaranteed under Article 20 of Regulation (EC) 883/2004 and Directive 2011/24/EU — is almost completely undiscovered by patients and overburdened physicians. CuraLink bridges this gap not by inventing new laws, but by automating procedural navigation and evidence assembly.
          </p>
          <div className="p-3 bg-blue-50 border-l-4 border-[#1E2761] rounded text-slate-800 text-xs">
            <strong>Universal In-Person Support: </strong>
            In-person airport pickup and on-site hospital support are a core part of every patient&apos;s journey with CuraLink, provided by our own team members traveling with or meeting the patient at each partner location.
          </div>
          <div className="p-3 bg-slate-50 border-l-4 border-[#C9A24B] rounded text-slate-800 text-[11px]">
            <strong>Market Size Discipline: </strong>
            We measure 70,000+ people as the scale of the underlying waitlist problem. How many patients possess the physical autonomy, family support, and willingness to travel to Vienna, Bratislava, or Poznań is an empirical question this platform is designed to answer.
          </div>
        </div>
      </div>

      {/* Real vs Simulated Comparison Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Technical Architecture Matrix
            </h3>
            <p className="text-[11px] text-slate-500">
              Detailed breakdown of live software features vs. future regulatory integrations.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Audit Reference 2026</span>
        </div>

        <div className="divide-y divide-slate-100">
          {comparisonItems.map((item, idx) => (
            <div key={idx} className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="font-bold text-[#1E2761] md:col-span-1">
                {item.domain}
              </div>

              <div className="space-y-1 md:col-span-1">
                <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5 uppercase">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Real in this Build</span>
                </div>
                <p className="text-slate-700 leading-relaxed text-[11px]">
                  {item.realInBuild}
                </p>
              </div>

              <div className="space-y-1 md:col-span-1">
                <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 uppercase">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Simulated / Phase 2 Roadmap</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  {item.simulatedOrPhase2}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Regulatory Partnership Roadmap */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 space-y-4">
        <h3 className="text-sm font-bold text-[#1E2761]">
          Phase 2 Regulatory & Institutional Milestones
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-900">1. EESZT Integration</div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Achieve certified intermediary status under the Hungarian e-Health framework to permit authenticated waitlist retrieval via citizen Ügyfélkapu SSO.
            </p>
          </div>

          <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-900">2. NEAK Institutional Desk</div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Establish a structured digital intake protocol with NEAK&apos;s International Affairs Department to accelerate S2 prior-authorisation throughput.
            </p>
          </div>

          <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-900">3. eIDAS QES Signatures</div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Integrate Qualified Electronic Signatures (QES) to legally empower case managers as formal representatives under Hungary&apos;s Ákr. code.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Strip */}
      <div className="p-6 bg-[#1E2761] text-white rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="font-bold text-sm">Experience the End-to-End Decision Flow</div>
          <div className="text-xs text-[#CADCFC] mt-0.5">Explore active cases or run a sample intake with live Gemini reasoning.</div>
        </div>
        <button
          onClick={() => onNavigate('new-case')}
          className="px-5 py-2.5 rounded-lg bg-[#C9A24B] hover:bg-[#b8913d] text-[#1E2761] font-bold text-xs transition-colors shrink-0 cursor-pointer"
        >
          Start Sample Intake
        </button>
      </div>
    </div>
  );
};
