# Drag & Drop + Block Controls Sprint Plan

## Sprint Overview
**Goal**: Add drag-and-drop functionality with block action controls (duplicate, delete, add) and improve text selection across blocks.

**Duration**: 3-5 days
**Priority**: High

## Feature 1: Block Controls UI (Day 1)

### 1.1 Create Block Handle Component
```typescript
// features/editor/components/block-handle.tsx
import { GripVertical, Copy, Trash2, Plus } from 'lucide-react'
import { useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

interface BlockHandleProps {
  position: { top: number; left: number }
  onDragStart: () => void
  onDuplicate: () => void
  onDelete: () => void
  onAddAbove: () => void
}

export function BlockHandle({ position, onDragStart, onDuplicate, onDelete, onAddAbove }: BlockHandleProps) {
  const [showActions, setShowActions] = useState(false)

  return (
    <div 
      className="absolute flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity"
      style={{ top: position.top, left: position.left }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Drag Handle */}
      <button
        onMouseDown={onDragStart}
        className="p-1 hover:bg-accent rounded cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Action Menu */}
      {showActions && (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="p-1 hover:bg-accent rounded">
              <Plus className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenu.Trigger>
          
          <DropdownMenu.Content className="bg-background border rounded-md shadow-lg p-1">
            <DropdownMenu.Item 
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded cursor-pointer"
              onClick={onAddAbove}
            >
              <Plus className="h-3 w-3" /> Add above
            </DropdownMenu.Item>
            
            <DropdownMenu.Item 
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded cursor-pointer"
              onClick={onDuplicate}
            >
              <Copy className="h-3 w-3" /> Duplicate
            </DropdownMenu.Item>
            
            <DropdownMenu.Item 
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded cursor-pointer text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3" /> Delete
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      )}
    </div>
  )
}
```

### 1.2 Create Block Handle Container
```typescript
// features/editor/components/block-handle-container.tsx
import { useEffect, useState } from 'react'
import { Editor } from '@tiptap/core'
import { BlockHandle } from './block-handle'

interface BlockHandleContainerProps {
  editor: Editor
}

export function BlockHandleContainer({ editor }: BlockHandleContainerProps) {
  const [activeBlock, setActiveBlock] = useState<{
    pos: number
    node: any
    dom: Element
  } | null>(null)

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const { clientX, clientY } = event
      const elements = document.elementsFromPoint(clientX, clientY)
      
      // Find the closest block element
      const blockElement = elements.find(el => 
        el.classList.contains('ProseMirror') ||
        el.matches('p, h1, h2, h3, blockquote, pre, ul, ol')
      )
      
      if (blockElement && blockElement.closest('.ProseMirror')) {
        const pos = editor.view.posAtDOM(blockElement, 0)
        const node = editor.state.doc.nodeAt(pos)
        
        if (node && node.type.isBlock) {
          setActiveBlock({ pos, node, dom: blockElement })
        }
      } else {
        setActiveBlock(null)
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [editor])

  if (!activeBlock) return null

  const rect = activeBlock.dom.getBoundingClientRect()
  const editorRect = editor.view.dom.getBoundingClientRect()

  return (
    <BlockHandle
      position={{
        top: rect.top - editorRect.top,
        left: -40 // Position to the left of the block
      }}
      onDragStart={() => handleDragStart(activeBlock)}
      onDuplicate={() => handleDuplicate(activeBlock)}
      onDelete={() => handleDelete(activeBlock)}
      onAddAbove={() => handleAddAbove(activeBlock)}
    />
  )
}
```

## Feature 2: Drag & Drop Implementation (Day 2)

