import { useRef, useCallback, useMemo } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import type { AutomationLane } from '@/types';

interface Props {
  lane: AutomationLane;
  totalBeats: number;
  hZoom: number;
  height?: number;
}

const LANE_HEIGHT = 60;

export function AutomationLaneRow({ lane, totalBeats, hZoom, height = LANE_HEIGHT }: Props) {
  const { updateAutomationLane } = useProjectStore();
  const svgRef = useRef<SVGSVGElement>(null);
  const totalWidth = totalBeats * hZoom;

  // Build SVG path from points
  const pathD = useMemo(() => {
    if (lane.points.length === 0) return '';
    const sorted = [...lane.points].sort((a, b) => a.beat - b.beat);
    return sorted.map((pt, i) => {
      const x = (pt.beat / totalBeats) * totalWidth;
      const y = height - (pt.value * height);
      return (i === 0 ? 'M' : 'L') + `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }, [lane.points, totalBeats, totalWidth, height]);

  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;
    const beat = (relX / totalWidth) * totalBeats;
    const value = 1 - (relY / height);
    const newPoint = {
      id: `pt-${Date.now()}`,
      beat: Math.max(0, beat),
      value: Math.min(1, Math.max(0, value)),
      curve: 'linear' as const,
    };
    updateAutomationLane(lane.id, { points: [...lane.points, newPoint] });
  }, [updateAutomationLane, lane.id, lane.points, totalBeats, totalWidth, height]);

  return (
    <div
      className="relative border-b border-forge-border bg-forge-bg/50"
      style={{ height, width: totalWidth, minWidth: '100%' }}
    >
      {/* Label */}
      <span className="absolute left-2 top-1 text-[9px] text-forge-muted font-mono uppercase z-10 pointer-events-none">
        {lane.name}
      </span>

      <svg
        ref={svgRef}
        width={totalWidth}
        height={height}
        onClick={handleClick}
        className="cursor-crosshair"
      >
        {/* Zero line */}
        <line
          x1={0} y1={height / 2}
          x2={totalWidth} y2={height / 2}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={1}
        />

        {/* Path */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke="#06b6d4"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Fill under path */}
        {pathD && (
          <path
            d={`${pathD} L${totalWidth},${height} L0,${height} Z`}
            fill="rgba(6,182,212,0.08)"
            stroke="none"
          />
        )}

        {/* Control points */}
        {lane.points.map((pt) => {
          const x = (pt.beat / totalBeats) * totalWidth;
          const y = height - (pt.value * height);
          return (
            <circle
              key={pt.beat}
              cx={x}
              cy={y}
              r={3}
              fill="#06b6d4"
              stroke="#14172a"
              strokeWidth={1.5}
              className="cursor-move"
            />
          );
        })}
      </svg>
    </div>
  );
}
