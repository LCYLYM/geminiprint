import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { Canvas } from './components/Canvas';
import { CanvasImage, GenerationStatus } from './types';
import { generateSingleImage, STYLE_MODIFIERS } from './services/geminiService';
import { urlToBase64, fileToBase64 } from './utils/helpers';
import html2canvas from 'html2canvas';

// --- Types for History ---
interface HistoryItem {
  id: string;
  name: string;
  timestamp: number;
  preview?: string; 
}

interface SavedCanvas {
  id: string;
  images: CanvasImage[];
  timestamp: number;
}

// --- Custom Cursor Component ---
const CustomCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [clicked, setClicked] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }
    };
    const onMouseDown = () => setClicked(true);
    const onMouseUp = () => setClicked(false);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mouseup', onMouseUp);
    }
  }, []);

  return (
    <div 
      ref={cursorRef}
      className="fixed top-0 left-0 pointer-events-none z-[10000] mix-blend-difference"
      style={{ willChange: 'transform' }}
    >
      <div className={`
        relative -top-3 -left-3 w-6 h-6 border-2 border-white rounded-full transition-all duration-150 ease-out
        ${clicked ? 'scale-75 bg-white' : 'scale-100'}
      `}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full"></div>
      </div>
    </div>
  );
};

// --- Helper: Spawn Positions ---
const calculateSpawnPositions = (count: number, parentX: number, parentY: number) => {
  const positions = [];
  const startX = parentX;
  const startY = parentY + 400; // Row below parent

  for (let i = 0; i < count; i++) {
    const spreadWidth = 320;
    const xOffset = (i - (count - 1) / 2) * spreadWidth;
    positions.push({
      x: startX + xOffset,
      y: startY + (Math.random() * 40 - 20)
    });
  }
  return positions;
};

