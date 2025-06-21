# Complete Notion-Style Block System

## Overview
This implementation includes:
- Drag & drop with visual drop zones
- "+" button to add new blocks
- Grab handle menu with duplicate, delete, and convert options
- Dead zones between blocks
- Smooth animations

## 1. **Block Handle Component with Full Features**

```tsx
// features/editor/components/block-handle.tsx
import { useState, useRef } from 'react'
import { 
  GripVertical, 
  Plus, 
  Copy, 
  Trash2, 
  ChevronDown,
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code
} from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Editor } from '@tiptap/core'

interface BlockHandleProps {
  editor: Editor
  blockPos: number
  blockNode: any
  onDragStart: (e: React.DragEvent) => void
}

const BLOCK_TYPES = [
  { type: 'paragraph', icon: Type, label: 'Text' },
  { type: 'heading', level: 1, icon: Heading1, label: 'Heading 1' },
  { type: 'heading', level: 2, icon: Heading2, label: 'Heading 2' },
  { type: 'heading', level: 3, icon: Heading3, label: 'Heading 3' },
  { type: 'bulletList', icon: List, label: 'Bullet List' },
  { type: 'orderedList', icon: ListOrdered, label: 'Numbered List' },
  { type: 'blockquote', icon: Quote, label: 'Quote' },
  { type: 'codeBlock', icon: Code, label: 'Code' },
]

export function BlockHandle({ editor, blockPos, blockNode, onDragStart }: BlockHandleProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const dragRef = useRef<HTMLDivElement>(null)

  const handleAddBlock = () => {
    const endPos = blockPos + blockNode.nodeSize
    editor.chain()
      .focus()
      .insertContentAt(endPos, { type: 'paragraph' })
      .run()
  }

  const handleDuplicate = () => {
    const endPos = blockPos + blockNode.nodeSize
    const content = editor.state.doc.slice(blockPos, endPos)
    editor.chain()
      .focus()
      .insertContentAt(endPos, content.toJSON())
      .run()
    setMenuOpen(false)
  }

  const handleDelete = () => {
    editor.chain()
      .focus()
      .deleteRange({ from: blockPos, to: blockPos + blockNode.nodeSize })
      .run()
    setMenuOpen(false)
  }

  const handleConvertBlock = (type: string, attrs?: any) => {
    const { from, to } = { from: blockPos, to: blockPos + blockNode.nodeSize }
    
    if (type === 'bulletList' || type === 'orderedList') {
      editor.chain()
        .focus()
        .clearNodes()
        .toggleList(type as any, 'listItem')
        .run()
    } else {
      editor.chain()
        .focus()
        .setNodeSelection(from)
        .setNode(type, attrs)
        .run()
    }
    setMenuOpen(false)
  }

  const currentBlockType = blockNode.type.name
  const currentLevel = blockNode.attrs?.level

  return (
    <div className="block-handle">
      {/* Add Block Button */}
      <button
        className="handle-button add-button"
        onClick={handleAddBlock}
        title="Add block below"
      >
        <Plus size={18} />
      </button>

      {/* Drag Handle with Dropdown */}
      <DropdownMenu.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenu.Trigger asChild>
          <div
            ref={dragRef}
            className="handle-button drag-handle"
            draggable
            onDragStart={onDragStart}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setMenuOpen(true)
            }}
          >
            <GripVertical size={18} />
          </div>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content 
            className="dropdown-content"
            align="start"
            sideOffset={5}
          >
            {/* Action Items */}
            <DropdownMenu.Item 
              className="dropdown-item"
              onClick={handleDuplicate}
            >
              <Copy size={16} />
              <span>Duplicate</span>
            </DropdownMenu.Item>

            <DropdownMenu.Item 
              className="dropdown-item dropdown-item-danger"
              onClick={handleDelete}
            >
              <Trash2 size={16} />
              <span>Delete</span>
            </DropdownMenu.Item>

            <DropdownMenu.Separator className="dropdown-separator" />

            {/* Convert To Section */}
            <DropdownMenu.Label className="dropdown-label">
              Convert to
            </DropdownMenu.Label>

            {BLOCK_TYPES.map((blockType) => {
              const isActive = 
                currentBlockType === blockType.type && 
                (!blockType.level || currentLevel === blockType.level)

              return (
                <DropdownMenu.Item
                  key={`${blockType.type}-${blockType.level || ''}`}
                  className={`dropdown-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleConvertBlock(
                    blockType.type, 
                    blockType.level ? { level: blockType.level } : undefined
                  )}
                >
                  <blockType.icon size={16} />
                  <span>{blockType.label}</span>
                  {isActive && <ChevronDown size={16} className="ml-auto" />}
                </DropdownMenu.Item>
              )
            })}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}
