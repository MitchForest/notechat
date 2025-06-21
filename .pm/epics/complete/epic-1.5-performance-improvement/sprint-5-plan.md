# Sprint 5 Plan: Paste & Bulk Operations

**Goal**: To handle paste, drop, and other bulk text-insertion operations efficiently and intelligently, ensuring a smooth user experience without UI freezes.

---

## Key Stories & Technical Tasks

### 1. Story: Detect Paste and Drop Events in the Editor

**User Problem**: As a user, when I paste or drop text into the editor, I expect the application to recognize this specific action and handle it appropriately.

**Technical Implementation:**

1.  **Enhance `EditorService.ts`**:
    *   Utilize the `editorProps` in the Tiptap editor configuration.
    *   Implement the `handlePaste` and `handleDrop` callbacks.
    *   Inside these callbacks, extract the text content from the event's `slice`.
    *   If the text content is larger than a certain threshold (e.g., 50 characters), delegate the content to a new `handleBulkInsert` method.
    *   Crucially, return `false` from these handlers to allow Prosemirror to perform the actual paste/drop operation into the document.

---

### 2. Story: Implement Progressive Checking for Large Content

**User Problem**: As a user, when I paste a very large document, I don't want the UI to freeze. I'd rather see errors appear progressively than have the entire application lock up.

**Technical Implementation:**

1.  **Create `handleBulkInsert` in `EditorService.ts`**:
    *   This method will act as a router for bulk operations. It will check the length of the incoming content.
    *   If the content is over a large threshold (e.g., 500 characters), it will call a new `performProgressiveCheck` method. Otherwise, it will call the `checkBulk` method on the orchestrator for immediate processing.
2.  **Create `performProgressiveCheck` in `EditorService.ts`**:
    *   This `async` method will be responsible for chunking the large content. It will split the text into smaller pieces (e.g., 500 characters each).
    *   It will **immediately** send the first chunk to the `CheckOrchestrator` to provide quick initial feedback.
    *   It will then iterate through the remaining chunks, using a `setTimeout` to stagger the requests by ~150ms each. This prevents overwhelming the check queue and keeps the UI responsive.

---

### 3. Story: Implement Smart, Heuristic-Based Paste Detection

**User Problem**: As a developer, I need a reliable way to detect bulk inserts that might not come from a standard paste event, ensuring our performance optimizations are always applied.

**Technical Implementation:**

1.  **Create `ChangeDetector.ts` Service**:
    *   Create a new file and class at `features/editor/services/ChangeDetector.ts`.
    *   The class will have a `detectChangeType(transaction)` method.
    *   This method will analyze the transaction's steps to determine the total number of characters inserted.
    *   It will use a simple heuristic: if a large number of characters (e.g., > 50) are inserted contiguously, it will classify the change as a `'paste'`. Otherwise, it's `'typing'`.
2.  **Integrate `ChangeDetector` into `EditorService.ts`**:
    *   The `handleDocChange` method in the `EditorService` will be refactored.
    *   It will use the `ChangeDetector` to identify the change type.
    *   If the change is identified as a `paste`, `handleDocChange` will **not** run its normal paragraph-by-paragraph check, as the operation will have already been handled by the more efficient `handlePaste` -> `handleBulkInsert` flow. This avoids redundant work.
    *   This new detector makes the logic cleaner and more robust than using a temporary flag. 