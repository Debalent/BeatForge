import React from "react";

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, ...props }) => (
  <button
    {...props}
    style={{
      background: '#6366f1',
      color: '#fff',
      border: 'none',
      borderRadius: 8,
      padding: '0.7rem 2rem',
      fontWeight: 700,
      fontSize: 16,
      cursor: 'pointer',
      transition: 'background 0.2s',
      ...(props.style || {})
    }}
    onMouseOver={e => (e.currentTarget.style.background = '#22c55e')}
    onMouseOut={e => (e.currentTarget.style.background = '#6366f1')}
  >
    {children}
  </button>
);
