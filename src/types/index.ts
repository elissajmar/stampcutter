export interface LibraryImage {
  id: string;
  blob: Blob;
  thumbnailBlob: Blob;
  createdAt: number;
}

export interface WorkingAreaImage {
  id: string;
  libraryImageId: string;
  canvasBlob: Blob;
  x: number;
  y: number;
  width: number;
  height: number;
  holes: StampHole[];
}

export interface StampHole {
  localX: number;
  localY: number;
}

export interface Stamp {
  id: string;
  sourceImageId: string;
  blob: Blob;
  x: number;
  y: number;
  width: number;
  height: number;
}

export type StampToolState = 'STORED' | 'PICKED_UP' | 'DROPPED';

export interface MousePosition {
  x: number;
  y: number;
}
