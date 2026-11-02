import type { Scenario, ShotZone, FielderPosition } from '../types/field';

// SVG ViewBox: 500 x 500, center at (250, 250)
// Boundary radius: 220, Inner circle radius: 110
const CX = 250;
const CY = 250;
const BOUNDARY_R = 215;
const INNER_R = 108;

// Helper: polar to SVG coords
function polar(angleDeg: number, radiusFraction: number, maxR = BOUNDARY_R): [number, number] {
  // angle 0 = straight down (fine leg for RHB), rotating clockwise
  // We use cricket convention: 0° = straight down (behind batsman on leg side)
  const rad = (angleDeg - 90) * (Math.PI / 180);
  const r = maxR * radiusFraction;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

// ─── SCENARIO 1: Death-over Attack (RHB vs Fast) ───────────────────────────
const deathOverShots: ShotZone[] = [
  { name: 'Deep Mid-Wicket', ...coordsOf(polar(220, 0.93)), probability: 0.25, isBoundary: true, isLegSide: true },
  { name: 'Long-On', ...coordsOf(polar(195, 0.93)), probability: 0.20, isBoundary: true, isLegSide: true },
  { name: 'Deep Square Leg', ...coordsOf(polar(250, 0.92)), probability: 0.15, isBoundary: true, isLegSide: true },
  { name: 'Long-Off', ...coordsOf(polar(160, 0.92)), probability: 0.12, isBoundary: true, isLegSide: false },
  { name: 'Deep Cover', ...coordsOf(polar(130, 0.91)), probability: 0.12, isBoundary: true, isLegSide: false },
  { name: 'Point', ...coordsOf(polar(100, 0.55)), probability: 0.06, isBoundary: false, isLegSide: false },
  { name: 'Third Man', ...coordsOf(polar(70, 0.90)), probability: 0.05, isBoundary: true, isLegSide: false },
  { name: 'Mid-Wicket (inner)', ...coordsOf(polar(230, 0.48)), probability: 0.03, isBoundary: false, isLegSide: true },
  { name: 'Extra Cover', ...coordsOf(polar(145, 0.52)), probability: 0.02, isBoundary: false, isLegSide: false },
];

const deathOverAIField: FielderPosition[] = [
  { positionName: 'Deep Mid-Wicket', ...coordsOf(polar(220, 0.93)), reasoning: 'Primary scoring zone for this batter — must be covered.' },
  { positionName: 'Long-On', ...coordsOf(polar(193, 0.93)), reasoning: 'Second most likely boundary target for aggressive leg-side hitting.' },
  { positionName: 'Deep Square Leg', ...coordsOf(polar(252, 0.92)), reasoning: 'Protects against sweeps and pulls to fine/square leg boundary.' },
  { positionName: 'Long-Off', ...coordsOf(polar(162, 0.92)), reasoning: 'Essential death-over position to prevent straight drives for six.' },
  { positionName: 'Deep Cover', ...coordsOf(polar(128, 0.92)), reasoning: 'Covers off-side boundary — batter can still drive here.' },
  { positionName: 'Fine Leg', ...coordsOf(polar(285, 0.91)), reasoning: 'Protects glanced/flicked shots behind square on leg side.' },
  { positionName: 'Third Man', ...coordsOf(polar(68, 0.91)), reasoning: 'Prevents easy boundary from outside-off nicks and slashes.' },
  { positionName: 'Mid-On', ...coordsOf(polar(185, 0.45)), reasoning: 'Saves singles inside circle and supports Long-On.' },
  { positionName: 'Mid-Off', ...coordsOf(polar(170, 0.44)), reasoning: 'Cuts off straight drives and supports Long-Off coverage.' },
];

// ─── SCENARIO 2: Spin Pressure (LHB vs Leg-Spin) ────────────────────────────
const spinPressureShots: ShotZone[] = [
  { name: 'Deep Cover (leg for LHB)', ...coordsOf(polar(310, 0.92)), probability: 0.22, isBoundary: true, isLegSide: false },
  { name: 'Deep Point (off for LHB)', ...coordsOf(polar(280, 0.91)), probability: 0.18, isBoundary: true, isLegSide: false },
  { name: 'Mid-Wicket (leg for LHB)', ...coordsOf(polar(135, 0.91)), probability: 0.16, isBoundary: true, isLegSide: true },
  { name: 'Long-Off (LHB)', ...coordsOf(polar(340, 0.92)), probability: 0.12, isBoundary: true, isLegSide: false },
  { name: 'Square Leg (LHB)', ...coordsOf(polar(100, 0.55)), probability: 0.10, isBoundary: false, isLegSide: true },
  { name: 'Short Third Man (LHB)', ...coordsOf(polar(250, 0.56)), probability: 0.08, isBoundary: false, isLegSide: false },
  { name: 'Long-On (LHB)', ...coordsOf(polar(165, 0.91)), probability: 0.07, isBoundary: true, isLegSide: true },
  { name: 'Slip', ...coordsOf(polar(55, 0.35)), probability: 0.04, isBoundary: false, isLegSide: false },
  { name: 'Silly Mid-On', ...coordsOf(polar(200, 0.22)), probability: 0.03, isBoundary: false, isLegSide: true },
];

const spinPressureAIField: FielderPosition[] = [
  { positionName: 'Deep Cover (LHB leg)', ...coordsOf(polar(308, 0.93)), reasoning: 'LHB frequently sweeps through cover on leg side.' },
  { positionName: 'Deep Point', ...coordsOf(polar(278, 0.92)), reasoning: 'Covers cut shots and sweeps through point.' },
  { positionName: 'Deep Mid-Wicket (LHB)', ...coordsOf(polar(133, 0.92)), reasoning: 'Protects mid-wicket boundary for LHB drives.' },
  { positionName: 'Long-Off (LHB)', ...coordsOf(polar(340, 0.92)), reasoning: 'Restricts straight hits from LHB.' },
  { positionName: 'Square Leg (saving)', ...coordsOf(polar(100, 0.58)), reasoning: 'Inner circle — cuts off singles and picks up wicket chances.' },
  { positionName: 'Slip', ...coordsOf(polar(55, 0.35)), reasoning: 'Leg-spin creates edge opportunities — slip essential.' },
  { positionName: 'Long-On (LHB)', ...coordsOf(polar(163, 0.92)), reasoning: 'Covers LHB straight hits over long-on.' },
  { positionName: 'Silly Mid-On', ...coordsOf(polar(198, 0.22)), reasoning: 'Attacking position for bat-pad catches on the turn.' },
  { positionName: 'Short Third Man (LHB)', ...coordsOf(polar(250, 0.54)), reasoning: 'Saves deflections behind on off side for LHB.' },
];

// ─── SCENARIO 3: Powerplay Defence (RHB vs Fast, field restrictions) ─────────
const powerplayShots: ShotZone[] = [
  { name: 'Cover Drive', ...coordsOf(polar(130, 0.72)), probability: 0.24, isBoundary: false, isLegSide: false },
  { name: 'Off Drive', ...coordsOf(polar(150, 0.70)), probability: 0.18, isBoundary: false, isLegSide: false },
  { name: 'Straight Drive', ...coordsOf(polar(178, 0.68)), probability: 0.14, isBoundary: false, isLegSide: false },
  { name: 'Square Cut', ...coordsOf(polar(95, 0.62)), probability: 0.12, isBoundary: false, isLegSide: false },
  { name: 'Flick (leg)', ...coordsOf(polar(215, 0.60)), probability: 0.10, isBoundary: false, isLegSide: true },
  { name: 'Third Man boundary', ...coordsOf(polar(68, 0.90)), probability: 0.08, isBoundary: true, isLegSide: false },
  { name: 'Fine Leg boundary', ...coordsOf(polar(285, 0.90)), probability: 0.07, isBoundary: true, isLegSide: true },
  { name: 'Slip', ...coordsOf(polar(55, 0.33)), probability: 0.05, isBoundary: false, isLegSide: false },
  { name: 'Forward Short Leg', ...coordsOf(polar(215, 0.25)), probability: 0.02, isBoundary: false, isLegSide: true },
];

const powerplayAIField: FielderPosition[] = [
  { positionName: 'Cover', ...coordsOf(polar(130, 0.65)), reasoning: 'Must cover aggressive cover drives inside the PP circle.' },
  { positionName: 'Extra Cover', ...coordsOf(polar(143, 0.62)), reasoning: 'Second cover position to reduce run rate through covers.' },
  { positionName: 'Mid-Off (inner)', ...coordsOf(polar(160, 0.46)), reasoning: 'Saving singles and supporting off-drive coverage.' },
  { positionName: 'Point', ...coordsOf(polar(95, 0.60)), reasoning: 'Cuts off square cut and covers off-side singles.' },
  { positionName: 'Slip', ...coordsOf(polar(54, 0.34)), reasoning: 'Fast bowler edge — slip is essential in powerplay.' },
  { positionName: 'Mid-On (inner)', ...coordsOf(polar(195, 0.46)), reasoning: 'Saves flick singles on leg side in powerplay.' },
  { positionName: 'Square Leg', ...coordsOf(polar(268, 0.55)), reasoning: 'Inner circle on leg side — PP restriction compliant.' },
  { positionName: 'Fine Leg', ...coordsOf(polar(285, 0.90)), reasoning: 'One deep fielder allowed in PP — fine leg protects glances.' },
  { positionName: 'Third Man', ...coordsOf(polar(68, 0.91)), reasoning: 'One more deep placement — protects edge/slash boundary.' },
];

// Utility
function coordsOf([x, y]: [number, number]): { x: number; y: number } {
  return { x, y };
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'death-over',
    name: 'Death-Over Attack',
    label: 'Death Overs',
    match: 'India vs Australia (Simulated T20)',
    format: 'T20',
    innings: '2nd Innings',
    score: '142/3',
    overs: '16.0',
    batter: 'Right-handed aggressive batter',
    batterHand: 'right',
    bowler: 'Right-arm fast bowler',
    bowlerType: 'right-arm-fast',
    situation: 'Preparing for a death over — batter targeting leg-side boundaries',
    batterTendency: 'Frequently targets deep mid-wicket and long-on. Pulls and hooks against short balls. Dangerous with the ramp shot over fine leg.',
    recentPerformance: '22 runs from last 8 balls — extremely aggressive form',
    shotZones: deathOverShots,
    aiField: deathOverAIField,
    description: 'The batter is in explosive form targeting leg-side boundaries. The fast bowler needs strong boundary protection.',
    tags: ['High boundary threat', 'Leg-side dominant', 'Fast bowling', 'T20 death overs'],
  },
  {
    id: 'spin-pressure',
    name: 'Spin Pressure',
    label: 'Spin Trap',
    match: 'England vs India (Simulated Test)',
    format: 'Test',
    innings: '1st Innings',
    score: '187/4',
    overs: '62.3',
    batter: 'Left-handed batter (sweep specialist)',
    batterHand: 'left',
    bowler: 'Right-arm leg-spinner',
    bowlerType: 'leg-spin',
    situation: 'Middle session — spinner building pressure, looking for wickets',
    batterTendency: 'Frequently sweeps to the off side (leg side for LHB). Drives through mid-wicket. Struggles against balls turning away.',
    recentPerformance: '34 off 78 balls — patient but looking to sweep',
    shotZones: spinPressureShots,
    aiField: spinPressureAIField,
    description: 'Left-handed batter facing leg-spin. Slip and bat-pad positions create wicket opportunities while covering sweep zones.',
    tags: ['Test cricket', 'Leg-spin', 'Left-handed batter', 'Attacking field', 'Wicket opportunity'],
  },
  {
    id: 'powerplay-defence',
    name: 'Powerplay Defence',
    label: 'Powerplay',
    match: 'Australia vs New Zealand (Simulated ODI)',
    format: 'ODI',
    innings: '1st Innings',
    score: '28/0',
    overs: '5.0',
    batter: 'Right-handed opener (cover drive specialist)',
    batterHand: 'right',
    bowler: 'Right-arm fast bowler',
    bowlerType: 'right-arm-fast',
    situation: 'Powerplay — only 2 fielders outside the circle allowed',
    batterTendency: 'Excellent cover driver. Square cuts frequently. Takes on the short ball with a pull. Tends to edge early in innings.',
    recentPerformance: '12 off 18 balls — timing perfectly but edgy outside off',
    shotZones: powerplayShots,
    aiField: powerplayAIField,
    description: 'Powerplay fielding restrictions — only 2 fielders outside. Maximum pressure on the batter who loves the cover drive.',
    tags: ['ODI Powerplay', 'Field restrictions', 'Cover drive threat', 'Edge opportunity', 'Slip essential'],
  },
];