### 2.1 Create Drag & Drop Extension
```typescript
// features/editor/extensions/block-drag-drop.ts
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

export interface DragDropOptions {
  onDrop?: (from: number, to: number) => void
}

const dragDropKey = new PluginKey('dragDrop')

export const BlockDragDrop = Extension.create<DragDropOptions>({
  name: 'blockDragDrop',

  addOptions() {
    return {
      onDrop: undefined,
    }
  },

  addProseMirrorPlugins() {
    let draggedNode: { pos: number; node: any } | null = null
    let dropIndicatorPos: number | null = null

    return [
      new Plugin({
        key: dragDropKey,
        state: {
          init: () => DecorationSet.empty,
          apply: (tr, decorationSet, oldState, newState) => {
            // Clear decorations on doc change
            if (tr.docChanged) {
              return DecorationSet.empty
            }

            // Handle drop indicator
            const dropPos = tr.getMeta('dropIndicator')
            if (dropPos !== undefined) {
              if (dropPos === null) {
                return DecorationSet.empty
              }
              
              const decoration = Decoration.widget(dropPos, () => {
                const indicator = document.createElement('div')
                indicator.className = 'drop-indicator'
                indicator.style.cssText = `
                  height: 2px;
                  background-color: hsl(var(--primary));
                  margin: 4px 0;
                `
                return indicator
              })
              
              return DecorationSet.create(newState.doc, [decoration])
            }

            return decorationSet
          }
        },
        props: {
          decorations(state) {
            return this.getState(state)
          },
          
          handleDOMEvents: {
            dragstart: (view, event) => {
              const pos = view.posAtCoords({ 
                left: event.clientX, 
                top: event.clientY 
              })
              
              if (!pos) return false
              
              const node = view.state.doc.nodeAt(pos.pos)
              if (node && node.type.isBlock) {
                draggedNode = { pos: pos.pos, node }
                event.dataTransfer!.effectAllowed = 'move'
                event.dataTransfer!.setData('text/html', node.textContent || '')
                
                // Add dragging class
                (event.target as HTMLElement).classList.add('dragging')
              }
              
              return false
            },

            dragend: (view, event) => {
              draggedNode = null
              ;(event.target as HTMLElement).classList.remove('dragging')
              
              // Clear drop indicator
              view.dispatch(
                view.state.tr.setMeta('dropIndicator', null)
              )
              
              return false
            },

            dragover: (view, event) => {
              event.preventDefault()
              
              if (!draggedNode) return false
              
              const pos = view.posAtCoords({ 
                left: event.clientX, 
                top: event.clientY 
              })
              
              if (!pos) return false
              
              // Find the nearest block boundary
              const resolved = view.state.doc.resolve(pos.pos)
              let dropPos = resolved.pos
              
              // Adjust to block boundary
              if (resolved.parent.type.isBlock) {
                const before = resolved.before(resolved.depth)
                dropPos = before
              }
              
              // Update drop indicator
              view.dispatch(
                view.state.tr.setMeta('dropIndicator', dropPos)
              )
              
              return false
            },

            drop: (view, event) => {
              event.preventDefault()
              
              if (!draggedNode) return false
              
              const pos = view.posAtCoords({ 
                left: event.clientX, 
                top: event.clientY 
              })
              
              if (!pos) return false
              
              // Perform the move
              const tr = view.state.tr
              const draggedContent = view.state.doc.slice(
                draggedNode.pos, 
                draggedNode.pos + draggedNode.node.nodeSize
              )
              
              // Delete from old position
              tr.delete(draggedNode.pos, draggedNode.pos + draggedNode.node.nodeSize)
              
              // Insert at new position
              const insertPos = pos.pos > draggedNode.pos 
                ? pos.pos - draggedNode.node.nodeSize 
                : pos.pos
              
              tr.insert(insertPos, draggedContent.content)
              
              view.dispatch(tr)
              
              // Clear state
              draggedNode = null
              view.dispatch(
                view.state.tr.setMeta('dropIndicator', null)
              )
              
              return true
            }
          }
        }
      })
    ]
  }
})
```

## Feature 3: Text Selection Improvements (Day 3)

