// =============================================
// Formation Manager — 10 Formation Types + 11 Movement Patterns
// =============================================

import { FormationType, MovementPattern } from '../core/Constants';
import { randomRange } from '../utils/MathUtils';

// ---- Formation position offsets ----
export interface FormationOffset {
  dx: number;
  dy: number;
}

/**
 * Generate position offsets for a given formation type and enemy count.
 */
export function generateFormation(type: FormationType, count: number, spacing: number = 45): FormationOffset[] {
  switch (type) {
    case FormationType.V_FORMATION:
      return generateV(count, spacing);
    case FormationType.TRIANGLE:
      return generateTriangle(count, spacing);
    case FormationType.HORIZONTAL:
      return generateHorizontal(count, spacing);
    case FormationType.VERTICAL:
      return generateVertical(count, spacing);
    case FormationType.DIAMOND:
      return generateDiamond(count, spacing);
    case FormationType.CIRCULAR:
      return generateCircular(count, spacing * 1.5);
    case FormationType.SPIRAL:
      return generateSpiral(count, spacing);
    case FormationType.SWARM:
      return generateSwarm(count, spacing * 2);
    case FormationType.SNAKE:
      return generateSnake(count, spacing);
    case FormationType.BOSS_ESCORT:
      return generateBossEscort(count, spacing * 1.5);
    default:
      return generateHorizontal(count, spacing);
  }
}

function generateV(count: number, spacing: number): FormationOffset[] {
  const offsets: FormationOffset[] = [{ dx: 0, dy: 0 }];
  for (let i = 1; offsets.length < count; i++) {
    offsets.push({ dx: -i * spacing, dy: i * spacing * 0.7 });
    if (offsets.length < count) offsets.push({ dx: i * spacing, dy: i * spacing * 0.7 });
  }
  return offsets.slice(0, count);
}

function generateTriangle(count: number, spacing: number): FormationOffset[] {
  const offsets: FormationOffset[] = [];
  let row = 0;
  while (offsets.length < count) {
    const cols = row + 1;
    for (let c = 0; c < cols && offsets.length < count; c++) {
      const dx = (c - (cols - 1) / 2) * spacing;
      const dy = row * spacing * 0.8;
      offsets.push({ dx, dy });
    }
    row++;
  }
  return offsets;
}

function generateHorizontal(count: number, spacing: number): FormationOffset[] {
  const offsets: FormationOffset[] = [];
  for (let i = 0; i < count; i++) {
    offsets.push({ dx: (i - (count - 1) / 2) * spacing, dy: 0 });
  }
  return offsets;
}

function generateVertical(count: number, spacing: number): FormationOffset[] {
  const offsets: FormationOffset[] = [];
  for (let i = 0; i < count; i++) {
    offsets.push({ dx: 0, dy: i * spacing });
  }
  return offsets;
}

function generateDiamond(count: number, spacing: number): FormationOffset[] {
  const offsets: FormationOffset[] = [{ dx: 0, dy: 0 }];
  const rings = Math.ceil(count / 4);
  for (let r = 1; r <= rings && offsets.length < count; r++) {
    // 4 points per ring
    offsets.push({ dx: 0, dy: -r * spacing });
    if (offsets.length < count) offsets.push({ dx: r * spacing, dy: 0 });
    if (offsets.length < count) offsets.push({ dx: 0, dy: r * spacing });
    if (offsets.length < count) offsets.push({ dx: -r * spacing, dy: 0 });
  }
  return offsets.slice(0, count);
}

function generateCircular(count: number, radius: number): FormationOffset[] {
  const offsets: FormationOffset[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    offsets.push({ dx: Math.cos(angle) * radius, dy: Math.sin(angle) * radius });
  }
  return offsets;
}

function generateSpiral(count: number, spacing: number): FormationOffset[] {
  const offsets: FormationOffset[] = [];
  for (let i = 0; i < count; i++) {
    const angle = i * 0.5;
    const radius = spacing * 0.5 + i * spacing * 0.2;
    offsets.push({ dx: Math.cos(angle) * radius, dy: Math.sin(angle) * radius });
  }
  return offsets;
}

function generateSwarm(count: number, radius: number): FormationOffset[] {
  const offsets: FormationOffset[] = [];
  for (let i = 0; i < count; i++) {
    offsets.push({
      dx: randomRange(-radius, radius),
      dy: randomRange(-radius, radius),
    });
  }
  return offsets;
}

function generateSnake(count: number, spacing: number): FormationOffset[] {
  const offsets: FormationOffset[] = [];
  for (let i = 0; i < count; i++) {
    offsets.push({ dx: Math.sin(i * 0.5) * spacing, dy: i * spacing * 0.6 });
  }
  return offsets;
}

function generateBossEscort(count: number, spacing: number): FormationOffset[] {
  const offsets: FormationOffset[] = [{ dx: 0, dy: 0 }]; // Boss center
  const escorts = count - 1;
  for (let i = 0; i < escorts; i++) {
    const angle = (Math.PI * 2 * i) / escorts;
    offsets.push({ dx: Math.cos(angle) * spacing, dy: Math.sin(angle) * spacing });
  }
  return offsets;
}

// =============================================
// Movement Path Functions
// =============================================

export interface PathState {
  centerX: number;
  centerY: number;
}

