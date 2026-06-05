// =============================================
// Wave Manager — Procedural wave generation with formations
// =============================================

import { Container } from 'pixi.js';
import { FormationType, MovementPattern, type EnemyClass, ENEMY_CONFIGS } from '../core/Constants';
import { generateFormation, getPathFunction, type PathFn, type FormationOffset } from './FormationManager';
import { ObjectPool } from '../managers/ObjectPool';
import { Enemy } from '../entities/Enemy';
import { eventBus, GameEvents } from '../core/EventBus';
import { useGameStore } from '@/store/useGameStore';
import { randomRange, randomInt } from '../utils/MathUtils';

// ---- Active Formation Group ----
interface FormationGroup {
  id: number;
  enemies: Enemy[];
  offsets: FormationOffset[];
  pathFn: PathFn;
  startX: number;
  startY: number;
  speed: number;
  time: number;
  alive: boolean;
}

// ---- Wave Definition (generated) ----
interface WaveConfig {
  formations: Array<{
    formationType: FormationType;
    movementPattern: MovementPattern;
    enemyClass: EnemyClass;
    count: number;
    eliteChance: number;
    entryX: number;
    entryY: number;
    speed: number;
    delay: number; // ms delay before spawning this formation
  }>;
}

// Available formation types for each difficulty tier
const EARLY_FORMATIONS = [FormationType.HORIZONTAL, FormationType.V_FORMATION, FormationType.VERTICAL];
const MID_FORMATIONS = [FormationType.TRIANGLE, FormationType.DIAMOND, FormationType.CIRCULAR, FormationType.SNAKE];
const LATE_FORMATIONS = [FormationType.SPIRAL, FormationType.SWARM, FormationType.BOSS_ESCORT];

const EARLY_MOVEMENTS = [MovementPattern.STRAIGHT, MovementPattern.ZIGZAG, MovementPattern.SIN_WAVE];
const MID_MOVEMENTS = [MovementPattern.DOUBLE_SIN, MovementPattern.CIRCULAR_ORBIT, MovementPattern.FIGURE_EIGHT];
const LATE_MOVEMENTS = [MovementPattern.SPIRAL_DESCENT, MovementPattern.DIVE_ATTACK, MovementPattern.ORBIT_THEN_DIVE, MovementPattern.SWARM_AI];

const EARLY_ENEMIES: EnemyClass[] = ['drone', 'scout'];
const MID_ENEMIES: EnemyClass[] = ['drone', 'scout', 'fighter', 'bomber'];
const LATE_ENEMIES: EnemyClass[] = ['fighter', 'bomber', 'elite', 'champion'];

export class WaveManager {
  private currentWave = 0;
  private activeFormations: FormationGroup[] = [];
  private formationIdCounter = 0;
  private screenW: number;
  private screenH: number;

  // Wave scheduling
  private waveQueue: WaveConfig['formations'] = [];
  private queueTimer = 0;
  private interWaveTimer = 2500; // ms before first wave
  private waveActive = false;

  // Difficulty scaling
  private baseDropChance = 0.15; // 15% base

  constructor(screenW: number, screenH: number) {
    this.screenW = screenW;
    this.screenH = screenH;
  }

  // ---- Generate a wave procedurally ----
  private generateWave(waveNumber: number): WaveConfig {
    const difficulty = Math.min(waveNumber / 30, 1); // 0.0 → 1.0 over 30 waves
    const formationCount = 1 + Math.floor(difficulty * 3) + (waveNumber % 5 === 0 ? 1 : 0);

    const formations: WaveConfig['formations'] = [];

    for (let i = 0; i < formationCount; i++) {
      // Pick formation type based on difficulty
      let formationPool: FormationType[];
      if (difficulty < 0.3) formationPool = EARLY_FORMATIONS;
      else if (difficulty < 0.7) formationPool = [...EARLY_FORMATIONS, ...MID_FORMATIONS];
      else formationPool = [...MID_FORMATIONS, ...LATE_FORMATIONS];

      // Pick movement pattern
      let movementPool: MovementPattern[];
      if (difficulty < 0.3) movementPool = EARLY_MOVEMENTS;
      else if (difficulty < 0.7) movementPool = [...EARLY_MOVEMENTS, ...MID_MOVEMENTS];
      else movementPool = [...MID_MOVEMENTS, ...LATE_MOVEMENTS];

      // Pick enemy class
      let enemyPool: EnemyClass[];
      if (difficulty < 0.3) enemyPool = EARLY_ENEMIES;
      else if (difficulty < 0.7) enemyPool = MID_ENEMIES;
      else enemyPool = LATE_ENEMIES;

      const formationType = formationPool[Math.floor(Math.random() * formationPool.length)];
      const movementPattern = movementPool[Math.floor(Math.random() * movementPool.length)];
      const enemyClass = enemyPool[Math.floor(Math.random() * enemyPool.length)];

      // Enemy count scales with difficulty
      const baseCount = formationType === FormationType.BOSS_ESCORT ? 7 : 5;
      const count = baseCount + Math.floor(difficulty * 15) + randomInt(0, 4);

      // Elite chance
      const eliteChance = Math.min(0.4, difficulty * 0.3 + (waveNumber % 5 === 0 ? 0.1 : 0));

      // Entry position — alternate sides
      const entryX = this.screenW * (0.2 + Math.random() * 0.6);
      const entryY = -60;

      formations.push({
        formationType,
        movementPattern,
        enemyClass,
        count: Math.min(count, 30),
        eliteChance,
        entryX,
        entryY,
        speed: 0.8 + difficulty * 0.6,
        delay: i * 2000 + randomInt(0, 1000), // stagger formations
      });
    }

    return { formations };
  }

