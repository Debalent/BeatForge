import React from "react";

const DawAppShell: React.FC = () => {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f172a', color: '#fff', fontFamily: 'Inter, Space Grotesk, sans-serif'
    }}>
      {/* Top Bar (Transport) */}
      <div style={{ display: 'flex', alignItems: 'center', height: 56, background: '#181e36', borderBottom: '1px solid #232946', padding: '0 2rem' }}>
        <button style={{ marginRight: 16, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1.2rem', fontWeight: 700 }}>Play</button>
        <button style={{ marginRight: 16, background: '#232946', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1.2rem', fontWeight: 700 }}>Stop</button>
        <button style={{ marginRight: 32, background: '#232946', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1.2rem', fontWeight: 700 }}>Record</button>
        <span style={{ fontWeight: 600, fontSize: 18, marginRight: 8 }}>BPM</span>
        <input type="number" min={60} max={200} defaultValue={120} style={{ width: 60, fontSize: 16, borderRadius: 4, border: '1px solid #232946', background: '#232946', color: '#fff', padding: '0.2rem 0.5rem' }} />
      </div>
      {/* Main Workspace */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Left Panel: Sample Browser */}
        <div style={{ width: 220, background: '#181e36', borderRight: '1px solid #232946', padding: '1rem 0.5rem' }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>Sample Browser</div>
          <div style={{ color: '#94a3b8', fontSize: 14 }}>Kick<br />Snare<br />HiHat<br />Bass<br />Lead Synth</div>
        </div>
        {/* Main Timeline */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16, padding: '1rem', borderBottom: '1px solid #232946', background: '#181e36' }}>Tracks</div>
          <div style={{ flex: 1, background: '#14172a', padding: '1rem', overflow: 'auto' }}>
            {/* Placeholder for tracks and clips */}
            <div style={{ color: '#94a3b8', fontSize: 15 }}>Timeline & Clips (Demo UI)</div>
          </div>
        </div>
        {/* Right Panel: Spacer or future features */}
      </div>
      {/* Bottom Panel: Piano Roll | Mixer | Sequencer */}
      <div style={{ height: 180, background: '#181e36', borderTop: '1px solid #232946', display: 'flex' }}>
        <div style={{ flex: 1, padding: '1rem', borderRight: '1px solid #232946' }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Piano Roll</div>
          <div style={{ color: '#94a3b8', fontSize: 14 }}>[Demo notes]</div>
        </div>
        <div style={{ flex: 1, padding: '1rem', borderRight: '1px solid #232946' }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Mixer</div>
          <div style={{ color: '#94a3b8', fontSize: 14 }}>[Demo faders]</div>
        </div>
        <div style={{ flex: 1, padding: '1rem' }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Step Sequencer</div>
          <div style={{ color: '#94a3b8', fontSize: 14 }}>[Demo pads]</div>
        </div>
      </div>
    </div>
  );
};

export default DawAppShell;
