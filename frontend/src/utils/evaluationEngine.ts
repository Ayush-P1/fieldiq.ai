import type { Fielder, ShotZone, EvaluationResult, ZoneScore } from '../types/field';
import { SVG_CX, SVG_CY, SVG_BOUNDARY_R, SVG_INNER_R } from '../data/scenarios';

const MAX_EFFECTIVE_DISTANCE = 80; // pixels — beyond this a fielder barely helps

/**
 * Distance between two SVG points
 */
function dist(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

/**
 * Distance from SVG center (for determining inner/outer circle)
 */
function distFromCenter(x: number, y: number): number {
  return dist(x, y, SVG_CX, SVG_CY);
}

/**
 * Coverage factor for a fielder at given distance from a zone
 * Returns 0-1, with 1 being perfect coverage
 */
function coverageFactor(fielderDist: number, isBoundaryZone: boolean): number {
  const effective = isBoundaryZone ? MAX_EFFECTIVE_DISTANCE * 0.7 : MAX_EFFECTIVE_DISTANCE;
  if (fielderDist <= 0) return 1.0;
  if (fielderDist >= effective * 2) return 0.0;
  // Gaussian-like decay
  return Math.exp(-(fielderDist * fielderDist) / (2 * effective * effective));
}

/**
 * Check if a position is on the leg side (for right-handed batsman, x > CX is leg side)
 * For left-handed batsman, flip
 */
function isLegSide(x: number, batterHand: 'right' | 'left' = 'right'): boolean {
  if (batterHand === 'right') return x < SVG_CX; // leg side is left on SVG
  return x > SVG_CX;
}

/**
 * Core evaluation function — takes actual SVG coordinates
 */
export function evaluateField(
  fielders: Fielder[],
  shotZones: ShotZone[],
  batterHand: 'right' | 'left' = 'right'
): EvaluationResult {
  if (!fielders.length || !shotZones.length) {
    return emptyEvaluation();
  }

  const zoneScores: ZoneScore[] = [];

  for (const zone of shotZones) {
    // Find nearest fielder to this zone
    let minDist = Infinity;
    let nearestFielder: Fielder | null = null;

    for (const f of fielders) {
      const d = dist(f.x, f.y, zone.x, zone.y);
      if (d < minDist) {
        minDist = d;
        nearestFielder = f;
      }
    }

    // Compute coverage for this zone
    let coverage = 0;
    if (nearestFielder) {
      const fielderInCircle = distFromCenter(nearestFielder.x, nearestFielder.y) < SVG_INNER_R;

      // Boundary zones need fielders near boundary, not inside circle
      if (zone.isBoundary && fielderInCircle) {
        coverage = coverageFactor(minDist, true) * 0.4; // penalty for wrong position type
      } else if (!zone.isBoundary && !fielderInCircle) {
        coverage = coverageFactor(minDist, false) * 0.5; // penalty for fielder too deep
      } else {
        coverage = coverageFactor(minDist, zone.isBoundary);
      }
    }

    zoneScores.push({
      zoneName: zone.name,
      coverage: Math.min(1, Math.max(0, coverage)),
      nearestFielderDistance: minDist,
      probability: zone.probability,
    });
  }

  // ── Compute aggregate scores ──────────────────────────────────────────────

  // Overall weighted coverage
  let weightedCoverage = 0;
  let totalWeight = 0;
  for (const zs of zoneScores) {
    weightedCoverage += zs.coverage * zs.probability;
    totalWeight += zs.probability;
  }
  const overallRaw = totalWeight > 0 ? weightedCoverage / totalWeight : 0;

  // Leg-side coverage
  const legZones = shotZones.filter(z => z.isLegSide);
  const legScores = zoneScores.filter(zs => legZones.some(lz => lz.name === zs.zoneName));
  const legCoverage = averageWeighted(legScores, legZones);

  // Off-side coverage
  const offZones = shotZones.filter(z => !z.isLegSide);
  const offScores = zoneScores.filter(zs => offZones.some(oz => oz.name === zs.zoneName));
  const offCoverage = averageWeighted(offScores, offZones);

  // Boundary protection
  const boundaryZones = shotZones.filter(z => z.isBoundary);
  const boundaryScores = zoneScores.filter(zs => boundaryZones.some(bz => bz.name === zs.zoneName));
  const boundaryProtection = averageWeighted(boundaryScores, boundaryZones);

  // Inner circle coverage
  const innerZones = shotZones.filter(z => !z.isBoundary);
  const innerScores = zoneScores.filter(zs => innerZones.some(iz => iz.name === zs.zoneName));
  const innerCoverage = averageWeighted(innerScores, innerZones);

  // Exposed zones (worst covered with high probability)
  const exposedZones = zoneScores
    .filter(zs => zs.coverage < 0.35)
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 3)
    .map(zs => zs.zoneName);

  // Scale to 0-100
  const scale = (v: number) => Math.round(Math.min(100, Math.max(0, v * 100)));

  return {
    overallScore: scale(overallRaw),
    legSideCoverage: scale(legCoverage),
    offSideCoverage: scale(offCoverage),
    boundaryProtection: scale(boundaryProtection),
    innerCircleCoverage: scale(innerCoverage),
    exposedZones,
    zoneScores,
    recommendations: generateRecommendations(exposedZones, overallRaw),
  };
}

