# Final Implementation Plan: BlockWrapper Architecture

**Created**: December 20, 2024  
**Epic**: 1.7 - Improve Editor  
**Author**: AI Senior Full-Stack Engineer  
**Status**: Ready for Implementation

## Executive Summary

This plan details the complete migration from the flawed overlay system to the correct BlockWrapper architecture. No feature flags, no parallel systems - a clean, comprehensive migration that implements the original vision properly.

## Architecture Overview

### Core Concept
- **React BlockWrapper** components for UI and interaction zones
- **Native Tiptap** content via NodeViewContent
- **CSS-based hover detection** (no JavaScript mouse tracking)
- **Integrated drag & drop** with proper focus management

### Component Structure
```
BlockWrapper (React)
├── hover-target (invisible, extends into margins)
├── BlockHandle (visible on hover)
└── block-content
    └── NodeViewContent (native Tiptap editing)
```

## Implementation Phases

### Phase 1: BlockWrapper Foundation (4 hours)

#### 1.1 Create Base BlockWrapper Component
**File**: `features/editor/components/block-wrapper.tsx`

```typescript
import React, { useEffect, useCallback } from 'react'
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import { Node } from '@tiptap/pm/model'
import { Editor } from '@tiptap/core'
import { BlockHandle } from './block-handle'
import { generateBlockId } from '../utils/block-id'

interface BlockWrapperProps {
  node: Node
  updateAttributes: (attrs: Record<string, any>) => void
  deleteNode: () => void
  selected: boolean
  editor: Editor
  getPos: () => number
  children?: React.ReactNode
  className?: string
}

export const BlockWrapper = React.memo(({ 
  node, 
  updateAttributes, 
  deleteNode,
  selected,
  editor, 
  getPos,
  children,
  className = ''
}: BlockWrapperProps) => {
  const [isHovering, setIsHovering] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const blockId = node.attrs.id || generateBlockId()

  // Ensure block has ID
  useEffect(() => {
    if (!node.attrs.id) {
      updateAttributes({ id: blockId })
    }
  }, [])

  // Drag handlers with focus management
  const handleDragStart = useCallback((e: React.DragEvent) => {
    setIsDragging(true)
    
    // Critical: Clear selection and blur to hide placeholders
    editor.commands.blur()
    editor.view.dom.classList.add('is-dragging')
    
    // Set drag data
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('application/x-tiptap-block', JSON.stringify({
      blockId: blockId,
      blockPos: getPos(),
      nodeSize: node.nodeSize
    }))
    
    // Custom drag preview
    const preview = document.createElement('div')
    preview.className = 'drag-preview'
    preview.textContent = node.textContent || 'Block'
    document.body.appendChild(preview)
    e.dataTransfer.setDragImage(preview, 0, 0)
    setTimeout(() => preview.remove(), 0)
  }, [blockId, getPos, node, editor])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
    editor.view.dom.classList.remove('is-dragging')
  }, [editor])

  return (
    <NodeViewWrapper 
      className={`block-wrapper ${className} ${selected ? 'is-selected' : ''} ${isDragging ? 'is-dragging' : ''}`}
      data-block-id={blockId}
      data-block-type={node.type.name}
    >
      {/* Invisible hover target extending into margins */}
      <div 
        className="hover-target"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      />
      
      {/* Block handle - only visible on hover */}
      <BlockHandle
        visible={isHovering && !isDragging}
        editor={editor}
        node={node}
        pos={getPos()}
        onDelete={deleteNode}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      />
      
      {/* Block content */}
      <div className="block-content">
        {children || <NodeViewContent />}
      </div>
    </NodeViewWrapper>
  )
}, (prevProps, nextProps) => {
  // Optimize re-renders
  return prevProps.node.eq(nextProps.node) && 
         prevProps.selected === nextProps.selected
})
```

#### 1.2 Update BlockHandle Component
**File**: `features/editor/components/block-handle.tsx`

