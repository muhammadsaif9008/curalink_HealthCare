import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'hu';

export interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Brand & Header
    'brand.title': 'CuraLink',
    'brand.tagline': 'Navigate Care Beyond Borders',
    'brand.micro': 'Cross-Border Healthcare Navigator · EU Regulation 883/2004 & Directive 2011/24/EU',
    'nav.overview': 'How It Works',
    'nav.myCases': 'My Cases',
    'nav.newCase': '+ New Case',
    'nav.clinics': 'EU Clinics',
    'nav.faq': 'Resources & FAQ',
    'nav.about': 'About CuraLink',
    'nav.resetDemo': 'Reset Demo Data',

    // Plain Language Path Names
    'path.pa': 'Fast-track pre-approval path',
    'path.nonPa': 'Standard treatment-and-claim path',
    'path.pa.desc': 'For inpatient procedures requiring overnight hospital stay. NEAK pre-authorises coverage before you travel so your hospital care is covered.',
    'path.nonPa.desc': 'For outpatient day-surgeries. Go directly to treatment and claim reimbursement back from NEAK afterwards up to the domestic tariff.',
    'path.pa.badge': 'Pre-Approval Path',
    'path.nonPa.badge': 'Go-Now & Claim Path',

    // Tracker Stages
    'stage.Drafted': 'Drafted',
    'stage.Drafted.sub': 'Evidence & Intake',
    'stage.Awaiting Advisor Review': 'Awaiting Advisor Review',
    'stage.Awaiting Advisor Review.sub': 'Medical Urgency Review',
    'stage.More Info Requested': 'More Info Requested',
    'stage.More Info Requested.sub': 'Additional Records Needed',
    'stage.Reviewed': 'Reviewed',
    'stage.Reviewed.sub': 'Advisor Gate Passed',
    'stage.Submitted': 'Submitted',
    'stage.Submitted.sub': 'NEAK Registered Mail',
    'stage.neakDecision': 'NEAK decision',
    'stage.neakDecision.sub': 'Authorised or rejected',
    'stage.Authorised': 'Authorised',
    'stage.Authorised.sub': 'Approval Issued',
    'stage.Travelling / In Treatment': 'Travelling / In Treatment',
    'stage.Travelling / In Treatment.sub': 'Care & On-Site Support',
    'stage.Travelling': 'Travelling / In Treatment',
    'stage.Travelling.sub': 'Care & On-Site Support',
    'stage.Treated': 'Treated',
    'stage.Treated.sub': 'Care Received Abroad',
    'stage.Reimbursed': 'Reimbursed',
    'stage.Reimbursed.sub': 'Settled with NEAK',
    'stage.Case closed': 'Case closed',
    'stage.Case closed.sub': 'Settled with NEAK',
    'stage.Rejected': 'Rejected',
    'stage.Rejected.sub': 'Refusal Received',
    'stage.SOLVIT Appeal Drafted': 'SOLVIT Appeal Drafted',
    'stage.SOLVIT Appeal Drafted.sub': 'EU Mediation Active',
    'stage.Solvit': 'SOLVIT Appeal Drafted',
    'stage.Solvit.sub': 'EU Mediation Active',

    // Case Manager & Operations
    'ops.title': 'Care Operations & Logistics Panel',
    'ops.back': 'Back to Operations & Cases',
    'ops.readyToSend': 'Ready to send to NEAK',
    'ops.patientArrived': 'Patient arrived',
    'ops.markTreated': 'Mark treatment as complete',
    'ops.dispatchChecklist': 'Dispatch Checklist',
    'ops.step1Signed': '1. Signed form received',
    'ops.step2Mailed': '2. Mark as mailed',
    'ops.step3Submitted': '3. Submitted to NEAK',
    'ops.signedOriginalInHand': 'Signed original in hand',
    'ops.dateSent': 'Date sent',
    'ops.trackingNumber': 'Registered-mail tracking number',
    'ops.followUpButton': 'NEAK Follow-up Call',
    'ops.decisionLetter': 'Decision Letter Scan',
    'ops.travelSupportDecision': 'Travel Support Decision',
    'ops.travelSupportNotRequested': 'Not requested',
    'ops.travelSupportNotGranted': 'Not granted',
    'ops.travelSupportGranted': 'Granted',
    'ops.travelSupportAmount': 'Travel support amount',
    'ops.travelSupportTiming': 'Timing',
    'ops.beforeTravel': 'Before travel',
    'ops.afterTravel': 'After travel',
    'ops.markTravelSupportPaid': 'Travel support paid',
    'ops.travelSupportPaidBadge': 'Travel support paid before travel',
    'ops.closeS2Title': 'Close Case: Settle with NEAK',
    'ops.confirmSettlement': 'NEAK–clinic settlement confirmed',
    'ops.travelOrCompanionPaid': 'Travel or companion support paid',
    'ops.otherPayment': 'Other payment to patient',
    'ops.closeCaseBtn': 'Confirm Settlement & Close Case',
    'ops.markReimbursedTitle': 'Record NEAK Reimbursement',
    'ops.reimbursementAmount': 'Reimbursement amount',
    'ops.reimbursementDate': 'Settlement date',
    'ops.confirmReimbursement': 'Mark Reimbursed',

    // Patient Banner Messages
    'patient.s2Submitted': 'Your application is with NEAK. Our case manager is following up and will update you as soon as there is a decision.',
    'patient.s2Authorised': 'NEAK has authorised your treatment. Your case manager will confirm your travel details.',
    'patient.s2Rejected': 'NEAK has not authorised this request. We will explain your options, including an appeal.',
    'patient.reviewedMsg': 'Your advisor approved your case. Our case manager will contact you to collect your signature and send your application to NEAK.',
    'patient.downloadForSigning': 'Download form for signing',
    'patient.waitingNeakMsg': 'Waiting for NEAK\'s decision. Our case manager is following up.',
    'patient.authorisedMsg': 'S2 pre-authorisation granted by NEAK. Our case manager is coordinating travel and support logistics.',
    'patient.treatmentUnderwayMsg': 'You are currently in treatment abroad. Your assigned on-site coordinator is assisting you.',
    'patient.s2TreatedMsg': 'Treatment complete. Case manager is finalizing documentation and NEAK settlement.',
    'patient.directiveUploadPrompt': 'Treatment complete. Please upload your invoices, translations, and discharge summary so our case manager can dispatch your claim.',

    // Closed Case Congratulation Screen
    'congrats.directive': 'Congratulations, your reimbursement of {amount} has been received.',
    'congrats.preapproval': 'Congratulations, your treatment is complete and fully settled.',
    'congrats.travelPaid': 'Your travel support of {amount} has been paid.',
    'congrats.closing': 'We\'re glad we could be with you. Wishing you a smooth recovery.',
    'congrats.startNew': 'Start a new case',

    // Hero & Landing
    'hero.badge': 'EU Cross-Border Healthcare Navigator',
    'hero.title': 'Stuck on a Hospital Waitlist in Hungary?',
    'hero.titleSub': 'Your EU Legal Right to Treatment Abroad Is Already Law.',
    'hero.desc': 'Under EU Regulation 883/2004 and Directive 2011/24/EU, insured Hungarian patients facing medically unacceptable domestic hospital wait times can obtain authorized care in another EU Member State with NEAK reimbursement. CuraLink turns bureaucratic friction into clear, legally structured applications.',
    'hero.startCase': 'Start Case Intake',
    'hero.exploreCases': 'Explore Active Cases',
    'hero.aboutCuraLink': 'About CuraLink & Legal Disclosures →',

    // Stats
    'stats.gapTitle': 'The Scale of the Awareness and Paperwork Gap',
    'stats.gapSub': 'Official Hungarian National Health Insurance (NEAK) and Ministry of Health benchmarks.',
    'stats.gapNote': '*Framed as people facing the underlying delay problem; willingness and ability to travel are open empirical questions.',
    'stats.waitCount': '70,000+',
    'stats.waitLabel': 'Patients on Domestic Public Waitlists',
    'stats.waitDesc': 'Major joint replacements and specialist surgeries frequently record waiting times exceeding 18 to 28 months across regional hospitals.',
    'stats.approvedCount': 'Only 428',
    'stats.approvedLabel': 'Foreign Treatments Approved in 2023',
    'stats.approvedDesc': 'Against tens of thousands waiting, NEAK granted just 428 approvals in 2023 and 367 in 2022. The formal cross-border option is virtually unknown.',
    'stats.equityCount': '99%',
    'stats.equityLabel': 'Processed as Discretionary \'Equity\'',
    'stats.equityDesc': 'Almost all approved requests were one-off exceptional petitions (\'méltányosság\'), while standard waitlist-based rights under EU law remain unused.',

    // Support section
    'support.aloneTitle': 'You\'re Not Doing This Alone',
    'support.cardTitle': 'Dedicated In-Person Airport & Hospital Support',
    'support.cardText': 'A CuraLink team member will meet you at the airport, help you get to the hospital, and stay with you for any paperwork on-site — so you don\'t have to manage any of that yourself while you\'re focused on your treatment.',
    'support.contact': 'Your support contact',
    'support.uploadAbroadBtn': 'Upload a document from abroad',
    'support.uploadAbroadDesc': 'Don\'t wait until you\'re home — send us paperwork the moment you get it. Our team with you in person will also help make sure nothing gets lost.',
    'support.markComplete': 'Mark treatment as complete',
    'support.markCompleteDesc': 'Click once treatment has concluded to advance the case to final reimbursement settlement.',
    'support.badgeClinic': 'In-person airport & hospital support included',

    // Case Intake Wizard
    'intake.title': 'Start Your Cross-Border Healthcare Case',
    'intake.subtitle': 'Answer a few short guided questions to determine your legal path and prepare your NEAK filing.',
    'intake.step1': 'What treatment do you need?',
    'intake.step2': 'How long have you been waiting?',
    'intake.step3': 'Let\'s check your options & assistance',
    'intake.step4': 'Review & Start Case',
    'intake.next': 'Next Step',
    'intake.back': 'Back',
    'intake.submit': 'Generate Legal Application with AI',
    'intake.submitting': 'Analyzing eligibility & drafting official documents...',

    // Evidence Gate Wizard (PA branch)
    'evidence.title': 'Evidence Gate & Medical Justification Wizard',
    'evidence.subtitle': 'Gathering verified proof to satisfy the EU medically justifiable time standard.',
    'evidence.step1Title': 'How long have you waited?',
    'evidence.step2Title': 'Upload your proof',
    'evidence.step3Title': 'Your doctor\'s note',
    'evidence.step4Title': 'Verify your doctor',
    'evidence.whyAsk': 'Why we ask this (Legal Background)',
    'evidence.whyAskText': 'Under Article 20 of EU Regulation 883/2004 and European Court of Justice rulings (Case C-372/04 Watts), NEAK can only deny a pre-approval request if the treatment can be provided domestically within a medically justifiable time for your specific condition. The uploaded EESZT record proves that your domestic wait exceeds this clinical threshold.',
    'evidence.doctorNoteCaption': 'Clinical condition severity notes (brief caption describing the document)',
    'evidence.licenseSuccess': 'License number {license} is active and registered to {name}.',
    'evidence.licenseDisclaimer': 'This confirms the license is real and active in the medical chamber registry. It does not confirm this doctor wrote this note — that\'s part of our advisor review.',
    'evidence.submitBtn': 'Submit Evidence Bundle',

    // Dashboard
    'dash.title': 'My Cases & Applications',
    'dash.subtitle': 'Tracking pre-approval applications and post-treatment reimbursement claims with NEAK.',
    'dash.startNew': '+ Start New Case Intake',
    'dash.filterRoute': 'Filter Route',
    'dash.allRoutes': 'All Pathways',
    'dash.fastTrackOnly': 'Fast-track Pre-approval',
    'dash.standardOnly': 'Standard Claim',

    // Common
    'btn.back': 'Back',
    'btn.cancel': 'Cancel',
    'btn.close': 'Close',
    'btn.copy': 'Copy',
    'btn.copied': 'Copied',
    'btn.download': 'Download',
    'label.patient': 'Patient Direct',
    'label.rep': 'Legal Representative / Guardian',
    'label.doctor': 'Treating Doctor',

    // Active Case Barrier
    'activeCase.blockingTitle': 'Active Case in Progress',
    'activeCase.blockingExplanation': 'Under cross-border healthcare navigation rules, each patient can pursue one active case at a time. Once this case reaches a terminal status (reimbursed or closed), you will be able to start a new case.',
    'activeCase.goToCaseBtn': 'Go to Case Details',
    'activeCase.viewAllCasesBtn': 'View My Cases',

    // Dashboard distinction
    'dash.activeCaseSection': 'Active Case in Progress',
    'dash.pastCasesSection': 'Past Cases (Closed)',
    'dash.noActiveCaseTitle': 'No Active Case in Progress',
    'dash.noActiveCaseDesc': 'All your previous cases have reached terminal settlement. You are eligible to submit a new cross-border healthcare case.',
    'dash.closedBadge': 'Closed / Settled',
    'dash.viewArchive': 'View Dossier Archive',

    // Authentication (Login & Signup)
    'auth.login': 'Log In',
    'auth.signup': 'Sign Up',
    'auth.loginTitle': 'Patient & Staff Portal Login',
    'auth.signupTitle': 'New Patient Registration',
    'auth.loginSubtitle': 'Log in with your email or Hungarian TAJ number to manage your cross-border healthcare rights.',
    'auth.signupSubtitle': 'Create an account to submit your waitlist documentation and unlock EU cross-border treatment.',
    'auth.identifierLabel': 'Email Address or TAJ Number',
    'auth.identifierPlaceholder': 'e.g., kovacs.laszlo@example.hu or 042-881-934',
    'auth.fullNameLabel': 'Full Patient Name',
    'auth.fullNamePlaceholder': 'e.g., Horváth Bence',
    'auth.emailLabel': 'Email Address',
    'auth.emailPlaceholder': 'e.g., horvath.bence@example.hu',
    'auth.tajLabel': 'Hungarian TAJ Number (9 digits)',
    'auth.tajPlaceholder': 'e.g., 042-881-934',
    'auth.passwordLabel': 'Password',
    'auth.submitLogin': 'Log In',
    'auth.submitSignup': 'Create Patient Account & Begin',
    'auth.noAccount': "Don't have an account? Sign up as a new patient",
    'auth.hasAccount': 'Already have an account? Log in here',
    'auth.quickPresets': 'Quick Login with Demo Profiles:',
    'auth.logout': 'Log Out',
    'auth.insureDeclaration': 'I am an insured patient under the Hungarian National Health Insurance (NEAK).',
  },
  hu: {
    // Brand & Header
    'brand.title': 'CuraLink',
    'brand.tagline': 'Navigate Care Beyond Borders',
    'brand.micro': 'Határon Átnyúló Egészségügyi Navigátor · 883/2004/EK Rendelet & 2011/24/EU Irányelv',
    'nav.overview': 'Hogyan működik',
    'nav.myCases': 'Ügyeim',
    'nav.newCase': '+ Új Ügy',
    'nav.clinics': 'EU Klinikák',
    'nav.faq': 'Tájékoztató & GYIK',
    'nav.about': 'A CuraLinkről',
    'nav.resetDemo': 'Adatok visszaállítása',

    // Plain Language Path Names
    'path.pa': 'Előzetes engedélyezési út',
    'path.nonPa': 'Utólagos elszámolási út',
    'path.pa.desc': 'Kórházi bentfekvést igénylő ellátásokhoz. A NEAK előzetesen engedélyezi a fedezetet (S2), így a külföldi közkórházi ellátás díjmentes.',
    'path.nonPa.desc': 'Egynapos sebészeti és járóbeteg ellátásokhoz. Közvetlenül igénybe vehető, az elszámolás utólag történik a hazai NEAK-tarifa mértékéig.',
    'path.pa.badge': 'Előzetes Engedély Út',
    'path.nonPa.badge': 'Utólagos Elszámolás Út',

    // Tracker Stages
    'stage.Drafted': 'Vázlat',
    'stage.Drafted.sub': 'Bevitel és bizonyítékok',
    'stage.Awaiting Advisor Review': 'Szakértői bírálatra vár',
    'stage.Awaiting Advisor Review.sub': 'Orvosi sürgősség értékelése',
    'stage.More Info Requested': 'További adat bekérve',
    'stage.More Info Requested.sub': 'Kiegészítő lelet szükséges',
    'stage.Reviewed': 'Szakértő által jóváhagyva',
    'stage.Reviewed.sub': 'Orvosi ellenőrzés kész',
    'stage.Submitted': 'Benyújtva',
    'stage.Submitted.sub': 'Postai feladás NEAK-hoz',
    'stage.neakDecision': 'NEAK-döntés',
    'stage.neakDecision.sub': 'Engedélyezve vagy elutasítva',
    'stage.Authorised': 'Engedélyezve',
    'stage.Authorised.sub': 'S2 engedély kiadva',
    'stage.Travelling / In Treatment': 'Utazás / Kezelés folyamatban',
    'stage.Travelling / In Treatment.sub': 'Kíséret és ellátás',
    'stage.Travelling': 'Utazás / Kezelés folyamatban',
    'stage.Travelling.sub': 'Kíséret és ellátás',
    'stage.Treated': 'Kezelés befejezve',
    'stage.Treated.sub': 'Műtét elvégezve külföldön',
    'stage.Reimbursed': 'Megtérítve',
    'stage.Reimbursed.sub': 'Elszámolva a NEAK-kal',
    'stage.Case closed': 'Ügy lezárva',
    'stage.Case closed.sub': 'Elszámolva a NEAK-kal',
    'stage.Rejected': 'Elutasítva',
    'stage.Rejected.sub': 'Határozat kézhezvéve',
    'stage.SOLVIT Appeal Drafted': 'SOLVIT jogorvoslat indítva',
    'stage.SOLVIT Appeal Drafted.sub': 'EU vitarendezés aktív',
    'stage.Solvit': 'SOLVIT jogorvoslat indítva',
    'stage.Solvit.sub': 'EU vitarendezés aktív',

    // Case Manager & Operations
    'ops.title': 'Ellátásszervezési & Műveleti Panel',
    'ops.back': 'Vissza a műveletekhez és ügyekhez',
    'ops.readyToSend': 'NEAK-nak küldésre kész',
    'ops.patientArrived': 'Beteg megérkezett',
    'ops.markTreated': 'Kezelés befejezettként jelölése',
    'ops.dispatchChecklist': 'NEAK-feladási ellenőrzőlista',
    'ops.step1Signed': '1. Aláírt kérelem beérkezett',
    'ops.step2Mailed': '2. Postai feladás rögzítése',
    'ops.step3Submitted': '3. Benyújtva a NEAK-hoz',
    'ops.signedOriginalInHand': 'Aláírt eredeti kézben',
    'ops.dateSent': 'Feladás dátuma',
    'ops.trackingNumber': 'Ajánlott küldemény ragszáma (tracking)',
    'ops.followUpButton': 'NEAK telefonos egyeztetés',
    'ops.decisionLetter': 'Hivatalos határozat másolata',
    'ops.travelSupportDecision': 'Utazási támogatási döntés',
    'ops.travelSupportNotRequested': 'Nem kért támogatást',
    'ops.travelSupportNotGranted': 'Nem került megítélésre',
    'ops.travelSupportGranted': 'Megítélve',
    'ops.travelSupportAmount': 'Utazási támogatás összege',
    'ops.travelSupportTiming': 'Kifizetés ütemezése',
    'ops.beforeTravel': 'Utazás előtt',
    'ops.afterTravel': 'Utazás után',
    'ops.markTravelSupportPaid': 'Utazási támogatás kifizetve',
    'ops.travelSupportPaidBadge': 'Utazási támogatás utazás előtt kifizetve',
    'ops.closeS2Title': 'Ügy lezárása: Elszámolva a NEAK-kal',
    'ops.confirmSettlement': 'NEAK–klinika elszámolás visszaigazolva',
    'ops.travelOrCompanionPaid': 'Utazási vagy kísérői költségtérítés kifizetve',
    'ops.otherPayment': 'Egyéb kifizetés a betegnek',
    'ops.closeCaseBtn': 'Elszámolás rögzítése és ügy lezárása',
    'ops.markReimbursedTitle': 'NEAK-megtérítés rögzítése',
    'ops.reimbursementAmount': 'Megtérített összeg',
    'ops.reimbursementDate': 'Kifizetés dátuma',
    'ops.confirmReimbursement': 'Megtérítettnek jelölés',

    // Patient Banner Messages
    'patient.s2Submitted': 'Kérelme a NEAK-nál van. Esetmenedzserünk nyomon követi az ügyet, és amint döntés születik, értesíti Önt.',
    'patient.s2Authorised': 'A NEAK engedélyezte a kezelést. Esetmenedzserünk hamarosan egyezteti Önnel az utazási részleteket.',
    'patient.s2Rejected': 'A NEAK nem engedélyezte a kérelmet. Ismertetjük a lehetőségeit, beleértve a jogorvoslatot is.',
    'patient.reviewedMsg': 'Az orvosszakértő jóváhagyta az ügyét. Esetmenedzserünk felveszi Önnel a kapcsolatot az aláírás begyűjtése és a NEAK-hoz történő benyújtás céljából.',
    'patient.downloadForSigning': 'Kérelem letöltése aláíráshoz',
    'patient.waitingNeakMsg': 'Várakozás a NEAK döntésére. Esetmenedzserünk folyamatosan egyeztet a hatósággal.',
    'patient.authorisedMsg': 'A NEAK kiadta az S2 előzetes engedélyt. Esetmenedzserünk szervezi az utazási és helyszíni kísérési logisztikát.',
    'patient.treatmentUnderwayMsg': 'Ön jelenleg külföldi kezelésen vesz részt. Helyszíni koordinátora személyesen segíti a klinikán.',
    'patient.s2TreatedMsg': 'A kezelés befejeződött. Esetmenedzserünk végzi a záró dokumentációt és a NEAK-elszámolást.',
    'patient.directiveUploadPrompt': 'A kezelés befejeződött. Kérjük, töltse fel az alábbi számlákat, fordításokat és zárójelentést az elszámoláshoz.',

    // Closed Case Congratulation Screen
    'congrats.directive': 'Gratulálunk, a {amount} összegű költségtérítése megérkezett.',
    'congrats.preapproval': 'Gratulálunk, a kezelése sikeresen befejeződött és teljes mértékben elszámolásra került.',
    'congrats.travelPaid': 'Az Ön részére megítélt {amount} összegű utazási támogatás kifizetésre került.',
    'congrats.closing': 'Örülünk, hogy Ön mellett lehettünk. Mielőbbi és zökkenőmentes felépülést kívánunk.',
    'congrats.startNew': 'Új ügy indítása',

    // Hero & Landing
    'hero.badge': 'EU Határon Átnyúló Betegjogi Navigátor',
    'hero.title': 'Hosszú kórházi várólistán várakozik Magyarországon?',
    'hero.titleSub': 'Az uniós jog szerint joga van a külföldi ellátáshoz NEAK-térítéssel.',
    'hero.desc': 'A 883/2004/EK uniós rendelet és a 2011/24/EU irányelv alapján a magyar biztosítottak orvosilag indokolatlan belföldi várakozás esetén másik EU-tagállamban vehetnek igénybe ellátást NEAK-finanszírozással. A CuraLink a bürokráciát egyértelmű, jogilag megalapozott eljárássá alakítja.',
    'hero.startCase': 'Ügyintézés indítása',
    'hero.exploreCases': 'Ügyek megtekintése',
    'hero.aboutCuraLink': 'A CuraLinkről és jogi háttér →',

    // Stats
    'stats.gapTitle': 'Az Ismerethiány és a Bürokratikus Szakadék Mértéke',
    'stats.gapSub': 'Hivatalos NEAK és Egészségügyi Minisztériumi adatok alapján.',
    'stats.gapNote': '*A hazai ellátási késedelemben érintettek valós nagyságrendje; az utazási hajlandóságot a program vizsgálja.',
    'stats.waitCount': '70.000+',
    'stats.waitLabel': 'Beteg a hazai közfinanszírozott várólistákon',
    'stats.waitDesc': 'A nagyízületi pótlások (térd, csípő) és szakorvosi beavatkozások várakozási ideje több hazai kórházban meghaladja a 18-28 hónapot.',
    'stats.approvedCount': 'Mindössze 428',
    'stats.approvedLabel': 'Jóváhagyott külföldi ellátás 2023-ban',
    'stats.approvedDesc': 'A több tízezer várakozóval szemben a NEAK 2023-ban csupán 428, 2022-ben 367 külföldi kérelmet hagyott jóvá. A jogi lehetőség szinte ismeretlen.',
    'stats.equityCount': '99%',
    'stats.equityLabel': 'Méltányossági egyedi kérelemként kezelve',
    'stats.equityDesc': 'A jóváhagyások 99%-a egyedi méltányossági kérelem volt, míg a közvetlen uniós jogon alapuló alanyi jogi út kihasználatlan maradt.',

    // Support section
    'support.aloneTitle': 'Nem vagy egyedül ezen az úton',
    'support.cardTitle': 'Személyes reptéri és kórházi kíséret a helyszínen',
    'support.cardText': 'A CuraLink csapatának tagja személyesen fogadja Önt a repülőtéren vagy vasútállomáson, elkíséri a partnerkórházba, és segít minden helyszíni adminisztrációban és fordításban — így Ön teljes mértékben a gyógyulásra koncentrálhat.',
    'support.contact': 'Személyes koordinátor',
    'support.uploadAbroadBtn': 'Dokumentum feltöltése külföldről',
    'support.uploadAbroadDesc': 'Ne várjon a hazatérésig — fotózza le és töltse fel a kórházi zárójelentést vagy számlát közvetlenül a helyszínen. Személyes koordinátorunk is gondoskodik róla, hogy semmi ne vesszen el.',
    'support.markComplete': 'Kezelés befejezettként jelölése',
    'support.markCompleteDesc': 'Kattintson ide a külföldi ellátás befejezésekor, hogy elindítsuk a záró elszámolást a NEAK-kal.',
    'support.badgeClinic': 'Személyes reptéri és kórházi kíséret biztosított',

    // Case Intake Wizard
    'intake.title': 'Határon Átnyúló Ellátási Kérelem Indítása',
    'intake.subtitle': 'Néhány lépésben meghatározzuk a megfelelő jogi utat és előkészítjük a hivatalos NEAK-kérelmet.',
    'intake.step1': 'Milyen beavatkozásra van szüksége?',
    'intake.step2': 'Mióta szerepel a várólistán?',
    'intake.step3': 'Klinikaválasztás és utazási támogatás',
    'intake.step4': 'Adatok ellenőrzése és kérelem indítása',
    'intake.next': 'Következő lépés',
    'intake.back': 'Vissza',
    'intake.submit': 'Kérelem és Iratok Létrehozása Mesterséges Intelligenciával',
    'intake.submitting': 'Jogosultság elemzése és hivatalos beadvány generálása...',

    // Evidence Gate Wizard (PA branch)
    'evidence.title': 'Orvosi Igazolás és Bizonyíték Ellenőrző',
    'evidence.subtitle': 'Dokumentáció ellenőrzése az orvosilag indokolható várakozási idő igazolására.',
    'evidence.step1Title': 'Mennyi ideje várakozik belföldön?',
    'evidence.step2Title': 'EESZT várólista igazolás feltöltése',
    'evidence.step3Title': 'Kezelőorvosi igazolás csatolása',
    'evidence.step4Title': 'Kezelőorvos kamarai azonosítása',
    'evidence.whyAsk': 'Miért szükséges ez? (Jogi háttér)',
    'evidence.whyAskText': 'A 883/2004/EK európai parlamenti és tanácsi rendelet 20. cikke, valamint az Európai Unió Bíróságának ítéletei (pl. C-372/04. sz. Watts-ügy) alapján a NEAK csak akkor utasíthatja el az előzetes engedélyezést, ha a kezelés belföldön orvosilag indokolható időn belül elérhető az Ön konkrét állapotára nézve. Az EESZT várólista-kivonat bizonyítja, hogy a hazai várakozási idő ezt meghaladja.',
    'evidence.doctorNoteCaption': 'Állapot súlyossága és orvosi megjegyzések (a csatolt dokumentum leírása)',
    'evidence.licenseSuccess': 'A {license} nyilvántartási szám érvényes és aktív ({name} orvoshoz rendelve).',
    'evidence.licenseDisclaimer': 'Ez igazolja a működési nyilvántartási szám érvényességét a Magyar Orvosi Kamarában. A szakmai orvosi tartalom meglétét tanácsadónk külön ellenőrzi.',
    'evidence.submitBtn': 'Bizonyíték Csomag Mentése és Továbbítás',

    // Dashboard
    'dash.title': 'Ügyeim és Beadványaim',
    'dash.subtitle': 'Előzetes engedélyezések (S2) és utólagos költségtérítések (Irányelv) nyomon követése a NEAK-nál.',
    'dash.startNew': '+ Új Kérelem Indítása',
    'dash.filterRoute': 'Útvonal Szűrés',
    'dash.allRoutes': 'Minden eljárás',
    'dash.fastTrackOnly': 'Előzetes engedélyezés (Fekvőbeteg)',
    'dash.standardOnly': 'Utólagos elszámolás (Járóbeteg)',

    // Common
    'btn.back': 'Vissza',
    'btn.cancel': 'Mégse',
    'btn.close': 'Bezárás',
    'btn.copy': 'Másolás',
    'btn.copied': 'Másolva',
    'btn.download': 'Letöltés',
    'label.patient': 'Beteg közvetlenül',
    'label.rep': 'Törvényes képviselő / Gondnok',
    'label.doctor': 'Kezelőorvos',

    // Active Case Barrier
    'activeCase.blockingTitle': 'Aktív ügy folyamatban',
    'activeCase.blockingExplanation': 'A hatályos eljárásrend alapján egy beteg egyidejűleg egy aktív határon átnyúló ügyet folytathat. Amint jelenlegi ügye lezárt státuszt ér el (megtérítve vagy lezárva), új ügyet indíthat.',
    'activeCase.goToCaseBtn': 'Ugrás az ügy részleteihez',
    'activeCase.viewAllCasesBtn': 'Ügyeim megtekintése',

    // Dashboard distinction
    'dash.activeCaseSection': 'Aktív folyamatban lévő ügy',
    'dash.pastCasesSection': 'Korábbi lezárt ügyek',
    'dash.noActiveCaseTitle': 'Nincs aktív folyamatban lévő ügy',
    'dash.noActiveCaseDesc': 'Minden korábbi ügy lezárult és elszámolásra került. Új határon átnyúló ellátási kérelem indítható.',
    'dash.closedBadge': 'Lezárt / Elszámolt',
    'dash.viewArchive': 'Archív iratanyag megtekintése',

    // Authentication (Login & Signup)
    'auth.login': 'Bejelentkezés',
    'auth.signup': 'Regisztráció',
    'auth.loginTitle': 'Páciens és Szakértői Bejelentkezés',
    'auth.signupTitle': 'Új Páciens Regisztráció',
    'auth.loginSubtitle': 'Jelentkezzen be e-mail címével vagy TAJ számával határon átnyúló betegjogai kezeléséhez.',
    'auth.signupSubtitle': 'Hozza létre betegfiókját a várólista igazolások feltöltéséhez és a külföldi ellátás megkezdéséhez.',
    'auth.identifierLabel': 'E-mail cím vagy TAJ szám',
    'auth.identifierPlaceholder': 'pl. kovacs.laszlo@example.hu vagy 042-881-934',
    'auth.fullNameLabel': 'Páciens teljes neve',
    'auth.fullNamePlaceholder': 'pl. Horváth Bence',
    'auth.emailLabel': 'E-mail cím',
    'auth.emailPlaceholder': 'pl. horvath.bence@example.hu',
    'auth.tajLabel': 'Magyar TAJ szám (9 számjegy)',
    'auth.tajPlaceholder': 'pl. 042-881-934',
    'auth.passwordLabel': 'Jelszó',
    'auth.submitLogin': 'Bejelentkezés',
    'auth.submitSignup': 'Betegfiók létrehozása és indítás',
    'auth.noAccount': 'Nincs még fiókja? Regisztráljon új páciensként',
    'auth.hasAccount': 'Már rendelkezik fiókkal? Jelentkezzen be itt',
    'auth.quickPresets': 'Gyors belépés tesztprofilokkal:',
    'auth.logout': 'Kijelentkezés',
    'auth.insureDeclaration': 'Igazolom, hogy érvényes magyar kötelező egészségbiztosítással (NEAK) rendelkezem.',
  },
};

const I18nContext = createContext<I18nContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('curalink_lang');
      if (saved === 'en' || saved === 'hu') return saved;
    } catch {}
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('curalink_lang', lang);
    } catch {}
  };

  const t = (key: string): string => {
    const val = translations[language]?.[key] || translations.en[key];
    if (val) return val;
    if (key.startsWith('stage.')) {
      const stripped = key.replace('stage.', '');
      if (translations[language]?.[`stage.${stripped}`]) return translations[language][`stage.${stripped}`];
      if (translations.en[`stage.${stripped}`]) return translations.en[`stage.${stripped}`];
      return stripped;
    }
    return key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
