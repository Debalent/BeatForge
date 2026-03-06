import React from "react";

export const TimelineClip: React.FC<{ label: string; color?: string }> = ({ label, color = '#6366f1' }) => (
  <div style={{
    background: color,
    color: '#fff',
    borderRadius: 6,
    padding: '0.3rem 1.1rem',
    fontWeight: 600,
    fontSize: 14,
    margin: '0 6px 0 0',
    display: 'inline-block',
    minWidth: 60
  }}>
    {label}
  </div>
);
