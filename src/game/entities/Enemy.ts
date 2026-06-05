// =============================================
// Enemy — Poolable with elite system, shooting, formation support
// =============================================

import { Graphics, Container } from 'pixi.js';
import type { Poolable } from '../managers/ObjectPool';
import type { Collidable } from '../managers/Collision';
import { ENEMY_CONFIGS, COLORS, type EnemyClass } from '../core/Constants';
import { ObjectPool } from '../managers/ObjectPool';
import { Projectile } from './Projectile';
import { randomRange } from '../utils/MathUtils';

export class Enemy implements Poolable, Collidable {
  public active = false;
  public x = 0;
  public y = 0;
  public radius = 12;
  public collisionGroup = 'enemy';

  public hp = 10;
  public maxHp = 10;
  public speed = 2;
  public damage = 10;
  public score = 10;
  public enemyClass: EnemyClass = 'drone';
  public isElite = false;

  // Shooting
  private canShoot = false;
  private fireRate = 0;
  private fireTimer = 0;
  private bulletSpeed = 0;

  // Formation tracking
  public formationId = -1;
  public formationIndex = -1;

  // Visuals
  public sprite: Graphics;
  private shieldGraphics: Graphics;
  private eliteGlow: Graphics;

  constructor() {
    this.sprite = new Graphics();
    this.shieldGraphics = new Graphics();
    this.eliteGlow = new Graphics();
    this.sprite.addChild(this.eliteGlow);
    this.sprite.addChild(this.shieldGraphics);
    this.sprite.visible = false;
  }

  init(
    x: number,
    y: number,
    enemyClass: EnemyClass = 'drone',
    elite: boolean = false,
  ): void {
    const config = ENEMY_CONFIGS[enemyClass];
    this.enemyClass = enemyClass;
    this.isElite = elite;

    this.x = x;
    this.y = y;

    const eliteMult = elite ? 2.5 : 1;
    this.hp = Math.round(config.hp * eliteMult);
    this.maxHp = this.hp;
    this.speed = config.speed;
    this.damage = config.damage;
    this.score = Math.round(config.score * (elite ? 3 : 1));
    this.radius = config.size * (elite ? 1.4 : 1);

    this.canShoot = config.canShoot;
    this.fireRate = config.fireRate;
    this.fireTimer = randomRange(500, config.fireRate + 1000); // stagger first shot
    this.bulletSpeed = config.bulletSpeed;

    this.formationId = -1;
    this.formationIndex = -1;

    this.drawSprite(config.color, config.size * (elite ? 1.4 : 1), elite);
    this.drawShield(elite);

    this.sprite.x = x;
    this.sprite.y = y;
    this.sprite.visible = true;
    this.sprite.alpha = 1;
  }

  private drawSprite(color: number, size: number, elite: boolean): void {
    const g = this.sprite;
    // Clear only the main graphic, not children
    g.clear();

    const s = size;

    // Body — inverted ship shape pointing down
    g.moveTo(0, s);
    g.lineTo(-s, -s * 0.5);
    g.lineTo(-s * 0.3, -s * 0.2);
    g.lineTo(0, -s * 0.6);
    g.lineTo(s * 0.3, -s * 0.2);
    g.lineTo(s, -s * 0.5);
    g.closePath();
    g.fill({ color, alpha: 0.9 });
    g.stroke({ color: 0xFFFFFF, width: 1, alpha: 0.3 });

    // Core
    g.circle(0, 0, s * 0.2);
    g.fill({ color: elite ? COLORS.ACCENT : COLORS.DANGER, alpha: 0.7 });

    // Elite glow ring
    this.eliteGlow.clear();
    if (elite) {
      this.eliteGlow.circle(0, 0, s * 1.2);
      this.eliteGlow.stroke({ color: COLORS.ACCENT, width: 2, alpha: 0.4 });
      this.eliteGlow.circle(0, 0, s * 1.4);
      this.eliteGlow.fill({ color: COLORS.ACCENT, alpha: 0.05 });
    }
  }

  private drawShield(elite: boolean): void {
    this.shieldGraphics.clear();
    if (elite) {
      this.shieldGraphics.circle(0, 0, this.radius * 1.3);
      this.shieldGraphics.stroke({ color: COLORS.ENERGY, width: 1.5, alpha: 0.25 });
    }
  }

  /**
   * Position update — called by the formation/scene to set absolute position.
   * This does NOT move the enemy on its own. The WaveManager sets positions.
   */
  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.sprite.x = x;
    this.sprite.y = y;
  }

  /**
   * Per-frame logic: shooting, animation
   */
  update(
    delta: number,
    playerX: number,
    playerY: number,
    bulletPool: ObjectPool<Projectile> | null,
    bulletContainer: Container | null,
  ): void {
    // Elite glow pulse
    if (this.isElite && this.eliteGlow) {
      this.eliteGlow.alpha = 0.5 + Math.sin(performance.now() * 0.005) * 0.3;
    }

    // Shooting
    if (this.canShoot && bulletPool && bulletContainer && this.y > 0 && this.y < window.innerHeight - 50) {
      this.fireTimer -= delta * 16.67;
      if (this.fireTimer <= 0) {
        this.fireTimer = this.fireRate;
        this.shoot(playerX, playerY, bulletPool, bulletContainer);
      }
    }

    // Face downward
    this.sprite.rotation = Math.PI;
  }

  private shoot(
    playerX: number, playerY: number,
    pool: ObjectPool<Projectile>, container: Container,
  ): void {
    const bullet = pool.get();
    if (!bullet) return;

    if (this.enemyClass === 'bomber') {
      // Bomber: 3-way spread
      for (let i = -1; i <= 1; i++) {
        const b = i === 0 ? bullet : pool.get();
        if (!b) break;
        const angle = Math.PI / 2 + i * 0.3;
        b.init(this.x, this.y + this.radius, Math.cos(angle) * this.bulletSpeed, Math.sin(angle) * this.bulletSpeed,
          this.damage * 0.5, 'enemy', COLORS.DANGER, 3);
        b.addToContainer(container);
      }
    } else {
      // Aimed shot
      const angle = Math.atan2(playerY - this.y, playerX - this.x);
      bullet.init(this.x, this.y + this.radius, Math.cos(angle) * this.bulletSpeed, Math.sin(angle) * this.bulletSpeed,
        this.damage * 0.4, 'enemy', COLORS.DANGER, 3);
      bullet.addToContainer(container);
    }
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount;

    // Hit flash
    this.sprite.tint = 0xFFFFFF;
    setTimeout(() => {
      if (this.sprite && this.active) this.sprite.tint = 0xFFFFFF;
    }, 60);

    return this.hp <= 0;
  }

  isOffScreen(screenH: number): boolean {
    return this.y > screenH + 80 || this.y < -200 || this.x < -300 || this.x > window.innerWidth + 300;
  }

  reset(): void {
    this.sprite.visible = false;
    this.sprite.alpha = 1;
    this.hp = 0;
    this.fireTimer = 0;
    this.formationId = -1;
    this.formationIndex = -1;
    this.isElite = false;
    this.eliteGlow.clear();
    this.shieldGraphics.clear();
  }

  addToContainer(container: Container): void {
    if (!this.sprite.parent) {
      container.addChild(this.sprite);
    }
  }
}
