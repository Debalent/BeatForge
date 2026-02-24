import { useState, useEffect, useCallback, useRef } from 'react';
import { Users, Copy, CheckCircle, Wifi, WifiOff, UserPlus, Crown, Mic, MicOff } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { nanoid } from 'nanoid';

interface CollabPeer {
  id: string;
  name: string;
  color: string;
  isHost: boolean;
  connected: boolean;
  muted: boolean;
}

const PEER_COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#ef4444'];

function generateSessionCode(): string {
  return nanoid(8).toUpperCase();
}

function AvatarCircle({ name, color, isHost }: { name: string; color: string; isHost?: boolean }) {
  return (
    <div className="relative shrink-0">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
        style={{ background: color }}
        title={name}
      >
        {name.slice(0, 1).toUpperCase()}
      </div>
      {isHost && (
        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-forge-bg flex items-center justify-center">
          <Crown size={8} className="text-amber-400" />
        </div>
      )}
    </div>
  );
}

export function CollabPanel() {
  const { project } = useProjectStore();
  const { addToast } = useUIStore();

  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [connected, setConnected] = useState(false);
  const [peers, setPeers] = useState<CollabPeer[]>([]);
  const [myName, setMyName] = useState(() => `User${Math.floor(Math.random() * 9000 + 1000)}`);
  const [hosting, setHosting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(true);
  const connectionRef = useRef<any>(null);

  // "Me" peer
  const me: CollabPeer = {
    id: 'local',
    name: myName,
    color: PEER_COLORS[0],
    isHost: hosting,
    connected: true,
    muted: voiceMuted,
  };

  const hostSession = useCallback(() => {
    const code = generateSessionCode();
    setSessionCode(code);
    setHosting(true);
    setConnected(true);
    setPeers([]);
    addToast({ type: 'success', message: `Session created: ${code}` });
  }, [addToast]);

  const joinSession = useCallback(() => {
    if (joinCode.trim().length < 4) {
      addToast({ type: 'warning', message: 'Enter a valid session code.' });
      return;
    }
    // In a real implementation, this would use simple-peer + signalling server
    // For now, simulate a connection
    setSessionCode(joinCode.toUpperCase());
    setConnected(true);
    setHosting(false);
    // Simulate host peer
    setPeers([{
      id: 'host-sim',
      name: 'Host',
      color: PEER_COLORS[1],
      isHost: true,
      connected: true,
      muted: false,
    }]);
    addToast({ type: 'success', message: `Joined session ${joinCode.toUpperCase()}` });
  }, [joinCode, addToast]);

  const leaveSession = useCallback(() => {
    setConnected(false);
    setSessionCode(null);
    setJoinCode('');
    setHosting(false);
    setPeers([]);
    addToast({ type: 'info', message: 'Left collaboration session.' });
  }, [addToast]);

  const copyCode = useCallback(() => {
    if (!sessionCode) return;
    navigator.clipboard.writeText(sessionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [sessionCode]);

  return (
    <div className="flex flex-col h-full bg-forge-surface text-forge-text overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-forge-border shrink-0">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-forge-highlight" />
          <h3 className="text-xs font-semibold text-forge-text">Collaboration</h3>
          <div className={`ml-auto flex items-center gap-1 text-[10px] ${connected ? 'text-emerald-400' : 'text-forge-muted'}`}>
            {connected ? <Wifi size={11} /> : <WifiOff size={11} />}
            {connected ? 'Connected' : 'Offline'}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto forge-scrollbar p-3 space-y-4">
        {!connected ? (
          /* ─ Not connected ─ */
          <div className="space-y-3">
            {/* My name */}
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-forge-muted">Display Name</span>
              <input
                type="text"
                value={myName}
                onChange={(e) => setMyName(e.target.value)}
                className="bg-forge-bg border border-forge-border rounded px-2 py-1.5 text-forge-text focus:outline-none focus:border-forge-highlight"
              />
            </label>

            {/* Host */}
            <button
              onClick={hostSession}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}
            >
              <Crown size={13} />
              Host New Session
            </button>

            <div className="flex items-center gap-2 text-xs text-forge-muted">
              <div className="flex-1 h-px bg-forge-border" />
              <span>or join</span>
              <div className="flex-1 h-px bg-forge-border" />
            </div>

            {/* Join */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Session code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={8}
                className="flex-1 bg-forge-bg border border-forge-border rounded px-2 py-1.5 text-forge-text text-xs focus:outline-none focus:border-forge-highlight font-mono tracking-widest uppercase text-center"
              />
              <button
                onClick={joinSession}
                className="px-3 py-1.5 rounded bg-forge-highlight/20 text-forge-highlight border border-forge-highlight/40 text-xs hover:bg-forge-highlight/30 transition-colors flex items-center gap-1"
              >
                <UserPlus size={12} />
                Join
              </button>
            </div>

            <p className="text-[10px] text-forge-muted leading-relaxed">
              Real-time collaboration via WebRTC. Share your session code with up to 4 people to co-produce simultaneously.
            </p>
          </div>
        ) : (
          /* ─ Connected ─ */
          <div className="space-y-4">
            {/* Session code */}
            <div className="rounded-lg bg-forge-bg border border-forge-border p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-forge-muted">{hosting ? 'Your session code' : 'Joined session'}</span>
                {hosting && (
                  <button onClick={copyCode} className="flex items-center gap-1 text-[10px] text-forge-highlight hover:underline">
                    {copied ? <CheckCircle size={11} /> : <Copy size={11} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                )}
              </div>
              <div className="text-xl font-mono font-bold text-forge-highlight tracking-[0.3em] text-center py-1">
                {sessionCode}
              </div>
            </div>

            {/* Participants */}
            <div>
              <h4 className="text-[10px] text-forge-muted uppercase tracking-wider mb-2">
                Participants ({peers.length + 1})
              </h4>
              <div className="space-y-1.5">
                {/* Me */}
                <div className="flex items-center gap-2 p-1.5 rounded-md hover:bg-forge-bg/40">
                  <AvatarCircle name={me.name} color={me.color} isHost={me.isHost} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-forge-text truncate">{me.name} <span className="text-forge-muted">(you)</span></p>
                    <p className="text-[9px] text-emerald-400">● Online</p>
                  </div>
                  <button
                    onClick={() => setVoiceMuted((v) => !v)}
                    className="p-1 text-forge-muted hover:text-forge-text transition-colors"
                    title={voiceMuted ? 'Unmute' : 'Mute'}
                  >
                    {voiceMuted ? <MicOff size={12} /> : <Mic size={12} />}
                  </button>
                </div>

                {/* Remote peers */}
                {peers.map((peer) => (
                  <div key={peer.id} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-forge-bg/40">
                    <AvatarCircle name={peer.name} color={peer.color} isHost={peer.isHost} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-forge-text truncate">{peer.name}</p>
                      <p className={`text-[9px] ${peer.connected ? 'text-emerald-400' : 'text-forge-muted'}`}>
                        {peer.connected ? '● Online' : '○ Disconnected'}
                      </p>
                    </div>
                    {peer.muted && <MicOff size={11} className="text-forge-muted" />}
                  </div>
                ))}

                {peers.length === 0 && (
                  <p className="text-[10px] text-forge-muted text-center py-3">
                    Waiting for collaborators to join…
                  </p>
                )}
              </div>
            </div>

            {/* Project info */}
            <div className="rounded-lg bg-forge-bg/50 border border-forge-border p-2.5 text-xs">
              <p className="text-forge-muted text-[10px] mb-1">Sharing project</p>
              <p className="text-forge-text font-medium truncate">{project.name}</p>
            </div>

            {/* Leave */}
            <button
              onClick={leaveSession}
              className="w-full py-2 rounded-lg text-xs text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors"
            >
              Leave Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
