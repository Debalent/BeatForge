import { useCallback, useMemo } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { Plus, Volume2, VolumeX, Headphones, Link } from 'lucide-react';
import type { MixerChannel } from '@/types';

// ─── VU Meter ─────────────────────────────────────────────────
function VuMeter({ peakL, peakR, rmsL, rmsR }: { peakL: number; peakR: number; rmsL: number; rmsR: number }) {
  const toH = (v: number) => `${Math.min(100, v * 100)}%`;
  const toColor = (v: number) => v > 0.9 ? '#ef4444' : v > 0.7 ? '#f59e0b' : '#06b6d4';

  return (
    <div className="flex gap-0.5 justify-center items-end" style={{ height: 80 }}>
      {[{ peak: peakL, rms: rmsL }, { peak: peakR, rms: rmsR }].map((ch, i) => (
        <div key={i} className="w-2.5 bg-forge-bg rounded-sm overflow-hidden relative" style={{ height: 80 }}>
          {/* RMS fill */}
          <div
            className="absolute bottom-0 left-0 right-0 transition-all duration-75"
            style={{ height: toH(ch.rms), background: toColor(ch.rms), opacity: 0.6 }}
          />
          {/* Peak tick */}
          <div
            className="absolute left-0 right-0 h-px"
            style={{ bottom: toH(ch.peak), background: toColor(ch.peak) }}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Channel Fader ────────────────────────────────────────────
function ChannelFader({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col items-center gap-1 my-2">
      <input
        type="range"
        min={0}
        max={2}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-20 cursor-pointer accent-forge-highlight"
        style={{ writingMode: 'vertical-lr', direction: 'rtl', width: 18, height: 80 }}
        title={`${Math.round(value * 100)}%`}
      />
      <span className="text-[8px] text-forge-muted font-mono">{Math.round(value * 100)}</span>
    </div>
  );
}

// ─── Pan Knob ────────────────────────────────────────────────
function PanKnob({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const angle = value * 140; // -140 to +140 degrees
  return (
    <div
      className="w-8 h-8 rounded-full bg-forge-bg border border-forge-border relative cursor-ew-resize select-none group"
      title={`Pan: ${value >= 0 ? 'R' : 'L'}${Math.round(Math.abs(value) * 100)}`}
      onMouseDown={(e) => {
        const startX = e.clientX;
        const startVal = value;
        const onMove = (ev: MouseEvent) => {
          const dx = ev.clientX - startX;
          onChange(Math.min(1, Math.max(-1, startVal + dx / 100)));
        };
        const onUp = () => {
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
      }}
      onDoubleClick={() => onChange(0)}
    >
      <div
        className="absolute top-1 left-1/2 w-0.5 h-2 -ml-px rounded-full bg-forge-highlight origin-bottom"
        style={{ transform: `rotate(${angle}deg)`, transformOrigin: '50% calc(100% - 2px)' }}
      />
    </div>
  );
}

// ─── Channel Strip ────────────────────────────────────────────
interface ChannelStripProps {
  channel: MixerChannel;
  isMaster?: boolean;
  onUpdate: (patch: Partial<MixerChannel>) => void;
}

function ChannelStrip({ channel, isMaster = false, onUpdate }: ChannelStripProps) {
  return (
    <div
      className={`flex flex-col items-center gap-1 px-1.5 py-2 border-r border-forge-border min-w-[64px] max-w-[72px] select-none
        ${isMaster ? 'bg-forge-surface/60' : 'bg-forge-surface/30 hover:bg-forge-surface/50'}
        transition-colors`}
    >
      {/* Inserts indicator */}
      <div className="flex gap-0.5 mb-0.5">
        {(channel.preInserts.length + channel.postInserts.length > 0) && (
          <span className="text-[8px] text-forge-highlight bg-forge-highlight/10 px-1 rounded">FX</span>
        )}
        {channel.sends.length > 0 && (
          <span className="text-[8px] text-forge-accent bg-forge-accent/10 px-1 rounded">S</span>
        )}
      </div>

      {/* Color strip */}
      <div className="w-full h-1 rounded-full" style={{ background: channel.color ?? '#06b6d4' }} />

      {/* VU Meters */}
      <VuMeter
        peakL={channel.peakL}
        peakR={channel.peakR}
        rmsL={channel.rmsL}
        rmsR={channel.rmsR}
      />

      {/* Fader */}
      <ChannelFader value={channel.volume} onChange={(v) => onUpdate({ volume: v })} />

      {/* Pan */}
      <PanKnob value={channel.pan} onChange={(v) => onUpdate({ pan: v })} />

      {/* Mute / Solo / Link */}
      <div className="flex gap-1">
        <button
          title="Mute"
          onClick={() => onUpdate({ muted: !channel.muted })}
          className={`w-5 h-5 rounded text-[9px] font-bold transition-colors ${
            channel.muted ? 'bg-amber-500/80 text-black' : 'bg-forge-bg text-forge-muted hover:text-forge-text'
          }`}
        >
          M
        </button>
        <button
          title="Solo"
          onClick={() => onUpdate({ soloed: !channel.soloed })}
          className={`w-5 h-5 rounded text-[9px] font-bold transition-colors ${
            channel.soloed ? 'bg-forge-highlight text-black' : 'bg-forge-bg text-forge-muted hover:text-forge-text'
          }`}
        >
          S
        </button>
      </div>

      {/* Name */}
      <span
        className="text-[9px] text-forge-text truncate w-full text-center font-medium mt-1"
        title={channel.name}
      >
        {channel.name}
      </span>
    </div>
  );
}

// ─── Main Mixer Panel ─────────────────────────────────────────
export function MixerPanel() {
  const { project, updateMixerChannel, addMixerChannel, removeMixerChannel } = useProjectStore();

  const channels: MixerChannel[] = project.mixerChannels ?? [];
  const master = channels.find((c: MixerChannel) => c.name === 'Master');
  const regular = channels.filter((c: MixerChannel) => c.name !== 'Master');

  const handleUpdate = useCallback((id: string, patch: Partial<MixerChannel>) => {
    updateMixerChannel(id, patch);
  }, [updateMixerChannel]);

  return (
    <div className="flex h-full bg-forge-bg text-forge-text overflow-hidden">
      {/* Channel strips */}
      <div className="flex-1 flex overflow-x-auto overflow-y-hidden forge-scrollbar">
        {regular.map((ch) => (
          <ChannelStrip
            key={ch.id}
            channel={ch}
            onUpdate={(p) => handleUpdate(ch.id, p)}
          />
        ))}

        {/* Add channel button */}
        <button
          onClick={() => addMixerChannel()}
          className="flex flex-col items-center justify-center gap-1 min-w-[56px] px-2 border-r border-forge-border text-forge-muted hover:text-forge-highlight hover:bg-forge-surface/20 transition-colors"
        >
          <Plus size={16} />
          <span className="text-[9px]">Add</span>
        </button>
      </div>

      {/* Master channel (pinned right) */}
      {master && (
        <div className="border-l-2 border-forge-highlight/30 shrink-0">
          <ChannelStrip
            channel={master}
            isMaster
            onUpdate={(p) => handleUpdate(master.id, p)}
          />
        </div>
      )}
    </div>
  );
}
