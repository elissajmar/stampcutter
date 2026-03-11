import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useStampCutter } from '../../hooks/useStampCutter';
import { useAppStore } from '../../store/useAppStore';
import {
  validateStampPosition,
  checkOverlap,
} from '../../canvas/stampOperations';
import { loadImageFromBlob } from '../../canvas/imageUtils';
import physicalCutterSvg from '../../assets/PhysicalCutter.svg';

// PhysicalCutter.svg native dimensions
const SVG_W = 338;
const SVG_H = 619;

// Cutout center within the SVG (where the stamp hole is)
const CUTOUT_CENTER_X = 169.2;
const CUTOUT_CENTER_Y = 330.4;

// Cutout bounding box within SVG (for invalid-position overlay)
const CUTOUT_X = 93.7;
const CUTOUT_Y = 228.4;
const CUTOUT_W = 151;
const CUTOUT_H = 204;

// Base scale: makes the SVG cutout (151×204) match the stamp display size (128×173).
const BASE_SCALE = 128 / 151;

// Scale factors per state (relative to BASE_SCALE)
const SCALE_PICKED_UP = BASE_SCALE;
const SCALE_DROPPED = BASE_SCALE * 0.6;
const SCALE_STORED = BASE_SCALE * 0.38;

// Return zone position (matches StorageZone absolute positioning)
const RETURN_ZONE_BOTTOM = 32;
const RETURN_ZONE_RIGHT = 24;
const RETURN_ZONE_W = 120;
const RETURN_ZONE_H = 190;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

interface Props {
  workingAreaRef: React.RefObject<HTMLDivElement | null>;
}

