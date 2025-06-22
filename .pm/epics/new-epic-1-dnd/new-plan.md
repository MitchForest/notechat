# Implementation Plan: Official Tiptap Drag Handle Migration

**Created**: December 21, 2024  
**Duration**: 45 minutes  
**Risk Level**: Low (can rollback easily)  

## Pre-Implementation Checklist

- [ ] Current state: 3 broken drag handles visible
- [ ] `@tiptap/extension-drag-handle` installed via bun
- [ ] `@tiptap/extension-dropcursor` installed via bun
- [ ] Git commit current state for easy rollback

## Phase 1: Remove Novel Extension (10 minutes)

### 1.1 Remove Novel Packages
```bash
bun remove tiptap-extension-global-drag-handle tiptap-extension-auto-joiner
```

### 1.2 Clean Up Debug Code

**File**: `features/editor/services/EditorService.ts`
- [ ] Remove lines 127-159 (debug logging for drag handle)
- [ ] Remove the entire debug section checking for drag handle extension

**File**: `features/editor/components/editor.tsx`
- [ ] Remove import: `import { DragHandleTest } from "./drag-handle-test"`
- [ ] Remove component: `<DragHandleTest editor={editor} />`

**File**: `features/editor/components/drag-handle-test.tsx`
- [ ] Delete entire file

### 1.3 Update Extensions Configuration

**File**: `features/editor/config/extensions.ts`
- [ ] Remove imports:
  ```typescript
  // DELETE THESE
  import GlobalDragHandle from 'tiptap-extension-global-drag-handle'
  import AutoJoiner from 'tiptap-extension-auto-joiner'
  ```
- [ ] Add import:
  ```typescript
  import { DragHandle } from '@tiptap/extension-drag-handle'
  ```
- [ ] Remove the GlobalDragHandle and AutoJoiner configuration blocks
- [ ] Remove console.log statements about extensions

## Phase 2: Implement Official Drag Handle (15 minutes)

### 2.1 Add Drag Handle Extension

**File**: `features/editor/config/extensions.ts`

Add after the `BlockId` extension:

```typescript
// Add drag handle - using official Tiptap extension
DragHandle.configure({
  render: () => {
    const handle = document.createElement('div')
    handle.className = 'tiptap-drag-handle'
    handle.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <circle cx="4" cy="4" r="1.5"/>
        <circle cx="4" cy="8" r="1.5"/>
        <circle cx="4" cy="12" r="1.5"/>
        <circle cx="12" cy="4" r="1.5"/>
        <circle cx="12" cy="8" r="1.5"/>
        <circle cx="12" cy="12" r="1.5"/>
      </svg>
    `
    return handle
  },
  tippyOptions: {
    duration: 0,
    placement: 'left',
    offset: [-8, 12], // Adjusted for your 60px editor padding
    hideOnClick: true,
    animation: 'shift-away',
  },
}),
```

### 2.2 Verify Dropcursor is Configured

Check that StarterKit has dropcursor enabled:
```typescript
StarterKit.configure({
  history: {},
  dropcursor: {
    color: 'oklch(var(--primary))',
    width: 2,
  },
}),
```

## Phase 3: Update Styles (10 minutes)

### 3.1 Replace Drag Handle CSS

**File**: `features/editor/styles/novel-drag-handle.css`

Replace ENTIRE file content with:

```css
/* Official Tiptap Drag Handle Styles */
.tiptap-drag-handle {
  width: 20px;
  height: 20px;
  min-width: 20px;
  min-height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  color: oklch(var(--muted-foreground));
  transition: all 0.15s ease;
  border-radius: 4px;
}

.tiptap-drag-handle:hover {
  color: oklch(var(--foreground));
  background-color: oklch(var(--muted));
}

.tiptap-drag-handle:active {
  cursor: grabbing;
  color: oklch(var(--foreground));
  background-color: oklch(var(--muted) / 0.8);
}

