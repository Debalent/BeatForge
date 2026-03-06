import React from "react";

export const Fader: React.FC<{ value: number }> = ({ value }) => (
  <div style={{
    width: 12,
    height: 64,
    background: '#232946',
    borderRadius: 6,
    position: 'relative',
    margin: 4
  }}>
    <div style={{
      position: 'absolute',
      left: 0,
      width: '100%',
      height: 16,
      background: '#6366f1',
      borderRadius: 6,
      top: `${(1 - value) * 48}px`,
      transition: 'top 0.2s'
    }} />
  </div>
);
