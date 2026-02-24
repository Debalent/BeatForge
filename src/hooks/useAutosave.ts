import { useEffect, useRef } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';

const AUTOSAVE_INTERVAL_MS = 30_000; // 30 seconds
const STORAGE_KEY = 'beatforge:project';

/**
 * Autosaves the project to localStorage every 30 seconds when it changes.
 */
export function useAutosave() {
  const { project } = useProjectStore();
  const { addToast } = useUIStore();
  const dirtyRef = useRef(false);
  const projectRef = useRef(project);

  // Track if project changed
  useEffect(() => {
    projectRef.current = project;
    dirtyRef.current = true;
  }, [project]);

  // Periodic autosave
  useEffect(() => {
    const interval = setInterval(() => {
      if (!dirtyRef.current) return;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projectRef.current));
        dirtyRef.current = false;
      } catch (e) {
        addToast({
          type: 'warning',
          message: 'Autosave failed — storage may be full.',
          duration: 4000,
        });
      }
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [addToast]);
}
