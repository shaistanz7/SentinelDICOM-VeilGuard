import React from 'react';
import { Search, Wand2, CheckCircle2, ShieldAlert, Award, Loader2, Crosshair } from 'lucide-react';
import { StageLatencies } from '../types';

interface StageTrackerProps {
  currentStage: 'discover' | 'transform' | 'validate' | 'redteam' | 'reattack' | 'gate' | 'finished';
  progress: number;
  status: string;
  stageLatencies?: StageLatencies;
  totalLatencyMs?: number;
}

export const StageTracker: React.FC<StageTrackerProps> = ({ 
  currentStage, 
  progress, 
  status, 
  stageLatencies,
  totalLatencyMs 
}) => {
  const stages = [
    {
      id: 'discover',
      title: '1. Discover & Classify',
      complexity: 'O(N + W · H)',
      friendlyText: 'Looking for hidden names, private vendor tags, and burned-in text...',
      icon: Search,
    },
    {
      id: 'transform',
      title: '2. Policy Transform',
      complexity: 'O(T + Σ(w·h))',
      friendlyText: 'Applying solid black-box redactions, consistent UIDs, and date shifts...',
      icon: Wand2,
    },
    {
      id: 'validate',
      title: '3. Independent Validation',
      complexity: 'O(N + W · H)',
      friendlyText: 'Auditing output with separate rules to confirm 100% clean metadata & unchanged anatomy...',
      icon: CheckCircle2,
    },
    {
      id: 'redteam',
      title: '4. Adversarial Red Team',
      complexity: 'O(W · H)',
      friendlyText: 'Simulating attacker penetration tests, enhanced OCR filters, and demographic leakage...',
      icon: ShieldAlert,
    },
    {
      id: 'reattack',
      title: '5. ReAttackLab Self-Check',
      complexity: 'O(W · H + N)',
      friendlyText: 'Autonomous 5-vector adversarial self-check & self-healing verification...',
      icon: Crosshair,
    },
    {
      id: 'gate',
      title: '6. Fail-Closed Release Gate',
      complexity: 'O(1)',
      friendlyText: 'Calculating final clearance: Approved for download, Human Review, or locked Quarantine...',
      icon: Award,
    },
  ];

  const getStageStatus = (stageId: string, index: number) => {
    const stageOrder = ['discover', 'transform', 'validate', 'redteam', 'reattack', 'gate', 'finished'];
    const currentIdx = stageOrder.indexOf(currentStage);

    if (currentStage === 'finished') return 'completed';
    if (currentIdx > index) return 'completed';
    if (currentIdx === index) return 'active';
    return 'pending';
  };

  return (
    <div className="w-full bg-white dark:bg-navy-900 border border-lavender-200 dark:border-navy-800 rounded-2xl p-6 shadow-sm">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-lavender-800/80 dark:text-slate-400 mb-2">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-lavender-500 animate-pulse" />
            Core 5-Stage Verification Pipeline
          </span>
          <div className="flex items-center gap-3">
            {totalLatencyMs !== undefined && totalLatencyMs > 0 && (
              <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60 text-[11px] normal-case">
                ⏱️ Latency: <strong>{totalLatencyMs.toFixed(1)} ms</strong>
              </span>
            )}
            <span className="font-mono text-lavender-700 dark:text-lavender-300 font-bold">{progress}% Complete</span>
          </div>
        </div>
        <div className="w-full h-2.5 bg-lavender-100 dark:bg-navy-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-lavender-500 via-purple-500 to-indigo-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 5 Stages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const stageStatus = getStageStatus(stage.id, idx);
          const stageTime = stageLatencies ? (stageLatencies as any)[stage.id] : undefined;

          return (
            <div
              key={stage.id}
              className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                stageStatus === 'active'
                  ? 'bg-lavender-50/90 dark:bg-lavender-950/40 border-lavender-400 dark:border-lavender-600 shadow-sm shadow-lavender-500/10'
                  : stageStatus === 'completed'
                  ? 'bg-slate-50/60 dark:bg-navy-850/60 border-emerald-200 dark:border-emerald-900/60'
                  : 'bg-white dark:bg-navy-900 border-lavender-100 dark:border-navy-800 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div
                    className={`p-2 rounded-lg flex-shrink-0 ${
                      stageStatus === 'active'
                        ? 'bg-lavender-600 text-white animate-pulse'
                        : stageStatus === 'completed'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-lavender-100 dark:bg-navy-800 text-lavender-700 dark:text-slate-500'
                    }`}
                  >
                    {stageStatus === 'active' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#2e1065] dark:text-white leading-tight">
                      {stage.title}
                    </h4>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {stageStatus === 'active' ? 'Running' : stageStatus === 'completed' ? 'Passed' : 'Queued'}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug mb-3">
                  {stage.friendlyText}
                </p>
              </div>

              {/* Latency & Complexity Footer Badge */}
              <div className="pt-2 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-[10px] font-mono">
                <span className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200/60 dark:border-purple-900/60">
                  {stage.complexity}
                </span>
                {stageTime !== undefined ? (
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                    ⏱️ {stageTime.toFixed(1)} ms
                  </span>
                ) : (
                  <span className="text-slate-400">--</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
