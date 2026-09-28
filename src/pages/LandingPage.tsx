import React, { useState } from 'react';
import { TreatmentRule, Clinic } from '../types';
import { useI18n } from '../i18n';
import {
  ArrowRight,
  ChevronDown,
  HelpCircle,
  FileCheck2,
  Plane,
  FileText,
  ShieldAlert,
  Stethoscope,
  Scale,
  CheckCircle2,
} from 'lucide-react';

interface LandingPageProps {
  rules?: TreatmentRule[];
  clinics?: Clinic[];
  onNavigate: (tab: string, caseId?: string) => void;
  onOpenAuth?: (mode: 'login' | 'signup') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { language } = useI18n();
  const isHu = language === 'hu';

  // State for FAQ accordion (5 items)
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const scrollToFaq = () => {
    const el = document.getElementById('faq-accordion');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Process cards data
  const processCards = [
    {
      step: 1,
      badgeColor: 'bg-[#CADCFC] text-[#1E2761]',
      title: isHu ? 'Ossza meg velünk esetét' : 'Tell us your case',
      body: isHu
        ? "Adja meg a beavatkozást, a várakozási időt és a kitűzött kórházi időpontot. Töltse fel EESZT várólista-kivonatát a várakozás igazolására."
        : "Enter your procedure, how long you've waited, and any hospital date you've been given. Upload your EESZT waitlist record as proof of your wait.",
      footer: isHu
        ? 'Az élő EESZT-azonosítás a 2. fázis része; a pilotban feltöltéseket használunk.'
        : 'Live EESZT verification is Phase 2; uploads are used for the pilot.',
    },
    {
      step: 2,
      badgeColor: 'bg-[#CADCFC] text-[#1E2761]',
      title: isHu ? 'Feltérképezzük az útvonalát' : 'We map your route',
      body: isHu
        ? 'A beavatkozást egy rögzített szabálytáblázat alapján ellenőrizzük. Az éjszakai bentfekvést vagy speciális eszközöket igénylő ellátások az előzetes engedélyezési útra kerülnek; a többiek a kezelés-most-elszámolás-később útra.'
        : 'Your procedure is checked against a fixed rules table. Procedures needing an overnight stay or specialised equipment go on the pre-approval path; others go on the treat-now-and-claim-back path.',
      footer: isHu
        ? 'A besorolásról szabálytáblázat dönt, nem mesterséges intelligencia.'
        : 'A rules table decides this, not AI guesswork.',
    },
    {
      step: 3,
      badgeColor: 'bg-[#C9A24B] text-[#1E2761]',
      title: isHu ? 'Szakértőnk áttekinti az ügyét' : 'Our advisor reviews your case',
      body: isHu
        ? 'A CuraLink hivatalos orvosszakértője áttekinti az adatait és leleteit, majd megerősíti, hogy a várakozási idő orvosilag indokolható-e. Nem szükséges előzetesen saját orvosát felkeresnie.'
        : "A licensed CuraLink medical advisor reviews your details and records and confirms whether your wait is medically justifiable. You don't need to visit your own doctor first.",
      footer: isHu
        ? 'Szakértői jóváhagyás nélkül semmi sem kerül benyújtásra.'
        : 'Nothing is filed without advisor sign-off.',
    },
    {
      step: 4,
      badgeColor: 'bg-[#CADCFC] text-[#1E2761]',
      title: isHu ? 'Válassza ki a klinikát' : 'Choose your clinic',
      body: isHu
        ? 'Válasszon az útvonalának megfelelő, ellenőrzött klinikák közül: közkórházak az előzetes engedélyezési ügyekhez, illetve állami vagy magánklinikák az utólagos elszámoláshoz.'
        : 'Pick from verified clinics that match your route: public hospitals for pre-approval cases, public or private clinics for treat-and-claim cases.',
      footer: isHu
        ? 'Kizárólag az Ön útvonalát fogadni képes klinikák jelennek meg.'
        : 'Only clinics that can accept your route are shown.',
    },
    {
      step: 5,
      badgeColor: 'bg-[#CADCFC] text-[#1E2761]',
      title: isHu ? 'Előkészítjük és benyújtjuk' : 'We prepare and file',
      body: isHu
        ? 'A NEAK-nyomtatványokat előre kitöltjük, beleértve az utazási és kísérői költségtérítési kérelmeket is, ahol releváns. Ön írja alá kérelmezőként; esetmenedzserünk kinyomtatja, tértivevényesen postázza, majd egyeztet a NEAK-kal.'
        : 'Your NEAK forms are pre-filled, including travel and companion cost requests where they apply. You sign as the applicant; our case manager prints, sends by registered mail and follows up with NEAK.',
      footer: isHu
        ? "Ön marad a bejegyzett kérelmező. Az állapotfrissítések csapatunk NEAK-egyeztetéseiből származnak."
        : "You remain the applicant of record. Status updates come from our team's NEAK follow-ups.",
    },
    {
      step: 6,
      badgeColor: 'bg-[#CADCFC] text-[#1E2761]',
      title: isHu ? 'A NEAK elbírál és dönt' : 'NEAK reviews and decides',
      body: isHu
        ? 'Az előzetes engedélyezési ügyekben a NEAK megvizsgálja a kérelmét, és vagy engedélyezi, vagy elutasítja a kezelést. Esetmenedzserünk nyomon követi az eljárást a NEAK-nál, és amint döntés születik, frissíti az ügyét.'
        : 'For pre-approval cases, NEAK reviews your application and either authorises your treatment or refuses it. Our case manager follows up with NEAK and updates your case as soon as there is a decision.',
      footer: isHu
        ? 'Csak a NEAK engedélye után utazik. Elutasítás esetén segítünk a SOLVIT jogorvoslatban.'
        : 'You travel only after NEAK authorises. If refused, we help you appeal through SOLVIT.',
    },
    {
      step: 7,
      badgeColor: 'bg-[#1E2761] text-white',
      title: isHu ? 'Utazzon velünk, majd kapja vissza a költségeket' : 'Travel with us, then get reimbursed',
      body: isHu
        ? 'A CuraLink munkatársa a repülőtéren fogadja Önt, és a kórházban is Önnel marad a papírmunkához. Hazaérkezése után benyújtjuk a számlákat és orvosi iratokat, és végigkövetjük a megtérítést.'
        : 'A CuraLink team member meets you at the airport and stays with you at the hospital for paperwork. Back home, we submit your invoices and medical documents and track your reimbursement to the end.',
      footer: isHu
        ? 'Ha a NEAK elutasítja a kérelmet, segítünk a SOLVIT jogorvoslat benyújtásában.'
        : 'If NEAK refuses, we help you file a SOLVIT appeal.',
    },
  ];

  // FAQ Items
  const faqItems = [
    {
      question: isHu
        ? 'Szükséges előzetesen felkeresnem a saját orvosomat?'
        : 'Do I need to see my own doctor first?',
      answer: isHu
        ? "Nem, orvosszakértőnk vizsgálja felül az ügyét. Nem szükséges beutalót kérnie vagy külön látogatást tennie saját kezelőorvosánál a kezdéshez. A CuraLink kamarai orvosszakértője tekinti át az adatait és leleteit, és igazolja a várakozási idő orvosi indokoltságát."
        : "No, our medical advisor reviews your case. You don't need to visit your own doctor first. A licensed CuraLink medical advisor reviews your details and records and confirms whether your wait is medically justifiable.",
    },
    {
      question: isHu
        ? 'Ki a hivatalos kérelmező?'
        : 'Who is the applicant?',
      answer: isHu
        ? 'Ön a kérelmező; csapatunk a logisztikai és adminisztratív teendőket intézi. A jogszabályok értelmében Ön marad a bejegyzett kérelmező, miközben a CuraLink munkatársai előkészítik, postázzák a dokumentációt, és egyeztetnek a hatósággal.'
        : 'You are; our team handles logistics. You remain the applicant of record under administrative guidelines, while CuraLink pre-fills the paperwork, handles printing and registered postal dispatch, and communicates with NEAK on your behalf.',
    },
    {
      question: isHu
        ? 'Mi történik, ha a NEAK elutasítja a kérelmet?'
        : 'What if NEAK says no?',
      answer: isHu
        ? 'Ha a NEAK elutasítja a kérelmet, segítünk a SOLVIT jogorvoslat benyújtásában. A SOLVIT az Európai Bizottság díjmentes vitarendezési hálózata, amely az uniós polgárok határon átnyúló jogainak érvényesítését segíti a nemzeti hatóságokkal szemben.'
        : 'If NEAK refuses, we help you file a SOLVIT appeal. SOLVIT is the European Commission’s official mediation network designed to resolve cross-border disputes when national authorities do not respect EU healthcare regulations.',
    },
    {
      question: isHu
        ? 'Mi az az Európai Egészségbiztosítási Kártya (EHIC)?'
        : 'What is an EHIC?',
      answer: isHu
        ? 'Az EHIC egy ingyenes kártya a NEAK-tól, amely igazolja az Ön magyar biztosítási fedezetét külföldön. Alapvetően különbözik a magán utazási biztosítástól, és biztosítja, hogy a helyi közkórházi ellátás díjmentes vagy államilag szabályozott tarifán történjen.'
        : 'An EHIC is a free card from NEAK proving your Hungarian coverage abroad. It is completely different from private travel insurance and ensures that you are billed at local public health insurance rates during your treatment.',
    },
    {
      question: isHu
        ? 'Lehet egyszerre több ügyem is folyamatban?'
        : 'Can I have more than one case?',
      answer: isHu
        ? 'Egyszerre egy aktív ügye lehet. Így biztosítjuk, hogy orvosszakértőnk és esetmenedzserünk teljes figyelmet szentelhessen a kezelésének és a kíséretnek. Miután az aktuális ügy lezárult és a megtérítés megtörtént, készséggel nyithat új ügyet.'
        : 'You can have one active case at a time. This ensures our medical advisor and case managers dedicate their full focus to your procedure and travel. Once your current case closes after reimbursement, you can open a new one.',
    },
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* 1. Hero Section */}
      <section className="bg-gradient-to-b from-[#1E2761] to-[#151B45] text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-[#2B387E]">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#C9A24B]/15 border border-[#C9A24B]/35 text-[#C9A24B] text-xs font-semibold shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A24B]" />
              <span>
                {isHu
                  ? '70 000+ beteg évek óta magyar várólistákon, 2026'
                  : '70,000+ patients on Hungarian waiting lists for years, 2026'}
              </span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {isHu
              ? 'A hosszú várakozás nem dönthet az egészségéről.'
              : "Long waits shouldn't decide your health."}
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
            {isHu
              ? 'Éljen az uniós jogával a külföldi ellátásra, NEAK-térítéssel – csapatunk intézi a papírmunkát és Önnel utazik.'
              : 'Use your EU right to be treated abroad, reimbursed by NEAK, with our team handling the paperwork and travelling with you.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => onNavigate('new-case')}
              className="px-6 py-3.5 rounded-xl bg-[#C9A24B] hover:bg-[#b8913d] text-[#1E2761] font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>{isHu ? 'Kezdje el ügyét' : 'Start your case'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={scrollToFaq}
              className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/20 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <HelpCircle className="w-4 h-4 text-[#CADCFC]" />
              <span>{isHu ? 'Olvassa el a GYIK-et' : 'Read the FAQ'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Process Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-[#C9A24B]">
            {isHu ? 'ELJÁRÁSI FOLYAMAT' : 'PROCEDURAL ARCHITECTURE'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1E2761] mt-2">
            {isHu ? 'Hogyan vezeti végig a CuraLink az eljárást' : 'How CuraLink Navigates the Process'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            {isHu
              ? 'Átlátható, hétlépéses folyamat az első felméréstől a végső térítésig.'
              : 'A clear, seven-step journey from initial intake to final reimbursement.'}
          </p>
        </div>

        {/* 7 Cards: 3 per row on desktop, with the seventh card centred on the last row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {processCards.map((card) => (
            <div
              key={card.step}
              className={`bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow ${
                card.step === 7 ? 'md:col-start-2' : ''
              }`}
            >
              <div>
                <div
                  className={`w-9 h-9 rounded-lg ${card.badgeColor} font-bold flex items-center justify-center text-sm mb-4`}
                >
                  {card.step}
                </div>
                <h3 className="text-base font-bold text-slate-900">{card.title}</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{card.body}</p>
              </div>

              {/* Hairline divider above small grey footer note */}
              <div className="mt-6 pt-3.5 border-t border-slate-100 text-[11px] text-slate-500 leading-normal">
                {card.footer}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Two Paths, One Decision Made for You */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#C9A24B]">
            {isHu ? 'JOGI KERETEK' : 'LEGAL FRAMEWORKS'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1E2761] mt-2">
            {isHu
              ? 'Két eljárási út, egy Ön helyett meghozott döntés.'
              : 'Two paths, one decision made for you.'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            {isHu
              ? 'Az európai betegjogi keretrendszer két különálló eljárást biztosít az ellátás típusától függően.'
              : 'European cross-border healthcare rules provide two distinct legal mechanisms based on procedure type.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Path 1: Pre-approval path */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4 hover:border-slate-300 transition-colors">
            <div>
              <h3 className="text-base font-bold text-[#1E2761]">
                {isHu
                  ? 'Előzetes engedélyezési út (például térd- vagy csípőprotézis műtétekhez)'
                  : 'Pre-approval path (for procedures like knee or hip replacement)'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {isHu
                  ? 'Jogi alap: S2 nyomtatvány / 883/2004/EK rendelet'
                  : 'Legally: S2 / Regulation 883/2004'}
              </p>
            </div>

            <div className="space-y-3 pt-2 text-xs text-slate-700 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#1E2761] shrink-0 mt-0.5" />
                <span>
                  {isHu
                    ? 'A jóváhagyás még az utazás előtt megérkezik.'
                    : 'Approval comes before you travel.'}
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#1E2761] shrink-0 mt-0.5" />
                <span>
                  {isHu
                    ? 'Az orvosi költségeket a helyi állami biztosítottakkal azonos módon fedezik.'
                    : 'Medical costs are covered as for a local patient.'}
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#C9A24B] shrink-0 mt-0.5" />
                <span>
                  {isHu
                    ? 'Az utazási költségek megtérítése igényelhető, de nem garantált.'
                    : 'Travel costs can be requested but are not guaranteed.'}
                </span>
              </div>
            </div>
          </div>

          {/* Path 2: Treat now, claim back path */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4 hover:border-slate-300 transition-colors">
            <div>
              <h3 className="text-base font-bold text-[#1E2761]">
                {isHu
                  ? 'Kezelés most, elszámolás később út (például szürkehályog-műtéthez)'
                  : 'Treat now, claim back path (for procedures like cataract surgery)'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {isHu
                  ? 'Jogi alap: 2011/24/EU irányelv'
                  : 'Legally: Directive 2011/24/EU'}
              </p>
            </div>

            <div className="space-y-3 pt-2 text-xs text-slate-700 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#1E2761] shrink-0 mt-0.5" />
                <span>
                  {isHu
                    ? 'Előzetes jóváhagyás nélkül, közvetlenül utazhat a kezelésre.'
                    : 'You go without waiting for approval.'}
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#1E2761] shrink-0 mt-0.5" />
                <span>
                  {isHu
                    ? 'Kifizeti az ellátást, majd utólag visszaigényli a magyar belföldi ár vagy a külföldi ár közül az alacsonyabb összegig.'
                    : 'Pay, then claim back up to the lower of the Hungarian price or the price abroad.'}
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#1E2761] shrink-0 mt-0.5" />
                <span>
                  {isHu
                    ? 'Előzetesen írásbeli visszaigazolást kérhet a várható összegről.'
                    : 'You can request written confirmation of the expected amount beforehand.'}
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#C9A24B] shrink-0 mt-0.5" />
                <span>
                  {isHu
                    ? 'Magával viszi az Európai Egészségbiztosítási Kártyáját (EHIC).'
                    : 'You bring your EHIC.'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Note below */}
        <p className="text-center text-xs text-slate-500 mt-6 max-w-2xl mx-auto leading-relaxed">
          {isHu
            ? 'Az Ön eljárási útját a szabálytáblázatunk határozza meg és szakértőnk erősíti meg. Ezt nem Önnek kell kiválasztania.'
            : "Your path is set by our rules table and confirmed by your advisor. It isn't something you have to choose."}
        </p>
      </section>

      {/* 4. What We Do For You */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#C9A24B]">
            {isHu ? 'TELJES KÖRŰ TÁMOGATÁS' : 'COMPREHENSIVE SUPPORT'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1E2761] mt-2">
            {isHu ? 'Mit teszünk Önért' : 'What we do for you.'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            {isHu
              ? 'Minden lépésben orvosi, hivatali és személyes támaszt nyújtunk.'
              : 'Medical, administrative, and in-person assistance at every step of your journey.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Tile 1 */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#CADCFC]/40 text-[#1E2761] flex items-center justify-center">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                {isHu ? 'Orvosszakértői felülvizsgálat' : 'Medical advisor review'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isHu
                  ? 'Kamarai engedéllyel rendelkező orvosszakértőnk megvizsgálja leleteit és a hazai várólistás késedelmet a klinikai megalapozottság igazolására.'
                  : 'A licensed CuraLink physician reviews your waitlist evidence and medical records to substantiate medical justification.'}
              </p>
            </div>
          </div>

          {/* Tile 2 */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#CADCFC]/40 text-[#1E2761] flex items-center justify-center">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                {isHu ? 'Dokumentáció összeállítása és benyújtása' : 'Paperwork prepared and filed'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isHu
                  ? 'A hivatalos NEAK-kérelmeket és mellékleteket hiánytalanul előkészítjük, kinyomtatjuk, tértivevényesen postázzuk, és egyeztetünk a hivatallal.'
                  : 'Official NEAK forms are pre-filled, printed, sent by registered post, and followed up directly with NEAK case officers.'}
              </p>
            </div>
          </div>

          {/* Tile 3 */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#CADCFC]/40 text-[#1E2761] flex items-center justify-center">
                <Plane className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                {isHu
                  ? 'Személyes reptéri és kórházi kíséret'
                  : 'In-person airport and hospital support'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isHu
                  ? 'Munkatársunk a helyszíni repülőtéren fogadja Önt, elkíséri a klinikára, és a kórházban is Ön mellett marad a helyi adminisztráció intézésekor.'
                  : 'A CuraLink team member greets you at the airport and accompanies you to the hospital to assist with all on-site registration and paperwork.'}
              </p>
            </div>
          </div>

          {/* Tile 4 */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#CADCFC]/40 text-[#1E2761] flex items-center justify-center">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                {isHu
                  ? 'Követés a megtérítésig és fellebbezés'
                  : 'Tracking through to reimbursement and appeal'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isHu
                  ? 'Nyomon követjük a költségtérítést a kifizetésig, és elutasítás esetén teljes körű segítséget nyújtunk a SOLVIT jogorvoslat benyújtásához.'
                  : 'We track your claim through to final reimbursement settlement, and help file a SOLVIT appeal if NEAK unlawfully refuses your claim.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. What to Expect Strip */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-5 sm:p-6 text-center shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-[#C9A24B] mb-1.5">
            {isHu ? 'MIRE SZÁMÍTHAT' : 'WHAT TO EXPECT'}
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
            {isHu
              ? 'A megtérítésről és annak ütemezéséről a NEAK dönt. Előkészítjük és nyomon követjük a kérelmét, de az eredményt nem tudjuk garantálni. Az utazási és kísérői költségek megtérítése egyéni méltányosság tárgya.'
              : "NEAK decides reimbursement and its timing. We prepare and track your claim but can't guarantee the outcome. Travel and companion cost reimbursement is discretionary."}
          </p>
        </div>
      </section>

      {/* 6. FAQ Accordion (5 items) */}
      <section id="faq-accordion" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#C9A24B]">
            {isHu ? 'KÉRDÉSEK ÉS VÁLASZOK' : 'FREQUENTLY ASKED QUESTIONS'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1E2761] mt-2">
            {isHu ? 'Gyakran Ismételt Kérdések' : 'Frequently Asked Questions'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            {isHu
              ? 'A legfontosabb válaszok a határon átnyúló ellátás folyamatáról.'
              : 'Clear answers to essential questions about the process.'}
          </p>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs transition-colors"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-bold text-slate-900">{item.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'transform rotate-180 text-[#1E2761]' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. Closing Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#1E2761] text-white rounded-2xl p-8 sm:p-12 text-center space-y-5 shadow-md">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            {isHu ? 'Készen áll az indulásra?' : 'Ready to start?'}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            {isHu
              ? 'Tegye meg még ma az első lépést a gyorsabb gyógyulás felé a CuraLink orvosi és szervezési támogatásával.'
              : 'Take the first step toward timely cross-border treatment with CuraLink’s medical and logistical guidance.'}
          </p>

          <div className="pt-2">
            <button
              onClick={() => onNavigate('new-case')}
              className="px-8 py-3.5 rounded-xl bg-[#C9A24B] hover:bg-[#b8913d] text-[#1E2761] font-bold text-sm shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <span>{isHu ? 'Hozza létre ügyét' : 'Create your case'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
