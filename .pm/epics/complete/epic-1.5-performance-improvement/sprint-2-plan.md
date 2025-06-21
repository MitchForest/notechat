# Sprint 2 Plan: Smart Caching System

**Goal**: To eliminate redundant processing by implementing a multi-layered caching system. This will make the application feel instantaneous when editing or undoing changes to previously checked content.

---

## Key Stories & Technical Tasks

### 1. Story: Implement an LRU Cache for Paragraphs

**User Problem**: As a user, when I undo a change or re-type something I just deleted, the application should not re-check the content, and error highlights should reappear instantly.

**Technical Implementation:**

1.  **Install `lru-cache`**: Add the `lru-cache` library to the project's dependencies to handle efficient, memory-limited caching.
2.  **Upgrade `CheckOrchestrator.ts`**:
    *   Import and instantiate an `LRUCache`. It will be configured to store a maximum of **500** paragraph results with a **10-minute** time-to-live (TTL).
    *   Modify the `check()` method to be cache-aware:
        *   Before queuing a check, generate a unique `cacheKey` from the paragraph's text content (a simple hash will suffice).
        *   Attempt to retrieve a result from `paragraphCache.get(cacheKey)`.
        *   **If a cached result exists (a "cache hit")**:
            *   Immediately emit the `'results'` event with the cached error data.
            *   Do **not** send the request to the Web Worker.
        *   **If no cached result exists (a "cache miss")**:
            *   Proceed with sending the check request to the worker as normal.
            *   When the worker returns a result, use `paragraphCache.set(cacheKey, result)` to store the new result before emitting the `'results'` event.

---

### 2. Story: Implement Basic Performance Monitoring

**User Problem**: As a developer, I need to verify that the caching system is working effectively and measure its impact.

**Technical Implementation:**

1.  **Enhance `CheckOrchestrator.ts`**:
    *   Create a simple private object, `stats`, to track key metrics: `cacheHits`, `cacheMisses`, and `totalChecks`.
    *   Increment these counters appropriately within the `check()` method logic (e.g., `this.stats.cacheHits++` on a cache hit).
    *   Create a helper method, `getCacheHitRate()`, that calculates and returns the hit rate as a formatted percentage string.
    *   Add `console.log` statements to announce cache hits and misses, including the current hit rate. This provides real-time feedback during development.

---

### 3. Story: Implement a Word-Level Cache (Optional Stretch Goal)

**User Problem**: As a developer, I want to explore further optimizations by caching results for individual words, especially very common ones.

**Technical Implementation:**

1.  **Extend `CheckOrchestrator.ts`**:
    *   Instantiate a second `LRUCache` for words, configured with a larger capacity (e.g., 10,000 words) and a longer TTL.
2.  **Pre-warm the Word Cache**:
    *   Create a `warmCache()` method that can be called during initialization.
    *   This method will populate the `wordCache` with a predefined list of common, correctly-spelled English words and known common misspellings and their corrections.
3.  **Integrate Word Cache into Worker (Advanced)**:
    *   This would involve modifying the `grammar.worker.ts` to first check the `wordCache` (passed during initialization) for each word before running the more expensive `retext-spell` analysis. This is a more complex task and is suitable as a stretch goal if time permits. 