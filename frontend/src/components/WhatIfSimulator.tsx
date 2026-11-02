import React from 'react';
import type { EvaluationResult } from '../types/field';
import { getScoreColor } from '../utils/evaluationEngine';
import { FlaskConical, RotateCcw, History } from 'lucide-react';

interface WhatIfSimulatorProps {
  originalScore: EvaluationResult | null;
  currentScore: EvaluationResult;
  onRestoreOriginal: () => void;
  hasOriginal: boolean;
}

export default function WhatIfSimulator({
  originalScore,
  currentScore,
  onRestoreOriginal,
  hasOriginal,
}: WhatIfSimulatorProps) {
  const improvement = originalScore
    ? currentScore.overallScore - originalScore.overallScore
    : 0;

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 panel-fade">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-cyan-500/20 rounded-lg flex items-center justify-center">
            <FlaskConical size={14} className="text-cyan-400" />
          </div>
          <h2 className="text-sm font-semibold text-slate-200">What-If Simulator</h2>
        </div>
        {hasOriginal && (
          <button
            onClick={onRestoreOriginal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-700/60 hover:bg-slate-600/60 text-slate-300 text-xs rounded-lg transition-colors"
          >
            <RotateCcw size={11} />
            Restore Original
          </button>
        )}
      </div>

      <p className="text-xs text-slate-400 mb-4 leading-relaxed">
        Drag fielders on the ground to experiment with placements. Scores update in real-time as you move fielders.
      </p>

      {/* Score comparison */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Current score */}
        <div className="bg-slate-900/60 rounded-lg p-3 text-center border border-slate-700/30">
          <p className="text-xs text-slate-500 mb-1">Current Score</p>
          <p className={`text-2xl font-black ${getScoreColor(currentScore.overallScore)}`}>
            {currentScore.overallScore}
          </p>
          <p className="text-xs text-slate-500">/100</p>
        </div>

        {/* Original or improvement */}
        {originalScore ? (
          <div className="bg-slate-900/60 rounded-lg p-3 text-center border border-slate-700/30">
            <div className="flex items-center justify-center gap-1 mb-1">
              <History size={10} className="text-slate-500" />
              <p className="text-xs text-slate-500">Original Score</p>
            </div>
            <p className="text-2xl font-black text-slate-400">
              {originalScore.overallScore}
            </p>
            <p className="text-xs text-slate-500">/100</p>
          </div>
        ) : (
          <div className="bg-slate-900/60 rounded-lg p-3 text-center border border-slate-700/30">
            <p className="text-xs text-slate-500 mb-1">Improvement</p>
            <p className="text-2xl font-black text-slate-500">—</p>
            <p className="text-xs text-slate-500">Move a fielder to track</p>
          </div>
        )}
      </div>

      {/* Improvement banner */}
      {hasOriginal && (
        <div className={`rounded-lg p-3 mb-4 text-center border ${
          improvement > 0
            ? 'bg-green-950/30 border-green-900/40'
            : improvement < 0
            ? 'bg-red-950/30 border-red-900/40'
            : 'bg-slate-700/30 border-slate-600/30'
        }`}>
          <p className={`text-sm font-bold ${
            improvement > 0 ? 'text-green-400' : improvement < 0 ? 'text-red-400' : 'text-slate-400'
          }`}>
            {improvement > 0
              ? `▲ Score improved by ${improvement} points`
              : improvement < 0
              ? `▼ Score dropped by ${Math.abs(improvement)} points`
              : 'No change from original'}
          </p>
          {improvement !== 0 && (
            <p className="text-xs text-slate-400 mt-0.5">
              {improvement > 0
                ? 'Great adjustment! Your field is improving.'
                : 'Consider reverting this change.'}
            </p>
          )}
        </div>
      )}

      {/* Metric changes */}
      {originalScore && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">Metric Changes</p>
          {[
            { label: 'Leg-Side', orig: originalScore.legSideCoverage, curr: currentScore.legSideCoverage },
            { label: 'Off-Side', orig: originalScore.offSideCoverage, curr: currentScore.offSideCoverage },
            { label: 'Boundary', orig: originalScore.boundaryProtection, curr: currentScore.boundaryProtection },
            { label: 'Inner Circle', orig: originalScore.innerCircleCoverage, curr: currentScore.innerCircleCoverage },
          ].map(({ label, orig, curr }) => {
            const diff = curr - orig;
            return (
              <div key={label} className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 w-20">{label}</span>
                <span className="text-slate-500">{orig}</span>
                <span className="text-slate-600">→</span>
                <span className={getScoreColor(curr)}>{curr}</span>
                {diff !== 0 && (
                  <span className={`ml-auto font-semibold ${diff > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {diff > 0 ? `+${diff}` : diff}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 bg-slate-900/40 rounded-lg p-3">
        <p className="text-xs text-slate-500 font-medium mb-1.5">How to use</p>
        <ul className="text-xs text-slate-400 space-y-1">
          <li>• Drag any fielder (numbered circles) to reposition</li>
          <li>• Scores update automatically after each move</li>
          <li>• Click "Analyse My Field" for full AI evaluation</li>
          <li>• Use "Apply AI Field" to try the AI's arrangement</li>
        </ul>
      </div>
    </div>
  );
}
