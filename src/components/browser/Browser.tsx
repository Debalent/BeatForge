import { useState, useCallback, useMemo, useRef } from 'react';
import {
  Search, Music, Drum, AudioWaveform, ChevronRight, ChevronDown,
  Volume2, Plus, FolderOpen, X, Loader2,
} from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { audioEngine } from '@/engine/AudioEngine';

// ─── Types ────────────────────────────────────────────────────

type Category = 'all' | 'synth' | 'drum' | 'sample' | 'loop' | 'bass' | 'fx';

interface SampleItem {
  id: string;
  name: string;
  category: Category;
  tags: string[];
  bpm?: number;
  file?: File;
}

// ─── Folder → category heuristics ───────────────────────────

const FOLDER_CATEGORY_MAP: [RegExp, Category][] = [
  [/808|sub.?bass/i,                                                            'bass'],
  [/bass/i,                                                                     'bass'],
  [/kick|snare|hat|cymbal|clap|perc|drum|kit|trap.?drum|acoustic/i,            'drum'],
  [/loop|phrase/i,                                                              'loop'],
  [/fx|sfx|effect|riser|sweep|transition/i,                                    'fx'],
  [/lead|pad|key|piano|pluck|synth|chord|arp|brass|string|organ|stab/i,       'synth'],
  [/vocal|vox/i,                                                                'sample'],
];

function guessCategory(folderPath: string, fileName: string): Category {
  const h = (folderPath + ' ' + fileName).toLowerCase();
  for (const [re, cat] of FOLDER_CATEGORY_MAP) {
    if (re.test(h)) return cat;
  }
  return 'sample';
}

function guessBpm(name: string): number | undefined {
  const m = name.match(/\b(\d{2,3})\s*bpm\b/i) ?? name.match(/_(\d{2,3})[_\s]/);
  const v = m ? parseInt(m[1]) : undefined;
  return v && v >= 60 && v <= 220 ? v : undefined;
}

const AUDIO_EXTS = new Set(['.wav', '.mp3', '.ogg', '.flac', '.aiff', '.aif', '.m4a']);
const isAudio = (n: string) => AUDIO_EXTS.has(n.slice(n.lastIndexOf('.')).toLowerCase());

// ─── UI config ────────────────────────────────────────────────

const CAT_ICON: Record<string, React.ElementType> = {
  synth: Music, drum: Drum, sample: Volume2,
  loop: AudioWaveform, bass: AudioWaveform, fx: AudioWaveform,
};
const CAT_COLOR: Record<string, string> = {
  synth: '#06b6d4', drum: '#f59e0b', sample: '#10b981',
  loop: '#8b5cf6', bass: '#ef4444', fx: '#6b7280',
};
const CAT_ORDER: Category[] = ['drum', 'bass', 'loop', 'synth', 'sample', 'fx'];

// ─── Audio decode cache ───────────────────────────────────────

const bufCache = new Map<string, AudioBuffer>();
async function decodeFile(file: File, ctx: AudioContext): Promise<AudioBuffer> {
  const key = file.name + file.size;
  if (bufCache.has(key)) return bufCache.get(key)!;
  const buf = await ctx.decodeAudioData(await file.arrayBuffer());
  bufCache.set(key, buf);
  return buf;
}

// ─── Built-in placeholder presets ────────────────────────────

const BUILT_IN: SampleItem[] = [
  { id: 'syn-lead-1',   name: 'Bright Lead',      category: 'synth', tags: ['lead','bright'] },
  { id: 'syn-pad-1',    name: 'Midnight Pad',      category: 'synth', tags: ['pad','dark'] },
  { id: 'syn-bass-1',   name: '808 Sub Bass',      category: 'bass',  tags: ['bass','808'] },
  { id: 'syn-keys-1',   name: 'Rhodes Keys',       category: 'synth', tags: ['keys','electric'] },
  { id: 'syn-arp-1',    name: 'Arpeggiated Pulse', category: 'synth', tags: ['arp','pulse'] },
  { id: 'drm-trap-1',   name: 'Trap Kit',          category: 'drum',  tags: ['trap','808'] },
  { id: 'drm-house-1',  name: 'House Kit',         category: 'drum',  tags: ['house','4x4'] },
  { id: 'drm-rnb-1',    name: 'R&B Kit',           category: 'drum',  tags: ['rnb','snare'] },
  { id: 'drm-acoustic', name: 'Acoustic Drums',    category: 'drum',  tags: ['acoustic','live'] },
  { id: 'loop-trap-1',  name: 'Trap Loop 140',     category: 'loop',  tags: ['trap'], bpm: 140 },
  { id: 'loop-hh-1',    name: 'Rolling Hats 145',  category: 'loop',  tags: ['hi-hat'], bpm: 145 },
  { id: 'loop-808-1',   name: '808 Melody 130',    category: 'loop',  tags: ['melody'], bpm: 130 },
];

