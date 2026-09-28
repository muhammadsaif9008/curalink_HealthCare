import React, { useState } from 'react';
import {
  HelpCircle,
  Scale,
  ShieldAlert,
  FileCheck,
  Plane,
  ChevronDown,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

export const ResourcesPage: React.FC = () => {
  const [openSection, setOpenSection] = useState<string | null>('ehic-s2-directive');

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  const faqItems = [
    {
      id: 'ehic-s2-directive',
      title: 'EHIC vs. S2 vs. The Directive Route — What Each Is and Isn’t',
      content: (
        <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
          <p>
            Understanding the distinction between these three mechanisms is essential to exercising your rights without unexpected costs:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <div className="font-bold text-[#1E2761]">1. EHIC (Kék Kártya)</div>
              <p className="text-[11px] text-slate-600">
                Issued free by NEAK. Designed primarily for <em>unplanned / medically necessary care</em> during temporary stays abroad (e.g. accidents, acute illnesses). It proves you are covered by Hungarian public health insurance so you are billed at the local insured rate, but it is <strong>not</strong> permission for planned specialist surgery on its own.
              </p>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-1">
              <div className="font-bold text-amber-950">2. S2 Portable Document</div>
              <p className="text-[11px] text-amber-900">
                Governed by EU Regulation 883/2004. Requires <strong>Prior Authorisation (PA) from NEAK before travel</strong>. If granted, you are treated in a public hospital abroad under the host country&apos;s public health system — treated exactly as if you were a local resident, with zero out-of-pocket for covered hospital care.
              </p>
            </div>

            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-1">
              <div className="font-bold text-emerald-950">3. Directive 2011/24/EU</div>
              <p className="text-[11px] text-emerald-900">
                Governs cross-border healthcare rights. For outpatient day-surgeries (non-PA), <strong>no pre-approval is required</strong>. The patient pays the foreign provider (public or private) directly and files for post-treatment reimbursement from NEAK, capped at the lower of the Hungarian domestic tariff or the foreign price.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'no-ehic',
      title: 'What Happens If You Don’t Have an EHIC Card?',
      content: (
        <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
          <p>
            If you travel to another EU country without a valid European Health Insurance Card:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-slate-600">
            <li>
              The foreign hospital or clinic may bill you at their private/uninsured rate, which can be significantly higher than the public tariff.
            </li>
            <li>
              Under the Directive route (non-PA outpatient care), you can still claim reimbursement from NEAK after you return home, but NEAK will only reimburse up to the official Hungarian public tariff equivalent — any difference between the uninsured foreign rate and the Hungarian ceiling remains your out-of-pocket expense.
            </li>
            <li>
              Under the S2 route, an approved S2 document acts as a direct financial guarantee from NEAK to the treating state&apos;s health authority, bypassing EHIC billing altogether for the scheduled inpatient procedure.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'travel-costs',
      title: 'What Travel-Cost Reimbursement Covers (and What It Doesn’t Guarantee)',
      content: (
        <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
          <p>
            Under Hungarian Decree 340/2013, NEAK&apos;s official application form includes dedicated sections to request travel cost reimbursement for the patient and an accompanying person:
          </p>
          <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-[11px] text-amber-950 space-y-1">
            <span className="font-bold">Discretionary Nature (&apos;Méltányosság&apos;): </span>
            Unlike the medical treatment itself under S2, travel-cost reimbursement is strictly discretionary. NEAK evaluates travel requests based on:
            <ul className="list-disc list-inside pl-2 space-y-0.5 mt-1">
              <li>The treating doctor&apos;s written confirmation that the patient cannot travel autonomously.</li>
              <li>Documented physical disability or medical necessity requiring companion assistance.</li>
              <li>Most economical public transport fares or verified ambulance dispatch.</li>
            </ul>
            <p className="pt-1 font-semibold text-amber-900">
              CuraLink includes the formal travel-cost fields in the generated S2 application, but we always advise patients that travel reimbursement is not guaranteed by right.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'solvit-explained',
      title: 'What Is SOLVIT and When Should You File an Appeal?',
      content: (
        <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
          <p>
            <strong>SOLVIT</strong> is a free, informal dispute resolution network established by the European Commission and operated by national administrations in every EU/EEA country.
          </p>
          <div className="space-y-2 text-[11px] text-slate-600">
            <p>
              Under Article 20 of Regulation (EC) 883/2004 and landmark European Court of Justice rulings (such as Case C-372/04 <em>Watts</em> and Case C-56/01 <em>Inizan</em>), a national health authority <strong>cannot refuse prior authorisation</strong> if the treatment cannot be provided domestically within a medically justifiable time based on an objective clinical assessment of the patient&apos;s individual condition.
            </p>
            <p>
              If NEAK refuses an S2 pre-approval citing generalized domestic capacity or theoretical waitlist dates, CuraLink generates an official <strong>SOLVIT dispute brief</strong> that is submitted directly to the Hungarian SOLVIT center (hosted in the Prime Minister&apos;s Office) and the destination country&apos;s SOLVIT desk. National authorities are required by EU guidelines to resolve SOLVIT cases within 10 weeks.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'legal-rep-akr',
      title: 'Why CuraLink Does Not Offer In-App Digital Signature Authorization',
      content: (
        <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
          <p>
            Hungary&apos;s General Administrative Procedure Code (Ákr. — 2016. évi CL. törvény) sets strict evidentiary requirements for legal representation before administrative bodies like NEAK.
          </p>
          <p className="text-[11px] text-slate-600">
            To formally represent an applicant, the authorization must either be executed before a public notary, witnessed by two private individuals in hard copy, or signed with an eIDAS-compliant Qualified Electronic Signature (QES). A simple in-app checkbox or digital drawing does not satisfy Hungarian law.
          </p>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700">
            <strong>CuraLink&apos;s Safe Operating Model: </strong>
            The applicant of record is always the patient, their legal guardian, or their treating doctor. CuraLink acts as <em>logistics and administrative support</em> — preparing the dossier, printing, registered postal dispatch, and phone follow-up. Formal legal representation is a Phase 2 roadmap item requiring certified trust services.
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C9A24B]">
          <BookOpen className="w-4 h-4" />
          <span>Knowledge Base & Legal Guidance</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1E2761]">
          Patient Rights, Directives & Regulatory Resources
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
          Plain-language legal explanations grounded in European Union cross-border healthcare jurisprudence and Hungarian administrative procedure.
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-4">
        {faqItems.map((item) => {
          const isOpen = openSection === item.id;
          return (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all"
            >
              <button
                onClick={() => toggleSection(item.id)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <span className="text-sm font-bold text-[#1E2761]">
                  {item.title}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 border-t border-slate-100 animate-in fade-in">
                  {item.content}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* External Authority Resources */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          Official EU & Hungarian Primary Sources
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <a
            href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32011L0024"
            target="_blank"
            rel="noreferrer"
            className="p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors flex items-center justify-between text-slate-800"
          >
            <div>
              <div className="font-semibold">Directive 2011/24/EU</div>
              <div className="text-[11px] text-slate-500">Cross-Border Patient Rights in the EU</div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          <a
            href="https://ec.europa.eu/solvit/"
            target="_blank"
            rel="noreferrer"
            className="p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors flex items-center justify-between text-slate-800"
          >
            <div>
              <div className="font-semibold">European Commission SOLVIT</div>
              <div className="text-[11px] text-slate-500">Cross-Border Rights Dispute Mechanism</div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          <a
            href="http://www.neak.gov.hu"
            target="_blank"
            rel="noreferrer"
            className="p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors flex items-center justify-between text-slate-800"
          >
            <div>
              <div className="font-semibold">NEAK (Nemzeti Egészségbiztosítási Alapkezelő)</div>
              <div className="text-[11px] text-slate-500">Nemzetközi Főosztály Portal</div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          <a
            href="https://curia.europa.eu/juris/document/document.jsf?text=&docid=57529&pageIndex=0&doclang=EN&mode=req&dir=&occ=first&part=1&cid=1114947"
            target="_blank"
            rel="noreferrer"
            className="p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors flex items-center justify-between text-slate-800"
          >
            <div>
              <div className="font-semibold">CJEU Case C-372/04 (Watts)</div>
              <div className="text-[11px] text-slate-500">Precedent on Undue Waiting Times & Prior Authorisation</div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>
      </div>
    </div>
  );
};
