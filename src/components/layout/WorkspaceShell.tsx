import type { ReactNode } from 'react';

interface WorkspaceShellProps {
  children: ReactNode;
}

export function WorkspaceShell({ children }: WorkspaceShellProps) {
  return (
    <div className="flex flex-col w-full h-full bg-forge-bg text-forge-text font-sans overflow-hidden select-none workspace-shell">
      {children}
    </div>
  );
}
