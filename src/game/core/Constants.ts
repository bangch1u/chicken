// =============================================
// Game Constants & Configuration — Complete
// =============================================

export const GAME_WIDTH = 1920;
export const GAME_HEIGHT = 1080;

// ---- Colors ----
export const COLORS = {
  BACKGROUND_DEEP: 0x030712,
  BACKGROUND_MID: 0x071224,
  BACKGROUND_LIGHT: 0x0A1020,

  PRIMARY: 0x00D9FF,
  PRIMARY_ALT: 0x00AEEF,

  SECONDARY: 0x8B5CF6,
  SECONDARY_ALT: 0xA855F7,

  ACCENT: 0xFFD700,
  ACCENT_ALT: 0xFFB800,

  DANGER: 0xFF4D6D,
  DANGER_ALT: 0xFF006E,

  ENERGY: 0x00FFFF,
  ENERGY_ALT: 0x38BDF8,

  WHITE: 0xFFFFFF,
  TEXT_DIM: 0x94A3B8,

  // Weapon Colors
  LASER: 0x00D9FF,
  PLASMA: 0xA855F7,
  MISSILE: 0xFF6B35,
  SPREAD: 0x4ADE80,
  PHOTON: 0xFDE68A,
  RAILGUN: 0xFF4D6D,
  TESLA: 0x38BDF8,
  QUANTUM: 0xE879F9,

  // Rarity Colors
  RARITY_COMMON: 0x94A3B8,
  RARITY_RARE: 0x3B82F6,
  RARITY_EPIC: 0xA855F7,
  RARITY_LEGENDARY: 0xFFD700,
  RARITY_MYTHIC: 0xFF006E,
} as const;

// ---- Player ----
export const PLAYER = {
  SPEED: 7,
  MAX_HP: 100,
  MAX_SHIELD: 50,
  MAX_ENERGY: 100,
  INVULNERABILITY_DURATION: 1200,
  HITBOX_RADIUS: 12,
} as const;

// ---- Projectile Pools ----
export const PROJECTILE = {
  PLAYER_SPEED: 14,
  PLAYER_DAMAGE: 10,
  ENEMY_SPEED: 4,
  ENEMY_DAMAGE: 12,
  MAX_POOL_SIZE: 2000,
} as const;

// ---- Enemy Pool ----
export const ENEMY = {
  MAX_POOL_SIZE: 400,
  SPAWN_MARGIN: 50,
} as const;

// ---- Weapon Type Enum ----
export enum WeaponType {
  LASER = 'laser',
  PLASMA = 'plasma',
  MISSILE = 'missile',
  SPREAD = 'spread',
  PHOTON = 'photon',
  RAILGUN = 'railgun',
  TESLA = 'tesla',
  QUANTUM = 'quantum',
}

// ---- Base Weapon Definitions ----
export interface WeaponDef {
  type: WeaponType;
  name: string;
  color: number;
  baseDamage: number;
  baseFireRate: number; // ms
  baseSpeed: number;
  baseSize: number;
  evolutions: string[]; // names at level 4, 7, 10
}

export const WEAPON_DEFS: Record<WeaponType, WeaponDef> = {
  [WeaponType.LASER]: {
    type: WeaponType.LASER, name: 'Laser', color: COLORS.LASER,
    baseDamage: 8, baseFireRate: 150, baseSpeed: 16, baseSize: 4,
    evolutions: ['Twin Laser', 'Triple Laser', 'Omega Laser'],
  },
  [WeaponType.PLASMA]: {
    type: WeaponType.PLASMA, name: 'Plasma', color: COLORS.PLASMA,
    baseDamage: 14, baseFireRate: 280, baseSpeed: 10, baseSize: 6,
    evolutions: ['Plasma Burst', 'Plasma Storm', 'Nova Plasma'],
  },
  [WeaponType.MISSILE]: {
    type: WeaponType.MISSILE, name: 'Missile', color: COLORS.MISSILE,
    baseDamage: 22, baseFireRate: 500, baseSpeed: 8, baseSize: 5,
    evolutions: ['Dual Missile', 'Swarm Missile', 'Void Missile'],
  },
  [WeaponType.SPREAD]: {
    type: WeaponType.SPREAD, name: 'Spread Shot', color: COLORS.SPREAD,
    baseDamage: 5, baseFireRate: 200, baseSpeed: 13, baseSize: 3,
    evolutions: ['Wide Spread', 'Full Spread', 'Chaos Spread'],
  },
  [WeaponType.PHOTON]: {
    type: WeaponType.PHOTON, name: 'Photon Beam', color: COLORS.PHOTON,
    baseDamage: 10, baseFireRate: 120, baseSpeed: 18, baseSize: 3,
    evolutions: ['Photon Burst', 'Photon Wave', 'Solar Photon'],
  },
  [WeaponType.RAILGUN]: {
    type: WeaponType.RAILGUN, name: 'Railgun', color: COLORS.RAILGUN,
    baseDamage: 35, baseFireRate: 700, baseSpeed: 24, baseSize: 3,
    evolutions: ['Twin Rail', 'Pierce Rail', 'Omega Rail'],
  },
  [WeaponType.TESLA]: {
    type: WeaponType.TESLA, name: 'Tesla Cannon', color: COLORS.TESLA,
    baseDamage: 7, baseFireRate: 100, baseSpeed: 12, baseSize: 4,
    evolutions: ['Tesla Arc', 'Tesla Storm', 'Tesla Vortex'],
  },
  [WeaponType.QUANTUM]: {
    type: WeaponType.QUANTUM, name: 'Quantum Blaster', color: COLORS.QUANTUM,
    baseDamage: 18, baseFireRate: 350, baseSpeed: 11, baseSize: 5,
    evolutions: ['Quantum Split', 'Quantum Rift', 'Quantum Void'],
  },
};