export default function App() {
  // Canvas State
  const [canvasId, setCanvasId] = useState<string>(() => 'default-' + Date.now());
  const [images, setImages] = useState<CanvasImage[]>([]);
  
  // UI State
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [zoomedImage, setZoomedImage] = useState<CanvasImage | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);

  // --- Persistence Logic ---
  useEffect(() => {
    // Load history list on mount
    try {
        const stored = localStorage.getItem('morisot_history_index');
        if (stored) {
            setHistoryList(JSON.parse(stored));
        }
        
        // Try load default/last canvas
        const lastId = localStorage.getItem('morisot_last_canvas_id');
        if (lastId) {
            const savedCanvas = localStorage.getItem(`morisot_canvas_${lastId}`);
            if (savedCanvas) {
                const data: SavedCanvas = JSON.parse(savedCanvas);
                setCanvasId(data.id);
                setImages(data.images);
            }
        }
    } catch (e) {
        console.error("Storage Init Error", e);
    }
  }, []);

  // Auto-save effect
  useEffect(() => {
    if (images.length === 0) return;

    const timer = setTimeout(() => {
        try {
            const data: SavedCanvas = {
                id: canvasId,
                images: images,
                timestamp: Date.now()
            };
            localStorage.setItem(`morisot_canvas_${canvasId}`, JSON.stringify(data));
            localStorage.setItem('morisot_last_canvas_id', canvasId);

            // Update Index
            setHistoryList(prev => {
                const exists = prev.find(p => p.id === canvasId);
                const name = images[0]?.prompt.substring(0, 20) || "Untitled Canvas";
                const newItem: HistoryItem = { id: canvasId, name, timestamp: Date.now() };
                
                let newList;
                if (exists) {
                    newList = prev.map(p => p.id === canvasId ? { ...newItem, name: exists.name === "Untitled Canvas" ? name : exists.name } : p);
                } else {
                    newList = [newItem, ...prev];
                }
                localStorage.setItem('morisot_history_index', JSON.stringify(newList));
                return newList;
            });
        } catch (e) {
            console.error("Auto Save Failed", e);
        }
    }, 1000); // Debounce 1s

    return () => clearTimeout(timer);
  }, [images, canvasId]);

  // --- Actions ---
  const handleNewCanvas = () => {
    if (window.confirm("确定要新建画布吗？当前画布已自动保存。")) {
        const newId = 'canvas-' + Date.now();
        setCanvasId(newId);
        setImages([]);
        setSelectedId(null);
    }
  };

  const handleLoadCanvas = (id: string) => {
      try {
        const saved = localStorage.getItem(`morisot_canvas_${id}`);
        if (saved) {
            const data: SavedCanvas = JSON.parse(saved);
            setCanvasId(data.id);
            setImages(data.images);
            setSelectedId(null);
            setShowHistory(false);
        }
      } catch (e) {
          console.error("Load Failed", e);
      }
  };

  const handleGenerate = async (prompt: string, file?: File) => {
    setStatus(GenerationStatus.GENERATING);
    
    const timestamp = Date.now();
    let parentImage: CanvasImage | undefined = selectedId ? images.find(img => img.id === selectedId) : undefined;
    let referenceImageBase64: string | undefined = undefined;
    let spawnSourceX = 500;
    let spawnSourceY = 400;

    // --- 1. Handle Reference Image (File) ---
    if (file) {
      try {
        referenceImageBase64 = await fileToBase64(file);
        
        let refX = 0;
        let refY = 0;
        if (images.length > 0) {
           const maxX = Math.max(...images.map(i => i.x));
           refX = maxX + 400;
           refY = 200; 
        } else {
           refX = window.innerWidth / 2 - 140; 
           refY = 100;
        }

        const refImageId = `ref-${timestamp}`;
        const refImageNode: CanvasImage = {
          id: refImageId,
          url: `data:image/png;base64,${referenceImageBase64}`,
          prompt: "参考图",
          timestamp,
          isLoading: false,
          x: refX,
          y: refY,
          rotation: -2,
          scale: 1,
        };
        
        setImages(prev => [...prev, refImageNode]);
        
        parentImage = refImageNode;
        spawnSourceX = refX;
        spawnSourceY = refY;

      } catch (e) {
        console.error("Failed to read file", e);
      }
    } 
    // --- 2. Handle Reference Image (Selected Canvas Image) ---
    else if (parentImage) {
        try {
            referenceImageBase64 = await urlToBase64(parentImage.url);
            spawnSourceX = parentImage.x;
            spawnSourceY = parentImage.y;
        } catch (e) {
            console.error("Failed to process reference image", e);
        }
    }
    // --- 3. No Reference (Text Only) ---
    else {
        if (images.length > 0) {
            const maxX = Math.max(...images.map(i => i.x));
            spawnSourceX = maxX + 400;
            spawnSourceY = 400;
        }
    }

    // --- 4. Create Placeholders ---
    const spawnCount = 5;
    const positions = calculateSpawnPositions(spawnCount, spawnSourceX, spawnSourceY);
    
    const newPlaceholders: CanvasImage[] = Array.from({ length: spawnCount }).map((_, i) => ({
      id: `${timestamp}-${i}`,
      url: '', 
      prompt: prompt || 'Variation', 
      timestamp: timestamp, 
      isLoading: true,
      x: positions[i].x,
      y: positions[i].y,
      rotation: (Math.random() * 6 - 3), 
      scale: 1,
      parentId: parentImage?.id
    }));
    
    setImages(prev => [...prev, ...newPlaceholders]);

    // --- 5. Fire Requests ---
    const basePrompt = prompt; 
    let activeRequests = spawnCount;

    newPlaceholders.forEach((placeholder, idx) => {
        const modifier = STYLE_MODIFIERS[idx % STYLE_MODIFIERS.length];
        
        generateSingleImage(basePrompt, referenceImageBase64, modifier)
            .then(url => {
                setImages(prev => prev.map(img => {
                    if (img.id === placeholder.id) {
                        if (url) {
                            return { ...img, url, isLoading: false };
                        } else {
                            return { ...img, id: 'FAILED-' + img.id }; 
                        }
                    }
                    return img;
                }).filter(img => !img.id.startsWith('FAILED-')));
            })
            .finally(() => {
                activeRequests--;
                if (activeRequests === 0) {
                    setStatus(GenerationStatus.SUCCESS);
                }
            });
    });
  };

  const handleSelect = (id: string) => {
    setSelectedId(prev => prev === id ? null : id);
  };

  const handleDelete = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleUpdateImage = (id: string, updates: Partial<CanvasImage>) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, ...updates } : img
    ));
  };

  const handleShare = async () => {
    if (images.length === 0) return;

    try {
        // Calculate Bounds
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        images.forEach(img => {
            const w = 280 * img.scale;
            const h = 350 * img.scale; // Approximate visual height
            if (img.x - 50 < minX) minX = img.x - 50;
            if (img.y - 50 < minY) minY = img.y - 50;
            if (img.x + w + 50 > maxX) maxX = img.x + w + 50;
            if (img.y + h + 50 > maxY) maxY = img.y + h + 50;
        });

        const contentWidth = Math.max(800, maxX - minX);
        const contentHeight = Math.max(600, maxY - minY);
        const padding = 100;
        const footerHeight = 120;

        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'fixed';
        tempContainer.style.top = '0';
        tempContainer.style.left = '0';
        tempContainer.style.zIndex = '-9999';
        tempContainer.style.width = `${contentWidth + padding * 2}px`;
        tempContainer.style.height = `${contentHeight + padding * 2 + footerHeight}px`;
        tempContainer.style.backgroundColor = '#f3f4f6'; 
        tempContainer.style.display = 'flex';
        tempContainer.style.flexDirection = 'column';
        
        const artArea = document.createElement('div');
        artArea.style.flex = '1';
        artArea.style.position = 'relative';
        artArea.style.backgroundImage = 'radial-gradient(#ddd 1px, transparent 1px)';
        artArea.style.backgroundSize = '20px 20px';
        artArea.style.overflow = 'hidden';

        // --- ADD SVG LINES TO SHARE ---
        // We must manually reconstruct the SVG structure for the screenshot
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.style.position = "absolute";
        svg.style.top = "0";
        svg.style.left = "0";
        svg.style.width = "100%";
        svg.style.height = "100%";
        svg.style.pointerEvents = "none";

        images.forEach(img => {
             if (img.parentId) {
                const parent = images.find(p => p.id === img.parentId);
                if (parent) {
                    // Use same logic as Canvas.tsx but adjusted for the share container coordinates
                    const startX = (parent.x - minX + padding) + 140; 
                    const startY = (parent.y - minY + padding) + 150;
                    const endX = (img.x - minX + padding) + 140;
                    const endY = (img.y - minY + padding) + 150;
                    
                    const midY = (startY + endY) / 2;

                    const path = document.createElementNS(svgNS, "path");
                    const d = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
                    path.setAttribute("d", d);
                    path.setAttribute("stroke", "#57534e");
                    path.setAttribute("stroke-width", "1");
                    path.setAttribute("stroke-dasharray", "5,5");
                    path.setAttribute("fill", "none");
                    path.setAttribute("opacity", "0.6");
                    
                    svg.appendChild(path);
                }
             }
        });
        artArea.appendChild(svg);
        // -------------------------------

        images.forEach(img => {
            const el = document.createElement('div');
            el.style.position = 'absolute';
            el.style.left = `${img.x - minX + padding}px`;
            el.style.top = `${img.y - minY + padding}px`;
            el.style.width = '280px';
            el.style.transform = `rotate(${img.rotation}deg) scale(${img.scale})`;
            el.style.transformOrigin = 'center center';
            el.style.backgroundColor = 'white';
            el.style.padding = '12px';
            el.style.boxShadow = '0 15px 30px rgba(0,0,0,0.2)';
            
            const imgEl = document.createElement('img');
            imgEl.src = img.url;
            imgEl.style.width = '100%';
            imgEl.style.display = 'block';
            
            const txt = document.createElement('div');
            txt.innerText = img.prompt;
            txt.style.fontFamily = 'serif';
            txt.style.fontStyle = 'italic';
            txt.style.fontSize = '12px';
            txt.style.marginTop = '12px';
            txt.style.color = '#444';
            txt.style.textAlign = 'center';
            txt.style.lineHeight = '1.2';
            
            el.appendChild(imgEl);
            el.appendChild(txt);
            artArea.appendChild(el);
        });

        const footer = document.createElement('div');
        footer.style.height = `${footerHeight}px`;
        footer.style.backgroundColor = 'white';
        footer.style.display = 'flex';
        footer.style.alignItems = 'center';
        footer.style.justifyContent = 'space-between';
        footer.style.padding = '0 50px';
        footer.style.borderTop = '1px solid #e5e5e5';

        const logoDiv = document.createElement('div');
        logoDiv.innerHTML = `<span style="font-size: 24px;">🐟</span> <span style="font-family: 'Space Grotesk', sans-serif; font-weight: bold; font-size: 24px; color: #1c1c1c;">生鱼の画图坊</span> <span style="color: #999; font-size: 14px; margin-left: 10px;">MORISOT ENGINE</span>`;
        
        const metaDiv = document.createElement('div');
        const date = new Date().toLocaleDateString();
        metaDiv.innerHTML = `
            <div style="text-align: right;">
                <div style="font-size: 16px; font-weight: bold; color: #f59e0b;">AI CURATED EXHIBITION</div>
                <div style="font-size: 12px; color: #666; font-family: monospace;">${date} | ${images.length} WORKS</div>
            </div>
        `;

        footer.appendChild(logoDiv);
        footer.appendChild(metaDiv);
        tempContainer.appendChild(artArea);
        tempContainer.appendChild(footer);
        document.body.appendChild(tempContainer);

        const canvas = await html2canvas(tempContainer, {
            scale: 2, 
            useCORS: true,
            allowTaint: true,
            backgroundColor: null
        });

        document.body.removeChild(tempContainer);

        const link = document.createElement('a');
        link.download = `morisot-exhibition-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

    } catch (e) {
        console.error("Full canvas share failed", e);
        alert("生成分享图失败，请重试");
    }
  };

  const getSelectedPrompt = () => {
    if (!selectedId) return undefined;
    return images.find(i => i.id === selectedId)?.prompt;
  };

  const handleDownloadZoomed = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!zoomedImage) return;
    const link = document.createElement('a');
    link.href = zoomedImage.url;
    link.download = `morisot-${zoomedImage.id}.png`;
    link.click();
  }

  return (
    <div className="h-screen w-screen bg-[#1c1c1c] text-stone-300 overflow-hidden relative selection:bg-amber-500 selection:text-black flex flex-col cursor-none">
      <CustomCursor />
      <Header />
      
      <div className="flex-1 relative z-10 overflow-hidden">
        <Canvas 
          images={images} 
          selectedImageId={selectedId}
          onSelectImage={handleSelect}
          onDeleteImage={handleDelete}
          onUpdateImage={handleUpdateImage}
          onShare={handleShare}
          onZoomImage={setZoomedImage}
          onNewCanvas={handleNewCanvas}
          onHistory={() => setShowHistory(true)}
        />
      </div>

      <ControlPanel 
        onGenerate={handleGenerate} 
        status={status}
        selectedImagePrompt={getSelectedPrompt()}
      />

      {/* Full Screen Lightbox */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 md:p-8 cursor-default"
          onClick={() => setZoomedImage(null)}
          onWheel={(e) => e.stopPropagation()} 
        >
          <div className="relative max-w-full max-h-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
             <button 
               className="fixed top-6 right-6 z-[10001] bg-black/50 text-white/70 hover:text-amber-500 hover:bg-black/80 rounded-full p-2 transition-all duration-300 hover:rotate-90 backdrop-blur-sm"
               onClick={() => setZoomedImage(null)}
               title="关闭"
             >
               <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>

             <div className="relative group shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
                 <img 
                   src={zoomedImage.url} 
                   alt={zoomedImage.prompt} 
                   className="max-w-[95vw] max-h-[75vh] object-contain rounded-sm border-[6px] border-white bg-white"
                 />
                 <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button 
                       onClick={handleDownloadZoomed}
                       className="bg-white text-black px-5 py-2 rounded-full font-bold shadow-lg hover:bg-amber-400 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      保存图片
                    </button>
                 </div>
             </div>

             <div className="mt-8 text-stone-300 font-serif-sc text-lg md:text-xl max-w-3xl text-center leading-relaxed px-4">
               “{zoomedImage.prompt}”
             </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
          <div className="fixed inset-0 z-[9000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-default" onClick={() => setShowHistory(false)}>
              <div className="bg-[#222] border border-stone-700 w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-lg shadow-2xl" onClick={e => e.stopPropagation()}>
                  <div className="p-4 border-b border-stone-700 flex justify-between items-center sticky top-0 bg-[#222] z-10">
                      <h3 className="text-xl font-bold text-stone-200">历史画板</h3>
                      <button onClick={() => setShowHistory(false)} className="text-stone-500 hover:text-white">✕</button>
                  </div>
                  <div className="p-2 grid gap-2">
                      {historyList.length === 0 ? (
                          <div className="p-8 text-center text-stone-500">暂无历史记录</div>
                      ) : (
                          historyList.map(item => (
                              <div 
                                key={item.id} 
                                onClick={() => handleLoadCanvas(item.id)}
                                className={`p-4 rounded border border-stone-800 hover:border-amber-500 hover:bg-stone-800 cursor-pointer transition-all flex justify-between items-center ${item.id === canvasId ? 'bg-stone-800 border-teal-900' : ''}`}
                              >
                                  <div>
                                      <div className="text-sm font-bold text-stone-300 mb-1 line-clamp-1">{item.name}</div>
                                      <div className="text-xs text-stone-500 font-mono">{new Date(item.timestamp).toLocaleString()}</div>
                                  </div>
                                  {item.id === canvasId && <div className="text-xs text-teal-500 font-mono uppercase px-2 py-1 bg-teal-900/30 rounded">当前</div>}
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}