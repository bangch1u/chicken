// =============================================
// Weapon System — Types, Levels, Evolution, Fire Patterns
// =============================================

import { WeaponType, WEAPON_DEFS, type WeaponDef, COLORS } from '../core/Constants';
import { ObjectPool } from '../managers/ObjectPool';
import { Projectile } from '../entities/Projectile';
import { Container } from 'pixi.js';

export interface WeaponState {
  type: WeaponType;
  level: number;
  name: string;
  damage: number;
  fireRate: number;
  speed: number;
  projectileCount: number;
  spreadAngle: number;
  color: number;
  size: number;
}

export class WeaponSystem {
  private currentType: WeaponType = WeaponType.LASER;
  private currentLevel: number = 1;
  private maxLevel: number = 10;

  getState(): WeaponState {
    return this.calculateStats(this.currentType, this.currentLevel);
  }

  getType(): WeaponType { return this.currentType; }
  getLevel(): number { return this.currentLevel; }

  // Called when player picks up a weapon crate
  collectWeapon(type: WeaponType): { leveled: boolean; switched: boolean; state: WeaponState } {
    if (type === this.currentType) {
      // Same weapon → Level up
      if (this.currentLevel < this.maxLevel) {
        this.currentLevel++;
        return { leveled: true, switched: false, state: this.getState() };
      }
      return { leveled: false, switched: false, state: this.getState() };
    } else {
      // Different weapon → Switch (start at level 1)
      this.currentType = type;
      this.currentLevel = 1;
      return { leveled: false, switched: true, state: this.getState() };
    }
  }

  private calculateStats(type: WeaponType, level: number): WeaponState {
    const def = WEAPON_DEFS[type];
    const lvl = level - 1; // 0-indexed for math

    // Scaling formulas
    const damage = Math.round(def.baseDamage * (1 + lvl * 0.2));
    const fireRate = Math.max(60, Math.round(def.baseFireRate * (1 - lvl * 0.04)));
    const speed = def.baseSpeed + lvl * 0.3;
    const size = def.baseSize + Math.floor(lvl / 3);

    // Projectile count ramps at levels 3, 5, 7, 9, 10
    let projectileCount = 1;
    let spreadAngle = 0;

    switch (type) {
      case WeaponType.LASER:
        if (level >= 4) projectileCount = 2;
        if (level >= 7) projectileCount = 3;
        if (level >= 10) projectileCount = 5;
        spreadAngle = projectileCount > 1 ? 0.15 : 0;
        break;
      case WeaponType.PLASMA:
        if (level >= 5) projectileCount = 2;
        if (level >= 8) projectileCount = 3;
        if (level >= 10) projectileCount = 4;
        spreadAngle = projectileCount > 1 ? 0.25 : 0;
        break;
      case WeaponType.MISSILE:
        if (level >= 4) projectileCount = 2;
        if (level >= 7) projectileCount = 3;
        if (level >= 10) projectileCount = 4;
        spreadAngle = 0.3;
        break;
      case WeaponType.SPREAD:
        projectileCount = 3 + Math.floor(lvl / 2);
        if (level >= 10) projectileCount = 9;
        spreadAngle = 0.12 * projectileCount;
        break;
      case WeaponType.PHOTON:
        projectileCount = 1 + Math.floor(lvl / 3);
        if (level >= 10) projectileCount = 5;
        spreadAngle = 0.1;
        break;
      case WeaponType.RAILGUN:
        projectileCount = 1;
        if (level >= 7) projectileCount = 2;
        if (level >= 10) projectileCount = 3;
        spreadAngle = 0.08;
        break;
      case WeaponType.TESLA:
        projectileCount = 2 + Math.floor(lvl / 2);
        if (level >= 10) projectileCount = 8;
        spreadAngle = 0.5 + lvl * 0.05;
        break;
      case WeaponType.QUANTUM:
        if (level >= 3) projectileCount = 2;
        if (level >= 6) projectileCount = 3;
        if (level >= 9) projectileCount = 4;
        if (level >= 10) projectileCount = 5;
        spreadAngle = 0.2;
        break;
    }

    // Evolution name
    let name = def.name;
    if (level >= 10 && def.evolutions[2]) name = def.evolutions[2];
    else if (level >= 7 && def.evolutions[1]) name = def.evolutions[1];
    else if (level >= 4 && def.evolutions[0]) name = def.evolutions[0];

    return { type, level, name, damage, fireRate, speed, projectileCount, spreadAngle, color: def.color, size };
  }

  // Fire projectiles from the player position
  fire(
    px: number, py: number,
    pool: ObjectPool<Projectile>,
    container: Container
  ): void {
    const s = this.getState();
    const count = s.projectileCount;
    const totalSpread = s.spreadAngle;

    for (let i = 0; i < count; i++) {
      const bullet = pool.get();
      if (!bullet) return;

      let angle = -Math.PI / 2; // straight up
      if (count > 1) {
        const offset = (i / (count - 1)) - 0.5; // -0.5 to 0.5
        angle += offset * totalSpread;
      }

      const vx = Math.cos(angle) * s.speed;
      const vy = Math.sin(angle) * s.speed;

      bullet.init(px, py - 20, vx, vy, s.damage, 'player', s.color, s.size);
      bullet.addToContainer(container);
    }
  }
}
