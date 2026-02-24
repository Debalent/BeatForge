import { useAudioEngineStore } from '@/stores/appStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTransportStore } from '@/stores/transportStore';

export function StatusBar() {
  const { cpuLoad, latency, sampleRate, bufferSize } = useAudioEngineStore();
  const { project } = useProjectStore();
  const { currentBeat, bpm, timeSignature } = useTransportStore();

  const bar  = Math.floor(currentBeat / timeSignature[0]) + 1;
  const beat = Math.floor(currentBeat % timeSignature[0]) + 1;

  const syncColor = project.cloudSyncStatus === 'synced' ? '#10b981'
    : project.cloudSyncStatus === 'conflict' ? '#ef4444' : '#f59e0b';

  const cpuColor = cpuLoad > 70 ? '#ef4444' : cpuLoad > 40 ? '#f59e0b' : '#10b981';

  return (
    <footer className="relative flex items-center h-6 border-t border-forge-border px-3 gap-4 text-2xs font-mono shrink-0"
      style={{ background: 'linear-gradient(to right, #0d0f1e, #111420)', color: '#4a5080' }}>
      {/* Top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(to right, transparent 0%, rgba(139,92,246,0.25) 50%, transparent 100%)' }} />

      <span style={{ color: '#22d3ee', fontVariantNumeric: 'tabular-nums' }}>{bar}:{beat}</span>
      <span>{bpm} <span style={{ color: '#3d4266' }}>BPM</span></span>
      <span style={{ color: '#3d4266' }}>{timeSignature[0]}/{timeSignature[1]}</span>

      <div className="flex-1" />

      <span>{sampleRate / 1000}<span style={{ color: '#3d4266' }}>kHz</span></span>
      <span>{bufferSize}<span style={{ color: '#3d4266' }}> buf</span></span>
      <span>{latency.toFixed(1)}<span style={{ color: '#3d4266' }}>ms</span></span>

      <span className="flex items-center gap-1">
        <span style={{ width: 6, height: 6, borderRadius: '50%', display: 'inline-block', background: cpuColor, boxShadow: `0 0 5px ${cpuColor}` }} />
        <span style={{ color: cpuColor }}>CPU {cpuLoad}%</span>
      </span>

      <span className="flex items-center gap-1">
        <span className="animate-pulse" style={{ width: 6, height: 6, borderRadius: '50%', display: 'inline-block', background: syncColor, boxShadow: `0 0 5px ${syncColor}` }} />
        <span style={{ color: syncColor }}>
          {project.cloudSyncStatus === 'synced' ? 'Synced'
           : project.cloudSyncStatus === 'dirty'  ? 'Unsaved'
           : project.cloudSyncStatus === 'offline'? 'Offline' : 'Conflict'}
        </span>
      </span>
    </footer>
  );
}
