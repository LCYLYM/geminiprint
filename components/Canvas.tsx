import React, { useState, useRef, useEffect } from 'react';
import { CanvasImage } from '../types';
import { ImageCard } from './ImageCard';

interface CanvasProps {
  images: CanvasImage[];
  selectedImageId: string | null;
  onSelectImage: (id: string) => void;
  onDeleteImage: (id: string) => void;
  onUpdateImage: (id: string, updates: Partial<CanvasImage>) => void;
  onShare: () => void;
  onZoomImage: (image: CanvasImage) => void;
  onNewCanvas: () => void;
  onHistory: () => void;
}

export const Canvas: React.FC<CanvasProps> = ({ 
  images, 
  selectedImageId, 
  onSelectImage, 
  onDeleteImage,
  onUpdateImage,
  onShare,
  onZoomImage,
  onNewCanvas,
  onHistory
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Viewport State (Pan and Zoom)
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  
  // Interaction State
  const [isPanning, setIsPanning] = useState(false);
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [showLines, setShowLines] = useState(true);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  // --- Image Dragging Logic ---
  const handleImageMouseDown = (e: React.MouseEvent, id: string) => {
    if (e.button !== 0) return;
    setDraggedImageId(id);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  // --- Canvas Panning Logic (Right Click) ---
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 2) { // Right click
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    } else if (e.button === 0) {
       if (e.target === containerRef.current) {
          onSelectImage('');
       }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;
    setLastMousePos({ x: e.clientX, y: e.clientY });

    if (isPanning) {
      setView(v => ({ ...v, x: v.x + deltaX, y: v.y + deltaY }));
    } else if (draggedImageId) {
      const worldDeltaX = deltaX / view.k;
      const worldDeltaY = deltaY / view.k;
      
      const img = images.find(i => i.id === draggedImageId);
      if (img) {
         onUpdateImage(draggedImageId, {
            x: img.x + worldDeltaX,
            y: img.y + worldDeltaY
         });
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedImageId(null);
  };

  // --- Smooth Zoom Logic (Wheel) ---
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation(); 
    
    const scaleAmount = -e.deltaY * 0.001;
    const newScale = Math.min(Math.max(0.1, view.k * (1 + scaleAmount)), 4);
    
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;

    const mouseWorldX = (mouseX - view.x) / view.k;
    const mouseWorldY = (mouseY - view.y) / view.k;

    const newX = mouseX - mouseWorldX * newScale;
    const newY = mouseY - mouseWorldY * newScale;

    setView({ x: newX, y: newY, k: newScale });
  };

  // --- Render Lines ---
  const renderLines = () => {
    if (!showLines) return null;

    return (
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible z-0" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`, transformOrigin: '0 0' }}>
        {images.map(img => {
          if (!img.parentId) return null;
          const parent = images.find(p => p.id === img.parentId);
          if (!parent) return null;

          const startX = parent.x + 140; 
          const startY = parent.y + 150;
          
          const endX = img.x + 140;
          const endY = img.y + 150;

          const midX = (startX + endX) / 2;
          const midY = (startY + endY) / 2;
          const cp1x = startX; 
          const cp1y = midY;
          const cp2x = endX;
          const cp2y = midY;

          return (
            <g key={`line-${parent.id}-${img.id}`}>
              <path 
                d={`M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`}
                stroke={img.id === selectedImageId || parent.id === selectedImageId ? "#f59e0b" : "#57534e"}
                strokeWidth={img.id === selectedImageId ? 3 : 1}
                strokeDasharray="5,5"
                fill="none"
                opacity={0.6}
              />
              <circle cx={endX} cy={endY} r="3" fill="#57534e" />
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-[#1c1c1c] overflow-hidden select-none"
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      style={{ cursor: isPanning ? 'grabbing' : 'default' }}
    >
      {/* Background Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
             backgroundImage: 'radial-gradient(circle, #888 1px, transparent 1px)',
             backgroundSize: `${40 * view.k}px ${40 * view.k}px`,
             backgroundPosition: `${view.x}px ${view.y}px`
        }}
      />

      {/* Helper UI */}
      <div className="fixed top-24 right-6 z-[60] flex flex-col gap-2 pointer-events-auto">
         <button 
           onClick={onShare}
           className="bg-stone-800/80 backdrop-blur border border-stone-600 p-2 rounded text-stone-300 hover:text-amber-500 text-xs font-mono uppercase transition-colors shadow-lg"
         >
           分享画板
         </button>
         
         <div className="flex gap-2">
            <button 
               onClick={onNewCanvas}
               className="flex-1 bg-stone-800/80 backdrop-blur border border-stone-600 p-2 rounded text-stone-300 hover:text-white hover:border-teal-500 text-xs font-mono uppercase transition-colors shadow-lg"
               title="新建画布"
             >
               + 新建
             </button>
             <button 
               onClick={onHistory}
               className="flex-1 bg-stone-800/80 backdrop-blur border border-stone-600 p-2 rounded text-stone-300 hover:text-white hover:border-teal-500 text-xs font-mono uppercase transition-colors shadow-lg"
               title="历史记录"
             >
               历史
             </button>
         </div>

         <button 
           onClick={() => setShowLines(!showLines)}
           className="bg-stone-800/80 backdrop-blur border border-stone-600 p-2 rounded text-stone-300 hover:text-amber-500 text-xs font-mono uppercase transition-colors"
         >
           {showLines ? '隐藏连线' : '显示连线'}
         </button>

         <div className="bg-stone-900/50 p-2 rounded text-[10px] text-stone-500 font-mono pointer-events-none mt-2">
            右键拖动平滑移动<br/>滚轮平滑缩放<br/>拖动旋转手柄旋转<br/>拖动边角调整大小
         </div>
      </div>

      {/* Content Container with Transform */}
      {renderLines()}

      <div 
        className="absolute top-0 left-0 origin-top-left will-change-transform"
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}
      >
        {/* Images Layer */}
        {images.length === 0 ? (
          <div className="absolute top-[30vh] left-[40vw] flex items-center justify-center pointer-events-none unselectable transform -translate-x-1/2 -translate-y-1/2">
               <div className="text-center opacity-40">
                 <div className="border-4 border-dashed border-stone-700 rounded-full p-8 md:p-12 mb-6 inline-block">
                   <span className="text-4xl">🎨</span>
                 </div>
                 <h2 className="text-2xl font-bold tracking-widest uppercase mb-2">画板就绪</h2>
                 <p className="font-mono text-sm">输入灵感，开始创作</p>
               </div>
          </div>
        ) : (
          images.map(img => (
            <ImageCard
              key={img.id}
              image={img}
              isSelected={img.id === selectedImageId}
              onSelect={onSelectImage}
              onDelete={onDeleteImage}
              onZoom={onZoomImage}
              onMouseDown={handleImageMouseDown}
              onUpdateTransform={onUpdateImage}
            />
          ))
        )}
      </div>
    </div>
  );
};