import React from 'react';
import type { Scenario, EvaluationResult } from '../types/field';
import { Lightbulb, ShieldAlert, Award, Compass, Sparkles } from 'lucide-react';

interface ScenarioTacticalGuideProps {
  scenario: Scenario;
  evaluation: EvaluationResult | null;
  onApplyTacticalTip?: () => void;
}

export default function ScenarioTacticalGuide({ scenario, evaluation }: ScenarioTacticalGuideProps) {
  const getScenarioTips = () => {
    switch (scenario.id) {
      case 'death-over':
        return [
          { title: 'Boundary Wall', desc: 'Deploy at least 4-5 fielders directly along the ropes (Deep Mid-Wicket, Long-On, Long-Off).' },
          { title: 'Protect the Pull', desc: 'A deep square leg or deep fine leg prevents easy sixes from short pitch deliveries.' },
          { title: 'Off-Side Gap Risk', desc: 'Don\'t leave Deep Cover fully vacant; power hitters will slash outside off-stump.' }
        ];
      case 'spin-pressure':
        return [
          { title: 'Catching Cordon', desc: 'Keep at least 1 slip and a forward short leg or silly point to catch edges and bat-pads.' },
          { title: 'Sweep Barrier', desc: 'Left-handers love the sweep—have deep square leg and backward point ready.' },
          { title: 'Cut Off The Single', desc: 'Keep mid-off and mid-on tighter to force high-risk aerial shots.' }
        ];
      case 'powerplay-defence':
        return [
          { title: 'Field Restrictions', desc: 'Maximum 2 fielders allowed outside the 30-yard circle during this phase.' },
          { title: 'Ring Fielders', desc: 'Pack Cover, Extra Cover, and Point tightly to choke the batter\'s bread-and-butter drive.' },
          { title: 'Boundary Placements', desc: 'Third Man and Fine Leg are usually safest to prevent edges from racing for 4.' }
        ];
      default:
        return [
          { title: 'Balanced Spread', desc: 'Balance fielders across both off and leg sides.' }
        ];
    }
  };

  const tips = getScenarioTips();

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 mt-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 rounded-md bg-amber-500/20 flex items-center justify-center">
          <Lightbulb size={12} className="text-amber-400" />
        </div>
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Captain's Tactical Brief</h3>
      </div>

      <div className="space-y-2.5">
        {tips.map((tip, idx) => (
          <div key={idx} className="bg-slate-800/40 border border-slate-800 rounded-lg p-2.5 flex items-start gap-2.5">
            <span className="w-4 h-4 rounded-full bg-slate-700/80 text-[10px] font-bold text-slate-300 flex items-center justify-center flex-shrink-0 mt-0.5">
              {idx + 1}
            </span>
            <div>
              <p className="text-xs font-semibold text-slate-200">{tip.title}</p>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">{tip.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {evaluation && evaluation.exposedZones.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-amber-300/90">
          <ShieldAlert size={13} className="text-amber-400 flex-shrink-0" />
          <span>Priority Alert: Reinforce <strong className="text-amber-200 font-semibold">{evaluation.exposedZones[0]}</strong> to boost tactical score.</span>
        </div>
      )}
    </div>
  );
}

