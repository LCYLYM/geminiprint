import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#1c1c1c]/90 backdrop-blur-md border-b border-stone-800 px-6 py-4 flex justify-between items-center pointer-events-auto select-none">
      <style>
        {`
          @keyframes glitch {
            0% { transform: translate(0); }
            20% { transform: translate(-2px, 2px); }
            40% { transform: translate(-2px, -2px); }
            60% { transform: translate(2px, 2px); }
            80% { transform: translate(2px, -2px); }
            100% { transform: translate(0); }
          }
          .glitch-hover:hover {
            animation: glitch 0.2s cubic-bezier(.25, .46, .45, .94) both infinite;
            color: #f59e0b;
          }
          .scanline {
            background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.2));
            background-size: 100% 4px;
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            pointer-events: none;
            z-index: 50;
            opacity: 0.1;
          }
        `}
      </style>
      <div className="scanline"></div>

      <div className="flex items-center gap-3 group cursor-pointer relative z-50">
        {/* Logo/Icon */}
        <div className="w-8 h-8 bg-amber-500 rounded-sm flex items-center justify-center transform rotate-3 shadow-lg group-hover:rotate-12 transition-transform duration-300 overflow-hidden relative border border-amber-400">
           <span className="text-xl relative z-10 group-hover:scale-110 transition-transform">🐟</span>
           <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 animate-pulse"></div>
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tighter text-stone-200 leading-none relative overflow-hidden flex items-center">
            <span className="inline-block glitch-hover transition-colors">生</span>
            <span className="inline-block text-amber-500 mx-[1px] animate-pulse">🐟</span>
            <span className="inline-block glitch-hover">の</span>
            <span className="inline-block group-hover:skew-x-12 transition-transform text-stone-100">画</span>
            <span className="inline-block group-hover:-skew-x-12 transition-transform text-stone-100">图</span>
            <span className="inline-block glitch-hover">坊</span>
          </h1>
          <p className="text-[10px] md:text-xs text-stone-500 font-mono tracking-widest uppercase flex items-center gap-2 mt-1 group-hover:text-teal-500 transition-colors">
            <span className="w-2 h-2 bg-teal-500 rounded-full animate-ping"></span>
            Morisot Engine v2.0 <span className="text-stone-700">//</span> CASSETTE FUTURISM
          </p>
        </div>
      </div>

      <div className="hidden md:flex gap-4 relative z-50">
        <div className="px-3 py-1 border border-stone-700 rounded text-xs font-mono text-stone-500 hover:text-stone-300 transition-colors cursor-help hover:border-amber-500/50 hover:bg-amber-500/10 bg-black/20" title="可用内存">
           MEM: 64KB
        </div>
        <div className="px-3 py-1 border border-stone-700 rounded text-xs font-mono text-teal-600/80 hover:text-teal-400 transition-colors cursor-help hover:border-teal-500/50 hover:bg-teal-500/10 bg-black/20" title="连接状态">
           CONN: SECURE
        </div>
      </div>
    </header>
  );
};