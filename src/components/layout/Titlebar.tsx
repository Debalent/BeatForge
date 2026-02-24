import { useState } from 'react';
import {
  Save, FolderOpen, Play, Square, Settings,
  Users, Cpu, Wifi, WifiOff, ChevronDown,
} from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { useAudioEngineStore } from '@/stores/appStore';
import { useFileSystem } from '@/hooks/useFileSystem';
import clsx from 'clsx';

interface TitlebarProps {
  projectName: string;
  dirty: boolean;
}

export function Titlebar({ projectName, dirty }: TitlebarProps) {
  const { togglePanel } = useUIStore();
  const { cpuLoad, latency } = useAudioEngineStore();
  const { saveToFile, openFromFile } = useFileSystem();
  const [online] = useState(navigator.onLine);

  return (
    <header className="flex items-center h-10 bg-forge-surface border-b border-forge-border px-2 gap-1 shrink-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-2 px-2 mr-2">
        <img src="/BeatForge/icons/logo.png" alt="BeatForge" className="w-6 h-6 object-contain" />
        <span className="font-brand font-bold text-sm bg-gradient-to-r from-forge-highlight to-forge-accent bg-clip-text text-transparent tracking-tight">
          BeatForge
        </span>
      </div>

      {/* Menu items */}
      <TitlebarMenu label="File" items={[
        { label: 'New Project',    shortcut: 'Ctrl+N', action: () => useProjectStore.getState().newProject() },
        { label: 'Open…',          shortcut: 'Ctrl+O', action: openFromFile },
        { label: 'Save',           shortcut: 'Ctrl+S', action: saveToFile },
        { label: 'Save As…',       shortcut: 'Ctrl+Shift+S', action: saveToFile },
        'separator',
        { label: 'Export Audio…',  shortcut: 'Ctrl+E', action: () => {} },
        { label: 'Export STEM…',   shortcut: 'Ctrl+Shift+E', action: () => {} },
      ]} />
      <TitlebarMenu label="Edit" items={[
        { label: 'Undo',     shortcut: 'Ctrl+Z', action: () => {} },
        { label: 'Redo',     shortcut: 'Ctrl+Y', action: () => {} },
        'separator',
        { label: 'Select All', shortcut: 'Ctrl+A', action: () => {} },
        { label: 'Deselect',   shortcut: 'Escape',   action: () => useUIStore.getState().clearSelection() },
      ]} />
      <TitlebarMenu label="View" items={[
        { label: 'Piano Roll',    shortcut: 'Ctrl+P', action: () => togglePanel('piano_roll') },
        { label: 'Mixer',         shortcut: 'Ctrl+M', action: () => togglePanel('mixer') },
        { label: 'Browser',       shortcut: 'Ctrl+B', action: () => togglePanel('browser') },
        { label: 'AI Panel',      shortcut: 'Ctrl+I', action: () => togglePanel('ai_panel') },
        { label: 'Collab',        shortcut: 'Ctrl+Shift+C', action: () => togglePanel('collab_panel') },
      ]} />
      <TitlebarMenu label="AI" items={[
        { label: 'Suggest Melody',   shortcut: '', action: () => {} },
        { label: 'Generate Chords',  shortcut: '', action: () => {} },
        { label: 'Lyric Assistant',  shortcut: '', action: () => {} },
        { label: 'Auto-Master',      shortcut: '', action: () => {} },
        { label: 'Mix Score',        shortcut: '', action: () => {} },
      ]} />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Project name */}
      <div className="flex items-center gap-1 px-3 font-medium text-sm text-forge-text">
        <span className={clsx('max-w-[200px] truncate', dirty && 'text-forge-warning')}>
          {projectName}{dirty ? ' •' : ''}
        </span>
      </div>

      {/* Performance indicators */}
      <div className="flex items-center gap-3 px-2 text-2xs text-forge-text-muted font-mono">
        <div className="flex items-center gap-1" title="CPU Load">
          <Cpu className="w-3 h-3" />
          <span className={clsx(cpuLoad > 70 ? 'text-forge-danger' : cpuLoad > 40 ? 'text-forge-warning' : 'text-forge-success')}>
            {cpuLoad}%
          </span>
        </div>
        <div className="flex items-center gap-1" title="Latency">
          <span>{latency.toFixed(1)}ms</span>
        </div>
        <div title={online ? 'Online' : 'Offline'}>
          {online
            ? <Wifi className="w-3 h-3 text-forge-success" />
            : <WifiOff className="w-3 h-3 text-forge-danger" />
          }
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-0.5">
        <button className="toolbar-btn" title="Save (Ctrl+S)" onClick={saveToFile}>
          <Save className="w-4 h-4" />
        </button>
        <button className="toolbar-btn" title="Open project" onClick={openFromFile}>
          <FolderOpen className="w-4 h-4" />
        </button>
        <button className="toolbar-btn" title="Collaborators" onClick={() => togglePanel('collab_panel')}>
          <Users className="w-4 h-4" />
        </button>
        <button className="toolbar-btn" title="Settings" onClick={() => togglePanel('settings')}>
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

// ─── Mini dropdown menu ───────────────────────────────────────
type MenuItem = 'separator' | { label: string; shortcut: string; action: () => void; };

function TitlebarMenu({ label, items }: { label: string; items: MenuItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        className={clsx(
          'flex items-center gap-0.5 px-2 h-7 rounded text-xs text-forge-text-muted hover:text-forge-text hover:bg-forge-muted transition-colors',
          open && 'bg-forge-muted text-forge-text'
        )}
        onMouseDown={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      >
        {label}
        <ChevronDown className="w-3 h-3 opacity-50" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-0.5 context-menu z-[100] min-w-[200px]">
          {items.map((item, i) =>
            item === 'separator'
              ? <div key={i} className="my-1 border-t border-forge-border" />
              : (
                <button
                  key={i}
                  className="context-menu-item w-full text-left flex justify-between"
                  onMouseDown={() => { item.action(); setOpen(false); }}
                >
                  <span>{item.label}</span>
                  {item.shortcut && <span className="text-forge-text-muted text-2xs ml-4">{item.shortcut}</span>}
                </button>
              )
          )}
        </div>
      )}
    </div>
  );
}
