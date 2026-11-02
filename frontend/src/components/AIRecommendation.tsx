import React, { useState } from 'react';
import type { AIAnalysis } from '../types/field';
import { Brain, Lightbulb, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Sparkles, Cpu } from 'lucide-react';

interface AIRecommendationProps {
  analysis: AIAnalysis;
  isLoading: boolean;
  onShowAIField: () => void;
  onApplyAIField: () => void;
  onRestoreField: () => void;
  showAIField: boolean;
  hasOriginalField: boolean;
}

export default function AIRecommendation({
  analysis,
  isLoading,
  onShowAIField,
  onApplyAIField,
  onRestoreField,
  showAIField,
  hasOriginalField,
}: AIRecommendationProps) {
  const [expanded, setExpanded] = useState(true);

  if (isLoading) {
    return (
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <Brain size={16} className="text-purple-400 ai-thinking" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">AI Captain Analysing…</p>
            <p className="text-xs text-slate-500 mt-0.5">Evaluating your tactical decisions</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-3 bg-slate-700/60 rounded animate-pulse" style={{ width: `${70 + i * 10}%` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 panel-fade">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <Brain size={14} className="text-purple-400" />
          </div>
          <h2 className="text-sm font-semibold text-slate-200">AI Captain</h2>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${
            analysis.isLLMGenerated
              ? 'bg-purple-900/40 text-purple-300 border-purple-700/50'
              : 'bg-slate-700/60 text-slate-400 border-slate-600/50'
          }`}>
            {analysis.isLLMGenerated ? (
              <span className="flex items-center gap-1"><Sparkles size={9} />Gemini AI</span>
            ) : (
              <span className="flex items-center gap-1"><Cpu size={9} />Rule-based</span>
            )}
          </span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 text-slate-500 hover:text-slate-300"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && (
        <>
          {/* What you did well */}
          <div className="bg-green-950/30 border border-green-900/40 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <CheckCircle2 size={12} className="text-green-400" />
              <p className="text-xs font-semibold text-green-300">What You Did Well</p>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{analysis.whatYouDidWell}</p>
          </div>

          {/* What you missed */}
          <div className="bg-amber-950/30 border border-amber-900/40 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <AlertTriangle size={12} className="text-amber-400" />
              <p className="text-xs font-semibold text-amber-300">What You Missed</p>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{analysis.whatYouMissed}</p>
          </div>

          {/* Biggest risk */}
          <div className="bg-red-950/30 border border-red-900/40 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <AlertTriangle size={12} className="text-red-400" />
              <p className="text-xs font-semibold text-red-300">Biggest Tactical Risk</p>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{analysis.biggestRisk}</p>
          </div>

          {/* Recommendation */}
          <div className="bg-blue-950/30 border border-blue-900/40 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Lightbulb size={12} className="text-blue-400" />
              <p className="text-xs font-semibold text-blue-300">AI Recommendation</p>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{analysis.recommendation}</p>
          </div>

          {/* Reasoning */}
          <div className="bg-slate-900/40 rounded-lg p-3 mb-4">
            <p className="text-xs text-slate-500 mb-1">Tactical Reasoning</p>
            <p className="text-xs text-slate-400 leading-relaxed italic">{analysis.reasoning}</p>
          </div>
        </>
      )}

      {/* AI Field buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={onShowAIField}
          className={`flex-1 min-w-28 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            showAIField
              ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-600/50'
              : 'bg-slate-700 text-slate-200 hover:bg-slate-600 border border-slate-600'
          }`}
        >
          {showAIField ? '✓ AI Field Shown' : '👁 Show AI\'s Field'}
        </button>
        {!hasOriginalField ? (
          <button
            onClick={onApplyAIField}
            className="flex-1 min-w-28 py-2 px-3 rounded-lg text-xs font-semibold bg-green-600 hover:bg-green-500 text-white transition-all btn-primary"
          >
            Apply AI Field
          </button>
        ) : (
          <button
            onClick={onRestoreField}
            className="flex-1 min-w-28 py-2 px-3 rounded-lg text-xs font-semibold bg-slate-600 hover:bg-slate-500 text-white transition-all"
          >
            ↩ Restore My Field
          </button>
        )}
      </div>
    </div>
  );
}
