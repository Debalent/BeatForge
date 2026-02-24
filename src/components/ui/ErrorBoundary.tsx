import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[BeatForge] Render error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            position: 'fixed', inset: 0, background: '#14172a',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            color: '#e2e8f0', fontFamily: 'monospace', padding: '2rem', gap: '1rem',
          }}
        >
          <div style={{ fontSize: '2rem' }}>⚠️</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#06b6d4' }}>
            BeatForge failed to load
          </div>
          <div style={{
            background: '#1e2340', borderRadius: '0.5rem', padding: '1rem',
            maxWidth: '640px', width: '100%', fontSize: '0.75rem',
            color: '#f87171', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
          }}>
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </div>
          <button
            style={{
              background: '#06b6d4', color: '#14172a', border: 'none',
              padding: '0.5rem 1.5rem', borderRadius: '0.375rem',
              cursor: 'pointer', fontWeight: 600,
            }}
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
