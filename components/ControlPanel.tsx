import React, { useState, useRef } from 'react';
import { GenerationStatus } from '../types';

interface ControlPanelProps {
  onGenerate: (prompt: string, file?: File) => void;
  status: GenerationStatus;
  selectedImagePrompt?: string;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ onGenerate, status, selectedImagePrompt }) => {
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() && !file) return;
    onGenerate(prompt, file || undefined);
    setPrompt('');
    setFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const isGenerating = status === GenerationStatus.GENERATING;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-50 flex justify-center pointer-events-none">
      <div className="pointer-events-auto w-full max-w-3xl bg-[#222] border-t-4 border-amber-500 rounded-t-xl shadow-[0_-10px_40px_rgba(0,0,0,0.8)] relative overflow-hidden transition-transform duration-300 ease-out translate-y-0">
        
        {/* Decorative Grid on panel */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        </div>

        {/* Status Light Bar */}
        <div className="h-1 w-full bg-stone-800 flex">
            <div className={`h-full transition-all duration-300 ${isGenerating ? 'w-full bg-amber-500 animate-pulse' : 'w-0 bg-teal-500'}`}></div>
        </div>

        <div className="p-4 md:p-6 flex flex-col gap-4 relative z-10">
          
          {/* Top Row: Context & Indicators */}
          <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-stone-500">
             <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isGenerating ? 'bg-amber-500 animate-ping' : 'bg-teal-700'}`}></div>
                <span>{isGenerating ? '正在生成...' : '系统就绪'}</span>
             </div>
             <div>
                {selectedImagePrompt ? <span className="text-amber-500">模式: 二次编辑 / 扩展</span> : <span>模式: 自由创作</span>}
             </div>
          </div>

          <form onSubmit={handleSubmit} className="flex gap-4 items-end">
            
            {/* File Upload Trigger */}
            <div className="relative group shrink-0">
               <input 
                 type="file" 
                 accept="image/*" 
                 className="hidden" 
                 ref={fileInputRef}
                 onChange={handleFileChange}
               />
               <button 
                 type="button"
                 onClick={() => fileInputRef.current?.click()}
                 className={`w-12 h-12 md:w-16 md:h-16 border-2 flex items-center justify-center rounded transition-all duration-200 
                  ${file ? 'border-teal-500 bg-teal-900/30 text-teal-400' : 'border-stone-600 bg-stone-800 text-stone-500 hover:border-stone-400 hover:text-stone-300'}
                 `}
                 title="上传参考图"
               >
                 {file ? (
                   <div className="relative w-full h-full p-1">
                      <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover rounded-sm opacity-80 hover:opacity-100 transition-all" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-teal-500 rounded-full border border-black"></div>
                   </div>
                 ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                 )}
               </button>
               {/* Label */}
               <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-mono text-stone-500 uppercase whitespace-nowrap">参考图</div>
            </div>

            {/* Text Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={selectedImagePrompt ? `基于选中图修改: 例如 "变成黄昏", "加一只猫"` : `描述画面: 例如 "赛博朋克风格的东京雨夜"`}
                className="w-full bg-stone-900 border-2 border-stone-600 text-stone-200 px-4 py-3 md:py-4 rounded focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 font-mono text-sm md:text-base placeholder-stone-600 transition-colors shadow-inner"
                disabled={isGenerating}
              />
              <div className="absolute right-2 top-2 text-[10px] text-stone-600 bg-stone-800 px-1 border border-stone-700 rounded pointer-events-none hidden md:block">
                INPUT
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isGenerating || (!prompt && !file)}
              className={`h-12 md:h-16 px-6 md:px-8 font-bold uppercase tracking-wider text-sm transition-all duration-200 border-b-4 active:border-b-0 active:translate-y-1 rounded shrink-0 flex items-center gap-2
                ${isGenerating 
                  ? 'bg-stone-700 text-stone-500 border-stone-900 cursor-not-allowed' 
                  : 'bg-amber-600 text-stone-900 border-amber-800 hover:bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]'}
              `}
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin">⟳</span> 处理中
                </>
              ) : (
                <>
                  <span>生成</span> <span className="text-xl">→</span>
                </>
              )}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};