// ---- Enemy Class Configs ----
export type EnemyClass = 'drone' | 'scout' | 'fighter' | 'bomber' | 'elite' | 'champion';

export interface EnemyClassConfig {
  hp: number;
  speed: number;
  size: number;
  color: number;
  score: number;
  damage: number;
  canShoot: boolean;
  fireRate: number; // ms, 0 = no shooting
  bulletSpeed: number;
}

export const ENEMY_CONFIGS: Record<EnemyClass, EnemyClassConfig> = {
  drone:    { hp: 8,   speed: 2.0, size: 10, color: 0x64748B, score: 10,  damage: 8,  canShoot: false, fireRate: 0,    bulletSpeed: 0 },
  scout:    { hp: 15,  speed: 2.8, size: 12, color: 0x22D3EE, score: 25,  damage: 10, canShoot: true,  fireRate: 2500, bulletSpeed: 3.5 },
  fighter:  { hp: 30,  speed: 2.2, size: 16, color: 0xF59E0B, score: 50,  damage: 15, canShoot: true,  fireRate: 1800, bulletSpeed: 4.0 },
  bomber:   { hp: 50,  speed: 1.5, size: 20, color: 0xEF4444, score: 75,  damage: 20, canShoot: true,  fireRate: 2200, bulletSpeed: 3.0 },
  elite:    { hp: 80,  speed: 2.0, size: 22, color: 0xA855F7, score: 150, damage: 25, canShoot: true,  fireRate: 1200, bulletSpeed: 4.5 },
  champion: { hp: 200, speed: 1.5, size: 28, color: 0xFFD700, score: 500, damage: 35, canShoot: true,  fireRate: 800,  bulletSpeed: 5.0 },
};

// ---- Formation Types ----
export enum FormationType {
  V_FORMATION = 'v',
  TRIANGLE = 'triangle',
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical',
  DIAMOND = 'diamond',
  CIRCULAR = 'circular',
  SPIRAL = 'spiral',
  SWARM = 'swarm',
  SNAKE = 'snake',
  BOSS_ESCORT = 'bossEscort',
}

// ---- Movement Pattern Types ----
export enum MovementPattern {
  STRAIGHT = 'straight',
  ZIGZAG = 'zigzag',
  SIN_WAVE = 'sinWave',
  DOUBLE_SIN = 'doubleSin',
  CIRCULAR_ORBIT = 'circularOrbit',
  FIGURE_EIGHT = 'figureEight',
  SPIRAL_DESCENT = 'spiralDescent',
  RANDOM_DRIFT = 'randomDrift',
  DIVE_ATTACK = 'diveAttack',
  SWARM_AI = 'swarmAI',
  ORBIT_THEN_DIVE = 'orbitThenDive',
}

// ---- Drop Rates ----
export const DROP_RATES = {
  COMMON:    0.60,
  RARE:      0.25,
  EPIC:      0.10,
  LEGENDARY: 0.04,
  MYTHIC:    0.01,
} as const;

// ---- Crate Config ----
export const CRATE = {
  FALL_SPEED: 1.2,
  LIFETIME: 8000, // ms
  COLLECT_RADIUS: 30,
  ROTATION_SPEED: 0.02,
  PULSE_SPEED: 0.05,
} as const;

// ---- Combo Config ----
export const COMBO = {
  TIMEOUT: 2500, // ms without kill to reset
  THRESHOLDS: [
    { kills: 5,  multiplier: 2, label: 'x2' },
    { kills: 15, multiplier: 5, label: 'x5' },
    { kills: 30, multiplier: 10, label: 'x10' },
    { kills: 50, multiplier: 15, label: 'x15' },
    { kills: 100, multiplier: 25, label: 'x25' },
  ],
} as const;

// ---- VFX ----
export const VFX = {
  MAX_PARTICLES: 800,
  SCREEN_SHAKE_INTENSITY: 5,
  SCREEN_SHAKE_DURATION: 300,
  MAX_FLOATING_TEXTS: 40,
} as const;

// ---- Reward Crate Types ----
export enum CrateType {
  WEAPON = 'weapon',
  COIN = 'coin',
  ENERGY = 'energy',
  SHIELD = 'shield',
  BOMB = 'bomb',
}
