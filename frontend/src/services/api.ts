import type { Fielder, EvaluationResult, AIAnalysis, Scenario, ChatMessage } from '../types/field';

const API_BASE = import.meta.env.VITE_API_BASE || '';

interface AnalyseFieldRequest {
  scenario_id: string;
  fielder_positions: { id: string; x: number; y: number }[];
  evaluation: EvaluationResult;
}

interface AICaptainResponse {
  what_you_did_well: string;
  what_you_missed: string;
  biggest_risk: string;
  recommendation: string;
  reasoning: string;
  is_llm_generated: boolean;
}

interface ChatRequest {
  scenario_id: string;
  message: string;
  fielder_positions: { id: string; x: number; y: number }[];
  evaluation: EvaluationResult | null;
  conversation_history: { role: string; content: string }[];
}

interface ChatResponse {
  reply: string;
  is_llm_generated: boolean;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error ${response.status}: ${error}`);
  }
  return response.json();
}

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) throw new Error(`API error ${response.status}`);
  return response.json();
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    await get('/health');
    return true;
  } catch {
    return false;
  }
}

export async function analyseField(
  scenario: Scenario,
  fielders: Fielder[],
  evaluation: EvaluationResult
): Promise<AIAnalysis> {
  try {
    const result = await post<AICaptainResponse>('/analyse', {
      scenario_id: scenario.id,
      fielder_positions: fielders.map(f => ({ id: f.id, x: f.x, y: f.y })),
      evaluation,
    });
    return {
      whatYouDidWell: result.what_you_did_well,
      whatYouMissed: result.what_you_missed,
      biggestRisk: result.biggest_risk,
      recommendation: result.recommendation,
      reasoning: result.reasoning,
      isLLMGenerated: result.is_llm_generated,
      aiScore: 0,
      userScore: evaluation.overallScore,
    };
  } catch (e) {
    console.warn('Backend unavailable, using local fallback:', e);
    return localFallbackAnalysis(scenario, evaluation);
  }
}

export async function sendChatMessage(
  scenario: Scenario,
  message: string,
  fielders: Fielder[],
  evaluation: EvaluationResult | null,
  history: ChatMessage[]
): Promise<string> {
  try {
    const result = await post<ChatResponse>('/chat', {
      scenario_id: scenario.id,
      message,
      fielder_positions: fielders.map(f => ({ id: f.id, x: f.x, y: f.y })),
      evaluation,
      conversation_history: history.slice(-6).map(m => ({
        role: m.role === 'captain' ? 'assistant' : 'user',
        content: m.content,
      })),
    });
    return result.reply;
  } catch (e) {
    console.warn('Chat backend unavailable, using local fallback:', e);
    return localChatFallback(message, scenario, evaluation);
  }
}

// ─── Local fallback logic (works without backend) ───────────────────────────

export function localFallbackAnalysis(
  scenario: Scenario,
  evaluation: EvaluationResult
): AIAnalysis {
  const { overallScore, legSideCoverage, offSideCoverage, boundaryProtection, exposedZones } = evaluation;

  // Determine strongest area
  const scores = [
    { name: 'leg-side', v: legSideCoverage },
    { name: 'off-side', v: offSideCoverage },
    { name: 'boundary', v: boundaryProtection },
  ];
  const strongest = scores.sort((a, b) => b.v - a.v)[0];
  const weakest = scores[scores.length - 1];

  const topExposed = exposedZones[0] || 'no particular zone';

  const wellText = `Your field provides strong ${strongest.name} coverage (${strongest.v}/100). ` +
    (boundaryProtection >= 65
      ? 'You\'ve placed fielders well to protect the boundaries.'
      : 'Your inner-circle positioning shows good tactical awareness.');

  const missedText = exposedZones.length > 0
    ? `The most exposed area is ${topExposed}. Given the batter's tendency — "${scenario.batterTendency.split('.')[0]}" — this creates a scoring opportunity.`
    : 'Your field placement is reasonably balanced across the ground.';

  const riskText = exposedZones.length > 0
    ? `${topExposed} is your biggest tactical risk. The ${scenario.batter || scenario.bowlerType} combination makes this zone particularly dangerous.`
    : `With a score of ${overallScore}/100, look to improve ${weakest.name} coverage.`;

