from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class FielderPositionSchema(BaseModel):
    id: str
    x: float
    y: float


class ZoneScoreSchema(BaseModel):
    zone_name: Optional[str] = None
    zoneName: Optional[str] = None
    coverage: float = 0.0
    nearest_fielder_distance: Optional[float] = None
    nearestFielderDistance: Optional[float] = None
    probability: float = 0.0

    @property
    def resolved_zone_name(self) -> str:
        return self.zone_name or self.zoneName or ""

    @property
    def resolved_distance(self) -> float:
        if self.nearest_fielder_distance is not None:
            return self.nearest_fielder_distance
        if self.nearestFielderDistance is not None:
            return self.nearestFielderDistance
        return 999.0


class EvaluationSchema(BaseModel):
    overall_score: Optional[int] = None
    overallScore: Optional[int] = None
    leg_side_coverage: Optional[int] = None
    legSideCoverage: Optional[int] = None
    off_side_coverage: Optional[int] = None
    offSideCoverage: Optional[int] = None
    boundary_protection: Optional[int] = None
    boundaryProtection: Optional[int] = None
    inner_circle_coverage: Optional[int] = None
    innerCircleCoverage: Optional[int] = None
    exposed_zones: Optional[List[str]] = None
    exposedZones: Optional[List[str]] = None
    zone_scores: Optional[List[ZoneScoreSchema]] = None
    zoneScores: Optional[List[ZoneScoreSchema]] = None
    recommendations: Optional[List[str]] = None

    def get_overall_score(self) -> int:
        return self.overall_score if self.overall_score is not None else (self.overallScore or 0)

    def get_leg_coverage(self) -> int:
        return self.leg_side_coverage if self.leg_side_coverage is not None else (self.legSideCoverage or 0)

    def get_off_coverage(self) -> int:
        return self.off_side_coverage if self.off_side_coverage is not None else (self.offSideCoverage or 0)

    def get_boundary_protection(self) -> int:
        return self.boundary_protection if self.boundary_protection is not None else (self.boundaryProtection or 0)

    def get_inner_coverage(self) -> int:
        return self.inner_circle_coverage if self.inner_circle_coverage is not None else (self.innerCircleCoverage or 0)

    def get_exposed_zones(self) -> List[str]:
        return self.exposed_zones if self.exposed_zones is not None else (self.exposedZones or [])

    def get_zone_scores(self) -> List[ZoneScoreSchema]:
        return self.zone_scores if self.zone_scores is not None else (self.zoneScores or [])


class AnalyseFieldRequest(BaseModel):
    scenario_id: str
    fielder_positions: List[FielderPositionSchema]
    evaluation: EvaluationSchema


class AICaptainResponse(BaseModel):
    what_you_did_well: str
    what_you_missed: str
    biggest_risk: str
    recommendation: str
    reasoning: str
    is_llm_generated: bool


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    scenario_id: str
    message: str
    fielder_positions: List[FielderPositionSchema]
    evaluation: Optional[EvaluationSchema] = None
    conversation_history: List[ChatMessage] = []


class ChatResponse(BaseModel):
    reply: str
    is_llm_generated: bool

