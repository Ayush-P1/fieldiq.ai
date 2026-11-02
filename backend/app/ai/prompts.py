"""
LLM prompt builders for FieldIQ captain analysis.
"""
from typing import Optional
from ..engines.evaluation_engine import EvaluationResult
from ..engines.scenario_engine import Scenario


def build_analysis_prompt(scenario: Scenario, evaluation: EvaluationResult) -> str:
    exposed_str = ', '.join(evaluation.exposed_zones) if evaluation.exposed_zones else 'None'
    zone_detail = '\n'.join(
        f"  - {zs.zone_name}: {zs.coverage * 100:.0f}% covered (shot probability: {zs.probability * 100:.0f}%)"
        for zs in sorted(evaluation.zone_scores, key=lambda x: -x.probability)[:5]
    )

    return f"""You are FieldIQ's AI Cricket Captain — a precise, tactical cricket analyst.

MATCH SCENARIO (SIMULATED DATA):
- Match format: {scenario.format}
- Batter: {scenario.batter} ({scenario.batter_hand}-handed)
- Bowler: {scenario.bowler} ({scenario.bowler_type})
- Situation: {scenario.situation}
- Batter tendency: {scenario.batter_tendency}
- Recent performance: {scenario.recent_performance}

FIELD EVALUATION (deterministic scores, do NOT change or invent numbers):
- Overall tactical score: {evaluation.overall_score}/100
- Leg-side coverage: {evaluation.leg_side_coverage}/100
- Off-side coverage: {evaluation.off_side_coverage}/100
- Boundary protection: {evaluation.boundary_protection}/100
- Inner circle: {evaluation.inner_circle_coverage}/100
- Most exposed zones: {exposed_str}

TOP SHOT ZONE COVERAGE:
{zone_detail}

IMPORTANT RULES:
1. Never invent or change the numerical scores above — use them exactly as given.
2. Do not claim the simulation is based on real player data.
3. Do not claim a shot is "guaranteed" — use "likely", "tends to", "probability suggests".
4. Keep analysis grounded in the actual numbers above.
5. Use clear, simple cricket language.

Respond in EXACTLY this format (no extra text before/after):

WHAT_YOU_DID_WELL: [One or two sentences about what the field does well, referencing the actual scores]

WHAT_YOU_MISSED: [One or two sentences about exposed zones, referencing actual exposed zone names]

BIGGEST_RISK: [The single biggest tactical vulnerability given the batter's tendency]

RECOMMENDATION: [Specific fielder movement recommendation — name positions concretely]

REASONING: [2-3 sentences explaining the tactical logic in simple cricket language]"""


def build_chat_prompt(
    scenario: Scenario,
    evaluation: Optional[EvaluationResult],
    user_message: str,
    history: str,
) -> str:
    eval_section = ''
    if evaluation:
        eval_section = f"""
CURRENT FIELD EVALUATION:
- Overall: {evaluation.overall_score}/100
- Leg-side: {evaluation.leg_side_coverage}/100
- Off-side: {evaluation.off_side_coverage}/100
- Boundary: {evaluation.boundary_protection}/100
- Exposed zones: {', '.join(evaluation.exposed_zones) or 'None'}"""

    return f"""You are FieldIQ's AI Cricket Captain — a helpful, knowledgeable tactical advisor.

MATCH SCENARIO (SIMULATED DATA):
- Format: {scenario.format}
- Batter: {scenario.batter} ({scenario.batter_hand}-handed)
- Bowler: {scenario.bowler}
- Situation: {scenario.situation}
- Batter tendency: {scenario.batter_tendency}
{eval_section}

RULES:
- Keep responses concise (2-4 sentences max).
- Reference actual scores when relevant.
- Use cricket terminology but explain when needed.
- Never claim real-world data — all is simulated.
- Be encouraging but tactically precise.

CONVERSATION HISTORY:
{history}

USER: {user_message}

CAPTAIN (respond concisely):"""

