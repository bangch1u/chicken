// =============================================
// Starfield Background — Parallax scrolling stars
// =============================================

import { Graphics, Container } from 'pixi.js';
import { randomRange } from '../utils/MathUtils';

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  alpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

export class Starfield {
  private stars: Star[] = [];
  private graphics: Graphics;
  private container: Container;
  private screenW: number;
  private screenH: number;

  constructor(container: Container, screenW: number, screenH: number, count: number = 300) {
    this.container = container;
    this.screenW = screenW;
    this.screenH = screenH;
    this.graphics = new Graphics();
    this.container.addChild(this.graphics);

    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: randomRange(0, screenW),
        y: randomRange(0, screenH),
        size: randomRange(0.3, 2.5),
        speed: randomRange(0.2, 1.5),
        alpha: randomRange(0.2, 0.9),
        twinkleSpeed: randomRange(0.01, 0.05),
        twinklePhase: randomRange(0, Math.PI * 2),
      });
    }
  }

  update(delta: number): void {
    this.graphics.clear();

    for (const star of this.stars) {
      // Scroll downward (parallax)
      star.y += star.speed * delta;
      if (star.y > this.screenH + 5) {
        star.y = -5;
        star.x = randomRange(0, this.screenW);
      }

      // Twinkle
      star.twinklePhase += star.twinkleSpeed * delta * 60;
      const twinkle = 0.5 + Math.sin(star.twinklePhase) * 0.5;
      const alpha = star.alpha * twinkle;

      // Color gradient: small stars are blue-tinted, large stars are white
      const color = star.size > 1.5 ? 0xFFFFFF : star.size > 1 ? 0xAADDFF : 0x6699CC;

      this.graphics.circle(star.x, star.y, star.size);
      this.graphics.fill({ color, alpha });
    }
  }

  resize(w: number, h: number): void {
    this.screenW = w;
    this.screenH = h;
  }
}
