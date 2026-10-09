import React, { useState, useEffect } from 'react';
import { JobDetail, DiffItem } from '../types';
import { 
  SplitSquareVertical, 
  Search, 
  Filter, 
  ArrowRight, 
  ShieldCheck, 
  Layers, 
  Lock,
  Eye,
  Download
} from 'lucide-react';

interface BeforeAfterViewProps {
  job: JobDetail;
  isExpertMode: boolean;
}

export const BeforeAfterView: React.FC<BeforeAfterViewProps> = ({ job, isExpertMode }) => {
  const [diffItems, setDiffItems] = useState<DiffItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isLoadingDiff, setIsLoadingDiff] = useState(true);

  useEffect(() => {
    fetch(`/api/jobs/${job.id}/diff`)
      .then((res) => res.json())
      .then((data) => {
        setDiffItems(data);
        setIsLoadingDiff(false);
      })
      .catch(() => {
        setIsLoadingDiff(false);
      });
  }, [job.id]);

  const filteredDiff = diffItems.filter((item) => {
    const matchesSearch = item.tag_keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.original_value.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.processed_value.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 py-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#2e1065] dark:text-white flex items-center gap-2">
          <SplitSquareVertical className="w-5 h-5 text-lavender-600 dark:text-lavender-400" />
          <span>Before / After Release Comparison</span>
        </h2>
        <p className="text-xs text-lavender-800/80 dark:text-slate-400">
          Verify pixel black-box solid masking on the right and inspect header changes in the metadata diff table below.
        </p>
      </div>

      {/* Side-by-Side Synchronized Image Viewer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Original Scan */}
        <div className="bg-white dark:bg-navy-900 border border-lavender-200 dark:border-navy-800 rounded-3xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-lavender-100 dark:border-navy-800">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Original Input Scan (With PHI)
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              SHA: {job.input_hash ? `${job.input_hash.slice(0, 10)}...` : 'calc'}
            </span>
          </div>

          <div className="bg-black rounded-2xl overflow-hidden aspect-square flex items-center justify-center relative">
            <img
              key={`orig-${job.id}-${job.updated_at || ''}`}
              src={`/api/jobs/${job.id}/image/original?t=${encodeURIComponent(job.updated_at || '')}`}
              alt="Original DICOM"
              className="w-full h-full object-contain pointer-events-none"
            />
            <div className="absolute top-3 left-3 bg-rose-950/80 text-rose-200 border border-rose-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
              Raw Input
            </div>
          </div>
        </div>

        {/* Right: De-Identified Output Scan */}
        <div className="bg-white dark:bg-navy-900 border border-lavender-200 dark:border-navy-800 rounded-3xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-lavender-100 dark:border-navy-800">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              De-Identified Output (Masked)
            </span>
            <div className="flex items-center gap-2">
              <a
                href={`/api/jobs/${job.id}/download/image`}
                download={`clean_${job.filename.replace(/\.dcm$/i, '')}.png`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition hover:scale-105"
                title="Download de-identified output image as PNG"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Image</span>
              </a>
              <span className="text-[11px] font-mono text-slate-400">
                SHA: {job.output_hash ? `${job.output_hash.slice(0, 10)}...` : 'calc'}
              </span>
            </div>
          </div>

          <div className="bg-black rounded-2xl overflow-hidden aspect-square flex items-center justify-center relative group">
            <img
              key={`proc-${job.id}-${job.updated_at || ''}`}
              src={`/api/jobs/${job.id}/image/processed?t=${encodeURIComponent(job.updated_at || '')}`}
              alt="De-Identified DICOM"
              className="w-full h-full object-contain pointer-events-none"
            />
            <div className="absolute top-3 left-3 bg-emerald-950/80 text-emerald-200 border border-emerald-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
              Byte-Preserved Masked
            </div>
            <a
              href={`/api/jobs/${job.id}/download/image`}
              download={`clean_${job.filename.replace(/\.dcm$/i, '')}.png`}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-bold shadow-lg backdrop-blur-sm transition hover:scale-105"
            >
              <Download className="w-4 h-4" />
              <span>Download Clean Image (PNG)</span>
            </a>
          </div>
        </div>
      </div>

      {/* Metadata Diff Table */}
      <div className="bg-white dark:bg-navy-900 border border-lavender-200 dark:border-navy-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-lavender-100 dark:border-navy-800">
          <div>
            <h3 className="text-base font-bold text-[#2e1065] dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-lavender-600" />
              <span>DICOM Metadata Attribute Diff Table</span>
            </h3>
            <p className="text-xs text-lavender-800/80 dark:text-slate-400">
              Side-by-side comparison of every header element before and after policy transform.
            </p>
          </div>

          {/* Controls: Search and Status Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search tag or value..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-lavender-50/50 dark:bg-navy-800 border border-lavender-200 dark:border-navy-700 text-[#2e1065] dark:text-white focus:outline-none focus:ring-1 focus:ring-lavender-500 w-44"
              />
            </div>

            <div className="flex items-center gap-1">
              {['ALL', 'REMOVED', 'PSEUDONYMIZED', 'MODIFIED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                    statusFilter === st
                      ? 'bg-lavender-600 text-white shadow-sm shadow-lavender-600/30'
                      : 'bg-lavender-50 dark:bg-navy-800 border border-lavender-200 dark:border-navy-700 text-lavender-900 dark:text-slate-300 hover:bg-lavender-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-lavender-50/80 dark:bg-navy-850 text-lavender-900 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-lavender-200 dark:border-navy-800">
              <tr>
                <th className="py-2.5 px-3">DICOM Keyword</th>
                <th className="py-2.5 px-3">Action Status</th>
                <th className="py-2.5 px-3 text-rose-600 dark:text-rose-400">Original Value</th>
                <th className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400">Processed Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lavender-100 dark:divide-navy-800 font-mono">
              {filteredDiff.length > 0 ? (
                filteredDiff.map((row, idx) => (
                  <tr key={idx} className="hover:bg-lavender-50/40 dark:hover:bg-navy-850/40">
                    <td className="py-2 px-3 font-semibold text-slate-900 dark:text-slate-200">
                      {row.tag_keyword}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.status === 'REMOVED'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : row.status === 'PSEUDONYMIZED'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          : row.status === 'MODIFIED'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-navy-800 dark:text-slate-400'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-rose-600 dark:text-rose-400 truncate max-w-xs" title={row.original_value}>
                      {row.original_value}
                    </td>
                    <td className="py-2 px-3 text-emerald-600 dark:text-emerald-400 truncate max-w-xs font-semibold" title={row.processed_value}>
                      {row.processed_value}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400">
                    {isLoadingDiff ? 'Loading metadata diff...' : 'No attributes matching filter criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
