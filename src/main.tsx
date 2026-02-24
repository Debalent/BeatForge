import React from 'react';
import ReactDOM from 'react-dom/client';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Register PWA service worker
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New version of BeatForge available. Reload?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('[BeatForge] Ready to work offline');
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <DndProvider backend={HTML5Backend}>
        <App />
      </DndProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
