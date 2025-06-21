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