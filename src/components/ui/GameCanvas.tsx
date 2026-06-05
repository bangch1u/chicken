'use client';

import { useEffect, useRef } from 'react';
import { GameEngine } from '@/game/core/Engine';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = GameEngine.getInstance();

    // Only init if not already initialized (handles React Strict Mode double-mount)
    if (!engine.isReady) {
      engine.init(canvasRef.current).catch(console.error);
    }

    // No cleanup in dev — React Strict Mode unmounts/remounts.
    // PixiJS singleton persists across HMR cycles safely.
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-gray-950">
      <canvas
        ref={canvasRef}
        className="w-full h-full block touch-none"
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
}
