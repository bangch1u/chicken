import { create } from 'zustand';
import { WeaponType } from '@/game/core/Constants';

interface GameState {
  // Engine
  isInitialized: boolean;
  fps: number;

  // Score
  score: number;
  highScore: number;

  // Player
  playerHealth: number;
  playerMaxHealth: number;
  playerShield: number;
  playerMaxShield: number;
  energy: number;
  maxEnergy: number;

  // Weapon
  weaponType: WeaponType;
  weaponLevel: number;
  weaponName: string;

  // Wave
  currentWave: number;
  enemiesAlive: number;

  // Combo
  comboCount: number;
  comboMultiplier: number;
  comboLabel: string;

  // Notifications
  notification: string;
  notificationColor: string;
  notificationKey: number; // changes to trigger re-render

  // Actions
  setInitialized: (val: boolean) => void;
  updateFPS: (fps: number) => void;
  setScore: (val: number) => void;
  updateHealth: (current: number, max: number) => void;
  updateShield: (current: number, max: number) => void;
  updateEnergy: (current: number, max: number) => void;
  setWeapon: (type: WeaponType, level: number, name: string) => void;
  setWave: (wave: number) => void;
  setEnemiesAlive: (count: number) => void;
  setCombo: (count: number, multiplier: number, label: string) => void;
  showNotification: (text: string, color?: string) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  isInitialized: false,
  fps: 60,
  score: 0,
  highScore: 0,
  playerHealth: 100,
  playerMaxHealth: 100,
  playerShield: 50,
  playerMaxShield: 50,
  energy: 100,
  maxEnergy: 100,
  weaponType: WeaponType.LASER,
  weaponLevel: 1,
  weaponName: 'Laser',
  currentWave: 0,
  enemiesAlive: 0,
  comboCount: 0,
  comboMultiplier: 1,
  comboLabel: '',
  notification: '',
  notificationColor: '#00D9FF',
  notificationKey: 0,

  setInitialized: (val) => set({ isInitialized: val }),
  updateFPS: (fps) => set({ fps }),
  setScore: (val) => {
    const hs = get().highScore;
    set({ score: val, highScore: val > hs ? val : hs });
  },
  updateHealth: (current, max) => set({ playerHealth: Math.round(current), playerMaxHealth: max }),
  updateShield: (current, max) => set({ playerShield: Math.round(current), playerMaxShield: max }),
  updateEnergy: (current, max) => set({ energy: Math.round(current), maxEnergy: max }),
  setWeapon: (type, level, name) => set({ weaponType: type, weaponLevel: level, weaponName: name }),
  setWave: (wave) => set({ currentWave: wave }),
  setEnemiesAlive: (count) => set({ enemiesAlive: count }),
  setCombo: (count, multiplier, label) => set({ comboCount: count, comboMultiplier: multiplier, comboLabel: label }),
  showNotification: (text, color = '#00D9FF') =>
    set((state) => ({ notification: text, notificationColor: color, notificationKey: state.notificationKey + 1 })),
}));
