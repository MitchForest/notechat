/**
 * A service for monitoring the performance of the spell and grammar checking system.
 */
export class PerformanceMonitor {
  private metrics = {
    // Stores durations of various timed operations.
    operationTimes: new Map<string, number[]>(),
    cacheHits: 0,
    cacheMisses: 0,
  };

  private timers = new Map<string, number>();

  /**
   * Starts a timer for a named operation.
   * @param operation The name of the operation to time (e.g., 'workerCheck').
   * @returns A unique ID for this specific timer instance.
   */
  public startTimer(operation: string): string {
    const id = `${operation}-${performance.now()}-${Math.random()}`;
    this.timers.set(id, performance.now());
    return id;
  }

  /**
   * Ends a timer and records the duration.
   * @param id The unique ID returned by `startTimer`.
   */
  public endTimer(id: string): void {
    const startTime = this.timers.get(id);
    if (!startTime) return;

    const duration = performance.now() - startTime;
    const operation = id.split('-')[0];

    if (!this.metrics.operationTimes.has(operation)) {
      this.metrics.operationTimes.set(operation, []);
    }
    
    const times = this.metrics.operationTimes.get(operation)!;
    times.push(duration);

    // Keep only the last 100 measurements to avoid memory leaks.
    if (times.length > 100) {
      times.shift();
    }

    this.timers.delete(id);

    // Log a warning for slow operations.
    if (duration > 150) {
      console.warn(`[PerformanceMonitor] Slow operation '${operation}' took ${duration.toFixed(2)}ms`);
    }
  }

  public recordCacheHit(): void {
    this.metrics.cacheHits++;
  }

  public recordCacheMiss(): void {
    this.metrics.cacheMisses++;
  }

  /**
   * Calculates and returns the current performance statistics.
   */
  public getStats(): Record<string, any> {
    const stats: Record<string, any> = {
      averageTimes: {},
      cache: {
        hits: this.metrics.cacheHits,
        misses: this.metrics.cacheMisses,
        hitRate: '0.0%',
      },
    };

    const totalCacheChecks = this.metrics.cacheHits + this.metrics.cacheMisses;
    if (totalCacheChecks > 0) {
      const hitRate = (this.metrics.cacheHits / totalCacheChecks) * 100;
      stats.cache.hitRate = `${hitRate.toFixed(1)}%`;
    }

    for (const [operation, times] of this.metrics.operationTimes.entries()) {
      if (times.length > 0) {
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        stats.averageTimes[operation] = `${avg.toFixed(2)}ms (avg of last ${times.length} runs)`;
      }
    }

    return stats;
  }

  /**
   * Logs a formatted report of the current stats to the console.
   */
  public logReport(): void {
    console.log(`----- Performance Report -----`);
    console.table(this.getStats());
  }
}

// Export a singleton instance so the entire application shares the same monitor.
export const performanceMonitor = new PerformanceMonitor(); 