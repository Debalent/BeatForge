import { useEffect } from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { Titlebar } from '@/components/layout/Titlebar';
import { Transport } from '@/components/transport/Transport';
import { Arrangement } from '@/components/arrangement/Arrangement';
import { PianoRoll } from '@/components/pianoroll/PianoRoll';
import { MixerPanel } from '@/components/mixer/MixerPanel';
import { Browser } from '@/components/browser/Browser';
import { AIPanel } from '@/components/ai/AIPanel';
import { CollabPanel } from '@/components/collab/CollabPanel';
import { ToastRegion } from '@/components/ui/ToastRegion';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { HotkeyProvider } from '@/components/hotkeys/HotkeyProvider';
import { StatusBar } from '@/components/layout/StatusBar';
import { audioEngine } from '@/engine/AudioEngine';
import { useUIStore } from '@/stores/uiStore';
import { useTransportStore } from '@/stores/transportStore';
import { useProjectStore } from '@/stores/projectStore';
import { usePersistence } from '@/hooks/usePersistence';
import { useAutosave } from '@/hooks/useAutosave';

export default function App() {
  const { panels, onboardingComplete } = useUIStore();
  const transport  = useTransportStore();
  const { project }     = useProjectStore();

  usePersistence();
  useAutosave();

  // Init audio engine on first user gesture
  useEffect(() => {
    const init = () => {
      audioEngine.init().catch(console.error);
      window.removeEventListener('click', init);
      window.removeEventListener('keydown', init);
    };
    window.addEventListener('click', init, { once: true });
    window.addEventListener('keydown', init, { once: true });
    return () => {
      window.removeEventListener('click', init);
      window.removeEventListener('keydown', init);
    };
  }, []);

  // Sync transport play state → audio engine scheduler
  useEffect(() => {
    if (transport.playing) {
      audioEngine.resume().then(() => audioEngine.startScheduler());
    } else {
      audioEngine.stopScheduler();
    }
  }, [transport.playing]);

  // Sync master volume
  useEffect(() => {
    audioEngine.setMasterVolume(transport.masterVolume);
  }, [transport.masterVolume]);

  const pianoRollOpen   = panels.find((p) => p.id === 'piano_roll')?.open ?? false;
  const mixerOpen       = panels.find((p) => p.id === 'mixer')?.open ?? true;
  const browserOpen     = panels.find((p) => p.id === 'browser')?.open ?? true;
  const aiPanelOpen     = panels.find((p) => p.id === 'ai_panel')?.open ?? false;
  const collabOpen      = panels.find((p) => p.id === 'collab_panel')?.open ?? false;

  return (
    <HotkeyProvider>
      <WorkspaceShell>
        {/* ── Titlebar ── */}
        <Titlebar projectName={project.name} dirty={useProjectStore.getState().dirty} />

        {/* ── Transport ── */}
        <Transport />

        {/* ── Main workspace ── */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Browser sidebar */}
          {browserOpen && (
            <Browser />
          )}

          {/* Center: Arrangement + Piano Roll (vertical split) */}
          <div className="flex flex-col flex-1 min-w-0 min-h-0">
            {pianoRollOpen ? (
              <PanelGroup direction="vertical" className="flex-1">
                <Panel defaultSize={60} minSize={20}>
                  <Arrangement />
                </Panel>
                <PanelResizeHandle className="h-1 bg-forge-border hover:bg-forge-accent transition-colors cursor-row-resize" />
                <Panel defaultSize={40} minSize={20}>
                  <PianoRoll />
                </Panel>
              </PanelGroup>
            ) : (
              <div className="flex-1 min-h-0">
                <Arrangement />
              </div>
            )}

            {/* Mixer Dock (bottom) */}
            {mixerOpen && (
              <>
                <div className="h-px bg-forge-border" />
                <MixerPanel />
              </>
            )}
          </div>

          {/* Right docks */}
          {(aiPanelOpen || collabOpen) && (
            <div className="flex flex-col w-72 border-l border-forge-border bg-forge-surface">
              {aiPanelOpen  && <AIPanel />}
              {collabOpen   && <CollabPanel />}
            </div>
          )}
        </div>

        {/* ── Status Bar ── */}
        <StatusBar />

        {/* ── Overlays ── */}
        <ToastRegion />
        {!onboardingComplete && <OnboardingModal />}
      </WorkspaceShell>
    </HotkeyProvider>
  );
}
