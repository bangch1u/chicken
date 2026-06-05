// =============================================
// Spatial Hash Grid — O(N) Collision Detection
// =============================================

export interface Collidable {
  x: number;
  y: number;
  radius: number;
  active: boolean;
  collisionGroup: string; // 'player' | 'playerBullet' | 'enemy' | 'enemyBullet' | 'pickup'
}

export class SpatialHashGrid {
  private cellSize: number;
  private grid: Map<string, Collidable[]> = new Map();

  constructor(cellSize: number = 64) {
    this.cellSize = cellSize;
  }

  private getKey(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  clear(): void {
    this.grid.clear();
  }

  insert(entity: Collidable): void {
    const minCX = Math.floor((entity.x - entity.radius) / this.cellSize);
    const maxCX = Math.floor((entity.x + entity.radius) / this.cellSize);
    const minCY = Math.floor((entity.y - entity.radius) / this.cellSize);
    const maxCY = Math.floor((entity.y + entity.radius) / this.cellSize);

    for (let cx = minCX; cx <= maxCX; cx++) {
      for (let cy = minCY; cy <= maxCY; cy++) {
        const key = this.getKey(cx, cy);
        if (!this.grid.has(key)) {
          this.grid.set(key, []);
        }
        this.grid.get(key)!.push(entity);
      }
    }
  }

  query(entity: Collidable, targetGroup: string): Collidable[] {
    const results: Collidable[] = [];
    const checked = new Set<Collidable>();

    const minCX = Math.floor((entity.x - entity.radius) / this.cellSize);
    const maxCX = Math.floor((entity.x + entity.radius) / this.cellSize);
    const minCY = Math.floor((entity.y - entity.radius) / this.cellSize);
    const maxCY = Math.floor((entity.y + entity.radius) / this.cellSize);

    for (let cx = minCX; cx <= maxCX; cx++) {
      for (let cy = minCY; cy <= maxCY; cy++) {
        const cell = this.grid.get(this.getKey(cx, cy));
        if (!cell) continue;

        for (const other of cell) {
          if (other === entity || !other.active || other.collisionGroup !== targetGroup || checked.has(other)) continue;
          checked.add(other);

          // Circle-circle collision
          const dx = entity.x - other.x;
          const dy = entity.y - other.y;
          const distSq = dx * dx + dy * dy;
          const radSum = entity.radius + other.radius;
          
          if (distSq <= radSum * radSum) {
            results.push(other);
          }
        }
      }
    }

    return results;
  }
}