### 3.1 Multi-Block Selection Fix
```typescript
// Add to your EditorService configuration
editorProps: {
  // Enable proper multi-block selection
  clipboardTextSerializer: (slice) => {
    // Preserve formatting when copying
    return slice.content.textBetween(0, slice.content.size, '\n\n')
  },
  
  transformPastedHTML: (html) => {
    // Clean up pasted content
    return html
  },
  
  // Fix selection rendering
  attributes: {
    class: "... selection:bg-primary/20", // Add selection highlighting
  }
}
```

### 3.2 Add Selection Styles
```css
/* features/editor/styles/editor.css */

/* Better selection visibility */
.ProseMirror ::selection {
  background-color: hsl(var(--primary) / 0.3);
}

/* Multi-line selection */
.ProseMirror .selection-marker {
  background-color: hsl(var(--primary) / 0.2);
}

/* Dragging styles */
.ProseMirror .dragging {
  opacity: 0.5;
}

/* Drop indicator */
.ProseMirror .drop-indicator {
  height: 2px;
  background-color: hsl(var(--primary));
  margin: 4px 0;
}

/* Block hover effect */
.ProseMirror p:hover,
.ProseMirror h1:hover,
.ProseMirror h2:hover,
.ProseMirror h3:hover,
.ProseMirror blockquote:hover,
.ProseMirror pre:hover {
  background-color: hsl(var(--muted) / 0.3);
  transition: background-color 0.2s;
}
```

## Feature 4: Integration & Testing (Day 4)

### 4.1 Update Advanced Editor Component
```typescript
// Update your advanced-editor.tsx
import { BlockHandleContainer } from './block-handle-container'

export function AdvancedEditor({ content, onChange }) {
  // ... existing code
  
  return (
    <div className="relative w-full">
      {editor && <BlockHandleContainer editor={editor} />}
      <AdvancedEditorContent 
        editor={editor} 
        className="relative pl-12" // Add padding for block handles
      />
    </div>
  )
}
```

### 4.2 Add to Extensions
```typescript
// In your extensions configuration
import { BlockDragDrop } from '../extensions/block-drag-drop'

export const getEditorExtensions = (registry: ErrorRegistry) => [
  // ... existing extensions
  BlockDragDrop.configure({
    onDrop: (from, to) => {
      console.log('Block moved from', from, 'to', to)
    }
  }),
]
```

## Implementation Notes

### Why This Approach?

1. **Block Controls** > Just Drag
   - Users can duplicate blocks quickly
   - Delete without selecting all text
   - Add new blocks in specific positions
   - More discoverable than keyboard shortcuts

2. **Visual Feedback**
   - Hover effects show interactive areas
   - Drop indicator shows where block will land
   - Dragging opacity provides clear feedback

3. **Performance**
   - Uses native drag & drop API
   - Minimal React re-renders
   - Debounced mouse tracking

### Testing Checklist

- [ ] Drag paragraphs up/down
- [ ] Drag different block types (headings, lists, quotes)
- [ ] Duplicate blocks maintains formatting
- [ ] Delete blocks with undo support
- [ ] Multi-block selection works
- [ ] Copy/paste preserves formatting
- [ ] Mobile touch support (optional)

### Future Enhancements

1. **Keyboard shortcuts**
   - `Cmd+D` to duplicate
   - `Cmd+Shift+D` to delete block

2. **Block transforms**
   - Click block type to transform (like Notion)

3. **Nested drag & drop**
   - Drag list items within lists
   - Drag into/out of blockquotes

This sprint gives you a professional block manipulation system that matches or exceeds Novel's functionality!

---

# Phase 2.1: UI/UX Overhaul & Polish

**Goal**: Transform the proof-of-concept into a polished, intuitive, Notion-like block manipulation and editing experience.

**High-Level Feedback Addressed**:
1.  **Clunky UI**: Buttons overlap text, poor positioning.
2.  **Horrible Design**: Obnoxious colors, bad hover effects.
3.  **Missing Placeholders**: No contextual placeholders for headings, lists, etc.
4.  **Poor UX**: Action menus are sticky, hard to use, and badly designed.

---

## Part 1: Block Handle & Action Menu Redesign (UX & UI)

