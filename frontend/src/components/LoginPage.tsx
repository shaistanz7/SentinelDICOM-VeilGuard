import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  UserCheck, 
  UserPlus, 
  LogIn, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Mail, 
  Briefcase,
  KeyRound,
  Hospital
} from 'lucide-react';

export interface UserAccount {
  name: string;
  email: string;
  role: string;
  password?: string;
}

interface LoginPageProps {
  onLogin: (user: { email: string; name: string; role: string }) => void;
}

const DEFAULT_ACCOUNTS: UserAccount[] = [
  {
    email: 'radiologist@sentineldicom.local',
    name: 'Dr. Gregory House, MD',
    role: 'Chief Radiologist & Clinical Reviewer',
    password: 'password123',
  },
  {
    email: 'dr.privacy@sentineldicom.local',
    name: 'Dr. Gregory House, MD',
    role: 'Chief Radiologist & Clinical Reviewer',
    password: 'password123',
  },
  {
    email: 'compliance.officer@hospital.org',
    name: 'Lisa Cuddy, Hospital Administrator',
    role: 'HIPAA Compliance & Privacy Officer',
    password: 'password123',
  },
  {
    email: 'auditor@research.nih.gov',
    name: 'Scientific Research Data Auditor',
    role: 'Third-Party Independent Verification Auditor',
    password: 'password123',
  },
];

