import React from "react";

const DemoTourShell: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh', background: '#0f172a', color: '#fff', fontFamily: 'Inter, Space Grotesk, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ maxWidth: 480, textAlign: 'center', background: '#181e36', borderRadius: 16, padding: '2.5rem 2rem', boxShadow: '0 8px 32px #0004' }}>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#6366f1', marginBottom: 12 }}>Welcome to BeatForge</div>
        <div style={{ fontSize: 18, color: '#22c55e', marginBottom: 18 }}>Browser-Native Digital Audio Workstation</div>
        <div style={{ color: '#cbd5e1', fontSize: 16, marginBottom: 32 }}>
          Experience a guided walkthrough of BeatForge's core features.<br />
          <br />
          <b>Click Start Demo to begin.</b>
        </div>
        <button style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '0.9rem 2.5rem', fontWeight: 700, fontSize: 18, cursor: 'pointer' }}>
          Start Demo
        </button>
      </div>
    </div>
  );
};

export default DemoTourShell;
