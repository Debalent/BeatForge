import { useCallback } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { serializeProject, serializeToBlob, deserializeBlob, BFORGE_EXT } from '@/services/bforgeFormat';

/**
 * Provides open/save/export operations using the File System Access API
 * with a fallback to download/upload for unsupported browsers.
 */
export function useFileSystem() {
  const { project, loadProject } = useProjectStore();
  const { addToast } = useUIStore();

  const saveToFile = useCallback(async () => {
    try {
      const file = await serializeProject(project);
      const blob = serializeToBlob(file);

      if ('showSaveFilePicker' in window) {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: `${project.name}${BFORGE_EXT}`,
          types: [{ description: 'BeatForge Project', accept: { 'application/json': [BFORGE_EXT] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        addToast({ type: 'success', message: `Saved "${project.name}"` });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name}${BFORGE_EXT}`;
        a.click();
        URL.revokeObjectURL(url);
        addToast({ type: 'success', message: `Downloaded "${project.name}${BFORGE_EXT}"` });
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        addToast({ type: 'error', message: `Save failed: ${e?.message ?? 'unknown error'}` });
      }
    }
  }, [project, addToast]);

  const openFromFile = useCallback(async () => {
    const processBlob = async (blob: Blob) => {
      const { project: loaded, warnings } = await deserializeBlob(blob);
      loadProject(loaded);
      addToast({ type: 'success', message: `Opened "${loaded.name}"` });
      warnings.forEach((w) => addToast({ type: 'warning', message: w }));
    };

    try {
      if ('showOpenFilePicker' in window) {
        const [handle] = await (window as any).showOpenFilePicker({
          types: [{ description: 'BeatForge Project', accept: { 'application/json': [BFORGE_EXT] } }],
        });
        await processBlob(await handle.getFile());
      } else {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = BFORGE_EXT;
        input.onchange = async () => {
          const f = input.files?.[0];
          if (f) await processBlob(f);
        };
        input.click();
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        addToast({ type: 'error', message: `Open failed: ${e?.message ?? 'unknown error'}` });
      }
    }
  }, [loadProject, addToast]);

  return { saveToFile, openFromFile };
}
