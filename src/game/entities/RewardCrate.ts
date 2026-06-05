// =============================================
// RewardCrate — Pooled loot drop entity
// =============================================

import { Graphics, Container, Text, TextStyle } from 'pixi.js';
import type { Poolable } from '../managers/ObjectPool';
import type { Collidable } from '../managers/Collision';
import { CrateType, WeaponType, COLORS, CRATE, WEAPON_DEFS } from '../core/Constants';
import { randomRange } from '../utils/MathUtils';

const CRATE_COLORS: Record<CrateType, number> = {
  [CrateType.WEAPON]: COLORS.PRIMARY,
  [CrateType.COIN]: COLORS.ACCENT,
  [CrateType.ENERGY]: COLORS.ENERGY,
  [CrateType.SHIELD]: 0x3B82F6,
  [CrateType.BOMB]: COLORS.DANGER,
};

const CRATE_LABELS: Record<CrateType, string> = {
  [CrateType.WEAPON]: 'W',
  [CrateType.COIN]: '$',
  [CrateType.ENERGY]: 'E',
  [CrateType.SHIELD]: 'S',
  [CrateType.BOMB]: '!',
};

export class RewardCrate implements Poolable, Collidable {
  public active = false;
  public x = 0;
  public y = 0;
  public radius = CRATE.COLLECT_RADIUS;
  public collisionGroup = 'pickup';

  public crateType: CrateType = CrateType.COIN;
  public weaponType: WeaponType | null = null;

  public sprite: Graphics;
  private lifetime = 0;
  private rotationSpeed = 0;
  private pulsePhase = 0;

  constructor() {
    this.sprite = new Graphics();
    this.sprite.visible = false;
  }

  init(x: number, y: number, crateType: CrateType, weaponType: WeaponType | null = null): void {
    this.x = x;
    this.y = y;
    this.crateType = crateType;
    this.weaponType = weaponType;
    this.lifetime = CRATE.LIFETIME;
    this.rotationSpeed = randomRange(-CRATE.ROTATION_SPEED, CRATE.ROTATION_SPEED);
    this.pulsePhase = randomRange(0, Math.PI * 2);

    const color = crateType === CrateType.WEAPON && weaponType
      ? WEAPON_DEFS[weaponType].color
      : CRATE_COLORS[crateType];

    this.drawCrate(color, crateType);

    this.sprite.x = x;
    this.sprite.y = y;
    this.sprite.visible = true;
    this.sprite.alpha = 1;
  }

  private drawCrate(color: number, type: CrateType): void {
    const g = this.sprite;
    g.clear();
    const s = 12;

    // Outer glow
    g.circle(0, 0, s * 2);
    g.fill({ color, alpha: 0.08 });

    // Box shape
    g.roundRect(-s, -s, s * 2, s * 2, 3);
    g.fill({ color, alpha: 0.8 });
    g.roundRect(-s, -s, s * 2, s * 2, 3);
    g.stroke({ color: 0xFFFFFF, width: 1, alpha: 0.5 });

    // Inner icon symbol
    g.circle(0, 0, 4);
    g.fill({ color: 0xFFFFFF, alpha: 0.9 });
  }

  update(delta: number): void {
    // Fall
    this.y += CRATE.FALL_SPEED * delta;
    this.sprite.y = this.y;

    // Rotate
    this.sprite.rotation += this.rotationSpeed * delta;

    // Pulse glow
    this.pulsePhase += CRATE.PULSE_SPEED * delta * 60;
    const pulse = 0.7 + Math.sin(this.pulsePhase) * 0.3;
    this.sprite.alpha = pulse;

    // Lifetime
    this.lifetime -= delta * 16.67;

    // Blink when about to expire
    if (this.lifetime < 2000) {
      this.sprite.alpha = Math.sin(performance.now() * 0.015) > 0 ? pulse : 0.2;
    }
  }

  isExpired(): boolean {
    return this.lifetime <= 0;
  }

  isOffScreen(screenH: number): boolean {
    return this.y > screenH + 30;
  }

  reset(): void {
    this.sprite.visible = false;
    this.sprite.alpha = 1;
    this.crateType = CrateType.COIN;
    this.weaponType = null;
    this.lifetime = 0;
  }

  addToContainer(container: Container): void {
    if (!this.sprite.parent) {
      container.addChild(this.sprite);
    }
  }
}
