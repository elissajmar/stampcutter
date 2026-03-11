import { DragOverlay } from '@dnd-kit/core';
import { useEffect, useState } from 'react';
import type { Active } from '@dnd-kit/core';
import physicalCutterSvg from '../../assets/PhysicalCutter.svg';

const SVG_W = 338;
const SVG_H = 619;
const BASE_SCALE = 128 / 151;
const SCALE_DROPPED = BASE_SCALE * 0.6;

interface Props {
  active: Active | null;
}

export function DragOverlayRenderer({ active }: Props) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!active?.data.current) {
      setUrl(null);
      return;
    }
    const data = active.data.current;
    let blob: Blob | null = null;

    if (data.type === 'library-image') {
      blob = data.image.thumbnailBlob;
    } else if (data.type === 'working-image') {
      blob = data.image.canvasBlob;
    } else if (data.type === 'stamp') {
      blob = data.stamp.blob;
    }

    if (blob) {
      const objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [active]);

  const data = active?.data.current;

  // Stamp cutter overlay
  if (active && data?.type === 'stamp-cutter') {
    const w = SVG_W * SCALE_DROPPED;
    const h = SVG_H * SCALE_DROPPED;
    return (
      <DragOverlay>
        <img
          src={physicalCutterSvg}
          alt=""
          className="pointer-events-none"
          style={{ width: w, height: h }}
          draggable={false}
        />
      </DragOverlay>
    );
  }

  if (!active || !url) return <DragOverlay />;

  let width: number | undefined;
  let height: number | undefined;

  if (data?.type === 'working-image') {
    width = data.image.width;
    height = data.image.height;
  } else if (data?.type === 'stamp') {
    width = data.stamp.width;
    height = data.stamp.height;
  }

  const isWorkingImage = data?.type === 'working-image';

  return (
    <DragOverlay>
      <img
        src={url}
        alt=""
        className="pointer-events-none"
        style={{
          width: width ?? 200,
          height: height ?? 'auto',
          border: isWorkingImage ? '2px solid #facc15' : 'none',
        }}
        draggable={false}
      />
    </DragOverlay>
  );
}
