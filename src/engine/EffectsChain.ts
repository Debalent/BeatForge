/**
 * BeatForge DSP Effects Suite
 * All effects are WebAudio graph sub-chains.
 * Each effect: input node → processing → output node.
 */
import { audioEngine } from './AudioEngine';
import type { EffectInstance, EQBand } from '@/types';

// ─── Base Effect ──────────────────────────────────────────────
abstract class BaseEffect {
  input: GainNode;
  output: GainNode;
  wet: GainNode;
  dry: GainNode;
  _enabled = true;

  constructor() {
    const ctx = audioEngine.ctx!;
    this.input  = ctx.createGain();
    this.output = ctx.createGain();
    this.wet    = ctx.createGain();
    this.dry    = ctx.createGain();
    this.wet.gain.value = 1;
    this.dry.gain.value = 0;
    // dry path: input → dry → output
    this.input.connect(this.dry).connect(this.output);
  }

  setWetDry(wetAmt: number): void {
    this.wet.gain.value = wetAmt;
    this.dry.gain.value = 1 - wetAmt;
  }

  abstract applyParams(params: Record<string, number | string | boolean>): void;

  enable():  void { this._enabled = true;  this.output.gain.value = 1; }
  disable(): void { this._enabled = false; this.output.gain.value = 0; }
}

// ─── Parametric EQ ────────────────────────────────────────────
export class ParametricEQ extends BaseEffect {
  private _bands: BiquadFilterNode[] = [];

  constructor(bands: EQBand[] = []) {
    super();
    const ctx = audioEngine.ctx!;
    let prev: AudioNode = this.input;
    for (const band of bands) {
      const f = ctx.createBiquadFilter();
      f.type            = band.type as BiquadFilterType;
      f.frequency.value = band.frequency;
      f.gain.value      = band.gain;
      f.Q.value         = band.q;
      prev.connect(f);
      prev = f;
      this._bands.push(f);
    }
    prev.connect(this.wet).connect(this.output);
    this.dry.gain.value = 0;
    this.wet.gain.value = 1;
  }

  setBand(index: number, freq: number, gain: number, q: number): void {
    const f = this._bands[index];
    if (!f) return;
    f.frequency.value = freq;
    f.gain.value      = gain;
    f.Q.value         = q;
  }

  applyParams(params: Record<string, number | string | boolean>): void {
    if (typeof params.wet === 'number') this.setWetDry(params.wet as number);
  }
}

// ─── Compressor ───────────────────────────────────────────────
export class CompressorEffect extends BaseEffect {
  private _comp: DynamicsCompressorNode;

  constructor() {
    super();
    const ctx = audioEngine.ctx!;
    this._comp = ctx.createDynamicsCompressor();
    this._comp.threshold.value = -24;
    this._comp.knee.value       = 6;
    this._comp.ratio.value      = 4;
    this._comp.attack.value     = 0.003;
    this._comp.release.value    = 0.25;
    this.input.connect(this._comp).connect(this.wet).connect(this.output);
    this.dry.gain.value = 0;
    this.wet.gain.value = 1;
  }

  applyParams(params: Record<string, number | string | boolean>): void {
    if (typeof params.threshold === 'number') this._comp.threshold.value = params.threshold as number;
    if (typeof params.knee      === 'number') this._comp.knee.value      = params.knee as number;
    if (typeof params.ratio     === 'number') this._comp.ratio.value     = params.ratio as number;
    if (typeof params.attack    === 'number') this._comp.attack.value    = params.attack as number;
    if (typeof params.release   === 'number') this._comp.release.value   = params.release as number;
    if (typeof params.wet       === 'number') this.setWetDry(params.wet as number);
  }

  get reduction(): number { return this._comp.reduction; }
}

// ─── Reverb (Convolution) ─────────────────────────────────────
export class ReverbEffect extends BaseEffect {
  private _conv: ConvolverNode;
  private _preDelay: DelayNode;

  constructor() {
    super();
    const ctx = audioEngine.ctx!;
    this._conv     = ctx.createConvolver();
    this._preDelay = ctx.createDelay(0.1);
    this.input.connect(this._preDelay).connect(this._conv).connect(this.wet).connect(this.output);
    this.dry.gain.value = 0.6;
    this.wet.gain.value = 0.4;
    this._generateIR(2.5, 0.3);
  }

