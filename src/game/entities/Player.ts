// =============================================
// Player Ship — Weapon system integration, enhanced movement
// =============================================

import { Graphics, Container } from 'pixi.js';
import { InputManager } from '../managers/InputManager';
import { PLAYER, COLORS } from '../core/Constants';
import { clamp } from '../utils/MathUtils';
import { ObjectPool } from '../managers/ObjectPool';
import { Projectile } from './Projectile';
import { WeaponSystem } from '../systems/WeaponSystem';
import { eventBus, GameEvents } from '../core/EventBus';
import type { Collidable } from '../managers/Collision';

export class Player implements Collidable {
  public x: number;
  public y: number;
  public radius = PLAYER.HITBOX_RADIUS;
  public active = true;
  public collisionGroup = 'player';

  public hp: number = PLAYER.MAX_HP;
  public maxHp: number = PLAYER.MAX_HP;
  public shield: number = PLAYER.MAX_SHIELD;
  public maxShield: number = PLAYER.MAX_SHIELD;
  public energy: number = PLAYER.MAX_ENERGY;
  public maxEnergy: number = PLAYER.MAX_ENERGY;

  public weaponSystem: WeaponSystem;

  public container: Container;
  private shipGraphics: Graphics;
  private engineGlow: Graphics;
  private shieldGraphics: Graphics;

  private fireTimer = 0;
  private invulnTimer = 0;
  private isInvulnerable = false;
  private engineFlicker = 0;

  constructor(startX: number, startY: number) {
    this.x = startX;
    this.y = startY;
    this.weaponSystem = new WeaponSystem();

    this.container = new Container();
    this.shipGraphics = new Graphics();
    this.engineGlow = new Graphics();
    this.shieldGraphics = new Graphics();

    this.drawShip();
    this.drawShield();

    this.container.addChild(this.engineGlow);
    this.container.addChild(this.shipGraphics);
    this.container.addChild(this.shieldGraphics);

    this.container.x = this.x;
    this.container.y = this.y;
  }

  private drawShip(): void {
    const g = this.shipGraphics;
    g.clear();
    // Sleek ship body
    g.moveTo(0, -26);
    g.lineTo(-18, 18);
    g.lineTo(-7, 12);
    g.lineTo(0, 16);
    g.lineTo(7, 12);
    g.lineTo(18, 18);
    g.closePath();
    g.fill({ color: 0x1E293B });
    g.stroke({ color: COLORS.PRIMARY, width: 1.5, alpha: 0.8 });
    // Cockpit
    g.moveTo(0, -20);
    g.lineTo(-6, 2);
    g.lineTo(0, 7);
    g.lineTo(6, 2);
    g.closePath();
    g.fill({ color: COLORS.PRIMARY, alpha: 0.6 });
    // Wing accents
    g.moveTo(-15, 14);
    g.lineTo(-9, 8);
    g.lineTo(-6, 12);
    g.closePath();
    g.fill({ color: COLORS.PRIMARY, alpha: 0.3 });
    g.moveTo(15, 14);
    g.lineTo(9, 8);
    g.lineTo(6, 12);
    g.closePath();
    g.fill({ color: COLORS.PRIMARY, alpha: 0.3 });
  }

  private drawShield(): void {
    const g = this.shieldGraphics;
    g.clear();
    if (this.shield > 0) {
      g.circle(0, 0, 30);
      g.stroke({ color: COLORS.ENERGY, width: 1.5, alpha: 0.3 });
      g.circle(0, 0, 30);
      g.fill({ color: COLORS.ENERGY, alpha: 0.04 });
      g.visible = true;
    } else {
      g.visible = false;
    }
  }