Key changes:
- Remove portal logic
- Position relatively within BlockWrapper
- Add proper drag event handlers
- Ensure menu stays open during interaction

#### 1.3 Error Boundary Wrapper
**File**: `features/editor/components/block-error-boundary.tsx`

```typescript
export class BlockErrorBoundary extends React.Component {
  // ... error boundary implementation
  
  render() {
    if (this.state.hasError) {
      return <div className="block-error">Block render error</div>
    }
    return this.props.children
  }
}
```

### Phase 2: Block-Specific Components (4 hours)

#### 2.1 Paragraph Block
**File**: `features/editor/blocks/paragraph-block.tsx`

```typescript
import { BlockWrapper } from '../components/block-wrapper'
import { NodeViewContent } from '@tiptap/react'
import { BlockErrorBoundary } from '../components/block-error-boundary'

export const ParagraphBlock = (props) => (
  <BlockErrorBoundary>
    <BlockWrapper {...props}>
      <NodeViewContent as="p" className="paragraph-content" />
    </BlockWrapper>
  </BlockErrorBoundary>
)
```

#### 2.2 Heading Block
**File**: `features/editor/blocks/heading-block.tsx`

```typescript
export const HeadingBlock = (props) => {
  const level = props.node.attrs.level || 1
  const Tag = `h${level}` as keyof JSX.IntrinsicElements
  
  return (
    <BlockErrorBoundary>
      <BlockWrapper {...props} className={`heading-${level}`}>
        <NodeViewContent as={Tag} className="heading-content" />
      </BlockWrapper>
    </BlockErrorBoundary>
  )
}
```

#### 2.3 List Blocks (Special Handling)
**File**: `features/editor/blocks/list-item-block.tsx`

```typescript
export const ListItemBlock = (props) => (
  <BlockErrorBoundary>
    <BlockWrapper {...props} className="list-item nested-block">
      <NodeViewContent as="li" className="list-item-content" />
    </BlockWrapper>
  </BlockErrorBoundary>
)
```

#### 2.4 Code Block
**File**: `features/editor/blocks/code-block.tsx`

```typescript
export const CodeBlock = (props) => {
  const language = props.node.attrs.language || 'plaintext'
  
  return (
    <BlockErrorBoundary>
      <BlockWrapper {...props} className="code-block">
        <select 
          value={language} 
          onChange={(e) => props.updateAttributes({ language: e.target.value })}
          contentEditable={false}
        >
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          {/* ... more languages */}
        </select>
        <NodeViewContent as="pre" className={`language-${language}`}>
          <code />
        </NodeViewContent>
      </BlockWrapper>
    </BlockErrorBoundary>
  )
}
```

### Phase 3: Drag & Drop System (3 hours)

#### 3.1 Drag & Drop Plugin
**File**: `features/editor/plugins/block-drag-drop.ts`

