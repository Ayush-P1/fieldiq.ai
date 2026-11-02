"""
AI Captain — generates tactical analysis using LLM or rule-based fallback
"""
import os
from typing import Optional

from ..schemas.field import AnalyseFieldRequest, AICaptainResponse, ChatRequest, ChatResponse
from ..engines.evaluation_engine import EvaluationResult
from ..engines.scenario_engine import SCENARIOS, Scenario
from ..ai.prompts import build_analysis_prompt, build_chat_prompt


def _has_api_key() -> bool:
    return bool(os.environ.get('GEMINI_API_KEY', '').strip())


async def analyse_with_llm(
    request: AnalyseFieldRequest,
    scenario: Scenario,
    evaluation: EvaluationResult,
) -> Optional[AICaptainResponse]:
    """Use Gemini API when key is available."""
    if not _has_api_key():
        return None
    try:
        from google import genai
        client = genai.Client()
        prompt = build_analysis_prompt(scenario, evaluation)
        response = client.models.generate_content(
            model='gemini-3.5-flash',
            contents=prompt,
        )
        text = response.text or ''
        return _parse_llm_response(text, evaluation)
    except Exception as e:
        print(f'LLM analysis failed: {e}')
        return None


async def chat_with_llm(
    request: ChatRequest,
    scenario: Scenario,
    evaluation: Optional[EvaluationResult],
) -> Optional[str]:
    """Use Gemini API for chat when key is available."""
    if not _has_api_key():
        return None
    try:
        from google import genai
        client = genai.Client()

        # Build conversation
        history_text = '\n'.join(
            f"{'User' if m.role == 'user' else 'Captain'}: {m.content}"
            for m in request.conversation_history[-6:]
        )
        prompt = build_chat_prompt(scenario, evaluation, request.message, history_text)
        response = client.models.generate_content(
            model='gemini-3.5-flash',
            contents=prompt,
        )
        return response.text
    except Exception as e:
        print(f'LLM chat failed: {e}')
        return None


def _parse_llm_response(text: str, evaluation: EvaluationResult) -> AICaptainResponse:
    """
    Parse structured LLM response.
    Expected format:
    WHAT_YOU_DID_WELL: ...
    WHAT_YOU_MISSED: ...
    BIGGEST_RISK: ...
    RECOMMENDATION: ...
    REASONING: ...
    """
    sections = {
        'what_you_did_well': '',
        'what_you_missed': '',
        'biggest_risk': '',
        'recommendation': '',
        'reasoning': '',
    }

    current_key = None
    lines = text.strip().split('\n')
    key_map = {
        'WHAT_YOU_DID_WELL': 'what_you_did_well',
        'WHAT YOU DID WELL': 'what_you_did_well',
        'WHAT_YOU_MISSED': 'what_you_missed',
        'WHAT YOU MISSED': 'what_you_missed',
        'BIGGEST_RISK': 'biggest_risk',
        'BIGGEST TACTICAL RISK': 'biggest_risk',
        'RECOMMENDATION': 'recommendation',
        'AI RECOMMENDATION': 'recommendation',
        'REASONING': 'reasoning',
        'WHY THIS RECOMMENDATION': 'reasoning',
    }

    for line in lines:
        matched = False
        for key_prefix, section_key in key_map.items():
            if line.upper().startswith(key_prefix + ':'):
                current_key = section_key
                content = line[len(key_prefix) + 1:].strip()
                if content:
                    sections[current_key] = content
                matched = True
                break
        if not matched and current_key and line.strip():
            sections[current_key] += ' ' + line.strip()

    # If parsing failed, use the full text as recommendation
    if not any(sections.values()):
        return AICaptainResponse(
            what_you_did_well=f'Your field scores {evaluation.overall_score}/100.',
            what_you_missed=', '.join(evaluation.exposed_zones) or 'No critical gaps.',
            biggest_risk=evaluation.exposed_zones[0] if evaluation.exposed_zones else 'Field is balanced.',
            recommendation=text[:400],
            reasoning='(AI-generated analysis)',
            is_llm_generated=True,
        )

    return AICaptainResponse(
        what_you_did_well=sections['what_you_did_well'] or f'Your overall tactical score is {evaluation.overall_score}/100.',
        what_you_missed=sections['what_you_missed'] or 'No critical exposures detected.',
        biggest_risk=sections['biggest_risk'] or (evaluation.exposed_zones[0] if evaluation.exposed_zones else 'Field is balanced.'),
        recommendation=sections['recommendation'] or 'Maintain current field shape.',
        reasoning=sections['reasoning'] or 'Based on scenario analysis.',
        is_llm_generated=True,
    )


