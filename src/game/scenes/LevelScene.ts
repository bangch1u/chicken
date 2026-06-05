// =============================================
// LevelScene — Full gameplay loop with all systems
// =============================================

import { Container } from 'pixi.js';
import { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';
import { Enemy } from '../entities/Enemy';
import { RewardCrate } from '../entities/RewardCrate';
import { ObjectPool } from '../managers/ObjectPool';
import { SpatialHashGrid } from '../managers/Collision';
import { InputManager } from '../managers/InputManager';
import { VFXSystem } from '../vfx/ParticleSystem';
import { Starfield } from '../vfx/Starfield';
import { GameFeelSystem } from '../vfx/GameFeel';
import { WaveManager } from '../systems/WaveManager';
import { RewardSystem } from '../systems/RewardSystem';
import { ComboSystem } from '../systems/ComboSystem';
import { PROJECTILE, ENEMY, COLORS, CrateType, WeaponType, WEAPON_DEFS } from '../core/Constants';
import { eventBus, GameEvents } from '../core/EventBus';
import { useGameStore } from '@/store/useGameStore';

export class LevelScene {
  public container: Container;

  // Layers (z-order)
  private bgLayer: Container;
  private crateLayer: Container;
  private bulletLayer: Container;
  private entityLayer: Container;
  private vfxLayer: Container;
  private uiLayer: Container;

  // Systems
  private starfield: Starfield;
  private vfx: VFXSystem;
  private gameFeel: GameFeelSystem;
  private collisionGrid: SpatialHashGrid;
  private waveManager: WaveManager;
  private rewardSystem: RewardSystem;
  private comboSystem: ComboSystem;

  // Entities
  private player: Player;
  private playerBulletPool: ObjectPool<Projectile>;
  private enemyBulletPool: ObjectPool<Projectile>;
  private enemyPool: ObjectPool<Enemy>;

  // State
  private screenW: number;
  private screenH: number;
  private score = 0;
  private gameOver = false;

  // Throttle UI sync
  private uiSyncTimer = 0;

  constructor(screenW: number, screenH: number) {
    this.screenW = screenW;
    this.screenH = screenH;

    // Container hierarchy
    this.container = new Container();
    this.bgLayer = new Container();
    this.crateLayer = new Container();
    this.bulletLayer = new Container();
    this.entityLayer = new Container();
    this.vfxLayer = new Container();
    this.uiLayer = new Container();

    this.container.addChild(this.bgLayer);
    this.container.addChild(this.crateLayer);
    this.container.addChild(this.bulletLayer);
    this.container.addChild(this.entityLayer);
    this.container.addChild(this.vfxLayer);
    this.container.addChild(this.uiLayer);

    // Systems
    this.starfield = new Starfield(this.bgLayer, screenW, screenH, 350);
    this.vfx = new VFXSystem(this.vfxLayer);
    this.gameFeel = new GameFeelSystem(this.uiLayer, screenW, screenH);
    this.collisionGrid = new SpatialHashGrid(64);
    this.waveManager = new WaveManager(screenW, screenH);
    this.rewardSystem = new RewardSystem(this.crateLayer);
    this.comboSystem = new ComboSystem();

    // Object Pools
    this.playerBulletPool = new ObjectPool<Projectile>(() => new Projectile(), 300, PROJECTILE.MAX_POOL_SIZE);
    this.enemyBulletPool = new ObjectPool<Projectile>(() => new Projectile(), 100, 1000);
    this.enemyPool = new ObjectPool<Enemy>(() => new Enemy(), 100, ENEMY.MAX_POOL_SIZE);

    // Player
    this.player = new Player(screenW / 2, screenH - 100);
    this.player.addToContainer(this.entityLayer);

    // Events
    eventBus.on(GameEvents.SCREEN_SHAKE, (intensity: unknown, duration: unknown) => {
      this.vfx.startScreenShake(intensity as number, duration as number, this.container);
    });
  }

  update(delta: number): void {
    if (this.gameOver) return;

    // Hit stop check
    if (this.gameFeel.shouldPause()) {
      this.gameFeel.update(delta);
      return;
    }

    const input = InputManager.getInstance();

    // ---- 1. Background ----
    this.starfield.update(delta);

    // ---- 2. Player ----
    this.player.update(delta, this.screenW, this.screenH, this.playerBulletPool, this.bulletLayer);

    // ---- 3. Wave Manager (spawns formations) ----
    this.waveManager.update(delta, this.enemyPool, this.entityLayer);

    // ---- 4. Update Enemies ----
    this.enemyPool.forEachActive((enemy) => {
      enemy.update(delta, this.player.x, this.player.y, this.enemyBulletPool, this.bulletLayer);
      if (enemy.isOffScreen(this.screenH)) {
        this.enemyPool.release(enemy);
      }
    });

    // ---- 5. Update Projectiles ----
    this.playerBulletPool.forEachActive((bullet) => {
      bullet.update(delta);
      if (bullet.isOffScreen(this.screenW, this.screenH)) {
        this.playerBulletPool.release(bullet);
      }
    });

    this.enemyBulletPool.forEachActive((bullet) => {
      bullet.update(delta);
      if (bullet.isOffScreen(this.screenW, this.screenH)) {
        this.enemyBulletPool.release(bullet);
      }
    });

    // ---- 6. Reward Crates ----
    this.rewardSystem.update(delta);

    // ---- 7. Collision Detection ----
    this.runCollisions();

    // ---- 8. VFX & Game Feel ----
    this.vfx.update(delta);
    this.gameFeel.update(delta);
    this.comboSystem.update();

    // ---- 9. End of Frame ----
    input.endFrame();

    // ---- 10. Sync to React UI (throttled) ----
    this.uiSyncTimer += delta;
    if (this.uiSyncTimer > 2) { // ~every 2 frames
      this.uiSyncTimer = 0;
      this.syncUIState();
    }
  }

  private runCollisions(): void {
    this.collisionGrid.clear();

    // Insert player
    if (this.player.active) {
      this.collisionGrid.insert(this.player);
    }

    // Insert player bullets
    this.playerBulletPool.forEachActive((bullet) => this.collisionGrid.insert(bullet));

    // Insert enemies
    this.enemyPool.forEachActive((enemy) => this.collisionGrid.insert(enemy));

    // Insert enemy bullets
    this.enemyBulletPool.forEachActive((bullet) => this.collisionGrid.insert(bullet));

    // Insert crates
    this.rewardSystem.getPool().forEachActive((crate) => this.collisionGrid.insert(crate));

    // --- Player bullets → Enemies ---
    this.playerBulletPool.forEachActive((bullet) => {
      const hits = this.collisionGrid.query(bullet, 'enemy');
      for (const hit of hits) {
        const enemy = hit as unknown as Enemy;
        const killed = enemy.takeDamage(bullet.damage);

        // Hit spark
        this.vfx.spawnHitSpark(bullet.x, bullet.y, COLORS.PRIMARY);

        if (killed) {
          this.onEnemyKilled(enemy);
        }

        this.playerBulletPool.release(bullet);
        break; // bullet consumed
      }
    });

    // --- Enemy bullets → Player ---
    if (this.player.active) {
      this.enemyBulletPool.forEachActive((bullet) => {
        const hits = this.collisionGrid.query(bullet, 'player');
        if (hits.length > 0) {
          this.player.takeDamage(bullet.damage);
          this.vfx.spawnHitSpark(bullet.x, bullet.y, COLORS.DANGER);
          this.gameFeel.flash(COLORS.DANGER, 0.15);
          this.enemyBulletPool.release(bullet);
        }
      });
    }

    // --- Enemy collision → Player ---
    if (this.player.active) {
      this.enemyPool.forEachActive((enemy) => {
        const hits = this.collisionGrid.query(enemy, 'player');
        if (hits.length > 0) {
          this.player.takeDamage(enemy.damage);
          this.onEnemyKilled(enemy);
        }
      });
    }

    // --- Player → Crates ---
    if (this.player.active) {
      this.rewardSystem.getPool().forEachActive((crate) => {
        const hits = this.collisionGrid.query(crate, 'player');
        if (hits.length > 0) {
          this.onCrateCollected(crate);
          this.rewardSystem.getPool().release(crate);
        }
      });
    }
  }

  private onEnemyKilled(enemy: Enemy): void {
    // VFX: bigger explosion for elites
    const particleCount = enemy.isElite ? 25 : 12;
    const speed = enemy.isElite ? 4 : 2.5;
    this.vfx.spawnExplosion(enemy.x, enemy.y, enemy.isElite ? COLORS.ACCENT : COLORS.ACCENT_ALT, particleCount, speed);

    // Combo
    const finalScore = this.comboSystem.registerKill(enemy.score);
    this.score += finalScore;

    // Floating score text
    this.gameFeel.showFloatingText(enemy.x, enemy.y - 10, `+${finalScore}`, COLORS.ACCENT, 14);

    // Hit stop on elite kills
    if (enemy.isElite) {
      this.gameFeel.requestHitStop(3);
      this.gameFeel.flash(COLORS.ACCENT, 0.2);
      eventBus.emit(GameEvents.SCREEN_SHAKE, 6, 300);
    }

    // Drop chance
    const dropChance = this.waveManager.getDropChance();
    const comboBonus = this.comboSystem.getDropBonus();
    this.rewardSystem.tryDrop(enemy.x, enemy.y, dropChance, comboBonus, enemy.isElite);

    // Release enemy
    this.enemyPool.release(enemy);
  }

  private onCrateCollected(crate: RewardCrate): void {
    // VFX
    this.vfx.spawnExplosion(crate.x, crate.y, COLORS.ACCENT, 10, 2);

    switch (crate.crateType) {
      case CrateType.WEAPON: {
        if (crate.weaponType) {
          const result = this.player.weaponSystem.collectWeapon(crate.weaponType);
          const ws = result.state;

          if (result.leveled) {
            this.gameFeel.showBigNotification(`${ws.name.toUpperCase()} LV${ws.level}`, ws.color);
            this.vfx.spawnExplosion(this.player.x, this.player.y, ws.color, 30, 5);
          } else if (result.switched) {
            this.gameFeel.showBigNotification(`${ws.name.toUpperCase()} ACQUIRED`, ws.color);
            this.gameFeel.flash(ws.color, 0.2);
            this.vfx.spawnExplosion(this.player.x, this.player.y, ws.color, 25, 4);
          }

          // Sync weapon state
          const store = useGameStore.getState();
          store.setWeapon(ws.type, ws.level, ws.name);
        }
        break;
      }
      case CrateType.COIN:
        this.score += 100;
        this.gameFeel.showFloatingText(crate.x, crate.y, '+100', COLORS.ACCENT, 16);
        break;
      case CrateType.ENERGY:
        this.player.restoreEnergy(25);
        this.gameFeel.showFloatingText(crate.x, crate.y, '+ENERGY', COLORS.ENERGY, 14);
        break;
      case CrateType.SHIELD:
        this.player.restoreShield(20);
        this.gameFeel.showFloatingText(crate.x, crate.y, '+SHIELD', 0x3B82F6, 14);
        break;
      case CrateType.BOMB:
        // Kill all on-screen enemies
        this.enemyPool.forEachActive((e) => {
          this.vfx.spawnExplosion(e.x, e.y, COLORS.DANGER, 10, 3);
          this.score += e.score;
          this.enemyPool.release(e);
        });
        this.gameFeel.flash(COLORS.DANGER, 0.4);
        this.gameFeel.showBigNotification('NOVA BOMB!', COLORS.DANGER);
        eventBus.emit(GameEvents.SCREEN_SHAKE, 10, 500);
        break;
    }
  }

  private syncUIState(): void {
    const store = useGameStore.getState();
    store.setScore(this.score);
    store.updateHealth(this.player.hp, this.player.maxHp);
    store.updateShield(this.player.shield, this.player.maxShield);
    store.updateEnergy(this.player.energy, this.player.maxEnergy);
    store.setEnemiesAlive(this.enemyPool.getActiveCount());
  }

  resize(w: number, h: number): void {
    this.screenW = w;
    this.screenH = h;
    this.starfield.resize(w, h);
    this.waveManager.resize(w, h);
    this.gameFeel.resize(w, h);
  }

  destroy(): void {
    this.playerBulletPool.releaseAll();
    this.enemyBulletPool.releaseAll();
    this.enemyPool.releaseAll();
    this.rewardSystem.releaseAll();
    this.container.removeChildren();
    eventBus.clear();
  }
}
