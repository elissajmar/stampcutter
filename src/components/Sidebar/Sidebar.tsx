import { useDroppable } from '@dnd-kit/core';
import { useAppStore } from '../../store/useAppStore';
import { SidebarImage } from './SidebarImage';
import { UploadButton } from './UploadButton';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: Props) {
  const libraryImages = useAppStore((s) => s.libraryImages);
  const sidebarInsertIndex = useAppStore((s) => s.sidebarInsertIndex);
  const { setNodeRef } = useDroppable({
    id: 'sidebar',
    data: { type: 'sidebar' },
  });

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/30"
          onClick={onClose}
        />
      )}

      <div
        ref={setNodeRef}
        className={[
          'w-[316px] min-w-[316px] h-full flex flex-col group/sidebar',
          'fixed md:relative z-50 md:z-auto top-0 left-0',
          'transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
        style={{ backgroundColor: '#B8B2AC' }}
      >
        <div className="flex-1 overflow-y-auto pt-4 sidebar-scroll" style={{ scrollbarGutter: 'stable' }} data-sidebar-images>
          {libraryImages.map((img, i) => (
            <div
              key={img.id}
              data-sidebar-image
              style={{
                paddingTop: sidebarInsertIndex === i ? 144 : 0,
                transition: 'padding-top 250ms ease',
              }}
            >
              <SidebarImage image={img} />
            </div>
          ))}
          {libraryImages.length > 0 && (
            <div
              style={{
                height:
                  sidebarInsertIndex !== null &&
                  sidebarInsertIndex >= libraryImages.length
                    ? 144
                    : 0,
                transition: 'height 250ms ease',
              }}
            />
          )}
          {libraryImages.length === 0 && sidebarInsertIndex !== null && (
            <div style={{ height: 144, transition: 'height 250ms ease' }} />
          )}
        </div>
        <UploadButton />
      </div>
    </>
  );
}
