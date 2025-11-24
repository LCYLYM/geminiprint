import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#1c1c1c]/90 backdrop-blur-md border-b border-stone-800 px-6 py-4 flex justify-between items-center pointer-events-auto select-none">
      <div className="flex items-center gap-3 group cursor-pointer">
        {/* Logo/Icon */}
        <div className="w-8 h-8 bg-amber-500 rounded-sm flex items-center justify-center transform rotate-3 shadow-lg group-hover:rotate-12 transition-transform duration-300 overflow-hidden relative">
           <span className="text-xl relative z-10 group-hover:scale-110 transition-transform">🐟</span>
           <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 animate-pulse"></div>
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tighter text-stone-200 leading-none relative overflow-hidden">
            <span className="inline-block group-hover:translate-x-[1px] group-hover:text-amber-500 transition-colors">生</span>
            <span className="inline-block text-amber-500 mx-[1px] animate-pulse">🐟</span>
            <span className="inline-block group-hover:-translate-x-[1px]">の</span>
            <span className="inline-block group-hover:skew-x-6 transition-transform">画</span>
            <span className="inline-block group-hover:-skew-x-6 transition-transform">图</span>
            <span className="inline-block">坊</span>
          </h1>
          <p className="text-[10px] md:text-xs text-stone-500 font-mono tracking-widest uppercase flex items-center gap-2 mt-1">
            <span className="w-2 h-2 bg-teal-500 rounded-full animate-ping"></span>
            Morisot Engine v2.0 <span className="text-teal-600">//</span> CASSETTE FUTURISM
          </p>
        </div>
      </div>

      <div className="hidden md:flex gap-4">
        <div className="px-3 py-1 border border-stone-700 rounded text-xs font-mono text-stone-500 hover:text-stone-300 transition-colors cursor-help hover:border-amber-500/50 hover:bg-amber-500/10" title="可用内存">
           MEM: 64KB
        </div>
        <div className="px-3 py-1 border border-stone-700 rounded text-xs font-mono text-teal-600/80 hover:text-teal-400 transition-colors cursor-help hover:border-teal-500/50 hover:bg-teal-500/10" title="连接状态">
           CONN: SECURE
        </div>
      </div>
    </header>
  );
};