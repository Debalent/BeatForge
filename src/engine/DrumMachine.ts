/**
 * BeatForge Drum Machine
 * Step sequencer with per-pad sample playback, velocity, swing.
 */
import { audioEngine } from './AudioEngine';

export interface DrumPadConfig {
  id: string;
  label: string;
  sampleUrl: string | null;
  steps: boolean[];
  velocities: number[];  // 0-127 per step
  pitch: number;         // semitones
  volume: number;
  pan: number;
  muted: boolean;
  color: string;
}

export interface DrumMachineConfig {
  steps: number;         // 16 | 32 | 64
  resolution: number;    // subdivision (e.g. 4 = 1/16th)
  swing: number;         // 0-100
  pads: DrumPadConfig[];
}

export const DEFAULT_DRUM_LABELS = [
  'Kick','Snare','Hi-Hat','Open HH','Clap',
  'Tom H','Tom M','Tom L','Ride','Crash',
  'Perc 1','Perc 2','Perc 3','Perc 4','FX 1','FX 2',
] as const;

export class DrumMachine {
  private _config: DrumMachineConfig;
  private _buffers = new Map<string, AudioBuffer>();
  private _output: GainNode;

  constructor(config: DrumMachineConfig) {
    this._config = config;
    this._output = audioEngine.ctx!.createGain();
    this._output.connect(audioEngine.masterGain!);
  }

  async loadSample(padId: string, url: string): Promise<void> {
    const ctx = audioEngine.ctx;
    if (!ctx) return;
    try {
      const resp = await fetch(url);
      const arrBuf = await resp.arrayBuffer();
      const audioBuf = await ctx.decodeAudioData(arrBuf);
      this._buffers.set(padId, audioBuf);
    } catch (e) {
      console.warn('[DrumMachine] Failed to load sample:', url, e);
    }
  }

  triggerPad(padId: string, velocity: number, time?: number): void {
    const ctx = audioEngine.ctx;
    if (!ctx) return;
    const pad = this._config.pads.find((p) => p.id === padId);
    if (!pad || pad.muted) return;
    const buf = this._buffers.get(padId);
    if (!buf) return;

    const t     = time ?? ctx.currentTime;
    const src   = ctx.createBufferSource();
    const gain  = ctx.createGain();
    const pan   = ctx.createStereoPanner();

    src.buffer            = buf;
    src.playbackRate.value = Math.pow(2, pad.pitch / 12);
    gain.gain.value        = (velocity / 127) * pad.volume;
    pan.pan.value          = pad.pan;

    src.connect(gain).connect(pan).connect(this._output);
    src.start(t);
  }

  /** Schedule a full pattern playback starting at audioTime */
  schedulePattern(startTime: number, bpm: number): void {
    const ctx = audioEngine.ctx;
    if (!ctx) return;
    const { steps, resolution, swing } = this._config;
    const stepDuration = (60 / bpm) / resolution;

    for (const pad of this._config.pads) {
      for (let s = 0; s < steps; s++) {
        if (!pad.steps[s]) continue;
        const swingOffset = s % 2 === 1 ? (swing / 100) * stepDuration * 0.5 : 0;
        const t = startTime + s * stepDuration + swingOffset;
        this.triggerPad(pad.id, pad.velocities[s] ?? 100, t);
      }
    }
  }

  updateConfig(patch: Partial<DrumMachineConfig>): void {
    this._config = { ...this._config, ...patch };
  }

  getConfig(): DrumMachineConfig { return this._config; }
  connect(dest: AudioNode): void { this._output.connect(dest); }
  disconnect(): void             { this._output.disconnect(); }
}
