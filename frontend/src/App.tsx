import React, { useState, useCallback, useEffect } from 'react';
import type { Fielder, Scenario, EvaluationResult, AIAnalysis } from './types/field';
import { SCENARIOS, DEFAULT_SCENARIO, DEFAULT_FIELDER_POSITIONS } from './data/scenarios';
import { evaluateField } from './utils/evaluationEngine';
import { analyseField, localFallbackAnalysis } from './services/api';
import CricketGround from './components/CricketGround';
import MatchScenarioPanel from './components/MatchScenarioPanel';
import FieldControls from './components/FieldControls';
import FieldAnalysis from './components/FieldAnalysis';
import AIRecommendation from './components/AIRecommendation';
import FieldComparison from './components/FieldComparison';
import WhatIfSimulator from './components/WhatIfSimulator';
import CaptainChat from './components/CaptainChat';
import QuickFielderRoster from './components/QuickFielderRoster';
import ScenarioTacticalGuide from './components/ScenarioTacticalGuide';
import { Target, RefreshCw, Sparkles, Brain, Trophy, Shield, Compass, Swords } from 'lucide-react';

function makeFieldersFromScenario(_scenario: Scenario): Fielder[] {
  return DEFAULT_FIELDER_POSITIONS.map((f) => ({
    ...f,
    isUser: true,
  }));
}

function makeAIFielders(scenario: Scenario): Fielder[] {
  return scenario.aiField.map((pos, i) => ({
    id: `ai-${i + 1}`,
    name: pos.positionName,
    x: pos.x,
    y: pos.y,
    isUser: false,
  }));
}

function generateComparisonSummary(userEval: EvaluationResult, aiEval: EvaluationResult, scenario: Scenario): string {
  const userScore = userEval.overallScore;
  const aiScore = aiEval.overallScore;
  const diff = userScore - aiScore;

  if (diff >= 0) {
    return `Masterclass! Your field placement achieves ${userScore}/100, outperforming the AI benchmark (${aiScore}/100). You've covered ${
      userEval.legSideCoverage > userEval.offSideCoverage ? 'the leg side' : 'the off side'
    } with disciplined precision.`;
  }

  const legDiff = userEval.legSideCoverage - aiEval.legSideCoverage;
  const offDiff = userEval.offSideCoverage - aiEval.offSideCoverage;

  let focusArea = '';
  if (legDiff < offDiff) {
    focusArea = `Your leg-side coverage is ${Math.abs(legDiff)} points below optimal — the batter's highest-percentage scoring zone.`;
  } else {
    focusArea = `Off-side boundary protection is ${Math.abs(offDiff)} points behind the AI setup. Consider repositioning toward deep cover or point.`;
  }

  return `Your field scores ${userScore}/100 vs AI's ${aiScore}/100 (gap: ${Math.abs(diff)} points). ${focusArea} The AI prioritizes ${scenario.aiField[0]?.positionName} and ${scenario.aiField[1]?.positionName}.`;
}

