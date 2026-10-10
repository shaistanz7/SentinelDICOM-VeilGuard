import React from 'react';
import { VeilGuardLogo } from './Logo';
import { 
  ShieldCheck, 
  Upload, 
  Layers, 
  Eye, 
  SplitSquareVertical, 
  Award, 
  UserCheck, 
  History, 
  BarChart3, 
  BookOpen, 
  Moon, 
  Sun, 
  Lock,
  Sparkles,
  LogOut,
  User,
  Crosshair
} from 'lucide-react';

export type NavTab = 
  | 'overview' 
  | 'upload' 
  | 'pipeline' 
  | 'findings' 
  | 'before_after' 
  | 'reattack'
  | 'verdict' 
  | 'review' 
  | 'audit' 
  | 'dashboard' 
  | 'glossary';

export interface AuthUser {
  email: string;
  name: string;
  role: string;
}

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isExpertMode: boolean;
  onToggleExpertMode: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  pendingReviewCount: number;
  currentJobId?: string | null;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  isExpertMode,
  onToggleExpertMode,
  isDarkMode,
  onToggleDarkMode,
  pendingReviewCount,
  currentJobId,
  currentUser,
  onLogout,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }>; badge?: number; disabled?: boolean }[] = [
    { id: 'overview', label: 'Overview', icon: ShieldCheck },
    { id: 'upload', label: 'Upload & Policy', icon: Upload },
    { id: 'pipeline', label: 'Live Pipeline', icon: Layers, disabled: !currentJobId },
    { id: 'findings', label: 'Findings Canvas', icon: Eye, disabled: !currentJobId },
    { id: 'before_after', label: 'Before/After Diff', icon: SplitSquareVertical, disabled: !currentJobId },
    { id: 'reattack', label: 'ReAttackLab', icon: Crosshair, disabled: !currentJobId },
    { id: 'verdict', label: 'Release Gate', icon: Award, disabled: !currentJobId },
    { id: 'review', label: 'Review Queue', icon: UserCheck, badge: pendingReviewCount },
    { id: 'audit', label: 'Audit Trail', icon: History },
    { id: 'dashboard', label: 'Analytics', icon: BarChart3 },
    { id: 'glossary', label: 'Glossary', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-navy-900/95 backdrop-blur-md border-b border-lavender-100 dark:border-navy-800 shadow-sm transition-colors">
      {/* Top Banner: Sovereign Security Guarantee */}
      <div className="bg-lavender-100 dark:bg-navy-950 text-lavender-900 dark:text-lavender-300 border-b border-lavender-200/70 dark:border-navy-900 px-4 py-1.5 text-xs flex items-center justify-between font-mono transition-colors">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lavender-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-lavender-600"></span>
          </span>
          <span className="font-bold text-lavender-950 dark:text-slate-100">SOVEREIGN LOCAL-FIRST ENVIRONMENT</span>
          <span className="hidden sm:inline text-lavender-700/80 dark:text-slate-400">| Zero data transmitted to cloud / external networks</span>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-lavender-600 dark:text-lavender-400" />
          <span className="hidden md:inline font-semibold text-lavender-800 dark:text-slate-300">HIPAA Safe Harbor & DICOM PS 3.15 Ready</span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div 
            onClick={() => onSelectTab('overview')}
            className="flex items-center cursor-pointer group select-none"
          >
            <VeilGuardLogo size="md" />
          </div>

          {/* Right Action Controls: Mode & Theme toggles */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Simple vs Expert View Toggle */}
            <button
              onClick={onToggleExpertMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                isExpertMode
                  ? 'bg-lavender-100 dark:bg-navy-800 border-lavender-300 dark:border-lavender-800 text-lavender-900 dark:text-lavender-200'
                  : 'bg-white dark:bg-navy-850 border-lavender-200 dark:border-navy-700 text-lavender-800 dark:text-lavender-300 hover:bg-lavender-50'
              }`}
              title="Toggle between friendly plain-English view and technical metadata tags view"
            >
              <Sparkles className="w-3.5 h-3.5 text-lavender-600 dark:text-lavender-400" />
              <span>{isExpertMode ? 'Expert View (Tags & JSON)' : 'Simple View (Plain English)'}</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 text-lavender-700 dark:text-lavender-300 hover:bg-lavender-100 dark:hover:bg-navy-800 rounded-xl transition border border-lavender-200 dark:border-navy-700"
              aria-label="Toggle dark mode"
              title={isDarkMode ? "Switch to White & Lavender Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-lavender-700" />}
            </button>

            {/* User Profile & Sign Out Button */}
            {currentUser && (
              <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-lavender-200 dark:border-navy-750">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-bold text-[#21186a] dark:text-lavender-200 leading-tight">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-[#008f9e] dark:text-teal-400 font-medium">
                    {currentUser.role.split('&')[0].trim()}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-lavender-200 dark:border-navy-700 bg-lavender-50 dark:bg-navy-850 text-lavender-900 dark:text-lavender-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 transition"
                  title="Sign Out to Portal"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center space-x-1 overflow-x-auto py-2 scrollbar-none border-t border-lavender-100 dark:border-navy-800/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            const isDisabled = item.disabled;

            return (
              <button
                key={item.id}
                disabled={isDisabled}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-lavender-600 text-white shadow-sm shadow-lavender-600/30 font-semibold'
                    : isDisabled
                    ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-lavender-50 dark:hover:bg-navy-800 hover:text-lavender-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : ''}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
