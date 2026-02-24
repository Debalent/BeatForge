/**
 * BeatForge Polyphonic Synthesizer
 * Voice-per-note WebAudio graph with ADSR, oscillator types, filter.
 */
import { audioEngine } from './AudioEngine';

export type OscType = 'sine' | 'sawtooth' | 'square' | 'triangle' | 'custom';
export type FilterType = 'lowpass' | 'highpass' | 'bandpass' | 'notch';

export interface SynthParams {
  osc1Type: OscType;
  osc1Detune: number;       // cents
  osc2Type: OscType;
  osc2Detune: number;
  osc2Mix: number;          // 0-1
  filterType: FilterType;
  filterFreq: number;
  filterQ: number;
  filterEnvAmt: number;     // semitones
  attack:  number;          // s
  decay:   number;          // s
  sustain: number;          // 0-1
  release: number;          // s
  fAttack:  number;
  fDecay:   number;
  fSustain: number;
  fRelease: number;
  pitchBend: number;        // semitones
  glide: number;            // s
  volume: number;           // 0-1
  pan: number;              // -1..1
  unisonVoices: number;     // 1-8
  unisonDetune: number;     // cents spread
  subOscLevel: number;
  noiseLevel: number;
}

export const DEFAULT_SYNTH_PARAMS: SynthParams = {
  osc1Type: 'sawtooth',
  osc1Detune: 0,
  osc2Type: 'sawtooth',
  osc2Detune: -7,
  osc2Mix: 0.4,
  filterType: 'lowpass',
  filterFreq: 4000,
  filterQ: 1,
  filterEnvAmt: 24,
  attack: 0.01,
  decay: 0.3,
  sustain: 0.6,
  release: 0.5,
  fAttack: 0.01,
  fDecay: 0.2,
  fSustain: 0.3,
  fRelease: 0.4,
  pitchBend: 0,
  glide: 0,
  volume: 0.8,
  pan: 0,
  unisonVoices: 1,
  unisonDetune: 10,
  subOscLevel: 0,
  noiseLevel: 0,
};

const MIDI_A4_HZ  = 440;
const MIDI_A4_NUM = 69;
const midiToHz = (note: number, bend = 0): number =>
  MIDI_A4_HZ * Math.pow(2, (note + bend - MIDI_A4_NUM) / 12);

interface SynthVoice {
  note: number;
  osc1: OscillatorNode;
  osc2: OscillatorNode;
  sub: OscillatorNode;
  noise: AudioBufferSourceNode;
  noiseGain: GainNode;
  filter: BiquadFilterNode;
  ampEnv: GainNode;
  filterEnvGain: GainNode;
  output: GainNode;
  startTime: number;
}

export class PolySynth {
  private _voices = new Map<number, SynthVoice[]>();
  private _params: SynthParams;
  private _output: GainNode;
  private _panNode: StereoPannerNode;
  private _maxVoices = 32;

  constructor(params: Partial<SynthParams> = {}) {
    this._params = { ...DEFAULT_SYNTH_PARAMS, ...params };
    const ctx = audioEngine.ctx!;
    this._output  = ctx.createGain();
    this._panNode = ctx.createStereoPanner();
    this._output.connect(this._panNode);
    this._panNode.connect(audioEngine.masterGain!);
    this._output.gain.value  = this._params.volume;
    this._panNode.pan.value  = this._params.pan;
  }

