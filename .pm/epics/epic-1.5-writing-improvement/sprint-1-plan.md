# Sprint 1 Plan: Foundational Refactor

**Goal**: To refactor the core checking mechanism from a full-document approach to a more granular, paragraph-based system. This sprint focuses on building a stable and maintainable foundation for future performance enhancements.

---

## Key Stories & Technical Tasks

### 1. Story: Introduce a Centralized Error Registry

**User Problem**: As a developer, I need a single, reliable source of truth for all active errors in the document to prevent duplicate errors and simplify state management.

**Technical Implementation:**

1.  **Create `ErrorRegistry.ts`**:
    *   In `features/editor/services/`, create a new file for an `ErrorRegistry` class.
    *   This class will use a `Map` to store errors, keyed by a unique ID generated for each error (e.g., combining paragraph ID and character offsets).
    *   Implement public methods:
        *   `add(paragraphId: string, errors: TextError[])`: Adds errors for a specific paragraph.
        *   `remove(errorId: string)`: Removes a single error by its unique ID.
        *   `clearParagraph(paragraphId: string)`: Removes all errors associated with a specific paragraph.
        *   `getErrors()`: Returns a flat array of all error objects currently in the registry.
        *   `clearAll()`: Empties the entire registry.

2.  **Integrate `ErrorRegistry` with `DecorationManager`**:
    *   In `DecorationManager.ts`, replace the internal `errors` array with an instance of the `ErrorRegistry`. This registry will be passed in during the extension's initialization.
    *   The `decorations` prop will be modified to get its data from `this.storage.registry.getErrors()`.
    *   This change decouples the rendering of decorations from the state management of errors.

---

### 2. Story: Implement Paragraph-Based Checking

**User Problem**: As a user with a large document, I want the application to remain fast and responsive, without lagging after I make an edit.

**Technical Implementation:**

1.  **Refactor `EditorService.ts`**:
    *   In the constructor, instantiate the new `ErrorRegistry` and configure the `DecorationManager` extension to use it.
    *   Overhaul the `setupEventListeners` method. The `'update'` listener will now be much more intelligent:
        *   It will inspect the ProseMirror transaction (`tr`) to identify which nodes have changed.
        *   For each changed paragraph, it will call `registry.clearParagraph(paragraphId)` to remove stale errors.
        *   It will then dispatch a check request to the `CheckOrchestrator` containing the **new text of only the changed paragraph** and a unique ID for that paragraph.

2.  **Refactor `CheckOrchestrator.ts`**:
    *   Modify the `check` method to accept a paragraph's text and its unique ID.
    *   The message sent to the `grammar.worker.ts` will now include this paragraph ID.
    *   The `'results'` event emitted by the orchestrator will now include the paragraph ID alongside the array of found errors, so the `EditorService` knows which paragraph the results belong to.

3.  **Update the `EditorService` "results" listener**:
    *   The listener for the `'results'` event will now receive errors associated with a specific paragraph ID.
    *   It will call `registry.add(paragraphId, errors)` to add the new, confirmed errors to the registry.
    *   Finally, it must dispatch a new, empty transaction with a meta flag (e.g., `setMeta('updated_errors', true)`) to force the `DecorationManager` to re-render its decorations from the updated registry. 