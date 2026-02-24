import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { AudioEngineState, UserSubscription, CreatorSyncProfile, MixMasterJob, PlanTier, BillingPeriod } from '@/types';

interface AudioEngineStore extends AudioEngineState {
  setInitialized: (v: boolean) => void;
  setWasmLoaded: (v: boolean) => void;
  setCpuLoad: (v: number) => void;
  setLatency: (v: number) => void;
  setBufferSize: (v: number) => void;
}

export const useAudioEngineStore = create<AudioEngineStore>()(
  immer((set) => ({
    initialized: false,
    sampleRate: 44100,
    bufferSize: 256,
    latency: 0,
    cpuLoad: 0,
    wasmLoaded: false,

    setInitialized(v) { set((s) => { s.initialized = v; }); },
    setWasmLoaded(v)  { set((s) => { s.wasmLoaded = v; }); },
    setCpuLoad(v)     { set((s) => { s.cpuLoad = Math.max(0, Math.min(100, v)); }); },
    setLatency(v)     { set((s) => { s.latency = v; }); },
    setBufferSize(v)  { set((s) => { s.bufferSize = v; }); },
  }))
);

// ─── Auth / CreatorSync Store ──────────────────────────────────
interface AuthStore {
  profile: CreatorSyncProfile | null;
  subscription: UserSubscription;
  accessToken: string | null;
  setProfile: (p: CreatorSyncProfile | null) => void;
  setAccessToken: (t: string | null) => void;
  setSubscription: (s: UserSubscription) => void;
  logout: () => void;
  hasFeature: (key: keyof UserSubscription['features']) => boolean;
}

const FREE_PLAN: UserSubscription = {
  tier: 'free',
  billing: 'monthly',
  features: {
    maxTracks: 8,
    maxExportBitrate: 192,
    aiSuggestions: false,
    cloudSync: false,
    collaboration: false,
    soundPacks: 0,
    pluginMarketplace: false,
    prioritySupport: false,
    exportFormats: ['mp3', 'wav'],
    wapiAiMastering: false,
  },
  creatorSyncLinked: false,
};

export const useAuthStore = create<AuthStore>()(
  immer((set, get) => ({
    profile: null,
    subscription: FREE_PLAN,
    accessToken: null,

    setProfile(p)       { set((s) => { s.profile = p; }); },
    setAccessToken(t)   { set((s) => { s.accessToken = t; }); },
    setSubscription(su) { set((s) => { s.subscription = su; }); },
    logout() {
      set((s) => {
        s.profile = null;
        s.accessToken = null;
        s.subscription = FREE_PLAN;
      });
    },
    hasFeature(key) {
      return Boolean(get().subscription.features[key]);
    },
  }))
);

// ─── MixMaster Jobs Store ─────────────────────────────────────
interface MixMasterStore {
  jobs: MixMasterJob[];
  activeJobId: string | null;
  addJob: (job: MixMasterJob) => void;
  updateJob: (id: string, patch: Partial<MixMasterJob>) => void;
  removeJob: (id: string) => void;
  setActiveJob: (id: string | null) => void;
}

export const useMixMasterStore = create<MixMasterStore>()(
  immer((set) => ({
    jobs: [],
    activeJobId: null,
    addJob(job)           { set((s) => { s.jobs.push(job); }); },
    updateJob(id, patch)  {
      set((s) => {
        const j = s.jobs.find((j) => j.id === id);
        if (j) Object.assign(j, patch);
      });
    },
    removeJob(id)         { set((s) => { s.jobs = s.jobs.filter((j) => j.id !== id); }); },
    setActiveJob(id)      { set((s) => { s.activeJobId = id; }); },
  }))
);

// ─── Pricing constants (single source of truth) ────────────────
export interface PricingPlan {
  tier: PlanTier;
  label: string;
  monthly: number;
  annual: number;
  biennial: number;
  features: string[];
  highlight?: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    tier: 'free',
    label: 'Free',
    monthly: 0,
    annual: 0,
    biennial: 0,
    features: [
      '8 tracks',
      'MP3 / WAV export (192 kbps)',
      'Basic instruments',
      'Local project save',
      '1 GB storage',
    ],
  },
  {
    tier: 'pro',
    label: 'Pro',
    monthly: 14.99,
    annual: 11.99,   // /mo billed annually  ($143.88/yr)
    biennial: 9.99,  // /mo billed 2-yearly  ($239.76/2yr)
    highlight: true,
    features: [
      'Unlimited tracks',
      'All export formats (FLAC, STEM, 320 kbps MP3)',
      'All built-in effects & synths',
      'AI melody / lyric suggestions',
      'Cloud sync & version history',
      '10 GB storage',
      'Sound pack marketplace access',
      'Plugin marketplace access',
    ],
  },
  {
    tier: 'creator_sync_bundle',
    label: 'CreatorSync Bundle',
    monthly: 24.99,
    annual: 19.99,
    biennial: 16.99,
    features: [
      'Everything in Pro',
      'CreatorSync Premium included',
      'MixMaster AI mastering (unlimited)',
      'The Finisher AI lyric engine',
      'Real-time collaboration (up to 8)',
      'Royalty split management',
      'Direct distribution publish',
      '50 GB storage',
      'Priority support',
    ],
  },
];

export const billingMultiplier = (period: BillingPeriod): number =>
  period === 'monthly' ? 1 : period === 'annual' ? 12 : 24;
