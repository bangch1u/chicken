// =============================================
// Reward System — Drop tables & crate spawning
// =============================================

import { CrateType, WeaponType, DROP_RATES, WEAPON_DEFS } from '../core/Constants';
import { ObjectPool } from '../managers/ObjectPool';
import { RewardCrate } from '../entities/RewardCrate';
import { Container } from 'pixi.js';

interface DropTableEntry {
  crateType: CrateType;
  weight: number;
}

const DROP_TABLE: DropTableEntry[] = [
  { crateType: CrateType.COIN,   weight: 40 },
  { crateType: CrateType.WEAPON, weight: 25 },
  { crateType: CrateType.ENERGY, weight: 20 },
  { crateType: CrateType.SHIELD, weight: 10 },
  { crateType: CrateType.BOMB,   weight: 5 },
];

const WEAPON_DROP_TABLE = Object.values(WeaponType);

export class RewardSystem {
  private cratePool: ObjectPool<RewardCrate>;
  private crateContainer: Container;

  constructor(crateContainer: Container) {
    this.crateContainer = crateContainer;
    this.cratePool = new ObjectPool<RewardCrate>(
      () => new RewardCrate(),
      20,
      80
    );
  }

  /**
   * Roll for a drop when an enemy dies.
   * @param baseDropChance 0.0-1.0 base chance
   * @param comboBonus extra chance from combo
   * @param isElite elite enemies have 2x drop chance
   */
  tryDrop(x: number, y: number, baseDropChance: number, comboBonus: number = 0, isElite: boolean = false): RewardCrate | null {
    const chance = baseDropChance + comboBonus + (isElite ? baseDropChance : 0);
    if (Math.random() > chance) return null;

    // Pick crate type from weighted table
    const crateType = this.weightedRandom(DROP_TABLE);

    // If weapon crate, pick a random weapon type
    let weaponType: WeaponType | null = null;
    if (crateType === CrateType.WEAPON) {
      weaponType = WEAPON_DROP_TABLE[Math.floor(Math.random() * WEAPON_DROP_TABLE.length)];
    }

    const crate = this.cratePool.get();
    if (!crate) return null;

    crate.init(x, y, crateType, weaponType);
    crate.addToContainer(this.crateContainer);
    return crate;
  }

  private weightedRandom(table: DropTableEntry[]): CrateType {
    const totalWeight = table.reduce((sum, e) => sum + e.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const entry of table) {
      roll -= entry.weight;
      if (roll <= 0) return entry.crateType;
    }
    return table[table.length - 1].crateType;
  }

  update(delta: number): void {
    this.cratePool.forEachActive((crate) => {
      crate.update(delta);
      if (crate.isExpired() || crate.isOffScreen(window.innerHeight)) {
        this.cratePool.release(crate);
      }
    });
  }

  getPool(): ObjectPool<RewardCrate> {
    return this.cratePool;
  }

  releaseAll(): void {
    this.cratePool.releaseAll();
  }
}
