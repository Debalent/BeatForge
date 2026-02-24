/**
 * BeatForge Audio Engine
 * Core WebAudio + AudioWorklet orchestrator.
 * Single shared AudioContext for the whole app.
 */

import { useAudioEngineStore } from '@/stores/appStore';
import { useTransportStore } from '@/stores/transportStore';

// ─── Constants ────────────────────────────────────────────────
const BUFFER_SIZES = [128, 256, 512, 1024, 2048] as const;
const METRONOME_ACCENT_FREQ = 1800;
const METRONOME_BEAT_FREQ   = 960;

// ─── Types ────────────────────────────────────────────────────
export interface ScheduledEvent {
  id: string;
  time: number;   // AudioContext time (seconds)
  beat: number;
  callback: () => void;
}

// ─── Singleton Engine ─────────────────────────────────────────
class AudioEngine {
  private static _instance: AudioEngine | null = null;
  static getInstance(): AudioEngine {
    if (!AudioEngine._instance) AudioEngine._instance = new AudioEngine();
    return AudioEngine._instance;
  }

  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;
  masterAnalyser: AnalyserNode | null = null;
  masterLimiter: DynamicsCompressorNode | null = null;
  metronomeDest: GainNode | null = null;

  private _lookahead    = 0.1;   // seconds
  private _schedInterval = 25;   // ms
  private _schedTimer: ReturnType<typeof setInterval> | null = null;
  private _scheduledEvents: ScheduledEvent[] = [];
  private _nextBeatTime = 0;
  private _currentBeat  = 0;

  private _cpuCheckInterval: ReturnType<typeof setInterval> | null = null;
  private _wasmDsp: WasmDspBridge | null = null;

  // ─── Init ─────────────────────────────────────────────────
  async init(bufferSize: number = 256): Promise<void> {
    if (this.ctx) return;

    this.ctx = new AudioContext({
      sampleRate: 44100,
      latencyHint: 'interactive',
    });

    // Resume on user gesture (browser autoplay policy)
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    // Build master chain: track nodes → masterGain → limiter → analyser → destination
    this.masterGain     = this.ctx.createGain();
    this.masterLimiter  = this.ctx.createDynamicsCompressor();
    this.masterAnalyser = this.ctx.createAnalyser();
    this.metronomeDest  = this.ctx.createGain();

    this.masterLimiter.threshold.value = -1;
    this.masterLimiter.knee.value       = 0;
    this.masterLimiter.ratio.value      = 20;
    this.masterLimiter.attack.value     = 0.001;
    this.masterLimiter.release.value    = 0.1;

    this.masterAnalyser.fftSize = 2048;
    this.masterAnalyser.smoothingTimeConstant = 0.85;

    this.masterGain
      .connect(this.masterLimiter)
      .connect(this.masterAnalyser)
      .connect(this.ctx.destination);

    this.metronomeDest.connect(this.ctx.destination);

    // Load AudioWorklets
    await this._registerWorklets();

    // Load WASM DSP
    this._wasmDsp = new WasmDspBridge();
    await this._wasmDsp.load();

    // Start CPU monitoring
    this._startCpuMonitor();

    const store = useAudioEngineStore.getState();
    store.setInitialized(true);
    store.setLatency(this.ctx.baseLatency * 1000);
    store.setBufferSize(bufferSize);
    store.setWasmLoaded(this._wasmDsp.loaded);

    console.info('[AudioEngine] Initialized. SR:', this.ctx.sampleRate);
  }

  // ─── Worklet registration ─────────────────────────────────
  private async _registerWorklets(): Promise<void> {
    if (!this.ctx) return;
    const base = import.meta.env.BASE_URL;
    const worklets = [
      `${base}worklets/meter-processor.js`,
      `${base}worklets/gain-processor.js`,
    ];
    for (const url of worklets) {
      try {
        await this.ctx.audioWorklet.addModule(url);
      } catch (e) {
        console.warn('[AudioEngine] Worklet not found (dev mode):', url, e);
      }
    }
  }

