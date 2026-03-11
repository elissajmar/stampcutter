import { useRef, useEffect, useCallback, useMemo } from 'react';
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
// The stamp display width is 128px, the cutout in the SVG is 151 units wide.
const BASE_SCALE = 128 / 151; // ≈0.8477 — DISPLAY_SCALE from stampOperations

// Scale factors per state (relative to BASE_SCALE)
const SCALE_PICKED_UP = BASE_SCALE;         // cutout = 128×173
const SCALE_DROPPED = BASE_SCALE * 0.6;     // cutout ≈ 77×104
const SCALE_STORED = BASE_SCALE * 0.38;     // stored size

// Return zone position (matches StorageZone absolute positioning)
const RETURN_ZONE_BOTTOM = 32;  // bottom-8
const RETURN_ZONE_RIGHT = 24;   // right-6
const RETURN_ZONE_W = 120;
const RETURN_ZONE_H = 190;

interface Props {
  workingAreaRef: React.RefObject<HTMLDivElement | null>;
}

export function StampCutterTool({ workingAreaRef }: Props) {
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
  const stampingRef = useRef(false);

  const {
    attributes: dragAttributes,
    listeners: dragListeners,
    setNodeRef: setDragNodeRef,
    isDragging: isCutterDragging,
  } = useDraggable({
    id: 'stamp-cutter-dropped',
    data: { type: 'stamp-cutter' },
    disabled: stampToolState !== 'DROPPED',
  });

  // Detect hovering over the return zone
  useEffect(() => {
    if (stampToolState !== 'PICKED_UP' || !workingAreaRef.current) {
      if (hoveringReturnZone) setHoveringReturnZone(false);
      return;
    }
    const rect = workingAreaRef.current.getBoundingClientRect();
    const zoneLeft = rect.right - RETURN_ZONE_RIGHT - RETURN_ZONE_W;
    const zoneTop = rect.bottom - RETURN_ZONE_BOTTOM - RETURN_ZONE_H;
    const zoneRight = rect.right - RETURN_ZONE_RIGHT;
    const zoneBottom = rect.bottom - RETURN_ZONE_BOTTOM;

    const isOver =
      mousePosition.x >= zoneLeft &&
      mousePosition.x <= zoneRight &&
      mousePosition.y >= zoneTop &&
      mousePosition.y <= zoneBottom;

    if (isOver !== hoveringReturnZone) {
      setHoveringReturnZone(isOver);
    }
  }, [mousePosition, stampToolState, workingAreaRef, hoveringReturnZone, setHoveringReturnZone]);

  // Return zone center (for snapping the cutter when hovering)
  const returnZoneCenter = useMemo(() => {
    if (!workingAreaRef.current) return { x: 0, y: 0 };
    const rect = workingAreaRef.current.getBoundingClientRect();
    return {
      x: rect.right - RETURN_ZONE_RIGHT - RETURN_ZONE_W / 2,
      y: rect.bottom - RETURN_ZONE_BOTTOM - RETURN_ZONE_H / 2,
    };
  }, [workingAreaRef, mousePosition]); // recompute when mouse moves (rect may change on resize)

  // Validate position while moving
  useEffect(() => {
    if (stampToolState !== 'PICKED_UP' || !workingAreaRef.current) return;

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
    findImageAtPosition,
    setStampValid,
    workingAreaRef,
  ]);

  const handleClickPickedUp = useCallback(
    async (e: React.MouseEvent) => {
      if (stampingRef.current) return;
      if (!workingAreaRef.current) return;

      // If hovering the return zone, store the tool
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
    [workingAreaRef, findImageAtPosition, performStamp, drop, hoveringReturnZone, store],
  );

  if (stampToolState === 'STORED') {
    return null; // Storage zone is rendered in WorkingArea
  }

  if (stampToolState === 'PICKED_UP') {
    const scale = hoveringReturnZone ? SCALE_STORED : SCALE_PICKED_UP;
    const w = SVG_W * scale;
    const h = SVG_H * scale;

    // When hovering the return zone, snap cutter center to zone center
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

  if (stampToolState === 'DROPPED' && droppedPosition) {
    const scale = SCALE_DROPPED;
    const w = SVG_W * scale;
    const h = SVG_H * scale;

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
