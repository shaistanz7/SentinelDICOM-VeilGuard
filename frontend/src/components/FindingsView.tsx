import React, { useState } from 'react';
import { Finding, JobDetail } from '../types';
import { 
  Eye, 
  Search, 
  Filter, 
  Sparkles, 
  Tag, 
  AlertCircle, 
  HelpCircle,
  Crosshair,
  Download,
  CheckCircle2
} from 'lucide-react';
import { ExplainModal } from './ExplainModal';

interface FindingsViewProps {
  job: JobDetail;
  isExpertMode: boolean;
}

export const FindingsView: React.FC<FindingsViewProps> = ({ job, isExpertMode }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeFinding, setActiveFinding] = useState<Finding | null>(null);
  const [explainFinding, setExplainFinding] = useState<Finding | null>(null);
  const [canvasMode, setCanvasMode] = useState<'original' | 'processed'>('original');

  const findings = job.findings || [];
  const categories = ['ALL', ...Array.from(new Set(findings.map((f) => f.category)))];

  const filteredFindings = selectedCategory === 'ALL'
    ? findings
    : findings.filter((f) => f.category === selectedCategory);

  const pixelFindings = findings.filter((f) => f.bbox);

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#2e1065] dark:text-white flex items-center gap-2">
            <Eye className="w-5 h-5 text-lavender-600 dark:text-lavender-400" />
            <span>Interactive Findings Canvas</span>
          </h2>
          <p className="text-xs text-lavender-800/80 dark:text-slate-400">
            Visual inspection of detected patient health identifiers. Red and amber boxes highlight burned-in text and optical codes.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-lavender-600 text-white shadow-sm shadow-lavender-600/30'
                  : 'bg-white dark:bg-navy-900 border border-lavender-200 dark:border-navy-800 text-lavender-900 dark:text-slate-200 hover:bg-lavender-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split: Image Canvas (Left) + Findings Sidebar (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: DICOM Canvas with Mode Switcher & Download */}
        <div className="lg:col-span-7 space-y-3">
          {/* Canvas Mode Switcher & Download Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-white dark:bg-navy-900 border border-lavender-200 dark:border-navy-800 rounded-2xl shadow-sm">
            <div className="flex items-center gap-1.5 p-1 bg-lavender-50 dark:bg-navy-850 rounded-xl">
              <button
                type="button"
                onClick={() => setCanvasMode('original')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  canvasMode === 'original'
                    ? 'bg-white dark:bg-navy-900 text-rose-600 dark:text-rose-400 shadow-sm'
                    : 'text-lavender-800 dark:text-slate-400 hover:text-lavender-950'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Original Scan (With PHI)</span>
              </button>

              <button
                type="button"
                onClick={() => setCanvasMode('processed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  canvasMode === 'processed'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-lavender-800 dark:text-slate-400 hover:text-emerald-600'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Clean Output Scan</span>
              </button>
            </div>

            <a
              href={`/api/jobs/${job.id}/download/image`}
              download={`clean_${job.filename.replace(/\.dcm$/i, '')}.png`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition hover:scale-105"
              title="Download sanitized clean output image as PNG"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Output Image</span>
            </a>
          </div>

          <div className="bg-black rounded-3xl overflow-hidden border border-slate-800 shadow-xl relative aspect-square flex items-center justify-center group">
            {/* DICOM Rendered Image (Original or Processed) */}
            <img
              key={`${canvasMode}-${job.id}-${job.updated_at || ''}`}
              src={
                canvasMode === 'original'
                  ? `/api/jobs/${job.id}/image/original?t=${encodeURIComponent(job.updated_at || '')}`
                  : `/api/jobs/${job.id}/image/processed?t=${encodeURIComponent(job.updated_at || '')}`
              }
              alt={canvasMode === 'original' ? 'Original DICOM scan' : 'De-Identified DICOM scan'}
              className="w-full h-full object-contain pointer-events-none select-none transition-opacity duration-200"
            />

            {/* SVG Overlay for Bounding Boxes (Only visible in original mode) */}
            {canvasMode === 'original' && (
              <svg
                viewBox="0 0 512 512"
                className="absolute inset-0 w-full h-full pointer-events-auto"
              >
                {pixelFindings.map((f) => {
                  if (!f.bbox) return null;
                  const [x, y, w, h] = f.bbox;
                  const isSelected = activeFinding?.id === f.id;
                  const strokeColor = f.confidence < 0.80 ? '#f59e0b' : '#ef4444';

                  return (
                    <g key={f.id} className="cursor-pointer" onClick={() => setActiveFinding(f)}>
                      <rect
                        x={x}
                        y={y}
                        width={w}
                        height={h}
                        fill={isSelected ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.15)'}
                        stroke={isSelected ? '#38bdf8' : strokeColor}
                        strokeWidth={isSelected ? 3.5 : 2}
                        strokeDasharray={f.confidence < 0.80 ? '4 2' : 'none'}
                        className="transition-all"
                      />
                      {/* Label badge */}
                      <rect
                        x={x}
                        y={Math.max(0, y - 14)}
                        width={Math.min(w, 110)}
                        height={14}
                        fill={strokeColor}
                        rx={2}
                      />
                      <text
                        x={x + 3}
                        y={Math.max(10, y - 3)}
                        fill="#ffffff"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {f.category}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}

            {/* Status indicator badge */}
            <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-slate-300 px-3 py-1.5 rounded-xl text-[11px] font-mono border border-slate-700 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${canvasMode === 'original' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
              <span>{canvasMode === 'original' ? 'Original Input (With PHI)' : 'Sanitized Output (De-Identified)'}</span>
            </div>

            {/* Overlay Canvas Controls info */}
            <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm text-slate-300 px-3 py-1.5 rounded-xl text-[11px] font-mono border border-slate-700 flex items-center gap-2">
              <Crosshair className="w-3.5 h-3.5 text-sentinel-400" />
              <span>Interactive PHI Overlay ({pixelFindings.length} pixel zones)</span>
            </div>

            {/* Floating direct download button inside canvas */}
            <a
              href={`/api/jobs/${job.id}/download/image`}
              download={`clean_${job.filename.replace(/\.dcm$/i, '')}.png`}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600/90 hover:bg-teal-600 text-white text-xs font-bold shadow-lg backdrop-blur-sm transition hover:scale-105"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PNG</span>
            </a>
          </div>
        </div>

        {/* Right: Discovered Findings List */}
        <div className="lg:col-span-5 bg-white dark:bg-navy-900 border border-lavender-200 dark:border-navy-800 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-lavender-100 dark:border-navy-800">
            <div>
              <h3 className="text-sm font-bold text-[#2e1065] dark:text-white">
                Findings List ({filteredFindings.length})
              </h3>
              <p className="text-[11px] text-lavender-700/80 dark:text-slate-400">Click any finding to highlight on canvas</p>
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-lavender-100 dark:bg-navy-800 text-lavender-900 dark:text-slate-300">
              {job.policy_name}
            </span>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {filteredFindings.map((f) => {
              const isSelected = activeFinding?.id === f.id;

              return (
                <div
                  key={f.id}
                  onClick={() => setActiveFinding(f)}
                  className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-lavender-50 dark:bg-lavender-950/60 border-lavender-500 shadow-sm'
                      : 'bg-lavender-50/30 dark:bg-navy-850/60 border-lavender-100 dark:border-navy-800 hover:border-lavender-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-[#2e1065] dark:text-white font-mono">
                        {f.category}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        f.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : f.severity === 'HIGH'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-lavender-100 text-lavender-800 dark:bg-navy-800 dark:text-slate-300'
                      }`}>
                        {f.severity}
                      </span>
                      {f.confidence < 0.80 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500 text-white">
                          Borderline Conf
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExplainFinding(f);
                      }}
                      className="text-[11px] text-lavender-600 dark:text-lavender-400 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Explain</span>
                    </button>
                  </div>

                  <p className="text-xs text-lavender-900/90 dark:text-slate-300 mb-1 leading-snug">
                    {f.explanation}
                  </p>

                  <div className="text-[11px] font-mono text-lavender-800/80 dark:text-slate-400 space-y-0.5 pt-1 border-t border-lavender-100 dark:border-navy-800/60">
                    <div className="truncate">
                      <span className="text-slate-400">Target:</span> {f.tag_or_location}
                    </div>
                    {f.original_value && (
                      <div className="truncate text-rose-600 dark:text-rose-400">
                        <span className="text-slate-400">Value:</span> {f.original_value}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Educational Explain Modal */}
      {explainFinding && (
        <ExplainModal
          isOpen={true}
          onClose={() => setExplainFinding(null)}
          title={`Understanding ${explainFinding.category}`}
          plainSummary={explainFinding.explanation}
          patientImpact={`This protects your privacy by preventing ${explainFinding.category.toLowerCase()} from exposing your identity to researchers or third-party recipients.`}
          hospitalCompliance={`Compliance requirement: ${explainFinding.tag_or_location} falls under HIPAA Direct/Quasi-Identifier standards and must be consistently scrubbed.`}
        />
      )}
    </div>
  );
};