  // ─── Transport scheduler (Web Audio clock) ─────────────────
  startScheduler(): void {
    const transport = useTransportStore.getState();
    if (!this.ctx) return;
    this._nextBeatTime = this.ctx.currentTime + 0.05;
    this._currentBeat  = transport.currentBeat;
    this._schedTimer   = setInterval(() => this._scheduleBeats(), this._schedInterval);
  }

  stopScheduler(): void {
    if (this._schedTimer) { clearInterval(this._schedTimer); this._schedTimer = null; }
    this._scheduledEvents = [];
  }

  private _scheduleBeats(): void {
    if (!this.ctx) return;
    const transport = useTransportStore.getState();
    const secPerBeat = 60 / transport.bpm;

    while (this._nextBeatTime < this.ctx.currentTime + this._lookahead) {
      this._triggerBeat(this._currentBeat, this._nextBeatTime);

      // Loop handling
      if (transport.looping && this._currentBeat >= transport.loopEnd) {
        this._currentBeat = transport.loopStart;
      }

      this._nextBeatTime += secPerBeat;
      this._currentBeat  += 1;
    }

    // Drain past events
    this._scheduledEvents = this._scheduledEvents.filter(
      (e) => e.time > this.ctx!.currentTime - 0.1
    );

    // Update UI beat position
    const beatPos = this._currentBeat - (this._nextBeatTime - this.ctx.currentTime) / secPerBeat;
    useTransportStore.getState().setCurrentBeat(Math.max(0, beatPos));
  }

  private _triggerBeat(beat: number, time: number): void {
    const transport = useTransportStore.getState();
    const [num] = transport.timeSignature;
    const isAccent = beat % num === 0;

    if (transport.metronome) {
      this._playMetronomeClick(time, isAccent);
    }

    // Fire registered beat callbacks
    this._scheduledEvents
      .filter((e) => Math.abs(e.beat - beat) < 0.01)
      .forEach((e) => e.callback());
  }

  scheduleEvent(event: ScheduledEvent): void {
    this._scheduledEvents.push(event);
  }

  // ─── Metronome ────────────────────────────────────────────
  private _playMetronomeClick(time: number, accent: boolean): void {
    if (!this.ctx || !this.metronomeDest) return;
    const osc  = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain).connect(this.metronomeDest);
    osc.frequency.value = accent ? METRONOME_ACCENT_FREQ : METRONOME_BEAT_FREQ;
    gain.gain.setValueAtTime(accent ? 0.4 : 0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
    osc.start(time);
    osc.stop(time + 0.07);
  }

  // ─── Master volume ────────────────────────────────────────
  setMasterVolume(v: number, rampMs = 20): void {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(t);
    this.masterGain.gain.setTargetAtTime(v, t, rampMs / 1000);
  }

  // ─── Analyser helpers ─────────────────────────────────────
  getWaveformData(buf: Float32Array): void {
    this.masterAnalyser?.getFloatTimeDomainData(buf as Float32Array<ArrayBuffer>);
  }

  getFrequencyData(buf: Float32Array): void {
    this.masterAnalyser?.getFloatFrequencyData(buf as Float32Array<ArrayBuffer>);
  }

  getByteFrequencyData(buf: Uint8Array): void {
    this.masterAnalyser?.getByteFrequencyData(buf as Uint8Array<ArrayBuffer>);
  }

  // ─── CPU monitoring ───────────────────────────────────────
  private _startCpuMonitor(): void {
    // Approximate CPU load via AudioContext timing drift
    let lastCheck = performance.now();
    this._cpuCheckInterval = setInterval(() => {
      if (!this.ctx) return;
      const now = performance.now();
      const delta = now - lastCheck;
      lastCheck = now;
      // Normalize to 0-100 rough estimate
      const load = Math.min(100, Math.max(0, (delta - 25) / 25 * 100));
      useAudioEngineStore.getState().setCpuLoad(Math.round(load));
    }, 500);
  }

