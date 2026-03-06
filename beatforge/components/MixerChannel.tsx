import React from "react";

export const MixerChannel: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 12px' }}>
    <div style={{ height: 80, width: 16, background: '#232946', borderRadius: 8, marginBottom: 8, position: 'relative' }}>
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: `${value * 100}%`,
        background: '#22c55e',
        borderRadius: 8,
        transition: 'height 0.2s'
      }} />
    </div>
    <div style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{label}</div>
  </div>
);
