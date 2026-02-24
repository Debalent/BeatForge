import { useEffect, useCallback } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';

const STORAGE_KEY = 'beatforge:project';
const SNAPSHOTS_KEY = 'beatforge:snapshots';

/**
 * On mount: restore project from localStorage.
 * On unmount / page unload: save project.
 */
export function usePersistence() {
  const { project, loadProject } = useProjectStore();
  const { addToast } = useUIStore();

  // Restore on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        loadProject(parsed);
      }
    } catch (e) {
      console.warn('[usePersistence] failed to restore project', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save on unload
  const save = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    } catch (e) {
      addToast({ type: 'error', message: 'Failed to save project to local storage.' });
    }
  }, [project, addToast]);

  useEffect(() => {
    window.addEventListener('beforeunload', save);
    return () => window.removeEventListener('beforeunload', save);
  }, [save]);
}