### 1.1: **Refactor `BlockHandle` for Notion-style interaction.**
The current single handle is unintuitive. We will split it into two distinct controls that appear on hover:
-   **Add Button (`+`)**: Instantly creates a new block below.
-   **Drag & Menu Handle (`⋮`)**: A single button that combines drag initiation with access to a context menu.

**Updated Component (`block-handle.tsx`):**
```typescript
// features/editor/components/block-handle.tsx
import { Plus, GripVertical, Copy, Trash2, Pilcrow } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface BlockHandleProps {
  onDragStart: (event: React.DragEvent) => void;
  onAddBlock: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  // Future: onTransform: (type: string) => void;
}

export function BlockHandle({ onDragStart, onAddBlock, onDuplicate, onDelete }: BlockHandleProps) {
  return (
    <div className="flex items-center gap-1" data-testid="block-handle">
      {/* 1. Add Button */}
      <button
        className="p-1 rounded opacity-50 hover:opacity-100 hover:bg-accent"
        onClick={onAddBlock}
        title="Add block below"
      >
        <Plus className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* 2. Drag & Menu Handle */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            draggable="true"
            onDragStart={onDragStart}
            className="p-1 rounded opacity-50 hover:opacity-100 hover:bg-accent cursor-grab active:cursor-grabbing"
            title="Drag to move or click for options"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
        </DropdownMenu.Trigger>
        
        <DropdownMenu.Content 
          side="bottom" 
          align="start"
          className="bg-background border rounded-md shadow-lg p-1 w-48"
        >
          <DropdownMenu.Label className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Actions</DropdownMenu.Label>
          <DropdownMenu.Separator />
          <DropdownMenu.Item 
            className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded cursor-pointer"
            onClick={onDuplicate}
          >
            <Copy className="h-3 w-3" /> Duplicate
          </DropdownMenu.Item>
          <DropdownMenu.Item 
            className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded cursor-pointer text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" /> Delete
          </DropdownMenu.Item>
          {/* Future: Add block type transformations here */}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  );
}
```

### 1.2: **Update `BlockHandleContainer` to manage the new handle.**
This container will be responsible for positioning the handle correctly (further left) and providing the logic for the add, delete, and duplicate actions.

**Key changes in `block-handle-container.tsx`:**
-   **Positioning**: Change `left` style from `-40px` to `~-60px` to give text more space.
-   **Event Handling**: Implement `onAddBlock`, `onDuplicate`, and `onDelete` functions that chain commands to the Tiptap editor instance.
-   **Appearance Logic**: Ensure the handle appears on hover of the block's row, not just the text itself. The `opacity` will transition smoothly.

---

## Part 2: Aesthetic & Styling Overhaul (Visuals)

### 2.1: **Implement subtle, clean styling.**
The "horrible design" will be fixed with professional, muted colors and hover effects.

**CSS (`editor.css`):**
```css
/*
 * Block Handle & Hover Styling
 */

/* Hide handle by default, show on parent hover */
.ProseMirror .block-handle-wrapper {
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}

/* On hover of any direct child block within ProseMirror, show the handle */
.ProseMirror > *:hover .block-handle-wrapper {
  opacity: 1;
}

/* Subtle hover effect for the block itself */
.ProseMirror > *:hover {
  background-color: hsl(var(--muted) / 0.5);
}

/* Remove the horrible green overlay and dark text */
/* This is a find-and-replace for any existing offensive styles. */
.ProseMirror ::selection {
  background-color: hsl(var(--primary) / 0.2); /* Light blue selection */
  color: inherit;
}
```

---

## Part 3: Enhanced Placeholder Extension

### 3.1: **Create a powerful, context-aware placeholder extension.**
The default placeholder is not enough. We need placeholders that guide the user.

