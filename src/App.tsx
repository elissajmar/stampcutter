import { useEffect, useCallback, useState } from 'react';
import texture1 from './assets/Texture1.jpg';
import texture2 from './assets/Texture2.jpg';
import {
  DndContext,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { v4 as uuidv4 } from 'uuid';
import { useAppStore } from './store/useAppStore';
import { initStamp } from './canvas/stampOperations';
import { loadImageFromBlob, generateThumbnail } from './canvas/imageUtils';
import { Sidebar } from './components/Sidebar/Sidebar';
import { WorkingArea } from './components/WorkingArea/WorkingArea';
import { DragOverlayRenderer } from './components/DragOverlay/DragOverlayRenderer';
import type { Active } from '@dnd-kit/core';

function App() {
  const {
    hydrate,
    insertLibraryImageAt,
    removeLibraryImage,
    addWorkingImage,
    updateWorkingImage,
    removeWorkingImage,
    updateStamp,
    setSidebarInsertIndex,
    droppedPosition,
    setDroppedPosition,
  } = useAppStore();

  const [activeItem, setActiveItem] = useState<Active | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  useEffect(() => {
    hydrate();
    initStamp();
  }, [hydrate]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveItem(event.active);
  }, []);

  const computeSidebarInsertIndex = useCallback((cursorY: number) => {
    const container = document.querySelector('[data-sidebar-images]');
    if (!container) return 0;
    const children = container.querySelectorAll('[data-sidebar-image]');
    for (let i = 0; i < children.length; i++) {
      const rect = children[i].getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (cursorY < midY) return i;
    }
    return children.length;
  }, []);

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      const data = event.active.data.current;
      // Close mobile sidebar when library image is dragged into the working area
      if (data?.type === 'library-image' && event.over?.data.current?.type === 'working-area') {
        setMobileSidebarOpen(false);
      }
      if (data?.type !== 'working-image') {
        setSidebarInsertIndex(null);
        return;
      }
      const over = event.over;
      if (over?.data.current?.type === 'sidebar') {
        const activatorEvent = event.activatorEvent as MouseEvent;
        const cursorY = activatorEvent.clientY + event.delta.y;
        setSidebarInsertIndex(computeSidebarInsertIndex(cursorY));
      } else {
        setSidebarInsertIndex(null);
      }
    },
    [setSidebarInsertIndex, computeSidebarInsertIndex, setMobileSidebarOpen],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const insertIndex = useAppStore.getState().sidebarInsertIndex;
      setActiveItem(null);
      setSidebarInsertIndex(null);
      const { active, over, delta } = event;
      const data = active.data.current;
      if (!data) return;

      // Library image → Working area
      if (data.type === 'library-image' && over?.data.current?.type === 'working-area') {
        const image = data.image;
        const img = await loadImageFromBlob(image.blob);
        const workingAreaEl = document.getElementById('working-area-drop');
        const rect = workingAreaEl?.getBoundingClientRect();

        const maxDim = 400;
        const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        // Drop centered on cursor position
        const activatorEvent = event.activatorEvent as MouseEvent;
        const cursorX = activatorEvent.clientX + delta.x;
        const cursorY = activatorEvent.clientY + delta.y;
        const dropX = cursorX - (rect?.left ?? 0) - width / 2;
        const dropY = cursorY - (rect?.top ?? 0) - height / 2;

        removeLibraryImage(image.id);
        addWorkingImage({
          id: uuidv4(),
          libraryImageId: image.id,
          canvasBlob: image.blob,
          x: dropX,
          y: dropY,
          width,
          height,
          holes: [],
        });
        return;
      }

      // Working image → reposition within working area
      if (data.type === 'working-image' && over?.data.current?.type === 'working-area') {
        const image = data.image;
        updateWorkingImage(image.id, {
          x: image.x + delta.x,
          y: image.y + delta.y,
        });
        return;
      }

      // Working image → sidebar (return to library)
      if (data.type === 'working-image' && over?.data.current?.type === 'sidebar') {
        const workingImg = data.image;
        removeWorkingImage(workingImg.id);
        // Use current canvasBlob (preserves holes) and regenerate thumbnail
        const thumbnailBlob = await generateThumbnail(workingImg.canvasBlob, 226);
        insertLibraryImageAt(
          {
            id: workingImg.libraryImageId,
            blob: workingImg.canvasBlob,
            thumbnailBlob,
            createdAt: Date.now(),
          },
          insertIndex ?? 0,
        );
        return;
      }

      // Working image dragged but not over any droppable — just reposition
      if (data.type === 'working-image' && !over) {
        const image = data.image;
        updateWorkingImage(image.id, {
          x: image.x + delta.x,
          y: image.y + delta.y,
        });
        return;
      }

      // Stamp → reposition
      if (data.type === 'stamp') {
        const stamp = data.stamp;
        updateStamp(stamp.id, {
          x: stamp.x + delta.x,
          y: stamp.y + delta.y,
        });
        return;
      }

      // Stamp cutter (dropped) → reposition
      if (data.type === 'stamp-cutter') {
        const pos = droppedPosition;
        if (pos) {
          setDroppedPosition({
            x: pos.x + delta.x,
            y: pos.y + delta.y,
          });
        }
        return;
      }
    },
    [insertLibraryImageAt, removeLibraryImage, addWorkingImage, updateWorkingImage, removeWorkingImage, updateStamp, setSidebarInsertIndex, droppedPosition, setDroppedPosition],
  );

  return (
    <>
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full">
        <Sidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
        <WorkingArea onOpenSidebar={() => setMobileSidebarOpen(true)} />
      </div>
      <DragOverlayRenderer active={activeItem} />
    </DndContext>
    {/* Texture overlays — outside DndContext so they render above the drag overlay */}
    <div
      className="fixed inset-0 pointer-events-none z-[10000]"
      style={{
        backgroundImage: `url(${texture1})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        mixBlendMode: 'exclusion',
        opacity: 0.27,
      }}
    />
    <div
      className="fixed inset-0 pointer-events-none z-[10000]"
      style={{
        backgroundImage: `url(${texture2})`,
        backgroundSize: '50% auto',
        backgroundRepeat: 'repeat',
        mixBlendMode: 'color-dodge',
        opacity: 0.45,
      }}
    />
    </>
  );
}

export default App;