```

## 2. **Drag & Drop System with Visual Indicators**

```tsx
// features/editor/components/block-drag-drop-container.tsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { Editor } from '@tiptap/react'
import { BlockHandle } from './block-handle'
import { motion, AnimatePresence } from 'framer-motion'

interface DragState {
  isDragging: boolean
  draggedBlockPos: number | null
  dropTargetPos: number | null
  dropIndicatorY: number | null
}

export function BlockDragDropContainer({ editor }: { editor: Editor }) {
  const [activeBlock, setActiveBlock] = useState<{
    pos: number
    node: any
    element: HTMLElement
    top: number
  } | null>(null)

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedBlockPos: null,
    dropTargetPos: null,
    dropIndicatorY: null
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const dragImageRef = useRef<HTMLDivElement>(null)

  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (!activeBlock) return

    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', activeBlock.pos.toString())

    // Create custom drag image
    if (dragImageRef.current) {
      const content = activeBlock.node.textContent || 'Block'
      dragImageRef.current.textContent = content.slice(0, 50) + (content.length > 50 ? '...' : '')
      e.dataTransfer.setDragImage(dragImageRef.current, 0, 20)
    }

    setDragState({
      isDragging: true,
      draggedBlockPos: activeBlock.pos,
      dropTargetPos: null,
      dropIndicatorY: null
    })

    // Add dragging class to editor
    editor.view.dom.classList.add('is-dragging')
  }, [activeBlock, editor])

  // Handle drag over
  const handleDragOver = useCallback((e: DragEvent) => {
    if (!dragState.isDragging) return
    e.preventDefault()

    const editorRect = editor.view.dom.getBoundingClientRect()
    const y = e.clientY

    // Find the closest block edge
    const blocks = Array.from(editor.view.dom.children) as HTMLElement[]
    let closestEdge = null
    let closestDistance = Infinity
    let dropPos = null

    blocks.forEach((block, index) => {
      const rect = block.getBoundingClientRect()
      const topDistance = Math.abs(y - rect.top)
      const bottomDistance = Math.abs(y - rect.bottom)

      if (topDistance < closestDistance) {
        closestDistance = topDistance
        closestEdge = rect.top - editorRect.top
        dropPos = editor.view.posAtDOM(block, 0)
      }

      if (bottomDistance < closestDistance) {
        closestDistance = bottomDistance
        closestEdge = rect.bottom - editorRect.top
        const pos = editor.view.posAtDOM(block, 0)
        dropPos = pos + block.textContent!.length + 1
      }
    })

    if (closestEdge !== null && dropPos !== null) {
      setDragState(prev => ({
        ...prev,
        dropTargetPos: dropPos,
        dropIndicatorY: closestEdge
      }))
    }
  }, [dragState.isDragging, editor])

  // Handle drop
  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    
    if (!dragState.isDragging || !dragState.draggedBlockPos || !dragState.dropTargetPos) {
      return
    }

    const { draggedBlockPos, dropTargetPos } = dragState

    // Get the dragged content
    const $from = editor.state.doc.resolve(draggedBlockPos)
    const $to = editor.state.doc.resolve(Math.min(
      draggedBlockPos + $from.parent.nodeSize,
      editor.state.doc.content.size
    ))
    const content = editor.state.doc.slice($from.pos, $to.pos)

    // Perform the move
    editor.chain()
      .deleteRange({ from: $from.pos, to: $to.pos })
      .insertContentAt(dropTargetPos, content.toJSON())
      .run()

    // Reset drag state
    setDragState({
      isDragging: false,
      draggedBlockPos: null,
      dropTargetPos: null,
      dropIndicatorY: null
    })

    editor.view.dom.classList.remove('is-dragging')
  }, [dragState, editor])

  // Set up drag event listeners
  useEffect(() => {
    const editorDom = editor.view.dom

    editorDom.addEventListener('dragover', handleDragOver)
    editorDom.addEventListener('drop', handleDrop)
    editorDom.addEventListener('dragend', () => {
      setDragState({
        isDragging: false,
        draggedBlockPos: null,
        dropTargetPos: null,
        dropIndicatorY: null
      })
      editor.view.dom.classList.remove('is-dragging')
    })

    return () => {
      editorDom.removeEventListener('dragover', handleDragOver)
      editorDom.removeEventListener('drop', handleDrop)
    }
  }, [handleDragOver, handleDrop, editor])

  // Mouse tracking for handle visibility (with dead zones)
  useEffect(() => {
    let animationFrame: number
    let timeout: NodeJS.Timeout

    const handleMouseMove = (e: MouseEvent) => {
      if (animationFrame) cancelAnimationFrame(animationFrame)
      
      animationFrame = requestAnimationFrame(() => {
        const editorRect = editor.view.dom.getBoundingClientRect()
        
        // Check if in handle zone
        if (
          e.clientX < editorRect.left - 100 ||
          e.clientX > editorRect.left - 20 ||
          e.clientY < editorRect.top ||
          e.clientY > editorRect.bottom
        ) {
          clearTimeout(timeout)
          timeout = setTimeout(() => setActiveBlock(null), 100)
          return
        }

        // Find block with dead zones
        const blocks = Array.from(editor.view.dom.children) as HTMLElement[]
        let hoveredBlock = null

        for (const block of blocks) {
          const rect = block.getBoundingClientRect()
          const deadZoneSize = 3
          
          if (
            e.clientY >= rect.top + deadZoneSize &&
            e.clientY <= rect.bottom - deadZoneSize
          ) {
            const pos = editor.view.posAtDOM(block, 0)
            const node = editor.state.doc.nodeAt(pos)
            
            if (node) {
              hoveredBlock = {
                pos,
                node,
                element: block,
                top: rect.top - editorRect.top
              }
            }
            break
          }
        }

        clearTimeout(timeout)
        if (hoveredBlock) {
          setActiveBlock(hoveredBlock)
        } else {
          timeout = setTimeout(() => setActiveBlock(null), 100)
        }
      })
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      if (animationFrame) cancelAnimationFrame(animationFrame)
      clearTimeout(timeout)
    }
  }, [editor])

  return (
    <>
      {/* Hidden drag image */}
      <div
        ref={dragImageRef}
        className="drag-image"
        style={{
          position: 'absolute',
          top: '-1000px',
          left: '-1000px',
          padding: '8px 16px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          borderRadius: '4px',
          fontSize: '14px',
          maxWidth: '300px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      />

      {/* Block Handle */}
      <AnimatePresence>
        {activeBlock && !dragState.isDragging && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: activeBlock.top,
              left: -52,
              zIndex: 50
            }}
          >
            <BlockHandle
              editor={editor}
              blockPos={activeBlock.pos}
              blockNode={activeBlock.node}
              onDragStart={handleDragStart}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drop Indicator */}
      <AnimatePresence>
        {dragState.dropIndicatorY !== null && (
          <motion.div
            className="drop-indicator"
            initial={{ opacity: 0, scaleX: 0.8 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0, scaleX: 0.8 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: dragState.dropIndicatorY - 1,
              left: 0,
              right: 0,
              height: '2px',
              background: 'rgb(59, 130, 246)',
              pointerEvents: 'none',
              zIndex: 100
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: '-4px',
                top: '-3px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'rgb(59, 130, 246)'
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
```

## 3. **Complete CSS Styles**

```css
/* features/editor/styles/notion-block-system.css */

/* Editor Container */
.editor-wrapper {
  position: relative;
  padding-left: 60px;
}

.ProseMirror {
  position: relative;
}

/* Block Handle Styles */
.block-handle {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px;
  background: white;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.handle-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.handle-button:hover {
  color: hsl(var(--foreground));
  background: hsl(var(--accent));
}

.drag-handle {
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}

/* Add button specific styles */
.add-button {
  position: relative;
}

.add-button:hover {
  color: hsl(var(--primary));
}

/* Dropdown Menu Styles */
.dropdown-content {
  min-width: 220px;
  background: white;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 10px 38px -10px rgba(22, 23, 24, 0.35),
    0 10px 20px -15px rgba(22, 23, 24, 0.2);
  animation: slideDownAndFade 0.2s ease;
}

@keyframes slideDownAndFade {
  from {
    opacity: 0;
    transform: translateY(-2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1;
  color: hsl(var(--foreground));
  cursor: pointer;
  outline: none;
  user-select: none;
  transition: all 0.15s ease;
}

.dropdown-item:hover {
  background: hsl(var(--accent));
}

.dropdown-item.active {
  background: hsl(var(--accent));
  font-weight: 500;
}

.dropdown-item-danger {
  color: hsl(var(--destructive));
}

.dropdown-item-danger:hover {
  background: hsl(var(--destructive) / 0.1);
}

.dropdown-separator {
  height: 1px;
  background: hsl(var(--border));
  margin: 4px -4px;
}

.dropdown-label {
  padding: 6px 8px;
  font-size: 12px;
  font-weight: 500;
  color: hsl(var(--muted-foreground));
}

/* Dragging States */
.ProseMirror.is-dragging {
  cursor: grabbing !important;
}

.ProseMirror.is-dragging * {
  cursor: grabbing !important;
  user-select: none !important;
}

/* Block being dragged */
.ProseMirror.is-dragging .dragging-block {
  opacity: 0.5;
}

/* Drop indicator line */
.drop-indicator {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: rgb(59, 130, 246);
  pointer-events: none;
}

/* Dead zones for smooth transitions */
.ProseMirror > * {
  position: relative;
  margin-bottom: 1px; /* Creates dead zone */
}

/* Hover zones */
.ProseMirror > *::before {
  content: '';
  position: absolute;
  left: -80px;
  top: 3px; /* Dead zone offset */
  right: 0;
  bottom: 3px; /* Dead zone offset */
  pointer-events: none;
  /* Debug: uncomment to see zones */
  /* background: rgba(255, 0, 0, 0.1); */
}
```

## 4. **Integration with Editor**

```tsx
// features/editor/components/editor.tsx
import { BlockDragDropContainer } from './block-drag-drop-container'

export function Editor({ content, onChange }: EditorProps) {
  // ... existing editor setup ...

  return (
    <div className="editor-wrapper relative">
      {editor && isReady && (
        <BlockDragDropContainer editor={editor} />
      )}
      <EditorBubbleMenu editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
```

## 5. **Required Dependencies**

```bash
npm install @radix-ui/react-dropdown-menu framer-motion lucide-react
```

## Key Features Implemented:

1. **Drag & Drop**:
   - Visual drag preview
   - Drop indicator line
   - Smooth animations
   - Proper content moving

2. **"+" Button**:
   - Adds new paragraph below current block
   - Could be extended to show block type picker

3. **Block Menu**:
   - Duplicate block
   - Delete block
   - Convert between block types (paragraph, headings, lists, etc.)

4. **Dead Zones**:
   - 3px dead zones between blocks
   - Smooth transitions
   - No flickering

5. **Visual Polish**:
   - Framer Motion animations
   - Radix UI dropdown for accessibility
   - Hover states and transitions