  // ─── Suspend / Resume ─────────────────────────────────────
  async suspend(): Promise<void>  { await this.ctx?.suspend(); }
  async resume(): Promise<void>   { await this.ctx?.resume(); }

  // ─── Cleanup ──────────────────────────────────────────────
  async destroy(): Promise<void> {
    this.stopScheduler();
    if (this._cpuCheckInterval) clearInterval(this._cpuCheckInterval);
    await this.ctx?.close();
    this.ctx = null;
    AudioEngine._instance = null;
  }

  get context(): AudioContext | undefined { return this.ctx ?? undefined; }
  get sampleRate(): number { return this.ctx?.sampleRate ?? 44100; }
  get currentTime(): number { return this.ctx?.currentTime ?? 0; }
  get state(): AudioContextState { return this.ctx?.state ?? 'closed'; }
}

export const audioEngine = AudioEngine.getInstance();

// ─── WASM DSP Bridge ──────────────────────────────────────────
export class WasmDspBridge {
  loaded = false;
  private _module: Record<string, unknown> | null = null;

  async load(): Promise<void> {
    try {
      const base = import.meta.env.BASE_URL;
      const wasmUrl = `${base}wasm/beatforge_dsp.js`;
      // Dynamically import the WASM glue module
      const mod = await import(/* @vite-ignore */ wasmUrl).catch(() => null);
      if (mod) {
        this._module = mod as Record<string, unknown>;
        if (typeof (mod as Record<string, unknown>).default === 'function') {
          await (mod.default as () => Promise<void>)();
        }
        this.loaded = true;
        console.info('[WasmDsp] WASM DSP module loaded');
      } else {
        console.warn('[WasmDsp] WASM module not found — running JS DSP fallback');
      }
    } catch (e) {
      console.warn('[WasmDsp] WASM load error:', e);
    }
  }

  // ─── JS fallback DSP functions (until WASM is compiled) ──

  /** Fast RMS calculation over a Float32Array block */
  rms(buffer: Float32Array): number {
    if (this._module && typeof (this._module as Record<string, unknown>).rms === 'function') {
      return (this._module as Record<string, (...args: unknown[]) => number>).rms(buffer);
    }
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
    return Math.sqrt(sum / buffer.length);
  }

  /** Peak value */
  peak(buffer: Float32Array): number {
    let max = 0;
    for (let i = 0; i < buffer.length; i++) {
      const abs = Math.abs(buffer[i]);
      if (abs > max) max = abs;
    }
    return max;
  }

  /** Soft clip / saturation (Tanh) */
  saturate(buffer: Float32Array, drive: number): Float32Array {
    const out = new Float32Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      out[i] = Math.tanh(buffer[i] * drive);
    }
    return out;
  }

  /** Simple 1-pole low-pass filter */
  lowPass(buffer: Float32Array, cutoff: number, sampleRate: number): Float32Array {
    const rc = 1.0 / (cutoff * 2 * Math.PI);
    const dt = 1.0 / sampleRate;
    const alpha = dt / (rc + dt);
    const out = new Float32Array(buffer.length);
    let prev = 0;
    for (let i = 0; i < buffer.length; i++) {
      prev = prev + alpha * (buffer[i] - prev);
      out[i] = prev;
    }
    return out;
  }

  /** Linear to dB */
  linToDb(linear: number): number {
    return 20 * Math.log10(Math.max(0.00001, linear));
  }

  /** dB to linear */
  dbToLin(db: number): number {
    return Math.pow(10, db / 20);
  }

  /** LUFS (simplified short-term) */
  lufsShortTerm(buffer: Float32Array): number {
    const rmsVal = this.rms(buffer);
    return -0.691 + 10 * Math.log10(rmsVal * rmsVal + 1e-10);
  }

  /** Pitch shift (semitones) using playback rate approximation */
  pitchShiftRatio(semitones: number): number {
    return Math.pow(2, semitones / 12);
  }

  /** BPM from beat map (autocorrelation placeholder) */
  detectBPM(_buffer: Float32Array, _sampleRate: number): number {
    return 0; // Placeholder — full implementation in Rust WASM
  }
}
