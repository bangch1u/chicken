// =============================================
// Generic Object Pool — Zero GC during gameplay
// =============================================

export interface Poolable {
  active: boolean;
  reset(): void;
}

export class ObjectPool<T extends Poolable> {
  private pool: T[] = [];
  private activeCount = 0;
  private readonly factory: () => T;
  private readonly maxSize: number;

  constructor(factory: () => T, initialSize: number, maxSize: number) {
    this.factory = factory;
    this.maxSize = maxSize;
    
    // Pre-allocate
    for (let i = 0; i < initialSize; i++) {
      const obj = this.factory();
      obj.active = false;
      this.pool.push(obj);
    }
  }

  get(): T | null {
    // Find an inactive object
    for (let i = 0; i < this.pool.length; i++) {
      if (!this.pool[i].active) {
        this.pool[i].active = true;
        this.activeCount++;
        return this.pool[i];
      }
    }

    // Grow the pool if under max
    if (this.pool.length < this.maxSize) {
      const obj = this.factory();
      obj.active = true;
      this.pool.push(obj);
      this.activeCount++;
      return obj;
    }

    return null; // Pool exhausted
  }

  release(obj: T): void {
    if (obj.active) {
      obj.active = false;
      obj.reset();
      this.activeCount--;
    }
  }

  releaseAll(): void {
    for (const obj of this.pool) {
      if (obj.active) {
        obj.active = false;
        obj.reset();
      }
    }
    this.activeCount = 0;
  }

  forEachActive(callback: (obj: T, index: number) => void): void {
    let idx = 0;
    for (let i = 0; i < this.pool.length; i++) {
      if (this.pool[i].active) {
        callback(this.pool[i], idx++);
      }
    }
  }

  getActiveCount(): number {
    return this.activeCount;
  }

  getTotalSize(): number {
    return this.pool.length;
  }
}
