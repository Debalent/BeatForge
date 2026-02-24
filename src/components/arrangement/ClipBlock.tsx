import { useRef, useCallback, useState } from 'react';
import { useDrag } from 'react-dnd';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import type { ArrangementClip, Pattern } from '@/types';
import clsx from 'clsx';

interface ClipBlockProps {
  clip: ArrangementClip;
  pattern: Pattern | undefined;
  trackColor: string;
  zoom: number;
}

export function ClipBlock({ clip, pattern, trackColor, zoom }: ClipBlockProps) {
  const { removeClip, updateClip } = useProjectStore();
  const { editMode, openPianoRoll } = useUIStore();
  const [resizing, setResizing] = useState(false);
  const startResizeX = useRef(0);
  const startLen    = useRef(0);

  const [{ isDragging }, dragRef] = useDrag({
    type: 'CLIP',
    item: () => ({ id: clip.id, offsetBeat: 0 }),
    collect: (m) => ({ isDragging: m.isDragging() }),
    canDrag: editMode === 'select',
  });

  const left  = clip.startBeat * zoom;
  const width = Math.max((clip.length ?? 4) * zoom, 8);

  const handleDoubleClick = useCallback(() => {
    if (pattern) openPianoRoll(pattern.id);
  }, [pattern, openPianoRoll]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (editMode === 'erase') {
      e.stopPropagation();
      removeClip(clip.id);
    }
  }, [editMode, clip.id, removeClip]);

  // Resize drag
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setResizing(true);
    startResizeX.current = e.clientX;
    startLen.current = clip.length;
    const onMove = (ev: MouseEvent) => {
      const delta = (ev.clientX - startResizeX.current) / zoom;
      const newLen = Math.max(0.25, startLen.current + delta);
      updateClip(clip.id, { length: Math.round(newLen * 16) / 16 });
    };
    const onUp = () => { setResizing(false); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [clip.id, clip.length, zoom, updateClip]);

  return (
    <div
      ref={dragRef as unknown as React.Ref<HTMLDivElement>}
      className={clsx(
        'clip-block',
        isDragging && 'opacity-40',
        resizing && 'cursor-ew-resize',
        clip.locked && 'cursor-not-allowed opacity-70'
      )}
      style={{
        left, width,
        backgroundColor: trackColor + '33',
        borderColor: trackColor + '88',
        borderLeftColor: trackColor,
        borderLeftWidth: 2,
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Waveform / note preview */}
      <div className="absolute inset-0 px-1 pt-0.5 overflow-hidden">
        {pattern && (
          <div className="flex items-end gap-px h-full opacity-60">
            {pattern.notes.slice(0, Math.floor(width / 2)).map((note) => (
              <div
                key={note.id}
                className="w-0.5 rounded-t shrink-0"
                style={{
                  backgroundColor: trackColor,
                  height: `${(note.velocity / 127) * 80 + 10}%`,
                }}
              />
            ))}
          </div>
        )}
        <span className="absolute top-0.5 left-1 text-2xs text-white opacity-80 font-medium leading-none truncate pr-2">
          {pattern?.name ?? 'Audio'}
        </span>
      </div>

      {/* Resize handle */}
      {!clip.locked && (
        <div
          className="clip-resize"
          onMouseDown={handleResizeMouseDown}
        />
      )}
    </div>
  );
}
