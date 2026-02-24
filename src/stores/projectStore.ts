import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import type {
  BForgeProject,
  Track,
  Pattern,
  ArrangementClip,
  MixerChannel,
  AutomationLane,
  Marker,
  VersionSnapshot,
  TrackType,
  MidiNote,
} from '@/types';

const DEFAULT_MIXER_CHANNEL = (): MixerChannel => ({
  id: nanoid(),
  name: 'Channel',
  color: '#7c3aed',
  volume: 1,
  pan: 0,
  muted: false,
  soloed: false,
  linked: false,
  sends: [],
  returnIds: [],
  preInserts: [],
  postInserts: [],
  peakL: 0,
  peakR: 0,
  rmsL: 0,
  rmsR: 0,
  lufsShort: -70,
  lufsIntegrated: -70,
  sidechainSources: [],
});

const DEFAULT_PROJECT = (): BForgeProject => ({
  id: nanoid(),
  name: 'Untitled Project',
  version: '1.0.0',
  bpm: 128,
  timeSignature: [4, 4],
  sampleRate: 44100,
  masterVolume: 1,
  swing: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  authorId: '',
  authorName: 'Unknown Artist',
  collaborators: [],
  cloudSyncStatus: 'offline',
  tags: [],
  tracks: [],
  patterns: [],
  arrangement: [],
  mixerChannels: [],
  masterChain: [],
  markers: [],
  automationLanes: [],
  aiMetadata: {},
  versionHistory: [],
});

// ─── Track Color Palette ─────────────────────────────────────
const TRACK_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
];
let colorIdx = 0;
const nextColor = () => TRACK_COLORS[colorIdx++ % TRACK_COLORS.length];

// ─── Store Interface ──────────────────────────────────────────
interface ProjectStore {
  project: BForgeProject;
  dirty: boolean;

  // Project actions
  newProject: () => void;
  loadProject: (p: BForgeProject) => void;
  updateProject: (patch: Partial<BForgeProject>) => void;
  setBPM: (bpm: number) => void;
  setTimeSignature: (num: number, den: number) => void;
  markDirty: () => void;
  markSaved: () => void;
  snapshotVersion: (label: string, authorId: string) => void;

  // Track actions
  addTrack: (type?: TrackType, name?: string) => Track;
  removeTrack: (id: string) => void;
  updateTrack: (id: string, patch: Partial<Track>) => void;
  reorderTracks: (ids: string[]) => void;
  duplicateTrack: (id: string) => Track;

  // Pattern actions
  addPattern: (trackId: string, startBeat?: number) => Pattern;
  removePattern: (id: string) => void;
  updatePattern: (id: string, patch: Partial<Pattern>) => void;
  addNote: (patternId: string, note: Omit<MidiNote, 'id'>) => MidiNote;
  removeNote: (patternId: string, noteId: string) => void;
  updateNote: (patternId: string, noteId: string, patch: Partial<MidiNote>) => void;

  // Arrangement actions
  addClip: (clip: Omit<ArrangementClip, 'id'>) => ArrangementClip;
  removeClip: (id: string) => void;
  updateClip: (id: string, patch: Partial<ArrangementClip>) => void;
  moveClip: (id: string, trackId: string, startBeat: number) => void;

  // Mixer actions
  addMixerChannel: (name?: string) => MixerChannel;
  removeMixerChannel: (id: string) => void;
  updateMixerChannel: (id: string, patch: Partial<MixerChannel>) => void;
  updateMeterValues: (id: string, values: { peakL: number; peakR: number; rmsL: number; rmsR: number; lufsShort: number }) => void;

  // Marker actions
  addMarker: (beat: number, name?: string) => Marker;
  removeMarker: (id: string) => void;
  updateMarker: (id: string, patch: Partial<Marker>) => void;

  // Automation actions
  addAutomationLane: (targetId: string, paramPath: string) => AutomationLane;
  removeAutomationLane: (id: string) => void;
  updateAutomationLane: (id: string, patch: Partial<AutomationLane>) => void;
}

