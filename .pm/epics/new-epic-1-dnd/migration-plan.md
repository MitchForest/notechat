# Migration Plan: Novel Drag-and-Drop Implementation

**Created**: December 20, 2024  
**Epic**: New Epic 1 - Drag and Drop Migration  
**Author**: Senior Full-Stack Engineer  
**Status**: Ready for Implementation

## Executive Summary

This plan details the complete migration from our current React-heavy drag-and-drop implementation to Novel's lightweight extension-based approach. This migration will eliminate ~70% of our drag-and-drop code while providing better reliability and performance.

## Current State Analysis

### What We're Removing
- **React Node Views**: Every block wrapped in `BlockWrapper` component
- **Complex State Management**: Distributed hover/drag state across components
- **Custom Plugin**: Our `block-drag-drop.ts` ProseMirror plugin
- **Event Conflicts**: Mixed React synthetic and DOM native events

### What We're Keeping
- **BlockId Extension**: For tracking blocks
- **Editor Structure**: Core editor setup remains
- **Styling**: Basic editor styles (minus block-specific overhead)

## Migration Phases

### Phase 1: Preparation & Backup (2 hours)

#### 1.1 Create Feature Branch
```bash
git checkout -b feat/novel-drag-drop-migration
```

#### 1.2 Document Current Functionality
Create test cases for current drag-drop behavior:
- Drag paragraph to different position
- Drag heading between paragraphs
- Drag list items
- Drag code blocks
- Test edge cases (top/bottom of document)

#### 1.3 Backup Current Implementation
Create backup directory:
```
.backup/
├── blocks/
├── components/
│   ├── block-wrapper.tsx
│   └── block-handle.tsx
├── plugins/
│   └── block-drag-drop.ts
└── styles/
    ├── block-system.css
    └── drag-drop.css
```

### Phase 2: Install Dependencies (30 minutes)

#### 2.1 Install Novel Extensions
```bash
bun add tiptap-extension-global-drag-handle tiptap-extension-auto-joiner
```

#### 2.2 Verify Installation
Check `package.json` and run:
```bash
bun typecheck
bun lint
```

### Phase 3: Remove React Node Views (3 hours)

#### 3.1 Update Extension Configuration
**File**: `features/editor/config/extensions.ts`

```typescript
import GlobalDragHandle from 'tiptap-extension-global-drag-handle'
import AutoJoiner from 'tiptap-extension-auto-joiner'

// Remove these imports:
// import { ReactNodeViewRenderer } from '@tiptap/react'
// import { ParagraphBlock } from '../blocks/paragraph-block'
// import { HeadingBlock } from '../blocks/heading-block'
// ... etc

// Remove this import:
// import { createBlockDragDropPlugin } from '../plugins/block-drag-drop'

export const getEditorExtensions = (
  errorRegistry?: ErrorRegistry,
  container?: HTMLElement | null
) => {
  const extensions = [
    // Document structure
    Document,
    
    // Text formatting
    Text,
    Bold,
    Italic,
    Strike,
    Code,
    
    // Block elements - NO MORE .extend() with addNodeView
    Paragraph,
    Heading.configure({
      levels: [1, 2, 3],
    }),
    BulletList,
    OrderedList,
    ListItem,
    Blockquote,
    CodeBlock.configure({
      languageClassPrefix: 'language-',
    }),
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    
    // Functionality
    Dropcursor,
    GapCursor,
    History,
    
    // KEEP: Block ID system
    BlockId,
    
    // KEEP: Placeholder functionality
    Placeholder.configure({
      placeholder: ({ node }) => {
        if (node.type.name === 'heading') {
          return `Heading ${node.attrs.level}`
        }
        if (node.type.name === 'codeBlock') {
          return 'Write some code...'
        }
        return "Type '/' for commands"
      },
    }),
    
    // KEEP: Slash commands
    SlashCommand,
    
    // KEEP: Other custom extensions
    TrailingNode,
    
    // NEW: Global drag handle
    GlobalDragHandle.configure({
      dragHandleWidth: 20,
      scrollTreshold: 100,
      // Don't make certain elements draggable
      excludedTags: ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'],
    }),
    
    // NEW: Auto-joiner for lists
    AutoJoiner.configure({
      elementsToJoin: ['bulletList', 'orderedList'],
    }),
  ]
  
  // Remove the drag-drop plugin
  // if (container) {
  //   extensions.push(createBlockDragDropPlugin())
  // }
  
  return extensions
}
```

#### 3.2 Delete Block Components
Remove these files:
```
features/editor/blocks/
├── paragraph-block.tsx      ✗ Delete
├── heading-block.tsx        ✗ Delete
├── list-item-block.tsx      ✗ Delete
├── code-block.tsx           ✗ Delete
└── (any other block files)  ✗ Delete
```

#### 3.3 Delete Block Infrastructure
Remove:
```
features/editor/components/
├── block-wrapper.tsx        ✗ Delete
├── block-handle.tsx         ✗ Delete
└── block-error-boundary.tsx ✗ Delete (if only used by blocks)

features/editor/plugins/
└── block-drag-drop.ts       ✗ Delete
```

