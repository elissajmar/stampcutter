import { useDraggable } from '@dnd-kit/core';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { WorkingAreaImage } from '../../types';

const MIN_SIZE = 160;
const MAX_SIZE = 1200;

interface Props {
  image: WorkingAreaImage;
}

type Corner = 'nw' | 'ne' | 'sw' | 'se';

const cursorMap: Record<Corner, string> = {
  nw: 'nwse-resize',
  se: 'nwse-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
};

const L_SIZE = 24;
const L_WEIGHT = 4;
const L_OFFSET = -4;

function cornerStyle(corner: Corner): React.CSSProperties {
  const base: React.CSSProperties = {
    position: 'absolute',
    width: L_SIZE,
    height: L_SIZE,
    cursor: cursorMap[corner],
    zIndex: 10,
    pointerEvents: 'auto', 
    borderColor: '#facc15',
    borderStyle: 'solid',
    borderWidth: 0,
  };

  if (corner === 'nw') {
    return { ...base, top: L_OFFSET, left: L_OFFSET, borderTopWidth: L_WEIGHT, borderLeftWidth: L_WEIGHT };
  }
  if (corner === 'ne') {
    return { ...base, top: L_OFFSET, right: L_OFFSET, borderTopWidth: L_WEIGHT, borderRightWidth: L_WEIGHT };
  }
  if (corner === 'sw') {
    return { ...base, bottom: L_OFFSET, left: L_OFFSET, borderBottomWidth: L_WEIGHT, borderLeftWidth: L_WEIGHT };
  }
  // se
  return { ...base, bottom: L_OFFSET, right: L_OFFSET, borderBottomWidth: L_WEIGHT, borderRightWidth: L_WEIGHT };
}

export function WorkingImage({ image }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `working-${image.id}`,
    data: { type: 'working-image', image },
  });
  const updateWorkingImage = useAppStore((s) => s.updateWorkingImage);
  const [url, setUrl] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);
  const [resizing, setResizing] = useState(false);
  const resizingRef = useRef<{
    corner: Corner;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    startImgX: number;
    startImgY: number;
    aspect: number;
  } | null>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(image.canvasBlob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [image.canvasBlob]);

  const handleResizeStart = useCallback(
    (corner: Corner, e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      setResizing(true);
      resizingRef.current = {
        corner,
        startX: e.clientX,
        startY: e.clientY,
        startW: image.width,
        startH: image.height,
        startImgX: image.x,
        startImgY: image.y,
        aspect: image.width / image.height,
      };
    },
    [image.width, image.height, image.x, image.y],
  );

  const handleResizeMove = useCallback(
    (e: React.PointerEvent) => {
      const r = resizingRef.current;
      if (!r) return;
      e.stopPropagation();

      const dx = e.clientX - r.startX;

      let newW: number;
      let newH: number;
      let newX = r.startImgX;
      let newY = r.startImgY;

      switch (r.corner) {
        case 'se':
          newW = r.startW + dx;
          break;
        case 'sw':
          newW = r.startW - dx;
          break;
        case 'ne':
          newW = r.startW + dx;
          break;
        case 'nw':
          newW = r.startW - dx;
          break;
      }

      newW = Math.max(MIN_SIZE, Math.min(MAX_SIZE, newW));
      newH = Math.round(newW / r.aspect);

      if (newH < MIN_SIZE) {
        newH = MIN_SIZE;
        newW = Math.round(newH * r.aspect);
      }
      if (newH > MAX_SIZE) {
        newH = MAX_SIZE;
        newW = Math.round(newH * r.aspect);
      }

      if (r.corner === 'nw') {
        newX = r.startImgX + (r.startW - newW);
        newY = r.startImgY + (r.startH - newH);
      } else if (r.corner === 'ne') {
        newY = r.startImgY + (r.startH - newH);
      } else if (r.corner === 'sw') {
        newX = r.startImgX + (r.startW - newW);
      }

      updateWorkingImage(image.id, {
        width: newW,
        height: newH,
        x: newX,
        y: newY,
      });
    },
    [image.id, updateWorkingImage],
  );

  const handleResizeEnd = useCallback((e: React.PointerEvent) => {
    if (resizingRef.current) {
      e.stopPropagation();
      resizingRef.current = null;
      setResizing(false);
    }
  }, []);

  if (!url) return null;

  const active = isDragging || resizing;
  const showHandles = (hovered || resizing) && !isDragging;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`absolute cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-0' : ''}`}
      style={{
        left: image.x,
        top: image.y,
        width: image.width,
        height: image.height,
      }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => {
        if (!resizingRef.current) setHovered(false);
      }}
    >
      <img
        src={url}
        alt=""
        className="w-full h-full"
        style={{
          filter: isDragging ? 'none' : 'drop-shadow(0 0 4px rgba(103, 95, 93, 0.5))',
        }}
        draggable={false}
      />
      {/* Border overlay — renders above the img + its drop-shadow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          outline: active
            ? '2px solid #facc15'
            : hovered
              ? '2px solid rgba(250, 204, 21, 0.5)'
              : '1px solid rgba(255, 255, 255, 0.75)',
          outlineOffset: 0,
        }}
      />
      {showHandles &&
        (['nw', 'ne', 'sw', 'se'] as Corner[]).map((corner) => (
          <div
            key={corner}
            onPointerDown={(e) => handleResizeStart(corner, e)}
            onPointerMove={handleResizeMove}
            onPointerUp={handleResizeEnd}
            style={cornerStyle(corner)}
          />
        ))}
    </div>
  );
}
