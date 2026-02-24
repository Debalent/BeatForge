// ─── BeatForge Core Type Definitions ─────────────────────────

export type ID = string;

// ─── Project ──────────────────────────────────────────────────
export interface BForgeProject {
  id: ID;
  name: string;
  version: string;
  bpm: number;
  timeSignature: [number, number];
  sampleRate: number;
  masterVolume: number;
  swing: number;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  authorName: string;
  collaborators: Collaborator[];
  cloudSyncStatus: 'synced' | 'dirty' | 'offline' | 'conflict';
  cloudProjectId?: string;
  tags: string[];
  genre?: string;
  description?: string;
  // Sub-entities
  tracks: Track[];
  patterns: Pattern[];
  arrangement: ArrangementClip[];
  mixerChannels: MixerChannel[];
  masterChain: EffectInstance[];
  markers: Marker[];
  automationLanes: AutomationLane[];
  aiMetadata: AIMetadata;
  versionHistory: VersionSnapshot[];
}

// ─── Tracks ───────────────────────────────────────────────────
export type TrackType =
  | 'instrument'
  | 'audio'
  | 'midi'
  | 'drum'
  | 'automation'
  | 'return'
  | 'group';

export interface Track {
  id: ID;
  name: string;
  type: TrackType;
  color: string;
  height: number;
  muted: boolean;
  soloed: boolean;
  armed: boolean;  // record arm
  locked: boolean;
  visible: boolean;
  volume: number;       // 0–2 (1 = unity)
  pan: number;          // -1 to 1
  mixerChannelId: ID;
  instrumentId?: ID;
  groupId?: ID;
  order: number;
  // Automation
  automationLaneIds: ID[];
}

// ─── Instruments ──────────────────────────────────────────────
export type InstrumentType = 'synth' | 'sampler' | 'drum_machine' | 'granular';

export interface InstrumentInstance {
  id: ID;
  type: InstrumentType;
  name: string;
  presetName?: string;
  state: Record<string, unknown>;
  effectChain: EffectInstance[];
}

// ─── Patterns & MIDI ──────────────────────────────────────────
export interface Pattern {
  id: ID;
  name: string;
  trackId: ID;
  length: number;  // in beats
  timeSignature: [number, number];
  notes: MidiNote[];
  color?: string;
}

export interface MidiNote {
  id: ID;
  pitch: number;    // MIDI 0-127
  startBeat: number;
  durationBeats: number;
  velocity: number; // 0-127
  channel: number;
  // Piano roll extras
  muted: boolean;
  ghostNote?: boolean;
  pitchBend?: number;
  modWheel?: number;
  aftertouch?: number;
}

// ─── Drum Machine ─────────────────────────────────────────────
export interface DrumPattern {
  id: ID;
  name: string;
  steps: number;      // 16, 32, 64
  resolution: number; // 1/16 etc.
  pads: DrumPad[];
}

export interface DrumPad {
  id: ID;
  name: string;
  sampleUrl?: string;
  steps: boolean[];
  velocities: number[];
  pitch: number;
  muted: boolean;
  volume: number;
  pan: number;
  color: string;
}

// ─── Arrangement ──────────────────────────────────────────────
export interface ArrangementClip {
  id: ID;
  patternId: ID;
  trackId: ID;
  startBeat: number;
  length: number;     // override pattern length
  offset: number;     // clip start offset within pattern
  loopEnabled: boolean;
  color?: string;
  locked: boolean;
  automationLaneIds: ID[];
}

// ─── Mixer ────────────────────────────────────────────────────
export interface MixerChannel {
  id: ID;
  name: string;
  color: string;
  volume: number;      // 0–2
  pan: number;         // -1 to 1
  muted: boolean;
  soloed: boolean;
  linked: boolean;     // stereo link
  // Routing
  sends: ChannelSend[];
  returnIds: ID[];
  groupId?: ID;
  // Inserts
  preInserts: EffectInstance[];
  postInserts: EffectInstance[];
  // Metering
  peakL: number;
  peakR: number;
  rmsL: number;
  rmsR: number;
  lufsShort: number;
  lufsIntegrated: number;
  // Side-chain sources
  sidechainSources: ID[];
}

export interface ChannelSend {
  id: ID;
  targetId: ID;
  amount: number;   // 0-1
  preFader: boolean;
}

// ─── Effects ──────────────────────────────────────────────────
export type EffectType =
  | 'eq_parametric'
  | 'compressor'
  | 'compressor_multiband'
  | 'limiter'
  | 'reverb'
  | 'delay'
  | 'chorus'
  | 'flanger'
  | 'phaser'
  | 'saturation'
  | 'transient_shaper'
  | 'noise_gate'
  | 'pitch_shift'
  | 'time_stretch'
  | 'custom_plugin';

export interface EffectInstance {
  id: ID;
  type: EffectType;
  name: string;
  enabled: boolean;
  wetDry: number;   // 0-1
  params: Record<string, number | string | boolean>;
  presetName?: string;
}

// ─── EQ ───────────────────────────────────────────────────────
export interface EQBand {
  id: ID;
  type: 'lowpass' | 'highpass' | 'lowshelf' | 'highshelf' | 'peak' | 'notch';
  frequency: number;
  gain: number;
  q: number;
  enabled: boolean;
}

// ─── Automation ───────────────────────────────────────────────
export interface AutomationLane {
  id: ID;
  name: string;
  targetId: ID;       // track, mixer channel, effect, etc.
  paramPath: string;  // e.g. "volume", "effects[0].params.gain"
  points: AutomationPoint[];
  mode: 'touch' | 'latch' | 'write' | 'read';
  visible: boolean;
  height: number;
}