```typescript
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

const dragDropKey = new PluginKey('blockDragDrop')

export const createBlockDragDropPlugin = () => {
  return new Plugin({
    key: dragDropKey,
    
    state: {
      init() {
        return {
          draggedBlockId: null,
          dropTargetPos: null
        }
      },
      
      apply(tr, value) {
        const meta = tr.getMeta(dragDropKey)
        if (meta) {
          return { ...value, ...meta }
        }
        return value
      }
    },
    
    props: {
      decorations(state) {
        const { dropTargetPos } = dragDropKey.getState(state)
        if (!dropTargetPos) return DecorationSet.empty
        
        // Create drop indicator
        const dropIndicator = Decoration.widget(dropTargetPos, () => {
          const el = document.createElement('div')
          el.className = 'drop-indicator'
          return el
        })
        
        return DecorationSet.create(state.doc, [dropIndicator])
      },
      
      handleDOMEvents: {
        dragover(view, event) {
          event.preventDefault()
          
          // Calculate drop position
          const pos = view.posAtCoords({
            left: event.clientX,
            top: event.clientY
          })
          
          if (pos) {
            view.dispatch(
              view.state.tr.setMeta(dragDropKey, { dropTargetPos: pos.pos })
            )
          }
          
          return true
        },
        
        drop(view, event) {
          event.preventDefault()
          
          const data = event.dataTransfer?.getData('application/x-tiptap-block')
          if (!data) return false
          
          const { blockId, blockPos, nodeSize } = JSON.parse(data)
          const dropPos = view.posAtCoords({
            left: event.clientX,
            top: event.clientY
          })
          
          if (!dropPos) return false
          
          // Perform the move
          const tr = view.state.tr
          const targetPos = dropPos.pos
          
          // Delete from source
          tr.delete(blockPos, blockPos + nodeSize)
          
          // Insert at target (adjust if needed)
          const mappedPos = tr.mapping.map(targetPos)
          const node = view.state.doc.nodeAt(blockPos)
          if (node) {
            tr.insert(mappedPos, node)
          }
          
          // Clear drop indicator
          tr.setMeta(dragDropKey, { dropTargetPos: null })
          
          view.dispatch(tr)
          return true
        },
        
        dragleave(view) {
          view.dispatch(
            view.state.tr.setMeta(dragDropKey, { dropTargetPos: null })
          )
          return false
        }
      }
    }
  })
}
```

### Phase 4: CSS Architecture (2 hours)

#### 4.1 Block System CSS
**File**: `features/editor/styles/block-system-final.css`

```css
/* Block wrapper structure */
.block-wrapper {
  position: relative;
  margin: 0;
}

/* Invisible hover target extending into margins */
.hover-target {
  position: absolute;
  top: 0;
  bottom: 0;
  left: -3rem;
  right: -3rem;
  z-index: 1;
  pointer-events: none;
}

/* Enable pointer events on hover */
.block-wrapper:hover .hover-target {
  pointer-events: all;
}

/* Block handle positioning and visibility */
.block-handle {
  position: absolute;
  left: -2.5rem;
  top: 0;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 10;
  pointer-events: none;
}

.block-wrapper:hover .block-handle {
  opacity: 1;
  pointer-events: all;
}

/* Block content */
.block-content {
  position: relative;
  z-index: 2;
}

/* Ensure empty blocks have height */
.block-content:empty {
  min-height: 1.5em;
}

/* Block spacing */
.block-wrapper + .block-wrapper {
  margin-top: 0.25rem;
}

/* Nested blocks (lists) */
.nested-block .hover-target {
  left: -1.5rem; /* Less extension for nested items */
}

/* Selected state */
.block-wrapper.is-selected {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
  border-radius: 4px;
}

/* Dragging states */
.block-wrapper.is-dragging {
  opacity: 0.3;
}

.ProseMirror.is-dragging {
  cursor: grabbing !important;
  caret-color: transparent;
}

/* Hide placeholders during drag */
.ProseMirror.is-dragging .is-empty::before {
  display: none !important;
}

/* Drop indicator */
.drop-indicator {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: hsl(var(--primary));
  box-shadow: 0 0 8px hsl(var(--primary) / 0.5);
  pointer-events: none;
  z-index: 100;
}

/* Drag preview */
.drag-preview {
  position: fixed;
  padding: 0.5rem 1rem;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  pointer-events: none;
  z-index: 9999;
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Block-specific styles */
.heading-1 { font-size: 2rem; font-weight: 700; }
.heading-2 { font-size: 1.5rem; font-weight: 600; }
.heading-3 { font-size: 1.25rem; font-weight: 600; }

.code-block pre {
  background: hsl(var(--muted));
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
}
```

### Phase 5: Extension Configuration (3 hours)

#### 5.1 Update Extensions
**File**: `features/editor/config/extensions.ts`

