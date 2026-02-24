import { useRef, useCallback } from 'react';
import { useDrop } from 'react-dnd';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { ClipBlock } from './ClipBlock';
import type { Track, ArrangementClip, Pattern } from '@/types';

interface TrackLaneProps {
  track: Track;
  height: number;
  clips: ArrangementClip[];
  patterns: Pattern[];
  zoom: number;
}

export function TrackLane({ track, height, clips, patterns, zoom }: TrackLaneProps) {
  const { addPattern, moveClip, updateClip } = useProjectStore();
  const { editMode, snap, snapEnabled } = useUIStore();
  const laneRef = useRef<HTMLDivElement>(null);

  // Drop target for moving clips between tracks
  const [, dropRef] = useDrop<{ id: string; offsetBeat: number }, void, void>({
    accept: 'CLIP',
    drop(item, monitor) {
      const offset = monitor.getClientOffset();
      if (!offset || !laneRef.current) return;
      const rect = laneRef.current.getBoundingClientRect();
      let beat = (offset.x - rect.left) / zoom - item.offsetBeat;
      if (snapEnabled) beat = snapBeat(beat, snap);
      moveClip(item.id, track.id, Math.max(0, beat));
    },
  });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (editMode !== 'draw') return;
    if (!laneRef.current) return;
    const rect = laneRef.current.getBoundingClientRect();
    let beat = (e.clientX - rect.left) / zoom;
    if (snapEnabled) beat = snapBeat(beat, snap);
    addPattern(track.id, Math.max(0, beat));
  }, [editMode, zoom, snap, snapEnabled, track.id, addPattern]);

  const combinedRef = useCallback((node: HTMLDivElement | null) => {
    (laneRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    dropRef(node);
  }, [dropRef]);

  return (
    <div
      ref={combinedRef}
      className="relative border-b border-forge-border"
      style={{ height, minWidth: '100%' }}
      onMouseDown={handleMouseDown}
    >
      {clips.map((clip) => {
        const pattern = patterns.find((p) => p.id === clip.patternId);
        return (
          <ClipBlock
            key={clip.id}
            clip={clip}
            pattern={pattern}
            trackColor={track.color}
            zoom={zoom}
          />
        );
      })}
    </div>
  );
}

// ─── Snap helper ──────────────────────────────────────────────
function snapBeat(beat: number, snapVal: string): number {
  const map: Record<string, number> = {
    'bar': 4, '1/2': 2, '1/4': 1, '1/8': 0.5,
    '1/16': 0.25, '1/32': 0.125, '1/64': 0.0625, 'none': 0,
  };
  const grid = map[snapVal] ?? 0.25;
  if (grid === 0) return beat;
  return Math.round(beat / grid) * grid;
}
