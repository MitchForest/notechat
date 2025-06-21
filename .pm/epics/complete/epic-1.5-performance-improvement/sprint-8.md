# Sprint 8: Surgical Refinements and Cleanup

This sprint is dedicated to addressing critical bugs and technical debt with surgical precision. Each task is narrowly scoped to a specific file and method to eliminate the risk of unintended side effects. No changes will be made outside the explicit scope of these tasks.

## Task 1: Critical Bug Fix - Correct `applySuggestion` Logic

-   **Objective:** Fix the broken "apply suggestion" functionality.
-   **File to Modify:** `features/editor/services/DecorationManager.ts`
-   **Method to Modify:** `applySuggestion`
-   **Surgical Change:** The current implementation incorrectly calculates the error position using a stale `paragraphStartPos` variable. The fix will be to **remove this logic entirely**. The method will be updated to use the error's absolute `start` and `end` properties directly from the error object, which are already in the correct document-level coordinate space. No other part of the file will be touched.

## Task 2: UX Refinement - Implement "Merge" Logic for Errors

-   **Objective:** Eliminate the UI "flash" when an identical error is found by multiple checks.
-   **File to Modify:** `features/editor/services/ErrorRegistry.ts`
-   **Method to Modify:** `updateErrorsForRange`
-   **Surgical Change:** The current logic clears a range and adds new errors. This will be changed to a more intelligent "merge". Before adding a new error, the method will first check if an absolutely identical error (same start, end, and ruleId) already exists in the registry. If it does, the new error will be discarded, and the existing one will be preserved. This prevents the decoration from being re-rendered unnecessarily.

## Task 3: Code Cleanup - Remove Diagnostic Logging

-   **Objective:** Remove all temporary `console.log` statements from the codebase.
-   **Files to Modify:**
    -   `features/editor/services/EditorService.ts`
    -   `features/editor/services/CheckOrchestrator.ts`
    -   `features/editor/services/ChangeDetector.ts`
-   **Surgical Change:** This task is strictly limited to deleting `console.log` statements that were added for debugging purposes. **No other code or logic will be altered in any way.** This will be performed as a distinct step after the functionality in Tasks 1 and 2 is confirmed to be working correctly. 