// ─── Store ────────────────────────────────────────────────────
export const useProjectStore = create<ProjectStore>()(
  immer((set, get) => ({
    project: DEFAULT_PROJECT(),
    dirty: false,

    newProject() {
      set((s) => { s.project = DEFAULT_PROJECT(); s.dirty = false; });
    },

    loadProject(p) {
      set((s) => { s.project = p; s.dirty = false; });
    },

    updateProject(patch) {
      set((s) => {
        Object.assign(s.project, patch);
        s.project.updatedAt = new Date().toISOString();
        s.dirty = true;
      });
    },

    setBPM(bpm) {
      set((s) => { s.project.bpm = Math.max(20, Math.min(999, bpm)); s.dirty = true; });
    },

    setTimeSignature(num, den) {
      set((s) => { s.project.timeSignature = [num, den]; s.dirty = true; });
    },

    markDirty() { set((s) => { s.dirty = true; }); },
    markSaved() { set((s) => { s.dirty = false; }); },

    snapshotVersion(label, authorId) {
      set((s) => {
        const snap: VersionSnapshot = {
          id: nanoid(),
          label,
          createdAt: new Date().toISOString(),
          authorId,
          checksum: nanoid(), // TODO: real SHA-256
        };
        s.project.versionHistory.unshift(snap);
        if (s.project.versionHistory.length > 50) {
          s.project.versionHistory.length = 50;
        }
      });
    },

    // ─── Tracks ────────────────────────────────────────────
    addTrack(type = 'instrument', name) {
      const ch = get().addMixerChannel();
      const track: Track = {
        id: nanoid(),
        name: name || `Track ${get().project.tracks.length + 1}`,
        type,
        color: nextColor(),
        height: 40,
        muted: false,
        soloed: false,
        armed: false,
        locked: false,
        visible: true,
        volume: 1,
        pan: 0,
        mixerChannelId: ch.id,
        order: get().project.tracks.length,
        automationLaneIds: [],
      };
      set((s) => {
        s.project.tracks.push(track);
        s.dirty = true;
      });
      return track;
    },

    removeTrack(id) {
      set((s) => {
        const track = s.project.tracks.find((t) => t.id === id);
        if (!track) return;
        // Remove associated mixer channel
        s.project.mixerChannels = s.project.mixerChannels.filter(
          (c) => c.id !== track.mixerChannelId
        );
        // Remove clips
        s.project.arrangement = s.project.arrangement.filter(
          (c) => c.trackId !== id
        );
        // Remove patterns
        s.project.patterns = s.project.patterns.filter(
          (p) => p.trackId !== id
        );
        s.project.tracks = s.project.tracks.filter((t) => t.id !== id);
        s.dirty = true;
      });
    },

    updateTrack(id, patch) {
      set((s) => {
        const t = s.project.tracks.find((t) => t.id === id);
        if (t) { Object.assign(t, patch); s.dirty = true; }
      });
    },

    reorderTracks(ids) {
      set((s) => {
        ids.forEach((id, i) => {
          const t = s.project.tracks.find((t) => t.id === id);
          if (t) t.order = i;
        });
        s.project.tracks.sort((a, b) => a.order - b.order);
        s.dirty = true;
      });
    },

    duplicateTrack(id) {
      const orig = get().project.tracks.find((t) => t.id === id)!;
      const newCh = get().addMixerChannel(orig.name + ' (copy)');
      const copy: Track = {
        ...orig,
        id: nanoid(),
        name: orig.name + ' (copy)',
        mixerChannelId: newCh.id,
        order: orig.order + 0.5,
      };
      set((s) => {
        s.project.tracks.push(copy);
        s.project.tracks.sort((a, b) => a.order - b.order);
        s.dirty = true;
      });
      return copy;
    },

    // ─── Patterns ──────────────────────────────────────────
    addPattern(trackId, startBeat = 0) {
      const pattern: Pattern = {
        id: nanoid(),
        name: 'Pattern',
        trackId,
        length: 4,
        timeSignature: get().project.timeSignature,
        notes: [],
      };
      const clip: ArrangementClip = {
        id: nanoid(),
        patternId: pattern.id,
        trackId,
        startBeat,
        length: pattern.length,
        offset: 0,
        loopEnabled: false,
        locked: false,
        automationLaneIds: [],
      };
      set((s) => {
        s.project.patterns.push(pattern);
        s.project.arrangement.push(clip);
        s.dirty = true;
      });
      return pattern;
    },

    removePattern(id) {
      set((s) => {
        s.project.patterns = s.project.patterns.filter((p) => p.id !== id);
        s.project.arrangement = s.project.arrangement.filter(
          (c) => c.patternId !== id
        );
        s.dirty = true;
      });
    },

    updatePattern(id, patch) {
      set((s) => {
        const p = s.project.patterns.find((p) => p.id === id);
        if (p) { Object.assign(p, patch); s.dirty = true; }
      });
    },

    addNote(patternId, note) {
      const newNote: MidiNote = { ...note, id: nanoid() };
      set((s) => {
        const p = s.project.patterns.find((p) => p.id === patternId);
        if (p) { p.notes.push(newNote); s.dirty = true; }
      });
      return newNote;
    },

    removeNote(patternId, noteId) {
      set((s) => {
        const p = s.project.patterns.find((p) => p.id === patternId);
        if (p) {
          p.notes = p.notes.filter((n) => n.id !== noteId);
          s.dirty = true;
        }
      });
    },

    updateNote(patternId, noteId, patch) {
      set((s) => {
        const p = s.project.patterns.find((p) => p.id === patternId);
        if (!p) return;
        const n = p.notes.find((n) => n.id === noteId);
        if (n) { Object.assign(n, patch); s.dirty = true; }
      });
    },

    // ─── Arrangement ───────────────────────────────────────
    addClip(clip) {
      const c: ArrangementClip = { ...clip, id: nanoid() };
      set((s) => { s.project.arrangement.push(c); s.dirty = true; });
      return c;
    },

    removeClip(id) {
      set((s) => {
        s.project.arrangement = s.project.arrangement.filter(
          (c) => c.id !== id
        );
        s.dirty = true;
      });
    },

    updateClip(id, patch) {
      set((s) => {
        const c = s.project.arrangement.find((c) => c.id === id);
        if (c) { Object.assign(c, patch); s.dirty = true; }
      });
    },

    moveClip(id, trackId, startBeat) {
      set((s) => {
        const c = s.project.arrangement.find((c) => c.id === id);
        if (c) { c.trackId = trackId; c.startBeat = startBeat; s.dirty = true; }
      });
    },

    // ─── Mixer ─────────────────────────────────────────────
    addMixerChannel(name) {
      const ch: MixerChannel = {
        ...DEFAULT_MIXER_CHANNEL(),
        name: name || `CH ${get().project.mixerChannels.length + 1}`,
      };
      set((s) => { s.project.mixerChannels.push(ch); s.dirty = true; });
      return ch;
    },

    removeMixerChannel(id) {
      set((s) => {
        s.project.mixerChannels = s.project.mixerChannels.filter(
          (c) => c.id !== id
        );
        s.dirty = true;
      });
    },

    updateMixerChannel(id, patch) {
      set((s) => {
        const ch = s.project.mixerChannels.find((c) => c.id === id);
        if (ch) { Object.assign(ch, patch); s.dirty = true; }
      });
    },

    updateMeterValues(id, values) {
      set((s) => {
        const ch = s.project.mixerChannels.find((c) => c.id === id);
        if (ch) Object.assign(ch, values);
      });
    },

    // ─── Markers ───────────────────────────────────────────
    addMarker(beat, name = 'Marker') {
      const m: Marker = {
        id: nanoid(),
        beat,
        name,
        color: '#f59e0b',
        type: 'cue',
      };
      set((s) => { s.project.markers.push(m); s.dirty = true; });
      return m;
    },

    removeMarker(id) {
      set((s) => {
        s.project.markers = s.project.markers.filter((m) => m.id !== id);
        s.dirty = true;
      });
    },

    updateMarker(id, patch) {
      set((s) => {
        const m = s.project.markers.find((m) => m.id === id);
        if (m) { Object.assign(m, patch); s.dirty = true; }
      });
    },

    // ─── Automation ────────────────────────────────────────
    addAutomationLane(targetId, paramPath) {
      const lane: AutomationLane = {
        id: nanoid(),
        name: paramPath,
        targetId,
        paramPath,
        points: [],
        mode: 'read',
        visible: true,
        height: 60,
      };
      set((s) => { s.project.automationLanes.push(lane); s.dirty = true; });
      return lane;
    },

    removeAutomationLane(id) {
      set((s) => {
        s.project.automationLanes = s.project.automationLanes.filter(
          (l) => l.id !== id
        );
        s.dirty = true;
      });
    },

    updateAutomationLane(id, patch) {
      set((s) => {
        const l = s.project.automationLanes.find((l) => l.id === id);
        if (l) { Object.assign(l, patch); s.dirty = true; }
      });
    },
  }))
);
