// =============================================
// VFX System — Explosions, Particles, Screen Shake
// =============================================

import { Graphics, Container } from 'pixi.js';
import { COLORS } from '../core/Constants';
import { randomRange } from '../utils/MathUtils';

// ---- Particle ----
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
  alpha: number;
  active: boolean;
}

export class VFXSystem {
  private particles: Particle[] = [];
  private graphics: Graphics;
  private container: Container;
  private maxParticles = 500;

  // Screen shake
  private shakeIntensity = 0;
  private shakeDuration = 0;
  private shakeTimer = 0;
  private shakeTarget: Container | null = null;
  private shakeOrigX = 0;
  private shakeOrigY = 0;

  constructor(container: Container) {
    this.container = container;
    this.graphics = new Graphics();
    this.container.addChild(this.graphics);

    // Pre-allocate particles
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        x: 0, y: 0, vx: 0, vy: 0,
        life: 0, maxLife: 0, size: 2,
        color: 0xFFFFFF, alpha: 1, active: false,
      });
    }
  }

  // ---- Explosion Effect ----
  spawnExplosion(x: number, y: number, color: number = COLORS.ACCENT, count: number = 20, speed: number = 4): void {
    for (let i = 0; i < count; i++) {
      const p = this.getParticle();
      if (!p) break;

      const angle = (Math.PI * 2 * i) / count + randomRange(-0.3, 0.3);
      const spd = randomRange(speed * 0.5, speed * 1.5);

      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * spd;
      p.vy = Math.sin(angle) * spd;
      p.life = randomRange(15, 35);
      p.maxLife = p.life;
      p.size = randomRange(1.5, 4);
      p.color = color;
      p.alpha = 1;
      p.active = true;
    }
  }

  // ---- Hit Spark Effect ----
  spawnHitSpark(x: number, y: number, color: number = COLORS.PRIMARY): void {
    for (let i = 0; i < 6; i++) {
      const p = this.getParticle();
      if (!p) break;

      const angle = randomRange(0, Math.PI * 2);
      const spd = randomRange(1, 3);

      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * spd;
      p.vy = Math.sin(angle) * spd;
      p.life = randomRange(8, 16);
      p.maxLife = p.life;
      p.size = randomRange(1, 2.5);
      p.color = color;
      p.alpha = 1;
      p.active = true;
    }
  }

  // ---- Score Pop (floating text substitute with particle trail) ----
  spawnScorePop(x: number, y: number): void {
    for (let i = 0; i < 3; i++) {
      const p = this.getParticle();
      if (!p) break;

      p.x = x + randomRange(-10, 10);
      p.y = y;
      p.vx = randomRange(-0.5, 0.5);
      p.vy = -randomRange(1, 2);
      p.life = 30;
      p.maxLife = 30;
      p.size = 2;
      p.color = COLORS.ACCENT;
      p.alpha = 1;
      p.active = true;
    }
  }

  // ---- Screen Shake ----
  startScreenShake(intensity: number, duration: number, target: Container): void {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = duration;
    this.shakeTarget = target;
    this.shakeOrigX = target.x;
    this.shakeOrigY = target.y;
  }

  // ---- Update ----
  update(delta: number): void {
    // Update particles
    this.graphics.clear();

    for (const p of this.particles) {
      if (!p.active) continue;

      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.life -= delta;
      p.vy += 0.05 * delta; // light gravity

      const lifeRatio = p.life / p.maxLife;
      p.alpha = lifeRatio;
      const currentSize = p.size * lifeRatio;

      if (p.life <= 0) {
        p.active = false;
        continue;
      }

      this.graphics.circle(p.x, p.y, currentSize);
      this.graphics.fill({ color: p.color, alpha: p.alpha });
    }

    // Screen shake
    if (this.shakeTimer > 0 && this.shakeTarget) {
      this.shakeTimer -= delta * 16.67;
      const progress = this.shakeTimer / this.shakeDuration;
      const intensity = this.shakeIntensity * progress;
      this.shakeTarget.x = this.shakeOrigX + randomRange(-intensity, intensity);
      this.shakeTarget.y = this.shakeOrigY + randomRange(-intensity, intensity);

      if (this.shakeTimer <= 0) {
        this.shakeTarget.x = this.shakeOrigX;
        this.shakeTarget.y = this.shakeOrigY;
        this.shakeTarget = null;
      }
    }
  }

  private getParticle(): Particle | null {
    for (const p of this.particles) {
      if (!p.active) return p;
    }
    return null;
  }
}
