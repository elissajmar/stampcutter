import { create } from 'zustand';
import type {
  LibraryImage,
  WorkingAreaImage,
  Stamp,
  StampToolState,
  MousePosition,
} from '../types';
import { db } from '../db/database';

interface AppState {
  // Library
  libraryImages: LibraryImage[];
  addLibraryImage: (img: LibraryImage) => void;
  insertLibraryImageAt: (img: LibraryImage, index: number) => void;
  removeLibraryImage: (id: string) => void;
  setLibraryImages: (imgs: LibraryImage[]) => void;

  // Sidebar insert indicator
  sidebarInsertIndex: number | null;
  setSidebarInsertIndex: (index: number | null) => void;

  // Working area
  workingImages: WorkingAreaImage[];
  addWorkingImage: (img: WorkingAreaImage) => void;
  updateWorkingImage: (id: string, updates: Partial<WorkingAreaImage>) => void;
  removeWorkingImage: (id: string) => void;
  setWorkingImages: (imgs: WorkingAreaImage[]) => void;

  // Stamps
  stamps: Stamp[];
  addStamp: (stamp: Stamp) => void;
  updateStamp: (id: string, updates: Partial<Stamp>) => void;
  setStamps: (stamps: Stamp[]) => void;

  // Stamp tool
  stampToolState: StampToolState;
  setStampToolState: (state: StampToolState) => void;
  droppedPosition: MousePosition | null;
  setDroppedPosition: (pos: MousePosition | null) => void;
  mousePosition: MousePosition;
  setMousePosition: (pos: MousePosition) => void;

  // Return zone hover
  hoveringReturnZone: boolean;
  setHoveringReturnZone: (hovering: boolean) => void;

  // Validation
  stampValid: boolean;
  setStampValid: (valid: boolean) => void;

  // Hydration
  hydrate: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  libraryImages: [],
  addLibraryImage: (img) => {
    set((s) => ({ libraryImages: [...s.libraryImages, img] }));
    db.libraryImages.put({
      id: img.id,
      blob: img.blob,
      thumbnailBlob: img.thumbnailBlob,
      createdAt: img.createdAt,
    });
  },
  insertLibraryImageAt: (img, index) => {
    set((s) => {
      const arr = [...s.libraryImages];
      arr.splice(index, 0, img);
      return { libraryImages: arr };
    });
    db.libraryImages.put({
      id: img.id,
      blob: img.blob,
      thumbnailBlob: img.thumbnailBlob,
      createdAt: img.createdAt,
    });
  },
  removeLibraryImage: (id) => {
    set((s) => ({
      libraryImages: s.libraryImages.filter((img) => img.id !== id),
    }));
  },
  setLibraryImages: (imgs) => set({ libraryImages: imgs }),

  workingImages: [],
  addWorkingImage: (img) => {
    set((s) => ({ workingImages: [...s.workingImages, img] }));
    db.workingImages.put({
      id: img.id,
      libraryImageId: img.libraryImageId,
      canvasBlob: img.canvasBlob,
      x: img.x,
      y: img.y,
      width: img.width,
      height: img.height,
      holes: img.holes,
    });
  },
  updateWorkingImage: (id, updates) => {
    set((s) => ({
      workingImages: s.workingImages.map((img) =>
        img.id === id ? { ...img, ...updates } : img
      ),
    }));
    const img = get().workingImages.find((i) => i.id === id);
    if (img) {
      db.workingImages.put({
        id: img.id,
        libraryImageId: img.libraryImageId,
        canvasBlob: img.canvasBlob,
        x: img.x,
        y: img.y,
        width: img.width,
        height: img.height,
        holes: img.holes,
        ...updates,
      });
    }
  },
  removeWorkingImage: (id) => {
    set((s) => ({
      workingImages: s.workingImages.filter((img) => img.id !== id),
    }));
    db.workingImages.delete(id);
  },
  setWorkingImages: (imgs) => set({ workingImages: imgs }),

  stamps: [],
  addStamp: (stamp) => {
    set((s) => ({ stamps: [...s.stamps, stamp] }));
    db.stamps.put({
      id: stamp.id,
      sourceImageId: stamp.sourceImageId,
      blob: stamp.blob,
      x: stamp.x,
      y: stamp.y,
      width: stamp.width,
      height: stamp.height,
    });
  },
  updateStamp: (id, updates) => {
    set((s) => ({
      stamps: s.stamps.map((st) =>
        st.id === id ? { ...st, ...updates } : st
      ),
    }));
    const stamp = get().stamps.find((s) => s.id === id);
    if (stamp) {
      db.stamps.put({
        id: stamp.id,
        sourceImageId: stamp.sourceImageId,
        blob: stamp.blob,
        x: stamp.x,
        y: stamp.y,
        width: stamp.width,
        height: stamp.height,
        ...updates,
      });
    }
  },
  setStamps: (stamps) => set({ stamps }),

  sidebarInsertIndex: null,
  setSidebarInsertIndex: (index) => set({ sidebarInsertIndex: index }),

  stampToolState: 'STORED',
  setStampToolState: (state) => set({ stampToolState: state }),
  droppedPosition: null,
  setDroppedPosition: (pos) => set({ droppedPosition: pos }),
  mousePosition: { x: 0, y: 0 },
  setMousePosition: (pos) => set({ mousePosition: pos }),

  hoveringReturnZone: false,
  setHoveringReturnZone: (hovering) => set({ hoveringReturnZone: hovering }),

  stampValid: true,
  setStampValid: (valid) => set({ stampValid: valid }),

  hydrate: async () => {
    const [libImages, workImages, stamps] = await Promise.all([
      db.libraryImages.orderBy('createdAt').toArray(),
      db.workingImages.toArray(),
      db.stamps.toArray(),
    ]);
    // Exclude library images that are currently in the working area
    const workingLibIds = new Set(workImages.map((w) => w.libraryImageId));
    const filteredLibImages = libImages.filter((l) => !workingLibIds.has(l.id));
    set({
      libraryImages: filteredLibImages,
      workingImages: workImages,
      stamps: stamps,
    });
  },
}));
