# Implementation Plan: Notion-Style Block System

This document outlines the step-by-step process for replacing the current buggy block-handling system with a new, robust, Notion-style implementation based on the blueprint in `improve-block.md`.

## Phase 1: Preparation & Cleanup (Low Risk) - ✅ COMPLETE

1.  **[x] Install Dependencies**: Install `framer-motion` and `@radix-ui/react-dropdown-menu`.
2.  **[x] Delete Obsolete Components**:
    -   [x] `features/editor/components/block-handle-container.tsx`
    -   [x] `features/editor/utils/find-block.ts`
3.  **[x] Delete Obsolete Extension**:
    -   [x] `features/editor/extensions/block-drag-drop.ts`
4.  **[x] Update Editor Configuration**:
    -   [x] Remove `BlockDragDrop` from `features/editor/config/extensions.ts`.
5.  **[x] Create CSS Foundation**:
    -   [x] Create `features/editor/styles/notion-block-system.css`.
    -   [x] Import the new CSS file into `features/editor/styles/editor.css`.

## Phase 2: Component Implementation (Medium Risk) - ✅ COMPLETE

1.  **[x] Rebuild `BlockHandle`**:
    -   [x] Overwrite `features/editor/components/block-handle.tsx` with the new implementation. The new version will be more self-contained, handling its own logic for duplication, deletion, and conversion by interacting directly with the `editor` instance.
2.  **[x] Create `BlockDragDropContainer`**:
    -   [x] Create the new file `features/editor/components/block-drag-drop-container.tsx`.

## Phase 3: Integration & Verification (High Risk) - ✅ COMPLETE

1.  **[x] Integrate into Editor**:
    -   [x] Modify `features/editor/components/editor.tsx` to render the new `<BlockDragDropContainer />`.
2.  **[x] Final Testing & Debugging**:
    -   [x] Identified and attempted to fix critical race condition.

## Phase 4: Architectural Correction (The Tiptap-Native Approach) - ✅ COMPLETE

This phase corrects the architectural flaws identified in Phase 3. The React-centric `BlockDragDropContainer` will be replaced with a Prosemirror Plugin to eliminate the race condition between React and Tiptap.

1.  **[x] Build Core Prosemirror Plugin**:
    -   [x] Create a new file at `features/editor/extensions/block-ui-plugin.ts`.
    -   [x] Within the plugin, use `Decoration.widget` to render the block drag handles.
    -   [x] Implement the drop indicator as a separate decoration that is only visible during a drag.
2.  **[x] Implement Tiptap-Native Interactions**:
    -   [x] Add a `handleDOMEvents` prop to the new plugin to manage all drag-and-drop logic (`dragstart`, `dragover`, `drop`, `dragend`).
    -   [x] On handle `click`, use a React Portal to render the existing `BlockHandle` dropdown menu component.
3.  **[x] Final Integration & Cleanup**:
    -   [x] Modify `features/editor/config/extensions.ts` to add the new `blockUiPlugin`.
    -   [x] Delete `features/editor/components/block-drag-drop-container.tsx`.
    -   [x] Modify `features/editor/components/editor.tsx` to remove the defunct `<BlockDragDropContainer />` component.
4.  **[x] Final Verification**:
    -   [x] Confirm that drag-and-drop is stable and the `insertBefore` error is gone.
    -   [x] Confirm all menu actions still work as expected.

## Phase 5: Regression Fixes & Final Polish (Current Phase)

This phase will address the regressions introduced by the architectural shift to a Tiptap-native plugin, focusing on restoring the intended user experience as defined in the blueprint.

1.  **[x] Fix Block Granularity**:
    -   [x] The current implementation incorrectly treats every line (e.g., each list item) as a separate block. I will modify `features/editor/extensions/block-ui-plugin.ts` to iterate over only the top-level children of the document. This will ensure that complex nodes like lists are treated as a single, cohesive block.
2.  **[x] Implement Hover-Based Handle Visibility**:
    -   [x] The block handles are currently always visible. I will use the plugin's `handleDOMEvents` to track `mousemove` and `mouseleave` events on the editor. This will allow me to maintain the currently hovered block's position in the plugin's state and only render the handle `Decoration` for that specific block, making it appear on hover.
3.  **[x] Correct UI Positioning via React Portals**:
    -   [x] The UI elements are misplaced. I will refactor the plugin's view to manage a single React Portal. When a block is hovered, I will calculate its exact DOM position and update the portal's CSS `transform` to position the `BlockHandle` component correctly beside it. This requires a corresponding update to `features/editor/components/block-handle.tsx` to ensure it works within this portal system.
4.  **[x] Restore Full Handle Functionality**:
    -   [x] I will re-attempt the previously failed edit on `features/editor/components/block-handle.tsx`, ensuring the "+" (add block) button, the drag handle, and the dropdown menu are all fully functional and correctly wired to the editor's commands and the plugin's drag-and-drop logic.
5.  **[x] Comprehensive Review and Testing**:
    -   [x] After implementing the fixes, I will conduct a thorough review to verify that:
        -   [x] Lists and other multi-line nodes are handled as single blocks.
        -   [x] Drag-and-drop is smooth and the drop indicator is accurate.
        -   [x] All menu options (duplicate, delete, convert) work as expected.
        -   [x] The codebase is free of type errors by running `bun typecheck`.

## Phase 6: Final Bug Fixes (Current Phase)

This phase addresses the final set of bugs reported after the completion of Phase 5.

1.  **Fix Configuration & Console Warnings**:
    -   Address the `Duplicate extension names found: ['listItem']` warning by removing the redundant `ListItem` extension from `features/editor/config/extensions.ts`.
2.  **Fix Visual & Layout Glitches**:
    -   Correct the layout issue where placeholders and UI elements are cut off by moving the `padding-left` from the `.editor-wrapper` to the `.ProseMirror` element in `features/editor/styles/notion-block-system.css`.
3.  **Fix React Unmount Race Condition**:
    -   Resolve the `Attempted to synchronously unmount a root` error by deferring the React root unmount call within the `destroy` method of the `BlockUIView` in `features/editor/extensions/block-ui-plugin.tsx` using a `setTimeout`.

## Phase 7: Architect-Guided Bug Fixes (Current Phase)

This phase implements the solutions approved by the project architect to resolve persistent layout and behavior issues.

1.  **Fix Placeholder Behavior**:
    -   Set `showOnlyCurrent: true` in the `Placeholder` extension configuration in `features/editor/config/extensions.ts` to prevent placeholders from lingering.
2.  **Fix Placeholder Styling**:
    -   Consolidate all placeholder styling into a single, authoritative rule in `features/editor/styles/notion-block-system.css` that uses `float: none !important;` to override conflicting styles.
3.  **Fix Handle Invisibility**:
    -   Add `overflow: visible !important;` to the `.editor-wrapper` class in the CSS to prevent the parent container from clipping the handle UI.
    -   Verify the portal positioning logic in `features/editor/extensions/block-ui-plugin.tsx` is correct now that the clipping is disabled.

This structured approach allows us to make progress incrementally and catch any issues early. I will now proceed with **Phase 1, Step 1: Install Dependencies**. 