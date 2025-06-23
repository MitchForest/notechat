# Sprint 4.5: Editor Drag Handle Migration

## Goal
Migrate from the non-functional Tiptap official drag handle extension to `tiptap-extension-global-drag-handle` that Novel uses, which properly tracks mouse movement and shows the handle next to hovered blocks.

## Problem Statement
Current issues with our drag handle implementation:
1. **Stationary Handle**: Drag handle appears at the top and doesn't follow the cursor
2. **Tippy.js Limitations**: Current extension uses Tippy.js (designed for tooltips) which doesn't track mouse movement
3. **CSS Conflicts**: Multiple CSS files with conflicting styles
4. **Wrong Extension**: Using `@tiptap/extension-drag-handle` instead of the working `tiptap-extension-global-drag-handle`

## Why Novel's Approach Works
- **Direct DOM Manipulation**: Creates a single drag handle element that moves around
- **Mouse Tracking**: Actively tracks mouse position over blocks
- **No Tippy.js**: Doesn't rely on tooltip positioning library
- **Headless by Default**: You style it with `.drag-handle` class

## Migration Plan

### Phase 1: Remove Current Implementation (30 minutes)
1. **Remove Tiptap drag handle from extensions**
   - File: `features/editor/config/extensions.ts`
   - Remove: `import { DragHandle } from '@tiptap/extension-drag-handle'`
   - Remove: The entire DragHandle.configure() block

2. **Clean up CSS files**
   - File: `features/editor/styles/drag-handle.css`
   - Remove the `display: none !important` override
   - Keep the styling but change `.tiptap-drag-handle` to `.drag-handle`
   - Remove all Tippy-related styles

3. **Remove unused custom extension**
   - Consider deleting: `features/editor/extensions/custom-drag-handle.ts` (not being used)

### Phase 2: Install New Dependencies (15 minutes)
```bash
# Install the global drag handle extension
bun add tiptap-extension-global-drag-handle

# Optional but recommended - auto-joins lists when dragging
bun add tiptap-extension-auto-joiner
```

### Phase 3: Implement Global Drag Handle (45 minutes)
1. **Update extensions configuration**
   ```typescript
   // features/editor/config/extensions.ts
   import GlobalDragHandle from 'tiptap-extension-global-drag-handle'
   import AutoJoiner from 'tiptap-extension-auto-joiner'
   
   // In getEditorExtensions function:
   GlobalDragHandle.configure({
     dragHandleWidth: 20,    // default
     scrollTreshold: 100,    // auto-scroll threshold
     // Optional: custom selector if you want to provide your own handle element
     // dragHandleSelector: ".custom-drag-handle",
   }),
   
   AutoJoiner.configure({
     elementsToJoin: ["bulletList", "orderedList"] // auto-join lists
   }),
   ```

2. **Update CSS styling**
   ```css
   /* features/editor/styles/drag-handle.css */
   
   /* Global drag handle styling */
   .drag-handle {
     width: 20px;
     height: 20px;
     display: flex;
     align-items: center;
     justify-content: center;
     cursor: grab;
     color: oklch(var(--muted-foreground) / 0.4);
     background-color: oklch(var(--muted) / 0.3);
     border-radius: 4px;
     transition: all 0.15s ease;
     
     /* Positioning handled by the extension */
     position: absolute;
     left: -40px; /* Adjust based on your layout */
     z-index: 10;
   }
   
   .drag-handle:hover {
     color: oklch(var(--muted-foreground) / 0.7);
     background-color: oklch(var(--muted) / 0.5);
   }
   
   .drag-handle:active {
     cursor: grabbing;
     color: oklch(var(--muted-foreground));
     background-color: oklch(var(--muted) / 0.7);
   }
   
   /* The drag handle icon */
   .drag-handle svg {
     width: 16px;
     height: 16px;
   }
   ```

3. **Clean up editor wrapper styles**
   ```css
   /* features/editor/styles/editor.css */
   
   /* Ensure editor wrapper allows for drag handle positioning */
   .editor-wrapper {
     position: relative;
     overflow: visible; /* Important for drag handle visibility */
   }
   
   /* Remove the extended block padding if not needed */
   .ProseMirror > * {
     /* Remove the negative margins and extra padding */
     padding-left: 2rem; /* Normal padding */
     padding-right: 2rem;
   }
   ```

### Phase 4: Testing & Refinement (30 minutes)
1. **Test drag handle behavior**
   - Hover over different block types (paragraphs, headings, lists)
   - Ensure handle appears to the left of the hovered block
   - Test dragging blocks to reorder them
   - Verify auto-scrolling works near edges

2. **Edge cases to test**
   - Code blocks
   - Images
   - Nested lists
   - Empty paragraphs
   - Long documents (performance)

3. **Refine positioning**
   - Adjust `left` position in CSS if needed
   - Test with different screen sizes
   - Ensure it doesn't overlap with sidebar

### Phase 5: Optional Enhancements (1 hour)
1. **Custom drag handle element**
   ```typescript
   GlobalDragHandle.configure({
     dragHandleSelector: ".custom-drag-handle",
     // Then provide your own element in the DOM
   })
   ```

2. **Exclude certain elements**
   ```typescript
   GlobalDragHandle.configure({
     excludedTags: ['hr'], // Don't show handle for horizontal rules
     customNodes: ['alert'], // Include custom node types
   })
   ```

3. **Add drag handle icon**
   ```css
   /* Use CSS to insert the icon */
   .drag-handle::before {
     content: url('data:image/svg+xml;utf8,<svg>...</svg>');
   }
   ```

## Success Criteria
- [ ] Drag handle appears next to the block being hovered
- [ ] Handle follows mouse movement between blocks
- [ ] Dragging blocks reorders them smoothly
- [ ] No console errors or warnings
- [ ] Performance remains good with long documents
- [ ] Works with all block types in the editor

## Rollback Plan
If issues arise:
1. Git stash the changes
2. Revert to previous commit
3. Re-apply the CSS `display: none` to hide broken handle
4. Document specific issues encountered

## References
- [Novel's implementation](https://novel.sh/docs/guides/global-drag-handle)
- [Extension GitHub repo](https://github.com/NiclasDev63/tiptap-extension-global-drag-handle)
- [Novel's CSS example](https://github.com/steven-tey/novel/blob/main/apps/web/styles/prosemirror.css#L131)

## Time Estimate
Total: ~3 hours
- Phase 1: 30 minutes
- Phase 2: 15 minutes  
- Phase 3: 45 minutes
- Phase 4: 30 minutes
- Phase 5: 1 hour (optional) 