// ─── Main component ──────────────────────────────────────────

export function Browser() {
  const [query, setQuery]             = useState('');
  const [category, setCategory]       = useState<Category>('all');
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({ drum: true });
  const [previewing, setPreviewing]   = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);
  const [userSamples, setUserSamples] = useState<SampleItem[]>([]);
  const [packName, setPackName]       = useState<string | null>(null);
  const previewSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const { addTrack } = useProjectStore();
  const { addToast } = useUIStore();

  const allItems = useMemo(() => userSamples.length > 0 ? userSamples : BUILT_IN, [userSamples]);

  const filtered = useMemo(() => allItems.filter((p) => {
    const matchCat = category === 'all' || p.category === category;
    const q = query.toLowerCase();
    const matchQ = !q || p.name.toLowerCase().includes(q) || p.tags.some((t) => t.includes(q));
    return matchCat && matchQ;
  }), [allItems, query, category]);

  const grouped = useMemo(() => {
    const groups: Record<string, SampleItem[]> = {};
    for (const cat of CAT_ORDER) {
      const items = filtered.filter((i) => i.category === cat);
      if (items.length) groups[cat] = items;
    }
    for (const item of filtered) {
      if (!groups[item.category]) groups[item.category] = [item];
    }
    return groups;
  }, [filtered]);

  const handleImportFolder = useCallback(async () => {
    if (!('showDirectoryPicker' in window)) {
      const input = document.createElement('input');
      input.type = 'file'; input.multiple = true;
      input.accept = Array.from(AUDIO_EXTS).join(',');
      input.onchange = () => {
        if (!input.files?.length) return;
        const files = Array.from(input.files);
        const samples: SampleItem[] = files.filter((f) => isAudio(f.name)).map((f) => ({
          id: f.name + f.size,
          name: f.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '),
          category: guessCategory('', f.name),
          tags: [], bpm: guessBpm(f.name), file: f,
        }));
        setUserSamples(samples);
        setPackName(`${files.length} files`);
        addToast({ type: 'success', message: `Loaded ${samples.length} samples` });
      };
      input.click();
      return;
    }
    setLoading(true);
    try {
      const dir = await (window as any).showDirectoryPicker({ mode: 'read' });
      setPackName(dir.name);
      const samples: SampleItem[] = [];
      async function scanDir(handle: FileSystemDirectoryHandle, path: string) {
        for await (const [, entry] of handle.entries()) {
          if (entry.kind === 'file' && isAudio(entry.name)) {
            const file = await (entry as FileSystemFileHandle).getFile();
            samples.push({
              id: path + '/' + entry.name,
              name: entry.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '),
              category: guessCategory(path, entry.name),
              tags: path.toLowerCase().split('/').filter(Boolean),
              bpm: guessBpm(entry.name), file,
            });
          } else if (entry.kind === 'directory') {
            await scanDir(entry as FileSystemDirectoryHandle, path + '/' + entry.name);
          }
        }
      }
      await scanDir(dir, dir.name);
      setUserSamples(samples);
      if (samples.length === 0) {
        addToast({ type: 'warning', message: 'No audio files found in that folder.' });
      } else {
        addToast({ type: 'success', message: `Loaded ${samples.length} samples from "${dir.name}"` });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError')
        addToast({ type: 'error', message: 'Failed to read folder.' });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const handlePreview = useCallback(async (item: SampleItem) => {
    try { previewSourceRef.current?.stop(); } catch { /**/ }
    previewSourceRef.current = null;
    if (previewing === item.id) { setPreviewing(null); return; }
    setPreviewing(item.id);
    try {
      await audioEngine.init();
      const ctx = audioEngine.context;
      if (!ctx) return;
      if (item.file) {
        const buf = await decodeFile(item.file, ctx);
        const src = ctx.createBufferSource();
        const gain = ctx.createGain();
        gain.gain.value = 0.8;
        src.buffer = buf;
        src.connect(gain); gain.connect(ctx.destination);
        src.start(0, 0, Math.min(buf.duration, 4));
        previewSourceRef.current = src;
        src.onended = () => setPreviewing(null);
      } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = item.category === 'drum' || item.category === 'bass' ? 'sine' : 'sawtooth';
        osc.frequency.value = item.category === 'bass' ? 65 : 440;
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.8);
        setTimeout(() => setPreviewing(null), 850);
      }
    } catch { setPreviewing(null); }
  }, [previewing]);

  const handleAdd = useCallback((item: SampleItem) => {
    const type = item.category === 'drum' ? 'drum'
      : (item.category === 'bass' || item.category === 'synth') ? 'instrument' : 'audio';
    addTrack(type, item.name);
    addToast({ type: 'success', message: `Added "${item.name}"`, duration: 2000 });
  }, [addTrack, addToast]);

  const clearPack = useCallback(() => {
    setUserSamples([]); setPackName(null);
  }, []);

  const toggleFolder = useCallback((cat: string) => {
    setOpenFolders((s) => ({ ...s, [cat]: !s[cat] }));
  }, []);

  const catButtons: { id: Category; label: string }[] = [
    { id: 'all', label: 'All' }, { id: 'drum', label: 'Drums' },
    { id: 'bass', label: 'Bass' }, { id: 'loop', label: 'Loops' },
    { id: 'synth', label: 'Synths' }, { id: 'sample', label: 'Samples' },
    { id: 'fx', label: 'FX' },
  ];

  return (
    <div className="flex flex-col h-full w-60 shrink-0 bg-forge-surface border-r border-forge-border text-forge-text overflow-hidden">
      <div className="p-3 border-b border-forge-border shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-forge-muted uppercase tracking-wider">Browser</h3>
          <button onClick={handleImportFolder} disabled={loading}
            title="Import sample folder"
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-forge-highlight/10 text-forge-highlight border border-forge-highlight/30 hover:bg-forge-highlight/20 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={10} className="animate-spin" /> : <FolderOpen size={10} />}
            {loading ? 'Scanning…' : 'Import Pack'}
          </button>
        </div>
        {packName && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-forge-accent/10 border border-forge-accent/30">
            <span className="text-[10px] text-forge-accent flex-1 truncate">📦 {packName}</span>
            <button onClick={clearPack} className="text-forge-muted hover:text-forge-text"><X size={10} /></button>
          </div>
        )}
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-forge-muted" />
          <input type="text" placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-forge-bg border border-forge-border rounded-md pl-8 pr-3 py-1.5 text-xs placeholder:text-forge-muted focus:outline-none focus:border-forge-highlight" />
        </div>
        <div className="flex flex-wrap gap-1">
          {catButtons.map((btn) => (
            <button key={btn.id} onClick={() => setCategory(btn.id)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border ${
                category === btn.id
                  ? 'bg-forge-highlight/20 text-forge-highlight border-forge-highlight/40'
                  : 'bg-forge-bg text-forge-muted border-forge-border hover:border-forge-muted'
              }`}>{btn.label}</button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto forge-scrollbar p-2">
        {Object.entries(grouped).map(([cat, items]) => {
          const Icon = CAT_ICON[cat] ?? Music;
          const color = CAT_COLOR[cat] ?? '#888';
          const isOpen = openFolders[cat] !== false;
          return (
            <div key={cat} className="mb-1">
              <button onClick={() => toggleFolder(cat)}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors">
                {isOpen ? <ChevronDown size={10} className="text-forge-muted shrink-0" /> : <ChevronRight size={10} className="text-forge-muted shrink-0" />}
                <Icon size={11} color={color} className="shrink-0" />
                <span className="text-xs font-semibold capitalize" style={{ color }}>{cat}s</span>
                <span className="ml-auto text-[10px] text-forge-muted">{items.length}</span>
              </button>
              {isOpen && (
                <div className="ml-3 border-l border-forge-border pl-2">
                  {items.map((item) => (
                    <div key={item.id} draggable
                      onDragStart={(e) => e.dataTransfer.setData('application/beatforge-sample', JSON.stringify({ id: item.id, name: item.name, category: item.category }))}
                      className="group flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white/5 cursor-grab active:cursor-grabbing transition-colors">
                      {item.file && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Real audio" />}
                      <span className="text-xs flex-1 truncate" title={item.name}>{item.name}</span>
                      {item.bpm && <span className="text-[9px] text-forge-muted shrink-0">{item.bpm}</span>}
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button title={previewing === item.id ? 'Stop' : 'Preview'}
                          className={`p-1 rounded transition-colors ${previewing === item.id ? 'text-forge-highlight animate-pulse' : 'text-forge-muted hover:text-forge-text'}`}
                          onClick={() => handlePreview(item)}><Volume2 size={10} /></button>
                        <button title="Add track"
                          className="p-1 rounded text-forge-muted hover:text-forge-highlight transition-colors"
                          onClick={() => handleAdd(item)}><Plus size={10} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && !loading && (
          <div className="flex flex-col items-center gap-3 py-10 px-4 text-center">
            <FolderOpen size={28} className="text-forge-muted opacity-40" />
            <p className="text-xs text-forge-muted">{query ? 'No samples match your search.' : 'Click "Import Pack" to load your Cymatics, Splice or Looperman download.'}</p>
          </div>
        )}
      </div>

      <div className="px-3 py-2 border-t border-forge-border shrink-0">
        <p className="text-[10px] text-forge-muted">
          {userSamples.length > 0 ? `${userSamples.length} samples · Drag to arrangement` : 'Import any sample pack folder'}
        </p>
      </div>
    </div>
  );
}
