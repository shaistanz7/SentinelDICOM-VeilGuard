import React, { useState, useEffect } from 'react';
import { Navbar, NavTab, AuthUser } from './components/Navbar';
import { LoginPage } from './components/LoginPage';
import { LandingPage } from './components/LandingPage';
import { UploadView } from './components/UploadView';
import { PipelineView } from './components/PipelineView';
import { FindingsView } from './components/FindingsView';
import { BeforeAfterView } from './components/BeforeAfterView';
import { VerdictView } from './components/VerdictView';
import { ReviewQueueView } from './components/ReviewQueueView';
import { AuditLogView } from './components/AuditLogView';
import { DashboardView } from './components/DashboardView';
import { GlossaryView } from './components/GlossaryView';
import { JobDetail, Policy, SampleScan } from './types';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('veilguard_auth_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [isExpertMode, setIsExpertMode] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('veilguard_theme_mode');
      if (saved !== null) return saved === 'dark';
    } catch (e) {}
    return false; // Default to white & lavender light mode
  });

  const [jobs, setJobs] = useState<JobDetail[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<string>('Strict Research Release');
  const [samples, setSamples] = useState<SampleScan[]>([]);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [currentJob, setCurrentJob] = useState<JobDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Explicitly synchronize dark mode class to html element
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      try { localStorage.setItem('veilguard_theme_mode', 'dark'); } catch (e) {}
    } else {
      root.classList.remove('dark');
      try { localStorage.setItem('veilguard_theme_mode', 'light'); } catch (e) {}
    }
  }, [isDarkMode]);

  // Load policies, samples, and jobs on initial mount
  const refreshJobs = () => {
    fetch('/api/jobs')
      .then((res) => res.json())
      .then((data) => setJobs(data))
      .catch((e) => console.error(e));
  };

  useEffect(() => {
    fetch('/api/policies')
      .then((res) => res.json())
      .then((data) => {
        setPolicies(data);
        if (data.length > 0) setSelectedPolicy(data[0].name);
      })
      .catch((e) => console.error(e));

    fetch('/api/samples')
      .then((res) => res.json())
      .then((data) => setSamples(data))
      .catch((e) => console.error(e));

    refreshJobs();
  }, []);

  // Poll current job details while processing
  useEffect(() => {
    if (!currentJobId) return;

    let interval: any = null;
    const fetchCurrentJob = () => {
      fetch(`/api/jobs/${currentJobId}`)
        .then((res) => res.json())
        .then((data: JobDetail) => {
          setCurrentJob(data);
          if (data.stage === 'finished') {
            clearInterval(interval);
            refreshJobs();
          }
        })
        .catch((e) => console.error(e));
    };

    fetchCurrentJob();
    interval = setInterval(fetchCurrentJob, 1000);

    return () => clearInterval(interval);
  }, [currentJobId]);

  // Handlers
  const handleUploadFile = async (file: File) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('policy_name', selectedPolicy);

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setCurrentJobId(data.job_id);
      setCurrentTab('pipeline');
      refreshJobs();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunSample = async (sampleId: string) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('sample_id', sampleId);
    formData.append('policy_name', selectedPolicy);

    try {
      const res = await fetch('/api/samples/load-and-run', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setCurrentJobId(data.job_id);
      setCurrentTab('pipeline');
      refreshJobs();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectJob = (jobId: string) => {
    setCurrentJobId(jobId);
    setCurrentTab('verdict');
  };

  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('veilguard_auth_user', JSON.stringify(user));
    } catch (e) {}
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('veilguard_auth_user');
    } catch (e) {}
  };

  const pendingReviewCount = jobs.filter(
    (j) => j.verdict === 'NEEDS_REVIEW' || j.status === 'needs_human_review'
  ).length;

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8ff] dark:bg-navy-950 text-[#2e1065] dark:text-slate-100 transition-colors">
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isExpertMode={isExpertMode}
        onToggleExpertMode={() => setIsExpertMode(!isExpertMode)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        pendingReviewCount={pendingReviewCount}
        currentJobId={currentJobId}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'overview' && (
          <LandingPage
            onGoToUpload={() => setCurrentTab('upload')}
            onRunSample={handleRunSample}
            samples={samples}
            isLoading={isLoading}
          />
        )}

        {currentTab === 'upload' && (
          <UploadView
            policies={policies}
            selectedPolicy={selectedPolicy}
            onSelectPolicy={setSelectedPolicy}
            onUploadFile={handleUploadFile}
            onRunSample={handleRunSample}
            samples={samples}
            isUploading={isLoading}
          />
        )}

        {currentTab === 'pipeline' && currentJob && (
          <PipelineView
            job={currentJob}
            onGoToFindings={() => setCurrentTab('findings')}
            onGoToVerdict={() => setCurrentTab('verdict')}
            isExpertMode={isExpertMode}
          />
        )}

        {currentTab === 'findings' && currentJob && (
          <FindingsView job={currentJob} isExpertMode={isExpertMode} />
        )}

        {currentTab === 'before_after' && currentJob && (
          <BeforeAfterView job={currentJob} isExpertMode={isExpertMode} />
        )}

        {currentTab === 'verdict' && currentJob && (
          <VerdictView
            job={currentJob}
            onGoToReview={() => setCurrentTab('review')}
            isExpertMode={isExpertMode}
          />
        )}

        {currentTab === 'review' && (
          <ReviewQueueView
            jobs={jobs}
            onSelectJob={handleSelectJob}
            onRefreshJobs={refreshJobs}
            isExpertMode={isExpertMode}
          />
        )}

        {currentTab === 'audit' && <AuditLogView />}

        {currentTab === 'dashboard' && (
          <DashboardView jobs={jobs} onSelectJob={handleSelectJob} />
        )}

        {currentTab === 'glossary' && <GlossaryView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-lavender-200 dark:border-navy-800 bg-white/70 dark:bg-navy-900/50 py-6 text-xs text-lavender-800/80 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#2e1065] dark:text-slate-300">
              VeilGuard SentinelDICOM v1.0.0
            </span>
            <span>— Sovereign Local-First Release Control</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Compliant with HIPAA Safe Harbor § 164.514(b)</span>
            <span>•</span>
            <span>DICOM PS 3.15 Basic Profile</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default App;
