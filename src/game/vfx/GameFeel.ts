// =============================================
// GameFeel — Screen flash, floating text, damage numbers
// =============================================

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { COLORS, VFX } from '../core/Constants';

// ---- Floating Text Pool ----
interface FloatingText {
  text: Text;
  vy: number;
  life: number;
  maxLife: number;
  active: boolean;
}

export class GameFeelSystem {
  private container: Container;
  private flashOverlay: Graphics;
  private flashAlpha = 0;
  private flashColor = 0xFFFFFF;

  private floatingTexts: FloatingText[] = [];

  // Hit stop
  private hitStopFrames = 0;

  constructor(container: Container, screenW: number, screenH: number) {
    this.container = container;

    // Screen flash overlay
    this.flashOverlay = new Graphics();
    this.flashOverlay.rect(0, 0, screenW, screenH);
    this.flashOverlay.fill({ color: 0xFFFFFF, alpha: 1 });
    this.flashOverlay.alpha = 0;
    this.container.addChild(this.flashOverlay);

    // Pre-allocate floating text pool
    const style = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 16,
      fontWeight: 'bold',
      fill: 0xFFFFFF,
      dropShadow: { color: 0x000000, blur: 2, distance: 1, alpha: 0.5 },
    });

    for (let i = 0; i < VFX.MAX_FLOATING_TEXTS; i++) {
      const t = new Text({ text: '', style });
      t.visible = false;
      t.anchor.set(0.5);
      this.container.addChild(t);
      this.floatingTexts.push({
        text: t, vy: -2, life: 0, maxLife: 40, active: false,
      });
    }
  }

  // ---- Screen Flash ----
  flash(color: number = 0xFFFFFF, intensity: number = 0.3): void {
    this.flashColor = color;
    this.flashAlpha = intensity;
    this.flashOverlay.clear();
    this.flashOverlay.rect(0, 0, window.innerWidth, window.innerHeight);
    this.flashOverlay.fill({ color, alpha: 1 });
    this.flashOverlay.alpha = intensity;
  }

  // ---- Floating Text ----
  showFloatingText(x: number, y: number, text: string, color: number = COLORS.ACCENT, size: number = 16): void {
    for (const ft of this.floatingTexts) {
      if (!ft.active) {
        ft.text.text = text;
        ft.text.style.fontSize = size;
        ft.text.style.fill = color;
        ft.text.x = x;
        ft.text.y = y;
        ft.text.alpha = 1;
        ft.text.scale.set(1);
        ft.text.visible = true;
        ft.vy = -2.5;
        ft.life = 50;
        ft.maxLife = 50;
        ft.active = true;
        return;
      }
    }
  }

  // Big notification in center
  showBigNotification(text: string, color: number = COLORS.PRIMARY): void {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * 0.35;
    this.showFloatingText(cx, cy, text, color, 28);
    this.flash(color, 0.15);
  }

  // ---- Hit Stop ----
  requestHitStop(frames: number = 2): void {
    this.hitStopFrames = Math.max(this.hitStopFrames, frames);
  }

  shouldPause(): boolean {
    return this.hitStopFrames > 0;
  }

  // ---- Update ----
  update(delta: number): void {
    // Hit stop countdown
    if (this.hitStopFrames > 0) {
      this.hitStopFrames--;
    }

    // Flash decay
    if (this.flashAlpha > 0) {
      this.flashAlpha *= 0.88;
      if (this.flashAlpha < 0.01) this.flashAlpha = 0;
      this.flashOverlay.alpha = this.flashAlpha;
    }

    // Floating texts
    for (const ft of this.floatingTexts) {
      if (!ft.active) continue;
      ft.text.y += ft.vy * delta;
      ft.life -= delta;
      const ratio = ft.life / ft.maxLife;
      ft.text.alpha = ratio;
      ft.text.scale.set(1 + (1 - ratio) * 0.3);
      if (ft.life <= 0) {
        ft.active = false;
        ft.text.visible = false;
      }
    }
  }

  resize(w: number, h: number): void {
    this.flashOverlay.clear();
    this.flashOverlay.rect(0, 0, w, h);
    this.flashOverlay.fill({ color: 0xFFFFFF, alpha: 1 });
    this.flashOverlay.alpha = this.flashAlpha;
  }
}
