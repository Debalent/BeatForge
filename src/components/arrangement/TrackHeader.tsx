import { useCallback } from 'react';
import {
  Volume2, VolumeX, Mic2, Lock,
  ChevronDown, ChevronRight, MoreHorizontal,
} from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import type { Track } from '@/types';
import clsx from 'clsx';

interface TrackHeaderProps {
  track: Track;
  selected: boolean;
  height: number;
  onClick: (e: React.MouseEvent) => void;
}

export function TrackHeader({ track, selected, height, onClick }: TrackHeaderProps) {
  const { updateTrack, removeTrack, duplicateTrack } = useProjectStore();
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <div
      className={clsx(
        'flex items-center gap-1 px-1 border-b border-forge-border cursor-pointer group transition-colors',
        selected ? 'bg-forge-muted' : 'bg-forge-surface hover:bg-forge-panel'
      )}
      style={{ height, borderLeft: `3px solid ${track.color}` }}
      onClick={onClick}
    >
      {/* Expand */}
      <button className="text-forge-text-dim hover:text-forge-text w-4 h-4">
        <ChevronRight className="w-3 h-3" />
      </button>

      {/* Track name */}
      <TrackNameInput
        name={track.name}
        color={track.color}
        onChange={(name) => updateTrack(track.id, { name })}
      />

      {/* Controls */}
      <div className="flex items-center gap-0.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className={clsx('w-5 h-5 flex items-center justify-center rounded text-xs', track.muted ? 'text-forge-warning' : 'text-forge-text-muted hover:text-forge-text')}
          title="Mute (M)"
          onClick={(e) => { e.stopPropagation(); updateTrack(track.id, { muted: !track.muted }); }}
        >
          {track.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
        </button>
        <button
          className={clsx('w-5 h-5 flex items-center justify-center rounded text-xs', track.soloed ? 'text-forge-highlight' : 'text-forge-text-muted hover:text-forge-text')}
          title="Solo (S)"
          onClick={(e) => { e.stopPropagation(); updateTrack(track.id, { soloed: !track.soloed }); }}
        >
          S
        </button>
        <button
          className={clsx('w-5 h-5 flex items-center justify-center rounded text-xs', track.armed ? 'text-forge-danger' : 'text-forge-text-muted hover:text-forge-text')}
          title="Arm for recording (R)"
          onClick={(e) => { e.stopPropagation(); updateTrack(track.id, { armed: !track.armed }); }}
        >
          <Mic2 className="w-3 h-3" />
        </button>
      </div>

      {/* Context menu */}
      <div className="relative">
        <button
          className="w-5 h-5 flex items-center justify-center rounded text-forge-text-dim hover:text-forge-text opacity-0 group-hover:opacity-100 transition-opacity ml-0.5"
          onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
        >
          <MoreHorizontal className="w-3 h-3" />
        </button>
        {menuOpen && (
          <div className="absolute left-full top-0 context-menu z-50">
            {[
              { label: 'Rename',    action: () => {} },
              { label: 'Duplicate', action: () => { duplicateTrack(track.id); } },
              { label: 'Color', action: () => {} },
              { label: 'Lock',   action: () => updateTrack(track.id, { locked: !track.locked }) },
              { label: 'Delete', action: () => removeTrack(track.id) },
            ].map((item) => (
              <button
                key={item.label}
                className="context-menu-item w-full text-left"
                onClick={(e) => { e.stopPropagation(); item.action(); setMenuOpen(false); }}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Inline name editor ───────────────────────────────────────
import React, { useState } from 'react';

function TrackNameInput({ name, color, onChange }: { name: string; color: string; onChange: (n: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(name);

  if (editing) {
    return (
      <input
        autoFocus
        className="flex-1 bg-forge-bg border border-forge-accent rounded px-1 text-xs text-forge-text focus:outline-none"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => { onChange(val); setEditing(false); }}
        onKeyDown={(e) => { if (e.key === 'Enter') { onChange(val); setEditing(false); } }}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <span
      className="flex-1 text-xs truncate text-forge-text cursor-text"
      style={{ color }}
      onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}
    >
      {name}
    </span>
  );
}
