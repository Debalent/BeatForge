import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { PanelId, PanelLayout, EditMode, SnapValue } from '@/types';

const DEFAULT_PANELS: PanelLayout[] = [
  { id: 'arrangement', open: true,  docked: true,  minimized: false },
  { id: 'piano_roll',  open: false, docked: true,  minimized: false },
  { id: 'mixer',       open: true,  docked: true,  minimized: false },
  { id: 'browser',     open: true,  docked: true,  minimized: false },
  { id: 'plugin_rack', open: false, docked: true,  minimized: false },
  { id: 'ai_panel',    open: false, docked: false, minimized: false },
  { id: 'collab_panel',open: false, docked: false, minimized: false },
  { id: 'master',      open: false, docked: true,  minimized: false },
  { id: 'settings',    open: false, docked: false, minimized: false },
];

interface UIStore {
  // Panels
  panels: PanelLayout[];
  activePanel: PanelId;
  openPanel: (id: PanelId) => void;
  closePanel: (id: PanelId) => void;
  togglePanel: (id: PanelId) => void;
  setActivePanel: (id: PanelId) => void;
  updatePanel: (id: PanelId, patch: Partial<PanelLayout>) => void;

  // Edit mode
  editMode: EditMode;
  setEditMode: (m: EditMode) => void;

  // Snap
  snap: SnapValue;
  setSnap: (s: SnapValue) => void;
  snapEnabled: boolean;
  toggleSnap: () => void;

  // Zoom
  hZoom: number;  // beats per pixel
  vZoom: number;
  setHZoom: (z: number) => void;
  setVZoom: (z: number) => void;

  // Selected items
  selectedTrackIds: string[];
  selectedClipIds: string[];
  selectedNoteIds: string[];
  setSelectedTracks: (ids: string[]) => void;
  setSelectedClips: (ids: string[]) => void;
  setSelectedNotes: (ids: string[]) => void;
  clearSelection: () => void;

  // Open piano roll for pattern
  pianoRollPatternId: string | null;
  openPianoRoll: (patternId: string) => void;
  closePianoRoll: () => void;

  // Beginner / Advanced mode
  beginnerMode: boolean;
  toggleBeginnerMode: () => void;

  // Onboarding
  onboardingComplete: boolean;
  setOnboardingComplete: (v: boolean) => void;

  // Sidebar width
  browserWidth: number;
  setBrowserWidth: (w: number) => void;

  // Mixer height (bottom dock)
  mixerHeight: number;
  setMixerHeight: (h: number) => void;

  // Theme (future)
  theme: 'dark' | 'light';

  // Toast / notification
  toasts: Toast[];
  addToast: (t: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  duration?: number;
}

let toastSeq = 0;

export const useUIStore = create<UIStore>()(
  immer((set) => ({
    panels: DEFAULT_PANELS,
    activePanel: 'arrangement',

    openPanel(id) {
      set((s) => {
        const p = s.panels.find((p) => p.id === id);
        if (p) { p.open = true; p.minimized = false; }
        s.activePanel = id;
      });
    },
    closePanel(id) {
      set((s) => {
        const p = s.panels.find((p) => p.id === id);
        if (p) p.open = false;
      });
    },
    togglePanel(id) {
      set((s) => {
        const p = s.panels.find((p) => p.id === id);
        if (p) { p.open = !p.open; if (p.open) { p.minimized = false; s.activePanel = id; } }
      });
    },
    setActivePanel(id) {
      set((s) => { s.activePanel = id; });
    },
    updatePanel(id, patch) {
      set((s) => {
        const p = s.panels.find((p) => p.id === id);
        if (p) Object.assign(p, patch);
      });
    },

    editMode: 'select',
    setEditMode(m) { set((s) => { s.editMode = m; }); },

    snap: '1/16',
    setSnap(s_) { set((s) => { s.snap = s_; }); },
    snapEnabled: true,
    toggleSnap() { set((s) => { s.snapEnabled = !s.snapEnabled; }); },

    hZoom: 40,   // px per beat
    vZoom: 1,
    setHZoom(z) { set((s) => { s.hZoom = Math.max(10, Math.min(400, z)); }); },
    setVZoom(z) { set((s) => { s.vZoom = Math.max(0.5, Math.min(4, z)); }); },

    selectedTrackIds: [],
    selectedClipIds: [],
    selectedNoteIds: [],
    setSelectedTracks(ids) { set((s) => { s.selectedTrackIds = ids; }); },
    setSelectedClips(ids)  { set((s) => { s.selectedClipIds = ids; }); },
    setSelectedNotes(ids)  { set((s) => { s.selectedNoteIds = ids; }); },
    clearSelection() {
      set((s) => {
        s.selectedTrackIds = [];
        s.selectedClipIds = [];
        s.selectedNoteIds = [];
      });
    },

    pianoRollPatternId: null,
    openPianoRoll(patternId) {
      set((s) => {
        s.pianoRollPatternId = patternId;
        const p = s.panels.find((p) => p.id === 'piano_roll');
        if (p) { p.open = true; p.minimized = false; }
        s.activePanel = 'piano_roll';
      });
    },
    closePianoRoll() {
      set((s) => {
        s.pianoRollPatternId = null;
        const p = s.panels.find((p) => p.id === 'piano_roll');
        if (p) p.open = false;
      });
    },

    beginnerMode: false,
    toggleBeginnerMode() { set((s) => { s.beginnerMode = !s.beginnerMode; }); },

    onboardingComplete: false,
    setOnboardingComplete(v) { set((s) => { s.onboardingComplete = v; }); },

    browserWidth: 240,
    setBrowserWidth(w) { set((s) => { s.browserWidth = Math.max(160, Math.min(480, w)); }); },

    mixerHeight: 240,
    setMixerHeight(h) { set((s) => { s.mixerHeight = Math.max(120, Math.min(600, h)); }); },

    theme: 'dark',

    toasts: [],
    addToast(t) {
      const id = `toast-${++toastSeq}`;
      set((s) => { s.toasts.push({ ...t, id }); });
      const dur = t.duration ?? 3000;
      if (dur > 0) setTimeout(() => set((s) => { s.toasts = s.toasts.filter((x) => x.id !== id); }), dur);
    },
    removeToast(id) { set((s) => { s.toasts = s.toasts.filter((x) => x.id !== id); }); },
  }))
);
