import React from 'react';
import type { Scenario } from '../types/field';
import { Target, Zap, Shield, Info, Activity, Flame, Clock } from 'lucide-react';

interface MatchScenarioPanelProps {
  scenario: Scenario;
  scenarios: Scenario[];
  onScenarioChange: (id: string) => void;
}

export default function MatchScenarioPanel({ scenario, scenarios, onScenarioChange }: MatchScenarioPanelProps) {
  const formatBadgeColor = (format: string) => {
    switch (format) {
      case 'T20': return 'bg-red-900/60 text-red-300 border-red-800/80 shadow-red-950/20';
      case 'ODI': return 'bg-blue-900/60 text-blue-300 border-blue-800/80 shadow-blue-950/20';
      case 'Test': return 'bg-amber-900/60 text-amber-300 border-amber-800/80 shadow-amber-950/20';
      default: return 'bg-slate-700 text-slate-300';
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm panel-fade">
      {/* Header with scenario tabs */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-center">
            <Target size={16} className="text-green-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">Match Situation</h2>
            <p className="text-[11px] text-slate-400">Select simulated scenario</p>
          </div>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2.5 py-1 rounded-full">
          Simulation
        </span>
      </div>

      {/* Scenario selector tabs */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {scenarios.map(s => {
          const isActive = scenario.id === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onScenarioChange(s.id)}
              className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition-all text-center border ${
                isActive
                  ? 'bg-gradient-to-b from-green-600 to-green-700 text-white border-green-500/80 shadow-lg shadow-green-950/40 ring-1 ring-green-400/30'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-slate-700/60'
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Match info grid */}
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <div className="bg-slate-800/40 border border-slate-800/80 rounded-xl p-3">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">Match</p>
          <p className="text-xs font-bold text-slate-100 truncate">{scenario.match}</p>
        </div>
        <div className="bg-slate-800/40 border border-slate-800/80 rounded-xl p-3 flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">Format</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${formatBadgeColor(scenario.format)}`}>
              {scenario.format}
            </span>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">Innings</p>
            <p className="text-xs font-semibold text-slate-200">{scenario.innings}</p>
          </div>
        </div>

        <div className="bg-slate-800/40 border border-slate-800/80 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Clock size={11} className="text-slate-400" />
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Score & Overs</p>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-white">{scenario.score}</span>
            <span className="text-xs font-medium text-slate-400">{scenario.overs} ov</span>
          </div>
        </div>
        <div className="bg-slate-800/40 border border-slate-800/80 rounded-xl p-3">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">Context</p>
          <p className="text-xs text-slate-300 font-medium line-clamp-2 leading-snug">{scenario.situation}</p>
        </div>
      </div>

      {/* Players */}
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3 flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-green-500/15 border border-green-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs">🏏</span>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Batter at Crease</p>
            <p className="text-xs font-semibold text-slate-100 truncate">{scenario.batter}</p>
            <p className="text-[10px] text-green-400/90 font-medium">
              {scenario.batterHand === 'left' ? 'Left-Handed' : 'Right-Handed'}
            </p>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3 flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs">⚡</span>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Active Bowler</p>
            <p className="text-xs font-semibold text-slate-100 truncate">{scenario.bowler}</p>
            <p className="text-[10px] text-blue-400/90 font-medium capitalize">
              {scenario.bowlerType.replace(/-/g, ' ')}
            </p>
          </div>
        </div>
      </div>

      {/* Batter tendency */}
      <div className="bg-amber-950/30 border border-amber-900/50 rounded-xl p-3 mb-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <Flame size={13} className="text-amber-400" />
          <p className="text-xs font-bold text-amber-300">Batter Tendency & Weaknesses</p>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">{scenario.batterTendency}</p>
      </div>

      {/* Recent form */}
      <div className="bg-slate-800/40 border border-slate-800/80 rounded-xl p-3 mb-3">
        <div className="flex items-center gap-1.5 mb-1">
          <Shield size={13} className="text-blue-400" />
          <p className="text-xs font-bold text-blue-300">Form & Striking Momentum</p>
        </div>
        <p className="text-xs text-slate-300">{scenario.recentPerformance}</p>
      </div>

      {/* Shot distribution preview */}
      <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-3">
        <p className="text-[11px] font-bold text-slate-400 mb-2.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Activity size={12} className="text-green-400" />
            Simulated Shot Frequency Matrix
          </span>
          <span className="text-[10px] font-normal text-slate-500">Prob. %</span>
        </p>
        <div className="space-y-2">
          {scenario.shotZones.slice(0, 5).map((zone, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-slate-300 w-32 truncate">{zone.name}</span>
              <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${zone.isBoundary ? 'bg-amber-500' : 'bg-blue-500'}`}
                  style={{ width: `${zone.probability * 100}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-slate-400 w-8 text-right">
                {(zone.probability * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