  noteOn(note: number, velocity: number, time?: number): void {
    const ctx = audioEngine.ctx;
    if (!ctx) return;
    const t    = time ?? ctx.currentTime;
    const p    = this._params;
    const freq = midiToHz(note, p.pitchBend);
    const vel  = velocity / 127;

    // Release any existing voice on this note
    this.noteOff(note, t);

    const voices: SynthVoice[] = [];
    const uCount = Math.max(1, Math.min(8, p.unisonVoices));

    for (let u = 0; u < uCount; u++) {
      const detuneSpread = uCount > 1
        ? ((u / (uCount - 1)) - 0.5) * p.unisonDetune
        : 0;

      // OSC 1
      const osc1 = ctx.createOscillator();
      osc1.type = p.osc1Type === 'custom' ? 'sawtooth' : p.osc1Type as OscillatorType;
      osc1.frequency.value = freq;
      osc1.detune.value    = p.osc1Detune + detuneSpread;

      // OSC 2
      const osc2 = ctx.createOscillator();
      osc2.type = p.osc2Type === 'custom' ? 'sawtooth' : p.osc2Type as OscillatorType;
      osc2.frequency.value = freq;
      osc2.detune.value    = p.osc2Detune + detuneSpread;

      // Sub
      const sub = ctx.createOscillator();
      sub.type = 'sine';
      sub.frequency.value = freq / 2;

      // Noise
      const noiseBuf = this._createNoiseBuf(ctx);
      const noise    = ctx.createBufferSource();
      noise.buffer   = noiseBuf;
      noise.loop     = true;
      const noiseGain = ctx.createGain();
      noiseGain.gain.value = p.noiseLevel * vel;
      noise.connect(noiseGain);

      // Osc2 mix gain
      const osc2Mix = ctx.createGain();
      osc2Mix.gain.value = p.osc2Mix;

      // Sub gain
      const subGain = ctx.createGain();
      subGain.gain.value = p.subOscLevel;

      // Filter
      const filter = ctx.createBiquadFilter();
      filter.type            = p.filterType;
      filter.frequency.value = p.filterFreq;
      filter.Q.value         = p.filterQ;

      // Filter envelope
      const filterEnvGain = ctx.createGain();
      filterEnvGain.gain.value = 0;
      filterEnvGain.connect(filter.detune);

      // Amp envelope
      const ampEnv = ctx.createGain();
      ampEnv.gain.setValueAtTime(0, t);
      ampEnv.gain.linearRampToValueAtTime(vel, t + p.attack);
      ampEnv.gain.linearRampToValueAtTime(vel * p.sustain, t + p.attack + p.decay);

      // Filter envelope
      const fEnvPeak = p.filterEnvAmt * 100; // semitones → cents
      filterEnvGain.gain.setValueAtTime(0, t);
      filterEnvGain.gain.linearRampToValueAtTime(fEnvPeak, t + p.fAttack);
      filterEnvGain.gain.linearRampToValueAtTime(fEnvPeak * p.fSustain, t + p.fAttack + p.fDecay);

      // Output
      const voiceOut = ctx.createGain();
      voiceOut.gain.value = 1 / uCount;

      // Graph
      osc1.connect(filter);
      osc2.connect(osc2Mix).connect(filter);
      sub.connect(subGain).connect(filter);
      noiseGain.connect(filter);
      filter.connect(ampEnv).connect(voiceOut).connect(this._output);

      osc1.start(t); osc2.start(t); sub.start(t); noise.start(t);

      voices.push({ note, osc1, osc2, sub, noise, noiseGain, filter, ampEnv, filterEnvGain, output: voiceOut, startTime: t });
    }

    this._voices.set(note, voices);

    // Limit polyphony
    if (this._voices.size > this._maxVoices) {
      const oldest = [...this._voices.entries()][0];
      this._releaseVoices(oldest[1], ctx.currentTime);
      this._voices.delete(oldest[0]);
    }
  }

  noteOff(note: number, time?: number): void {
    const ctx = audioEngine.ctx;
    if (!ctx) return;
    const t = time ?? ctx.currentTime;
    const voices = this._voices.get(note);
    if (voices) {
      this._releaseVoices(voices, t);
      this._voices.delete(note);
    }
  }

  private _releaseVoices(voices: SynthVoice[], t: number): void {
    const p = this._params;
    for (const v of voices) {
      v.ampEnv.gain.cancelScheduledValues(t);
      v.ampEnv.gain.setValueAtTime(v.ampEnv.gain.value, t);
      v.ampEnv.gain.linearRampToValueAtTime(0, t + p.release);
      v.filterEnvGain.gain.cancelScheduledValues(t);
      v.filterEnvGain.gain.setValueAtTime(v.filterEnvGain.gain.value, t);
      v.filterEnvGain.gain.linearRampToValueAtTime(0, t + p.fRelease);
      const stop = t + p.release + 0.05;
      v.osc1.stop(stop); v.osc2.stop(stop); v.sub.stop(stop); v.noise.stop(stop);
    }
  }

  allNotesOff(): void {
    const ctx = audioEngine.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    for (const [note, voices] of this._voices) {
      this._releaseVoices(voices, t);
      this._voices.delete(note);
    }
  }

  updateParams(patch: Partial<SynthParams>): void {
    this._params = { ...this._params, ...patch };
    if (patch.volume !== undefined) this._output.gain.value = patch.volume;
    if (patch.pan    !== undefined) this._panNode.pan.value = patch.pan;
  }

  connect(dest: AudioNode): void { this._panNode.connect(dest); }
  disconnect(): void             { this._panNode.disconnect(); }

  private _createNoiseBuf(ctx: AudioContext): AudioBuffer {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }
}
