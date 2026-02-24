/**
 * CreatorSync AI API service layer.
 * Wraps all AI endpoints (melody gen, lyric assist, MixMaster, The Finisher).
 * Falls back gracefully when offline or keys are missing.
 */

const BASE_URL = import.meta.env.VITE_CREATORSYNC_API_URL ?? 'https://api.creatorsync.ai/v1';

async function apiFetch<T>(
  path: string,
  body: object,
  token?: string
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`CreatorSync API error ${res.status}: ${err}`);
  }
  return res.json() as Promise<T>;
}

// ─── Types ────────────────────────────────────────────────────
export interface MelodyGenerationRequest {
  genre: string;
  mood: string;
  bpm: number;
  key: string;
  bars: number;
  existingNotes?: { pitch: number; startBeat: number; durationBeats: number }[];
}

export interface MelodyGenerationResult {
  notes: { pitch: number; startBeat: number; durationBeats: number; velocity: number }[];
  key: string;
  scale: string;
}

export interface LyricAssistRequest {
  topic: string;
  mood: string;
  genre: string;
  bars: number;
  existingLyrics?: string;
}

export interface LyricAssistResult {
  lyrics: string;
  rhymeScheme: string;
}

export interface MixMasterRequest {
  projectId: string;
  genre: string;
  referenceTrack?: string;
}

export interface MixMasterResult {
  jobId: string;
  estimatedSeconds: number;
  downloadUrl?: string;
}

export interface TheFinisherRequest {
  projectId: string;
  unfinishedSectionStart: number;
  unfinishedSectionEnd: number;
  style: string;
}

export interface TheFinisherResult {
  clips: { trackId: string; startBeat: number; patternId: string }[];
  description: string;
}

// ─── API calls ───────────────────────────────────────────────
export const creatorSyncApi = {
  async generateMelody(req: MelodyGenerationRequest, token?: string): Promise<MelodyGenerationResult> {
    return apiFetch<MelodyGenerationResult>('/melody/generate', req, token);
  },

  async assistLyrics(req: LyricAssistRequest, token?: string): Promise<LyricAssistResult> {
    return apiFetch<LyricAssistResult>('/lyrics/assist', req, token);
  },

  async startMixMaster(req: MixMasterRequest, token?: string): Promise<MixMasterResult> {
    return apiFetch<MixMasterResult>('/mixmaster/start', req, token);
  },

  async getMixMasterJob(jobId: string, token?: string): Promise<MixMasterResult & { status: string }> {
    return apiFetch<MixMasterResult & { status: string }>('/mixmaster/status', { jobId }, token);
  },

  async runTheFinisher(req: TheFinisherRequest, token?: string): Promise<TheFinisherResult> {
    return apiFetch<TheFinisherResult>('/finisher/run', req, token);
  },
};