def rule_based_analysis(scenario: Scenario, evaluation: EvaluationResult) -> AICaptainResponse:
    """Deterministic fallback — no LLM required."""
    scores = [
        ('leg-side', evaluation.leg_side_coverage),
        ('off-side', evaluation.off_side_coverage),
        ('boundary', evaluation.boundary_protection),
    ]
    strongest = max(scores, key=lambda x: x[1])
    weakest = min(scores, key=lambda x: x[1])
    top_exposed = evaluation.exposed_zones[0] if evaluation.exposed_zones else None

    well = (
        f"Your field provides strong {strongest[0]} coverage ({strongest[1]}/100). "
        + ("You've placed fielders well to protect the boundaries."
           if evaluation.boundary_protection >= 65
           else "Your inner-circle positioning shows good tactical awareness.")
    )

    missed = (
        f"The most exposed area is {top_exposed}. Given the batter's tendency — "
        f'"{scenario.batter_tendency.split(".")[0]}" — this creates a scoring opportunity.'
        if top_exposed
        else 'Your field placement is reasonably balanced across the ground.'
    )

    risk = (
        f"{top_exposed} is your biggest tactical risk. The {scenario.bowler_type} approach makes this particularly dangerous."
        if top_exposed
        else f"With a score of {evaluation.overall_score}/100, look to improve {weakest[0]} coverage."
    )

    rec = (
        f"Consider moving a fielder from a well-covered zone toward {evaluation.exposed_zones[0]}. "
        + (f"Also reinforce {evaluation.exposed_zones[1]}." if len(evaluation.exposed_zones) > 1 else '')
        if evaluation.exposed_zones
        else 'Maintain your current field shape. Fine-tune positions for optimal coverage.'
    )

    reasoning = (
        f"In this {scenario.format} scenario, {scenario.bowler} facing {scenario.batter} creates pressure through controlled line and length. "
        f"The batter's tendency: {scenario.batter_tendency[:100]}... "
        f"means exposing {top_exposed or 'any zone'} is particularly risky. "
        f"(⚠️ Rule-based analysis — set GEMINI_API_KEY for AI-powered insights)"
    )

    return AICaptainResponse(
        what_you_did_well=well,
        what_you_missed=missed,
        biggest_risk=risk,
        recommendation=rec,
        reasoning=reasoning,
        is_llm_generated=False,
    )


def rule_based_chat(
    message: str,
    scenario: Scenario,
    evaluation: Optional[EvaluationResult],
) -> str:
    """Rule-based chat responses."""
    msg = message.lower()
    score = evaluation.overall_score if evaluation else 0
    exposed = evaluation.exposed_zones if evaluation else []

    if any(w in msg for w in ['exposed', 'weak', 'gap']):
        if exposed:
            return (
                f"Your most exposed zones are: {', '.join(exposed)}. "
                f"These have low fielder coverage relative to shot probability. "
                f"In this scenario, the batter tends to {scenario.batter_tendency.split('.')[0].lower()}."
            )
        return 'Based on current positions, no zone is critically exposed. Your field is reasonably balanced.'

    if any(w in msg for w in ['score', 'lower', 'why', 'low']):
        return (
            f"Your tactical score of {score}/100 reflects how well your fielders cover expected shot zones. "
            "The evaluation engine calculates distance from each fielder to likely shot locations, weighted by probability. "
            "Gaps in high-probability zones reduce your score significantly."
        )

    if any(w in msg for w in ['deep', 'boundary', 'six']):
        return (
            f"Boundary fielders need to be positioned within ~80px of the boundary arc to be effective. "
            f"In {scenario.format}, protecting {exposed[0] if exposed else 'long-on and deep mid-wicket'} at boundary depth is critical "
            f"given the batter's aggressive hitting style."
        )

    if any(w in msg for w in ['recommend', 'suggest', 'should', 'best']):
        top_zone = scenario.shot_zones[0] if scenario.shot_zones else None
        return (
            f"For this scenario ({scenario.name}), I'd recommend: "
            + (f"1) Protect {top_zone.name} — {top_zone.probability * 100:.0f}% of shots go there. " if top_zone else '')
            + "2) Ensure at least 2 fielders in the inner circle to save singles. "
            "3) Click 'Show AI\\'s Field' to see the full recommended setup."
        )

    if any(w in msg for w in ['left', 'lefty', 'handed']):
        return (
            f"This scenario features a {scenario.batter}. "
            f"{scenario.batter_tendency} "
            "Adjust your field accordingly — mirror the off/leg alignment when facing left-handed batters."
        )

    if any(w in msg for w in ['spin', 'fast', 'pace', 'bowler']):
        is_spin = 'spin' in scenario.bowler_type
        return (
            f"The {scenario.bowler} in this scenario means: "
            + ("Consider slip and bat-pad fielders for turning delivery edge-catches. Spin creates different angles than pace."
               if is_spin
               else "Fast bowlers generate edges — slip cordon is valuable. Short-pitched deliveries create pull/hook opportunities.")
        )

    return (
        f"As your AI captain, I can see your current field scores {score}/100. "
        + (f"The main concern is {exposed[0]} — consider repositioning to cover that zone."
           if exposed
           else "Your field is reasonably set. Try clicking 'Analyse My Field' for detailed feedback.")
        + " Ask me about specific zones, your score, or what I'd recommend!"
    )