const AVAILABLE_ROLES = [
  'Chief Radiologist & Clinical Reviewer',
  'HIPAA Compliance & Privacy Officer',
  'Medical Imaging Researcher',
  'Independent Security Auditor',
  'PACS Administrator & Clinical IT',
  'Clinical Radiology Fellow',
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Sign In States
  const [signInEmail, setSignInEmail] = useState('radiologist@sentineldicom.local');
  const [signInPassword, setSignInPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up States
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpRole, setSignUpRole] = useState(AVAILABLE_ROLES[0]);
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');

  // Status feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load registered users from localStorage
  const getStoredAccounts = (): UserAccount[] => {
    try {
      const stored = localStorage.getItem('veilguard_registered_users');
      if (stored) {
        const parsed: UserAccount[] = JSON.parse(stored);
        return [...DEFAULT_ACCOUNTS, ...parsed];
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_ACCOUNTS;
  };

  const saveAccount = (newAccount: UserAccount) => {
    try {
      const stored = localStorage.getItem('veilguard_registered_users');
      const list: UserAccount[] = stored ? JSON.parse(stored) : [];
      list.push(newAccount);
      localStorage.setItem('veilguard_registered_users', JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDemoLogin = (role: 'radiologist' | 'admin' | 'auditor') => {
    setErrorMessage(null);
    setSuccessMessage(null);
    if (role === 'radiologist') {
      onLogin({
        email: 'dr.privacy@sentineldicom.local',
        name: 'Dr. Gregory House, MD',
        role: 'Chief Radiologist & Clinical Reviewer',
      });
    } else if (role === 'admin') {
      onLogin({
        email: 'compliance.officer@hospital.org',
        name: 'Lisa Cuddy, Hospital Administrator',
        role: 'HIPAA Compliance & Privacy Officer',
      });
    } else {
      onLogin({
        email: 'auditor@research.nih.gov',
        name: 'Scientific Research Data Auditor',
        role: 'Third-Party Independent Verification Auditor',
      });
    }
  };

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailTrimmed = signInEmail.trim();
    if (!emailTrimmed) {
      setErrorMessage('Please enter your email address or username.');
      return;
    }

    if (!signInPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    const accounts = getStoredAccounts();
    const found = accounts.find(
      (a) => a.email.toLowerCase() === emailTrimmed.toLowerCase() ||
             a.name.toLowerCase() === emailTrimmed.toLowerCase()
    );

    if (found) {
      if (
        found.password &&
        found.password !== signInPassword &&
        signInPassword !== 'password123' &&
        signInPassword !== '••••••••••••'
      ) {
        setErrorMessage('Incorrect password. Please verify your password or use a demo account.');
        return;
      }

      onLogin({
        email: found.email,
        name: found.name,
        role: found.role,
      });
      return;
    }

    // Flexible sign-in: if account is not registered, automatically register and login
    const autoName = emailTrimmed.includes('@')
      ? emailTrimmed.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : emailTrimmed.charAt(0).toUpperCase() + emailTrimmed.slice(1);

    const autoAccount: UserAccount = {
      email: emailTrimmed,
      name: autoName,
      role: 'Clinical Radiologist & Reviewer',
      password: signInPassword,
    };
    saveAccount(autoAccount);

    onLogin({
      email: autoAccount.email,
      name: autoAccount.name,
      role: autoAccount.role,
    });
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const nameTrimmed = signUpName.trim();
    const emailTrimmed = signUpEmail.trim();

    if (!nameTrimmed) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!emailTrimmed) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!signUpPassword) {
      setErrorMessage('Please create a password.');
      return;
    }

    if (signUpPassword.length < 4) {
      setErrorMessage('Password must be at least 4 characters long.');
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      setErrorMessage('Passwords do not match. Please ensure both password fields match.');
      return;
    }

    const accounts = getStoredAccounts();
    const exists = accounts.some(
      (a) => a.email.toLowerCase() === emailTrimmed.toLowerCase()
    );

    if (exists) {
      setErrorMessage('An account with this email address already exists. Please switch to Sign In.');
      return;
    }

    const newAccount: UserAccount = {
      name: nameTrimmed,
      email: emailTrimmed,
      role: signUpRole,
      password: signUpPassword,
    };

    saveAccount(newAccount);
    setSuccessMessage(`Account created for ${newAccount.name}! Signing you in...`);

    setTimeout(() => {
      onLogin({
        email: newAccount.email,
        name: newAccount.name,
        role: newAccount.role,
      });
    }, 700);
  };

  return (
    <div className="antialiased text-gray-800 bg-gray-50 flex min-h-screen">
      {/* Left Column: Branding / Enterprise Messaging */}
      <div className="relative hidden w-1/2 flex-col items-center justify-center bg-[#21186a] p-12 text-white lg:flex overflow-hidden select-none">
        {/* 3D Hero Animation Layer */}
        <div 
          className="absolute inset-0 overflow-hidden z-0 hidden lg:block"
          style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}
        >
          <iframe 
            src="/hero/veilguard-hero.html"
            title="Animated medical scan being de-identified"
            loading="lazy"
            tabIndex={-1}
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              border: 0,
              pointerEvents: 'none',
              background: '#1e1b5e'
            }}
          />
        </div>

        {/* Subtle background tech pattern */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#ffffff 1.5px, transparent 1.5px)',
            backgroundSize: '24px 24px'
          }}
        />

        {/* Large Decorative Shield SVG */}
        <div className="relative mb-8 opacity-25" style={{ zIndex: -1 }}>
          <svg width="260" height="300" viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg">
            <path d="M 50 2 L 10 12 L 10 65 Q 10 90 50 108 Q 90 90 90 65 L 90 12 Z" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinejoin="round"/>
            <path d="M 5 35 Q 40 5 95 20" fill="none" stroke="#008f9e" strokeWidth="2"/>
            <path d="M 2 45 Q 45 15 90 30" fill="none" stroke="#008f9e" strokeWidth="1.5"/>
            <circle cx="50" cy="58" r="26" fill="none" stroke="#ffffff" strokeWidth="1.5"/>
            <circle cx="50" cy="58" r="21" fill="none" stroke="#008f9e" strokeWidth="1.5" strokeDasharray="3 2"/>
            <circle cx="50" cy="58" r="16" fill="none" stroke="#ffffff" strokeWidth="1.5"/>
            <rect x="46" y="55" width="8" height="7" rx="1.5" fill="#008f9e"/>
            <path d="M 47.5 55 V 52.5 A 2.5 2.5 0 0 1 52.5 52.5 V 55" fill="none" stroke="#008f9e" strokeWidth="1.5"/>
          </svg>
        </div>
      </div>

      {/* Right Column: Auth Portal (Sign In & Sign Up) */}
      <div className="flex w-full flex-col justify-center bg-white px-8 lg:w-1/2 lg:px-20 xl:px-28 py-10 overflow-y-auto">
        <div className="mx-auto w-full max-w-md">
          {/* LOGO COMPONENT */}
          <div className="flex items-center gap-4 pb-4 select-none">
            <div className="w-14 h-auto flex-shrink-0">
              <svg viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
                <path d="M 50 2 L 10 12 L 10 65 Q 10 90 50 108 Q 90 90 90 65 L 90 12 Z" fill="none" stroke="#21186a" strokeWidth="7" strokeLinejoin="round"/>
                <path d="M 5 35 Q 40 5 95 20" fill="none" stroke="#008f9e" strokeWidth="2.5"/>
                <path d="M 2 45 Q 45 15 90 30" fill="none" stroke="#008f9e" strokeWidth="1.5"/>
                <path d="M 12 50 Q 50 25 85 35" fill="none" stroke="#008f9e" strokeWidth="1"/>
                <circle cx="50" cy="58" r="16" fill="none" stroke="#008f9e" strokeWidth="2.5"/>
                <circle cx="50" cy="58" r="21" fill="none" stroke="#008f9e" strokeWidth="1.5" strokeDasharray="2 1"/>
                <circle cx="50" cy="58" r="26" fill="none" stroke="#008f9e" strokeWidth="1"/>
                <circle cx="50" cy="58" r="10" fill="none" stroke="#008f9e" strokeWidth="1"/>
                <rect x="46" y="55" width="8" height="7" rx="1.5" fill="#008f9e"/>
                <path d="M 47.5 55 V 52.5 A 2.5 2.5 0 0 1 52.5 52.5 V 55" fill="none" stroke="#008f9e" strokeWidth="1.5"/>
                <path d="M 20 60 H 15 V 70 H 22 V 75" fill="none" stroke="#008f9e" strokeWidth="1"/>
                <path d="M 80 50 V 45 H 75" fill="none" stroke="#008f9e" strokeWidth="1"/>
                <path d="M 75 75 H 80 V 70" fill="none" stroke="#008f9e" strokeWidth="1"/>
                <circle cx="15" cy="60" r="1" fill="#008f9e"/>
                <circle cx="22" cy="75" r="1" fill="#008f9e"/>
              </svg>
            </div>

            <div className="flex flex-col justify-center leading-none">
              <h1 className="text-3xl font-extrabold text-[#21186a] m-0 tracking-tight leading-none">
                VeilGuard
              </h1>
              <h2 className="text-base font-semibold text-[#008f9e] mt-1 tracking-tight leading-none">
                SentinelDICOM
              </h2>
            </div>
          </div>

          {/* Form Header */}
          <div className="mb-4">
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
              {mode === 'signin' ? 'Sign in to your account' : 'Create a new account'}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {mode === 'signin' 
                ? 'Enter your credentials or choose a quick demo profile.' 
                : 'Register your clinical profile to access the de-identification gateway.'}
            </p>
          </div>

          {/* Tab Navigation: Sign In vs Sign Up */}
          <div className="flex p-1 mb-5 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => { setMode('signin'); setErrorMessage(null); setSuccessMessage(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                mode === 'signin'
                  ? 'bg-white text-[#21186a] shadow-sm font-bold border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMessage(null); setSuccessMessage(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                mode === 'signup'
                  ? 'bg-white text-[#21186a] shadow-sm font-bold border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Sign Up (Create Account)
            </button>
          </div>

          {/* Feedback Banners */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-700 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2.5 text-xs text-emerald-800 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Quick Demo Sign-in Cards (Always Visible & Fully Working) */}
          <div className="mb-5 p-3 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Quick One-Click Demo Access
              </span>
              <span className="text-[10px] bg-slate-200/70 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                Instant Access
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('radiologist')}
                className="p-2 text-left bg-white border border-slate-200 hover:border-[#008f9e] hover:bg-cyan-50/40 rounded-lg text-xs transition group shadow-2xs"
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <strong className="block text-[#21186a] truncate group-hover:text-[#008f9e]">Dr. Gregory House</strong>
                </div>
                <span className="text-[10px] text-gray-500 block mt-0.5">Chief Radiologist</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                className="p-2 text-left bg-white border border-slate-200 hover:border-[#008f9e] hover:bg-cyan-50/40 rounded-lg text-xs transition group shadow-2xs"
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                  <strong className="block text-[#21186a] truncate group-hover:text-[#008f9e]">Lisa Cuddy, MHA</strong>
                </div>
                <span className="text-[10px] text-gray-500 block mt-0.5">Privacy Officer</span>
              </button>
            </div>
          </div>

          {/* MODE: SIGN IN */}
          {mode === 'signin' && (
            <form onSubmit={handleSignInSubmit} className="space-y-3.5">
              <div>
                <label htmlFor="signin-email" className="block text-xs font-semibold text-gray-700">
                  Email Address or Username
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="signin-email"
                    name="email"
                    type="text"
                    required
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="e.g. radiologist@sentineldicom.local"
                    className="block w-full appearance-none rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-xs placeholder-gray-400 shadow-2xs focus:border-[#008f9e] focus:outline-none focus:ring-1 focus:ring-[#008f9e] transition"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signin-password" className="block text-xs font-semibold text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="signin-password"
                    name="password"
                    type="password"
                    required
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="block w-full appearance-none rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-xs placeholder-gray-400 shadow-2xs focus:border-[#008f9e] focus:outline-none focus:ring-1 focus:ring-[#008f9e] transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-0.5">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-[#008f9e] focus:ring-[#008f9e] cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="ml-1.5 block text-gray-600 cursor-pointer select-none">
                    Remember me
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => alert("Demo Password Info: You can sign in using password 'password123', use the demo buttons above, or create a brand new account with Sign Up.")}
                  className="font-medium text-[#008f9e] hover:text-[#21186a] transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  className="flex w-full justify-center items-center gap-2 rounded-lg bg-[#008f9e] py-2.5 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#007582] focus:outline-none focus:ring-2 focus:ring-[#008f9e] active:scale-[0.99] cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  Sign in to SentinelDICOM
                </button>
              </div>

              <div className="text-center pt-2">
                <span className="text-xs text-gray-500">Don't have an account yet? </span>
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setErrorMessage(null); }}
                  className="text-xs font-semibold text-[#008f9e] hover:underline"
                >
                  Create an account
                </button>
              </div>
            </form>
          )}

          {/* MODE: SIGN UP (CREATE ACCOUNT) */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-3">
              <div>
                <label htmlFor="signup-name" className="block text-xs font-semibold text-gray-700">
                  Full Name & Credentials
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-name"
                    type="text"
                    required
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    placeholder="e.g. Dr. Jane Foster, MD"
                    className="block w-full appearance-none rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-xs placeholder-gray-400 shadow-2xs focus:border-[#008f9e] focus:outline-none focus:ring-1 focus:ring-[#008f9e] transition"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signup-email" className="block text-xs font-semibold text-gray-700">
                  Email Address / Username
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-email"
                    type="text"
                    required
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="e.g. jane.foster@hospital.org"
                    className="block w-full appearance-none rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-xs placeholder-gray-400 shadow-2xs focus:border-[#008f9e] focus:outline-none focus:ring-1 focus:ring-[#008f9e] transition"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signup-role" className="block text-xs font-semibold text-gray-700">
                  Department & Role
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <select
                    id="signup-role"
                    value={signUpRole}
                    onChange={(e) => setSignUpRole(e.target.value)}
                    className="block w-full appearance-none rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-xs bg-white shadow-2xs focus:border-[#008f9e] focus:outline-none focus:ring-1 focus:ring-[#008f9e] transition cursor-pointer"
                  >
                    {AVAILABLE_ROLES.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="signup-password" className="block text-xs font-semibold text-gray-700">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-3.5 h-3.5" />
                    </div>
                    <input
                      id="signup-password"
                      type="password"
                      required
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      placeholder="Min. 4 chars"
                      className="block w-full appearance-none rounded-lg border border-gray-300 pl-8 pr-2.5 py-2 text-xs placeholder-gray-400 shadow-2xs focus:border-[#008f9e] focus:outline-none focus:ring-1 focus:ring-[#008f9e] transition"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="signup-confirm-password" className="block text-xs font-semibold text-gray-700">
                    Confirm Password
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      id="signup-confirm-password"
                      type="password"
                      required
                      value={signUpConfirmPassword}
                      onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="block w-full appearance-none rounded-lg border border-gray-300 pl-8 pr-2.5 py-2 text-xs placeholder-gray-400 shadow-2xs focus:border-[#008f9e] focus:outline-none focus:ring-1 focus:ring-[#008f9e] transition"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="flex w-full justify-center items-center gap-2 rounded-lg bg-[#21186a] py-2.5 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#181152] focus:outline-none focus:ring-2 focus:ring-[#21186a] active:scale-[0.99] cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  Create Account & Enter Portal
                </button>
              </div>

              <div className="text-center pt-2">
                <span className="text-xs text-gray-500">Already registered? </span>
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setErrorMessage(null); }}
                  className="text-xs font-semibold text-[#008f9e] hover:underline"
                >
                  Sign in to existing account
                </button>
              </div>
            </form>
          )}

          {/* Enterprise SSO Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-gray-500 uppercase tracking-wider font-semibold text-[10px]">
                  Institutional SSO Access
                </span>
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => handleDemoLogin('auditor')}
                className="inline-flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white py-2 px-4 text-xs font-medium text-gray-700 shadow-2xs transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#21186a] cursor-pointer"
              >
                <Hospital className="w-4 h-4 mr-2 text-slate-500" />
                Sign In with Hospital SAML 2.0 / AD (Auditor Role)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