export const DEFAULT_SCENARIO = SCENARIOS[0];

// Default fielder positions (for RHB fast bowling scenario)
export const DEFAULT_FIELDER_POSITIONS = [
  { id: 'f1', name: 'Fine Leg', x: polar(285, 0.91)[0], y: polar(285, 0.91)[1] },
  { id: 'f2', name: 'Square Leg', x: polar(260, 0.57)[0], y: polar(260, 0.57)[1] },
  { id: 'f3', name: 'Mid-Wicket', x: polar(230, 0.47)[0], y: polar(230, 0.47)[1] },
  { id: 'f4', name: 'Mid-On', x: polar(192, 0.45)[0], y: polar(192, 0.45)[1] },
  { id: 'f5', name: 'Mid-Off', x: polar(168, 0.44)[0], y: polar(168, 0.44)[1] },
  { id: 'f6', name: 'Cover', x: polar(135, 0.57)[0], y: polar(135, 0.57)[1] },
  { id: 'f7', name: 'Point', x: polar(100, 0.56)[0], y: polar(100, 0.56)[1] },
  { id: 'f8', name: 'Gully', x: polar(72, 0.42)[0], y: polar(72, 0.42)[1] },
  { id: 'f9', name: 'Third Man', x: polar(65, 0.90)[0], y: polar(65, 0.90)[1] },
];

// Fixed positions for bowler and wicketkeeper
export const BOWLER_POSITION = { x: CX, y: CY - 55 };
export const KEEPER_POSITION = { x: CX + 3, y: CY + 38 };

export const SVG_CX = CX;
export const SVG_CY = CY;
export const SVG_BOUNDARY_R = BOUNDARY_R;
export const SVG_INNER_R = INNER_R;
