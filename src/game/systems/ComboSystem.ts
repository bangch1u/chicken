// =============================================
// Combo System — Kill streak tracking
// =============================================

import { COMBO, COLORS } from '../core/Constants';
import { eventBus, GameEvents } from '../core/EventBus';
import { useGameStore } from '@/store/useGameStore';

export class ComboSystem {
  private killCount = 0;
  private lastKillTime = 0;
  private currentMultiplier = 1;
  private currentLabel = '';

  registerKill(baseScore: number): number {
    const now = performance.now();
    
    // Reset if too long since last kill
    if (now - this.lastKillTime > COMBO.TIMEOUT && this.killCount > 0) {
      this.killCount = 0;
      this.currentMultiplier = 1;
      this.currentLabel = '';
    }

    this.killCount++;
    this.lastKillTime = now;

    // Determine multiplier from thresholds
    this.currentMultiplier = 1;
    this.currentLabel = '';
    for (const threshold of COMBO.THRESHOLDS) {
      if (this.killCount >= threshold.kills) {
        this.currentMultiplier = threshold.multiplier;
        this.currentLabel = threshold.label;
      }
    }

    const finalScore = baseScore * this.currentMultiplier;

    // Sync to UI
    useGameStore.getState().setCombo(this.killCount, this.currentMultiplier, this.currentLabel);

    return finalScore;
  }

  update(): void {
    // Check for combo timeout
    const now = performance.now();
    if (this.killCount > 0 && now - this.lastKillTime > COMBO.TIMEOUT) {
      this.killCount = 0;
      this.currentMultiplier = 1;
      this.currentLabel = '';
      useGameStore.getState().setCombo(0, 1, '');
    }
  }

  getMultiplier(): number {
    return this.currentMultiplier;
  }

  getKillCount(): number {
    return this.killCount;
  }

  /**
   * Returns extra drop chance bonus from combo (0.0 to 0.15 at x25)
   */
  getDropBonus(): number {
    return Math.min(0.15, (this.currentMultiplier - 1) * 0.006);
  }
}