  /** Synthetic IR generation (no IR file needed) */
  private _generateIR(duration: number, decay: number): void {
    const ctx = audioEngine.ctx!;
    const sr   = ctx.sampleRate;
    const len  = Math.ceil(sr * duration);
    const buf  = ctx.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay * 10);
      }
    }
    this._conv.buffer = buf;
  }

  applyParams(params: Record<string, number | string | boolean>): void {
    if (typeof params.wet       === 'number') this.setWetDry(params.wet as number);
    if (typeof params.dry       === 'number') this.dry.gain.value = params.dry as number;
    if (typeof params.preDelay  === 'number') this._preDelay.delayTime.value = params.preDelay as number;
    if (typeof params.duration  === 'number' || typeof params.decay === 'number') {
      this._generateIR(
        typeof params.duration === 'number' ? params.duration as number : 2.5,
        typeof params.decay    === 'number' ? params.decay    as number : 0.3
      );
    }
  }
}

// ─── Delay ────────────────────────────────────────────────────
export class DelayEffect extends BaseEffect {
  private _delay: DelayNode;
  private _fb: GainNode;
  private _lpf: BiquadFilterNode;

  constructor() {
    super();
    const ctx     = audioEngine.ctx!;
    this._delay   = ctx.createDelay(5);
    this._fb      = ctx.createGain();
    this._lpf     = ctx.createBiquadFilter();
    this._delay.delayTime.value = 0.375;  // 1/8 @ 80bpm
    this._fb.gain.value         = 0.35;
    this._lpf.frequency.value   = 5000;

    this.input.connect(this._delay).connect(this._lpf).connect(this.wet).connect(this.output);
    this._lpf.connect(this._fb).connect(this._delay);
    this.dry.gain.value = 0.7;
    this.wet.gain.value = 0.3;
  }

  syncToBPM(bpm: number, subdivision = 0.5): void {
    this._delay.delayTime.value = (60 / bpm) * subdivision;
  }

  applyParams(params: Record<string, number | string | boolean>): void {
    if (typeof params.time     === 'number') this._delay.delayTime.value = params.time as number;
    if (typeof params.feedback === 'number') this._fb.gain.value         = params.feedback as number;
    if (typeof params.lpf      === 'number') this._lpf.frequency.value   = params.lpf as number;
    if (typeof params.wet      === 'number') this.setWetDry(params.wet as number);
  }
}

// ─── Chorus ───────────────────────────────────────────────────
export class ChorusEffect extends BaseEffect {
  private _delays: DelayNode[];
  private _lfos:   OscillatorNode[];

  constructor() {
    super();
    const ctx  = audioEngine.ctx!;
    const N    = 3;
    this._delays = [];
    this._lfos   = [];

    for (let i = 0; i < N; i++) {
      const delay = ctx.createDelay(0.05);
      delay.delayTime.value = 0.02 + i * 0.005;
      const lfo   = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.value = 0.5 + i * 0.3;
      depth.gain.value    = 0.003;
      lfo.connect(depth).connect(delay.delayTime);
      this.input.connect(delay).connect(this.wet);
      lfo.start();
      this._delays.push(delay);
      this._lfos.push(lfo);
    }
    this.wet.connect(this.output);
    this.dry.gain.value = 0.5;
    this.wet.gain.value = 0.5;
  }

  applyParams(params: Record<string, number | string | boolean>): void {
    if (typeof params.rate  === 'number') this._lfos.forEach((l) => { l.frequency.value  = params.rate as number; });
    if (typeof params.wet   === 'number') this.setWetDry(params.wet as number);
  }
}

// ─── Saturation / Waveshaper ──────────────────────────────────
export class SaturationEffect extends BaseEffect {
  private _shaper: WaveShaperNode;

  constructor() {
    super();
    const ctx    = audioEngine.ctx!;
    this._shaper = ctx.createWaveShaper();
    this._shaper.curve    = this._makeCurve(200) as Float32Array<ArrayBuffer>;
    this._shaper.oversample = '4x';
    this.input.connect(this._shaper).connect(this.wet).connect(this.output);
    this.dry.gain.value = 0;
    this.wet.gain.value = 1;
  }

