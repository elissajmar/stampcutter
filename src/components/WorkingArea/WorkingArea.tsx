import { useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useAppStore } from '../../store/useAppStore';
import { WorkingImage } from './WorkingImage';
import { StampElement } from './StampElement';
import { StampCutterTool } from './StampCutterTool';
import { StorageZone } from './StorageZone';
import cornerEmbellishment from '../../assets/CornerEmbellishment.svg';

export function WorkingArea() {
  const workingImages = useAppStore((s) => s.workingImages);
  const stamps = useAppStore((s) => s.stamps);
  const stampToolState = useAppStore((s) => s.stampToolState);
  const setStampToolState = useAppStore((s) => s.setStampToolState);

  const areaRef = useRef<HTMLDivElement>(null);
  const { setNodeRef } = useDroppable({
    id: 'working-area',
    data: { type: 'working-area' },
  });

  const handleClick = (_e: React.MouseEvent) => {
    // Click handling for the working area background is managed by StampCutterTool
  };

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        (areaRef as React.MutableRefObject<HTMLDivElement | null>).current =
          node;
      }}
      id="working-area-drop"
      onClick={handleClick}
      className="flex-1 h-full relative overflow-hidden p-6"
      style={{ backgroundColor: '#CDC8C3' }}
    >
      {/* White stroke offset outside the inner canvas */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: 12,
          left: 12,
          right: 12,
          bottom: 12,
          border: '1px solid rgba(255,255,255,0.5)',
        }}
      />
      {/* Inner canvas area */}
      <div
        className="w-full h-full relative overflow-hidden"
        style={{
          backgroundColor: '#EAE6E2',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.5)',
        }}
      >
        {/* Corner embellishments */}
        <img src={cornerEmbellishment} alt="" className="absolute top-2 left-2 pointer-events-none" />
        <img src={cornerEmbellishment} alt="" className="absolute top-2 right-2 pointer-events-none" style={{ transform: 'scaleX(-1)' }} />
        <img src={cornerEmbellishment} alt="" className="absolute bottom-2 left-2 pointer-events-none" style={{ transform: 'scaleY(-1)' }} />
        <img src={cornerEmbellishment} alt="" className="absolute bottom-2 right-2 pointer-events-none" style={{ transform: 'scale(-1, -1)' }} />

        {workingImages.map((img) => (
          <WorkingImage key={img.id} image={img} />
        ))}
        {stamps.map((stamp) => (
          <StampElement key={stamp.id} stamp={stamp} />
        ))}
      </div>
      <StorageZone
        stampToolState={stampToolState}
        onPickUp={() => setStampToolState('PICKED_UP')}
        onStore={() => setStampToolState('STORED')}
      />
      <StampCutterTool workingAreaRef={areaRef} />
    </div>
  );
}
