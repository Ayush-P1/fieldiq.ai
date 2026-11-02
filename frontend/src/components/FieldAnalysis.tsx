import React from 'react';
import type { EvaluationResult } from '../types/field';
import { getScoreColor, getScoreBarColor } from '../utils/evaluationEngine';
import { AlertTriangle, CheckCircle2, TrendingUp, Map, ShieldCheck, Gauge } from 'lucide-react';

interface FieldAnalysisProps {
  evaluation: EvaluationResult;
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
  prevScore?: number;
}

interface ScoreBarProps {
  label: string;
  value: number;
}

function ScoreBar({ label, value }: ScoreBarProps) {
  const barColor = getScoreBarColor(value);
  return (
    <div className="bg-slate-800/40 border border-slate-800/80 rounded-xl p-2.5">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-medium text-slate-300">{label}</span>
        <span className={`text-xs font-bold font-mono ${getScoreColor(value)}`}>
          {value}<span className="text-[10px] text-slate-500 font-normal">/100</span>
        </span>
      </div>
      <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full score-bar ${barColor}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export default function FieldAnalysis({ evaluation, showHeatmap, onToggleHeatmap, prevScore }: FieldAnalysisProps) {
  const scoreDiff = prevScore !== undefined ? evaluation.overallScore - prevScore : null;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm panel-fade">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center justify-center">
            <TrendingUp size={16} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">Live Field Metrics</h2>
            <p className="text-[11px] text-slate-400">Real-time coverage & analytics</p>
          </div>
        </div>
        <button
          onClick={onToggleHeatmap}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
            showHeatmap
              ? 'bg-blue-600/25 text-blue-300 border-blue-500/60 shadow-lg shadow-blue-950/40'
              : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-slate-700/60'
          }`}
        >
          <Map size={12} />
          {showHeatmap ? 'Heatmap: ON' : 'Heatmap: OFF'}
        </button>
      </div>

      {/* Overall score card with tactical gauge */}
      <div className="bg-gradient-to-b from-slate-800/50 to-slate-900/80 rounded-2xl p-4 mb-4 text-center border border-slate-800/90 shadow-inner">
        <div className="flex items-center justify-center gap-1.5 mb-1 text-slate-400">
          <Gauge size={13} className="text-slate-400" />
          <p className="text-[11px] font-bold uppercase tracking-wider">Overall Tactical Rating</p>
        </div>
        
        <div className="flex items-center justify-center gap-2 my-1">
          <span className={`text-5xl font-black font-mono tracking-tight ${getScoreColor(evaluation.overallScore)}`}>
            {evaluation.overallScore}
          </span>
          <div className="text-left">
            <span className="text-xl text-slate-500 font-light block leading-none">/100</span>
            {scoreDiff !== null && scoreDiff !== 0 && (
              <span className={`text-xs font-bold block mt-1 ${scoreDiff > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {scoreDiff > 0 ? `▲ +${scoreDiff}` : `▼ ${scoreDiff}`}
              </span>
            )}
          </div>
        </div>

        {/* Qualitative label */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mt-2 border" style={{
          backgroundColor: evaluation.overallScore >= 75 ? 'rgba(34,197,94,0.1)' : evaluation.overallScore >= 50 ? 'rgba(234,179,8,0.1)' : 'rgba(239,68,68,0.1)',
          borderColor: evaluation.overallScore >= 75 ? 'rgba(34,197,94,0.3)' : evaluation.overallScore >= 50 ? 'rgba(234,179,8,0.3)' : 'rgba(239,68,68,0.3)',
          color: evaluation.overallScore >= 75 ? '#4ade80' : evaluation.overallScore >= 50 ? '#facc15' : '#f87171'
        }}>
          <ShieldCheck size={13} />
          {evaluation.overallScore >= 80 ? 'Superior Captaincy'
            : evaluation.overallScore >= 65 ? 'Solid Tactical Setup'
            : evaluation.overallScore >= 50 ? 'Vulnerable Balance'
            : 'Dangerous Gaps Exposed'}
        </div>
      </div>

      {/* Score breakdown in 2x2 grid */}
      <div className="grid grid-cols-2 gap-2 mb-3.5">
        <ScoreBar label="Leg-Side" value={evaluation.legSideCoverage} />
        <ScoreBar label="Off-Side" value={evaluation.offSideCoverage} />
        <ScoreBar label="Boundary" value={evaluation.boundaryProtection} />
        <ScoreBar label="Inner Ring" value={evaluation.innerCircleCoverage} />
      </div>

      {/* Exposed zones alert */}
      {evaluation.exposedZones.length > 0 ? (
        <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-3 mb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle size={13} className="text-red-400 flex-shrink-0" />
            <p className="text-xs font-bold text-red-300">Vulnerable Scoring Channels</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {evaluation.exposedZones.map((zone, i) => (
              <span
                key={i}
                className="text-[11px] font-medium px-2 py-0.5 bg-red-900/40 text-red-200 border border-red-800/60 rounded-md"
              >
                {zone}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-green-950/30 border border-green-900/50 rounded-xl p-3 mb-3 flex items-center gap-2">
          <CheckCircle2 size={14} className="text-green-400" />
          <p className="text-xs font-semibold text-green-300">No major critical scoring zones left unprotected!</p>
        </div>
      )}

      {/* Top Zone coverage details */}
      {evaluation.zoneScores.length > 0 && (
        <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Zone Protection Depth</p>
          <div className="space-y-1.5">
            {evaluation.zoneScores
              .sort((a, b) => b.probability - a.probability)
              .slice(0, 6)
              .map((zs, i) => {
                const pct = Math.round(zs.coverage * 100);
                return (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${zs.coverage >= 0.65 ? 'bg-green-500' : zs.coverage >= 0.35 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                    <span className="text-slate-300 flex-1 truncate">{zs.zoneName}</span>
                    <span className="text-slate-500 font-mono text-[11px]">{(zs.probability * 100).toFixed(0)}%</span>
                    <div className="w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getScoreBarColor(pct)}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={`w-7 text-right font-mono font-bold text-[11px] ${getScoreColor(pct)}`}>{pct}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