```typescript
import { ReactNodeViewRenderer } from '@tiptap/react'
import { ParagraphBlock } from '../blocks/paragraph-block'
import { HeadingBlock } from '../blocks/heading-block'
// ... other block imports

export const getEditorExtensions = (errorRegistry, container) => {
  return [
    StarterKit.configure({
      paragraph: false,
      heading: false,
      // ... disable all blocks we're replacing
    }),
    
    // Paragraph with React node view
    Paragraph.extend({
      addNodeView() {
        return ReactNodeViewRenderer(ParagraphBlock)
      }
    }),
    
    // Heading with React node view
    Heading.extend({
      addNodeView() {
        return ReactNodeViewRenderer(HeadingBlock)
      }
    }),
    
    // ... other blocks
    
    // Drag & Drop plugin
    createBlockDragDropPlugin(),
    
    // Block ID system (keep existing)
    BlockId,
  ]
}
```

### Phase 6: Migration & Cleanup (2 hours)

#### 6.1 Remove Old System
1. Delete `BlockHandleOverlay` component
2. Delete `block-ui-plugin.tsx`
3. Remove overlay-related imports from Editor
4. Delete test utilities for old system

#### 6.2 Update Editor Component
**File**: `features/editor/components/editor.tsx`

Remove all overlay logic, simplify to just:
```typescript
<ErrorBoundary>
  <div ref={containerRef} className="editor-wrapper">
    <EditorContent editor={editor} />
    <EditorBubbleMenu editor={editor} />
    <GhostTextHandler editor={editor} />
  </div>
</ErrorBoundary>
```

### Phase 7: Testing & Edge Cases (3 hours)

#### 7.1 Comprehensive Test Suite
1. **Hover behavior**:
   - Hover from content into margin
   - Quick mouse movements
   - Multiple blocks in sequence

2. **Drag & Drop**:
   - Drag between blocks
   - Drag to top/bottom
   - Cancel drag (ESC)
   - Drag preview appearance

3. **Edge cases**:
   - Empty blocks
   - Very long blocks
   - Nested lists
   - Mixed block types

4. **Performance**:
   - 100+ blocks
   - Rapid block creation
   - Memory leaks

#### 7.2 Browser Testing
- Chrome, Firefox, Safari
- Different viewport sizes
- Touch devices (if applicable)

## Critical Implementation Details

### Z-Index Layering
```
.block-content: z-index: 2 (top)
.block-handle: z-index: 10 (above content when visible)
.hover-target: z-index: 1 (below content, for hover detection)
.drop-indicator: z-index: 100 (always on top)
```

### Performance Optimizations
1. Memoize all block components
2. Use CSS transforms for animations
3. Debounce attribute updates
4. Lazy load block handle menu

### Accessibility
1. Keyboard navigation for handles
2. ARIA labels for drag operations
3. Screen reader announcements

## Success Metrics

1. **Hover zones work flawlessly** - No dead spots
2. **Drag & drop is smooth** - 60fps during drag
3. **No content editing issues** - Native behavior preserved
4. **Performance** - No lag with 100+ blocks
5. **Zero console errors** - Production ready

## Total Timeline

- **Phase 1**: BlockWrapper Foundation - 4 hours
- **Phase 2**: Block Components - 4 hours  
- **Phase 3**: Drag & Drop - 3 hours
- **Phase 4**: CSS - 2 hours
- **Phase 5**: Extensions - 3 hours
- **Phase 6**: Migration - 2 hours
- **Phase 7**: Testing - 3 hours

**Total**: 21 hours (realistic for production-ready implementation)

## Implementation Order

1. Start with BlockWrapper and one block type (paragraph)
2. Verify hover zones work perfectly
3. Add drag & drop
4. Extend to other block types
5. Remove old system only after new is proven

This ensures we always have a working editor and can validate each step.

---

*This plan incorporates all feedback and creates a robust, production-ready implementation with no technical debt.* 