  private _makeCurve(amount: number): Float32Array {
    const n = 256;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

  applyParams(params: Record<string, number | string | boolean>): void {
    if (typeof params.drive === 'number') this._shaper.curve = this._makeCurve(params.drive as number * 400) as Float32Array<ArrayBuffer>;
    if (typeof params.wet   === 'number') this.setWetDry(params.wet as number);
  }
}

// ─── Noise Gate ───────────────────────────────────────────────
export class NoiseGateEffect extends BaseEffect {
  private _comp: DynamicsCompressorNode;

  constructor() {
    super();
    const ctx   = audioEngine.ctx!;
    this._comp  = ctx.createDynamicsCompressor();
    this._comp.threshold.value = -50;
    this._comp.knee.value       = 0;
    this._comp.ratio.value      = 20;
    this._comp.attack.value     = 0.001;
    this._comp.release.value    = 0.05;
    this.input.connect(this._comp).connect(this.wet).connect(this.output);
    this.dry.gain.value = 0;
    this.wet.gain.value = 1;
  }

  applyParams(params: Record<string, number | string | boolean>): void {
    if (typeof params.threshold === 'number') this._comp.threshold.value = params.threshold as number;
    if (typeof params.release   === 'number') this._comp.release.value   = params.release as number;
    if (typeof params.wet       === 'number') this.setWetDry(params.wet as number);
  }
}

// ─── Limiter ──────────────────────────────────────────────────
export class LimiterEffect extends BaseEffect {
  private _comp: DynamicsCompressorNode;

  constructor() {
    super();
    const ctx  = audioEngine.ctx!;
    this._comp = ctx.createDynamicsCompressor();
    this._comp.threshold.value = -1;
    this._comp.knee.value       = 0;
    this._comp.ratio.value      = 20;
    this._comp.attack.value     = 0.001;
    this._comp.release.value    = 0.1;
    this.input.connect(this._comp).connect(this.wet).connect(this.output);
    this.dry.gain.value = 0;
    this.wet.gain.value = 1;
  }

  applyParams(params: Record<string, number | string | boolean>): void {
    if (typeof params.threshold === 'number') this._comp.threshold.value = params.threshold as number;
    if (typeof params.wet       === 'number') this.setWetDry(params.wet as number);
  }
}

// ─── Effect Factory ───────────────────────────────────────────
export function createEffect(instance: EffectInstance): BaseEffect {
  switch (instance.type) {
    case 'eq_parametric':       return new ParametricEQ();
    case 'compressor':          return new CompressorEffect();
    case 'compressor_multiband': return new CompressorEffect(); // TODO: multiband
    case 'limiter':             return new LimiterEffect();
    case 'reverb':              return new ReverbEffect();
    case 'delay':               return new DelayEffect();
    case 'chorus':              return new ChorusEffect();
    case 'flanger':             return new ChorusEffect();   // Flanger = short chorus
    case 'phaser':              return new ChorusEffect();   // Phaser stub
    case 'saturation':          return new SaturationEffect();
    case 'transient_shaper':    return new CompressorEffect(); // Stub
    case 'noise_gate':          return new NoiseGateEffect();
    default:                   return new CompressorEffect();
  }
}

// ─── Effect Chain ─────────────────────────────────────────────
export class EffectChain {
  private _chain: BaseEffect[] = [];
  input: GainNode;
  output: GainNode;

  constructor() {
    const ctx  = audioEngine.ctx!;
    this.input  = ctx.createGain();
    this.output = ctx.createGain();
    this.input.connect(this.output);
  }

  addEffect(fx: BaseEffect): void {
    const prev = this._chain.length > 0
      ? this._chain[this._chain.length - 1].output
      : this.input;

    this.output.disconnect();
    prev.connect(fx.input);
    fx.output.connect(this.output);
    this._chain.push(fx);
  }

  removeEffect(index: number): void {
    if (index < 0 || index >= this._chain.length) return;
    // Rebuild chain
    this._rebuildChain(this._chain.filter((_, i) => i !== index));
  }

  private _rebuildChain(effects: BaseEffect[]): void {
    this._chain.forEach((fx) => { try { fx.input.disconnect(); fx.output.disconnect(); } catch { /* ignore */ } });
    this.input.disconnect();
    this._chain = effects;
    let prev: AudioNode = this.input;
    for (const fx of this._chain) {
      prev.connect(fx.input);
      prev = fx.output;
    }
    prev.connect(this.output);
  }

  getChain(): BaseEffect[] { return [...this._chain]; }
}
