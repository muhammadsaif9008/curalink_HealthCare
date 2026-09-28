import React, { useState } from 'react';
import { CaseItem, Clinic } from '../types';
import { useI18n } from '../i18n';
import { api } from '../services/api';
import {
  User,
  Phone,
  Building2,
  Calendar,
  FileCheck,
  Plane,
  CheckCircle2,
  MessageSquare,
  Plus,
  Coins,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface OperationsPanelProps {
  caseItem: CaseItem;
  clinic?: Clinic;
  onCaseUpdated: (updated: CaseItem) => void;
}

export const OperationsPanel: React.FC<OperationsPanelProps> = ({
  caseItem,
  clinic,
  onCaseUpdated,
}) => {
  const { language } = useI18n();
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [processingArrived, setProcessingArrived] = useState(false);
  const [processingTreated, setProcessingTreated] = useState(false);
  const [processingTravelPaid, setProcessingTravelPaid] = useState(false);
  const [opError, setOpError] = useState<string | null>(null);

  const patientPhone = caseItem.patientPhone || '+36 20 441 9821';
  const chaperone = caseItem.chaperone || {
    name: 'Balogh Zoltán (Vienna Dedicated Coordinator)',
    phone: '+43 676 812 4901',
  };

  const travelDates =
    caseItem.travelDates ||
    (caseItem.scheduledDomesticDate
      ? `Scheduled: ${caseItem.scheduledDomesticDate}`
      : 'Departure: Oct 12, 2026 – Oct 19, 2026');

  // Rule: If travel support was granted with timing "before travel", case manager must mark "Travel support paid" before "Patient arrived" becomes available.
  const requiresTravelSupportBeforeArrival =
    caseItem.branch === 'PA' &&
    caseItem.travelSupportDecision === 'granted' &&
    caseItem.travelSupportTiming === 'before_travel' &&
    !caseItem.travelSupportPaid;

  // Rule 3: For S2 Pre-approval (PA), "Patient arrived" is active once Authorised.
  // For Standard Treatment and claim path (NonPA), no NEAK pre-authorisation or pre-travel documentation is needed;
  // it goes directly from Reviewed to Travelling / In Treatment.
  const isCaseAuthorised = caseItem.currentStage === 'Authorised';
  const isCaseTravelling = caseItem.currentStage === 'Travelling / In Treatment';
  const notYetAuthorised =
    caseItem.branch === 'PA' &&
    !isCaseAuthorised &&
    !isCaseTravelling &&
    caseItem.currentStage !== 'Treated' &&
    caseItem.currentStage !== 'Case closed';

  const canMarkArrived =
    caseItem.branch === 'NonPA'
      ? caseItem.currentStage === 'Reviewed' || caseItem.currentStage === 'Travelling / In Treatment'
      : isCaseAuthorised && !requiresTravelSupportBeforeArrival;
  const canMarkTreated = isCaseTravelling;

  const notAuthorisedHint =
    language === 'hu'
      ? 'Akkor érhető el, amint a NEAK engedélyezi az ügyet'
      : 'Available once NEAK authorises this case';

  const handlePayTravelSupport = async () => {
    setProcessingTravelPaid(true);
    setOpError(null);
    try {
      const updated = await api.payTravelSupport(
        caseItem.id,
        caseItem.travelSupportAmount || '45,000 HUF'
      );
      onCaseUpdated(updated);
    } catch (err: any) {
      setOpError(err.message || 'Failed to record travel support payment');
    } finally {
      setProcessingTravelPaid(false);
    }
  };

  const handlePatientArrived = async () => {
    if (requiresTravelSupportBeforeArrival) {
      setOpError(
        language === 'hu'
          ? 'Az utazás előtti utazási támogatást először ki kell fizetettnek jelölni!'
          : 'Travel support granted before travel must be marked paid first!'
      );
      return;
    }
    setProcessingArrived(true);
    setOpError(null);
    try {
      const updated = await api.patientArrived(caseItem.id);
      onCaseUpdated(updated);
    } catch (err: any) {
      setOpError(err.message || 'Failed to update patient arrived');
    } finally {
      setProcessingArrived(false);
    }
  };

  const handleMarkTreated = async () => {
    setProcessingTreated(true);
    setOpError(null);
    try {
      const updated = await api.completeTreatment(caseItem.id);
      onCaseUpdated(updated);
    } catch (err: any) {
      setOpError(err.message || 'Failed to mark treatment as complete');
    } finally {
      setProcessingTreated(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSavingNote(true);
    try {
      const updated = await api.addManagerNote(caseItem.id, newNote.trim());
      onCaseUpdated(updated);
      setNewNote('');
    } catch (err: any) {
      setOpError(err.message || 'Failed to add note');
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <section className="bg-gradient-to-br from-slate-900 via-[#1E2761] to-[#151B45] text-white rounded-2xl p-6 sm:p-7 shadow-md space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C9A24B] text-[#1E2761] flex items-center justify-center font-bold shadow-sm">
            ⚙
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">
                {language === 'hu' ? 'Ellátásszervezési & Műveleti Panel' : 'Care Operations & Logistics Panel'}
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/15 text-[#CADCFC]">
                {language === 'hu' ? 'Esetmenedzser' : 'Case Manager'}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {language === 'hu'
                ? 'Helyszíni kíséret, logisztika és ellátási státusz vezérlése.'
                : 'Direct logistical management: chaperone coordination, arrival, treatment status, and notes.'}
            </p>
          </div>
        </div>

        {/* Action Buttons: "Patient arrived" and "Mark treatment as complete" */}
        <div className="flex items-center gap-2 flex-wrap">
          {notYetAuthorised && (
            <span className="text-[11px] text-amber-300 font-semibold px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-400/30">
              {notAuthorisedHint}
            </span>
          )}

          {requiresTravelSupportBeforeArrival && (
            <button
              onClick={handlePayTravelSupport}
              disabled={processingTravelPaid}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>
                {processingTravelPaid
                  ? 'Saving...'
                  : `${language === 'hu' ? 'Utazási támogatás kifizetve' : 'Mark travel support paid'} (${caseItem.travelSupportAmount || '45,000 HUF'})`}
              </span>
            </button>
          )}

          <button
            onClick={handlePatientArrived}
            disabled={!canMarkArrived || processingArrived}
            title={
              notYetAuthorised
                ? notAuthorisedHint
                : requiresTravelSupportBeforeArrival
                ? (language === 'hu' ? 'Az utazási támogatást először ki kell fizetettnek jelölni' : 'Travel support must be marked paid before patient arrives')
                : (language === 'hu' ? 'Beteg megérkezett rögzítése' : 'Move to Travelling / In Treatment')
            }
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
              canMarkArrived
                ? 'bg-[#C9A24B] hover:bg-[#b8913d] text-[#1E2761] cursor-pointer'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            <span>
              {processingArrived
                ? 'Updating...'
                : language === 'hu' ? 'Beteg megérkezett' : 'Patient arrived'}
            </span>
          </button>

          <button
            onClick={handleMarkTreated}
            disabled={!canMarkTreated || processingTreated}
            title={
              notYetAuthorised
                ? notAuthorisedHint
                : !canMarkTreated
                ? (language === 'hu' ? 'A beteg megérkezése után érhető el' : 'Available after patient arrived')
                : (language === 'hu' ? 'Kezelés befejezettként jelölése' : 'Move case to Treated')
            }
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
              canMarkTreated
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              {processingTreated
                ? 'Updating...'
                : language === 'hu' ? 'Kezelés befejezettként jelölése' : 'Mark treatment as complete'}
            </span>
          </button>
        </div>
      </div>

      {opError && (
        <div className="p-3 bg-rose-500/20 border border-rose-400 text-rose-200 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{opError}</span>
        </div>
      )}

      {/* Grid of Key Logistics Information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {/* Patient Contact */}
        <div className="bg-white/10 rounded-xl p-3.5 border border-white/10 space-y-1">
          <div className="text-[10px] uppercase font-bold text-[#C9A24B] tracking-wider flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            <span>{language === 'hu' ? 'Beteg adatai' : 'Patient Contact'}</span>
          </div>
          <div className="font-bold text-sm text-white truncate">{caseItem.patientName}</div>
          <div className="text-slate-300 font-mono text-[11px]">TAJ: {caseItem.tajNumber}</div>
          <div className="pt-1">
            <a
              href={`tel:${patientPhone}`}
              className="inline-flex items-center gap-1 text-[#CADCFC] hover:text-white underline font-semibold text-[11px]"
            >
              <Phone className="w-3 h-3 text-[#C9A24B]" />
              <span>{patientPhone}</span>
            </a>
          </div>
        </div>

        {/* Assigned Chaperone */}
        <div className="bg-white/10 rounded-xl p-3.5 border border-white/10 space-y-1">
          <div className="text-[10px] uppercase font-bold text-[#C9A24B] tracking-wider flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            <span>{language === 'hu' ? 'Kijelölt kísérő' : 'Assigned Chaperone'}</span>
          </div>
          <div className="font-bold text-sm text-white truncate">{chaperone.name}</div>
          <div className="text-slate-300 text-[11px]">
            {language === 'hu' ? 'Reptéri és kórházi koordinátor' : 'On-site Airport & Hospital Chaperone'}
          </div>
          <div className="pt-1">
            <a
              href={`tel:${chaperone.phone}`}
              className="inline-flex items-center gap-1 text-[#CADCFC] hover:text-white underline font-semibold text-[11px]"
            >
              <Phone className="w-3 h-3 text-[#C9A24B]" />
              <span>{chaperone.phone}</span>
            </a>
          </div>
        </div>

        {/* Partner Clinic */}
        <div className="bg-white/10 rounded-xl p-3.5 border border-white/10 space-y-1">
          <div className="text-[10px] uppercase font-bold text-[#C9A24B] tracking-wider flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>{language === 'hu' ? 'Klinika' : 'Clinic'}</span>
          </div>
          <div className="font-bold text-sm text-white truncate">
            {clinic?.name || 'AKH Vienna Public Hospital'}
          </div>
          <div className="text-slate-300 text-[11px] truncate">
            {clinic ? `${clinic.city}, ${clinic.country}` : 'Vienna, Austria'}
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            {clinic?.address || 'Währinger Gürtel 18-20, 1090 Wien'}
          </div>
        </div>

        {/* Travel Dates */}
        <div className="bg-white/10 rounded-xl p-3.5 border border-white/10 space-y-1">
          <div className="text-[10px] uppercase font-bold text-[#C9A24B] tracking-wider flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{language === 'hu' ? 'Utazási időpontok' : 'Travel Dates'}</span>
          </div>
          <div className="font-semibold text-white text-xs leading-relaxed">{travelDates}</div>
          {caseItem.travelSupportDecision === 'granted' && (
            <div className="pt-1 text-[11px] text-emerald-300 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3 h-3" />
              <span>
                {caseItem.travelSupportPaid
                  ? `${language === 'hu' ? 'Támogatás kifizetve' : 'Support paid'}: ${caseItem.travelSupportPaidAmount || caseItem.travelSupportAmount}`
                  : `${language === 'hu' ? 'Megítélve' : 'Granted'}: ${caseItem.travelSupportAmount} (${caseItem.travelSupportTiming})`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Two Columns: Uploaded Docs from Abroad & Notes Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
        {/* Documents Uploaded from Abroad */}
        <div className="bg-black/25 rounded-xl p-4 border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-[#CADCFC] uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-[#C9A24B]" />
              <span>{language === 'hu' ? 'Külföldről feltöltött dokumentumok' : 'Documents Uploaded from Abroad'}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {caseItem.uploadedDocuments?.length || 0} {language === 'hu' ? 'dokumentum' : 'files'}
            </span>
          </div>

          {(!caseItem.uploadedDocuments || caseItem.uploadedDocuments.length === 0) ? (
            <div className="p-4 text-center rounded-lg bg-white/5 border border-dashed border-white/10 text-xs text-slate-400">
              {language === 'hu'
                ? 'Még nem érkezett dokumentum külföldről.'
                : 'No documents uploaded yet from abroad.'}
            </div>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {caseItem.uploadedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="p-2 rounded-lg bg-white/10 border border-white/10 text-xs flex items-center justify-between"
                >
                  <div className="truncate mr-2">
                    <div className="font-semibold text-white truncate">{doc.name}</div>
                    <div className="text-[10px] text-slate-300">
                      {doc.type} · {new Date(doc.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes Log */}
        <div className="bg-black/25 rounded-xl p-4 border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-[#CADCFC] uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-[#C9A24B]" />
              <span>{language === 'hu' ? 'Műveleti feljegyzések (Notes Log)' : 'Operations Notes Log'}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {caseItem.managerNotes?.length || 0} {language === 'hu' ? 'bejegyzés' : 'notes'}
            </span>
          </div>

          {/* Existing notes */}
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {(!caseItem.managerNotes || caseItem.managerNotes.length === 0) ? (
              <div className="p-3 text-center text-xs text-slate-400 italic">
                {language === 'hu' ? 'Nincs műveleti feljegyzés.' : 'No operational notes logged yet.'}
              </div>
            ) : (
              caseItem.managerNotes.map((note) => (
                <div key={note.id} className="p-2 rounded-lg bg-white/10 border border-white/10 text-xs space-y-0.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-300 font-semibold">
                    <span className="text-[#C9A24B]">{note.author}</span>
                    <span>{new Date(note.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-100 text-[11px] leading-relaxed">{note.text}</p>
                </div>
              ))
            )}
          </div>

          {/* Quick add note form */}
          <form onSubmit={handleAddNote} className="flex items-center gap-2 pt-1 border-t border-white/10">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder={language === 'hu' ? 'Új feljegyzés hozzáadása...' : 'Add quick operations note...'}
              className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#C9A24B]"
            />
            <button
              type="submit"
              disabled={savingNote || !newNote.trim()}
              className="px-3 py-1.5 bg-[#C9A24B] hover:bg-[#b8913d] text-[#1E2761] text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-40"
            >
              {savingNote ? '...' : language === 'hu' ? 'Mentés' : 'Add'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};
