import { useState, useEffect } from 'react';
import type { StampToolState } from '../../types';
import physicalCutterSvg from '../../assets/PhysicalCutter.svg';
import cutterReturnSvg from '../../assets/CutterReturn.svg';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

const SVG_W = 338;
const SVG_H = 619;
// Base scale makes the SVG cutout (151×204) match the stamp display size (128×173)
const BASE_SCALE = 128 / 151;
// Stored scale: 30% of the full picked-up size
const SCALE_STORED = BASE_SCALE * 0.38;
const STORED_W = SVG_W * SCALE_STORED;
const STORED_H = SVG_H * SCALE_STORED;

// Return zone dimensions (must match StampCutterTool constants)
const RETURN_ZONE_W = 120;
const RETURN_ZONE_H = 190;
const RETURN_ZONE_BOTTOM = 32;  // bottom-8
const RETURN_ZONE_RIGHT = 24;   // right-6

interface Props {
  stampToolState: StampToolState;
  onPickUp: () => void;
  onStore: () => void;
}

export function StorageZone({ stampToolState, onPickUp, onStore }: Props) {
  const isMobile = useIsMobile();
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (stampToolState === 'STORED') {
      onPickUp();
    } else if (stampToolState === 'PICKED_UP') {
      onStore();
    }
  };

  if (stampToolState === 'STORED') {
    return (
      <div
        onClick={handleClick}
        className="absolute cursor-pointer z-30 hover:scale-105 transition-transform"
        style={isMobile ? {
          bottom: RETURN_ZONE_BOTTOM + (RETURN_ZONE_H - STORED_H) / 2,
          left: '50%',
          transform: 'translateX(-50%)',
          width: STORED_W,
          height: STORED_H,
        } : {
          bottom: RETURN_ZONE_BOTTOM + (RETURN_ZONE_H - STORED_H) / 2,
          right: RETURN_ZONE_RIGHT + (RETURN_ZONE_W - STORED_W) / 2,
          width: STORED_W,
          height: STORED_H,
        }}
      >
        <img
          src={physicalCutterSvg}
          alt="Stamp cutter"
          draggable={false}
          style={{ width: STORED_W, height: STORED_H, pointerEvents: 'none' }}
        />
      </div>
    );
  }
  

  // Show outline placeholder when tool is picked up or dropped
  if (stampToolState === 'PICKED_UP' || stampToolState === 'DROPPED') {
    const returnW = 120;
    const returnH = 190;

    return (
      <div
        onClick={handleClick}
        className={`absolute z-30 flex items-center justify-center ${isMobile ? 'bottom-4 left-1/2 -translate-x-1/2' : 'bottom-8 right-6'}`}
        style={{
          width: returnW,
          height: returnH,
          cursor: stampToolState === 'PICKED_UP' ? 'pointer' : 'default',
        }}
      >
        <img
          src={cutterReturnSvg}
          alt=""
          draggable={false}
          style={{ width: returnW, height: returnH, pointerEvents: 'none', position: 'absolute', top: 0, left: 0 }}
        />
        <span
          style={{
            position: 'relative',
            fontFamily: "'PP Mondwest', sans-serif",
            fontSize: 14,
            fontWeight: 500,
            color: '#A09890',
            textAlign: 'center',
            lineHeight: 1.2,
          }}
        >
          Return<br />here
        </span>
      </div>
    );
  }

  return null;
}
