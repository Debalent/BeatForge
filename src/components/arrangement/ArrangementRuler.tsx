import { useRef, RefObject } from 'react';
import { useTransportStore } from '@/stores/transportStore';

interface ArrangementRulerProps {
  totalBeats: number;
  zoom: number;
  scrollEl: RefObject<HTMLDivElement | null>;
}

export function ArrangementRuler({ totalBeats, zoom }: ArrangementRulerProps) {
  const { timeSignature, seekTo } = useTransportStore();
  const [beatsPerBar] = timeSignature;
  const totalBars = Math.ceil(totalBeats / beatsPerBar);

  return (
    <div
      className="relative h-full bg-forge-surface border-b border-forge-border overflow-hidden"
      style={{ width: totalBeats * zoom, minWidth: '100%' }}
      onClick={(e) => {
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        seekTo((e.clientX - rect.left) / zoom);
      }}
    >
      {Array.from({ length: totalBars + 1 }).map((_, bar) => {
        const beat = bar * beatsPerBar;
        const x    = beat * zoom;
        const showText = zoom >= 12 || bar % Math.ceil(4 / (zoom / 20)) === 0;
        return (
          <div key={bar} className="absolute top-0 bottom-0 flex flex-col justify-end pb-0.5" style={{ left: x }}>
            <div className="absolute top-0 bottom-0 w-px bg-forge-border opacity-60" />
            {showText && (
              <span className="relative text-2xs text-forge-text-dim pl-1 leading-none">
                {bar + 1}
              </span>
            )}
            {/* Sub-divisions */}
            {zoom > 24 && Array.from({ length: beatsPerBar - 1 }).map((_, b) => {
              const bx = x + (b + 1) * zoom;
              return (
                <div
                  key={b}
                  className="absolute top-0 bottom-0 w-px opacity-20"
                  style={{ left: bx - x, backgroundColor: '#ffffff' }}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
