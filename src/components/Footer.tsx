import React from 'react';
import { ShieldAlert, ExternalLink, Scale, FileText } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-auto">
      {/* Official Required Persistent Disclaimer Panel */}
      <div className="bg-[#13193E] border-b border-[#1E2761] py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-start gap-3.5">
          <ShieldAlert className="w-5 h-5 text-[#C9A24B] shrink-0 mt-0.5" />
          <div className="space-y-1.5 text-slate-300 leading-relaxed text-xs">
            <div className="font-semibold text-white tracking-wide uppercase text-[11px] flex items-center gap-2">
              <span>Mandatory Pilot & Regulatory Notice</span>
              <span className="text-[#C9A24B] font-normal">·</span>
              <span className="text-slate-400 font-normal">Demonstration Environment</span>
            </div>
            <p>
              This is a demo prototype. AI-drafted content is a suggestion based on self-reported information, not verified fact, and is not legal, medical, or reimbursement advice. Every real case is confirmed by a licensed advisor before filing. TAJ numbers are never real in this demo. NEAK submission and status updates shown here are simulated or manually entered by a case manager, since NEAK does not offer a public digital submission API today. Formal patient representation requires legal instruments this demo does not implement. In production, patient identity and wait-time data would be authenticated and sourced through Hungary&apos;s government login and EESZT, not stored independently by this app.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Navigation & Legal Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand summary */}
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-[#CADCFC] text-[#1E2761] font-bold flex items-center justify-center text-sm">
                C
              </span>
              <span className="text-white font-bold text-base">CuraLink</span>
              <span className="text-[11px] text-[#CADCFC] border border-[#CADCFC]/30 px-1.5 py-0.5 rounded font-medium">
                Navigate Care Beyond Borders
              </span>
            </div>
            <p className="text-slate-400 text-xs max-w-md leading-relaxed">
              Assisting Hungarian hospital waitlist patients in exercising their existing legal rights under EU Regulation 883/2004 and Directive 2011/24/EU for timely cross-border care.
            </p>
            <div className="text-[11px] text-slate-500 pt-1">
              Empowering patient mobility under European Union cross-border healthcare frameworks.
            </div>
          </div>

          {/* Core Routes */}
          <div>
            <div className="font-semibold text-white text-xs uppercase tracking-wider mb-3">
              Application
            </div>
            <ul className="space-y-1.5">
              <li>
                <button
                  onClick={() => onNavigate('landing')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  My Cases (Status Tracker)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('new-case')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Case Intake & Evidence
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('clinics')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Partner Clinic Directory
                </button>
              </li>
            </ul>
          </div>

          {/* Legal Framework & Transparency */}
          <div>
            <div className="font-semibold text-white text-xs uppercase tracking-wider mb-3">
              Governance & Framework
            </div>
            <ul className="space-y-1.5">
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>About this Pilot</span>
                  <span className="text-[10px] text-[#C9A24B]">(Disclosures)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('resources')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  EHIC vs S2 vs Directive
                </button>
              </li>
              <li>
                <a
                  href="https://ec.europa.eu/solvit/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>EU SOLVIT Network</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <span className="text-slate-500 text-[11px]">
                  Hungarian Ákr. Representation Rule
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom micro-links */}
        <div className="border-t border-slate-800 mt-8 pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <div>
            © 2026 CuraLink Pilot Initiative. Non-production demo. Not affiliated with NEAK or EESZT.
          </div>
          <div className="flex items-center gap-4">
            <span>Budapest · Vienna · Bratislava</span>
            <span>·</span>
            <span>GDPR Health Data Safeguards</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
