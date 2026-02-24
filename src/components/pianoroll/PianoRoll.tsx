import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { useTransportStore } from '@/stores/transportStore';
import { nanoid } from 'nanoid';
import { ZoomIn, ZoomOut, Lock, Unlock } from 'lucide-react';
import type { MidiNote, Pattern } from '@/types';

// ─── Constants ───────────────────────────────────────────────
const TOTAL_KEYS = 128;
const KEY_HEIGHT = 14;        // px per semitone
const PIANO_WIDTH = 56;      // left piano keyboard width
const BEAT_WIDTH_DEFAULT = 80; // px per beat at zoom=1
const MIN_NOTE_BEATS = 1 / 16;

const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
function midiToName(midi: number) {
  const oct = Math.floor(midi / 12) - 1;
  return NOTE_NAMES[midi % 12] + oct;
}
function isBlackKey(midi: number) {
  return [1,3,6,8,10].includes(midi % 12);
}
function isCNote(midi: number) { return midi % 12 === 0; }

// ─── Subcomponents ─────────────────────────────────────────
function PianoKey({ midi, onTrigger }: { midi: number; onTrigger: (m: number) => void }) {
  const black = isBlackKey(midi);
  const cNote = isCNote(midi);
  const y = (TOTAL_KEYS - 1 - midi) * KEY_HEIGHT;

  return (
    <div
      className={`absolute left-0 cursor-pointer select-none flex items-center justify-end pr-1
        ${black
          ? 'bg-forge-bg border-y border-forge-border z-10 hover:bg-forge-surface'
          : 'bg-forge-surface border-y border-forge-surface hover:bg-white/10'}
      `}
      style={{
        width: PIANO_WIDTH,
        height: KEY_HEIGHT - 1,
        top: y,
        right: 0,
      }}
      onMouseDown={() => onTrigger(midi)}
    >
      {cNote && (
        <span className={`text-[8px] ${black ? 'text-forge-muted' : 'text-forge-muted'} mr-0.5`}>
          {midiToName(midi)}
        </span>
      )}
    </div>
  );
}

interface NoteBlockProps {
  note: MidiNote;
  beatWidth: number;
  selected: boolean;
  onSelect: (id: string, multi: boolean) => void;
  onResize: (id: string, newDur: number) => void;
  onDelete: (id: string) => void;
  editMode: string;
}

function NoteBlock({ note, beatWidth, selected, onSelect, onResize, onDelete, editMode }: NoteBlockProps) {
  const y = (TOTAL_KEYS - 1 - note.pitch) * KEY_HEIGHT;
  const x = note.startBeat * beatWidth;
  const w = Math.max(note.durationBeats * beatWidth - 1, 4);
  const black = isBlackKey(note.pitch);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (editMode === 'erase') { onDelete(note.id); return; }
    onSelect(note.id, e.ctrlKey || e.metaKey);
  }, [editMode, note.id, onSelect, onDelete]);

  return (
    <div
      className={`absolute rounded-[2px] border select-none cursor-pointer transition-none
        ${selected
          ? 'border-white/70 brightness-125'
          : 'border-transparent hover:border-white/30'
        }
        ${note.muted ? 'opacity-40' : 'opacity-100'}
      `}
      style={{
        left: x,
        top: y + 1,
        width: w,
        height: KEY_HEIGHT - 2,
        background: black ? '#8b5cf6' : '#06b6d4',
        zIndex: selected ? 5 : 2,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Resize handle */}
      <div
        className="absolute right-0 top-0 w-2 h-full cursor-ew-resize"
        onMouseDown={(e) => {
          e.stopPropagation();
          const startX = e.clientX;
          const origDur = note.durationBeats;
          const onMove = (ev: MouseEvent) => {
            const dx = ev.clientX - startX;
            const newDur = Math.max(MIN_NOTE_BEATS, origDur + dx / beatWidth);
            onResize(note.id, newDur);
          };
          const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
          };
          window.addEventListener('mousemove', onMove);
          window.addEventListener('mouseup', onUp);
        }}
      />
    </div>
  );
}

