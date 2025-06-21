# Sprint 9: Final Polish and Refinements

This sprint is the final step in hardening the spell-check system. It focuses on fixing the last remaining logic bug, removing dead code, and improving code clarity and maintainability. All changes will be executed with surgical precision as defined in each task.

## Task 1: Critical Bug Fix - Overhaul Custom Capitalization Rule

-   **Objective:** Fix the long-standing bug where sentences in the middle of a paragraph are not correctly checked for capitalization.
-   **File to Modify:** `features/editor/workers/custom-rules.ts`
-   **Method to Modify:** `customCapitalizationRule`
-   **Surgical Change:** The current logic for finding the "first word" of a sentence is brittle. It will be replaced with a more robust implementation that correctly handles all variations of leading whitespace and punctuation nodes returned by the parser, ensuring the rule is applied consistently to every sentence.

## Task 2: Code Cleanup - Simplify the `ErrorRegistry`

-   **Objective:** Remove dead code related to the obsolete "tentative error" system.
-   **File to Modify:** `features/editor/services/ErrorRegistry.ts`
-   **Surgical Change:** This task will involve the precise removal of the `addTentative` method, the `calculatePriority` method, and the `status` and `priority` properties from the `RegisteredError` type. No other logic will be touched.

## Task 3: UX Refinement - Consolidate `DecorationManager`

-   **Objective:** Improve code clarity by renaming the decoration management file to reflect its actual purpose.
-   **File to Modify:** `features/editor/services/DecorationManager.ts`
-   **Surgical Change:** The file `DecorationManager.ts` will be renamed to `SpellCheckExtension.ts`. The name of the exported extension (`SpellCheckExtension`) will remain the same. This is purely a structural improvement for readability.

## Task 4: Code Cleanup - Streamline Boundary Check Logic

-   **Objective:** Reduce code duplication in the `EditorService` by creating a more generic text extraction method.
-   **File to Modify:** `features/editor/services/EditorService.ts`
-   **Surgical Change:** The two methods `extractWordBefore` and `extractSentenceBefore` will be removed. They will be replaced by a single, more efficient method, `extractTextBefore(position, boundaryRegex)`, that performs the same function, making the code cleaner and easier to maintain. 