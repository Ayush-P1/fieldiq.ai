import React from 'react';
import type { EvaluationResult } from '../types/field';
import { getScoreColor, getScoreBarColor } from '../utils/evaluationEngine';
import { Swords } from 'lucide-react';

interface FieldComparisonProps {
  userEval: EvaluationResult;
  aiEval: EvaluationResult;
  comparisonSummary: string;
}

interface CompareRowProps {
  label: string;
  userVal: number;
  aiVal: number;
}

function CompareRow({ label, userVal, aiVal }: CompareRowProps) {
  const diff = userVal - aiVal;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className={`font-bold ${getScoreColor(userVal)}`}>{userVal}</span>
        <span className="text-slate-400">{label}</span>
        <span className={`font-bold ${getScoreColor(aiVal)}`}>{aiVal}</span>
      </div>
      <div className="flex gap-1 h-2">
        {/* User bar (left, fills right-to-left) */}
        <div className="flex-1 bg-slate-700/60 rounded-l-full overflow-hidden flex justify-end">
          <div
            className={`h-full rounded-l-full score-bar ${getScoreBarColor(userVal)}`}
            style={{ width: `${userVal}%` }}
          />
        </div>
        {/* Divider */}
        <div className="w-0.5 bg-slate-500" />
        {/* AI bar (right, fills left-to-right) */}
        <div className="flex-1 bg-slate-700/60 rounded-r-full overflow-hidden">
          <div
            className={`h-full rounded-r-full score-bar bg-yellow-500`}
            style={{ width: `${aiVal}%` }}
          />
        </div>
      </div>
      {Math.abs(diff) > 5 && (
        <p className="text-right text-xs mt-0.5" style={{ color: diff > 0 ? '#4ade80' : '#f87171' }}>
          {diff > 0 ? `You +${diff}` : `AI +${Math.abs(diff)}`}
        </p>
      )}
    </div>
  );
}

export default function FieldComparison({ userEval, aiEval, comparisonSummary }: FieldComparisonProps) {
  const scoreDiff = userEval.overallScore - aiEval.overallScore;

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 panel-fade">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 bg-red-500/20 rounded-lg flex items-center justify-center">
          <Swords size={14} className="text-red-400" />
        </div>
        <h2 className="text-sm font-semibold text-slate-200">Field Battle</h2>
      </div>

      {/* Big score comparison */}
      <div className="bg-slate-900/60 rounded-xl p-4 mb-4 border border-slate-700/30">
        <div className="grid grid-cols-3 gap-2 items-center">
          {/* User score */}
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">Your Field</p>
            <p className={`text-3xl font-black ${getScoreColor(userEval.overallScore)}`}>
              {userEval.overallScore}
            </p>
            <p className="text-xs text-slate-500">/100</p>
          </div>

          {/* VS */}
          <div className="text-center">
            <p className="text-xl font-black text-slate-500">VS</p>
            <p className={`text-xs font-semibold mt-1 ${scoreDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {scoreDiff > 0 ? `You +${scoreDiff}` : scoreDiff < 0 ? `AI +${Math.abs(scoreDiff)}` : 'Tied!'}
            </p>
          </div>

          {/* AI score */}
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">AI Field</p>
            <p className="text-3xl font-black text-yellow-400">
              {aiEval.overallScore}
            </p>
            <p className="text-xs text-slate-500">/100</p>
          </div>
        </div>
      </div>

      {/* Stat comparison */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-500 mb-2">
          <span className="text-green-300 font-semibold">You</span>
          <span>Metric</span>
          <span className="text-yellow-300 font-semibold">AI</span>
        </div>
        <CompareRow label="Leg-Side" userVal={userEval.legSideCoverage} aiVal={aiEval.legSideCoverage} />
        <CompareRow label="Off-Side" userVal={userEval.offSideCoverage} aiVal={aiEval.offSideCoverage} />
        <CompareRow label="Boundary" userVal={userEval.boundaryProtection} aiVal={aiEval.boundaryProtection} />
        <CompareRow label="Inner Circle" userVal={userEval.innerCircleCoverage} aiVal={aiEval.innerCircleCoverage} />
      </div>

      {/* Exposed zones comparison */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-xs text-slate-500 mb-1.5">Your Exposed Zones</p>
          {userEval.exposedZones.length === 0 ? (
            <p className="text-xs text-green-400">✓ None critical</p>
          ) : (
            <div className="space-y-1">
              {userEval.exposedZones.map((z, i) => (
                <span key={i} className="block text-xs px-2 py-0.5 bg-red-900/30 text-red-300 rounded border border-red-800/30">
                  {z}
                </span>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1.5">AI Exposed Zones</p>
          {aiEval.exposedZones.length === 0 ? (
            <p className="text-xs text-green-400">✓ None critical</p>
          ) : (
            <div className="space-y-1">
              {aiEval.exposedZones.map((z, i) => (
                <span key={i} className="block text-xs px-2 py-0.5 bg-yellow-900/30 text-yellow-300 rounded border border-yellow-800/30">
                  {z}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-slate-900/40 rounded-lg p-3 text-xs text-slate-300 leading-relaxed italic border border-slate-700/30">
        {comparisonSummary}
      </div>
    </div>
  );
}
