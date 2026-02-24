import { useState, useCallback } from 'react';
import { Wand2, Music2, FileText, Zap, Loader2, Copy, CheckCircle } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { useAuthStore } from '@/stores/appStore';
import { useUIStore } from '@/stores/uiStore';
import { creatorSyncApi, type MelodyGenerationResult } from '@/services/creatorSyncApi';
import { nanoid } from 'nanoid';
import type { MidiNote } from '@/types';

type Tool = 'melody' | 'lyrics' | 'mixmaster' | 'finisher';

const TOOLS: { id: Tool; label: string; icon: typeof Wand2; color: string; desc: string }[] = [
  { id: 'melody', label: 'Melody Gen', icon: Music2, color: '#06b6d4', desc: 'Generate melodies from genre & mood' },
  { id: 'lyrics', label: 'Lyric Assist', icon: FileText, color: '#8b5cf6', desc: 'Write verses, choruses & hooks' },
  { id: 'mixmaster', label: 'MixMaster AI', icon: Wand2, color: '#f59e0b', desc: 'AI-powered professional mix' },
  { id: 'finisher', label: 'The Finisher', icon: Zap, color: '#10b981', desc: 'Complete unfinished sections' },
];

const GENRES = ['Trap', 'House', 'Pop', 'R&B', 'Hip-Hop', 'Afrobeats', 'Dancehall', 'Lo-fi', 'Drill', 'EDM'];
const MOODS = ['Dark', 'Happy', 'Energetic', 'Chill', 'Emotional', 'Aggressive', 'Romantic', 'Mysterious'];
const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// ─── Melody Tool ─────────────────────────────────────────────
function MelodyTool({ token }: { token?: string | null }) {
  const { project, addNote } = useProjectStore();
  const { pianoRollPatternId, addToast } = useUIStore();
  const { bpm } = project;

  const [genre, setGenre] = useState('Trap');
  const [mood, setMood] = useState('Dark');
  const [key, setKey] = useState('C');
  const [bars, setBars] = useState(4);
  const [loading, setLoading] = useState(false);

  const generate = useCallback(async () => {
    if (!pianoRollPatternId) {
      addToast({ type: 'warning', message: 'Open a pattern in the Piano Roll first.' });
      return;
    }
    setLoading(true);
    try {
      const result: MelodyGenerationResult = await creatorSyncApi.generateMelody({
        genre, mood, bpm, key, bars,
      }, token ?? undefined);
      result.notes.forEach((n) => {
        const note: Omit<MidiNote, 'id'> = {
          pitch: n.pitch,
          startBeat: n.startBeat,
          durationBeats: n.durationBeats,
          velocity: n.velocity,
          channel: 1,
          muted: false,
        };
        addNote(pianoRollPatternId, note);
      });
      addToast({ type: 'success', message: `${result.notes.length} notes generated in ${result.key} ${result.scale}` });
    } catch (e: any) {
      addToast({ type: 'error', message: `Melody generation failed: ${e.message}` });
    } finally {
      setLoading(false);
    }
  }, [genre, mood, bpm, key, bars, pianoRollPatternId, addNote, addToast, token]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <label className="flex flex-col gap-1">
          <span className="text-forge-muted">Genre</span>
          <select value={genre} onChange={(e) => setGenre(e.target.value)} className="bg-forge-bg border border-forge-border rounded px-2 py-1.5 text-forge-text focus:outline-none focus:border-forge-highlight">
            {GENRES.map((g) => <option key={g}>{g}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-forge-muted">Mood</span>
          <select value={mood} onChange={(e) => setMood(e.target.value)} className="bg-forge-bg border border-forge-border rounded px-2 py-1.5 text-forge-text focus:outline-none focus:border-forge-highlight">
            {MOODS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-forge-muted">Key</span>
          <select value={key} onChange={(e) => setKey(e.target.value)} className="bg-forge-bg border border-forge-border rounded px-2 py-1.5 text-forge-text focus:outline-none focus:border-forge-highlight">
            {KEYS.map((k) => <option key={k}>{k}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-forge-muted">Bars</span>
          <input type="number" min={1} max={16} value={bars} onChange={(e) => setBars(Number(e.target.value))}
            className="bg-forge-bg border border-forge-border rounded px-2 py-1.5 text-forge-text focus:outline-none focus:border-forge-highlight" />
        </label>
      </div>
      {!pianoRollPatternId && (
        <p className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1.5">
          Open a pattern in the Piano Roll to insert generated notes.
        </p>
      )}
      <button
        onClick={generate}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-all hover:brightness-110"
        style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Music2 size={14} />}
        {loading ? 'Generating…' : 'Generate Melody'}
      </button>
    </div>
  );
}

// ─── Lyrics Tool ─────────────────────────────────────────────
function LyricsTool({ token }: { token?: string | null }) {
  const { addToast } = useUIStore();
  const [topic, setTopic] = useState('');
  const [mood, setMood] = useState('Emotional');
  const [genre, setGenre] = useState('R&B');
  const [bars, setBars] = useState(8);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);

  const generate = useCallback(async () => {
    if (!topic.trim()) { addToast({ type: 'warning', message: 'Enter a topic first.' }); return; }
    setLoading(true);
    try {
      const res = await creatorSyncApi.assistLyrics({ topic, mood, genre, bars }, token ?? undefined);
      setResult(res.lyrics);
    } catch (e: any) {
      addToast({ type: 'error', message: `Lyric generation failed: ${e.message}` });
    } finally {
      setLoading(false);
    }
  }, [topic, mood, genre, bars, addToast, token]);

  const copyLyrics = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <label className="flex flex-col gap-1 text-xs">
        <span className="text-forge-muted">Topic / Theme</span>
        <input
          type="text"
          placeholder="e.g. Late nights, coming up, loyalty…"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="bg-forge-bg border border-forge-border rounded px-2 py-1.5 text-forge-text focus:outline-none focus:border-forge-highlight text-xs"
        />
      </label>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <label className="flex flex-col gap-1">
          <span className="text-forge-muted">Genre</span>
          <select value={genre} onChange={(e) => setGenre(e.target.value)} className="bg-forge-bg border border-forge-border rounded px-2 py-1.5 text-forge-text focus:outline-none focus:border-forge-highlight">
            {GENRES.map((g) => <option key={g}>{g}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-forge-muted">Bars</span>
          <input type="number" min={4} max={32} value={bars} onChange={(e) => setBars(Number(e.target.value))}
            className="bg-forge-bg border border-forge-border rounded px-2 py-1.5 text-forge-text focus:outline-none focus:border-forge-highlight" />
        </label>
      </div>
      <button
        onClick={generate}
        disabled={loading || !topic.trim()}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-all hover:brightness-110"
        style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
        {loading ? 'Writing…' : 'Write Lyrics'}
      </button>
      {result && (
        <div className="relative rounded-lg bg-forge-bg border border-forge-border p-3">
          <pre className="text-xs text-forge-text whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">{result}</pre>
          <button
            onClick={copyLyrics}
            className="absolute top-2 right-2 p-1 text-forge-muted hover:text-forge-text transition-colors"
          >
            {copied ? <CheckCircle size={12} className="text-emerald-400" /> : <Copy size={12} />}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── MixMaster Tool ──────────────────────────────────────────
function MixMasterTool({ token }: { token?: string | null }) {
  const { project } = useProjectStore();
  const { addToast } = useUIStore();
  const [genre, setGenre] = useState('Trap');
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  const start = useCallback(async () => {
    setLoading(true);
    try {
      const result = await creatorSyncApi.startMixMaster({ projectId: project.id, genre }, token ?? undefined);
      setJobId(result.jobId);
      addToast({ type: 'success', message: `MixMaster job started (~${result.estimatedSeconds}s)` });
    } catch (e: any) {
      addToast({ type: 'error', message: `MixMaster failed: ${e.message}` });
    } finally {
      setLoading(false);
    }
  }, [project.id, genre, addToast, token]);

  return (
    <div className="space-y-3 text-xs">
      <p className="text-forge-muted leading-relaxed">
        MixMaster AI analyzes your mix and applies professional-grade EQ, compression,
        stereo imaging and mastering chain automatically.
      </p>
      <label className="flex flex-col gap-1">
        <span className="text-forge-muted">Target Genre</span>
        <select value={genre} onChange={(e) => setGenre(e.target.value)} className="bg-forge-bg border border-forge-border rounded px-2 py-1.5 text-forge-text focus:outline-none focus:border-forge-highlight">
          {GENRES.map((g) => <option key={g}>{g}</option>)}
        </select>
      </label>
      {jobId && (
        <div className="flex items-center gap-2 p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300">
          <Loader2 size={12} className="animate-spin shrink-0" />
          <span>Processing job <code className="font-mono">{jobId.slice(0, 8)}</code>…</span>
        </div>
      )}
      <button
        onClick={start}
        disabled={loading || !!jobId}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-all hover:brightness-110"
        style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
        {loading ? 'Starting…' : jobId ? 'In Progress…' : 'Start MixMaster'}
      </button>
    </div>
  );
}

// ─── Main Panel ──────────────────────────────────────────────
export function AIPanel() {
  const [activeTool, setActiveTool] = useState<Tool>('melody');
  const { accessToken } = useAuthStore();
  const token = accessToken;

  const tool = TOOLS.find((t) => t.id === activeTool);

  return (
    <div className="flex flex-col h-full bg-forge-surface text-forge-text overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-forge-border shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <Wand2 size={14} className="text-forge-highlight" />
          <h3 className="text-xs font-semibold text-forge-text">CreatorSync AI</h3>
          {!token && (
            <span className="ml-auto text-[9px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
              Demo Mode
            </span>
          )}
        </div>
        {/* Tool selector */}
        <div className="grid grid-cols-2 gap-1">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTool(t.id)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[10px] font-medium transition-colors ${
                  activeTool === t.id
                    ? 'text-white'
                    : 'text-forge-muted hover:text-forge-text hover:bg-forge-bg/50'
                }`}
                style={activeTool === t.id ? { background: `${t.color}30`, border: `1px solid ${t.color}50`, color: t.color } : {}}
              >
                <Icon size={11} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tool content */}
      <div className="flex-1 overflow-y-auto forge-scrollbar p-3">
        {tool && (
          <div className="mb-3">
            <p className="text-[10px] text-forge-muted mb-3">{tool.desc}</p>
            {activeTool === 'melody' && <MelodyTool token={token} />}
            {activeTool === 'lyrics' && <LyricsTool token={token} />}
            {activeTool === 'mixmaster' && <MixMasterTool token={token} />}
            {activeTool === 'finisher' && (
              <div className="text-xs text-forge-muted text-center py-6">
                <Zap size={24} className="mx-auto mb-2 text-emerald-400 opacity-60" />
                <p>The Finisher detects gaps in your arrangement<br/>and generates bridge sections automatically.</p>
                <p className="mt-2 text-amber-400 text-[10px]">Pro / CreatorSync Bundle required</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-forge-border shrink-0 flex items-center justify-between">
        <span className="text-[9px] text-forge-muted">Powered by CreatorSync</span>
        {!token && (
          <button className="text-[9px] text-forge-highlight hover:underline">Sign in for full access →</button>
        )}
      </div>
    </div>
  );
}
