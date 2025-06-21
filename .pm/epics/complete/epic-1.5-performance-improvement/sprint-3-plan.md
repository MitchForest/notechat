# Sprint 3 Plan: Instant Word Checking

**Goal**: To provide immediate visual feedback for common typos as the user types, without waiting for the debounce/worker cycle. This will be achieved through a two-phase system: an instant, pattern-based check, followed by an authoritative worker-based confirmation.

---

## Key Stories & Technical Tasks

### 1. Story: Detect Word Completions in Real-Time

**User Problem**: As a user, I want the application to recognize when I've finished typing a word so it can be checked instantly.

**Technical Implementation:**

1.  **Enhance `EditorService.ts`**:
    *   In the `editor.on('update', ...)` handler, add new logic that runs *before* the paragraph-based checking.
    *   This logic will inspect the transaction to see if the user just typed a "word boundary" character (e.g., a space, comma, period).
    *   If a word boundary is detected, it will extract the text of the word that was just completed.
    *   It will then pass this word and its position information to a new "instant check" service.

---

### 2. Story: Create a High-Speed, Pattern-Based Checker

**User Problem**: As a developer, I need a synchronous, extremely fast checking mechanism that can identify the most common typos without the overhead of the Web Worker.

**Technical Implementation:**

1.  **Create `InstantChecker.ts`**:
    *   In `features/editor/services/`, create a new file for an `InstantChecker` class.
    *   This class will **not** be asynchronous and will **not** use the worker.
    *   It will contain a series of simple `Map` lookups and regular expressions to identify a curated list of high-confidence errors (e.g., `teh -> the`, `adn -> and`, repeated letters like `helllo`).
    *   It will have a single public method, `check(word: string)`, which will return either `null` (no error) or an error object containing a suggested correction and a confidence level (e.g., `'high'`).

---

### 3. Story: Implement Two-Phase Error Display

**User Problem**: As a user, I want to see instant feedback, but I also trust that the system will double-check the suggestion for accuracy.

**Technical Implementation:**

1.  **Refactor `EditorService.ts`**:
    *   Instantiate the new `InstantChecker`.
    *   When a completed word is detected (from Story 1), it will first be passed to `instantChecker.check()`.
    *   **If the instant check finds an error**:
        1.  Immediately call a new method on the `DecorationManager` to show a **"tentative"** error (e.g., a light, dotted underline).
        2.  *Simultaneously*, dispatch a full check for the containing paragraph to the `CheckOrchestrator` to get an authoritative result from the Web Worker.
2.  **Update the "results" listener in `EditorService.ts`**:
    *   When the authoritative result returns from the `CheckOrchestrator`, the logic will now be smarter. It will cross-reference the confirmed errors with any existing "tentative" errors for that paragraph.
    *   If a tentative error is confirmed by the worker, it will be "upgraded" to a standard, confirmed error highlight.
    *   If a tentative error was a false positive (not found by the worker), it will be removed.

### 4. Story: Support Tentative Decorations

**User Problem**: As a developer, I need the `DecorationManager` to visually distinguish between a high-confidence, worker-confirmed error and a lower-confidence, instant-checked error.

**Technical Implementation:**

1.  **Upgrade `DecorationManager.ts`**:
    *   The `ErrorRegistry` will be updated to support a `status` field on its error objects (e.g., `'tentative'` or `'confirmed'`).
    *   The decoration logic will be modified to read this `status`.
    *   It will apply a different CSS class based on the status (e.g., `class="error-wrapper--tentative"` vs. `class="error-wrapper--confirmed"`). This will allow for distinct styling (e.g., color, underline style) for the two error types. 