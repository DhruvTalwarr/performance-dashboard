export function formatBytes(bytes?: number): string {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return 'N/A';
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  return `${ms.toFixed(2)}ms`;
}

// Estimates memory footprint of data objects for UI visualization when browser API is unsupported
export function estimateMemoryUsage(objectCount: number): number {
  // An average Javascript object with 5 properties takes roughly 80-120 bytes depending on V8 packing.
  // We'll approximate 100 bytes per DataPoint.
  return objectCount * 120;
}

export class PerformanceTracker {
  private lastTime = 0;
  private frames = 0;
  private fps = 60;
  private lastFpsUpdate = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.lastTime = performance.now();
      this.lastFpsUpdate = this.lastTime;
    }
  }

  tick(now: number = performance.now()): number {
    this.frames++;
    const delta = now - this.lastFpsUpdate;

    if (delta >= 1000) {
      this.fps = Math.round((this.frames * 1000) / delta);
      this.frames = 0;
      this.lastFpsUpdate = now;
    }

    return this.fps;
  }

  getFps(): number {
    return this.fps;
  }

  getMemory(): { usedJSHeapSize: number; jsHeapSizeLimit: number } | null {
    if (typeof window !== 'undefined' && (window.performance as any).memory) {
      const mem = (window.performance as any).memory;
      return {
        usedJSHeapSize: mem.usedJSHeapSize,
        jsHeapSizeLimit: mem.jsHeapSizeLimit,
      };
    }
    return null;
  }
}
