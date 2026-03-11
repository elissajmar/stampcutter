import Dexie, { type EntityTable } from 'dexie';

interface DBLibraryImage {
  id: string;
  blob: Blob;
  thumbnailBlob: Blob;
  createdAt: number;
}

interface DBWorkingImage {
  id: string;
  libraryImageId: string;
  canvasBlob: Blob;
  x: number;
  y: number;
  width: number;
  height: number;
  holes: { localX: number; localY: number }[];
}

interface DBStamp {
  id: string;
  sourceImageId: string;
  blob: Blob;
  x: number;
  y: number;
  width: number;
  height: number;
}

const db = new Dexie('StampCutterDB') as Dexie & {
  libraryImages: EntityTable<DBLibraryImage, 'id'>;
  workingImages: EntityTable<DBWorkingImage, 'id'>;
  stamps: EntityTable<DBStamp, 'id'>;
};

db.version(1).stores({
  libraryImages: 'id, createdAt',
  workingImages: 'id, libraryImageId',
  stamps: 'id, sourceImageId',
});

export { db };
export type { DBLibraryImage, DBWorkingImage, DBStamp };