export type PathFn = (
  time: number,
  startX: number,
  startY: number,
  screenW: number,
  screenH: number,
  speed: number,
) => PathState;

export function getPathFunction(pattern: MovementPattern): PathFn {
  switch (pattern) {
    case MovementPattern.STRAIGHT: return pathStraight;
    case MovementPattern.ZIGZAG: return pathZigZag;
    case MovementPattern.SIN_WAVE: return pathSinWave;
    case MovementPattern.DOUBLE_SIN: return pathDoubleSin;
    case MovementPattern.CIRCULAR_ORBIT: return pathCircularOrbit;
    case MovementPattern.FIGURE_EIGHT: return pathFigureEight;
    case MovementPattern.SPIRAL_DESCENT: return pathSpiralDescent;
    case MovementPattern.RANDOM_DRIFT: return pathRandomDrift;
    case MovementPattern.DIVE_ATTACK: return pathDiveAttack;
    case MovementPattern.SWARM_AI: return pathSwarmAI;
    case MovementPattern.ORBIT_THEN_DIVE: return pathOrbitThenDive;
    default: return pathStraight;
  }
}

function pathStraight(t: number, sx: number, sy: number, _sw: number, _sh: number, spd: number): PathState {
  return { centerX: sx, centerY: sy + t * spd * 50 };
}

function pathZigZag(t: number, sx: number, sy: number, sw: number, _sh: number, spd: number): PathState {
  const amplitude = sw * 0.2;
  return { centerX: sx + Math.sin(t * 1.5) * amplitude, centerY: sy + t * spd * 40 };
}

function pathSinWave(t: number, sx: number, sy: number, sw: number, _sh: number, spd: number): PathState {
  return { centerX: sx + Math.sin(t * 2) * sw * 0.15, centerY: sy + t * spd * 35 };
}

function pathDoubleSin(t: number, sx: number, sy: number, sw: number, _sh: number, spd: number): PathState {
  const x = Math.sin(t * 1.5) * sw * 0.1 + Math.sin(t * 3.7) * sw * 0.05;
  return { centerX: sx + x, centerY: sy + t * spd * 30 };
}

function pathCircularOrbit(t: number, sx: number, sy: number, sw: number, _sh: number, spd: number): PathState {
  const radius = sw * 0.15;
  return { centerX: sx + Math.cos(t * 1.2) * radius, centerY: sy + Math.sin(t * 1.2) * radius * 0.5 + t * spd * 15 };
}

function pathFigureEight(t: number, sx: number, sy: number, sw: number, _sh: number, spd: number): PathState {
  const scale = sw * 0.12;
  return { centerX: sx + Math.sin(t * 1.5) * scale, centerY: sy + Math.sin(t * 3) * scale * 0.4 + t * spd * 20 };
}

function pathSpiralDescent(t: number, sx: number, sy: number, _sw: number, _sh: number, spd: number): PathState {
  const radius = Math.max(10, 120 - t * 20);
  return { centerX: sx + Math.cos(t * 2) * radius, centerY: sy + Math.sin(t * 2) * radius * 0.3 + t * spd * 30 };
}

function pathRandomDrift(t: number, sx: number, sy: number, _sw: number, _sh: number, spd: number): PathState {
  // Perlin-like noise approximation using multiple sine waves
  const x = Math.sin(t * 0.7 + 1.3) * 80 + Math.sin(t * 1.7 + 4.1) * 40;
  const y = Math.cos(t * 0.5 + 2.7) * 30;
  return { centerX: sx + x, centerY: sy + y + t * spd * 25 };
}

function pathDiveAttack(t: number, sx: number, sy: number, _sw: number, sh: number, spd: number): PathState {
  // Slow horizontal entry, then sudden dive
  const diveTime = 3;
  if (t < diveTime) {
    return { centerX: sx + Math.sin(t * 2) * 60, centerY: sy + t * spd * 15 };
  }
  const dt = t - diveTime;
  return { centerX: sx + Math.sin(diveTime * 2) * 60, centerY: sy + diveTime * spd * 15 + dt * spd * 120 };
}

function pathSwarmAI(t: number, sx: number, sy: number, _sw: number, _sh: number, spd: number): PathState {
  const jitterX = Math.sin(t * 3.1 + sx * 0.01) * 50 + Math.cos(t * 5.3) * 20;
  const jitterY = Math.cos(t * 2.7 + sy * 0.01) * 30;
  return { centerX: sx + jitterX, centerY: sy + jitterY + t * spd * 20 };
}

function pathOrbitThenDive(t: number, sx: number, sy: number, sw: number, _sh: number, spd: number): PathState {
  const orbitDuration = 4;
  if (t < orbitDuration) {
    const radius = sw * 0.12;
    return { centerX: sx + Math.cos(t * 2) * radius, centerY: sy + Math.sin(t * 2) * radius * 0.4 + t * spd * 10 };
  }
  const dt = t - orbitDuration;
  const lastX = sx + Math.cos(orbitDuration * 2) * sw * 0.12;
  const lastY = sy + Math.sin(orbitDuration * 2) * sw * 0.12 * 0.4 + orbitDuration * spd * 10;
  return { centerX: lastX, centerY: lastY + dt * spd * 100 };
}
