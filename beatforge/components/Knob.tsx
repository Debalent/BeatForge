import React from "react";

export const Knob: React.FC<{ value: number }> = ({ value }) => (
  <div style={{
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: '#232946',
    border: '2px solid #6366f1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
    position: 'relative'
  }}>
    <div style={{
      width: 6,
      height: 12,
      background: '#22c55e',
      borderRadius: 3,
      position: 'absolute',
      top: 4,
      left: '50%',
      transform: `translateX(-50%) rotate(${value * 270 - 135}deg)`,
      transformOrigin: 'bottom center'
    }} />
  </div>
);
