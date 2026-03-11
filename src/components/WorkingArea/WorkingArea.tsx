import { useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useAppStore } from '../../store/useAppStore';
import { WorkingImage } from './WorkingImage';
import { StampElement } from './StampElement';
import { StampCutterTool } from './StampCutterTool';
import { StorageZone } from './StorageZone';
import cornerEmbellishment from '../../assets/CornerEmbellishment.svg';

interface Props {
  onOpenSidebar: () => void;
}

export function WorkingArea({ onOpenSidebar }: Props) {
  const workingImages = useAppStore((s) => s.workingImages);
  const stamps = useAppStore((s) => s.stamps);
  const stampToolState = useAppStore((s) => s.stampToolState);
  const setStampToolState = useAppStore((s) => s.setStampToolState);
  const setSelectedWorkingImageId = useAppStore((s) => s.setSelectedWorkingImageId);

  const areaRef = useRef<HTMLDivElement>(null);
  const { setNodeRef } = useDroppable({
    id: 'working-area',
    data: { type: 'working-area' },
  });

  const handleClick = (_e: React.MouseEvent) => {
    setSelectedWorkingImageId(null);
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
      {/* Mobile sidebar toggle */}
      <button
        className="md:hidden absolute top-4 left-4 z-20 flex flex-row items-center justify-center gap-3 rounded-lg px-6 py-6"
        style={{ backgroundColor: '#EAE6E2', border: '1px solid #CDC8C3' }}
        onClick={onOpenSidebar}
        aria-label="Open image drawer"
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Back photo frame */}
          <rect x="5" y="6" width="14" height="12" rx="2" stroke="#7a726d" strokeWidth="1.5" fill="none" />
          {/* Front photo frame */}
          <rect x="3" y="4" width="14" height="12" rx="2" fill="#EAE6E2" stroke="#7a726d" strokeWidth="1.5" />
          {/* Sun */}
          <circle cx="7" cy="7.5" r="1.5" fill="#7a726d" />
          {/* Mountain landscape */}
          <path d="M3 13.5 L6.5 9.5 L9.5 12 L12 10 L17 13.5" stroke="#7a726d" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4.5 2.5 L9.5 7 L4.5 11.5" stroke="#7a726d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

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

        {/* Watermark */}
        <a
          href="https://x.com/elissafied"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs tracking-widest pointer-events-auto"
          style={{ opacity: 0.4, color: '#3a3530', fontFamily: "'PP Mondwest', serif" }}
        >
          @elissafied
        </a>
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