export interface AutomationPoint {
  id: ID;
  beat: number;
  value: number;     // 0-1 normalized
  curve: 'linear' | 'hold' | 'exp' | 'smooth';
}

// ─── Markers ──────────────────────────────────────────────────
export interface Marker {
  id: ID;
  beat: number;
  name: string;
  color: string;
  type: 'cue' | 'loop_start' | 'loop_end' | 'section';
}

// ─── Transport ────────────────────────────────────────────────
export interface TransportState {
  playing: boolean;
  recording: boolean;
  looping: boolean;
  loopStart: number;  // beats
  loopEnd: number;
  currentBeat: number;
  bpm: number;
  timeSignature: [number, number];
  metronome: boolean;
  countIn: boolean;
  swing: number;       // 0-100
  masterVolume: number;
  masterPan: number;
}

// ─── Collaboration ────────────────────────────────────────────
export interface Collaborator {
  id: ID;
  userId: string;
  username: string;
  avatarUrl?: string;
  role: 'owner' | 'editor' | 'viewer';
  royaltySplit: number;  // 0-100
  cursor?: CollabCursor;
  online: boolean;
  color: string;
}

export interface CollabCursor {
  panel: 'arrangement' | 'piano_roll' | 'mixer';
  beat?: number;
  trackId?: ID;
  pitch?: number;
}

// ─── AI Metadata ──────────────────────────────────────────────
export interface AIMetadata {
  genre?: string;
  mood?: string[];
  key?: string;
  scale?: string;
  detectedBPM?: number;
  lyricsCache?: LyricSuggestion[];
  melodyProfile?: MelodyProfile;
  mixScore?: number;
  lastAnalyzedAt?: string;
}

export interface LyricSuggestion {
  id: ID;
  section: 'verse' | 'chorus' | 'bridge' | 'hook' | 'outro';
  content: string;
  style: string;
  createdAt: string;
}

export interface MelodyProfile {
  rootNote: string;
  scale: string;
  patterns: number[][];
  complexity: number;
}

// ─── Version Snapshot ─────────────────────────────────────────
export interface VersionSnapshot {
  id: ID;
  label: string;
  createdAt: string;
  authorId: string;
  checksum: string;
  delta?: string;  // JSON patch delta from previous
}

// ─── UI State ──────────────────────────────────────────────────
export type PanelId =
  | 'arrangement'
  | 'piano_roll'
  | 'mixer'
  | 'browser'
  | 'plugin_rack'
  | 'ai_panel'
  | 'collab_panel'
  | 'master'
  | 'settings';

export interface PanelLayout {
  id: PanelId;
  open: boolean;
  docked: boolean;
  position?: { x: number; y: number };
  size?: { w: number; h: number };
  minimized: boolean;
}

export type EditMode =
  | 'select'
  | 'draw'
  | 'erase'
  | 'cut'
  | 'glue'
  | 'zoom'
  | 'mute'
  | 'automation';

export type SnapValue =
  | 'bar'
  | '1/2'
  | '1/4'
  | '1/8'
  | '1/16'
  | '1/32'
  | '1/64'
  | 'none';

// ─── Audio Engine ─────────────────────────────────────────────
export interface AudioEngineState {
  initialized: boolean;
  sampleRate: number;
  bufferSize: number;
  latency: number;
  cpuLoad: number;
  wasmLoaded: boolean;
}

// ─── Subscription / Monetization ──────────────────────────────
export type PlanTier = 'free' | 'pro' | 'creator_sync_bundle';
export type BillingPeriod = 'monthly' | 'annual' | 'biennial';

export interface UserSubscription {
  tier: PlanTier;
  billing: BillingPeriod;
  expiresAt?: string;
  features: PlanFeatures;
  creatorSyncLinked: boolean;
}

export interface PlanFeatures {
  maxTracks: number;         // -1 = unlimited
  maxExportBitrate: number;  // kbps, -1 = unlimited
  aiSuggestions: boolean;
  cloudSync: boolean;
  collaboration: boolean;
  soundPacks: number;        // included packs
  pluginMarketplace: boolean;
  prioritySupport: boolean;
  exportFormats: string[];
  wapiAiMastering: boolean;
}

// ─── CreatorSync Integration ───────────────────────────────────
export interface CreatorSyncProfile {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  tier: 'free' | 'premium';
  aiProfileId: string;
  linkedServices: string[];
}

export interface MixMasterJob {
  id: ID;
  projectId: ID;
  status: 'queued' | 'processing' | 'done' | 'error';
  targetLoudness: number;  // LUFS
  platform: 'spotify' | 'apple_music' | 'youtube' | 'podcast' | 'social';
  resultUrl?: string;
  score?: number;
  suggestions?: string[];
  createdAt: string;
  completedAt?: string;
}

// ─── File format ──────────────────────────────────────────────
export interface BForgeFile {
  magic: 'BFRG';
  version: string;
  project: BForgeProject;
  assets: BForgeAsset[];
  exportedAt: string;
}

export interface BForgeAsset {
  id: ID;
  type: 'audio' | 'midi' | 'plugin' | 'sample';
  name: string;
  mimeType: string;
  hash: string;         // SHA-256 for dedup
  size: number;
  embedded: boolean;    // true = base64 in file, false = CDN ref
  url?: string;
  data?: string;        // base64 if embedded
}
