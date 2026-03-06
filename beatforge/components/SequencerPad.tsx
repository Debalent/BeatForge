import React from "react";

export const SequencerPad: React.FC<{ active: boolean }> = ({ active }) => (
  <div style={{
    width: 28,
    height: 28,
    borderRadius: 6,
    background: active ? '#22c55e' : '#232946',
    margin: 2,
    display: 'inline-block',
    boxShadow: active ? '0 0 8px #22c55e88' : undefined,
    transition: 'background 0.2s, box-shadow 0.2s'
  }} />
);