function averageWeighted(scores: ZoneScore[], zones: ShotZone[]): number {
  if (!scores.length) return 0.5;
  let weighted = 0;
  let total = 0;
  for (const zs of scores) {
    const zone = zones.find(z => z.name === zs.zoneName);
    const prob = zone?.probability ?? zs.probability;
    weighted += zs.coverage * prob;
    total += prob;
  }
  return total > 0 ? weighted / total : 0;
}

function generateRecommendations(exposedZones: string[], overallScore: number): string[] {
  const recs: string[] = [];
  if (overallScore < 0.5) {
    recs.push('Consider redistributing fielders towards high-probability zones.');
  }
  if (exposedZones.length > 0) {
    recs.push(`Move a fielder to protect: ${exposedZones[0]}.`);
  }
  if (exposedZones.length > 1) {
    recs.push(`Also consider: ${exposedZones[1]} is exposed.`);
  }
  return recs;
}

function emptyEvaluation(): EvaluationResult {
  return {
    overallScore: 0,
    legSideCoverage: 0,
    offSideCoverage: 0,
    boundaryProtection: 0,
    innerCircleCoverage: 0,
    exposedZones: [],
    zoneScores: [],
    recommendations: ['Position all 9 fielders to see evaluation.'],
  };
}

/**
 * Get score color class based on value
 */
export function getScoreColor(score: number): string {
  if (score >= 75) return 'text-green-400';
  if (score >= 50) return 'text-yellow-400';
  return 'text-red-400';
}

export function getScoreBarColor(score: number): string {
  if (score >= 75) return 'bg-green-500';
  if (score >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
}

/**
 * Check if two fielder positions are too close (overlap prevention)
 */
export function isTooClose(x1: number, y1: number, x2: number, y2: number): boolean {
  return dist(x1, y1, x2, y2) < 18;
}

/**
 * Clamp a position within the boundary circle
 */
export function clampToBoundary(x: number, y: number): { x: number; y: number } {
  const dx = x - SVG_CX;
  const dy = y - SVG_CY;
  const d = Math.sqrt(dx * dx + dy * dy);
  const maxR = SVG_BOUNDARY_R - 12;
  if (d > maxR) {
    return {
      x: SVG_CX + (dx / d) * maxR,
      y: SVG_CY + (dy / d) * maxR,
    };
  }
  return { x, y };
}

/**
 * Get position name from coordinates (nearest named position)
 */
export function getPositionName(x: number, y: number): string {
  const dx = x - SVG_CX;
  const dy = y - SVG_CY;
  const d = Math.sqrt(dx * dx + dy * dy);
  const isDeep = d > SVG_INNER_R;
  
  // Angle in degrees (0 = top, clockwise)
  let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
  if (angle < 0) angle += 360;

  // Simplified position naming based on angle
  if (angle < 22.5 || angle >= 337.5) return 'Fine Leg';
  if (angle < 67.5) return isDeep ? 'Deep Fine Leg' : 'Fine Leg';
  if (angle < 90) return isDeep ? 'Deep Square Leg' : 'Square Leg';
  if (angle < 112.5) return isDeep ? 'Deep Mid-Wicket' : 'Mid-Wicket';
  if (angle < 135) return isDeep ? 'Long-On' : 'Mid-On';
  if (angle < 157.5) return isDeep ? 'Long-On' : 'Mid-On';
  if (angle < 180) return isDeep ? 'Long-Off' : 'Mid-Off';
  if (angle < 202.5) return isDeep ? 'Long-Off' : 'Mid-Off';
  if (angle < 225) return isDeep ? 'Deep Cover' : 'Extra Cover';
  if (angle < 247.5) return isDeep ? 'Deep Cover' : 'Cover';
  if (angle < 270) return isDeep ? 'Deep Point' : 'Point';
  if (angle < 292.5) return isDeep ? 'Third Man' : 'Gully';
  if (angle < 315) return isDeep ? 'Third Man' : 'Slip';
  return isDeep ? 'Deep Fine Leg' : 'Slip';
}
