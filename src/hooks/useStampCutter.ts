import { useCallback, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { v4 as uuidv4 } from 'uuid';
import {
  validateStampPosition,
  checkOverlap,
  extractStamp,
  punchHole,
  getStampDimensions,
} from '../canvas/stampOperations';
import { loadImageFromBlob } from '../canvas/imageUtils';
import type { WorkingAreaImage } from '../types';

export function useStampCutter() {
  const {
    stampToolState,
    setStampToolState,
    mousePosition,
    setMousePosition,
    droppedPosition,
    setDroppedPosition,
    workingImages,
    updateWorkingImage,
    addStamp,
  } = useAppStore();

  useEffect(() => {
    if (stampToolState !== 'PICKED_UP') return;

    const handler = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, [stampToolState, setMousePosition]);

  const pickUp = useCallback(() => {
    setStampToolState('PICKED_UP');
    setDroppedPosition(null);
  }, [setStampToolState, setDroppedPosition]);

  const store = useCallback(() => {
    setStampToolState('STORED');
    setDroppedPosition(null);
  }, [setStampToolState, setDroppedPosition]);

  const drop = useCallback(
    (x: number, y: number) => {
      setStampToolState('DROPPED');
      setDroppedPosition({ x, y });
    },
    [setStampToolState, setDroppedPosition],
  );

  const findImageAtPosition = useCallback(
    (
      clientX: number,
      clientY: number,
      workingAreaRect: DOMRect,
    ): { image: WorkingAreaImage; localX: number; localY: number } | null => {
      const areaX = clientX - workingAreaRect.left;
      const areaY = clientY - workingAreaRect.top;

      for (let i = workingImages.length - 1; i >= 0; i--) {
        const img = workingImages[i];
        if (
          areaX >= img.x &&
          areaX <= img.x + img.width &&
          areaY >= img.y &&
          areaY <= img.y + img.height
        ) {
          return {
            image: img,
            localX: areaX - img.x,
            localY: areaY - img.y,
          };
        }
      }
      return null;
    },
    [workingImages],
  );

  const performStamp = useCallback(
    async (image: WorkingAreaImage, displayLocalX: number, displayLocalY: number) => {
      const { width: sw, height: sh } = getStampDimensions();

      // Get the actual source image dimensions from the blob
      const srcImg = await loadImageFromBlob(image.canvasBlob);
      const imageScale = srcImg.width / image.width;

      // Convert display coordinates to source-pixel coordinates
      const srcLocalX = displayLocalX * imageScale;
      const srcLocalY = displayLocalY * imageScale;

      // Scale the stamp path to match source resolution
      if (!validateStampPosition(srcLocalX, srcLocalY, srcImg.width, srcImg.height, imageScale)) {
        return false;
      }

      const hasOverlap = await checkOverlap(image.canvasBlob, srcLocalX, srcLocalY, imageScale);
      if (hasOverlap) {
        return false;
      }

      const [stampBlob, newCanvasBlob] = await Promise.all([
        extractStamp(image.canvasBlob, srcLocalX, srcLocalY, imageScale),
        punchHole(image.canvasBlob, srcLocalX, srcLocalY, imageScale),
      ]);

      // Place the stamp in working area display coordinates
      const stamp = {
        id: uuidv4(),
        sourceImageId: image.id,
        blob: stampBlob,
        x: image.x + displayLocalX - sw / 2,
        y: image.y + displayLocalY - sh / 2,
        width: sw,
        height: sh,
      };

      addStamp(stamp);
      updateWorkingImage(image.id, {
        canvasBlob: newCanvasBlob,
        holes: [...image.holes, { localX: srcLocalX, localY: srcLocalY }],
      });

      return true;
    },
    [addStamp, updateWorkingImage],
  );

  return {
    stampToolState,
    mousePosition,
    droppedPosition,
    pickUp,
    store,
    drop,
    findImageAtPosition,
    performStamp,
  };
}
