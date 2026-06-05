// =============================================
// EventBus — Lightweight Pub/Sub Event System
// =============================================

type EventCallback = (...args: unknown[]) => void;

class EventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: string, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach((cb) => cb(...args));
  }

  clear(): void {
    this.listeners.clear();
  }
}

// Singleton
export const eventBus = new EventBus();

// Event Type Constants
export const GameEvents = {
  // Gameplay
  PLAYER_HIT: 'player:hit',
  PLAYER_DIED: 'player:died',
  ENEMY_KILLED: 'enemy:killed',
  BOSS_PHASE_CHANGE: 'boss:phaseChange',
  BOSS_DEFEATED: 'boss:defeated',
  WAVE_COMPLETE: 'wave:complete',
  WAVE_START: 'wave:start',
  LEVEL_COMPLETE: 'level:complete',
  
  // Pickups
  PICKUP_COLLECTED: 'pickup:collected',
  
  // UI
  SCORE_CHANGED: 'ui:scoreChanged',
  HEALTH_CHANGED: 'ui:healthChanged',
  ENERGY_CHANGED: 'ui:energyChanged',
  
  // VFX
  SCREEN_SHAKE: 'vfx:screenShake',
  EXPLOSION: 'vfx:explosion',
  
  // Audio
  PLAY_SFX: 'audio:playSfx',
  PLAY_MUSIC: 'audio:playMusic',
  
  // Scene
  SCENE_CHANGE: 'scene:change',
  GAME_PAUSED: 'game:paused',
  GAME_RESUMED: 'game:resumed',
} as const;
