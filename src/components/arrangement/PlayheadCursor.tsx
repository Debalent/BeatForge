import { useRef, useEffect } from 'react';
import { useTransportStore } from '@/stores/transportStore';
import { useUIStore } from '@/stores/uiStore';

interface Props {
  totalWidth: number;
  trackHeight: number;
  trackCount: number;
}

export function PlayheadCursor({ totalWidth, trackHeight, trackCount }: Props) {
  const { currentBeat, playing } = useTransportStore();
  const { hZoom } = useUIStore();
  const lineRef = useRef<HTMLDivElement>(null);

  const x = currentBeat * hZoom;

  useEffect(() => {
    if (lineRef.current) {
      lineRef.current.style.transform = `translateX(${x}px)`;
    }
  }, [x]);

  const totalHeight = trackCount * trackHeight + 8;

  return (
    <div
      ref={lineRef}
      className="absolute top-0 z-30 pointer-events-none will-change-transform"
      style={{ height: totalHeight, width: 2, left: 0 }}
    >
      {/* Triangle head */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2"
        style={{
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '8px solid #06b6d4',
        }}
      />
      {/* Vertical line */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-px"
        style={{
          height: totalHeight,
          background: playing
            ? 'rgba(6,182,212,0.9)'
            : 'rgba(6,182,212,0.5)',
          boxShadow: playing ? '0 0 4px #06b6d4' : 'none',
        }}
      />
    </div>
  );
}
