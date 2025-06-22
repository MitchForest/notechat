# Implementation Plan: Notion-Style Drag & Drop

## Overview

This document outlines the plan to refactor and upgrade the editor's drag-and-drop (DND) functionality to match the high-quality user experience of Notion, based on the architecture defined in `fix-dnd.md`. The goal is a robust, maintainable, and visually polished implementation.

We will refactor the existing monolithic DND plugin into a modular system comprising a dedicated state management hook (`useDragAndDrop`) and a focused Prosemirror plugin (`dragDropPlugin`). This will be complemented by a complete CSS overhaul to implement high-fidelity UI elements like a cloned drag preview and a full-width drop-zone indicator.

## Files to Create

-   `features/editor/hooks/useDragAndDrop.ts`
    -   **Purpose**: To manage all DND-related state and logic (e.g., creating/managing the drag preview, drop zone, auto-scroll, and cleanup logic). This isolates state management from Prosemirror event handling.
-   `features/editor/extensions/dragDropPlugin.ts`
    -   **Purpose**: A new Prosemirror plugin dedicated to handling DOM events for DND (`dragover`, `drop`, `dragend`). It will orchestrate the drag operation within the Prosemirror view and commit changes to the document.

## Files to Modify

-   `features/editor/extensions/block-ui-plugin.tsx`
    -   **Change**: This file will be significantly refactored. All DND logic (state, event handling, drop indicators) will be removed. Its sole responsibility will become rendering the `BlockHandle` component next to the corresponding hovered block. The hover detection logic will be improved for full-width sensitivity.
-   `features/editor/components/block-handle.tsx`
    -   **Change**: The drag-and-drop initiation logic (`onDragStart`, `handleDragEnd`) will be removed. The component will become simpler, relying on the new `useDragAndDrop` hook (passed via props or context) to initialize the drag operation.
-   `features/editor/styles/editor.css`
    -   **Change**: The existing DND-related CSS will be replaced entirely with the superior implementation from `fix-dnd.md`. This includes adding styles for the new `.drag-preview`, `.drop-zone`, and refined states for `.is-dragging`, using CSS variables for consistency.
-   `features/editor/components/editor.tsx`
    -   **Change**: This component will be updated to initialize the new `useDragAndDrop` hook and integrate the new `dragDropPlugin` into the Tiptap editor instance. It will act as the orchestrator for the new DND system.
-   `features/editor/config/extensions.ts`
    -   **Change**: While the main integration happens in `editor.tsx`, we will need to ensure the extensions are configured correctly here, potentially adjusting how the `BlockUiExtension` is exported or configured if we modify its signature.

## Implementation Steps

### Step 1: Foundational State Management (`useDragAndDrop` Hook)
1.  Create `features/editor/hooks/useDragAndDrop.ts`.
2.  Implement the `useDragAndDrop` hook based on the `fix-dnd.md` guide.
3.  Include logic for:
    -   `initializeDrag`: Sets up drag data, creates the custom drag preview.
    -   `createDragPreview`: Clones the block content for a high-fidelity preview.
    -   `updateDragPreview`: Updates the preview position using `requestAnimationFrame`.
    -   `showDropZone`: Renders and positions the full-width drop zone overlay.
    -   `handleAutoScroll`: Implements auto-scrolling when dragging near viewport edges.
    -   `cleanup`: Removes all temporary elements and resets state on drag end.

### Step 2: Overhaul CSS for a Polished UI
1.  Open `features/editor/styles/editor.css`.
2.  Remove all existing CSS related to `.drag-preview`, `.drop-indicator`, and `.is-dragging`.
3.  Implement the full CSS suite from `fix-dnd.md`, ensuring all variables (`--drop-zone-color`, etc.) are correctly defined or mapped to the existing theme.
4.  Verify styles for the new `.drag-preview` (rotated, semi-transparent) and `.drop-zone` (full-width overlay).

### Step 3: Create the Prosemirror `dragDropPlugin`
1.  Create `features/editor/extensions/dragDropPlugin.ts`.
2.  Implement the Prosemirror plugin logic from `fix-dnd.md`.
3.  The plugin will use `handleDOMEvents` to manage `dragover`, `drop`, and `dragend`.
4.  On `dragover`, it will update the drag preview and drop zone via the `dragManager` (from the hook).
5.  On `drop`, it will calculate the source and target positions and dispatch a Prosemirror transaction to move the node.
6.  On `dragend`, it will ensure the `cleanup` function is called.

### Step 4: Refactor the `block-ui-plugin`
1.  Open `features/editor/extensions/block-ui-plugin.tsx`.
2.  Delete all code related to DND state management, drag events, and drop indicators. This includes the `isDragging`, `dropTargetPos` parts of the state, and the associated event handlers.
3.  Refine the `findHoveredBlock` logic to be purely based on vertical coordinates to ensure the full-width hover area is reliable. The current implementation is already close to this, but we will solidify it.
4.  The plugin's only job is to show/hide the `BlockHandle` portal based on `hoveredBlockPos`.

### Step 5: Update the `BlockHandle` Component
1.  Open `features/editor/components/block-handle.tsx`.
2.  Remove the `handleDragStart` and `handleDragEnd` methods and the corresponding props on the drag handle button.
3.  Add `useEffect` to the component to attach the `dragstart` event listener to the drag handle's `ref`.
4.  The `dragstart` handler will call the `initializeDrag` function from the `useDragAndDrop` hook, which will be passed down as a prop.

### Step 6: Final Integration
1.  Open `features/editor/components/editor.tsx`.
2.  Instantiate the DND manager: `const dragManager = useDragAndDrop();`.
3.  Expose the manager to the window so the Prosemirror plugin can access it, as per the guide's pattern: `(window as any).dragManager = dragManager;`.
4.  Modify the `useEditor` configuration:
    -   Ensure the new `dragDropPlugin` is added to the `addProseMirrorPlugins` array of your custom document or a base extension.
    -   Pass the required functions from `dragManager` down to the `BlockUiExtension` or `BlockHandle` as needed.

## Testing Strategy

### Manual Testing Plan
-   **Drag & Drop**:
    -   [ ] Drag a block upwards and downwards.
    -   [ ] Drag the first block to the middle.
    -   [ ] Drag the last block to the top.
-   **UI Verification**:
    -   [ ] The new custom drag preview appears correctly and follows the cursor.
    -   [ ] The full-width drop zone overlay appears at the correct target location.
    -   [ ] The original block has an `is-dragging` style applied.
-   **State Management**:
    -   [ ] The editor view blurs and hides placeholders during the drag operation.
    -   [ ] The cursor is correctly placed in the block after it's dropped.
-   **Edge Cases**:
    -   [ ] Test autoscroll when dragging near the top/bottom of the scrollable area.
    -   [ ] Test fast drag-and-drop movements.
    -   [ ] Test canceling a drag by pressing `Escape` (if we implement this) or dropping outside a valid target.

## UI/UX Considerations

-   **Feedback**: The user should always have clear, immediate feedback. This is achieved through the custom preview, the drop zone, and the `is-dragging` opacity.
-   **Performance**: All mouse-move-related actions (`updateDragPreview`) will be throttled using `requestAnimationFrame` to ensure a smooth 60fps experience.
-   **Focus**: We will explicitly manage focus to provide a clean "drag mode" and restore focus logically after the drop is complete. 