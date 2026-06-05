// =============================================
// Projectile — Pooled bullet with weapon-type visuals
// =============================================

import { Graphics, Container } from 'pixi.js';
import type { Poolable } from '../managers/ObjectPool';
import type { Collidable } from '../managers/Collision';

export class Projectile implements Poolable, Collidable {
  public active = false;
  public x = 0;
  public y = 0;
  public vx = 0;
  public vy = 0;
  public radius = 4;
  public damage = 10;
  public collisionGroup: string = 'playerBullet';
  public sprite: Graphics;

  constructor() {
    this.sprite = new Graphics();
    this.sprite.visible = false;
  }

  init(
    x: number, y: number,
    vx: number, vy: number,
    damage: number,
    owner: 'player' | 'enemy',
    color: number = 0x00D9FF,
    radius: number = 4
  ): void {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.collisionGroup = owner === 'player' ? 'playerBullet' : 'enemyBullet';
    this.radius = radius;

    // Draw bullet
    this.sprite.clear();

    if (owner === 'player') {
      // Elongated energy bolt
      const len = radius * 2.5;
      this.sprite.roundRect(-radius * 0.6, -len, radius * 1.2, len * 2, radius * 0.4);
      this.sprite.fill({ color, alpha: 0.95 });
      // Core glow
      this.sprite.circle(0, 0, radius * 0.5);
      this.sprite.fill({ color: 0xFFFFFF, alpha: 0.7 });
      // Outer glow
      this.sprite.circle(0, 0, radius * 1.8);
      this.sprite.fill({ color, alpha: 0.12 });
    } else {
      // Enemy bullet — small red dot
      this.sprite.circle(0, 0, radius);
      this.sprite.fill({ color, alpha: 0.9 });
      this.sprite.circle(0, 0, radius * 1.5);
      this.sprite.fill({ color, alpha: 0.15 });
    }

    // Rotate to face direction of travel
    this.sprite.rotation = Math.atan2(vy, vx) + Math.PI / 2;
    this.sprite.x = x;
    this.sprite.y = y;
    this.sprite.visible = true;
  }

  update(delta: number): void {
    this.x += this.vx * delta;
    this.y += this.vy * delta;
    this.sprite.x = this.x;
    this.sprite.y = this.y;
  }

  isOffScreen(w: number, h: number): boolean {
    return this.x < -50 || this.x > w + 50 || this.y < -50 || this.y > h + 50;
  }

  reset(): void {
    this.sprite.visible = false;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.damage = 0;
  }

  addToContainer(container: Container): void {
    if (!this.sprite.parent) {
      container.addChild(this.sprite);
    }
  }
}
