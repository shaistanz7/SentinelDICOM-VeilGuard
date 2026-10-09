import React, { useState, useEffect } from 'react';
import { AuditEntry, AuditVerification } from '../types';
import { 
  History, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  RefreshCw, 
  Lock, 
  FileText, 
  ExternalLink,
  Hash
} from 'lucide-react';
import { Tooltip } from './Tooltip';

export const AuditLogView: React.FC = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [verification, setVerification] = useState<AuditVerification | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAuditLog = () => {
    setIsLoading(true);
    fetch('/api/audit')
      .then((res) => res.json())
      .then((data) => {
        setEntries(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  };

  const handleVerifyIntegrity = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch('/api/audit/verify');
      const data = await res.json();
      setVerification(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    fetchAuditLog();
  }, []);

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#2e1065] dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-lavender-600 dark:text-lavender-400" />
            <span>Cryptographic Audit Trail</span>
          </h2>
          <p className="text-xs text-lavender-800/80 dark:text-slate-400">
            Immutable, append-only log sealed with SHA-256 hash chaining. Every user action and algorithmic decision is permanent.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={isVerifying}
            onClick={handleVerifyIntegrity}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-lavender-600 hover:bg-lavender-700 text-white font-semibold text-xs shadow-md shadow-lavender-600/20 transition hover:scale-[1.02]"
          >
            <ShieldCheck className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>Verify Audit Integrity</span>
          </button>

          <button
            onClick={fetchAuditLog}
            className="p-2.5 text-lavender-800 dark:text-slate-300 hover:bg-lavender-100 dark:hover:bg-navy-800 rounded-xl transition"
            title="Refresh Log"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Verification Result Banner (if verified) */}
      {verification && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
            verification.is_valid
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100'
          }`}
        >
          <div
            className={`p-2 rounded-xl text-white ${
              verification.is_valid ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
          >
            {verification.is_valid ? <CheckCircle2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider">
              {verification.is_valid
                ? 'Cryptographic Hash-Chain Integrity Confirmed'
                : 'Tamper Detected in Audit Log'}
            </h4>
            <p className="text-xs leading-relaxed">{verification.message}</p>
            {verification.latest_hash && (
              <p className="text-[10px] font-mono opacity-80 truncate">
                Head Hash: {verification.latest_hash}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Timeline Entries List */}
      <div className="bg-white dark:bg-navy-900 border border-lavender-200 dark:border-navy-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-lavender-100 dark:border-navy-800 text-xs text-lavender-800/80 dark:text-slate-400">
          <span>Timeline Events ({entries.length})</span>
          <Tooltip 
            term="SHA-256 Hash Chain" 
            explanation="Each log entry mathematically incorporates the hash signature of the previous entry. If an attacker tries to alter a past record, the mathematical chain breaks immediately." 
          />
        </div>

        <div className="divide-y divide-lavender-100 dark:divide-navy-800 font-sans">
          {entries.length > 0 ? (
            entries.map((entry) => (
              <div key={entry.entry_id} className="py-3.5 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-lavender-100 dark:bg-navy-850 text-lavender-900 dark:text-slate-200">
                        #{entry.id} {entry.action}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        by <strong className="text-lavender-950 dark:text-slate-300">{entry.actor}</strong>
                      </span>
                    </div>
                    {entry.job_id && (
                      <p className="text-xs font-mono text-lavender-700 dark:text-lavender-400">
                        Job: {entry.job_id}
                      </p>
                    )}
                  </div>

                  <span className="text-[11px] font-mono text-slate-400 flex-shrink-0">
                    {entry.timestamp.slice(0, 19).replace('T', ' ')} UTC
                  </span>
                </div>

                {/* Hashes and Cryptographic link */}
                <div className="p-2.5 bg-lavender-50/50 dark:bg-navy-850 rounded-xl border border-lavender-100 dark:border-navy-800 font-mono text-[11px] space-y-1 text-slate-500 dark:text-slate-400">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400">Prev Hash:</span>
                    <span className="truncate">{entry.prev_hash}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-lavender-700 dark:text-lavender-400 font-semibold">
                    <span className="text-slate-400">Entry Hash:</span>
                    <span className="truncate">{entry.entry_hash}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="py-6 text-center text-xs text-slate-400">
              {isLoading ? 'Loading audit trail...' : 'No audit entries logged.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