### Phase 4: Update Editor Component (2 hours)

#### 4.1 Simplify Editor Component
**File**: `features/editor/components/editor.tsx`

```typescript
'use client'

import { EditorContent } from '@tiptap/react'
import { EditorBubbleMenu } from './editor-bubble-menu'
import { GhostTextHandler } from '@/features/ai/components/ghost-text-handler'
import { EditorErrorBoundary } from './editor-error-boundary'
import { useStableEditor } from '../hooks/use-stable-editor'
import { cn } from '@/lib/utils'

// Remove hover debug import
// import '../utils/test-hover-debug'

interface EditorProps {
  initialContent?: any
  onContentChange?: (content: any) => void
  className?: string
}

export function Editor({ 
  initialContent, 
  onContentChange,
  className 
}: EditorProps) {
  const { editor, containerRef } = useStableEditor({
    initialContent,
    onContentChange,
  })

  if (!editor) {
    return (
      <div className={cn('editor-skeleton', className)}>
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4 mb-2" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </div>
    )
  }

  return (
    <EditorErrorBoundary>
      <div 
        ref={containerRef} 
        className={cn('editor-wrapper', className)}
      >
        <EditorContent editor={editor} />
        <EditorBubbleMenu editor={editor} />
        <GhostTextHandler editor={editor} />
      </div>
    </EditorErrorBoundary>
  )
}
```

#### 4.2 Update useStableEditor Hook
**File**: `features/editor/hooks/use-stable-editor.ts`

Remove any block-specific logic and simplify:
```typescript
// Remove any references to block UI or drag handling
// Focus on core editor initialization
```

### Phase 5: CSS Migration (2 hours)

#### 5.1 Create New Drag Handle Styles
**File**: `features/editor/styles/novel-drag-handle.css`

```css
/* Global drag handle styles */
.drag-handle {
  position: absolute;
  left: -2rem;
  top: 0;
  width: 20px;
  height: 20px;
  cursor: grab;
  opacity: 0;
  transition: opacity 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

/* Drag handle icon - using CSS instead of SVG for simplicity */
.drag-handle::before {
  content: '⋮⋮';
  font-size: 12px;
  line-height: 0.5;
  color: hsl(var(--muted-foreground));
  font-weight: bold;
  letter-spacing: -2px;
}

/* Show on hover */
.ProseMirror p:hover ~ .drag-handle,
.ProseMirror h1:hover ~ .drag-handle,
.ProseMirror h2:hover ~ .drag-handle,
.ProseMirror h3:hover ~ .drag-handle,
.ProseMirror li:hover ~ .drag-handle,
.ProseMirror blockquote:hover ~ .drag-handle,
.ProseMirror pre:hover ~ .drag-handle {
  opacity: 1;
}

/* Hover state */
.drag-handle:hover {
  background-color: hsl(var(--accent));
}

/* Active drag state */
.drag-handle:active,
.drag-handle.dragging {
  cursor: grabbing;
  background-color: hsl(var(--accent));
  opacity: 1;
}

/* Drop indicator */
.ProseMirror .drop-indicator {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background-color: hsl(var(--primary));
  pointer-events: none;
  z-index: 50;
}

/* Dragging state for editor */
.ProseMirror.dragging .is-empty::before {
  opacity: 0 !important;
}

.ProseMirror.dragging {
  cursor: grabbing !important;
}

/* Auto-scroll zones (visual feedback during development) */
.ProseMirror.show-scroll-zones::before,
.ProseMirror.show-scroll-zones::after {
  content: '';
  position: fixed;
  left: 0;
  right: 0;
  height: 100px;
  pointer-events: none;
  z-index: 100;
}

.ProseMirror.show-scroll-zones::before {
  top: 0;
  background: linear-gradient(to bottom, rgba(59, 130, 246, 0.1), transparent);
}

.ProseMirror.show-scroll-zones::after {
  bottom: 0;
  background: linear-gradient(to top, rgba(59, 130, 246, 0.1), transparent);
}
```

#### 5.2 Update Main Editor Styles
**File**: `features/editor/styles/editor.css`

```css
/* Remove all block-wrapper specific styles */
/* Remove hover-target styles */
/* Remove complex positioning hacks */

/* Simplify to: */
.editor-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  /* Reduced padding - no more huge indentation */
  padding-left: 2.5rem;
  padding-right: 1rem;
}

.ProseMirror {
  min-height: 200px;
  /* Simple padding, no more 80px left padding */
  padding: 1rem 0;
  width: 100%;
  position: relative;
}

/* Keep all the existing typography, code blocks, etc. styles */
```

#### 5.3 Clean Up Imports
**File**: `features/editor/styles/editor.css`

```css
@import './spellcheck.css';
/* @import './block-system.css'; -- REMOVE */
/* @import './drag-drop.css'; -- REMOVE */
@import './ghost-text.css';
@import './novel-drag-handle.css'; /* ADD */
/* @import './block-system-final.css'; -- REMOVE */
```

