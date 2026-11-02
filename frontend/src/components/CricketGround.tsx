import React, { useRef, useState, useCallback, useEffect } from 'react';
import type { Fielder, Scenario, EvaluationResult } from '../types/field';
import { clampToBoundary, isTooClose, getPositionName } from '../utils/evaluationEngine';
import { SVG_CX, SVG_CY, SVG_BOUNDARY_R, SVG_INNER_R, BOWLER_POSITION, KEEPER_POSITION } from '../data/scenarios';
import { Eye, Shield, Sparkles } from 'lucide-react';

interface CricketGroundProps {
  fielders: Fielder[];
  onFieldersChange: (fielders: Fielder[]) => void;
  aiFielders?: Fielder[];
  showAIField: boolean;
  evaluation: EvaluationResult | null;
  showHeatmap: boolean;
  scenario: Scenario;
  isLocked: boolean;
  selectedId?: string | null;
  onSelectFielder?: (id: string | null) => void;
}

const VIEWBOX_SIZE = 500;
const PITCH_W = 16;
const PITCH_H = 74;

export default function CricketGround({
  fielders,
  onFieldersChange,
  aiFielders,
  showAIField,
  evaluation,
  showHeatmap,
  scenario,
  isLocked,
  selectedId: controlledSelectedId,
  onSelectFielder,
}: CricketGroundProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
  const dragOffset = useRef({ dx: 0, dy: 0 });

  const activeSelectedId = controlledSelectedId !== undefined ? controlledSelectedId : internalSelectedId;

  const handleSelect = (id: string | null) => {
    if (onSelectFielder) {
      onSelectFielder(id);
    } else {
      setInternalSelectedId(id);
    }
  };

  // Convert screen coordinates to SVG coordinates
  const screenToSVG = useCallback((screenX: number, screenY: number): { x: number; y: number } => {
    if (!svgRef.current) return { x: screenX, y: screenY };
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = VIEWBOX_SIZE / rect.width;
    const scaleY = VIEWBOX_SIZE / rect.height;
    return {
      x: (screenX - rect.left) * scaleX,
      y: (screenY - rect.top) * scaleY,
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    if (isLocked) return;
    e.preventDefault();
    e.stopPropagation();
    const svgPos = screenToSVG(e.clientX, e.clientY);
    const fielder = fielders.find(f => f.id === id);
    if (!fielder) return;
    dragOffset.current = { dx: svgPos.x - fielder.x, dy: svgPos.y - fielder.y };
    setDraggingId(id);
    handleSelect(id);
  }, [isLocked, fielders, screenToSVG]);

  const handleTouchStart = useCallback((e: React.TouchEvent, id: string) => {
    if (isLocked) return;
    e.preventDefault();
    const touch = e.touches[0];
    const svgPos = screenToSVG(touch.clientX, touch.clientY);
    const fielder = fielders.find(f => f.id === id);
    if (!fielder) return;
    dragOffset.current = { dx: svgPos.x - fielder.x, dy: svgPos.y - fielder.y };
    setDraggingId(id);
    handleSelect(id);
  }, [isLocked, fielders, screenToSVG]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingId) return;
    const svgPos = screenToSVG(e.clientX, e.clientY);
    const newX = svgPos.x - dragOffset.current.dx;
    const newY = svgPos.y - dragOffset.current.dy;
    const clamped = clampToBoundary(newX, newY);

    // Check for overlap with other fielders
    const others = fielders.filter(f => f.id !== draggingId);
    const tooClose = others.some(f => isTooClose(clamped.x, clamped.y, f.x, f.y));

    if (!tooClose) {
      const posName = getPositionName(clamped.x, clamped.y);
      onFieldersChange(fielders.map(f =>
        f.id === draggingId ? { ...f, x: clamped.x, y: clamped.y, name: posName } : f
      ));
    }
  }, [draggingId, fielders, onFieldersChange, screenToSVG]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!draggingId) return;
    e.preventDefault();
    const touch = e.touches[0];
    const svgPos = screenToSVG(touch.clientX, touch.clientY);
    const newX = svgPos.x - dragOffset.current.dx;
    const newY = svgPos.y - dragOffset.current.dy;
    const clamped = clampToBoundary(newX, newY);
    const others = fielders.filter(f => f.id !== draggingId);
    const tooClose = others.some(f => isTooClose(clamped.x, clamped.y, f.x, f.y));
    if (!tooClose) {
      const posName = getPositionName(clamped.x, clamped.y);
      onFieldersChange(fielders.map(f =>
        f.id === draggingId ? { ...f, x: clamped.x, y: clamped.y, name: posName } : f
      ));
    }
  }, [draggingId, fielders, onFieldersChange, screenToSVG]);

  const handleMouseUp = useCallback(() => {
    setDraggingId(null);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove]);

  // Heatmap rendering
  const renderHeatmap = () => {
    if (!showHeatmap || !evaluation) return null;
    return (
      <g className="heatmap-zones" opacity={0.65}>
        {evaluation.zoneScores.map((zs, i) => {
          const zone = scenario.shotZones.find(sz => sz.name === zs.zoneName);
          if (!zone) return null;
          const r = 36 + zone.probability * 85;
          const cov = zs.coverage;
          const red = Math.round((1 - cov) * 230);
          const green = Math.round(cov * 190);
          const color = `rgb(${red},${green},45)`;
          return (
            <circle
              key={i}
              cx={zone.x}
              cy={zone.y}
              r={r}
              fill={color}
              opacity={0.48 + zone.probability * 0.45}
              style={{ filter: 'blur(16px)' }}
            />
          );
        })}
      </g>
    );
  };

  // Shot probability dots
  const renderShotZones = () => {
    return scenario.shotZones.map((zone, i) => (
      <g key={i} opacity={0.55}>
        <circle
          cx={zone.x}
          cy={zone.y}
          r={5 + zone.probability * 22}
          fill={zone.isBoundary ? '#f59e0b' : '#38bdf8'}
          opacity={0.18}
        />
        <circle
          cx={zone.x}
          cy={zone.y}
          r={2}
          fill={zone.isBoundary ? '#f59e0b' : '#38bdf8'}
          opacity={0.6}
        />
      </g>
    ));
  };

  const cx = SVG_CX;
  const cy = SVG_CY;
  const br = SVG_BOUNDARY_R;
  const ir = SVG_INNER_R;

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Stadium outer glow container */}
      <div className="relative w-full max-w-[500px] aspect-square rounded-full p-2 bg-gradient-to-b from-slate-900/90 to-emerald-950/20 shadow-2xl border border-slate-800/80">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
          className={`w-full h-full cricket-ground select-none ${draggingId ? 'cursor-grabbing' : ''}`}
          style={{ touchAction: 'none' }}
          onClick={() => handleSelect(null)}
        >
          <defs>
            {/* Ground lush grass radial gradient */}
            <radialGradient id="groundGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e5434" />
              <stop offset="45%" stopColor="#17502e" />
              <stop offset="75%" stopColor="#144226" />
              <stop offset="100%" stopColor="#0c2d19" />
            </radialGradient>
            
            {/* Outfield mow stripes pattern */}
            <linearGradient id="pitchGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#dfcbaf" />
              <stop offset="50%" stopColor="#d3be9e" />
              <stop offset="100%" stopColor="#c5ad8a" />
            </linearGradient>

            <filter id="fielderGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="aiGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="groundShadow">
              <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#000000" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* ── Outer drop shadow ellipse ── */}
          <ellipse cx={cx} cy={cy} rx={br + 4} ry={br + 4} fill="rgba(0,0,0,0.5)" filter="url(#groundShadow)" />

          {/* ── Ground base circle ── */}
          <ellipse cx={cx} cy={cy} rx={br} ry={br} fill="url(#groundGrad)" />

          {/* ── Professional lawn mower rings ── */}
          {[0, 1, 2, 3, 4, 5].map(i => (
            <ellipse
              key={i}
              cx={cx}
              cy={cy}
              rx={br - i * 35}
              ry={br - i * 35}
              fill="none"
              stroke="rgba(0,0,0,0.07)"
              strokeWidth={17}
            />
          ))}

          {/* ── Heatmap overlay (under players) ── */}
          {renderHeatmap()}

          {/* ── Shot zone visual hints ── */}
          {!showHeatmap && renderShotZones()}

          {/* ── Boundary rope with 3D ring effect ── */}
          <ellipse
            cx={cx}
            cy={cy}
            rx={br}
            ry={br}
            fill="none"
            stroke="#ffffff"
            strokeWidth={3}
            strokeDasharray="10 5"
            opacity={0.8}
          />
          <ellipse
            cx={cx}
            cy={cy}
            rx={br - 3}
            ry={br - 3}
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={1}
          />

          {/* ── Inner fielding circle (30-yard marker) ── */}
          <ellipse
            cx={cx}
            cy={cy}
            rx={ir}
            ry={ir}
            fill="none"
            stroke="#ffffff"
            strokeWidth={1.8}
            strokeDasharray="6 6"
            opacity={0.55}
          />
          <text
            x={cx}
            y={cy - ir + 14}
            textAnchor="middle"
            fontSize={7}
            fill="rgba(255,255,255,0.35)"
            letterSpacing="1.2"
            fontWeight="bold"
          >
            30-YARD CIRCLE
          </text>

          {/* ── Pitch Area with realistic markings ── */}
          <rect
            x={cx - PITCH_W / 2}
            y={cy - PITCH_H / 2}
            width={PITCH_W}
            height={PITCH_H}
            rx={2}
            fill="url(#pitchGrad)"
            stroke="rgba(0,0,0,0.2)"
            strokeWidth={0.5}
          />

          {/* Batting Crease */}
          <line
            x1={cx - 16}
            y1={cy + PITCH_H / 2 - 12}
            x2={cx + 16}
            y2={cy + PITCH_H / 2 - 12}
            stroke="#ffffff"
            strokeWidth={1.4}
            opacity={0.95}
          />
          {/* Bowling Crease */}
          <line
            x1={cx - 16}
            y1={cy - PITCH_H / 2 + 12}
            x2={cx + 16}
            y2={cy - PITCH_H / 2 + 12}
            stroke="#ffffff"
            strokeWidth={1.4}
            opacity={0.95}
          />

          {/* Stumps Batting End */}
          {[-3.5, 0, 3.5].map((offset, i) => (
            <line
              key={`bstump-${i}`}
              x1={cx + offset}
              y1={cy + PITCH_H / 2 - 12}
              x2={cx + offset}
              y2={cy + PITCH_H / 2 - 2}
              stroke="#ffffff"
              strokeWidth={1.8}
            />
          ))}

          {/* Stumps Bowling End */}
          {[-3.5, 0, 3.5].map((offset, i) => (
            <line
              key={`wstump-${i}`}
              x1={cx + offset}
              y1={cy - PITCH_H / 2 + 2}
              x2={cx + offset}
              y2={cy - PITCH_H / 2 + 12}
              stroke="#ffffff"
              strokeWidth={1.8}
            />
          ))}

          {/* ── Pitch Position Labels ── */}
          {[
            { label: 'FINE LEG', x: cx - 18, y: cy + br - 12, anchor: 'end' },
            { label: 'THIRD MAN', x: cx + 18, y: cy + br - 12, anchor: 'start' },
            { label: 'LONG-ON', x: cx - 75, y: cy + br + 2, anchor: 'middle' },
            { label: 'LONG-OFF', x: cx + 75, y: cy + br + 2, anchor: 'middle' },
            { label: 'MID-WICKET', x: cx - br + 12, y: cy + 18, anchor: 'start' },
            { label: 'COVER', x: cx + br - 12, y: cy + 18, anchor: 'end' },
            { label: 'SQUARE LEG', x: cx - br + 8, y: cy + 60, anchor: 'start' },
            { label: 'POINT', x: cx + br - 8, y: cy + 60, anchor: 'end' },
          ].map(({ label, x, y, anchor }, i) => (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor={anchor as 'start' | 'end' | 'middle'}
              fontSize={8}
              fill="rgba(255,255,255,0.4)"
              fontFamily="sans-serif"
              fontWeight="700"
              letterSpacing="0.8"
            >
              {label}
            </text>
          ))}

          {/* ── Leg / Off side identifiers ── */}
          <g opacity={0.75}>
            <rect x={cx - ir - 38} y={cy - 12} width={34} height={18} rx={6} fill="rgba(22,101,52,0.4)" stroke="rgba(34,197,94,0.4)" strokeWidth={0.8} />
            <text x={cx - ir - 21} y={cy} textAnchor="middle" fontSize={8.5} fill="#4ade80" fontWeight="800">
              {scenario.batterHand === 'left' ? 'OFF' : 'LEG'}
            </text>
            
            <rect x={cx + ir + 4} y={cy - 12} width={34} height={18} rx={6} fill="rgba(30,58,138,0.4)" stroke="rgba(59,130,246,0.4)" strokeWidth={0.8} />
            <text x={cx + ir + 21} y={cy} textAnchor="middle" fontSize={8.5} fill="#60a5fa" fontWeight="800">
              {scenario.batterHand === 'left' ? 'LEG' : 'OFF'}
            </text>
          </g>

          {/* ── Fixed Bowler Marker ── */}
          <g>
            <circle cx={BOWLER_POSITION.x} cy={BOWLER_POSITION.y} r={11} fill="#6d28d9" stroke="#c4b5fd" strokeWidth={1.6} />
            <text x={BOWLER_POSITION.x} y={BOWLER_POSITION.y + 4} textAnchor="middle" fontSize={9} fill="white" fontWeight="900">B</text>
            <rect x={BOWLER_POSITION.x - 22} y={BOWLER_POSITION.y - 23} width={44} height={12} rx={3} fill="rgba(15,23,42,0.85)" />
            <text x={BOWLER_POSITION.x} y={BOWLER_POSITION.y - 14} textAnchor="middle" fontSize={7} fill="#ddd6fe" fontWeight="700">BOWLER</text>
          </g>

          {/* ── Fixed Wicketkeeper Marker ── */}
          <g>
            <circle cx={KEEPER_POSITION.x} cy={KEEPER_POSITION.y} r={11} fill="#d97706" stroke="#fde68a" strokeWidth={1.6} />
            <text x={KEEPER_POSITION.x} y={KEEPER_POSITION.y + 4} textAnchor="middle" fontSize={9} fill="white" fontWeight="900">K</text>
            <rect x={KEEPER_POSITION.x - 22} y={KEEPER_POSITION.y + 16} width={44} height={12} rx={3} fill="rgba(15,23,42,0.85)" />
            <text x={KEEPER_POSITION.x} y={KEEPER_POSITION.y + 25} textAnchor="middle" fontSize={7} fill="#fef3c7" fontWeight="700">KEEPER</text>
          </g>

          {/* ── Ghost AI Recommended Fielders ── */}
          {showAIField && aiFielders && aiFielders.map(af => (
            <g key={`ai-${af.id}`} filter="url(#aiGlow)">
              <circle
                cx={af.x}
                cy={af.y}
                r={14}
                fill="rgba(251,191,36,0.18)"
                stroke="#fbbf24"
                strokeWidth={2}
                strokeDasharray="4 3"
              />
              <text x={af.x} y={af.y + 4} textAnchor="middle" fontSize={8} fill="#fef08a" fontWeight="900">
                AI
              </text>
            </g>
          ))}

          {/* ── 9 User Draggable Fielders ── */}
          {fielders.map(fielder => {
            const isDragging = draggingId === fielder.id;
            const isSelected = activeSelectedId === fielder.id;
            return (
              <g
                key={fielder.id}
                style={{ cursor: isLocked ? 'default' : 'grab' }}
                onMouseDown={e => handleMouseDown(e, fielder.id)}
                onTouchStart={e => handleTouchStart(e, fielder.id)}
                filter={isDragging ? 'url(#fielderGlow)' : undefined}
              >
                {/* Selection ring pulsing */}
                {isSelected && (
                  <circle cx={fielder.x} cy={fielder.y} r={18} fill="none" stroke="#4ade80" strokeWidth={2.2} strokeDasharray="3 2" />
                )}
                {/* Shadow */}
                <circle cx={fielder.x + 1} cy={fielder.y + 2.5} r={12} fill="rgba(0,0,0,0.5)" />
                {/* Main Body Circle */}
                <circle
                  cx={fielder.x}
                  cy={fielder.y}
                  r={12.5}
                  fill={isDragging ? '#15803d' : isSelected ? '#16a34a' : '#15803d'}
                  stroke={isDragging ? '#86efac' : isSelected ? '#4ade80' : '#22c55e'}
                  strokeWidth={2}
                />
                {/* Number */}
                <text
                  x={fielder.x}
                  y={fielder.y + 4}
                  textAnchor="middle"
                  fontSize={9.5}
                  fill="white"
                  fontWeight="900"
                >
                  {fielder.id.replace('f', '')}
                </text>

                {/* Dynamic Position label */}
                {(isSelected || isDragging) ? (
                  <g>
                    <rect
                      x={fielder.x - 32}
                      y={fielder.y - 31}
                      width={64}
                      height={15}
                      rx={4}
                      fill="rgba(15,23,42,0.92)"
                      stroke="#22c55e"
                      strokeWidth={1}
                    />
                    <text
                      x={fielder.x}
                      y={fielder.y - 20}
                      textAnchor="middle"
                      fontSize={7.5}
                      fill="#86efac"
                      fontWeight="bold"
                    >
                      {fielder.name}
                    </text>
                  </g>
                ) : (
                  <text
                    x={fielder.x}
                    y={fielder.y + 21}
                    textAnchor="middle"
                    fontSize={6}
                    fill="rgba(187,247,208,0.85)"
                    fontWeight="600"
                  >
                    {fielder.name.length > 10 ? fielder.name.substring(0, 9) + '…' : fielder.name}
                  </text>
                )}
              </g>
            );
          })}

          {/* ── Lock state badge on canvas ── */}
          {isLocked && (
            <g>
              <rect x={cx - 45} y={cy - br - 18} width={90} height={18} rx={6} fill="rgba(15,23,42,0.9)" stroke="#f59e0b" strokeWidth={1} />
              <text x={cx} y={cy - br - 6} textAnchor="middle" fontSize={8.5} fill="#fbbf24" fontWeight="bold">
                🔒 FIELD LOCKED
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Legend below the ground */}
      <div className="flex items-center gap-3.5 justify-center mt-3 text-xs flex-wrap bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-600 border border-green-400"></div>
          <span className="text-slate-300 font-medium text-[11px]">Fielders (1-9)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-purple-700 border border-purple-400"></div>
          <span className="text-slate-300 font-medium text-[11px]">Bowler</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-amber-600 border border-amber-400"></div>
          <span className="text-slate-300 font-medium text-[11px]">Keeper</span>
        </div>
        {showAIField && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full border-2 border-yellow-400 border-dashed"></div>
            <span className="text-yellow-400 font-medium text-[11px]">AI Target</span>
          </div>
        )}
        {showHeatmap && (
          <div className="flex items-center gap-2 pl-1 border-l border-slate-700">
            <span className="text-green-400 text-xs">●</span><span className="text-slate-300 text-[11px]">Safe</span>
            <span className="text-red-400 text-xs">●</span><span className="text-slate-300 text-[11px]">Exposed</span>
          </div>
        )}
      </div>
    </div>
  );
}
