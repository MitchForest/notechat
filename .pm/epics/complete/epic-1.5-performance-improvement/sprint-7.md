# Sprint 7: Tiered Checking and UX Refinements

This sprint focuses on moving away from a naive "check on every change" model to a more intelligent, tiered system that provides a superior user experience and improves performance. We will also clean up legacy code from previous architectures.

## User Stories & Tasks

### 1. Implement Debounced Checking on Paragraphs
- **User Story:** As a user, I want the editor to wait until I've paused typing before running a full check, so the interface feels more responsive.
- **Task:** Refactor the `EditorService`'s `handleDocChange` method to use `debounce`. When a document change occurs, it will wait for a 200-300ms pause before initiating the check on the changed paragraph.

### 2. Implement Boundary-Based Triggers
- **User Story:** As a user, I want instant feedback on my spelling as soon as I finish typing a word, and on grammar when I finish a sentence.
- **Task 1:** Enhance the `EditorService` to detect when a user types a word boundary (space, tab) or a sentence boundary (period, question mark, etc.).
- **Task 2:** Upon detecting a boundary, trigger a check with a specific "scope" ('word' or 'sentence').

### 3. Create Scoped Worker Checks
- **User Story:** As a developer, I want the grammar worker to perform only the necessary checks based on the trigger, to maximize performance.
- **Task 1:** Modify the `grammar.worker.ts` message handler to accept a `scope` parameter in its `check` command.
- **Task 2:** Refactor the `createProcessor` function in the worker to dynamically build the `unified` pipeline, including only the plugins that are relevant to the requested scope (e.g., only `retext-spell` for a 'word' scope).

### 4. Simplify the Error Registry
- **User Story:** As a developer, I want to simplify the codebase by removing obsolete logic.
- **Task:** Refactor the `ErrorRegistry` to remove all logic related to "tentative" vs. "confirmed" errors and the priority system. The registry will now only manage a single list of confirmed errors.

### 5. Refactor Bulk Paste Logic
- **User Story:** As a user, I want all my grammar and spelling errors to be correctly identified when I paste a large amount of text.
- **Task:** Refactor the `checkBulk` and `performProgressiveCheck` methods to send the original, intact text chunks to the worker instead of a jumbled list of unique words. This will ensure contextual grammar rules work correctly on pasted content. 