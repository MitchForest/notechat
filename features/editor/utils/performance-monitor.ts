// features/editor/utils/performance-monitor.ts
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()
  
  measure<T>(name: string, fn: () => T): T {
    const start = performance.now()
    const result = fn()
    const duration = performance.now() - start
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    const metricArray = this.metrics.get(name)!
    metricArray.push(duration)
    
    // Keep last 100 measurements
    if (metricArray.length > 100) {
      metricArray.shift()
    }
    
    // Log if slow
    if (duration > 50) {
      console.warn(`Slow ${name}: ${duration.toFixed(2)}ms`)
    }
    
    return result
  }
  
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    const result = await fn()
    const duration = performance.now() - start
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    const metricArray = this.metrics.get(name)!
    metricArray.push(duration)
    
    // Keep last 100 measurements
    if (metricArray.length > 100) {
      metricArray.shift()
    }
    
    // Log if slow
    if (duration > 50) {
      console.warn(`Slow ${name}: ${duration.toFixed(2)}ms`)
    }
    
    return result
  }
  
  getStats(name: string) {
    const metrics = this.metrics.get(name) || []
    if (metrics.length === 0) return null
    
    const sorted = [...metrics].sort((a, b) => a - b)
    
    return {
      count: metrics.length,
      mean: metrics.reduce((a, b) => a + b, 0) / metrics.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      min: sorted[0],
      max: sorted[sorted.length - 1],
    }
  }
  
  logAllStats() {
    console.group("Performance Stats")
    for (const [name, _] of this.metrics) {
      const stats = this.getStats(name)
      if (stats) {
        console.log(`${name}:`, {
          mean: `${stats.mean.toFixed(2)}ms`,
          p95: `${stats.p95.toFixed(2)}ms`,
          p99: `${stats.p99.toFixed(2)}ms`,
        })
      }
    }
    console.groupEnd()
  }
} 