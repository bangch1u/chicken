// =============================================
// Wave Spawner System — Enemy wave formations
// =============================================

import { ObjectPool } from '../managers/ObjectPool';
import { Enemy, EnemyClass, EnemyBehavior } from '../entities/Enemy';
import { Container } from 'pixi.js';
import { randomRange, randomInt } from '../utils/MathUtils';
import { eventBus, GameEvents } from '../core/EventBus';

interface WaveDefinition {
  enemies: Array<{
    enemyClass: EnemyClass;
    behavior: EnemyBehavior;
    count: number;
    delay: number; // ms delay between spawns
    formation: 'random' | 'line' | 'v-shape' | 'grid';
  }>;
}

// Pre-defined waves with increasing difficulty
const WAVE_DEFINITIONS: WaveDefinition[] = [
  // Wave 1: Simple drones
  {
    enemies: [
      { enemyClass: 'drone', behavior: 'straight', count: 8, delay: 400, formation: 'line' },
    ],
  },
  // Wave 2: Zigzag scouts
  {
    enemies: [
      { enemyClass: 'scout', behavior: 'zigzag', count: 6, delay: 500, formation: 'random' },
      { enemyClass: 'drone', behavior: 'straight', count: 5, delay: 300, formation: 'line' },
    ],
  },
  // Wave 3: Mixed formation
  {
    enemies: [
      { enemyClass: 'fighter', behavior: 'zigzag', count: 4, delay: 600, formation: 'v-shape' },
      { enemyClass: 'scout', behavior: 'circular', count: 6, delay: 400, formation: 'random' },
    ],
  },
  // Wave 4: Bombers
  {
    enemies: [
      { enemyClass: 'bomber', behavior: 'straight', count: 3, delay: 800, formation: 'line' },
      { enemyClass: 'fighter', behavior: 'swarm', count: 5, delay: 500, formation: 'random' },
    ],
  },
  // Wave 5: Elite wave
  {
    enemies: [
      { enemyClass: 'elite', behavior: 'zigzag', count: 2, delay: 1000, formation: 'line' },
      { enemyClass: 'fighter', behavior: 'charge', count: 6, delay: 400, formation: 'random' },
      { enemyClass: 'drone', behavior: 'swarm', count: 10, delay: 200, formation: 'random' },
    ],
  },
];

export class WaveSpawner {
  private currentWave = 0;
  private spawnQueue: Array<{ time: number; enemyClass: EnemyClass; behavior: EnemyBehavior; x: number; y: number }> = [];
  private timer = 0;
  private waveActive = false;
  private waveDelay = 2000; // ms before first wave
  private waveDelayTimer = 0;
  private screenW: number;

  constructor(screenW: number) {
    this.screenW = screenW;
    this.waveDelayTimer = this.waveDelay;
  }

  startNextWave(): void {
    const waveIndex = this.currentWave % WAVE_DEFINITIONS.length;
    const wave = WAVE_DEFINITIONS[waveIndex];
    const difficulty = 1 + Math.floor(this.currentWave / WAVE_DEFINITIONS.length) * 0.3;

    this.spawnQueue = [];
    let totalDelay = 0;

    for (const group of wave.enemies) {
      for (let i = 0; i < Math.ceil(group.count * difficulty); i++) {
        let x: number;
        const y = -40;

        switch (group.formation) {
          case 'line':
            x = ((i + 1) / (group.count + 1)) * this.screenW;
            break;
          case 'v-shape': {
            const center = this.screenW / 2;
            const offset = (i - group.count / 2) * 60;
            x = center + offset;
            break;
          }
          case 'grid':
            x = ((i % 5) + 1) * (this.screenW / 6);
            break;
          default:
            x = randomRange(60, this.screenW - 60);
        }

        this.spawnQueue.push({
          time: totalDelay,
          enemyClass: group.enemyClass,
          behavior: group.behavior,
          x,
          y,
        });

        totalDelay += group.delay;
      }
    }

    this.timer = 0;
    this.waveActive = true;
    this.currentWave++;

    eventBus.emit(GameEvents.WAVE_START, this.currentWave);
  }

  update(
    delta: number,
    enemyPool: ObjectPool<Enemy>,
    enemyContainer: Container,
    activeEnemyCount: number
  ): void {
    // Wait before starting first wave
    if (!this.waveActive) {
      this.waveDelayTimer -= delta * 16.67;
      if (this.waveDelayTimer <= 0) {
        this.startNextWave();
      }
      return;
    }

    this.timer += delta * 16.67;

    // Spawn enemies from queue
    while (this.spawnQueue.length > 0 && this.spawnQueue[0].time <= this.timer) {
      const spawn = this.spawnQueue.shift()!;
      const enemy = enemyPool.get();
      if (enemy) {
        enemy.init(spawn.x, spawn.y, spawn.enemyClass, spawn.behavior);
        enemy.addToContainer(enemyContainer);
      }
    }

    // Wave complete check
    if (this.spawnQueue.length === 0 && activeEnemyCount === 0) {
      this.waveActive = false;
      this.waveDelayTimer = 2500; // delay before next wave
      eventBus.emit(GameEvents.WAVE_COMPLETE, this.currentWave);
    }
  }

  getCurrentWave(): number {
    return this.currentWave;
  }

  resize(w: number): void {
    this.screenW = w;
  }
}