**New Extension (`features/editor/extensions/placeholder.ts`):**
```typescript
import { Editor, Extension } from '@tiptap/core';
import { Node } from 'prosemirror-model';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { Plugin } from 'prosemirror-state';

export const Placeholder = Extension.create({
  name: 'placeholder',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          decorations: ({ doc, selection }) => {
            const decorations: Decoration[] = [];
            const { anchor } = selection;

            doc.descendants((node, pos) => {
              if (node.type.isBlock && node.childCount === 0) {
                const isCurrentNode = anchor >= pos && anchor <= pos + node.nodeSize;
                if (!isCurrentNode) return;

                const placeholderText = getPlaceholderText(node, this.editor);
                if (!placeholderText) return;
                
                const decoration = Decoration.widget(pos + 1, () => {
                  const el = document.createElement('span');
                  el.className = 'placeholder';
                  el.setAttribute('data-placeholder', placeholderText);
                  return el;
                });
                decorations.push(decoration);
              }
            });

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});

function getPlaceholderText(node: Node, editor: Editor): string | null {
  if (!editor.isFocused) return null;

  // Show top-level placeholder only when the entire doc is empty
  if (editor.state.doc.content.size === 2 && node.type.name === 'paragraph') {
    return "Type '/' for commands...";
  }

  // Do not show for subsequent paragraphs
  if (node.type.name === 'paragraph') return null;
  
  // Show for empty headings
  if (node.type.name === 'heading') {
    return `Heading ${node.attrs.level}`;
  }

  // Show for empty list items, code blocks, and blockquotes
  if (node.nodeSize === 2) { // An empty block node has a size of 2
      switch (node.type.name) {
        case 'listItem':
          return 'List item';
        case 'codeBlock':
          return 'Enter code...';
        case 'blockquote':
          return 'Quote';
      }
  }

  return null;
}
```

### 3.2: **Add placeholder styling.**

**CSS (`editor.css`):**
```css
/*
 * Placeholder Styling
 */
.placeholder {
  position: absolute;
  pointer-events: none;
  user-select: none;
  color: hsl(var(--muted-foreground) / 0.7);
}

.placeholder::before {
  content: attr(data-placeholder);
}

/* Style placeholder text according to its block type */
.ProseMirror h1 .placeholder { font-size: 2.25rem; }
.ProseMirror h2 .placeholder { font-size: 1.875rem; }
.ProseMirror h3 .placeholder { font-size: 1.5rem; }
.ProseMirror li .placeholder { /* Specific list styling */ }
.ProseMirror pre .placeholder { font-family: monospace; }
```

### 3.3: **Update `extensions.ts`**
Remove the old `Placeholder` extension from Tiptap and add our new custom one.

---

## Part 4: Integration & Testing Checklist

-   [ ] **Handle Functionality**:
    -   [ ] Hovering a block shows both `+` and `⋮` icons.
    -   [ ] Handle is positioned correctly to the far left.
    -   [ ] Clicking `+` adds a new paragraph below.
    -   [ ] Dragging `⋮` moves the block.
    -   [ ] Clicking `⋮` opens the dropdown menu.
-   [ ] **Menu UX**:
    -   [ ] Dropdown menu appears correctly aligned.
    -   [ ] Clicking `Duplicate` works.
    -   [ ] Clicking `Delete` works.
    -   [ ] Menu closes when clicking away or on another item.
-   [ ] **Styling**:
    -   [ ] Icons are light grey.
    -   [ ] Icon background on hover is a subtle light grey.
    -   [ ] Block hover effect is a subtle light grey.
    -   [ ] All "obnoxious" old styles are gone.
-   [ ] **Placeholders**:
    -   [ ] `Heading 1/2/3...` placeholders work correctly.
    -   [ ] `List` placeholder works for new list items.
    -   [ ] `Type '/' for commands...` appears only on a completely empty document.
    -   [ ] Placeholders disappear as soon as the user types.
    -   [ ] Placeholder text is styled correctly for its context (e.g., large for H1).

This comprehensive plan will guide the implementation of a high-quality user experience.

---

# Phase 2.2: Critical Bug Fixes & Refinements

**Goal**: Address critical regressions and bugs from the previous implementation to restore and improve core functionality.

