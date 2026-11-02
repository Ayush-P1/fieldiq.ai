import React from 'react';
import { Lock, Unlock, RotateCcw, Activity, Users } from 'lucide-react';
interface FieldControlsProps {
  fielderCount: number;
  isLocked: boolean;
  hasAnalysis: boolean;
  isAnalysing: boolean;
  onLock: () => void;
  onUnlock: () => void;
  onReset: () => void;
  onAnalyse: () => void;
}

export default function FieldControls({
  fielderCount,
  isLocked,
  hasAnalysis,
  isAnalysing,
  onLock,
  onUnlock,
  onReset,
  onAnalyse,
}: FieldControlsProps) {
  return (
    <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap">
      {/* Fielder count */}
      <div className="flex items-center gap-1.5">
        <Users size={13} className="text-green-400" />
        <span className="text-xs font-semibold text-slate-200">
          {fielderCount}/9
        </span>
        <span className="text-xs text-slate-500">Fielders</span>
      </div>

      {/* Status pill */}
      <div className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
        isLocked
          ? 'bg-amber-900/30 text-amber-300 border-amber-700/40'
          : 'bg-green-900/30 text-green-300 border-green-700/40'
      }`}>
        {isLocked ? '🔒 Locked' : '✏️ Editing'}
      </div>

      <div className="flex-1" />

      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* Reset */}
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/60 hover:bg-slate-600/60 text-slate-300 text-xs rounded-lg transition-colors"
        >
          <RotateCcw size={12} />
          Reset
        </button>

        {/* Lock / Unlock */}
        {!isLocked ? (
          <button
            onClick={onLock}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 text-xs rounded-lg transition-colors border border-amber-700/40"
          >
            <Lock size={12} />
            Lock Field
          </button>
        ) : (
          <button
            onClick={onUnlock}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-600/30 hover:bg-slate-500/40 text-slate-300 text-xs rounded-lg transition-colors"
          >
            <Unlock size={12} />
            Unlock
          </button>
        )}

        {/* Analyse */}
        <button
          onClick={onAnalyse}
          disabled={isAnalysing}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 hover:bg-green-500 disabled:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-all btn-primary disabled:cursor-not-allowed"
        >
          <Activity size={12} className={isAnalysing ? 'ai-thinking' : ''} />
          {isAnalysing ? 'Analysing…' : hasAnalysis ? 'Re-Analyse' : 'Analyse My Field'}
        </button>
      </div>
    </div>
  );
}
