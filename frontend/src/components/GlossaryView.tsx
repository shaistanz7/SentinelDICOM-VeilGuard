import React, { useState, useEffect } from 'react';
import { GlossaryTerm } from '../types';
import { 
  BookOpen, 
  HelpCircle, 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  Lock,
  Layers,
  Sparkles
} from 'lucide-react';

export const GlossaryView: React.FC = () => {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);

  useEffect(() => {
    fetch('/api/glossary')
      .then((res) => res.json())
      .then((data) => setTerms(data))
      .catch((e) => console.error(e));
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-4">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lavender-100 dark:bg-navy-900 text-lavender-900 dark:text-lavender-300 text-xs font-semibold border border-lavender-200 dark:border-navy-800">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Patient & Administrator Plain-English Guide</span>
        </div>
        <h2 className="text-3xl font-black text-[#2e1065] dark:text-white tracking-tight">
          Understanding Medical Scan Privacy
        </h2>
        <p className="text-xs sm:text-sm text-lavender-800/80 dark:text-slate-400">
          Clear, jargon-free explanations of how medical image de-identification works and why simple redaction tools fail.
        </p>
      </div>

      {/* Featured Educational Guide: "Why Not Just Delete the Name?" */}
      <div className="bg-gradient-to-br from-[#2e1065] to-[#120b24] text-white rounded-3xl p-8 shadow-xl space-y-6 border border-lavender-800/40">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-lavender-500/20 text-lavender-300 border border-lavender-400/30">
            <HelpCircle className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-lavender-300">
              The #1 Big Question
            </span>
            <h3 className="text-xl font-bold text-white">
              "Why can't a hospital just delete the patient's name tag?"
            </h3>
          </div>
        </div>

        <p className="text-sm text-slate-200 leading-relaxed max-w-3xl">
          When people think about medical scans, they often assume a doctor's computer can just backspace the name out of the file. In medical imaging, patient identity is embedded in three separate layers that simple tools miss:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="text-xs font-bold text-lavender-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-lavender-400" />
              1. Burned-In Text
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Scanner hardware often burns the patient's name and hospital initials directly into the picture pixels, like a permanent watermark. Deleting metadata tags leaves this text 100% visible.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="text-xs font-bold text-teal-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400" />
              2. Private Vendor Tags
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Scanner manufacturers (Siemens, GE, Philips) store proprietary calibration records in odd-numbered tags. These often contain full patient names and billing notes in hidden data structures.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              3. Optical Barcodes & QR
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Modern digital X-rays stamp barcodes and QR codes containing the patient's social security number and insurance codes directly on the corner of the scan.
            </p>
          </div>
        </div>
      </div>

      {/* Dictionary Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[#2e1065] dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-lavender-600" />
          <span>Core Concepts & Plain-English Glossary</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {terms.map((t, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-lavender-200 dark:border-navy-800 shadow-sm space-y-3"
            >
              <h4 className="text-sm font-bold text-[#2e1065] dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-lavender-500" />
                {t.term}
              </h4>

              <div className="space-y-2 text-xs leading-relaxed">
                <p className="text-lavender-950 dark:text-slate-300">
                  <strong className="text-[#2e1065] dark:text-white">In plain English: </strong>
                  {t.plain_english}
                </p>
                <p className="text-lavender-800/80 dark:text-slate-400 pt-1 border-t border-lavender-100 dark:border-navy-800">
                  <strong className="text-lavender-700 dark:text-lavender-400">Why it matters: </strong>
                  {t.why_it_matters}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