// ─── Main Piano Roll ──────────────────────────────────────────
export function PianoRoll() {
  const { project, addNote, removeNote, updateNote } = useProjectStore();
  const { pianoRollPatternId, editMode, hZoom } = useUIStore();
  const { currentBeat, playing } = useTransportStore();

  const [beatWidth, setBeatWidth] = useState(BEAT_WIDTH_DEFAULT);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [snapBeats, setSnapBeats] = useState(1 / 8);
  const gridRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);

  const pattern: Pattern | undefined = useMemo(
    () => project.patterns.find((p) => p.id === pianoRollPatternId),
    [project.patterns, pianoRollPatternId]
  );

  const totalBeats = pattern ? Math.max(pattern.length, 16) : 16;
  const totalWidth = totalBeats * beatWidth;
  const totalHeight = TOTAL_KEYS * KEY_HEIGHT;

  // Update playhead position
  useEffect(() => {
    if (playheadRef.current) {
      playheadRef.current.style.transform = `translateX(${currentBeat * beatWidth}px)`;
    }
  }, [currentBeat, beatWidth]);

  // Scroll to middle C on mount
  useEffect(() => {
    if (scrollRef.current) {
      const middleC = (TOTAL_KEYS - 60) * KEY_HEIGHT;
      scrollRef.current.scrollTop = middleC - scrollRef.current.clientHeight / 2;
    }
  }, []);

  const snapBeat = useCallback((raw: number) => {
    return Math.round(raw / snapBeats) * snapBeats;
  }, [snapBeats]);

  const handleGridMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!pattern || editMode === 'select') return;
    if (e.button !== 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;
    const rawBeat = relX / beatWidth;
    const pitch = TOTAL_KEYS - 1 - Math.floor(relY / KEY_HEIGHT);

    if (editMode === 'erase') return; // handled by note blocks

    const startBeat = snapBeat(rawBeat);

    const newNote: Omit<MidiNote, 'id'> = {
      pitch,
      startBeat,
      durationBeats: snapBeats || 0.25,
      velocity: 100,
      channel: 1,
      muted: false,
    };

    const created = addNote(pattern.id, newNote);
    setSelectedNoteIds([created.id]);
  }, [pattern, editMode, beatWidth, snapBeat, snapBeats, addNote]);

  const handleNoteSelect = useCallback((id: string, multi: boolean) => {
    setSelectedNoteIds((prev) =>
      multi
        ? prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]
        : [id]
    );
  }, []);

  const handleNoteResize = useCallback((id: string, newDur: number) => {
    if (!pattern) return;
    updateNote(pattern.id, id, { durationBeats: Math.max(MIN_NOTE_BEATS, newDur) });
  }, [pattern, updateNote]);

  const handleNoteDelete = useCallback((id: string) => {
    if (!pattern) return;
    removeNote(pattern.id, id);
    setSelectedNoteIds((p) => p.filter((n) => n !== id));
  }, [pattern, removeNote]);

  const handleKeyTrigger = useCallback(async (midi: number) => {
    const { audioEngine } = await import('@/engine/AudioEngine');
    await audioEngine.init();
    const ctx = audioEngine.context;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
    g.gain.setValueAtTime(0.3, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.4);
  }, []);

  const handleDeleteSelected = useCallback((e: React.KeyboardEvent) => {
    if (!pattern) return;
    if (e.key === 'Delete' || e.key === 'Backspace') {
      selectedNoteIds.forEach((id) => removeNote(pattern.id, id));
      setSelectedNoteIds([]);
    }
  }, [pattern, selectedNoteIds, removeNote]);

  // Beat grid lines
  const gridLines = useMemo(() => {
    const lines = [];
    for (let b = 0; b <= totalBeats; b++) {
      lines.push(
        <div
          key={b}
          className="absolute top-0 bottom-0 pointer-events-none"
          style={{
            left: b * beatWidth,
            width: 1,
            background: b % 4 === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
          }}
        />
      );
    }
    return lines;
  }, [totalBeats, beatWidth]);

  // Horizontal pitch lines
  const pitchLines = useMemo(() => {
    const lines = [];
    for (let p = 0; p < TOTAL_KEYS; p++) {
      const y = p * KEY_HEIGHT;
      const midi = TOTAL_KEYS - 1 - p;
      const black = isBlackKey(midi);
      lines.push(
        <div
          key={p}
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            top: y,
            height: KEY_HEIGHT,
            background: black ? 'rgba(0,0,0,0.25)' : 'transparent',
            borderBottom: '1px solid rgba(255,255,255,0.03)',
          }}
        />
      );
    }
    return lines;
  }, []);

  if (!pianoRollPatternId || !pattern) {
    return (
      <div className="flex-1 flex items-center justify-center bg-forge-bg text-forge-muted text-sm">
        Double-click a clip in the arrangement to open the Piano Roll.
      </div>
    );
  }

  const snapOptions = [
    { label: '1/4', value: 1 / 4 },
    { label: '1/8', value: 1 / 8 },
    { label: '1/16', value: 1 / 16 },
    { label: '1/32', value: 1 / 32 },
    { label: 'Free', value: 0 },
  ];

  return (
    <div className="flex flex-col h-full bg-forge-bg text-forge-text overflow-hidden" onKeyDown={handleDeleteSelected} tabIndex={0}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-b border-forge-border bg-forge-surface shrink-0 text-xs">
        <span className="text-forge-highlight font-semibold truncate max-w-[120px]">{pattern.name}</span>
        <span className="text-forge-muted">|</span>
        <span className="text-forge-muted">{pattern.notes.length} notes</span>
        <div className="flex items-center gap-1 ml-2">
          <span className="text-forge-muted">Snap:</span>
          {snapOptions.map((s) => (
            <button
              key={s.label}
              onClick={() => setSnapBeats(s.value)}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                snapBeats === s.value
                  ? 'bg-forge-highlight/20 text-forge-highlight'
                  : 'text-forge-muted hover:text-forge-text'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <button
            className="p-1 text-forge-muted hover:text-forge-text transition-colors"
            onClick={() => setBeatWidth((w) => Math.max(20, w - 20))}
          >
            <ZoomOut size={13} />
          </button>
          <span className="text-[10px] text-forge-muted w-10 text-center">{Math.round(beatWidth)}px</span>
          <button
            className="p-1 text-forge-muted hover:text-forge-text transition-colors"
            onClick={() => setBeatWidth((w) => Math.min(400, w + 20))}
          >
            <ZoomIn size={13} />
          </button>
        </div>
      </div>

      {/* Header ruler */}
      <div className="flex shrink-0" style={{ height: 24 }}>
        <div style={{ width: PIANO_WIDTH, minWidth: PIANO_WIDTH }} className="bg-forge-surface border-b border-r border-forge-border" />
        <div className="overflow-hidden border-b border-forge-border relative flex-1" id="pr-ruler-scroll">
          <div style={{ width: totalWidth, height: 24, position: 'relative' }}>
            {Array.from({ length: totalBeats + 1 }, (_, b) => (
              b % 4 === 0 && (
                <div key={b} className="absolute top-0 text-[9px] text-forge-muted pl-1 select-none" style={{ left: b * beatWidth }}>
                  {b / 4 + 1}
                </div>
              )
            ))}
          </div>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Piano keys */}
        <div
          className="shrink-0 overflow-hidden border-r border-forge-border relative"
          style={{ width: PIANO_WIDTH, height: '100%' }}
          ref={gridRef}
        >
          <div style={{ height: totalHeight, position: 'relative', width: PIANO_WIDTH }}>
            {Array.from({ length: TOTAL_KEYS }, (_, i) => (
              <PianoKey key={i} midi={TOTAL_KEYS - 1 - i} onTrigger={handleKeyTrigger} />
            ))}
          </div>
        </div>

        {/* Note grid */}
        <div ref={scrollRef} className="flex-1 overflow-auto forge-scrollbar">
          <div
            className="relative"
            style={{ width: totalWidth, height: totalHeight, cursor: editMode === 'draw' ? 'crosshair' : 'default' }}
            onMouseDown={handleGridMouseDown}
          >
            {/* Pitch row backgrounds */}
            {pitchLines}
            {/* Beat grid vertical lines */}
            {gridLines}

            {/* Playhead */}
            <div
              ref={playheadRef}
              className="absolute top-0 bottom-0 w-px pointer-events-none z-20"
              style={{ background: playing ? 'rgba(6,182,212,0.9)' : 'rgba(6,182,212,0.4)', left: 0 }}
            />

            {/* Notes */}
            {pattern.notes.map((note) => (
              <NoteBlock
                key={note.id}
                note={note}
                beatWidth={beatWidth}
                selected={selectedNoteIds.includes(note.id)}
                onSelect={handleNoteSelect}
                onResize={handleNoteResize}
                onDelete={handleNoteDelete}
                editMode={editMode}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Velocity editor */}
      <div className="shrink-0 border-t border-forge-border bg-forge-surface flex" style={{ height: 64 }}>
        <div style={{ width: PIANO_WIDTH, minWidth: PIANO_WIDTH }} className="border-r border-forge-border flex items-center justify-center">
          <span className="text-[9px] text-forge-muted uppercase">Vel</span>
        </div>
        <div className="flex-1 overflow-x-auto overflow-y-hidden flex items-end px-1 gap-px" style={{ width: totalWidth }}>
          {pattern.notes.map((note) => (
            <div
              key={note.id}
              className="shrink-0 rounded-t transition-colors hover:bg-forge-highlight/80"
              style={{
                position: 'absolute',
                left: note.startBeat * beatWidth + PIANO_WIDTH,
                bottom: 0,
                width: Math.max(note.durationBeats * beatWidth - 2, 3),
                height: (note.velocity / 127) * 60,
                background: selectedNoteIds.includes(note.id) ? '#06b6d4' : '#8b5cf6',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
