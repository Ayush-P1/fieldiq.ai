"""
FieldIQ FastAPI backend
"""
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv

load_dotenv()

from .schemas.field import (
    AnalyseFieldRequest,
    AICaptainResponse,
    ChatRequest,
    ChatResponse,
)
from .engines.evaluation_engine import evaluate_field, FielderPos
from .engines.scenario_engine import SCENARIOS
from .ai.captain import analyse_with_llm, chat_with_llm, rule_based_analysis, rule_based_chat

app = FastAPI(
    title='FieldIQ API',
    description='AI Cricket Captain field analysis backend',
    version='1.0.0',
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.get('/health')
def health():
    api_key_configured = bool(os.environ.get('GEMINI_API_KEY', '').strip())
    return {
        'status': 'ok',
        'version': '1.0.0',
        'ai_mode': 'gemini-llm' if api_key_configured else 'rule-based',
        'scenarios': list(SCENARIOS.keys()),
    }


@app.post('/analyse', response_model=AICaptainResponse)
async def analyse_field(request: AnalyseFieldRequest):
    """Analyse user's field placement and return AI tactical feedback."""
    scenario = SCENARIOS.get(request.scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail=f'Scenario not found: {request.scenario_id}')

    # Convert request to internal types
    fielder_positions = [
        FielderPos(id=f.id, x=f.x, y=f.y)
        for f in request.fielder_positions
    ]

    # Re-evaluate using backend engine (verification)
    evaluation = evaluate_field(fielder_positions, scenario.shot_zones, scenario.batter_hand)

    # Try LLM first, fall back to rule-based
    llm_result = await analyse_with_llm(request, scenario, evaluation)
    if llm_result:
        return llm_result

    return rule_based_analysis(scenario, evaluation)


@app.post('/chat', response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Chat with the AI captain."""
    scenario = SCENARIOS.get(request.scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail=f'Scenario not found: {request.scenario_id}')

    evaluation = None
    if request.evaluation:
        from .engines.evaluation_engine import EvaluationResult, ZoneScore
        evaluation = EvaluationResult(
            overall_score=request.evaluation.get_overall_score(),
            leg_side_coverage=request.evaluation.get_leg_coverage(),
            off_side_coverage=request.evaluation.get_off_coverage(),
            boundary_protection=request.evaluation.get_boundary_protection(),
            inner_circle_coverage=request.evaluation.get_inner_coverage(),
            exposed_zones=request.evaluation.get_exposed_zones(),
            zone_scores=[
                ZoneScore(
                    zone_name=zs.resolved_zone_name,
                    coverage=zs.coverage,
                    nearest_fielder_distance=zs.resolved_distance,
                    probability=zs.probability,
                )
                for zs in request.evaluation.get_zone_scores()
            ],
            recommendations=request.evaluation.recommendations or [],
        )

    # Try LLM
    llm_reply = await chat_with_llm(request, scenario, evaluation)
    if llm_reply:
        return ChatResponse(reply=llm_reply, is_llm_generated=True)

    reply = rule_based_chat(request.message, scenario, evaluation)
    return ChatResponse(reply=reply, is_llm_generated=False)


@app.get('/scenarios')
def get_scenarios():
    """List available scenarios."""
    return [
        {
            'id': s.id,
            'name': s.name,
            'format': s.format,
            'description': s.description,
        }
        for s in SCENARIOS.values()
    ]


# Mount static files when frontend dist exists (for single-service deployment on Render)
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/dist"))
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))


