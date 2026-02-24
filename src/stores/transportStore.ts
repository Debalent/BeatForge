import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { TransportState } from '@/types';

interface TransportStore extends TransportState {
  // Playback
  play: () => void;
  pause: () => void;
  stop: () => void;
  togglePlay: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  // Position
  seekTo: (beat: number) => void;
  setCurrentBeat: (beat: number) => void;
  // Loop
  setLoop: (start: number, end: number) => void;
  toggleLoop: () => void;
  // Tempo
  setBPM: (bpm: number) => void;
  nudgeBPM: (delta: number) => void;
  setTimeSignature: (num: number, den: number) => void;
  setSwing: (pct: number) => void;
  // Volume / Pan
  setMasterVolume: (v: number) => void;
  setMasterPan: (p: number) => void;
  // Metronome
  toggleMetronome: () => void;
  toggleCountIn: () => void;
}

export const useTransportStore = create<TransportStore>()(
  immer((set) => ({
    playing: false,
    recording: false,
    looping: false,
    loopStart: 0,
    loopEnd: 8,
    currentBeat: 0,
    bpm: 128,
    timeSignature: [4, 4],
    metronome: false,
    countIn: false,
    swing: 0,
    masterVolume: 1,
    masterPan: 0,

    play() {
      set((s) => { s.playing = true; });
    },
    pause() {
      set((s) => { s.playing = false; });
    },
    stop() {
      set((s) => { s.playing = false; s.recording = false; s.currentBeat = 0; });
    },
    togglePlay() {
      set((s) => { s.playing = !s.playing; });
    },
    startRecording() {
      set((s) => { s.recording = true; s.playing = true; });
    },
    stopRecording() {
      set((s) => { s.recording = false; });
    },
    seekTo(beat) {
      set((s) => { s.currentBeat = Math.max(0, beat); });
    },
    setCurrentBeat(beat) {
      set((s) => { s.currentBeat = beat; });
    },
    setLoop(start, end) {
      set((s) => { s.loopStart = start; s.loopEnd = end; });
    },
    toggleLoop() {
      set((s) => { s.looping = !s.looping; });
    },
    setBPM(bpm) {
      set((s) => { s.bpm = Math.max(20, Math.min(999, bpm)); });
    },
    nudgeBPM(delta) {
      set((s) => { s.bpm = Math.max(20, Math.min(999, s.bpm + delta)); });
    },
    setTimeSignature(num, den) {
      set((s) => { s.timeSignature = [num, den]; });
    },
    setSwing(pct) {
      set((s) => { s.swing = Math.max(0, Math.min(100, pct)); });
    },
    setMasterVolume(v) {
      set((s) => { s.masterVolume = Math.max(0, Math.min(2, v)); });
    },
    setMasterPan(p) {
      set((s) => { s.masterPan = Math.max(-1, Math.min(1, p)); });
    },
    toggleMetronome() {
      set((s) => { s.metronome = !s.metronome; });
    },
    toggleCountIn() {
      set((s) => { s.countIn = !s.countIn; });
    },
  }))
);