/* SVG icon sizing */
.tiptap-drag-handle svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* Ensure handle doesn't interfere with text selection */
.tiptap-drag-handle {
  user-select: none;
  -webkit-user-select: none;
}

/* Editor dragging state */
.ProseMirror.dragging {
  cursor: grabbing !important;
}

/* Hide placeholders during drag */
.ProseMirror.dragging .is-empty::before {
  opacity: 0 !important;
}

/* Selected node during drag */
.ProseMirror .ProseMirror-selectednode {
  outline: 2px solid oklch(var(--primary) / 0.3);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Tippy tooltip container adjustments */
.tippy-box[data-theme~='drag-handle'] {
  background-color: transparent;
  border: none;
  box-shadow: none;
}
```

### 3.2 Rename CSS File (Optional but Recommended)

```bash
mv features/editor/styles/novel-drag-handle.css features/editor/styles/drag-handle.css
```

Update import in `features/editor/styles/editor.css`:
```css
@import './drag-handle.css';
```

## Phase 4: Clean Up Editor Styles (5 minutes)

### 4.1 Verify Editor Wrapper

**File**: `features/editor/styles/editor.css`

Ensure these styles remain:
```css
.editor-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  padding-left: 60px; /* Keep this for drag handle space */
  padding-right: 1rem;
  overflow: visible !important;
}
```

### 4.2 Remove Any Debug Styles

Remove any temporary styles like:
- Red backgrounds
- Blue borders
- Force visibility with `!important`

## Phase 5: Testing Protocol (5 minutes)

### 5.1 Build and Type Check
```bash
bun typecheck
bun lint
bun run build
```

### 5.2 Visual Testing Checklist

Start dev server: `bun dev`

- [ ] **No red/blue debug boxes visible**
- [ ] Hover over paragraph → drag handle appears to the left
- [ ] Hover over heading → drag handle appears
- [ ] Hover over list item → drag handle appears
- [ ] Hover over code block → drag handle appears
- [ ] Move mouse away → handle disappears
- [ ] Drag handle has 6 dots icon
- [ ] Drag a paragraph → blue drop indicator appears
- [ ] Drop paragraph → it moves to new position
- [ ] Check console → no errors

### 5.3 Edge Cases to Test

- [ ] First paragraph in document
- [ ] Last paragraph in document
- [ ] Empty paragraph
- [ ] Nested list items
- [ ] Code blocks with long content
- [ ] Rapid hover/unhover
- [ ] Drag to top of document
- [ ] Drag to bottom of document

## Phase 6: Final Cleanup (5 minutes)

### 6.1 Remove Unused Imports

Search for and remove any remaining references to:
- `GlobalDragHandle`
- `AutoJoiner`
- `DragHandleTest`

### 6.2 Update Package.json

Verify package.json shows:
- ✅ `@tiptap/extension-drag-handle`
- ✅ `@tiptap/extension-dropcursor`
- ❌ `tiptap-extension-global-drag-handle` (removed)
- ❌ `tiptap-extension-auto-joiner` (removed)

### 6.3 Commit Changes

```bash
git add -A
git commit -m "feat: migrate to official Tiptap drag handle extension