export function StampCutterTool({ workingAreaRef }: Props) {
  const isMobile = useIsMobile();
  const {
    stampToolState,
    mousePosition,
    droppedPosition,
    pickUp,
    store,
    drop,
    findImageAtPosition,
    performStamp,
  } = useStampCutter();

  const stampValid = useAppStore((s) => s.stampValid);
  const setStampValid = useAppStore((s) => s.setStampValid);
  const hoveringReturnZone = useAppStore((s) => s.hoveringReturnZone);
  const setHoveringReturnZone = useAppStore((s) => s.setHoveringReturnZone);
  const setMousePosition = useAppStore((s) => s.setMousePosition);
  const stampingRef = useRef(false);

  // For mobile DROPPED: distinguishes tap from drag
  const mobileDroppedDragRef = useRef<{ startX: number; startY: number } | null>(null);

  const {
    attributes: dragAttributes,
    listeners: dragListeners,
    setNodeRef: setDragNodeRef,
    isDragging: isCutterDragging,
  } = useDraggable({
    id: 'stamp-cutter-dropped',
    data: { type: 'stamp-cutter' },
    disabled: stampToolState !== 'DROPPED' || isMobile,
  });

  // Helper: compute return zone bounds based on device
  const getReturnZoneBounds = useCallback((rect: DOMRect) => {
    if (isMobile) {
      const cx = rect.left + rect.width / 2;
      return {
        left: cx - RETURN_ZONE_W / 2,
        right: cx + RETURN_ZONE_W / 2,
        top: rect.bottom - RETURN_ZONE_BOTTOM - RETURN_ZONE_H,
        bottom: rect.bottom - RETURN_ZONE_BOTTOM,
      };
    }
    return {
      left: rect.right - RETURN_ZONE_RIGHT - RETURN_ZONE_W,
      right: rect.right - RETURN_ZONE_RIGHT,
      top: rect.bottom - RETURN_ZONE_BOTTOM - RETURN_ZONE_H,
      bottom: rect.bottom - RETURN_ZONE_BOTTOM,
    };
  }, [isMobile]);

  // Detect hovering over the return zone (desktop PICKED_UP)
  useEffect(() => {
    if (stampToolState !== 'PICKED_UP' || !workingAreaRef.current) {
      if (hoveringReturnZone) setHoveringReturnZone(false);
      return;
    }
    const rect = workingAreaRef.current.getBoundingClientRect();
    const zone = getReturnZoneBounds(rect);

    const isOver =
      mousePosition.x >= zone.left &&
      mousePosition.x <= zone.right &&
      mousePosition.y >= zone.top &&
      mousePosition.y <= zone.bottom;

    if (isOver !== hoveringReturnZone) {
      setHoveringReturnZone(isOver);
    }
  }, [mousePosition, stampToolState, workingAreaRef, hoveringReturnZone, setHoveringReturnZone, getReturnZoneBounds]);

  // Mobile: handle touchend while in PICKED_UP state
  useEffect(() => {
    if (stampToolState !== 'PICKED_UP' || !isMobile) return;

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      if (!touch || !workingAreaRef.current) return;

      const x = touch.clientX;
      const y = touch.clientY;
      const rect = workingAreaRef.current.getBoundingClientRect();
      const zone = getReturnZoneBounds(rect);

      // Released over return zone → store
      if (x >= zone.left && x <= zone.right && y >= zone.top && y <= zone.bottom) {
        store();
        return;
      }

      // Released over an image → park (DROPPED)
      const hit = findImageAtPosition(x, y, rect);
      if (hit) {
        drop(x, y);
      } else {
        // Invalid position → do nothing (return to stored)
        store();
      }
    };

    window.addEventListener('touchend', handleTouchEnd);
    return () => window.removeEventListener('touchend', handleTouchEnd);
  }, [stampToolState, isMobile, workingAreaRef, store, findImageAtPosition, drop, getReturnZoneBounds]);

  // Return zone center (for snapping cutter when hovering)
  const returnZoneCenter = useMemo(() => {
    if (!workingAreaRef.current) return { x: 0, y: 0 };
    const rect = workingAreaRef.current.getBoundingClientRect();
    if (isMobile) {
      return {
        x: rect.left + rect.width / 2,
        y: rect.bottom - RETURN_ZONE_BOTTOM - RETURN_ZONE_H / 2,
      };
    }
    return {
      x: rect.right - RETURN_ZONE_RIGHT - RETURN_ZONE_W / 2,
      y: rect.bottom - RETURN_ZONE_BOTTOM - RETURN_ZONE_H / 2,
    };
  }, [workingAreaRef, mousePosition, isMobile]);

  // Validate position while PICKED_UP (desktop only — mobile validates at release)
  useEffect(() => {
    if (stampToolState !== 'PICKED_UP' || isMobile || !workingAreaRef.current) return;

    const rect = workingAreaRef.current.getBoundingClientRect();
    const hit = findImageAtPosition(mousePosition.x, mousePosition.y, rect);

    if (hit) {
      loadImageFromBlob(hit.image.canvasBlob).then(async (srcImg) => {
        const imageScale = srcImg.width / hit.image.width;
        const srcLocalX = hit.localX * imageScale;
        const srcLocalY = hit.localY * imageScale;
        const inBounds = validateStampPosition(
          srcLocalX,
          srcLocalY,
          srcImg.width,
          srcImg.height,
          imageScale,
        );
        if (!inBounds) {
          setStampValid(false);
          return;
        }
        const hasOverlap = await checkOverlap(
          hit.image.canvasBlob,
          srcLocalX,
          srcLocalY,
          imageScale,
        );
        setStampValid(!hasOverlap);
      });
    } else {
      setStampValid(true);
    }
  }, [
    mousePosition,
    stampToolState,
    isMobile,
    findImageAtPosition,
    setStampValid,
    workingAreaRef,
  ]);

  // Desktop: click while PICKED_UP
  const handleClickPickedUp = useCallback(
    async (e: React.MouseEvent) => {
      if (isMobile) return; // Mobile handled via touchend
      if (stampingRef.current) return;
      if (!workingAreaRef.current) return;

      if (hoveringReturnZone) {
        store();
        return;
      }

      const rect = workingAreaRef.current.getBoundingClientRect();
      const hit = findImageAtPosition(e.clientX, e.clientY, rect);

      if (hit) {
        stampingRef.current = true;
        await performStamp(hit.image, hit.localX, hit.localY);
        stampingRef.current = false;
      } else {
        drop(e.clientX, e.clientY);
      }
    },
    [isMobile, workingAreaRef, findImageAtPosition, performStamp, drop, hoveringReturnZone, store],
  );

  if (stampToolState === 'STORED') {
    return null;
  }

  if (stampToolState === 'PICKED_UP') {
    const scale = hoveringReturnZone ? SCALE_STORED : SCALE_PICKED_UP;
    const w = SVG_W * scale;
    const h = SVG_H * scale;

    const posX = hoveringReturnZone
      ? returnZoneCenter.x - CUTOUT_CENTER_X * scale
      : mousePosition.x - CUTOUT_CENTER_X * scale;
    const posY = hoveringReturnZone
      ? returnZoneCenter.y - CUTOUT_CENTER_Y * scale
      : mousePosition.y - CUTOUT_CENTER_Y * scale;

    return (
      <div
        onClick={handleClickPickedUp}
        className="fixed z-50 pointer-events-auto cursor-none"
        style={{
          left: posX,
          top: posY,
          width: w,
          height: h,
          transition: hoveringReturnZone
            ? 'left 0.2s ease-out, top 0.2s ease-out, width 0.2s ease-out, height 0.2s ease-out'
            : 'none',
        }}
      >
        <img
          src={physicalCutterSvg}
          alt=""
          draggable={false}
          style={{
            width: w,
            height: h,
            pointerEvents: 'none',
            transition: hoveringReturnZone ? 'width 0.2s ease-out, height 0.2s ease-out' : 'none',
          }}
        />
        {!stampValid && !hoveringReturnZone && (
          <div
            className="absolute rounded-sm"
            style={{
              left: CUTOUT_X * scale,
              top: CUTOUT_Y * scale,
              width: CUTOUT_W * scale,
              height: CUTOUT_H * scale,
              backgroundColor: 'rgba(255, 0, 0, 0.3)',
            }}
          />
        )}
      </div>
    );
  }

  // DROPPED state
  if (stampToolState === 'DROPPED' && droppedPosition) {
    const scale = isMobile ? SCALE_PICKED_UP : SCALE_DROPPED;
    const w = SVG_W * scale;
    const h = SVG_H * scale;

    if (isMobile) {
      // Mobile: tap → stamp, drag → re-enter PICKED_UP
      return (
        <div
          onPointerDown={(e) => {
            mobileDroppedDragRef.current = { startX: e.clientX, startY: e.clientY };
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            e.stopPropagation();
          }}
          onPointerMove={(e) => {
            if (!mobileDroppedDragRef.current) return;
            const dx = e.clientX - mobileDroppedDragRef.current.startX;
            const dy = e.clientY - mobileDroppedDragRef.current.startY;
            if (Math.sqrt(dx * dx + dy * dy) > 8) {
              mobileDroppedDragRef.current = null;
              setMousePosition({ x: e.clientX, y: e.clientY });
              pickUp();
            }
          }}
          onPointerUp={async (_e) => {
            if (!mobileDroppedDragRef.current) return;
            // Was a tap → perform stamp
            mobileDroppedDragRef.current = null;
            if (stampingRef.current || !workingAreaRef.current) return;
            const rect = workingAreaRef.current.getBoundingClientRect();
            const hit = findImageAtPosition(droppedPosition.x, droppedPosition.y, rect);
            if (hit) {
              stampingRef.current = true;
              await performStamp(hit.image, hit.localX, hit.localY);
              stampingRef.current = false;
            }
            store();
          }}
          className="fixed z-40 cursor-pointer"
          style={{
            left: droppedPosition.x - CUTOUT_CENTER_X * scale,
            top: droppedPosition.y - CUTOUT_CENTER_Y * scale,
            width: w,
            height: h,
          }}
        >
          <img
            src={physicalCutterSvg}
            alt=""
            draggable={false}
            style={{ width: w, height: h, pointerEvents: 'none' }}
          />
        </div>
      );
    }

    // Desktop DROPPED: drag to reposition, click to pick up
    return (
      <div
        ref={setDragNodeRef}
        {...dragListeners}
        {...dragAttributes}
        onClick={(e) => {
          e.stopPropagation();
          useAppStore.getState().setMousePosition({ x: e.clientX, y: e.clientY });
          pickUp();
        }}
        className={`fixed z-40 cursor-grab active:cursor-grabbing hover:scale-105 transition-transform ${
          isCutterDragging ? 'opacity-0' : ''
        }`}
        style={{
          left: droppedPosition.x - CUTOUT_CENTER_X * scale,
          top: droppedPosition.y - CUTOUT_CENTER_Y * scale,
          width: w,
          height: h,
        }}
      >
        <img
          src={physicalCutterSvg}
          alt=""
          draggable={false}
          style={{ width: w, height: h, pointerEvents: 'none' }}
        />
      </div>
    );
  }

  return null;
}
