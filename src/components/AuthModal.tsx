import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { useI18n } from '../i18n';
import { api } from '../services/api';
import {
  X,
  User,
  Mail,
  ShieldCheck,
  Lock,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Sparkles,
  UserCheck,
  PlusCircle,
  LogIn,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'signup';
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  users: UserProfile[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
  users,
}) => {
  const { language, t } = useI18n();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);

  // Login form fields
  const [identifier, setIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('demo123');

  // Signup form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [tajNumber, setTajNumber] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [declaration, setDeclaration] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setError(null);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!identifier.trim()) {
      setError(
        language === 'hu'
          ? 'Kérjük, adja meg e-mail címét vagy TAJ számát.'
          : 'Please enter your email or Hungarian TAJ number.'
      );
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await api.login(identifier, loginPassword);
      if (res.success && res.user) {
        onSuccess(res.user);
        onClose();
      } else {
        setError(res.error || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setError(language === 'hu' ? 'A név megadása kötelező.' : 'Full name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError(
        language === 'hu'
          ? 'Kérjük, érvényes e-mail címet adjon meg.'
          : 'Please enter a valid email address.'
      );
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await api.signup({
        name,
        email,
        tajNumber: tajNumber || undefined,
        password: signupPassword,
      });

      if (res.success && res.user) {
        onSuccess(res.user);
        onClose();
      } else {
        setError(res.error || 'Signup failed');
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = async (u: UserProfile) => {
    setIdentifier(u.email);
    setError(null);
    setLoading(true);
    try {
      const res = await api.switchUser(u.id);
      if (res.success && res.user) {
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to switch profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-[#1E2761] text-white p-5 sm:p-6 flex items-center justify-between relative">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#CADCFC]/20 text-[#CADCFC] text-[11px] font-semibold border border-white/10 mb-1">
              <ShieldCheck className="w-3 h-3 text-[#C9A24B]" />
              <span>CuraLink Secure Access</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              {mode === 'login' ? t('auth.loginTitle') : t('auth.signupTitle')}
            </h2>
            <p className="text-xs text-[#CADCFC]/90 mt-1 max-w-sm">
              {mode === 'login' ? t('auth.loginSubtitle') : t('auth.signupSubtitle')}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-3 px-4 text-center border-b-2 cursor-pointer transition-all flex items-center justify-center gap-2 ${
              mode === 'login'
                ? 'border-[#1E2761] text-[#1E2761] bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{t('auth.login')}</span>
          </button>
          <button
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`flex-1 py-3 px-4 text-center border-b-2 cursor-pointer transition-all flex items-center justify-center gap-2 ${
              mode === 'signup'
                ? 'border-[#1E2761] text-[#1E2761] bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{t('auth.signup')}</span>
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6">
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('auth.identifierLabel')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={t('auth.identifierPlaceholder')}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#1E2761] focus:border-[#1E2761] outline-hidden text-slate-900"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('auth.passwordLabel')}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#1E2761] focus:border-[#1E2761] outline-hidden text-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#1E2761] hover:bg-[#151B45] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <span>{language === 'hu' ? 'Belépés folyamatban...' : 'Logging in...'}</span>
                ) : (
                  <>
                    <span>{t('auth.submitLogin')}</span>
                    <ArrowRight className="w-4 h-4 text-[#C9A24B]" />
                  </>
                )}
              </button>

              {/* Direct Role Login Portal Presets */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  {language === 'hu' ? 'Válasszon Portált / Szerepkört a Belépéshez' : 'Select Portal & Role to Log In'}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  {/* Patient Role */}
                  {(() => {
                    const patientUser = users.find((u) => u.role === 'patient') || users[0];
                    return (
                      <button
                        key="role-patient"
                        type="button"
                        onClick={() => handleSelectPreset(patientUser)}
                        className="p-3 border border-blue-200 bg-blue-50/50 hover:bg-blue-100/70 hover:border-blue-300 rounded-xl text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer shadow-2xs group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wide">
                            {language === 'hu' ? 'Beteg' : 'Patient'}
                          </span>
                          <span className="text-blue-500 group-hover:translate-x-0.5 transition-transform text-xs">→</span>
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs truncate">{patientUser.name}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {language === 'hu' ? 'Páciens ügyintézés' : 'Intake & tracking'}
                          </div>
                        </div>
                      </button>
                    );
                  })()}

                  {/* Medical Advisor Role */}
                  {(() => {
                    const advisorUser = users.find((u) => u.role === 'advisor') || {
                      id: 'user-advisor-01',
                      name: 'Dr. Varga Zsuzsa',
                      email: 'varga.zsuzsa@curalink.hu',
                      role: 'advisor' as const,
                      tajDemo: '000-000-000',
                      mokLicense: 'MOK-HU-48192',
                    };
                    return (
                      <button
                        key="role-advisor"
                        type="button"
                        onClick={() => handleSelectPreset(advisorUser as UserProfile)}
                        className="p-3 border border-amber-200 bg-amber-50/50 hover:bg-amber-100/70 hover:border-amber-300 rounded-xl text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer shadow-2xs group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide">
                            {language === 'hu' ? 'Orvosszakértő' : 'Advisor'}
                          </span>
                          <span className="text-amber-500 group-hover:translate-x-0.5 transition-transform text-xs">→</span>
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs truncate">{advisorUser.name}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {language === 'hu' ? 'Bírálati sor & MOK' : 'Clinical review queue'}
                          </div>
                        </div>
                      </button>
                    );
                  })()}

                  {/* Case Manager Role */}
                  {(() => {
                    const managerUser = users.find((u) => u.role === 'case_manager') || {
                      id: 'user-manager-01',
                      name: 'Molnár Balázs',
                      email: 'molnar.balazs@curalink.hu',
                      role: 'case_manager' as const,
                      tajDemo: '000-000-000',
                    };
                    return (
                      <button
                        key="role-manager"
                        type="button"
                        onClick={() => handleSelectPreset(managerUser as UserProfile)}
                        className="p-3 border border-purple-200 bg-purple-50/50 hover:bg-purple-100/70 hover:border-purple-300 rounded-xl text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer shadow-2xs group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wide">
                            {language === 'hu' ? 'Esettartó' : 'Case Manager'}
                          </span>
                          <span className="text-purple-500 group-hover:translate-x-0.5 transition-transform text-xs">→</span>
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs truncate">{managerUser.name}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {language === 'hu' ? 'Logisztika & NEAK' : 'Logistics dispatch'}
                          </div>
                        </div>
                      </button>
                    );
                  })()}
                </div>
              </div>

              {/* Quick Presets for ease of testing */}
              <div className="pt-3 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  {language === 'hu' ? 'Vagy válasszon az összes fiók közül:' : 'Or choose any specific demo account:'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {users.slice(0, 6).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleSelectPreset(u)}
                      className="p-2 border border-slate-200 hover:border-slate-300 rounded-lg text-left hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div className="truncate">
                        <div className="font-semibold text-slate-800 truncate">{u.name}</div>
                        <div className="text-[10px] text-slate-500 capitalize">
                          {u.role === 'patient'
                            ? (language === 'hu' ? 'Beteg' : 'Patient')
                            : u.role === 'advisor'
                            ? (language === 'hu' ? 'Orvosszakértő' : 'Medical Advisor')
                            : (language === 'hu' ? 'Esettartó' : 'Case Manager')}
                        </div>
                      </div>
                      <span className="text-slate-400 text-xs">→</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Switch to Signup */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                  }}
                  className="text-xs text-[#1E2761] hover:underline font-semibold cursor-pointer"
                >
                  {t('auth.noAccount')}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('auth.fullNameLabel')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('auth.fullNamePlaceholder')}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#1E2761] focus:border-[#1E2761] outline-hidden text-slate-900"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('auth.emailLabel')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth.emailPlaceholder')}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#1E2761] focus:border-[#1E2761] outline-hidden text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('auth.tajLabel')}
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={tajNumber}
                    onChange={(e) => setTajNumber(e.target.value)}
                    placeholder={t('auth.tajPlaceholder')}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#1E2761] focus:border-[#1E2761] outline-hidden text-slate-900 font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {language === 'hu'
                    ? 'Opcionális — ha üresen hagyja, a rendszer automatikusan tesztazonosítót generál.'
                    : 'Optional — if omitted, a validated demo TAJ identifier will be assigned automatically.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('auth.passwordLabel')}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#1E2761] focus:border-[#1E2761] outline-hidden text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="decl"
                  checked={declaration}
                  onChange={(e) => setDeclaration(e.target.checked)}
                  className="mt-0.5 rounded text-[#1E2761]"
                />
                <label htmlFor="decl" className="text-[11px] text-slate-600 leading-snug cursor-pointer">
                  {t('auth.insureDeclaration')}
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#1E2761] hover:bg-[#151B45] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <span>{language === 'hu' ? 'Fiók létrehozása...' : 'Creating Account...'}</span>
                ) : (
                  <>
                    <span>{t('auth.submitSignup')}</span>
                    <ArrowRight className="w-4 h-4 text-[#C9A24B]" />
                  </>
                )}
              </button>

              {/* Switch to Login */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className="text-xs text-[#1E2761] hover:underline font-semibold cursor-pointer"
                >
                  {t('auth.hasAccount')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
