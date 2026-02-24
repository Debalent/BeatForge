import type { ReactNode } from 'react';

interface WorkspaceShellProps {
  children: ReactNode;
}

export function WorkspaceShell({ children }: WorkspaceShellProps) {
  return (
    <div
      className="flex flex-col w-full h-full text-forge-text font-sans overflow-hidden select-none workspace-shell"
      style={{
        background: '#0f1120',
        backgroundImage: `
          radial-gradient(ellipse at 20% 0%, rgba(139,92,246,0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 0%, rgba(6,182,212,0.06) 0%, transparent 45%),
          linear-gradient(rgba(139,92,246,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(6,182,212,0.025) 1px, transparent 1px)
        `,
        backgroundSize: 'auto, auto, 60px 60px, 60px 60px',
      }}
    >
      {children}
    </div>
  );
}