### Phase 6: Custom Handle Implementation (Optional - 3 hours)

If we need the dropdown menu functionality:

#### 6.1 Create Custom Handle Component
**File**: `features/editor/components/custom-drag-handle.tsx`

```typescript
import { useEffect, useRef } from 'react'
import { Editor } from '@tiptap/core'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { GripVertical, Plus, Copy, Trash2, Type, Heading1 } from 'lucide-react'

interface CustomDragHandleProps {
  editor: Editor
}

export function CustomDragHandle({ editor }: CustomDragHandleProps) {
  const handleRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!handleRef.current || !editor) return
    
    // The extension will look for an element with class 'drag-handle'
    // We provide our custom implementation
    const editorElement = editor.view.dom.parentElement
    if (editorElement && !editorElement.querySelector('.custom-drag-handle')) {
      editorElement.appendChild(handleRef.current)
    }
    
    return () => {
      handleRef.current?.remove()
    }
  }, [editor])
  
  const handleAction = (action: string) => {
    const pos = editor.view.state.selection.from
    
    switch (action) {
      case 'duplicate':
        // Implementation
        break
      case 'delete':
        // Implementation
        break
      // etc...
    }
  }
  
  return (
    <div 
      ref={handleRef}
      className="drag-handle custom-drag-handle"
      style={{ display: 'none' }}
    >
      <div className="drag-grip" draggable>
        <GripVertical size={16} />
      </div>
      
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="handle-menu-trigger">
            <Plus size={16} />
          </button>
        </DropdownMenu.Trigger>
        
        <DropdownMenu.Portal>
          <DropdownMenu.Content className="handle-menu-content">
            {/* Menu items */}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}
```

Then update the extension config:
```typescript
GlobalDragHandle.configure({
  dragHandleWidth: 20,
  scrollTreshold: 100,
  dragHandleSelector: '.custom-drag-handle .drag-grip',
})
```

### Phase 7: Testing & Validation (2 hours)

#### 7.1 Functionality Tests
- [ ] Basic drag and drop works for all block types
- [ ] Auto-scrolling works when dragging near edges
- [ ] Drop indicator appears correctly
- [ ] Blocks can be dragged to top/bottom of document
- [ ] List items can be reordered
- [ ] Nested lists work correctly
- [ ] Code blocks can be moved
- [ ] Task lists maintain checked state

#### 7.2 Performance Tests
- [ ] Create document with 100+ blocks
- [ ] Verify smooth hover performance
- [ ] Check memory usage (no leaks)
- [ ] Verify no unnecessary re-renders

#### 7.3 Edge Case Tests
- [ ] Drag and press ESC
- [ ] Drag outside window
- [ ] Rapid consecutive drags
- [ ] Drag with text selected
- [ ] Drag during auto-save

### Phase 8: Cleanup (1 hour)

#### 8.1 Remove Dead Code
- [ ] Delete unused imports
- [ ] Remove test utilities for old system
- [ ] Clean up unused CSS classes
- [ ] Remove debug utilities

#### 8.2 Update Documentation
- [ ] Update README with new architecture
- [ ] Document any custom handle implementation
- [ ] Add examples of extending functionality

### Phase 9: Optimization (Optional - 2 hours)

#### 9.1 Add Visual Polish
```css
/* Smooth transitions */
.drag-handle {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Better hover feedback */
.drag-handle:hover {
  transform: scale(1.1);
}

/* Dragging feedback */
[data-dragging="true"] {
  opacity: 0.5;
  transform: scale(0.98);
}
```

#### 9.2 Add Keyboard Support
Configure extension to support keyboard shortcuts:
```typescript
GlobalDragHandle.configure({
  // ... other config
  keyboardShortcuts: {
    dragUp: 'Mod-Shift-Up',
    dragDown: 'Mod-Shift-Down',
  }
})
```

## Rollback Plan

If issues arise:
1. Git stash current changes
2. Restore from `.backup/` directory
3. Re-add imports to `extensions.ts`
4. Revert package.json changes

## Success Metrics

1. **Code Reduction**: ~70% less drag-related code
2. **Performance**: No React re-renders on hover
3. **Reliability**: No stuck drag states
4. **Simplicity**: Single source of truth for drag state

## Timeline

- **Phase 1-2**: Day 1 Morning (2.5 hours)
- **Phase 3-4**: Day 1 Afternoon (5 hours)
- **Phase 5-6**: Day 2 Morning (5 hours)
- **Phase 7-8**: Day 2 Afternoon (3 hours)
- **Phase 9**: Day 3 (Optional polish)

**Total**: 15.5 hours (2-3 days with testing)

## Notes

1. The biggest risk is in Phase 3 - removing React node views. Test incrementally.
2. Keep the BlockId extension - it's orthogonal to drag functionality
3. Custom handle is optional - start with default, add if needed
4. Auto-joiner is a nice-to-have, not critical for MVP

This migration will dramatically simplify our codebase while providing better UX. The Novel approach aligns with ProseMirror's architecture rather than fighting it. 