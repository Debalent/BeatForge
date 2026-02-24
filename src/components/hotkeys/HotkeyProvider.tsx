import { useEffect, type ReactNode } from 'react';
import { useTransportStore } from '@/stores/transportStore';
import { useUIStore } from '@/stores/uiStore';
import { useProjectStore } from '@/stores/projectStore';
import { useFileSystem } from '@/hooks/useFileSystem';

interface Props { children: ReactNode; }

export function HotkeyProvider({ children }: Props) {
  const transport = useTransportStore();
  const { setEditMode, editMode, setSnap, togglePanel } = useUIStore();
  const { addTrack, snapshotVersion } = useProjectStore();
  const { saveToFile, openFromFile } = useFileSystem();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      const ctrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // Transport
      if (key === ' ') { e.preventDefault(); transport.playing ? transport.pause() : transport.play(); return; }
      if (key === 'enter') { e.preventDefault(); transport.stop(); return; }
      if (key === 'r' && !ctrl) { e.preventDefault(); transport.recording ? transport.stopRecording() : transport.startRecording(); return; }
      if (key === 'l' && !ctrl) { e.preventDefault(); transport.toggleLoop(); return; }

      // BPM nudge
      if (key === '+' && ctrl) { e.preventDefault(); transport.nudgeBPM(1); return; }
      if (key === '-' && ctrl) { e.preventDefault(); transport.nudgeBPM(-1); return; }

      // Edit modes
      if (key === 'q') { setEditMode('select'); return; }
      if (key === 'w') { setEditMode('draw'); return; }
      if (key === 'e') { setEditMode('erase'); return; }
      if (key === 't') { setEditMode('cut'); return; }
      if (key === 'a' && !ctrl) { setEditMode('automation'); return; }
      if (key === 'm' && !ctrl) { setEditMode('mute'); return; }

      // Snap
      if (key === '1' && !ctrl) { setSnap('bar'); return; }
      if (key === '2' && !ctrl) { setSnap('1/2'); return; }
      if (key === '3' && !ctrl) { setSnap('1/4'); return; }
      if (key === '4' && !ctrl) { setSnap('1/8'); return; }
      if (key === '5' && !ctrl) { setSnap('1/16'); return; }
      if (key === '0' && !ctrl) { setSnap('none'); return; }

      // Panels
      if (key === 'p' && ctrl) { e.preventDefault(); togglePanel('piano_roll'); return; }
      if (key === 'b' && ctrl) { e.preventDefault(); togglePanel('browser'); return; }
      if (key === ',' && ctrl) { e.preventDefault(); togglePanel('mixer'); return; }
      if (key === 'i' && ctrl) { e.preventDefault(); togglePanel('ai_panel'); return; }
      if (key === 'g' && ctrl) { e.preventDefault(); togglePanel('collab_panel'); return; }

      // File operations
      if (key === 's' && ctrl) { e.preventDefault(); saveToFile(); return; }
      if (key === 'o' && ctrl) { e.preventDefault(); openFromFile(); return; }

      // Version snapshot
      if (key === 'z' && ctrl && e.shiftKey) {
        e.preventDefault();
        snapshotVersion(`Snapshot ${new Date().toLocaleTimeString()}`, 'local');
        return;
      }

      // Add track
      if (key === 't' && ctrl) {
        e.preventDefault();
        addTrack('instrument');
        return;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [transport, setEditMode, editMode, setSnap, togglePanel, saveToFile, openFromFile, addTrack, snapshotVersion]);

  return <>{children}</>;
}
