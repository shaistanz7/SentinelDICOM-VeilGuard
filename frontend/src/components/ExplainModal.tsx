import React from 'react';
import { X, Sparkles, ShieldCheck, HeartHandshake, FileCheck } from 'lucide-react';

interface ExplainModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  plainSummary: string;
  patientImpact?: string;
  hospitalCompliance?: string;
}

export const ExplainModal: React.FC<ExplainModalProps> = ({
  isOpen,
  onClose,
  title,
  plainSummary,
  patientImpact,
  hospitalCompliance,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white dark:bg-navy-900 border border-lavender-200 dark:border-navy-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-lavender-100 dark:hover:bg-navy-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-lavender-100 dark:bg-navy-800 text-lavender-700 dark:text-lavender-300">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-lavender-600 dark:text-lavender-400">
              Plain English Guide
            </span>
            <h3 className="text-lg font-bold text-[#2e1065] dark:text-white leading-tight">
              {title}
            </h3>
          </div>
        </div>

        <div className="space-y-4 text-sm text-lavender-900/90 dark:text-slate-300 leading-relaxed">
          <div className="p-3.5 bg-lavender-50/60 dark:bg-navy-850 rounded-xl border border-lavender-100 dark:border-navy-800">
            <h4 className="font-semibold text-[#2e1065] dark:text-white mb-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-lavender-600" />
              What happened here?
            </h4>
            <p>{plainSummary}</p>
          </div>

          {patientImpact && (
            <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
              <h4 className="font-semibold text-emerald-900 dark:text-emerald-300 mb-1 flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                For the Patient
              </h4>
              <p className="text-emerald-800 dark:text-emerald-200/80">{patientImpact}</p>
            </div>
          )}

          {hospitalCompliance && (
            <div className="p-3.5 bg-lavender-100/40 dark:bg-navy-800/60 rounded-xl border border-lavender-200 dark:border-navy-700">
              <h4 className="font-semibold text-lavender-950 dark:text-slate-200 mb-1 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-lavender-600 dark:text-lavender-400" />
                For Hospital Compliance & Radiologists
              </h4>
              <p className="text-lavender-900/90 dark:text-slate-300">{hospitalCompliance}</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-lavender-600 hover:bg-lavender-700 text-white font-medium text-sm rounded-xl shadow-sm transition"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};