  // ---- Spawn a single formation ----
  private spawnFormation(
    config: WaveConfig['formations'][0],
    enemyPool: ObjectPool<Enemy>,
    enemyContainer: Container,
  ): void {
    const offsets = generateFormation(config.formationType, config.count);
    const pathFn = getPathFunction(config.movementPattern);
    const enemies: Enemy[] = [];

    const groupId = this.formationIdCounter++;

    for (let i = 0; i < offsets.length; i++) {
      const enemy = enemyPool.get();
      if (!enemy) break;

      const isElite = Math.random() < config.eliteChance;
      // Boss escort: center enemy is always champion
      const eClass = (config.formationType === FormationType.BOSS_ESCORT && i === 0)
        ? 'champion'
        : config.enemyClass;

      enemy.init(config.entryX + offsets[i].dx, config.entryY + offsets[i].dy, eClass, isElite);
      enemy.formationId = groupId;
      enemy.formationIndex = i;
      enemy.addToContainer(enemyContainer);
      enemies.push(enemy);
    }

    this.activeFormations.push({
      id: groupId,
      enemies,
      offsets,
      pathFn,
      startX: config.entryX,
      startY: config.entryY,
      speed: config.speed,
      time: 0,
      alive: true,
    });
  }

  // ---- Main update ----
  update(
    delta: number,
    enemyPool: ObjectPool<Enemy>,
    enemyContainer: Container,
  ): void {
    // ---- Inter-wave delay / queue processing ----
    if (!this.waveActive) {
      this.interWaveTimer -= delta * 16.67;
      if (this.interWaveTimer <= 0) {
        this.currentWave++;
        useGameStore.getState().setWave(this.currentWave);
        useGameStore.getState().showNotification(`WAVE ${this.currentWave}`, '#00D9FF');

        const wave = this.generateWave(this.currentWave);
        this.waveQueue = [...wave.formations];
        this.queueTimer = 0;
        this.waveActive = true;
      }
      return;
    }

    // ---- Process spawn queue ----
    if (this.waveQueue.length > 0) {
      this.queueTimer += delta * 16.67;
      while (this.waveQueue.length > 0 && this.waveQueue[0].delay <= this.queueTimer) {
        const config = this.waveQueue.shift()!;
        this.spawnFormation(config, enemyPool, enemyContainer);
      }
    }

    // ---- Update active formations ----
    for (const group of this.activeFormations) {
      if (!group.alive) continue;

      group.time += delta * 0.016667; // convert to seconds-like

      // Calculate formation center
      const center = group.pathFn(group.time, group.startX, group.startY, this.screenW, this.screenH, group.speed);

      // Position each alive enemy
      let aliveCount = 0;
      for (let i = 0; i < group.enemies.length; i++) {
        const enemy = group.enemies[i];
        if (!enemy.active) continue;
        aliveCount++;

        const offset = group.offsets[i];
        enemy.setPosition(center.centerX + offset.dx, center.centerY + offset.dy);
      }

      // Group is done if all enemies dead or off screen
      if (aliveCount === 0 || center.centerY > this.screenH + 200) {
        group.alive = false;
        // Release any remaining enemies that went off screen
        for (const enemy of group.enemies) {
          if (enemy.active) enemyPool.release(enemy);
        }
      }
    }

    // Cleanup dead formations
    this.activeFormations = this.activeFormations.filter(f => f.alive);

    // Check if wave is complete
    if (this.waveQueue.length === 0 && this.activeFormations.length === 0) {
      this.waveActive = false;
      this.interWaveTimer = 2500 + Math.random() * 1000;
      eventBus.emit(GameEvents.WAVE_COMPLETE, this.currentWave);
    }
  }

  getCurrentWave(): number {
    return this.currentWave;
  }

  getDropChance(): number {
    // Drop chance increases slightly with waves
    return this.baseDropChance + Math.min(0.15, this.currentWave * 0.005);
  }

  resize(w: number, h: number): void {
    this.screenW = w;
    this.screenH = h;
  }
}
