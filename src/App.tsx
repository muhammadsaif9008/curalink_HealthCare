import React, { useState, useEffect } from 'react';
import { I18nProvider, useI18n } from './i18n';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { NewCasePage } from './pages/NewCasePage';
import { CaseDetailPage } from './pages/CaseDetailPage';
import { ClinicsPage } from './pages/ClinicsPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { AboutPilotPage } from './pages/AboutPilotPage';
import { AdvisorReviewQueuePage } from './pages/AdvisorReviewQueuePage';
import { AdvisorReviewedCasesPage } from './pages/AdvisorReviewedCasesPage';
import { AdvisorProfilePage } from './pages/AdvisorProfilePage';
import { AuthModal } from './components/AuthModal';
import { api } from './services/api';
import { CaseItem, Clinic, TreatmentRule, UserProfile } from './types';
import { AlertCircle, Loader2 } from 'lucide-react';

function AppContent() {
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  const [cases, setCases] = useState<CaseItem[]>([]);
  const [rules, setRules] = useState<TreatmentRule[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth modal state (login vs signup)
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  const handleOpenAuth = (mode: 'login' | 'signup' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = async (user: UserProfile) => {
    setCurrentUser(user);
    if (user.role === 'advisor') {
      setCurrentTab('review-queue');
    } else {
      setCurrentTab('dashboard');
    }
    try {
      const [freshUsers, freshCases] = await Promise.all([
        api.getUsers(),
        api.getCases(),
      ]);
      setUsers(freshUsers);
      setCases(freshCases);
    } catch (e) {
      console.error('Failed refreshing data after auth:', e);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {}
    setCurrentUser(null);
    setCurrentTab('landing');
    setAuthModalMode('login');
    setAuthModalOpen(true);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [uList, curUser, cList, rList, clList] = await Promise.all([
        api.getUsers(),
        api.getCurrentUser(),
        api.getCases(),
        api.getTreatmentRules(),
        api.getClinics(),
      ]);

      setUsers(uList);
      setCurrentUser(curUser);
      setCases(cList);
      setRules(rList);
      setClinics(clList);
      setError(null);

      // Auto-set initial tab based on role
      if (curUser?.role === 'advisor') {
        setCurrentTab('review-queue');
      }
    } catch (err: any) {
      console.error('Failed to load initial data:', err);
      setError('Could not connect to CuraLink API server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Strict role boundaries:
  // "Patients must never see advisor screens, and advisors must never see patient intake screens."
  useEffect(() => {
    if (currentUser?.role === 'advisor') {
      if (
        currentTab === 'new-case' ||
        currentTab === 'landing' ||
        currentTab === 'dashboard' ||
        currentTab === 'clinics'
      ) {
        setCurrentTab('review-queue');
      }
    } else {
      if (
        currentTab === 'review-queue' ||
        currentTab === 'reviewed-cases' ||
        currentTab === 'advisor-profile'
      ) {
        setCurrentTab('dashboard');
      }
    }
  }, [currentUser?.role, currentTab]);

  const handleNavigate = (tab: string, caseId?: string) => {
    let targetTab = tab;
    // Enforce role guards on navigation
    if (currentUser?.role === 'advisor') {
      if (targetTab === 'new-case' || targetTab === 'landing' || targetTab === 'dashboard' || targetTab === 'clinics') {
        targetTab = 'review-queue';
      }
    } else {
      if (targetTab === 'review-queue' || targetTab === 'reviewed-cases' || targetTab === 'advisor-profile') {
        targetTab = 'dashboard';
      }
    }

    setCurrentTab(targetTab);
    if (caseId) {
      setSelectedCaseId(caseId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwitchUser = async (userId: string) => {
    // 1. Instantly switch user locally from active users array
    const targetUser = users.find((u) => u.id === userId);
    if (targetUser) {
      setCurrentUser(targetUser);
      if (targetUser.role === 'advisor') {
        setCurrentTab('review-queue');
      } else if (
        currentTab === 'review-queue' ||
        currentTab === 'reviewed-cases' ||
        currentTab === 'advisor-profile'
      ) {
        setCurrentTab('dashboard');
      }
    }

    // 2. Notify backend to keep in-memory session in sync
    try {
      const res = await api.switchUser(userId);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        if (res.user.role === 'advisor') {
          setCurrentTab('review-queue');
        } else if (
          currentTab === 'review-queue' ||
          currentTab === 'reviewed-cases' ||
          currentTab === 'advisor-profile'
        ) {
          setCurrentTab('dashboard');
        }
      }
    } catch (err) {
      console.warn('Backend user switch notification had an issue, local state retained:', err);
    }
  };

  const handleResetDemo = async () => {
    try {
      await api.resetDemoData();
      await loadData();
      if (currentUser?.role === 'advisor') {
        setCurrentTab('review-queue');
      } else {
        setCurrentTab('dashboard');
      }
    } catch (err) {
      console.error('Failed to reset demo:', err);
    }
  };

  const handleCaseCreated = (newCase: CaseItem) => {
    setCases((prev) => [newCase, ...prev]);
    setSelectedCaseId(newCase.id);
    // Keep user on the intake page so they see the required confirmation notice:
    // "Your case has been sent to a CuraLink medical advisor for clinical review. You don't need to visit your own doctor."
  };

  const handleCaseUpdated = (updated: CaseItem) => {
    setCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const activeCase = cases.find((c) => c.id === selectedCaseId) || cases[0];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Navbar
        currentTab={currentTab}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        users={users}
        onSwitchUser={handleSwitchUser}
        onResetDemo={handleResetDemo}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
      />

      <main className="flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
            <Loader2 className="w-8 h-8 text-[#1E2761] animate-spin" />
            <p className="text-xs text-slate-500 font-medium">
              Initializing CuraLink Navigator & Verification Models...
            </p>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto my-16 p-6 bg-white rounded-xl border border-rose-200 shadow-sm text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
            <h2 className="text-base font-bold text-slate-900">Backend Connection Error</h2>
            <p className="text-xs text-slate-600">{error}</p>
            <button
              onClick={() => loadData()}
              className="px-4 py-2 bg-[#1E2761] text-white text-xs font-semibold rounded-lg hover:bg-[#151B45] cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <>
            {currentTab === 'landing' && (
              <LandingPage
                rules={rules}
                clinics={clinics}
                onNavigate={handleNavigate}
                onOpenAuth={handleOpenAuth}
              />
            )}

            {currentTab === 'dashboard' && (
              <DashboardPage
                cases={cases}
                currentUser={currentUser}
                onNavigate={handleNavigate}
              />
            )}

            {currentTab === 'new-case' && (
              <NewCasePage
                rules={rules}
                clinics={clinics}
                cases={cases}
                currentUser={currentUser}
                onCaseCreated={handleCaseCreated}
                onNavigate={handleNavigate}
              />
            )}

            {currentTab === 'case-detail' && activeCase && (
              <CaseDetailPage
                caseItem={activeCase}
                currentUser={currentUser}
                clinics={clinics}
                onCaseUpdated={handleCaseUpdated}
                onNavigate={handleNavigate}
              />
            )}

            {currentTab === 'clinics' && (
              <ClinicsPage
                clinics={clinics}
                rules={rules}
                onNavigate={handleNavigate}
              />
            )}

            {currentTab === 'resources' && <ResourcesPage />}

            {currentTab === 'about' && (
              <AboutPilotPage onNavigate={handleNavigate} />
            )}

            {currentTab === 'review-queue' && currentUser?.role === 'advisor' && (
              <AdvisorReviewQueuePage
                cases={cases}
                currentUser={currentUser}
                clinics={clinics}
                onCaseUpdated={handleCaseUpdated}
                onNavigate={handleNavigate}
              />
            )}

            {currentTab === 'reviewed-cases' && currentUser?.role === 'advisor' && (
              <AdvisorReviewedCasesPage
                cases={cases}
                currentUser={currentUser}
                clinics={clinics}
                onNavigate={handleNavigate}
              />
            )}

            {currentTab === 'advisor-profile' && currentUser?.role === 'advisor' && (
              <AdvisorProfilePage
                currentUser={currentUser}
                onUserUpdated={(updatedUser) => {
                  setCurrentUser(updatedUser);
                  setUsers((prev) =>
                    prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
                  );
                }}
              />
            )}
          </>
        )}
      </main>

      <Footer onNavigate={handleNavigate} />

      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        users={users}
      />
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}
