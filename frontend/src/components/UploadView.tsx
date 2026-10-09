import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Check, 
  FolderUp, 
  Sparkles,
  Lock,
  ArrowRight
} from 'lucide-react';
import { Policy, SampleScan } from '../types';
import { Tooltip } from './Tooltip';

interface UploadViewProps {
  policies: Policy[];
  selectedPolicy: string;
  onSelectPolicy: (policyName: string) => void;
  onUploadFile: (file: File) => void;
  onRunSample: (sampleId: string) => void;
  samples: SampleScan[];
  isUploading: boolean;
}

export const UploadView: React.FC<UploadViewProps> = ({
  policies,
  selectedPolicy,
  onSelectPolicy,
  onUploadFile,
  onRunSample,
  samples,
  isUploading,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleStartProcess = () => {
    if (selectedFile) {
      onUploadFile(selectedFile);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Privacy Guarantee Banner */}
      <div className="p-4 rounded-2xl bg-lavender-50 dark:bg-lavender-950/40 border border-lavender-200 dark:border-lavender-800/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-lavender-600 text-white shadow-sm">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#2e1065] dark:text-lavender-200 uppercase tracking-wider">
              Privacy Guarantee
            </h4>
            <p className="text-xs text-lavender-900/80 dark:text-lavender-300">
              Your files never leave this computer. All AI OCR and de-identification processing runs strictly on local CPU/GPU memory.
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-lavender-100 dark:bg-lavender-900/60 text-lavender-900 dark:text-lavender-200">
          LOCAL AIR-GAPPED
        </span>
      </div>

      {/* Step 1: Policy Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#2e1065] dark:text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-lavender-600 text-white text-xs flex items-center justify-center font-bold">1</span>
              Choose De-Identification Policy
            </h2>
            <p className="text-xs text-lavender-800/80 dark:text-slate-400">
              Select the redaction rules that match your intended use case.
            </p>
          </div>
          <Tooltip 
            term="De-identification Policy" 
            explanation="A formal set of instructions governing how patient names, dates, private scanner tags, and pixel annotations are sanitized according to standards like HIPAA or GDPR." 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {policies.map((p) => {
            const isSelected = selectedPolicy === p.name || selectedPolicy === p.id;
            return (
              <div
                key={p.id}
                onClick={() => onSelectPolicy(p.name)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-lavender-50 dark:bg-lavender-950/50 border-lavender-500 shadow-sm ring-1 ring-lavender-500'
                    : 'bg-white dark:bg-navy-900 border-lavender-200 dark:border-navy-800 hover:border-lavender-400 dark:hover:border-navy-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-[#2e1065] dark:text-white">
                    {p.name}
                  </h3>
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                      isSelected
                        ? 'bg-lavender-600 border-lavender-600 text-white'
                        : 'border-lavender-300 dark:border-navy-700'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                  {p.description}
                </p>

                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-lavender-700 dark:text-lavender-400">
                    {p.date_shift_days === 0 ? 'Dates: Removed / Kept Year' : `Dates: Shifted (+${p.date_shift_days}d)`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 2: Upload Target Scan */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-[#2e1065] dark:text-white flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-lavender-600 text-white text-xs flex items-center justify-center font-bold">2</span>
          Upload Medical Scans (.dcm or folder)
        </h2>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-lavender-500 bg-lavender-50/60 dark:bg-lavender-950/30'
              : selectedFile
              ? 'border-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/10'
              : 'border-lavender-300 dark:border-navy-800 hover:border-lavender-500 bg-white dark:bg-navy-900'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".dcm,application/dicom"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-2xl bg-lavender-100 dark:bg-lavender-950 text-lavender-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
            {selectedFile ? <FileText className="w-6 h-6 text-emerald-600" /> : <Upload className="w-6 h-6" />}
          </div>

          {selectedFile ? (
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider font-bold text-emerald-600">Selected File</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
              <p className="text-xs text-slate-400">Click to pick a different file</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-[#2e1065] dark:text-slate-200">
                Drag and drop your DICOM file here, or click to browse
              </p>
              <p className="text-xs text-lavender-800/80 dark:text-slate-400">
                Supports standard DICOM files (CT, MR, CR, DX, US, NM, XA)
              </p>
            </div>
          )}
        </div>

        {selectedFile && (
          <div className="flex justify-end pt-2">
            <button
              disabled={isUploading}
              onClick={handleStartProcess}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-lavender-600 hover:bg-lavender-700 text-white font-semibold text-sm shadow-md shadow-lavender-600/25 transition hover:scale-[1.02]"
            >
              <span>Launch 5-Stage Release Pipeline</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Alternative Option: Or Pick a Synthetic Demo Case */}
      <div className="pt-6 border-t border-lavender-200 dark:border-navy-800 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-lavender-600 dark:text-lavender-400" />
          <h3 className="text-sm font-bold text-[#2e1065] dark:text-slate-200">
            Or test instantly with pre-loaded synthetic scans:
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {samples.map((s) => (
            <button
              key={s.id}
              disabled={isUploading}
              onClick={() => onRunSample(s.id)}
              className="p-3 rounded-xl border border-lavender-200 dark:border-navy-800 bg-white dark:bg-navy-900 hover:border-lavender-500 text-left transition group shadow-sm"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-lavender-100 dark:bg-navy-800 font-mono text-lavender-900 dark:text-slate-300">
                  {s.modality}
                </span>
                <span className="text-[10px] text-slate-400 group-hover:text-lavender-600 flex items-center gap-1 font-semibold">
                  Run <ArrowRight className="w-3 h-3" />
                </span>
              </div>
              <h4 className="text-xs font-bold text-[#2e1065] dark:text-white line-clamp-1">
                {s.name}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                {s.risk_type}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
