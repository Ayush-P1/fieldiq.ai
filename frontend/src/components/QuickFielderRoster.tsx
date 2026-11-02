import React from 'react';
import type { Fielder } from '../types/field';
import { Users, Move, ShieldAlert, Award } from 'lucide-react';

interface QuickFielderRosterProps {
  fielders: Fielder[];
  isLocked: boolean;
  onSelectFielder?: (id: string) => void;
  selectedId?: string | null;
}

export default function QuickFielderRoster({ fielders, isLocked, onSelectFielder, selectedId }: QuickFielderRosterProps) {
  return (
    <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-green-400" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Field Roster & Positions</h3>
        </div>
        <span className="text-[11px] font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700/60">
          9/9 Active
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {fielders.map((f) => {
          const isSelected = selectedId === f.id;
          return (
            <button
              key={f.id}
              onClick={() => onSelectFielder && onSelectFielder(f.id)}
              disabled={isLocked}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left transition-all ${
                isSelected
                  ? 'bg-green-950/60 border-green-500/80 shadow-md shadow-green-950/30 ring-1 ring-green-500/40'
                  : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/50 text-slate-300'
              } ${isLocked ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:border-slate-600'}`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] flex-shrink-0 ${
                isSelected ? 'bg-green-500 text-slate-950' : 'bg-slate-700 text-green-400'
              }`}>
                {f.id.replace('f', '')}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-slate-200 truncate leading-tight">
                  {f.name}
                </p>
                <p className="text-[9px] text-slate-500">
                  {f.isUser ? 'Manual' : 'Preset'}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1 text-slate-400">
          <Move size={11} className="text-slate-500" />
          Drag markers on the ground directly
        </span>
        <span className="text-[10px] text-slate-500">
          Bowler & Keeper are fixed
        </span>
      </div>
    </div>
  );
}

