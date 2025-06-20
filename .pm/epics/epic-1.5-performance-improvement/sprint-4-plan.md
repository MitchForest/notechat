# Sprint 4 Plan: Deduplication & Error Registry

**Goal**: To prevent duplicate error checking and the display of overlapping errors. This will make the system more efficient by avoiding redundant work and will improve the user experience by showing only the most relevant error for a given piece of text.

---

## Key Stories & Technical Tasks

### 1. Story: Implement Advanced Error Deduplication

**User Problem**: As a user, I don't want to see multiple highlights for the exact same error. As a developer, I want to avoid storing redundant error data and have a clear system for resolving conflicts when multiple potential errors overlap.

**Technical Implementation:**

1.  **Enhance `ErrorRegistry.ts`**:
    *   Refactor the `ErrorRegistry` to handle more sophisticated deduplication.
    *   Implement a `calculatePriority` method to resolve conflicts. For example, a high-confidence spelling error from the worker should replace a low-confidence "tentative" error from the `InstantChecker`.
    *   The `addError` (or equivalent) method will become the central point for this logic, deciding whether to add a new error, replace an existing one, or skip a duplicate based on position and priority.

---

### 2. Story: Avoid Re-Checking Known Words Across Paragraphs

**User Problem**: As a developer, I want to prevent the system from sending the same word to the worker for checking over and over again if it appears in multiple paragraphs.

**Technical Implementation:**

1.  **Upgrade `CheckOrchestrator.ts`**:
    *   Add a `checkedWords` map to the orchestrator to keep track of words that have already been fully processed by the worker across the entire document.
    *   When a paragraph check is initiated, the orchestrator will identify words that are already in `checkedWords`.
    *   It will pass a `skipWords` array to the Web Worker containing the list of words to ignore for this check.
2.  **Update `grammar.worker.ts`**:
    *   Modify the worker's `check` function to accept the `skipWords` list.
    *   Inside the worker, the `retext-spell` plugin will be configured with an `ignore` list, populated by `skipWords`, to prevent it from flagging words we have already confirmed are correct or have specific known errors.

---

### 3. Story: Optimize Bulk Content Checking (for Pasted Text)

**User Problem**: As a user, when I paste a large amount of text, I expect the application to check it for errors quickly without getting bogged down by redundant processing of common words.

**Technical Implementation:**

1.  **Implement Batch Deduplication**:
    *   Create a new method within the `CheckOrchestrator` for handling bulk text analysis.
    *   This "batch checker" will receive a large string (e.g., from a paste event).
    *   It will first extract all *unique* words from the string into a `Map`.
    *   Then, it will iterate over only the unique words and send those to the worker for checking.
    *   Finally, it will apply the resulting errors to all instances of those words in the original pasted text.
2.  **Integrate with `EditorService.ts`**:
    *   The paste-handling logic in `EditorService` will be updated to call this new batch-checking mechanism for large pastes, ensuring efficiency. 