- Remove buggy Novel drag handle extension
- Implement official @tiptap/extension-drag-handle
- Fix positioning issues with Tippy.js
- Clean up debug code and styles
- Add proper drag handle styling"
```

## Success Criteria

1. **Single drag handle** visible on hover (not 3)
2. **Correct positioning** to the left of blocks
3. **Smooth dragging** with drop indicator
4. **No console errors**
5. **All block types** supported
6. **Clean codebase** with no debug artifacts

## Rollback Plan

If issues arise:
```bash
git stash
git checkout HEAD~1
bun install
```

## Post-Implementation Notes

- The official extension uses Tippy.js for positioning, which handles all edge cases
- No need for manual positioning calculations
- The handle is created on-demand, not persistent in DOM
- Much better performance than Novel extension

## Time Estimate

- Phase 1: 10 minutes
- Phase 2: 15 minutes  
- Phase 3: 10 minutes
- Phase 4: 5 minutes
- Phase 5: 5 minutes
- Phase 6: 5 minutes
- **Total: 50 minutes**

## Questions to Consider

1. Do you want to add a dropdown menu to the drag handle later?
2. Should we add keyboard shortcuts for moving blocks (Cmd+Shift+Up/Down)?
3. Do you want custom styling to match your design system?

---

**Status**: Ready to implement  
**Next Step**: Start with Phase 1.1 - Remove Novel packages

---

## UPDATE: December 21, 2024 - BubbleMenu Conflict Resolution

### Problem Discovered
The drag handle's Tippy instance was being destroyed immediately after creation due to BubbleMenu React component registering its plugin after editor initialization. This caused all plugin views to be destroyed and recreated.

### Solution Implemented: Option 5 - Move BubbleMenu to Extensions

Instead of using the React BubbleMenu component, we:

1. **Added BubbleMenu as an extension** in `extensions.ts`:
   - Configured with proper shouldShow logic
   - Placed BEFORE DragHandle in extensions array
   - Set element to null (to be attached later)

2. **Created CustomBubbleMenu component** (`custom-bubble-menu.tsx`):
   - Accepts editor as prop
   - Attaches its DOM element to BubbleMenu extension after mount
   - Preserves all AI functionality and formatting options

3. **Updated Editor component**:
   - Removed React BubbleMenu import
   - Added CustomBubbleMenu with editor prop
   - Removed EditorProvider (not needed)

4. **Fixed type errors**:
   - Removed unused noteTitle prop from Editor
   - Updated CustomBubbleMenu to accept editor prop

### Results
- ✅ Build passes successfully
- ✅ No more Tippy destruction errors
- ✅ BubbleMenu and DragHandle can coexist
- ✅ All AI functionality preserved (/ai command, text selection AI)
- ✅ All formatting options working

### Key Learnings
- Tiptap React components that register plugins can conflict with extensions using Tippy
- Moving everything to the extensions array ensures proper initialization order
- Custom elements can be attached to extensions after editor creation

### Next Steps
- Test the implementation in development
- Verify drag handle appears and functions correctly
- Verify bubble menu appears on text selection
- Check for any remaining console errors

---

## UPDATE: December 21, 2024 - Drag Handle Hover Zone Fix

### Problem Discovered
The drag handle was disappearing when hovering over it because:
- The hover detection zone was limited to the editor content area
- The handle was positioned in the left padding (outside the detection zone)
- Moving the mouse from content to handle triggered mouseleave

### Solution Implemented: Two-Part Fix

1. **Made Tippy Interactive**:
   - Added `interactive: true` to allow mouse movement to the handle
   - Added `interactiveBorder: 30` for a transition zone
   - Changed `appendTo: () => document.body` for proper z-index

2. **Extended Hover Zone with CSS**:
   - Added pseudo-elements to all block elements (p, h1-h6, li, blockquote, pre)
   - Pseudo-elements extend 60px into the left margin
   - Pointer events activate only on hover to prevent interference

### Technical Details
```typescript
// Tippy configuration
tippyOptions: {
  interactive: true,
  interactiveBorder: 30,
  appendTo: () => document.body,
  // ... other options
}
```

```css
/* Hover zone extension */
.ProseMirror p::before {
  content: '';
  position: absolute;
  left: -60px;
  width: 60px;
  pointer-events: none;
}
.ProseMirror p:hover::before {
  pointer-events: all;
}
```

### Results
- ✅ Drag handle stays visible when moving mouse to it
- ✅ Natural hover detection from any direction
- ✅ Seamless interaction experience
- ✅ Build passes successfully

This creates a robust drag-and-drop experience where users can naturally move their mouse to the drag handle without it disappearing.
