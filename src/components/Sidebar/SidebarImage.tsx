import { useDraggable } from '@dnd-kit/core';
import { useEffect, useState } from 'react';
import type { LibraryImage } from '../../types';

interface Props {
  image: LibraryImage;
}

export function SidebarImage({ image }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `library-${image.id}`,
    data: { type: 'library-image', image },
  });
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(image.thumbnailBlob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [image.thumbnailBlob]);

  if (!url) return null;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`pl-4 pr-1 pb-3 cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <img
        src={url}
        alt=""
        className="w-full"
        style={{
          boxShadow: '0 0 4px 0 rgba(103, 95, 93, 0.5)',
          outline: '1px solid rgba(255, 255, 255, 0.5)',
          outlineOffset: 0,
        }}
        draggable={false}
      />
    </div>
  );
}
