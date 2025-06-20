# Sprint 6 Plan: Performance Monitoring & Optimization

**Goal**: To add instrumentation to the spell-check system to measure its performance in real-time and to identify any remaining bottlenecks for future optimization.

---

## Key Stories & Technical Tasks

### 1. Story: Implement a Performance Monitoring Service

**User Problem**: As a developer, I need to see key performance metrics of the system in real-time so I can verify the impact of my optimizations and make data-driven decisions.

**Technical Implementation:**

1.  **Create `PerformanceMonitor.ts` Service**:
    *   Create a new file at `features/editor/services/PerformanceMonitor.ts`.
    *   The `PerformanceMonitor` class will be a singleton or a centrally managed instance.
    *   It will contain methods for tracking key metrics:
        *   `startTimer(operation: string): string`: Starts a timer for a named operation and returns a unique ID.
        *   `endTimer(id: string)`: Ends the timer and records the duration for the operation.
        *   `recordCacheHit()` / `recordCacheMiss()`: Increments counters for cache performance.
        *   `getStats()`: Returns a formatted object with key metrics like average check times, cache hit rate, etc.
        *   `logReport()`: A helper method to `console.table` the current performance stats for easy debugging.

---

### 2. Story: Instrument the `CheckOrchestrator`

**User Problem**: As a developer, I need to measure the core performance of the checking pipeline, including cache hits and the time it takes for the worker to return a result.

**Technical Implementation:**

1.  **Integrate `PerformanceMonitor` into `CheckOrchestrator.ts`**:
    *   Instantiate or receive an instance of the `PerformanceMonitor`.
    *   **Cache Measurement**: In the `check` and `checkBulk` methods, call `performanceMonitor.recordCacheHit()` or `recordCacheMiss()` accordingly.
    *   **Check Duration**:
        *   When a check is sent to the worker, call `performanceMonitor.startTimer('workerCheck')`.
        *   When the result is received from the worker in `handleWorkerMessage`, call `performanceMonitor.endTimer()` with the corresponding ID.
    *   **Reporting**: Add a `setInterval` in the `CheckOrchestrator`'s constructor to call `performanceMonitor.logReport()` every 30-60 seconds, so performance stats are periodically logged to the console during development.

---

### 3. Story: Instrument High-Frequency Editor Events

**User Problem**: As a developer, I need to ensure that the client-side logic, especially the instant checker, is not introducing any UI lag.

**Technical Implementation:**

1.  **Integrate `PerformanceMonitor` into `EditorService.ts`**:
    *   Instantiate or receive an instance of the `PerformanceMonitor`.
    *   **Instant Check Speed**: Wrap the call to `this.instantChecker.check()` inside `handleRealtimeChecks` with `startTimer('instantCheck')` and `endTimer()`. This will measure the performance of our fastest, most frequent check.
    *   **Decoration Update Time**: Wrap the `this.editor.view.dispatch(...)` call that updates decorations in a timer to measure how long it takes Prosemirror to apply the error highlights.

This final sprint will provide us with the visibility needed to confirm the success of our previous work and guide any future performance tuning. 