  const recText = exposedZones.length > 1
    ? `Consider moving a fielder from a well-covered zone toward ${exposedZones[0]}. If possible, also reinforce ${exposedZones[1]}.`
    : exposedZones.length === 1
    ? `Move a fielder toward ${exposedZones[0]} — it's your primary weak point.`
    : 'Maintain your current field shape. Fine-tune positions for optimal coverage.';

  const reasonText = `In this ${scenario.format} scenario, the ${scenario.bowler} facing a ${scenario.batter} typically creates pressure through controlled line and length. ` +
    `The batter's tendency to ${scenario.batterTendency.toLowerCase().substring(0, 80)} means exposing ${topExposed} is particularly risky. ` +
    `(⚠️ Rule-based analysis — connect backend with GEMINI_API_KEY for AI-powered insights)`;

  return {
    whatYouDidWell: wellText,
    whatYouMissed: missedText,
    biggestRisk: riskText,
    recommendation: recText,
    reasoning: reasonText,
    aiScore: 0,
    userScore: overallScore,
    isLLMGenerated: false,
  };
}

function localChatFallback(
  message: string,
  scenario: Scenario,
  evaluation: EvaluationResult | null
): string {
  const lowerMsg = message.toLowerCase();
  const score = evaluation?.overallScore ?? 0;
  const exposed = evaluation?.exposedZones ?? [];

  if (lowerMsg.includes('exposed') || lowerMsg.includes('weak')) {
    return exposed.length > 0
      ? `Your most exposed zones are: ${exposed.join(', ')}. These have low fielder coverage relative to the probability of shots going there. In this scenario, the batter tends to ${scenario.batterTendency.split('.')[0].toLowerCase()}.`
      : 'Based on current positions, no zone is critically exposed. Your field is reasonably balanced.';
  }

  if (lowerMsg.includes('score') || lowerMsg.includes('lower') || lowerMsg.includes('why')) {
    return `Your tactical score of ${score}/100 reflects how well your fielders cover the expected shot zones. The evaluation engine calculates distance from each fielder to likely shot locations, weighted by probability. Gaps in high-probability zones reduce your score significantly.`;
  }

  if (lowerMsg.includes('deep') || lowerMsg.includes('boundary')) {
    return `Boundary fielders need to be positioned within ~15px of the boundary arc to be effective. In ${scenario.format}, having fielders at: ${exposed[0] || 'long-on, deep mid-wicket'} at boundary depth is critical given the batter's aggressive hitting.`;
  }

  if (lowerMsg.includes('recommend') || lowerMsg.includes('suggest') || lowerMsg.includes('should')) {
    return `For this scenario (${scenario.name}), I'd recommend: 1) Protect ${scenario.shotZones[0]?.name} — ${(scenario.shotZones[0]?.probability * 100).toFixed(0)}% of shots go there. 2) Ensure at least 2 fielders in the inner circle to save singles. 3) Click "Show AI's Field" to see the full recommended setup.`;
  }

  if (lowerMsg.includes('left') || lowerMsg.includes('hand') || lowerMsg.includes('batter')) {
    return `This scenario features a ${scenario.batter}. ${scenario.batterTendency} Adjust your field accordingly — mirror the off/leg alignment when facing left-handed batters.`;
  }

  if (lowerMsg.includes('spin') || lowerMsg.includes('fast') || lowerMsg.includes('bowler')) {
    return `The ${scenario.bowler} in this scenario means: ${scenario.bowlerType.includes('spin') ? 'Consider slip and bat-pad fielders for turning delivery edge-catches. Spin creates different angles than pace.' : 'Fast bowlers generate edges — slip cordon is valuable. Short-pitched deliveries create pull/hook opportunities.'}`;
  }

  return `As your AI captain, I can see your current field scores ${score}/100. ${
    exposed.length > 0
      ? `The main concern is ${exposed[0]} — consider repositioning to cover that zone.`
      : 'Your field is reasonably set. Try clicking "Analyse My Field" for detailed feedback.'
  } Ask me about specific zones, your score, or what I'd recommend!`;
}
