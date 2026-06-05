'use client';

import dynamic from 'next/dynamic';
import { useGameStore } from '@/store/useGameStore';
import { useState } from 'react';

const GameCanvas = dynamic(() => import('@/components/ui/GameCanvas'), {
  ssr: false,
});

export default function Home() {
  const { fps, score, playerHealth, playerMaxHealth, energy, maxEnergy } = useGameStore();
  const [showMenu, setShowMenu] = useState(false);

  const healthPercent = playerMaxHealth > 0 ? Math.round((playerHealth / playerMaxHealth) * 100) : 0;
  const energyPercent = maxEnergy > 0 ? Math.round((energy / maxEnergy) * 100) : 0;

  return (
    <main className="relative w-screen h-screen overflow-hidden text-white font-sans selection:bg-cyan-500/30 cursor-none">
      {/* PixiJS Game Canvas */}
      <GameCanvas />

      {/* ===== HUD Layer ===== */}
      <div className="absolute inset-0 pointer-events-none z-10">
        
        {/* Top Bar */}
        <div className="flex justify-between items-start p-4">
          {/* Left: Title + Score + Wave */}
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 drop-shadow-[0_0_15px_rgba(0,217,255,0.6)]">
              PROJECT NOVA
            </h1>
            <div className="flex gap-4 items-center mt-1">
              <div className="text-xs font-mono text-slate-400">
                SCORE <span className="text-yellow-400 text-sm font-bold ml-1">{score.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Right: FPS + Menu Button */}
          <div className="flex flex-col items-end gap-2">
            <div className="text-[10px] font-mono text-green-400/70 tabular-nums">
              {fps} FPS
            </div>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="pointer-events-auto px-3 py-1.5 text-xs uppercase tracking-widest 
                         border border-purple-500/40 bg-purple-900/20 hover:bg-purple-800/40 
                         backdrop-blur-md rounded transition-all duration-200
                         shadow-[0_0_10px_rgba(139,92,246,0.2)] hover:shadow-[0_0_20px_rgba(139,92,246,0.5)]"
            >
              ☰ Menu
            </button>
          </div>
        </div>

        {/* Bottom HUD: Health + Energy Bars */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex gap-6 items-end max-w-xl mx-auto">
            
            {/* Health Bar */}
            <div className="flex-1 space-y-1">
              <div className="flex justify-between text-[10px] font-bold tracking-wider">
                <span className="text-red-400/80">⬡ HULL</span>
                <span className="text-red-400/60 tabular-nums">{playerHealth}/{playerMaxHealth}</span>
              </div>
              <div className="h-2.5 w-full bg-slate-900/80 rounded-sm border border-red-900/50 overflow-hidden backdrop-blur-sm">
                <div 
                  className="h-full rounded-sm transition-all duration-200"
                  style={{ 
                    width: `${healthPercent}%`,
                    background: healthPercent > 50 
                      ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                      : healthPercent > 25
                        ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                        : 'linear-gradient(90deg, #ef4444, #f87171)',
                    boxShadow: healthPercent <= 25 ? '0 0 8px rgba(239, 68, 68, 0.6)' : undefined,
                  }}
                />
              </div>
            </div>

            {/* Shield + Energy Bar */}
            <div className="flex-1 space-y-1">
              <div className="flex justify-between text-[10px] font-bold tracking-wider">
                <span className="text-cyan-400/80">◇ ENERGY</span>
                <span className="text-cyan-400/60 tabular-nums">{Math.round(energy)}/{maxEnergy}</span>
              </div>
              <div className="h-2.5 w-full bg-slate-900/80 rounded-sm border border-cyan-900/50 overflow-hidden backdrop-blur-sm">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-sm transition-all duration-200"
                  style={{ 
                    width: `${energyPercent}%`,
                    boxShadow: '0 0 6px rgba(0, 217, 255, 0.3)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Wave Indicator (top center) */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2">
          <div className="text-[10px] font-mono text-slate-500 tracking-[0.2em] uppercase">
            ● COMBAT ACTIVE
          </div>
        </div>
      </div>

      {/* ===== Pause Menu Overlay ===== */}
      {showMenu && (
        <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center">
          <div className="border border-purple-500/30 bg-slate-900/90 rounded-xl p-8 w-80 shadow-[0_0_40px_rgba(139,92,246,0.2)]">
            <h2 className="text-center text-xl font-bold tracking-widest text-purple-400 mb-6">
              PAUSED
            </h2>
            <div className="flex flex-col gap-3">
              {['Resume', 'Settings', 'Restart', 'Main Menu'].map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    if (item === 'Resume') setShowMenu(false);
                  }}
                  className="w-full py-2.5 px-4 text-sm uppercase tracking-wider font-medium
                             border border-slate-700 bg-slate-800/60 hover:bg-purple-900/40 
                             hover:border-purple-500/50 rounded-lg transition-all duration-200
                             hover:shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