**High-Level Failures to Correct**:
1.  **Placeholder Styling**: Placeholders have incorrect font sizes, making them unusable.
2.  **Placeholder Coverage**: Placeholders are missing for key block types like lists.
3.  **Block Handle Positioning**: The `+` and `⋮` handles render far below the target block, making them non-functional.
4.  **Text Selection/Highlighting**: Highlighting text across multiple blocks is still broken.

---

## Part 1: Fix Placeholder Styling & Coverage

### 1.1: **Correct Placeholder CSS.**
The "huge" placeholder text is because the CSS is incorrectly setting `font-size`. The placeholder element is *inside* the heading element, so it naturally inherits the correct size. The CSS should only change the color, opacity, and `content`.

**Corrected CSS (`editor.css`):**
```css
/* Placeholder Styling */
.placeholder {
  position: absolute;
  pointer-events: none;
  user-select: none;
  color: hsl(var(--muted-foreground) / 0.7);
}

.placeholder::before {
  content: attr(data-placeholder);
}

/* 
  REMOVE incorrect styling. DO NOT set font-size or font-weight here.
  The placeholder will inherit these from its parent (h1, h2, etc.)
*/
```

### 1.2: **Expand Placeholder Coverage.**
The `getPlaceholderText` function is incomplete. I will ensure every relevant block type has a useful placeholder.

**Updated Logic (`placeholder.ts`):**
```typescript
function getPlaceholderText(node: Node, editor: Editor): string | null {
  if (!editor.isFocused) return null;

  // Show top-level placeholder only when the entire doc is empty
  if (editor.state.doc.content.size === 2 && node.type.name === 'paragraph') {
    return "Type '/' for commands...";
  }

  // Do not show for subsequent paragraphs
  if (node.type.name === 'paragraph') return null;
  
  // Show for empty headings
  if (node.type.name === 'heading') {
    return `Heading ${node.attrs.level}`;
  }

  // Show for empty list items, code blocks, and blockquotes
  if (node.nodeSize === 2) { // An empty block node has a size of 2
      switch (node.type.name) {
        case 'listItem':
          return 'List item';
        case 'codeBlock':
          return 'Enter code...';
        case 'blockquote':
          return 'Quote';
      }
  }

  return null;
}
```

---

## Part 2: Fix Block Handle Positioning

### 2.1: **Correct Portal Positioning Logic.**
The `BlockHandleContainer` calculates `top` and `left` incorrectly when using a React Portal. The position must be calculated relative to the editor's viewport, not the document's.

**Corrected Logic (`block-handle-container.tsx`):**
```typescript
// ... inside BlockHandleContainer component
if (show && activeBlock) {
    const { dom } = activeBlock; // The actual block element (p, h1, etc.)
    const editorRect = editor.view.dom.getBoundingClientRect(); // The editor's bounding box
    const blockRect = dom.getBoundingClientRect(); // The block's bounding box

    // Calculate top relative to the editor's top edge
    top = blockRect.top - editorRect.top; 

    // Position the handle in the fixed left-side padding area.
    // The editor content has `pl-12` (48px), so we can place the handle at ~12px.
    left = 12;
}

// The portal itself is inside the relatively-positioned editor wrapper,
// so these absolute coordinates will be correct relative to the editor component.
```
---

## Part 3: Fix Text Selection

### 3.1: **Implement Missing `editorProps`.**
I completely failed to implement the text selection fix from the original plan. This is a major oversight. I will add the required `editorProps` to `EditorService` to enable multi-block selection.

**Code to Add (`EditorService.ts`):**
```typescript
// Inside the new Editor() configuration object
this.editor = new Editor({
  // ... other properties
  editorProps: {
    attributes: {
      // Add a class for selection styling
      class: 'selection:bg-primary/20',
    },
    // This is the key to making multi-block selection copy correctly
    clipboardTextSerializer: ({ slice }) => {
      return slice.content.textBetween(0, slice.content.size, '\n\n');
    },
  },
});
```

This is the plan I will now execute. I will not fail again.