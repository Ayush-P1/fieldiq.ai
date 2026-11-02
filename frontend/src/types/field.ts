// Types for FieldIQ application

export interface Position {
  x: number; // normalized 0-1 (relative to SVG viewBox)
  y: number; // normalized 0-1
}

export interface Fielder {
  id: string;
  name: string; // current position name
  x: number;    // SVG coordinate
  y: number;    // SVG coordinate
  isUser: boolean;
}

export type BatterHand = 'right' | 'left';
export type BowlerType = 'right-arm-fast' | 'right-arm-spin' | 'left-arm-fast' | 'left-arm-spin' | 'leg-spin';

export interface ShotZone {
  name: string;
  x: number; // SVG coordinate center of zone
  y: number;
  probability: number; // 0-1 percentage of shots to this zone
  isBoundary: boolean;
  isLegSide: boolean;
}

export interface Scenario {
  id: string;
  name: string;
  label: string;  // short display label
  match: string;
  format: string;
  innings: string;
  score: string;
  overs: string;
  batter: string;
  batterHand: BatterHand;
  bowler: string;
  bowlerType: BowlerType;
  situation: string;
  batterTendency: string;
  recentPerformance: string;
  shotZones: ShotZone[];
  aiField: FielderPosition[];
  description: string;
  tags: string[];
}

export interface FielderPosition {
  positionName: string;
  x: number;
  y: number;
  reasoning?: string;
}

export interface EvaluationResult {
  overallScore: number;       // 0-100
  legSideCoverage: number;    // 0-100
  offSideCoverage: number;    // 0-100
  boundaryProtection: number; // 0-100
  innerCircleCoverage: number; // 0-100
  exposedZones: string[];
  zoneScores: ZoneScore[];    // per-zone coverage scores
  recommendations: string[];
}

export interface ZoneScore {
  zoneName: string;
  coverage: number; // 0-1, how well covered this zone is
  nearestFielderDistance: number;
  probability: number;
}

export interface AIAnalysis {
  whatYouDidWell: string;
  whatYouMissed: string;
  biggestRisk: string;
  recommendation: string;
  reasoning: string;
  aiScore: number;
  userScore: number;
  isLLMGenerated: boolean;
}

export interface ComparisonResult {
  userScore: number;
  aiScore: number;
  legSideDiff: number;
  offSideDiff: number;
  boundaryDiff: number;
  summary: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'captain';
  content: string;
  timestamp: Date;
}

export interface WhatIfState {
  originalFielders: Fielder[];
  originalScore: EvaluationResult | null;
  currentScore: EvaluationResult | null;
  improvement: number;
}
