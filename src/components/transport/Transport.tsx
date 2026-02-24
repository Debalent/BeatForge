import { useCallback } from 'react';
import {
  Play, Pause, Square, Circle,
  SkipBack, SkipForward, Repeat, Mic2,
  Volume2, Sliders, Clock, Music2,
} from 'lucide-react';
import * as Slider from '@radix-ui/react-slider';
import { useTransportStore } from '@/stores/transportStore';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import clsx from 'clsx';

const SNAP_OPTIONS = ['bar','1/2','1/4','1/8','1/16','1/32','none'] as const;

export function Transport() {
  const transport = useTransportStore();
  const { setBPM, setTimeSignature } = useProjectStore();
  const { snap, setSnap, snapEnabled, toggleSnap, editMode, setEditMode } = useUIStore();

  const formatTime = useCallback((beat: number): string => {
    const [num] = transport.timeSignature;
    const bar  = Math.floor(beat / num);
    const b    = Math.floor(beat % num);
    const tick = Math.floor((beat % 1) * 100);
    return `${String(bar + 1).padStart(3,'0')}:${b + 1}:${String(tick).padStart(2,'0')}`;
  }, [transport.timeSignature]);

  return (
    <div className="relative flex items-center h-13 border-b border-forge-border px-3 gap-3 shrink-0" style={{ height: 52, background: 'linear-gradient(to bottom, #1e2140, #16192f)' }}>

      {/* ── Playback controls ── */}
      <div className="flex items-center gap-0.5">
        <button
          className="toolbar-btn w-7 h-7"
          title="Return to start"
          onClick={() => transport.seekTo(0)}
        >
          <SkipBack className="w-3.5 h-3.5" />
        </button>

        <button
          className={clsx('toolbar-btn w-9 h-9', transport.recording && 'active')}
          title="Record (R)"
          onClick={() => transport.recording ? transport.stopRecording() : transport.startRecording()}
        >
          <Circle className={clsx('w-4 h-4', transport.recording && 'fill-forge-danger text-forge-danger')} />
        </button>

        <button
          className="relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-150"
          style={{
            background: transport.playing
              ? 'linear-gradient(135deg, #06b6d4, #0891b2)'
              : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            boxShadow: transport.playing
              ? '0 0 0 1px rgba(6,182,212,0.5), 0 0 20px rgba(6,182,212,0.4), 0 4px 12px rgba(0,0,0,0.5)'
              : '0 0 0 1px rgba(139,92,246,0.5), 0 0 20px rgba(139,92,246,0.4), 0 4px 12px rgba(0,0,0,0.5)',
          }}
          title="Play/Pause (Space)"
          onClick={transport.togglePlay}
        >
          {transport.playing && (
            <span className="absolute inset-0 rounded-xl animate-ping" style={{ background: 'rgba(6,182,212,0.2)' }} />
          )}
          {transport.playing
            ? <Pause className="w-5 h-5 text-white relative z-10" />
            : <Play  className="w-5 h-5 text-white relative z-10 ml-0.5" />
          }
        </button>

        <button
          className="toolbar-btn w-7 h-7"
          title="Stop"
          onClick={transport.stop}
        >
          <Square className="w-3.5 h-3.5" />
        </button>

        <button
          className="toolbar-btn w-7 h-7"
          title="Skip forward"
          onClick={() => transport.seekTo(transport.currentBeat + transport.timeSignature[0])}
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Position display ── */}
      <div className="display-readout font-mono text-sm rounded-md px-3 py-1.5 min-w-[100px] text-center select-text tracking-widest">
        {formatTime(transport.currentBeat)}
      </div>

      {/* ── BPM ── */}
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex items-center gap-0.5">
          <button
            className="w-4 h-5 flex items-center justify-center rounded text-forge-text-muted hover:text-forge-highlight text-xs transition-colors"
            onClick={() => { transport.nudgeBPM(-1); setBPM(transport.bpm - 1); }}
          >▼</button>
          <input
            type="number"
            value={transport.bpm}
            min={20} max={999}
            onChange={(e) => { const v = Number(e.target.value); transport.setBPM(v); setBPM(v); }}
            className="w-14 rounded-md px-1 py-1 text-center text-sm font-mono focus:outline-none tracking-wider"
            style={{ background: '#0a0c1a', border: '1px solid rgba(6,182,212,0.2)', color: '#22d3ee', boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6)' }}
          />
          <button
            className="w-4 h-5 flex items-center justify-center rounded text-forge-text-muted hover:text-forge-highlight text-xs transition-colors"
            onClick={() => { transport.nudgeBPM(1); setBPM(transport.bpm + 1); }}
          >▲</button>
        </div>
        <span className="text-2xs font-semibold tracking-widest" style={{ color: '#3d4266', fontSize: '0.55rem' }}>BPM</span>
      </div>

      {/* ── Time Signature ── */}
      <div className="flex items-center gap-1 font-mono text-sm">
        <select
          value={transport.timeSignature[0]}
          onChange={(e) => { const n = Number(e.target.value); transport.setTimeSignature(n, transport.timeSignature[1]); setTimeSignature(n, transport.timeSignature[1]); }}
          className="bg-forge-bg border border-forge-border rounded px-1 py-0.5 text-forge-text focus:outline-none focus:border-forge-accent appearance-none w-8 text-center"
        >
          {[2,3,4,5,6,7,8,9,10,11,12].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <span className="text-forge-text-muted">/</span>
        <select
          value={transport.timeSignature[1]}
          onChange={(e) => { const d = Number(e.target.value); transport.setTimeSignature(transport.timeSignature[0], d); setTimeSignature(transport.timeSignature[0], d); }}
          className="bg-forge-bg border border-forge-border rounded px-1 py-0.5 text-forge-text focus:outline-none focus:border-forge-accent appearance-none w-8 text-center"
        >
          {[2,4,8,16].map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* ── Loop ── */}
      <button
        className={clsx('toolbar-btn', transport.looping && 'active')}
        title="Toggle Loop (L)"
        onClick={transport.toggleLoop}
      >
        <Repeat className="w-4 h-4" />
      </button>

      {/* ── Metronome ── */}
      <button
        className={clsx('toolbar-btn', transport.metronome && 'active')}
        title="Metronome (M)"
        onClick={transport.toggleMetronome}
      >
        <Clock className="w-4 h-4" />
      </button>

      {/* Divider */}
      <div className="w-px mx-1" style={{ width: 1, height: 28, background: 'linear-gradient(to bottom, transparent, rgba(139,92,246,0.4), transparent)' }} />

      {/* ── Snap ── */}
      <div className="flex items-center gap-1">
        <button
          className={clsx('toolbar-btn', snapEnabled && 'active')}
          title="Toggle snap"
          onClick={toggleSnap}
        >
          <Music2 className="w-3.5 h-3.5" />
        </button>
        <select
          value={snap}
          onChange={(e) => setSnap(e.target.value as typeof snap)}
          className="bg-forge-bg border border-forge-border rounded px-1 py-0.5 text-xs text-forge-text focus:outline-none focus:border-forge-accent"
        >
          {SNAP_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* ── Edit mode ── */}
      <div className="flex items-center gap-0.5">
        {(['select','draw','erase','cut'] as const).map((mode) => (
          <button
            key={mode}
            className={clsx('toolbar-btn text-2xs font-mono px-1.5', editMode === mode && 'active')}
            title={mode}
            onClick={() => setEditMode(mode)}
          >
            {mode === 'select' ? '↖' : mode === 'draw' ? '✎' : mode === 'erase' ? '⌫' : '✂'}
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* ── Master Volume ── */}
      <div className="flex items-center gap-2">
        <Volume2 className="w-3.5 h-3.5 text-forge-text-muted" />
        <Slider.Root
          className="relative flex items-center w-24 h-4"
          value={[transport.masterVolume * 100]}
          min={0} max={200} step={1}
          onValueChange={([v]) => transport.setMasterVolume(v / 100)}
        >
          <Slider.Track className="relative h-1 flex-1 rounded bg-forge-muted">
            <Slider.Range className="absolute h-full rounded bg-forge-accent" />
          </Slider.Track>
          <Slider.Thumb className="block w-3 h-3 rounded-full bg-white shadow focus:outline-none focus:ring-1 focus:ring-forge-accent" />
        </Slider.Root>
        <span className="text-2xs font-mono text-forge-text-muted w-7">
          {Math.round(transport.masterVolume * 100)}%
        </span>
      </div>

      {/* ── Swing ── */}
      <div className="flex items-center gap-1">
        <Sliders className="w-3 h-3 text-forge-text-muted" />
        <Slider.Root
          className="relative flex items-center w-16 h-4"
          value={[transport.swing]}
          min={0} max={100} step={1}
          onValueChange={([v]) => transport.setSwing(v)}
        >
          <Slider.Track className="relative h-1 flex-1 rounded bg-forge-muted">
            <Slider.Range className="absolute h-full rounded bg-forge-highlight" />
          </Slider.Track>
          <Slider.Thumb className="block w-3 h-3 rounded-full bg-white shadow focus:outline-none focus:ring-1 focus:ring-forge-highlight" />
        </Slider.Root>
        <span className="text-2xs font-mono text-forge-text-muted w-6">{transport.swing}%</span>
      </div>
    </div>
  );
}
