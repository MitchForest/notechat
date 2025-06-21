# Implementation Plan: Notion-Style Block System

This document outlines the step-by-step process for replacing the current buggy block-handling system with a new, robust, Notion-style implementation based on the blueprint in `improve-block.md`.

## Phase 1: Preparation & Cleanup (Low Risk)

1.  **[ ] Install Dependencies**: Install `framer-motion` and `@radix-ui/react-dropdown-menu`.
2.  **[ ] Delete Obsolete Components**:
    -   [ ] `features/editor/components/block-handle-container.tsx`
    -   [ ] `features/editor/utils/find-block.ts`
3.  **[ ] Delete Obsolete Extension**:
    -   [ ] `features/editor/extensions/block-drag-drop.ts`
4.  **[ ] Update Editor Configuration**:
    -   [ ] Remove `BlockDragDrop` from `features/editor/config/extensions.ts`.
5.  **[ ] Create CSS Foundation**:
    -   [ ] Create `features/editor/styles/notion-block-system.css`.
    -   [ ] Import the new CSS file into `features/editor/styles/editor.css`.

## Phase 2: Component Implementation (Medium Risk)

1.  **[ ] Rebuild `BlockHandle`**:
    -   [ ] Overwrite `features/editor/components/block-handle.tsx` with the new implementation. The new version will be more self-contained, handling its own logic for duplication, deletion, and conversion by interacting directly with the `editor` instance.
2.  **[ ] Create `BlockDragDropContainer`**:
    -   [ ] Create the new file `features/editor/components/block-drag-drop-container.tsx`. This component will manage the complex logic for:
        -   Detecting the hovered block using mouse coordinates.
        -   Implementing "dead zones" between blocks to prevent flickering.
        -   Displaying the block handle with smooth animations (`framer-motion`).
        -   Managing the entire drag-and-drop flow, including rendering a visual drop indicator.
        -   This moves logic out of a Prosemirror plugin and into React, reducing complexity and potential conflicts.

## Phase 3: Integration & Verification (High Risk)

1.  **[ ] Integrate into Editor**:
    -   [ ] Modify `features/editor/components/editor.tsx` to remove the old system and render the new `<BlockDragDropContainer />`. I will be careful to place it correctly within the component tree to avoid interfering with other UI elements like the `EditorBubbleMenu`.
2.  **[ ] Final Testing**:
    -   [ ] Manually verify all features: drag-and-drop, add button, duplicate, delete, and convert block menu.
    -   [ ] Verify that existing features (spellcheck, slash commands, bubble menu) are unaffected.

This structured approach allows us to make progress incrementally and catch any issues early. I will now proceed with **Phase 1, Step 1: Install Dependencies**. 