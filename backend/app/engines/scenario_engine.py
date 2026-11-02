"""
Scenario data — matches frontend scenarios.ts exactly.
"""
from dataclasses import dataclass, field
from typing import List, Dict


@dataclass
class ShotZone:
    name: str
    x: float
    y: float
    probability: float
    is_boundary: bool
    is_leg_side: bool


@dataclass
class AIFieldPosition:
    position_name: str
    x: float
    y: float
    reasoning: str


@dataclass
class Scenario:
    id: str
    name: str
    format: str
    batter: str
    batter_hand: str   # 'right' | 'left'
    bowler: str
    bowler_type: str
    situation: str
    batter_tendency: str
    recent_performance: str
    shot_zones: List[ShotZone]
    ai_field: List[AIFieldPosition]
    description: str


# SVG constants matching frontend
CX, CY = 250.0, 250.0
BR = 215.0  # boundary radius
IR = 108.0  # inner radius


def polar(angle_deg: float, radius_fraction: float, max_r: float = BR):
    import math
    rad = (angle_deg - 90) * (math.pi / 180)
    r = max_r * radius_fraction
    return CX + r * math.cos(rad), CY + r * math.sin(rad)


# ── Death Over ─────────────────────────────────────────────────────────────
_death_shots = [
    ShotZone('Deep Mid-Wicket', *polar(220, 0.93), 0.25, True, True),
    ShotZone('Long-On', *polar(195, 0.93), 0.20, True, True),
    ShotZone('Deep Square Leg', *polar(250, 0.92), 0.15, True, True),
    ShotZone('Long-Off', *polar(160, 0.92), 0.12, True, False),
    ShotZone('Deep Cover', *polar(130, 0.91), 0.12, True, False),
    ShotZone('Point', *polar(100, 0.55), 0.06, False, False),
    ShotZone('Third Man', *polar(70, 0.90), 0.05, True, False),
    ShotZone('Mid-Wicket (inner)', *polar(230, 0.48), 0.03, False, True),
    ShotZone('Extra Cover', *polar(145, 0.52), 0.02, False, False),
]

_death_ai = [
    AIFieldPosition('Deep Mid-Wicket', *polar(220, 0.93), 'Primary scoring zone for this batter.'),
    AIFieldPosition('Long-On', *polar(193, 0.93), 'Second most likely boundary target.'),
    AIFieldPosition('Deep Square Leg', *polar(252, 0.92), 'Protects sweeps/pulls to leg boundary.'),
    AIFieldPosition('Long-Off', *polar(162, 0.92), 'Prevents straight drives for six.'),
    AIFieldPosition('Deep Cover', *polar(128, 0.92), 'Covers off-side boundary.'),
    AIFieldPosition('Fine Leg', *polar(285, 0.91), 'Protects glanced/flicked shots.'),
    AIFieldPosition('Third Man', *polar(68, 0.91), 'Prevents boundary from nicks/slashes.'),
    AIFieldPosition('Mid-On', *polar(185, 0.45), 'Saves singles, supports Long-On.'),
    AIFieldPosition('Mid-Off', *polar(170, 0.44), 'Cuts off straight drives.'),
]

# ── Spin Pressure ──────────────────────────────────────────────────────────
_spin_shots = [
    ShotZone('Deep Cover (LHB leg)', *polar(310, 0.92), 0.22, True, False),
    ShotZone('Deep Point', *polar(280, 0.91), 0.18, True, False),
    ShotZone('Deep Mid-Wicket (LHB)', *polar(135, 0.91), 0.16, True, True),
    ShotZone('Long-Off (LHB)', *polar(340, 0.92), 0.12, True, False),
    ShotZone('Square Leg (LHB)', *polar(100, 0.55), 0.10, False, True),
    ShotZone('Short Third Man (LHB)', *polar(250, 0.56), 0.08, False, False),
    ShotZone('Long-On (LHB)', *polar(165, 0.91), 0.07, True, True),
    ShotZone('Slip', *polar(55, 0.35), 0.04, False, False),
    ShotZone('Silly Mid-On', *polar(200, 0.22), 0.03, False, True),
]