  private drawEngineGlow(delta: number): void {
    this.engineFlicker += delta * 0.3;
    const g = this.engineGlow;
    g.clear();
    const flicker = 0.5 + Math.sin(this.engineFlicker * 10) * 0.3;
    const trailLen = 8 + flicker * 6;
    // Left
    g.circle(-7, 15 + trailLen * 0.5, 3 + flicker * 2);
    g.fill({ color: COLORS.ENERGY, alpha: 0.4 * flicker });
    // Right
    g.circle(7, 15 + trailLen * 0.5, 3 + flicker * 2);
    g.fill({ color: COLORS.ENERGY, alpha: 0.4 * flicker });
    // Center
    g.circle(0, 17 + trailLen * 0.3, 2 + flicker);
    g.fill({ color: COLORS.PRIMARY, alpha: 0.6 * flicker });
  }

  update(delta: number, screenW: number, screenH: number, bulletPool: ObjectPool<Projectile>, bulletContainer: Container): void {
    const input = InputManager.getInstance();

    // Movement
    if (input.hasMouseMoved) {
      this.x = input.mouseX;
      this.y = input.mouseY;
    } else {
      let dx = input.moveX;
      let dy = input.moveY;
      if (dx !== 0 && dy !== 0) {
        const inv = 1 / Math.SQRT2;
        dx *= inv;
        dy *= inv;
      }
      this.x += dx * PLAYER.SPEED * delta;
      this.y += dy * PLAYER.SPEED * delta;
    }
    
    this.x = clamp(this.x, 30, screenW - 30);
    this.y = clamp(this.y, 30, screenH - 30);
    this.container.x = this.x;
    this.container.y = this.y;

    // Engine glow
    this.drawEngineGlow(delta);

    // Invulnerability
    if (this.isInvulnerable) {
      this.invulnTimer -= delta * 16.67;
      this.container.alpha = Math.sin(Date.now() * 0.02) > 0 ? 1 : 0.3;
      if (this.invulnTimer <= 0) {
        this.isInvulnerable = false;
        this.container.alpha = 1;
      }
    }

    // Firing — uses WeaponSystem
    const ws = this.weaponSystem.getState();
    this.fireTimer -= delta * 16.67;
    const shouldFire = input.mouseDown || input.isKeyDown(' ');
    if (shouldFire && this.fireTimer <= 0) {
      this.weaponSystem.fire(this.x, this.y, bulletPool, bulletContainer);
      this.fireTimer = ws.fireRate;
    }

    // Energy regen
    this.energy = clamp(this.energy + 0.03 * delta, 0, this.maxEnergy);

    // Shield regen
    if (this.shield < this.maxShield) {
      this.shield = clamp(this.shield + 0.008 * delta, 0, this.maxShield);
    }
    this.shieldGraphics.visible = this.shield > 0;
    if (this.shield > 0) {
      this.shieldGraphics.alpha = 0.3 + Math.sin(performance.now() * 0.003) * 0.1;
    }
  }

  takeDamage(amount: number): void {
    if (this.isInvulnerable || !this.active) return;
    if (this.shield > 0) {
      const absorbed = Math.min(this.shield, amount);
      this.shield -= absorbed;
      amount -= absorbed;
      this.drawShield();
    }
    this.hp -= amount;
    this.isInvulnerable = true;
    this.invulnTimer = PLAYER.INVULNERABILITY_DURATION;
    eventBus.emit(GameEvents.SCREEN_SHAKE, 5, 250);
    if (this.hp <= 0) {
      this.hp = 0;
      this.active = false;
      eventBus.emit(GameEvents.PLAYER_DIED);
    }
  }

  heal(amount: number): void {
    this.hp = clamp(this.hp + amount, 0, this.maxHp);
  }

  restoreShield(amount: number): void {
    this.shield = clamp(this.shield + amount, 0, this.maxShield);
    this.drawShield();
  }

  restoreEnergy(amount: number): void {
    this.energy = clamp(this.energy + amount, 0, this.maxEnergy);
  }

  addToContainer(parent: Container): void {
    parent.addChild(this.container);
  }
}
