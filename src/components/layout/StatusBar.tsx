import { useAudioEngineStore } from '@/stores/appStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTransportStore } from '@/stores/transportStore';

export function StatusBar() {
  const { cpuLoad, latency, sampleRate, bufferSize } = useAudioEngineStore();
  const { project } = useProjectStore();
  const { currentBeat, bpm, timeSignature } = useTransportStore();

  const bar  = Math.floor(currentBeat / timeSignature[0]) + 1;
  const beat = Math.floor(currentBeat % timeSignature[0]) + 1;

  return (
    <footer className="flex items-center h-6 bg-forge-surface border-t border-forge-border px-3 gap-4 text-2xs text-forge-text-muted font-mono shrink-0">
      <span>{bar}:{beat}</span>
      <span>{bpm} BPM</span>
      <span>{timeSignature[0]}/{timeSignature[1]}</span>
      <div className="flex-1" />
      <span>{sampleRate / 1000}kHz</span>
      <span>{bufferSize} buf</span>
      <span>{latency.toFixed(1)}ms</span>
      <span className={cpuLoad > 70 ? 'text-forge-danger' : 'text-forge-text-muted'}>CPU {cpuLoad}%</span>
      <span className={project.cloudSyncStatus === 'synced' ? 'text-forge-success' : 'text-forge-warning'}>
        {project.cloudSyncStatus === 'synced' ? '● Synced' :
         project.cloudSyncStatus === 'dirty'  ? '● Unsaved' :
         project.cloudSyncStatus === 'offline'? '● Offline' : '⚠ Conflict'}
      </span>
    </footer>
  );
}