_spin_ai = [
    AIFieldPosition('Deep Cover (LHB leg)', *polar(308, 0.93), 'LHB sweeps through cover on leg side.'),
    AIFieldPosition('Deep Point', *polar(278, 0.92), 'Covers cut shots and sweeps.'),
    AIFieldPosition('Deep Mid-Wicket (LHB)', *polar(133, 0.92), 'Protects mid-wicket boundary.'),
    AIFieldPosition('Long-Off (LHB)', *polar(340, 0.92), 'Restricts straight hits.'),
    AIFieldPosition('Square Leg (saving)', *polar(100, 0.58), 'Inner circle — saves singles.'),
    AIFieldPosition('Slip', *polar(55, 0.35), 'Leg-spin creates edge opportunities.'),
    AIFieldPosition('Long-On (LHB)', *polar(163, 0.92), 'Covers LHB straight hits.'),
    AIFieldPosition('Silly Mid-On', *polar(198, 0.22), 'Bat-pad catches on the turn.'),
    AIFieldPosition('Short Third Man (LHB)', *polar(250, 0.54), 'Saves deflections behind on off side.'),
]

# ── Powerplay ──────────────────────────────────────────────────────────────
_pp_shots = [
    ShotZone('Cover Drive', *polar(130, 0.72), 0.24, False, False),
    ShotZone('Off Drive', *polar(150, 0.70), 0.18, False, False),
    ShotZone('Straight Drive', *polar(178, 0.68), 0.14, False, False),
    ShotZone('Square Cut', *polar(95, 0.62), 0.12, False, False),
    ShotZone('Flick (leg)', *polar(215, 0.60), 0.10, False, True),
    ShotZone('Third Man boundary', *polar(68, 0.90), 0.08, True, False),
    ShotZone('Fine Leg boundary', *polar(285, 0.90), 0.07, True, True),
    ShotZone('Slip', *polar(55, 0.33), 0.05, False, False),
    ShotZone('Forward Short Leg', *polar(215, 0.25), 0.02, False, True),
]

_pp_ai = [
    AIFieldPosition('Cover', *polar(130, 0.65), 'Must cover aggressive cover drives.'),
    AIFieldPosition('Extra Cover', *polar(143, 0.62), 'Second cover to reduce run rate.'),
    AIFieldPosition('Mid-Off (inner)', *polar(160, 0.46), 'Saves singles, supports cover.'),
    AIFieldPosition('Point', *polar(95, 0.60), 'Cuts off square cut and singles.'),
    AIFieldPosition('Slip', *polar(54, 0.34), 'Fast bowler edge — slip essential.'),
    AIFieldPosition('Mid-On (inner)', *polar(195, 0.46), 'Saves flick singles on leg side.'),
    AIFieldPosition('Square Leg', *polar(268, 0.55), 'Inner circle on leg side.'),
    AIFieldPosition('Fine Leg', *polar(285, 0.90), 'One deep — protects glances.'),
    AIFieldPosition('Third Man', *polar(68, 0.91), 'Protects edge/slash boundary.'),
]

SCENARIOS: Dict[str, Scenario] = {
    'death-over': Scenario(
        id='death-over',
        name='Death-Over Attack',
        format='T20',
        batter='Right-handed aggressive batter',
        batter_hand='right',
        bowler='Right-arm fast bowler',
        bowler_type='right-arm-fast',
        situation='Death over — batter targeting leg-side boundaries',
        batter_tendency='Frequently targets deep mid-wicket and long-on. Pulls/hooks against short balls. Dangerous with ramp over fine leg.',
        recent_performance='22 runs from last 8 balls — extremely aggressive',
        shot_zones=_death_shots,
        ai_field=_death_ai,
        description='Aggressive batter targeting leg-side boundaries in death overs.',
    ),
    'spin-pressure': Scenario(
        id='spin-pressure',
        name='Spin Pressure',
        format='Test',
        batter='Left-handed sweep specialist',
        batter_hand='left',
        bowler='Right-arm leg-spinner',
        bowler_type='leg-spin',
        situation='Middle session — spinner building pressure',
        batter_tendency='Frequently sweeps to off side (leg side for LHB). Drives through mid-wicket. Struggles against balls turning away.',
        recent_performance='34 off 78 balls — patient but looking to sweep',
        shot_zones=_spin_shots,
        ai_field=_spin_ai,
        description='Left-handed batter facing leg-spin — slip and bat-pad for wicket opportunities.',
    ),
    'powerplay-defence': Scenario(
        id='powerplay-defence',
        name='Powerplay Defence',
        format='ODI',
        batter='Right-handed opener (cover drive specialist)',
        batter_hand='right',
        bowler='Right-arm fast bowler',
        bowler_type='right-arm-fast',
        situation='Powerplay — only 2 fielders outside circle allowed',
        batter_tendency='Excellent cover driver. Square cuts frequently. Takes on short ball with pull. Edges early in innings.',
        recent_performance='12 off 18 balls — timing well but edgy outside off',
        shot_zones=_pp_shots,
        ai_field=_pp_ai,
        description='Powerplay restrictions — 2 fielders outside max. Cover drive threat is primary concern.',
    ),
}