export default function App() {
  const [scenario, setScenario] = useState<Scenario>(DEFAULT_SCENARIO);
  const [fielders, setFielders] = useState<Fielder[]>(makeFieldersFromScenario(DEFAULT_SCENARIO));
  const [currentAIFielders, setCurrentAIFielders] = useState<Fielder[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showAIField, setShowAIField] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [aiEvaluation, setAIEvaluation] = useState<EvaluationResult | null>(null);
  const [aiAnalysis, setAIAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [originalFielders, setOriginalFielders] = useState<Fielder[] | null>(null);
  const [originalEval, setOriginalEval] = useState<EvaluationResult | null>(null);
  const [isAIFieldApplied, setIsAIFieldApplied] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState<'metrics' | 'battle' | 'whatif' | 'chat'>('metrics');
  const [selectedFielderId, setSelectedFielderId] = useState<string | null>(null);

  // Live evaluation — recalculates whenever fielders move
  useEffect(() => {
    const result = evaluateField(fielders, scenario.shotZones, scenario.batterHand);
    setEvaluation(result);
  }, [fielders, scenario]);

  // Scenario change
  const handleScenarioChange = useCallback((id: string) => {
    const newScenario = SCENARIOS.find(s => s.id === id);
    if (!newScenario) return;
    setScenario(newScenario);
    setFielders(makeFieldersFromScenario(newScenario));
    setCurrentAIFielders(makeAIFielders(newScenario));
    setIsLocked(false);
    setShowAIField(false);
    setShowHeatmap(false);
    setHasAnalysis(false);
    setAIAnalysis(null);
    setAIEvaluation(null);
    setOriginalFielders(null);
    setOriginalEval(null);
    setIsAIFieldApplied(false);
    setSelectedFielderId(null);
  }, []);

  // Init AI fielders on mount
  useEffect(() => {
    setCurrentAIFielders(makeAIFielders(DEFAULT_SCENARIO));
  }, []);

  const handleScenarioChangeWithAIReset = useCallback((id: string) => {
    handleScenarioChange(id);
    const newS = SCENARIOS.find(s => s.id === id);
    if (newS) setCurrentAIFielders(makeAIFielders(newS));
  }, [handleScenarioChange]);

  // Full analysis
  const handleAnalyse = useCallback(async () => {
    if (!evaluation) return;
    setIsAnalysing(true);
    setHasAnalysis(true);
    setShowHeatmap(true);

    try {
      // Compute AI field evaluation
      const aiField = makeAIFielders(scenario);
      const aiEval = evaluateField(aiField, scenario.shotZones, scenario.batterHand);
      setAIEvaluation(aiEval);
      setCurrentAIFielders(aiField);

      // Get AI analysis
      const analysis = await analyseField(scenario, fielders, evaluation);
      analysis.aiScore = aiEval.overallScore;
      analysis.userScore = evaluation.overallScore;
      setAIAnalysis(analysis);
    } catch {
      // Fallback
      const aiField = makeAIFielders(scenario);
      const aiEval = evaluateField(aiField, scenario.shotZones, scenario.batterHand);
      setAIEvaluation(aiEval);
      const fallback = localFallbackAnalysis(scenario, evaluation);
      fallback.aiScore = aiEval.overallScore;
      setAIAnalysis(fallback);
    } finally {
      setIsAnalysing(false);
    }
  }, [evaluation, scenario, fielders]);

  const handleReset = useCallback(() => {
    setFielders(makeFieldersFromScenario(scenario));
    setIsLocked(false);
    setShowHeatmap(false);
    setShowAIField(false);
    setHasAnalysis(false);
    setAIAnalysis(null);
    setOriginalFielders(null);
    setOriginalEval(null);
    setIsAIFieldApplied(false);
    setSelectedFielderId(null);
  }, [scenario]);

  const handleShowAIField = useCallback(() => {
    setShowAIField(prev => !prev);
    if (!showAIField) {
      setCurrentAIFielders(makeAIFielders(scenario));
    }
  }, [showAIField, scenario]);

  const handleApplyAIField = useCallback(() => {
    setOriginalFielders([...fielders]);
    setOriginalEval(evaluation);
    const aiPositions = scenario.aiField.map((pos, i) => ({
      id: `f${i + 1}`,
      name: pos.positionName,
      x: pos.x,
      y: pos.y,
      isUser: true,
    }));
    setFielders(aiPositions);
    setIsAIFieldApplied(true);
    setShowAIField(false);
  }, [fielders, evaluation, scenario]);

  const handleRestoreField = useCallback(() => {
    if (originalFielders) {
      setFielders(originalFielders);
      setIsAIFieldApplied(false);
    }
  }, [originalFielders]);

  const handleRestoreOriginalWhatIf = useCallback(() => {
    if (originalFielders) {
      setFielders(originalFielders);
    }
  }, [originalFielders]);

  const comparisonSummary = evaluation && aiEvaluation
    ? generateComparisonSummary(evaluation, aiEvaluation, scenario)
    : '';

  const TABS = [
    { id: 'metrics', label: 'Evaluation', icon: Trophy },
    { id: 'battle', label: 'Field Battle', icon: Swords },
    { id: 'whatif', label: 'What-If Lab', icon: Compass },
    { id: 'chat', label: 'Ask Captain', icon: Brain },
  ] as const;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
      {/* ── Top Navigation Bar ── */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1700px] mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-green-600 to-emerald-400 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25 border border-green-400/30">
              <Target size={20} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-white tracking-tight uppercase">FieldIQ</h1>
                <span className="text-[10px] bg-green-500/10 text-green-400 font-bold border border-green-500/30 px-2 py-0.5 rounded-full">
                  AI Tactical Simulator
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                Think Like a Captain. Set the Perfect Field.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live score pill */}
            {evaluation && (
              <div className="flex items-center gap-2.5 px-3.5 py-1.5 bg-slate-900/90 border border-slate-700/80 rounded-full shadow-inner">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-slate-400 font-medium">Live Tactical Score</span>
                <span className={`text-base font-black font-mono ${
                  evaluation.overallScore >= 75 ? 'text-green-400' : evaluation.overallScore >= 50 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {evaluation.overallScore}
                </span>
                <span className="text-xs text-slate-500">/100</span>
              </div>
            )}

            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700/60 transition-all hover:text-white"
            >
              <RefreshCw size={13} />
              Reset Field
            </button>
          </div>
        </div>
      </header>

      {/* ── Subheader Banner: Instructions ── */}
      <div className="border-b border-slate-800/40 bg-gradient-to-r from-emerald-950/20 via-slate-900/40 to-blue-950/20 px-5 py-2">
        <div className="max-w-[1700px] mx-auto flex items-center justify-between text-xs text-slate-300 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span><strong>Tactical Mission:</strong> Adjust the 9 fielders on the pitch to counter batter tendencies, then submit for AI critique.</span>
          </div>
          <span className="text-slate-500 text-[11px]">All bowler speeds, shot distributions & match contexts are simulated.</span>
        </div>
      </div>

      {/* ── Main Application Dashboard 3-Column Layout ── */}
      <main className="max-w-[1700px] mx-auto px-5 py-5 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

          {/* ════ LEFT COLUMN (3.5 cols): Scenario & Tactical Guide ════ */}
          <div className="lg:col-span-4 xl:col-span-3.5 space-y-4">
            <MatchScenarioPanel
              scenario={scenario}
              scenarios={SCENARIOS}
              onScenarioChange={handleScenarioChangeWithAIReset}
            />
            
            <ScenarioTacticalGuide
              scenario={scenario}
              evaluation={evaluation}
            />
          </div>

          {/* ════ CENTER COLUMN (5 cols): Cricket Ground & Fielder Roster ════ */}
          <div className="lg:col-span-8 xl:col-span-5 space-y-4">
            <FieldControls
              fielderCount={fielders.length}
              isLocked={isLocked}
              hasAnalysis={hasAnalysis}
              isAnalysing={isAnalysing}
              onLock={() => setIsLocked(true)}
              onUnlock={() => setIsLocked(false)}
              onReset={handleReset}
              onAnalyse={handleAnalyse}
            />

            {/* Stadium Visual Box */}
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3 px-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Interactive Stadium Canvas
                </span>
                <span className="text-[11px] text-emerald-400/90 bg-emerald-950/40 border border-emerald-800/50 px-2 py-0.5 rounded-full font-medium">
                  {scenario.format} Regulations
                </span>
              </div>

              <CricketGround
                fielders={fielders}
                onFieldersChange={setFielders}
                aiFielders={currentAIFielders}
                showAIField={showAIField}
                evaluation={evaluation}
                showHeatmap={showHeatmap}
                scenario={scenario}
                isLocked={isLocked}
                selectedId={selectedFielderId}
                onSelectFielder={setSelectedFielderId}
              />
            </div>

            {/* Fielder Roster below ground */}
            <QuickFielderRoster
              fielders={fielders}
              isLocked={isLocked}
              selectedId={selectedFielderId}
              onSelectFielder={(id) => setSelectedFielderId(id === selectedFielderId ? null : id)}
            />
          </div>

          {/* ════ RIGHT COLUMN (3.5 cols): Interactive Hub & AI Analysis ════ */}
          <div className="lg:col-span-12 xl:col-span-3.5 space-y-4">
            {/* Tab navigation for Right Column */}
            <div className="grid grid-cols-4 gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeRightTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveRightTab(tab.id)}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-green-600 text-white shadow-md shadow-green-950/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon size={14} className="mb-1" />
                    <span className="text-[10px] leading-none">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT: Live Evaluation Metrics */}
            {activeRightTab === 'metrics' && evaluation && (
              <FieldAnalysis
                evaluation={evaluation}
                showHeatmap={showHeatmap}
                onToggleHeatmap={() => setShowHeatmap(p => !p)}
                prevScore={originalEval?.overallScore}
              />
            )}

            {/* TAB CONTENT: Field Battle (You vs AI) */}
            {activeRightTab === 'battle' && evaluation && (
              aiEvaluation ? (
                <FieldComparison
                  userEval={evaluation}
                  aiEval={aiEvaluation}
                  comparisonSummary={comparisonSummary}
                />
              ) : (
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 text-center space-y-3">
                  <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-400">
                    <Swords size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">AI Benchmark Awaiting Comparison</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Click "Analyse My Field" or "Show AI's Field" to initiate the head-to-head tactical comparison with the AI Captain's optimized setup.
                  </p>
                  <button
                    onClick={handleAnalyse}
                    disabled={isAnalysing}
                    className="w-full py-2 px-3 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-bold transition-all shadow-lg shadow-green-950/40"
                  >
                    Run Comparison Now
                  </button>
                </div>
              )
            )}

            {/* TAB CONTENT: What-If Experimentation Lab */}
            {activeRightTab === 'whatif' && evaluation && (
              <WhatIfSimulator
                originalScore={originalEval}
                currentScore={evaluation}
                onRestoreOriginal={handleRestoreOriginalWhatIf}
                hasOriginal={!!originalEval}
              />
            )}

            {/* TAB CONTENT: Contextual Captain Chat */}
            {activeRightTab === 'chat' && (
              <CaptainChat
                scenario={scenario}
                fielders={fielders}
                evaluation={evaluation}
              />
            )}

            {/* AI Recommendation Card (Appears whenever analysis is done) */}
            {isAnalysing && (
              <AIRecommendation
                analysis={{ whatYouDidWell: '', whatYouMissed: '', biggestRisk: '', recommendation: '', reasoning: '', aiScore: 0, userScore: 0, isLLMGenerated: false }}
                isLoading={true}
                onShowAIField={handleShowAIField}
                onApplyAIField={handleApplyAIField}
                onRestoreField={handleRestoreField}
                showAIField={showAIField}
                hasOriginalField={isAIFieldApplied}
              />
            )}

            {aiAnalysis && !isAnalysing && (
              <AIRecommendation
                analysis={aiAnalysis}
                isLoading={false}
                onShowAIField={handleShowAIField}
                onApplyAIField={handleApplyAIField}
                onRestoreField={handleRestoreField}
                showAIField={showAIField}
                hasOriginalField={isAIFieldApplied}
              />
            )}
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-4 px-5 text-center text-[11px] text-slate-500">
        FieldIQ Interactive AI Captain Simulator • All batter tendencies, bowler profiles, and shot distributions are simulated for game design purposes.
      </footer>
    </div>
  );
}
