import React from 'react';
import { 
  ShieldCheck, 
  Upload, 
  Sparkles, 
  CheckCircle, 
  Lock, 
  FileCheck2, 
  Search, 
  Wand2, 
  ShieldAlert, 
  Award,
  ArrowRight,
  Database
} from 'lucide-react';
import { SampleScan } from '../types';
import { VeilGuardLogo } from './Logo';

interface LandingPageProps {
  onGoToUpload: () => void;
  onRunSample: (sampleId: string) => void;
  samples: SampleScan[];
  isLoading: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGoToUpload,
  onRunSample,
  samples,
  isLoading,
}) => {
  return (
    <div className="space-y-12 py-6">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="flex justify-center mb-2">
          <VeilGuardLogo size="lg" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lavender-100 dark:bg-lavender-950/80 text-lavender-900 dark:text-lavender-300 text-xs font-semibold border border-lavender-200 dark:border-lavender-800">
          <Sparkles className="w-3.5 h-3.5 text-lavender-600" />
          <span>Local-First Sovereign Medical Image Protection</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={onGoToUpload}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-lavender-600 hover:bg-lavender-700 text-white font-semibold text-sm shadow-lg shadow-lavender-600/25 hover:scale-[1.02] transition"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Your Scans</span>
          </button>

          <a
            href="#sample-demo-section"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-navy-900 border border-lavender-200 dark:border-navy-800 hover:bg-lavender-50 dark:hover:bg-navy-850 text-lavender-950 dark:text-slate-200 font-semibold text-sm shadow-sm transition"
          >
            <span>Try with Sample Scans</span>
            <ArrowRight className="w-4 h-4 text-lavender-400" />
          </a>
        </div>
      </div>

      {/* Visual Animated 5-Stage Diagram */}
      <div className="bg-gradient-to-b from-[#fbfaff] to-white dark:from-navy-900 dark:to-navy-950 border border-lavender-200 dark:border-navy-800 rounded-3xl p-8 shadow-sm">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-[#2e1065] dark:text-white">
            The Fail-Closed 5-Stage Release Pipeline
          </h2>
          <p className="text-xs text-lavender-800/80 dark:text-slate-400 mt-1">
            Every file must pass through all five defensive layers before export clearance is granted.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {/* Stage 1 */}
          <div className="bg-white dark:bg-navy-850 p-5 rounded-2xl border border-lavender-200 dark:border-navy-800 shadow-sm relative group hover:border-lavender-500 transition">
            <div className="w-10 h-10 rounded-xl bg-lavender-100 dark:bg-lavender-950/60 text-lavender-700 dark:text-lavender-300 flex items-center justify-center mb-3">
              <Search className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-lavender-700 dark:text-lavender-400">
              Stage 1
            </span>
            <h3 className="text-sm font-bold text-[#2e1065] dark:text-white mt-0.5 mb-1.5">
              Discover & Classify
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Scans 150+ standard tags, odd private vendor tags, nested sequences, and OCR pixel text + QR codes.
            </p>
          </div>

          {/* Stage 2 */}
          <div className="bg-white dark:bg-navy-850 p-5 rounded-2xl border border-lavender-200 dark:border-navy-800 shadow-sm relative group hover:border-lavender-500 transition">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center mb-3">
              <Wand2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
              Stage 2
            </span>
            <h3 className="text-sm font-bold text-[#2e1065] dark:text-white mt-0.5 mb-1.5">
              Policy Transform
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Solid black-box pixel masking, consistent HMAC-UID remapping, and policy-driven tag removal.
            </p>
          </div>

          {/* Stage 3 */}
          <div className="bg-white dark:bg-navy-850 p-5 rounded-2xl border border-lavender-200 dark:border-navy-800 shadow-sm relative group hover:border-lavender-500 transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <CheckCircle className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Stage 3
            </span>
            <h3 className="text-sm font-bold text-[#2e1065] dark:text-white mt-0.5 mb-1.5">
              Independent Validation
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Separate code audits output from scratch; verifies unredacted pixels are 100% byte-identical.
            </p>
          </div>

          {/* Stage 4 */}
          <div className="bg-white dark:bg-navy-850 p-5 rounded-2xl border border-lavender-200 dark:border-navy-800 shadow-sm relative group hover:border-lavender-500 transition">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 flex items-center justify-center mb-3">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-400">
              Stage 4
            </span>
            <h3 className="text-sm font-bold text-[#2e1065] dark:text-white mt-0.5 mb-1.5">
              Adversarial Red Team
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Simulates attacker re-identification: fuzzy token search, upscaled OCR filters, and rarity tests.
            </p>
          </div>

          {/* Stage 5 */}
          <div className="bg-white dark:bg-navy-850 p-5 rounded-2xl border border-lavender-200 dark:border-navy-800 shadow-sm relative group hover:border-lavender-500 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Stage 5
            </span>
            <h3 className="text-sm font-bold text-[#2e1065] dark:text-white mt-0.5 mb-1.5">
              Fail-Closed Gate
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              APPROVED files can be downloaded. Borderline scans go to Human Review. Risky files stay quarantined.
            </p>
          </div>
        </div>
      </div>

      {/* Instant Demo Section */}
      <div id="sample-demo-section" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#2e1065] dark:text-white">
              Instant One-Click Demo Scans (Zero Real Data)
            </h2>
            <p className="text-xs text-lavender-800/80 dark:text-slate-400">
              Generated locally using synthetic patients with planted PHI, burned-in text, and optical QR codes.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-lavender-100 dark:bg-navy-800 text-lavender-800 dark:text-slate-300 font-mono">
            4 Synthetic Scenarios
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {samples.map((sample) => (
            <div
              key={sample.id}
              className="bg-white dark:bg-navy-900 border border-lavender-200 dark:border-navy-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-lavender-400 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-lavender-100 dark:bg-navy-800 text-lavender-900 dark:text-slate-300">
                    {sample.modality}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      sample.expected_outcome === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : sample.expected_outcome === 'NEEDS_REVIEW'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    Outcome: {sample.expected_outcome}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-[#2e1065] dark:text-white mb-1.5">
                  {sample.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                  {sample.description}
                </p>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-4">
                  <span className="text-lavender-800/80">Planted Challenge:</span> {sample.risk_type}
                </div>
              </div>

              <button
                disabled={isLoading}
                onClick={() => onRunSample(sample.id)}
                className="w-full py-2.5 px-3 rounded-xl bg-lavender-50 dark:bg-lavender-950/60 hover:bg-lavender-600 hover:text-white text-lavender-800 dark:text-lavender-300 font-semibold text-xs border border-lavender-200 dark:border-lavender-800 transition flex items-center justify-center gap-2 group"
              >
                <span>Run Through Pipeline</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Trust & Compliance Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-lavender-200 dark:border-navy-800 shadow-sm">
          <div className="p-2.5 rounded-xl bg-lavender-100 dark:bg-lavender-950 text-lavender-700 dark:text-lavender-300 w-fit mb-3">
            <Lock className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-[#2e1065] dark:text-white mb-1">
            Local-First Sovereign Isolation
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            All OCR, validation, and de-identification execute strictly on your device. Zero API calls or patient scans ever touch external clouds.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-lavender-200 dark:border-navy-800 shadow-sm">
          <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 w-fit mb-3">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-[#2e1065] dark:text-white mb-1">
            Tamper-Evident Hash Chaining
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Every file inspection, redaction, and review decision is cryptographically sealed into an append-only SHA-256 blockchain audit trail.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-lavender-200 dark:border-navy-800 shadow-sm">
          <div className="p-2.5 rounded-xl bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 w-fit mb-3">
            <Database className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-[#2e1065] dark:text-white mb-1">
            Consistent UID Integrity
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Study, Series, and Instance relationships are preserved using deterministic HMAC pseudonyms so 3D volumes remain intact.
          </p>
        </div>
      </div>
    </div>
  );
};
