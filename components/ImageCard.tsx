import React, { useRef } from 'react';
import { CanvasImage } from '../types';

interface ImageCardProps {
  image: CanvasImage;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onZoom: (image: CanvasImage) => void;
  onMouseDown: (e: React.MouseEvent, id: string) => void;
  onUpdateTransform: (id: string, updates: Partial<CanvasImage>) => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({ 
  image, 
  isSelected, 
  onSelect, 
  onDelete, 
  onZoom,
  onMouseDown,
  onUpdateTransform
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{x: number, y: number} | null>(null);

  // --- Drag & Select Logic ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    
    // Prevent dragging if clicking controls
    if ((e.target as HTMLElement).closest('button') || 
        (e.target as HTMLElement).closest('.rotate-handle') ||
        (e.target as HTMLElement).closest('.resize-handle')) {
        return;
    }

    e.stopPropagation();
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    onMouseDown(e, image.id);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (dragStartRef.current) {
        const dist = Math.hypot(e.clientX - dragStartRef.current.x, e.clientY - dragStartRef.current.y);
        if (dist < 5) {
            onSelect(image.id);
        }
    } else {
        onSelect(image.id);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onZoom(image);
  };

  // --- Rotation Logic ---
  const handleRotateStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const angleRad = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX);
      // Convert to deg, add 90 because handle is at top (-90deg relative to 0)
      const angleDeg = (angleRad * 180 / Math.PI) + 90; 
      onUpdateTransform(image.id, { rotation: angleDeg });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // --- Scale/Resize Logic ---
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const startY = e.clientY;
    const startScale = image.scale;

    const onMouseMove = (moveEvent: MouseEvent) => {
      // Simple scaling: dragging down increases scale, up decreases
      const deltaY = moveEvent.clientY - startY;
      // Sensitivity: 200px drag = +100% scale approx
      const newScale = Math.max(0.2, startScale + deltaY * 0.005);
      onUpdateTransform(image.id, { scale: newScale });
    };

    const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `morisot-${image.id}.png`;
    link.click();
  };

  return (
    <div 
      ref={cardRef}
      className={`absolute transition-shadow duration-200 ${
        isSelected ? 'z-50' : 'z-10 hover:z-20'
      }`}
      style={{
        transform: `translate(${image.x}px, ${image.y}px) rotate(${image.rotation}deg) scale(${image.scale})`,
        width: '280px',
        transformOrigin: 'center center',
        cursor: isSelected ? 'move' : 'pointer'
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Rotation Handle (Only when selected) */}
      {isSelected && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-8 h-12 flex flex-col items-center justify-end cursor-grab active:cursor-grabbing group z-50 rotate-handle" onMouseDown={handleRotateStart}>
           <div className="w-[2px] h-full bg-amber-500/50"></div>
           <div className="w-4 h-4 bg-white border-2 border-amber-500 rounded-full shadow-sm group-hover:scale-125 transition-transform"></div>
        </div>
      )}

      {/* Photo Frame / Physical look */}
      <div className={`
        relative p-3 transition-all duration-300 bg-white shadow-lg select-none
        ${isSelected 
          ? 'shadow-[0_15px_50px_rgba(0,0,0,0.6)] ring-1 ring-amber-500/50' 
          : 'shadow-[0_4px_10px_rgba(0,0,0,0.3)] hover:shadow-[0_10px_20px_rgba(0,0,0,0.4)]'
        }
      `}>
        
        {/* Loading State */}
        {image.isLoading ? (
          <div className="aspect-[1/1] w-full flex flex-col items-center justify-center bg-stone-50 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-stone-100 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
            <div className="w-8 h-8 border-2 border-stone-300 border-t-amber-500 rounded-full animate-spin mb-2 z-10"></div>
            <div className="text-stone-400 font-mono text-[10px] tracking-widest z-10 animate-pulse">RENDERING</div>
          </div>
        ) : (
          /* Clean Image */
          <div className="relative group overflow-hidden bg-stone-100">
            <img 
              src={image.url} 
              alt={image.prompt} 
              className="w-full h-auto object-cover block select-none pointer-events-none"
              draggable={false}
              loading="lazy"
            />
            
             {/* Hover Actions */}
            <div className={`absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto`}>
                 <button 
                    onClick={handleDownload}
                    className="bg-black/40 hover:bg-black/60 text-white p-1.5 rounded-full backdrop-blur-sm transition-colors"
                    title="下载原图"
                 >
                   <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                 </button>
                 <button 
                    onClick={(e) => { e.stopPropagation(); onZoom(image); }} 
                    className="bg-black/40 hover:bg-black/60 text-white p-1.5 rounded-full backdrop-blur-sm transition-colors"
                    title="全屏查看"
                 >
                   <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                 </button>
            </div>
          </div>
        )}

        {/* Prompt Label */}
        {!image.isLoading && (
            <div className="mt-3 px-1">
                <p className="font-handwriting text-stone-800 text-xs leading-tight line-clamp-3 overflow-hidden select-text font-serif italic opacity-80" style={{ fontFamily: 'Times New Roman, serif' }}>
                    {image.prompt}
                </p>
            </div>
        )}
      </div>

      {/* Controls Overlay (Only when selected) */}
      {isSelected && (
        <>
          {/* Top Right: Delete */}
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(image.id); }}
            className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform z-50"
            title="删除"
          >
            ×
          </button>

          {/* Resize Handles (Corners) */}
          <div 
            className="absolute -top-2 -left-2 w-4 h-4 bg-white border border-amber-500 cursor-nwse-resize z-50 resize-handle hover:bg-amber-100 shadow-sm"
            onMouseDown={handleResizeStart}
          />
          <div 
            className="absolute -top-2 -right-2 w-4 h-4 bg-white border border-amber-500 cursor-nesw-resize z-50 resize-handle hover:bg-amber-100 shadow-sm"
            onMouseDown={handleResizeStart}
          />
          <div 
            className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border border-amber-500 cursor-nesw-resize z-50 resize-handle hover:bg-amber-100 shadow-sm"
            onMouseDown={handleResizeStart}
          />
          <div 
            className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-amber-500 cursor-nwse-resize z-50 resize-handle hover:bg-amber-100 shadow-sm"
            onMouseDown={handleResizeStart}
          />
        </>
      )}
      
    </div>
  );
};