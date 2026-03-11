import { useDraggable } from '@dnd-kit/core';
import { useEffect, useState } from 'react';
import type { Stamp } from '../../types';

interface Props {
  stamp: Stamp;
}

export function StampElement({ stamp }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `stamp-${stamp.id}`,
    data: { type: 'stamp', stamp },
  });
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(stamp.blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [stamp.blob]);

  if (!url) return null;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`absolute cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-0' : ''
      }`}
      style={{
        left: stamp.x,
        top: stamp.y,
        width: stamp.width,
        height: stamp.height,
      }}
    >
      <img
        src={url}
        alt=""
        className="w-full h-full"
        draggable={false}
      />
    </div>
  );
}
