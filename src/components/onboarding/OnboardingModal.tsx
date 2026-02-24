import { useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { Music2, Layers, Wand2, Users, ChevronRight, ChevronLeft, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    icon: Music2,
    title: 'Welcome to BeatForge',
    desc: 'A professional browser-based DAW. Create beats, melodies and full tracks right in your browser — no install required.',
    color: '#06b6d4',
  },
  {
    icon: Layers,
    title: 'The Arrangement',
    desc: 'Add tracks, draw patterns and arrange your song on the timeline. Drag clips to move them; resize from the right edge.',
    color: '#8b5cf6',
  },
  {
    icon: Music2,
    title: 'Piano Roll',
    desc: 'Double-click any clip to open the Piano Roll. Draw MIDI notes, set velocities and apply AI-generated melodies.',
    color: '#06b6d4',
  },
  {
    icon: Wand2,
    title: 'CreatorSync AI',
    desc: 'Use The Finisher to complete unfinished sections, MixMaster AI to perfect your mix, and the AI assistant for instant ideas.',
    color: '#f59e0b',
  },
  {
    icon: Users,
    title: 'Real-time Collaboration',
    desc: 'Invite collaborators to edit your project simultaneously. See each other\'s cursors and changes live via WebRTC.',
    color: '#10b981',
  },
];

export function OnboardingModal() {
  const { setOnboardingComplete } = useUIStore();
  const [step, setStep] = useState(0);

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-[480px] rounded-2xl border border-forge-border bg-forge-surface/95 shadow-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-forge-bg">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${((step + 1) / STEPS.length) * 100}%`,
              background: `linear-gradient(90deg, #06b6d4, #8b5cf6)`,
            }}
          />
        </div>

        <div className="p-8">
          {/* Logo header */}
          <div className="flex items-center gap-3 mb-6">
            <img src="/BeatForge/icons/logo.png" alt="BeatForge" className="h-8 w-8 object-contain" />
            <span className="text-sm text-forge-muted font-medium">BeatForge Setup</span>
            <span className="ml-auto text-xs text-forge-muted">{step + 1} / {STEPS.length}</span>
          </div>

          {/* Icon */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 mx-auto"
            style={{ background: `${current.color}18`, border: `1px solid ${current.color}40` }}
          >
            <Icon size={30} style={{ color: current.color }} />
          </div>

          {/* Content */}
          <h2 className="text-xl font-bold text-forge-text text-center mb-3">{current.title}</h2>
          <p className="text-sm text-forge-muted text-center leading-relaxed mb-8">{current.desc}</p>

          {/* Step dots */}
          <div className="flex justify-center gap-2 mb-8">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className="transition-all duration-200"
                style={{
                  width: i === step ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: i === step ? current.color : '#334155',
                }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm text-forge-muted border border-forge-border hover:border-forge-muted transition-colors"
              >
                <ChevronLeft size={15} />
                Back
              </button>
            )}
            <button
              onClick={() => isLast ? setOnboardingComplete(true) : setStep((s) => s + 1)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:brightness-110"
              style={{ background: `linear-gradient(135deg, #06b6d4, #8b5cf6)` }}
            >
              {isLast ? (
                <><ArrowRight size={15} /> Start Creating</>
              ) : (
                <>Next <ChevronRight size={15} /></>
              )}
            </button>
          </div>

          <button
            onClick={() => setOnboardingComplete(true)}
            className="w-full mt-3 text-xs text-forge-muted hover:text-forge-text transition-colors"
          >
            Skip tutorial
          </button>
        </div>
      </div>
    </div>
  );
}
