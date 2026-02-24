import { useRef, useCallback, useMemo } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { useTransportStore } from '@/stores/transportStore';
import { TrackHeader } from './TrackHeader';
import { TrackLane } from './TrackLane';
import { ArrangementRuler } from './ArrangementRuler';
import { PlayheadCursor } from './PlayheadCursor';
import { AutomationLaneRow } from './AutomationLaneRow';
import { Plus } from 'lucide-react';
import type { Track } from '@/types';

const TRACK_HEIGHT = 40;

export function Arrangement() {
  const { project, addTrack } = useProjectStore();
  const { hZoom, selectedTrackIds, setSelectedTracks } = useUIStore();
  const { currentBeat } = useTransportStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const sortedTracks = useMemo(
    () => [...project.tracks].sort((a, b) => a.order - b.order),
    [project.tracks]
  );

  const totalBeats = useMemo(() => {
    const lastBeat = project.arrangement.reduce(
      (max, c) => Math.max(max, c.startBeat + c.length), 0
    );
    return Math.max(lastBeat + 32, 128);
  }, [project.arrangement]);

  const totalWidth = totalBeats * hZoom;

  const handleTrackClick = useCallback((id: string, multi: boolean) => {
    if (multi) {
      setSelectedTracks(
        selectedTrackIds.includes(id)
          ? selectedTrackIds.filter((t) => t !== id)
          : [...selectedTrackIds, id]
      );
    } else {
      setSelectedTracks([id]);
    }
  }, [selectedTrackIds, setSelectedTracks]);

  return (
    <div className="flex flex-col w-full h-full bg-forge-bg overflow-hidden">
      {/* Header row (track headers + ruler) */}
      <div className="flex shrink-0 border-b border-forge-border" style={{ height: 28 }}>
        <div className="w-52 shrink-0 bg-forge-surface border-r border-forge-border flex items-center px-2">
          <span className="text-2xs text-forge-text-dim uppercase tracking-wider">Tracks</span>
          <button
            className="ml-auto toolbar-btn w-5 h-5"
            title="Add Track"
            onClick={() => addTrack()}
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden" ref={scrollRef}>
          <ArrangementRuler totalBeats={totalBeats} zoom={hZoom} scrollEl={scrollRef} />
        </div>
      </div>

      {/* Track rows */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Track headers column */}
        <div className="w-52 shrink-0 overflow-y-auto bg-forge-surface border-r border-forge-border">
          {sortedTracks.map((track) => (
            <div key={track.id}>
              <TrackHeader
                track={track}
                selected={selectedTrackIds.includes(track.id)}
                height={track.height || TRACK_HEIGHT}
                onClick={(e) => handleTrackClick(track.id, e.ctrlKey || e.metaKey)}
              />
              {/* Automation lane headers */}
              {project.automationLanes
                .filter((l) => l.targetId === track.id && l.visible)
                .map((lane) => (
                  <div
                    key={lane.id}
                    className="bg-forge-panel border-b border-forge-border flex items-center px-2"
                    style={{ height: lane.height }}
                  >
                    <span className="text-2xs text-forge-text-muted truncate">{lane.name}</span>
                  </div>
                ))
              }
            </div>
          ))}
          {/* Add track button */}
          <button
            className="w-full h-8 flex items-center gap-2 px-3 text-forge-text-dim hover:text-forge-text hover:bg-forge-muted text-xs transition-colors border-b border-forge-border"
            onClick={() => addTrack()}
          >
            <Plus className="w-3 h-3" /> Add Track
          </button>
        </div>

        {/* Scrollable lanes */}
        <div
          className="flex-1 overflow-auto relative"
          ref={scrollRef}
          onScroll={(e) => {
            // Sync ruler scroll
            const ruler = scrollRef.current?.previousElementSibling as HTMLElement | null;
            if (ruler) ruler.scrollLeft = (e.target as HTMLElement).scrollLeft;
          }}
        >
          {/* Grid + playhead */}
          <div className="relative" ref={contentRef} style={{ width: totalWidth, minHeight: '100%' }}>
            {/* Beat grid */}
            <div className="absolute inset-0 seq-grid pointer-events-none" style={{ '--cell-w': `${hZoom}px`, '--track-h': `${TRACK_HEIGHT}px` } as React.CSSProperties} />

            {/* Track lanes */}
            {sortedTracks.map((track) => (
              <div key={track.id}>
                <TrackLane
                  track={track}
                  height={track.height || TRACK_HEIGHT}
                  clips={project.arrangement.filter((c) => c.trackId === track.id)}
                  patterns={project.patterns}
                  zoom={hZoom}
                />
                {/* Automation lanes */}
                {project.automationLanes
                  .filter((l) => l.targetId === track.id && l.visible)
                  .map((lane) => (
                    <AutomationLaneRow key={lane.id} lane={lane} totalBeats={totalBeats} hZoom={hZoom} height={lane.height} />
                  ))
                }
              </div>
            ))}

            {/* Playhead */}
            <PlayheadCursor totalWidth={totalWidth} trackHeight={TRACK_HEIGHT} trackCount={sortedTracks.length} />
          </div>
        </div>
      </div>
    </div>
  );
}
