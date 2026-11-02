"""
Deterministic field evaluation engine — mirrors evaluationEngine.ts
"""
import math
from typing import List, Tuple
from dataclasses import dataclass

from .scenario_engine import ShotZone, CX, CY, BR, IR

MAX_EFFECTIVE_DISTANCE = 80.0  # pixels


@dataclass
class FielderPos:
    id: str
    x: float
    y: float


@dataclass
class ZoneScore:
    zone_name: str
    coverage: float
    nearest_fielder_distance: float
    probability: float


@dataclass
class EvaluationResult:
    overall_score: int
    leg_side_coverage: int
    off_side_coverage: int
    boundary_protection: int
    inner_circle_coverage: int
    exposed_zones: List[str]
    zone_scores: List[ZoneScore]
    recommendations: List[str]


def _dist(x1: float, y1: float, x2: float, y2: float) -> float:
    return math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)


def _dist_from_center(x: float, y: float) -> float:
    return _dist(x, y, CX, CY)


def _coverage_factor(fielder_dist: float, is_boundary: bool) -> float:
    effective = MAX_EFFECTIVE_DISTANCE * 0.7 if is_boundary else MAX_EFFECTIVE_DISTANCE
    if fielder_dist <= 0:
        return 1.0
    if fielder_dist >= effective * 2:
        return 0.0
    return math.exp(-(fielder_dist ** 2) / (2 * effective ** 2))


def evaluate_field(
    fielders: List[FielderPos],
    shot_zones: List[ShotZone],
    batter_hand: str = 'right',
) -> EvaluationResult:
    if not fielders or not shot_zones:
        return EvaluationResult(0, 0, 0, 0, 0, [], [], ['Position all 9 fielders to see evaluation.'])

    zone_scores: List[ZoneScore] = []

    for zone in shot_zones:
        min_dist = float('inf')
        nearest = None
        for f in fielders:
            d = _dist(f.x, f.y, zone.x, zone.y)
            if d < min_dist:
                min_dist = d
                nearest = f

        coverage = 0.0
        if nearest:
            fielder_in_circle = _dist_from_center(nearest.x, nearest.y) < IR
            if zone.is_boundary and fielder_in_circle:
                coverage = _coverage_factor(min_dist, True) * 0.4
            elif not zone.is_boundary and not fielder_in_circle:
                coverage = _coverage_factor(min_dist, False) * 0.5
            else:
                coverage = _coverage_factor(min_dist, zone.is_boundary)

        zone_scores.append(ZoneScore(
            zone_name=zone.name,
            coverage=min(1.0, max(0.0, coverage)),
            nearest_fielder_distance=min_dist if min_dist < float('inf') else 999,
            probability=zone.probability,
        ))

    # Aggregate
    def weighted_avg(scores, zones_filter):
        filtered = [(zs, sz) for zs, sz in zip(zone_scores, shot_zones) if zones_filter(sz)]
        if not filtered:
            return 0.5
        total_w = sum(sz.probability for _, sz in filtered)
        if total_w == 0:
            return 0.5
        return sum(zs.coverage * sz.probability for zs, sz in filtered) / total_w

    overall_raw = weighted_avg(zone_scores, lambda _: True)
    leg_raw = weighted_avg(zone_scores, lambda sz: sz.is_leg_side)
    off_raw = weighted_avg(zone_scores, lambda sz: not sz.is_leg_side)
    boundary_raw = weighted_avg(zone_scores, lambda sz: sz.is_boundary)
    inner_raw = weighted_avg(zone_scores, lambda sz: not sz.is_boundary)

    def scale(v): return min(100, max(0, round(v * 100)))

    exposed = [
        zs.zone_name for zs in sorted(zone_scores, key=lambda x: -x.probability)
        if zs.coverage < 0.35
    ][:3]

    recs = []
    if overall_raw < 0.5:
        recs.append('Consider redistributing fielders toward high-probability zones.')
    if exposed:
        recs.append(f'Move a fielder to protect: {exposed[0]}.')
    if len(exposed) > 1:
        recs.append(f'Also consider: {exposed[1]} is exposed.')

    return EvaluationResult(
        overall_score=scale(overall_raw),
        leg_side_coverage=scale(leg_raw),
        off_side_coverage=scale(off_raw),
        boundary_protection=scale(boundary_raw),
        inner_circle_coverage=scale(inner_raw),
        exposed_zones=exposed,
        zone_scores=zone_scores,
        recommendations=recs,
    )

