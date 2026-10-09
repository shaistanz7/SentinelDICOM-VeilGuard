import React, { useState } from 'react';
import { JobDetail, Finding } from '../types';
import { 
  UserCheck, 
  CheckCircle, 
  XCircle, 
  PlusSquare, 
  AlertTriangle, 
  ArrowRight,
  ShieldAlert,
  Eye,
  Lock,
  Sparkles
} from 'lucide-react';

interface ReviewQueueViewProps {
  jobs: JobDetail[];
  onSelectJob: (jobId: string) => void;
  onRefreshJobs: () => void;
  isExpertMode: boolean;
}

export const ReviewQueueView: React.FC<ReviewQueueViewProps> = ({
  jobs,
  onSelectJob,
  onRefreshJobs,
  isExpertMode,
}) => {
  const pendingJobs = jobs.filter((j) => j.verdict === 'NEEDS_REVIEW' || j.status === 'needs_human_review');
  const [selectedJob, setSelectedJob] = useState<JobDetail | null>(pendingJobs[0] || null);
  const [reviewerNotes, setReviewerNotes] = useState<string>('Visual review: confirmed mark is benign scanner artifact.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customBox, setCustomBox] = useState<{ x: number; y: number; w: number; h: number }>({ x: 270, y: 25, w: 215, h: 50 });
  const [showAddBox, setShowAddBox] = useState(false);

  const handleReviewDecision = async (decision: 'approved_override' | 'rejected' | 'add_redaction') => {
    if (!selectedJob) return;
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('decision', decision);
    formData.append('notes', reviewerNotes);

    if (decision === 'add_redaction') {
      const bboxes = [[customBox.x, customBox.y, customBox.w, customBox.h]];
      formData.append('additional_bboxes_json', JSON.stringify(bboxes));
    }

    try {
      const res = await fetch(`/api/jobs/${selectedJob.id}/review`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        onRefreshJobs();
        setSelectedJob(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#2e1065] dark:text-white flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-amber-500" />
          <span>Human Review & Oversight Queue</span>
        </h2>
        <p className="text-xs text-lavender-800/80 dark:text-slate-400">
          Cases with borderline OCR confidence or subtle acoustic markers routed here for manual clinical verification.
        </p>
      </div>

      {pendingJobs.length === 0 && !selectedJob ? (
        <div className="bg-white dark:bg-navy-900 border border-lavender-200 dark:border-navy-800 rounded-3xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-[#2e1065] dark:text-white">
            Review Queue is Empty
          </h3>
          <p className="text-xs text-lavender-800/80 dark:text-slate-400 max-w-sm mx-auto">
            All active scans have been either fully APPROVED by automated release gate or sent to QUARANTINE.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Pending Cases List */}
          <div className="lg:col-span-4 bg-white dark:bg-navy-900 border border-lavender-200 dark:border-navy-800 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-lavender-100 dark:border-navy-800">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                Awaiting Review ({pendingJobs.length})
              </span>
            </div>

            <div className="space-y-2">
              {pendingJobs.map((j) => (
                <div
                  key={j.id}
                  onClick={() => setSelectedJob(j)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                    selectedJob?.id === j.id
                      ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700 shadow-sm'
                      : 'bg-lavender-50/40 dark:bg-navy-850/60 border-lavender-100 dark:border-navy-800 hover:border-lavender-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#2e1065] dark:text-white font-mono">
                      {j.filename}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      BORDERLINE
                    </span>
                  </div>
                  <p className="text-[11px] text-lavender-800/80 dark:text-slate-400 line-clamp-2">
                    {j.verdict_reason}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Reviewer Workstation */}
          {selectedJob && (
            <div className="lg:col-span-8 bg-white dark:bg-navy-900 border border-lavender-200 dark:border-navy-800 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-amber-600">
                    REVIEW WORKSTATION | {selectedJob.id}
                  </span>
                  <h3 className="text-lg font-bold text-[#2e1065] dark:text-white">
                    {selectedJob.filename}
                  </h3>
                  <p className="text-xs text-lavender-800/80 dark:text-slate-400">
                    Reason: {selectedJob.verdict_reason}
                  </p>
                </div>

                <button
                  onClick={() => onSelectJob(selectedJob.id)}
                  className="text-xs font-semibold text-lavender-600 dark:text-lavender-400 hover:underline flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Full View</span>
                </button>
              </div>

              {/* Review Canvas with Highlighted Borderline Regions */}
              <div className="bg-black rounded-2xl overflow-hidden aspect-square max-w-md w-full mx-auto relative flex items-center justify-center border border-slate-800 shadow-inner">
                <img
                  key={`review-${selectedJob.id}-${selectedJob.updated_at || ''}`}
                  src={`/api/jobs/${selectedJob.id}/image/original?t=${encodeURIComponent(selectedJob.updated_at || '')}`}
                  alt="Scan under review"
                  className="w-full h-full object-contain pointer-events-none select-none"
                />

                {/* Highlighted Bounding Boxes */}
                <svg viewBox="0 0 512 512" className="absolute inset-0 w-full h-full pointer-events-none">
                  {selectedJob.findings?.map((f) => {
                    if (!f.bbox) return null;
                    const [x, y, w, h] = f.bbox;
                    const isBorderline = f.confidence < 0.80;
                    return (
                      <rect
                        key={f.id}
                        x={x}
                        y={y}
                        width={w}
                        height={h}
                        fill={isBorderline ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.2)'}
                        stroke={isBorderline ? '#f59e0b' : '#ef4444'}
                        strokeWidth="3"
                        strokeDasharray={isBorderline ? '6 3' : 'none'}
                      />
                    );
                  })}
                  {showAddBox && (
                    <rect
                      x={customBox.x}
                      y={customBox.y}
                      width={customBox.w}
                      height={customBox.h}
                      fill="rgba(56, 189, 248, 0.3)"
                      stroke="#38bdf8"
                      strokeWidth="3"
                    />
                  )}
                </svg>

                <div className="absolute top-3 left-3 bg-amber-950/80 text-amber-200 border border-amber-800 text-[10px] font-mono font-bold px-2.5 py-1 rounded">
                  Highlighted Region: Faint Operator Annotation
                </div>
              </div>

              {/* Add Custom Redaction Box Toggle */}
              <div className="p-4 bg-lavender-50/60 dark:bg-navy-850 rounded-2xl border border-lavender-200 dark:border-navy-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-lavender-950 dark:text-slate-200 flex items-center gap-1.5">
                    <PlusSquare className="w-4 h-4 text-lavender-600 dark:text-lavender-400" />
                    Custom Manual Redaction Coordinate Box
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddBox(!showAddBox)}
                    className="text-xs text-lavender-600 dark:text-lavender-400 font-semibold hover:underline"
                  >
                    {showAddBox ? 'Hide Box' : 'Configure Coordinate Box'}
                  </button>
                </div>

                {showAddBox && (
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    <div>
                      <label className="text-[10px] font-mono text-slate-400">X (px)</label>
                      <input
                        type="number"
                        value={customBox.x}
                        onChange={(e) => setCustomBox({ ...customBox, x: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 text-xs rounded bg-white dark:bg-navy-900 border border-lavender-200 dark:border-navy-700 text-[#2e1065] dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-400">Y (px)</label>
                      <input
                        type="number"
                        value={customBox.y}
                        onChange={(e) => setCustomBox({ ...customBox, y: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 text-xs rounded bg-white dark:bg-navy-900 border border-lavender-200 dark:border-navy-700 text-[#2e1065] dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-400">Width</label>
                      <input
                        type="number"
                        value={customBox.w}
                        onChange={(e) => setCustomBox({ ...customBox, w: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 text-xs rounded bg-white dark:bg-navy-900 border border-lavender-200 dark:border-navy-700 text-[#2e1065] dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-400">Height</label>
                      <input
                        type="number"
                        value={customBox.h}
                        onChange={(e) => setCustomBox({ ...customBox, h: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 text-xs rounded bg-white dark:bg-navy-900 border border-lavender-200 dark:border-navy-700 text-[#2e1065] dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Reviewer Notes Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-lavender-950 dark:text-slate-300">
                  Reviewer Audit Log Notes
                </label>
                <textarea
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 text-xs rounded-xl bg-lavender-50/40 dark:bg-navy-850 border border-lavender-200 dark:border-navy-800 text-[#2e1065] dark:text-white focus:outline-none focus:ring-1 focus:ring-lavender-500"
                  placeholder="Explain why this case is approved, rejected, or re-masked..."
                />
              </div>

              {/* Review Decision Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  disabled={isSubmitting}
                  onClick={() => handleReviewDecision('rejected')}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-950 dark:hover:bg-rose-900 dark:text-rose-200 font-bold text-xs transition"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject & Quarantine Scan</span>
                </button>

                {showAddBox && (
                  <button
                    disabled={isSubmitting}
                    onClick={() => handleReviewDecision('add_redaction')}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition"
                  >
                    <PlusSquare className="w-4 h-4" />
                    <span>Apply Extra Mask & Re-Run Pipeline</span>
                  </button>
                )}

                <button
                  disabled={isSubmitting}
                  onClick={() => handleReviewDecision('approved_override')}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition hover:scale-[1.02]"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Sign-Off & Approve Release</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
