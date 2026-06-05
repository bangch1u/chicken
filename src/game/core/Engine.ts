// =============================================
// GameEngine — Core PixiJS Application Singleton
// =============================================

import { Application, Container } from 'pixi.js';
import { InputManager } from '../managers/InputManager';
import { LevelScene } from '../scenes/LevelScene';
import { useGameStore } from '@/store/useGameStore';

export class GameEngine {
  private static instance: GameEngine | null = null;
  public app: Application;
  private _initialized = false;

  // Current Scene
  private currentScene: LevelScene | null = null;

  private constructor() {
    this.app = new Application();
  }

  public get isReady(): boolean {
    return this._initialized;
  }

  public static getInstance(): GameEngine {
    if (!GameEngine.instance) {
      GameEngine.instance = new GameEngine();
    }
    return GameEngine.instance;
  }

  public async init(canvas: HTMLCanvasElement) {
    if (this._initialized) return;

    await this.app.init({
      canvas,
      resizeTo: window,
      backgroundColor: 0x030712,
      antialias: false,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    this._initialized = true;

    // Initialize Input
    const input = InputManager.getInstance();
    input.init();

    // Start Gameplay Scene
    this.startLevel();

    // Main ticker
    this.app.ticker.add((time) => this.update(time.deltaTime));

    // Resize handler
    window.addEventListener('resize', this.onResize);

    useGameStore.getState().setInitialized(true);
  }

  private startLevel(): void {
    const w = this.app.screen.width;
    const h = this.app.screen.height;

    this.currentScene = new LevelScene(w, h);
    this.app.stage.addChild(this.currentScene.container);
  }

  private update(delta: number): void {
    // Update active scene
    this.currentScene?.update(delta);

    // Throttled FPS update (~4 times per second)
    const t = this.app.ticker.lastTime;
    const prev = t - this.app.ticker.deltaMS;
    if (Math.floor(t / 250) !== Math.floor(prev / 250)) {
      useGameStore.getState().updateFPS(Math.round(this.app.ticker.FPS));
    }
  }

  private onResize = (): void => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.currentScene?.resize(w, h);
  };

  public destroy(): void {
    if (!this._initialized) return;
    try {
      window.removeEventListener('resize', this.onResize);
      InputManager.getInstance().destroy();
      this.currentScene?.destroy();
      this.app.ticker.stop();
      this.app.stage.removeChildren();
    } catch {
      // Safe to ignore during HMR
    }
    this._initialized = false;
    GameEngine.instance = null;
  }
}
