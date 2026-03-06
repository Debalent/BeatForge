import React from "react";

export const TrackCard: React.FC<{ name: string; color?: string }> = ({ name, color = '#6366f1' }) => (
  <div style={{
    background: color,
    color: '#fff',
    borderRadius: 8,
    padding: '0.5rem 1.2rem',
    fontWeight: 700,
    fontSize: 15,
    marginBottom: 8,
    boxShadow: '0 2px 8px #0002',
    display: 'inline-block',
    minWidth: 80
  }}>
    {name}
  </div>
);
