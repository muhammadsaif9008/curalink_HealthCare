import React, { useState } from 'react';
import { UserProfile } from '../types';
import { useI18n } from '../i18n';
import {
  ShieldCheck,
  RotateCcw,
  User,
  Check,
  Building2,
  HelpCircle,
  Info,
  FolderGit2,
  PlusCircle,
  Globe,
  LogIn,
  LogOut,
  UserPlus,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string, caseId?: string) => void;
  currentUser: UserProfile | null;
  users: UserProfile[];
  onSwitchUser: (userId: string) => void;
  onResetDemo: () => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  currentUser,
  users,
  onSwitchUser,
  onResetDemo,
  onOpenAuth,
  onLogout,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { language, setLanguage, t } = useI18n();

  const handleReset = async () => {
    if (
      window.confirm(
        language === 'hu'
          ? 'Visszaállítja az adatbázist a kezdeti állapotra?'
          : 'Reset database to initial state? All test cases will be restored to seed values.'
      )
    ) {
      setResetting(true);
      await onResetDemo();
      setResetting(false);
    }
  };

  // Dedicated role-based menus per Requirement 3:
  // Medical Advisor: Hide "New Case" and "My Cases", show only Review Queue, Reviewed Cases, My Profile, Resources & FAQ.
  // Case Manager: Hide "New Case", show Operations & Cases, EU Clinics, Resources & FAQ, About CuraLink.
  // Patient: Overview, My Cases, + New Case, EU Clinics, Resources & FAQ, About CuraLink.
  let navItems: { id: string; label: string }[] = [];

  if (currentUser?.role === 'advisor') {
    navItems = [
      { id: 'review-queue', label: language === 'hu' ? 'Bírálati sor' : 'Review Queue' },
      { id: 'reviewed-cases', label: language === 'hu' ? 'Bírált ügyek' : 'Reviewed Cases' },
      { id: 'advisor-profile', label: language === 'hu' ? 'Orvosi profilom' : 'My Profile' },
      { id: 'resources', label: t('nav.faq') },
    ];
  } else if (currentUser?.role === 'case_manager') {
    navItems = [
      { id: 'dashboard', label: language === 'hu' ? 'Műveletek és ügyek' : 'Operations & Cases' },
      { id: 'clinics', label: t('nav.clinics') },
      { id: 'resources', label: t('nav.faq') },
      { id: 'about', label: t('nav.about') },
    ];
  } else {
    navItems = [
      { id: 'landing', label: t('nav.overview') },
      { id: 'dashboard', label: t('nav.myCases') },
      { id: 'new-case', label: t('nav.newCase') },
      { id: 'clinics', label: t('nav.clinics') },
      { id: 'resources', label: t('nav.faq') },
      { id: 'about', label: t('nav.about') },
    ];
  }

  const handleLogoClick = () => {
    if (currentUser?.role === 'advisor') {
      onNavigate('review-queue');
    } else if (currentUser?.role === 'case_manager') {
      onNavigate('dashboard');
    } else {
      onNavigate('landing');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#1E2761] text-white shadow-md border-b border-[#2A377D]">
      {/* Top micro-bar */}
      <div className="bg-[#151B45] px-4 py-1 text-xs text-[#CADCFC] flex items-center justify-between border-b border-[#242E6B]">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#C9A24B]"></span>
          <span>{t('brand.micro')}</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-[#1E2761] px-1.5 py-0.5 rounded border border-[#2A377D]">
            <Globe className="w-3 h-3 text-[#C9A24B]" />
            <button
              onClick={() => setLanguage('en')}
              className={`px-1.5 py-0.5 text-[11px] font-semibold rounded cursor-pointer transition-colors ${
                language === 'en'
                  ? 'bg-[#C9A24B] text-[#1E2761]'
                  : 'text-[#CADCFC] hover:text-white'
              }`}
            >
              EN
            </button>
            <span className="text-white/30 text-[10px]">|</span>
            <button
              onClick={() => setLanguage('hu')}
              className={`px-1.5 py-0.5 text-[11px] font-semibold rounded cursor-pointer transition-colors ${
                language === 'hu'
                  ? 'bg-[#C9A24B] text-[#1E2761]'
                  : 'text-[#CADCFC] hover:text-white'
              }`}
            >
              HU
            </button>
          </div>

          <button
            onClick={handleReset}
            disabled={resetting}
            className="flex items-center gap-1 text-xs text-[#CADCFC] hover:text-white transition-colors cursor-pointer"
            title="Reset database to seed cases"
          >
            <RotateCcw className={`w-3 h-3 ${resetting ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('nav.resetDemo')}</span>
          </button>
        </div>
      </div>

      {/* Main navigation row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo */}
          <div
            onClick={handleLogoClick}
            className="flex items-center gap-3 cursor-pointer select-none group shrink-0"
          >
            <div className="w-10 h-10 rounded-lg bg-[#CADCFC] text-[#1E2761] flex items-center justify-center font-bold text-xl shadow-sm border border-white/20">
              C
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white group-hover:text-[#CADCFC] transition-colors leading-none block">
                CuraLink
              </span>
              <p className="text-[11px] font-medium text-[#CADCFC] leading-none mt-1.5 tracking-wide">
                Navigate Care Beyond Borders
              </p>
            </div>
          </div>

          {/* Nav links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`px-3 py-2 text-sm font-medium transition-colors cursor-pointer rounded-md ${
                    isActive
                      ? 'bg-white/10 text-white font-semibold shadow-inner'
                      : 'text-[#CADCFC] hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User Profile & Auth Access (Clean dropdown without separate buttons on main bar) */}
          <div className="flex items-center gap-2">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-xs text-white transition-colors cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-[#CADCFC] text-[#1E2761] font-bold flex items-center justify-center text-xs">
                    {currentUser.name.charAt(0) || 'U'}
                  </div>
                  <div className="text-left hidden sm:block max-w-[140px] truncate">
                    <div className="font-semibold text-xs leading-none truncate">{currentUser.name}</div>
                    <div className="text-[10px] text-[#CADCFC] capitalize mt-0.5 truncate">
                      {currentUser.role === 'advisor'
                        ? (language === 'hu' ? 'Orvosszakértő' : 'Healthcare Advisor')
                        : currentUser.role === 'case_manager'
                        ? (language === 'hu' ? 'Esettartó' : 'Case Manager')
                        : (language === 'hu' ? 'Beteg' : 'Patient')}
                    </div>
                  </div>
                  <span className="text-[#CADCFC] text-[10px]">▼</span>
                </button>

                {/* Dropdown for role switching & auth options */}
                {showUserMenu && (
                  <div
                    className="absolute right-0 mt-2 w-72 rounded-xl bg-white text-slate-900 shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                    onMouseLeave={() => setShowUserMenu(false)}
                  >
                    {/* Active profile card */}
                    <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {language === 'hu' ? 'Aktív bejelentkezett fiók' : 'Active Logged In Profile'}
                      </div>
                      <div className="font-bold text-sm text-[#1E2761] mt-0.5">{currentUser.name}</div>
                      <div className="text-xs text-slate-500">{currentUser.email}</div>
                      {currentUser.tajDemo && (
                        <div className="text-[11px] font-mono text-slate-600 mt-0.5">
                          TAJ: {currentUser.tajDemo}
                        </div>
                      )}
                    </div>

                    {/* Switch role section */}
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      {language === 'hu' ? 'Profil váltása' : 'Switch Active Profile'}
                    </div>
                    {users.map((u) => {
                      const isSelected = currentUser?.id === u.id;
                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            onSwitchUser(u.id);
                            setShowUserMenu(false);
                          }}
                          className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                            isSelected ? 'bg-slate-100 font-semibold text-[#1E2761]' : 'text-slate-700'
                          }`}
                        >
                          <div>
                            <div className="font-medium">{u.name}</div>
                            <div className="text-[11px] text-slate-500 capitalize">
                              {u.role === 'advisor'
                                ? (language === 'hu' ? 'Orvosszakértő' : 'Healthcare Advisor')
                                : u.role === 'case_manager'
                                ? (language === 'hu' ? 'Logisztikai koordinátor' : 'Logistics Manager')
                                : (language === 'hu' ? 'Beteg' : 'Patient')}
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#1E2761]" />}
                        </button>
                      );
                    })}

                    {/* Bottom actions for signup and logout */}
                    <div className="pt-2 mt-1 border-t border-slate-100 px-3 space-y-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenAuth('signup');
                        }}
                        className="w-full text-left px-2 py-1.5 text-xs text-[#1E2761] hover:bg-slate-50 rounded font-semibold flex items-center gap-2 cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5 text-[#C9A24B]" />
                        <span>{language === 'hu' ? '+ Új páciens fiók regisztrációja' : '+ Register new patient account'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenAuth('login');
                        }}
                        className="w-full text-left px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded font-medium flex items-center gap-2 cursor-pointer"
                      >
                        <LogIn className="w-3.5 h-3.5 text-slate-500" />
                        <span>{language === 'hu' ? 'Bejelentkezés meglévő fiókkal' : 'Log in as existing patient'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onLogout();
                        }}
                        className="w-full text-left px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded font-medium flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t('auth.logout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => onOpenAuth('login')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-xs text-white cursor-pointer transition-colors"
              >
                <User className="w-3.5 h-3.5 text-[#CADCFC]" />
                <span>{t('auth.login')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="lg:hidden flex items-center justify-around border-t border-[#2A377D] py-2 bg-[#192152] px-2 text-xs overflow-x-auto gap-1">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors text-xs ${
                isActive
                  ? 'bg-white/15 text-white font-bold border border-white/20'
                  : 'text-[#CADCFC] hover:text-white'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
