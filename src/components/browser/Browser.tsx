import { useState, useCallback, useMemo } from 'react';
import { Search, Music, Drum, AudioWaveform, ChevronRight, ChevronDown, Volume2, Plus } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { audioEngine } from '@/engine/AudioEngine';

// --- Built-in preset library ---
interface PresetItem {
  id: string;
  name: string;
  category: 'synth' | 'drum' | 'sample' | 'loop';
  tags: string[];
  bpm?: number;
}

const BUILT_IN_PRESETS: PresetItem[] = [
  // Synths
  { id: 'syn-lead-1',   name: 'Bright Lead',       category: 'synth', tags: ['lead', 'bright', 'analog'] },
  { id: 'syn-pad-1',    name: 'Midnight Pad',       category: 'synth', tags: ['pad', 'dark', 'evolving'] },
  { id: 'syn-bass-1',   name: '808 Sub Bass',       category: 'synth', tags: ['bass', '808', 'trap'] },
  { id: 'syn-keys-1',   name: 'Rhodes Keys',        category: 'synth', tags: ['keys', 'electric', 'soul'] },
  { id: 'syn-lead-2',   name: 'Saw Supersaw',       category: 'synth', tags: ['lead', 'supersayw', 'edm'] },
  { id: 'syn-arp-1',    name: 'Arpeggiated Pulse',  category: 'synth', tags: ['arp', 'pulse', 'techno'] },
  // Drums
  { id: 'drm-trap-1',   name: 'Trap Kit',           category: 'drum',  tags: ['trap', 'hi-hat', '808'] },
  { id: 'drm-house-1',  name: 'House Kit',          category: 'drum',  tags: ['house', '4x4', 'kick'] },
  { id: 'drm-rnb-1',    name: 'R&B Kit',            category: 'drum',  tags: ['rnb', 'snare', 'groove'] },
  { id: 'drm-acoustic', name: 'Acoustic Drums',     category: 'drum',  tags: ['acoustic', 'live', 'rock'] },
  // Loops
  { id: 'loop-trap-1',  name: 'Trap Loop 140',      category: 'loop',  tags: ['trap', 'loop'], bpm: 140 },
  { id: 'loop-hh-1',    name: 'Rolling Hats 145',   category: 'loop',  tags: ['hi-hat', 'loop'], bpm: 145 },
  { id: 'loop-808-1',   name: '808 Melody 130',     category: 'loop',  tags: ['melody', 'loop'], bpm: 130 },
];

const CATEGORY_ICON = {
  synth: Music,
  drum: Drum,
  sample: Volume2,
  loop: AudioWaveform,
};

const CATEGORY_COLOR = {
  synth: '#06b6d4',
  drum: '#f59e0b',
  sample: '#10b981',
  loop: '#8b5cf6',
};

type Category = 'all' | 'synth' | 'drum' | 'sample' | 'loop';

interface FolderState { [key: string]: boolean }

export function Browser() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('all');
  const [openFolders, setOpenFolders] = useState<FolderState>({ synth: true });
  const [previewing, setPreviewing] = useState<string | null>(null);

  const { addTrack } = useProjectStore();
  const { addToast } = useUIStore();

  const filtered = useMemo(() => {
    return BUILT_IN_PRESETS.filter((p) => {
      const matchCat = category === 'all' || p.category === category;
      const matchQ = !query || p.name.toLowerCase().includes(query.toLowerCase())
        || p.tags.some((t) => t.includes(query.toLowerCase()));
      return matchCat && matchQ;
    });
  }, [query, category]);

  const grouped = useMemo(() => {
    const groups: Record<string, PresetItem[]> = {};
    for (const item of filtered) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  }, [filtered]);

  const toggleFolder = useCallback((cat: string) => {
    setOpenFolders((s) => ({ ...s, [cat]: !s[cat] }));
  }, []);

  const handlePreview = useCallback(async (preset: PresetItem) => {
    setPreviewing(preset.id);
    try {
      await audioEngine.init();
      const ctx = audioEngine.context;
      if (!ctx) return;
      // Simple preview — play a short synth tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = preset.category === 'drum' ? 'sine' : 'sawtooth';
      osc.frequency.value = 440;
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch { /* ignore */ }
    setTimeout(() => setPreviewing(null), 600);
  }, []);

  const handleAddToProject = useCallback((preset: PresetItem) => {
    const type = preset.category === 'drum' ? 'drum' : 'instrument';
    addTrack(type, preset.name);
    addToast({ type: 'success', message: `Added "${preset.name}" track`, duration: 2000 });
  }, [addTrack, addToast]);

  const categoryButtons: { id: Category; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'synth', label: 'Synths' },
    { id: 'drum', label: 'Drums' },
    { id: 'sample', label: 'Samples' },
    { id: 'loop', label: 'Loops' },
  ];

  return (
    <div className="flex flex-col h-full bg-forge-surface text-forge-text overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-forge-border shrink-0">
        <h3 className="text-xs font-semibold text-forge-muted uppercase tracking-wider mb-2">Browser</h3>
        {/* Search */}
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-forge-muted" />
          <input
            type="text"
            placeholder="Search presets…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-forge-bg border border-forge-border rounded-md pl-8 pr-3 py-1.5 text-xs text-forge-text placeholder:text-forge-muted focus:outline-none focus:border-forge-highlight"
          />
        </div>
        {/* Category pills */}
        <div className="flex flex-wrap gap-1 mt-2">
          {categoryButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => setCategory(btn.id)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                category === btn.id
                  ? 'bg-forge-highlight/20 text-forge-highlight border border-forge-highlight/40'
                  : 'bg-forge-bg text-forge-muted border border-forge-border hover:border-forge-muted'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto forge-scrollbar p-2">
        {Object.entries(grouped).map(([cat, items]) => {
          const Icon = CATEGORY_ICON[cat as keyof typeof CATEGORY_ICON] ?? Music;
          const color = CATEGORY_COLOR[cat as keyof typeof CATEGORY_COLOR] ?? '#888';
          const isOpen = openFolders[cat] !== false;

          return (
            <div key={cat} className="mb-2">
              {/* Folder header */}
              <button
                onClick={() => toggleFolder(cat)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors"
              >
                {isOpen ? <ChevronDown size={11} className="text-forge-muted" /> : <ChevronRight size={11} className="text-forge-muted" />}
                <Icon size={12} style={{ color }} />
                <span className="text-xs font-semibold capitalize" style={{ color }}>{cat}s</span>
                <span className="ml-auto text-[10px] text-forge-muted">{items.length}</span>
              </button>

              {/* Items */}
              {isOpen && (
                <div className="ml-3 border-l border-forge-border pl-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      {/* Name */}
                      <span className="text-xs text-forge-text flex-1 truncate">{item.name}</span>
                      {item.bpm && (
                        <span className="text-[9px] text-forge-muted">{item.bpm}</span>
                      )}

                      {/* Actions (hover) */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          title="Preview"
                          className={`p-1 rounded transition-colors ${previewing === item.id ? 'text-forge-highlight' : 'text-forge-muted hover:text-forge-text'}`}
                          onClick={() => handlePreview(item)}
                        >
                          <Volume2 size={11} />
                        </button>
                        <button
                          title="Add to project"
                          className="p-1 rounded text-forge-muted hover:text-forge-highlight transition-colors"
                          onClick={() => handleAddToProject(item)}
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p className="text-xs text-forge-muted text-center py-8">No presets found.</p>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 border-t border-forge-border shrink-0">
        <p className="text-[10px] text-forge-muted">Drag items to arrangement · Click + to add track</p>
      </div>
    </div>
  );
}
