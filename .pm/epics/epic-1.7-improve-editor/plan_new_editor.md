# Notion-Style Block Editor - Complete Implementation Guide

## Executive Summary

This document provides a comprehensive guide to transform the current block editor implementation into a robust, Notion-like editing experience. The approach maintains React components for blocks while fixing current issues and adding missing features.

## Current State Analysis

### Issues to Fix
1. **Text Invisibility**: Content is not visible/editable due to CSS or contentEditable issues
2. **Slash Command Error**: `Cannot read properties of undefined (reading '0')`
3. **Performance**: Every block wrapped in React causing overhead
4. **Drag/Drop**: Incomplete implementation with missing visual feedback
5. **Focus Management**: Placeholders remain visible during drag operations

### What's Working
1. Basic block structure with React components
2. Tiptap integration
3. Block identification system
4. Initial drag handle UI

## Target Architecture (Notion-Style)

### Core Principles
1. **Every block is a React component** with standardized interface
2. **ContentEditable inside blocks**, not fighting React
3. **Unified hover/drag system** per block
4. **Smart performance optimizations** only where needed
5. **Clean separation** between block types

## Implementation Guide

### Phase 1: Fix Critical Issues (Day 1)

#### 1.1 Fix Slash Command Error
```typescript
// features/editor/extensions/slash-command.tsx
// Fix the undefined popup error

const SlashCommand = Command.configure({
  suggestion: {
    items: getSuggestionItems,
    render: () => {
      let component: ReactRenderer | null = null;
      let popup: Instance[] | null = null;

      return {
        onStart: (props) => {
          component = new ReactRenderer(CommandList, {
            props,
            editor: props.editor,
          });

          if (!props.clientRect) {
            return;
          }

          popup = tippy('body', {
            getReferenceClientRect: props.clientRect as any,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'bottom-start',
          });
        },

        onUpdate: (props) => {
          component?.updateProps(props);

          if (!props.clientRect) {
            return;
          }

          popup?.[0]?.setProps({
            getReferenceClientRect: props.clientRect as any,
          });
        },

        onKeyDown: (props) => {
          if (props.event.key === 'Escape') {
            popup?.[0]?.hide();
            return true;
          }

          return component?.ref?.onKeyDown(props);
        },

        onExit: () => {
          // Safe cleanup with null checks
          if (popup && popup.length > 0 && popup[0]) {
            popup[0].destroy();
          }
          if (component) {
            component.destroy();
          }
          popup = null;
          component = null;
        },
      };
    },
  },
});
```

#### 1.2 Fix Content Visibility
```typescript
// features/editor/extensions/react-node-view.tsx
// Ensure content is properly editable

import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';

export const BlockWrapper = ({ node, getPos, editor, updateAttributes, deleteNode }) => {
  const [showHandle, setShowHandle] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const blockId = node.attrs.id || generateBlockId();

  // Update block ID if missing
  useEffect(() => {
    if (!node.attrs.id) {
      updateAttributes({ id: blockId });
    }
  }, []);

  return (
    <NodeViewWrapper 
      className="block-wrapper"
      data-block-id={blockId}
      data-block-type={node.type.name}
    >
      <div 
        className="relative"
        onMouseEnter={() => setShowHandle(true)}
        onMouseLeave={() => setShowHandle(false)}
      >
        {/* Invisible full-width hover target */}
        <div 
          className="block-hover-target"
          aria-hidden="true"
        />
        
        {/* Block handle - shows on hover */}
        {showHandle && !isDragging && (
          <BlockHandle
            blockId={blockId}
            blockPos={getPos()}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setIsDragging(false)}
            onDelete={deleteNode}
            editor={editor}
          />
        )}
        
        {/* CRITICAL: NodeViewContent must be used for editable content */}
        <div className={cn("block-content", isDragging && "opacity-50")}>
          <NodeViewContent 
            className="outline-none"
            // This ensures content is editable
            contentEditable={editor.isEditable}
          />
        </div>
      </div>
    </NodeViewWrapper>
  );
};
```

#### 1.3 Critical CSS Fixes
```css
/* features/editor/styles/editor.css */

/* Ensure content is visible and editable */
.ProseMirror {
  /* Base styles */
  outline: none;
  min-height: 100vh;
  padding: 2rem 3rem;
}

/* CRITICAL: Make NodeViewContent editable */
.node-view-content {
  outline: none !important;
}

/* Fix for content visibility */
.block-content {
  position: relative;
  z-index: 1;
}

/* Ensure text is visible */
.block-wrapper p,
.block-wrapper h1,
.block-wrapper h2,
.block-wrapper h3,
.block-wrapper h4,
.block-wrapper h5,
.block-wrapper h6 {
  margin: 0;
  padding: 0;
  min-height: 1.5em;
}

/* Block spacing - 4px between all blocks */
.block-wrapper {
  margin-bottom: 0.25rem;
}

.block-wrapper:last-child {
  margin-bottom: 0;
}

/* Invisible hover target */
.block-hover-target {
  position: absolute;
  top: 0;
  bottom: 0;
  left: -3rem; /* Extend into left margin */
  right: -3rem; /* Extend into right margin */
  z-index: 0;
}
```

### Phase 2: Implement Proper Block System (Day 2)

#### 2.1 Base Block Architecture
```typescript
// features/editor/blocks/base-block.tsx
// Standardized block interface

interface BaseBlockProps {
  node: Node;
  updateAttributes: (attrs: Record<string, any>) => void;
  deleteNode: () => void;
  selected: boolean;
  editor: Editor;
  getPos: () => number;
}

export const BaseBlock: FC<PropsWithChildren<BaseBlockProps>> = ({
  node,
  updateAttributes,
  deleteNode,
  selected,
  editor,
  getPos,
  children
}) => {
  const [showHandle, setShowHandle] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const blockRef = useRef<HTMLDivElement>(null);
  const blockId = node.attrs.id || generateBlockId();

  // Ensure block has ID
  useEffect(() => {
    if (!node.attrs.id) {
      updateAttributes({ id: blockId });
    }
  }, []);

  // Handle drag start with focus management
  const handleDragStart = useCallback((e: DragEvent) => {
    setIsDragging(true);
    
    // Critical: Blur editor to hide placeholders
    editor.commands.blur();
    
    // Add dragging class to editor
    const editorEl = editor.view.dom;
    editorEl.classList.add('is-dragging');
    
    // Set drag data
    const dragData = {
      blockId,
      blockPos: getPos(),
      type: node.type.name
    };
    
    e.dataTransfer!.effectAllowed = 'move';
    e.dataTransfer!.setData('application/x-tiptap-block', JSON.stringify(dragData));
    
    // Create custom drag preview
    createDragPreview(e, blockRef.current);
  }, [blockId, getPos, node.type.name, editor]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    
    // Remove dragging class
    const editorEl = editor.view.dom;
    editorEl.classList.remove('is-dragging');
    
    // Cleanup drag preview
    cleanupDragPreview();
  }, [editor]);

  return (
    <NodeViewWrapper 
      ref={blockRef}
      className={cn(
        "block-wrapper",
        `block-type-${node.type.name}`,
        selected && "is-selected",
        isDragging && "is-dragging"
      )}
      data-block-id={blockId}
      data-block-type={node.type.name}
      data-block-pos={getPos()}
    >
      <div 
        className="block-container"
        onMouseEnter={() => setShowHandle(true)}
        onMouseLeave={() => setShowHandle(false)}
      >
        {/* Full-width hover target */}
        <div className="block-hover-target" />
        
        {/* Block handle */}
        <BlockHandle
          visible={showHandle && !isDragging}
          blockId={blockId}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDelete={deleteNode}
          editor={editor}
        />
        
        {/* Block content */}
        <div className="block-content">
          {children}
        </div>
      </div>
    </NodeViewWrapper>
  );
};
```

#### 2.2 Block Handle Component
```typescript
// features/editor/components/block-handle.tsx

interface BlockHandleProps {
  visible: boolean;
  blockId: string;
  onDragStart: (e: DragEvent) => void;
  onDragEnd: () => void;
  onDelete: () => void;
  editor: Editor;
}

export const BlockHandle: FC<BlockHandleProps> = ({
  visible,
  blockId,
  onDragStart,
  onDragEnd,
  onDelete,
  editor
}) => {
  const dragRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Setup drag handling
  useEffect(() => {
    const dragHandle = dragRef.current;
    if (!dragHandle) return;

    const handleDragStart = (e: DragEvent) => {
      e.stopPropagation();
      onDragStart(e);
    };

    const handleDragEnd = (e: DragEvent) => {
      e.stopPropagation();
      onDragEnd();
    };

    dragHandle.addEventListener('dragstart', handleDragStart);
    dragHandle.addEventListener('dragend', handleDragEnd);

    return () => {
      dragHandle.removeEventListener('dragstart', handleDragStart);
      dragHandle.removeEventListener('dragend', handleDragEnd);
    };
  }, [onDragStart, onDragEnd]);

  return (
    <div 
      className={cn(
        "block-handle",
        visible && "is-visible"
      )}
      contentEditable={false}
    >
      {/* Drag Handle */}
      <button
        ref={dragRef}
        className="drag-handle"
        draggable
        aria-label="Drag to move"
        onMouseDown={(e) => e.preventDefault()}
      >
        <GripVertical size={16} />
      </button>

      {/* Action Menu */}
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <button 
            className="action-handle"
            aria-label="Block actions"
          >
            <MoreHorizontal size={16} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="right" sideOffset={5}>
          <DropdownMenuItem onClick={() => convertBlock('heading1')}>
            <Type size={16} className="mr-2" />
            Turn into heading 1
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => convertBlock('heading2')}>
            <Type size={14} className="mr-2" />
            Turn into heading 2
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => convertBlock('paragraph')}>
            <Pilcrow size={16} className="mr-2" />
            Turn into text
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 size={16} className="mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
```

#### 2.3 Individual Block Types
```typescript
// features/editor/blocks/paragraph-block.tsx

export const ParagraphBlock = (props: BaseBlockProps) => {
  return (
    <BaseBlock {...props}>
      <NodeViewContent 
        as="p"
        className={cn(
          "min-h-[1.5em]",
          "outline-none",
          "text-base",
          "leading-relaxed"
        )}
      />
    </BaseBlock>
  );
};

// features/editor/blocks/heading-block.tsx

export const HeadingBlock = (props: BaseBlockProps) => {
  const level = props.node.attrs.level || 1;
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3';

  return (
    <BaseBlock {...props}>
      <NodeViewContent 
        as={Tag}
        className={cn(
          "outline-none font-bold",
          level === 1 && "text-3xl",
          level === 2 && "text-2xl", 
          level === 3 && "text-xl"
        )}
      />
    </BaseBlock>
  );
};

// features/editor/blocks/code-block.tsx

export const CodeBlock = (props: BaseBlockProps) => {
  const language = props.node.attrs.language || 'javascript';

  return (
    <BaseBlock {...props}>
      <pre className="bg-muted rounded-md p-4 overflow-x-auto">
        <NodeViewContent 
          as="code"
          className={cn(
            "text-sm",
            "font-mono",
            `language-${language}`
          )}
        />
      </pre>
    </BaseBlock>
  );
};
```

### Phase 3: Drag and Drop System (Day 3)

#### 3.1 Drag and Drop Manager
```typescript
// features/editor/services/drag-drop-manager.ts

class DragDropManager {
  private dragPreview: HTMLElement | null = null;
  private dropIndicator: HTMLElement | null = null;
  private dragData: DragData | null = null;
  private autoScrollTimer: number | null = null;

  startDrag(e: DragEvent, data: DragData) {
    this.dragData = data;
    this.createDragPreview(e);
    this.hideDragImage(e);
  }

  private createDragPreview(e: DragEvent) {
    const blockEl = document.querySelector(`[data-block-id="${this.dragData!.blockId}"]`);
    if (!blockEl) return;

    // Clone block content for preview
    const content = blockEl.querySelector('.block-content');
    if (!content) return;

    this.dragPreview = document.createElement('div');
    this.dragPreview.className = 'drag-preview';
    
    // Clone and truncate content
    const clonedContent = content.cloneNode(true) as HTMLElement;
    const textContent = clonedContent.textContent || '';
    
    if (textContent.length > 100) {
      this.dragPreview.textContent = textContent.substring(0, 100) + '...';
    } else {
      this.dragPreview.appendChild(clonedContent);
    }

    // Position and style
    this.dragPreview.style.cssText = `
      position: fixed;
      left: ${e.clientX + 10}px;
      top: ${e.clientY + 10}px;
      max-width: 300px;
      padding: 8px 16px;
      background: hsl(var(--background));
      border: 1px solid hsl(var(--border));
      border-radius: 6px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      pointer-events: none;
      z-index: 9999;
      opacity: 0.9;
      transform: rotate(-2deg);
    `;

    document.body.appendChild(this.dragPreview);
  }

  updateDrag(e: DragEvent) {
    if (!this.dragPreview) return;

    // Throttle updates to 60fps
    requestAnimationFrame(() => {
      if (this.dragPreview) {
        this.dragPreview.style.left = `${e.clientX + 10}px`;
        this.dragPreview.style.top = `${e.clientY + 10}px`;
      }
    });

    // Handle auto-scroll
    this.handleAutoScroll(e);
  }

  showDropIndicator(editor: Editor, pos: number) {
    if (!this.dropIndicator) {
      this.dropIndicator = document.createElement('div');
      this.dropIndicator.className = 'drop-indicator';
      editor.view.dom.appendChild(this.dropIndicator);
    }

    const coords = editor.view.coordsAtPos(pos);
    const editorRect = editor.view.dom.getBoundingClientRect();

    this.dropIndicator.style.cssText = `
      position: absolute;
      left: 0;
      right: 0;
      height: 28px;
      top: ${coords.top - editorRect.top - 14}px;
      background: rgba(59, 130, 246, 0.08);
      border: 2px solid rgba(59, 130, 246, 0.3);
      border-radius: 4px;
      pointer-events: none;
      transition: all 0.2s ease;
      z-index: 5;
    `;
  }

  private handleAutoScroll(e: DragEvent) {
    const threshold = 100;
    const speed = 5;
    const viewportHeight = window.innerHeight;

    if (e.clientY < threshold) {
      this.startAutoScroll(-speed);
    } else if (e.clientY > viewportHeight - threshold) {
      this.startAutoScroll(speed);
    } else {
      this.stopAutoScroll();
    }
  }

  private startAutoScroll(speed: number) {
    if (this.autoScrollTimer) return;

    this.autoScrollTimer = window.setInterval(() => {
      window.scrollBy(0, speed);
    }, 16);
  }

  private stopAutoScroll() {
    if (this.autoScrollTimer) {
      clearInterval(this.autoScrollTimer);
      this.autoScrollTimer = null;
    }
  }

  cleanup() {
    if (this.dragPreview) {
      this.dragPreview.remove();
      this.dragPreview = null;
    }

    if (this.dropIndicator) {
      this.dropIndicator.remove();
      this.dropIndicator = null;
    }

    this.stopAutoScroll();
    this.dragData = null;
  }
}

export const dragDropManager = new DragDropManager();
```

#### 3.2 Drag and Drop Plugin
```typescript
// features/editor/plugins/drag-drop-plugin.ts

export const createDragDropPlugin = () => {
  return new Plugin({
    key: new PluginKey('blockDragDrop'),

    props: {
      handleDOMEvents: {
        dragover(view, event) {
          const data = event.dataTransfer?.getData('application/x-tiptap-block');
          if (!data) return false;

          event.preventDefault();
          event.dataTransfer.dropEffect = 'move';

          // Update drag preview position
          dragDropManager.updateDrag(event);

          // Calculate drop position
          const pos = view.posAtCoords({
            left: event.clientX,
            top: event.clientY
          });

          if (pos) {
            // Find the nearest block boundary
            const $pos = view.state.doc.resolve(pos.pos);
            let blockPos = $pos.before($pos.depth);
            
            // Show drop indicator
            dragDropManager.showDropIndicator(view, blockPos);
          }

          return true;
        },

        drop(view, event) {
          const data = event.dataTransfer?.getData('application/x-tiptap-block');
          if (!data) return false;

          event.preventDefault();
          
          const { blockId, blockPos: fromPos } = JSON.parse(data);
          
          // Calculate target position
          const dropPos = view.posAtCoords({
            left: event.clientX,
            top: event.clientY
          });

          if (!dropPos) return false;

          // Find target block position
          const $pos = view.state.doc.resolve(dropPos.pos);
          const toPos = $pos.before($pos.depth);

          // Don't move to same position
          if (fromPos === toPos) {
            dragDropManager.cleanup();
            return true;
          }

          // Perform the move
          const tr = createMoveTransaction(view.state, fromPos, toPos);
          view.dispatch(tr);

          // Focus the moved block
          setTimeout(() => {
            const movedNode = view.domAtPos(toPos).node;
            if (movedNode && movedNode instanceof HTMLElement) {
              const editable = movedNode.querySelector('[contenteditable="true"]');
              if (editable instanceof HTMLElement) {
                editable.focus();
                // Place cursor at end
                placeCaretAtEnd(editable);
              }
            }
          }, 50);

          dragDropManager.cleanup();
          return true;
        },

        dragend() {
          dragDropManager.cleanup();
          return false;
        }
      }
    }
  });
};

function createMoveTransaction(state: EditorState, from: number, to: number) {
  const { tr } = state;
  const node = state.doc.nodeAt(from);
  
  if (!node) return tr;

  const nodeSize = node.nodeSize;
  
  // Delete from source
  tr.delete(from, from + nodeSize);
  
  // Adjust target position if needed
  const adjustedTo = to > from ? to - nodeSize : to;
  
  // Insert at target
  tr.insert(adjustedTo, node);
  
  return tr;
}
```

### Phase 4: Performance Optimizations (Day 4)

#### 4.1 Virtual Scrolling for Large Documents
```typescript
// features/editor/components/virtual-editor.tsx

export const VirtualEditor = ({ editor }) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver((entries) => {
      // Update visible range based on viewport
      const firstVisible = entries.find(e => e.isIntersecting);
      if (firstVisible) {
        const index = parseInt(firstVisible.target.getAttribute('data-index') || '0');
        setVisibleRange({
          start: Math.max(0, index - 10),
          end: Math.min(blocks.length, index + 40)
        });
      }
    }, {
      root: container,
      rootMargin: '100px'
    });

    // Observe sentinel elements
    const sentinels = container.querySelectorAll('.block-sentinel');
    sentinels.forEach(s => observer.observe(s));

    return () => observer.disconnect();
  }, [blocks.length]);

  return (
    <div ref={containerRef} className="virtual-editor">
      {blocks.slice(visibleRange.start, visibleRange.end).map((block, index) => (
        <div key={block.id} data-index={visibleRange.start + index}>
          <BlockComponent block={block} />
          {index % 10 === 0 && (
            <div className="block-sentinel" data-index={visibleRange.start + index} />
          )}
        </div>
      ))}
    </div>
  );
};
```

#### 4.2 Debounced Updates
```typescript
// hooks/use-debounced-updates.ts

export const useDebouncedBlockUpdates = (editor: Editor) => {
  const updateQueue = useRef<Map<string, any>>(new Map());
  const timeoutRef = useRef<NodeJS.Timeout>();

  const queueUpdate = useCallback((blockId: string, updates: any) => {
    updateQueue.current.set(blockId, {
      ...updateQueue.current.get(blockId),
      ...updates
    });

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      // Batch all updates in a single transaction
      editor.chain()
        .command(({ tr }) => {
          updateQueue.current.forEach((updates, blockId) => {
            // Apply updates to block
            const pos = findBlockPosition(tr.doc, blockId);
            if (pos !== null) {
              tr.setNodeMarkup(pos, null, updates);
            }
          });
          return true;
        })
        .run();

      updateQueue.current.clear();
    }, 100);
  }, [editor]);

  return queueUpdate;
};
```

### Phase 5: Final Polish (Day 5)

#### 5.1 Complete CSS System
```css
/* features/editor/styles/block-editor.css */

/* Editor container */
.ProseMirror {
  --editor-max-width: 680px;
  --editor-padding: 3rem;
  --block-spacing: 0.25rem; /* 4px */
  --handle-offset: 2.5rem;
  --handle-size: 1.5rem;
  
  max-width: var(--editor-max-width);
  margin: 0 auto;
  padding: 2rem var(--editor-padding);
  min-height: 100vh;
  outline: none;
}

/* Block wrapper */
.block-wrapper {
  position: relative;
  margin-bottom: var(--block-spacing);
}

.block-wrapper:last-child {
  margin-bottom: 0;
}

/* Block container */
.block-container {
  position: relative;
}

/* Hover target - extends full width */
.block-hover-target {
  position: absolute;
  top: 0;
  bottom: 0;
  left: calc(-1 * var(--editor-padding));
  right: calc(-1 * var(--editor-padding));
  z-index: 0;
  /* Debug mode visualization */
  /* background: rgba(255, 0, 0, 0.05); */
}

/* Block handle */
.block-handle {
  position: absolute;
  left: calc(-1 * var(--handle-offset));
  top: 0;
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s ease;
  pointer-events: none;
  z-index: 10;
}

.block-handle.is-visible {
  opacity: 1;
  pointer-events: auto;
}

.block-handle button {
  width: var(--handle-size);
  height: var(--handle-size);
  padding: 0;
  border: 1px solid hsl(var(--border));
  background: hsl(var(--background));
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  color: hsl(var(--muted-foreground));
}

.block-handle button:hover {
  background: hsl(var(--muted));
  color: hsl(var(--foreground));
}

.drag-handle {
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}

/* Block content */
.block-content {
  position: relative;
  z-index: 1;
}

/* Dragging states */
.block-wrapper.is-dragging {
  opacity: 0.5;
}

.ProseMirror.is-dragging {
  cursor: grabbing !important;
}

/* Hide placeholders during drag */
.ProseMirror.is-dragging .is-empty::before {
  display: none !important;
}

.ProseMirror.is-dragging {
  caret-color: transparent;
}

/* Drop indicator */
.drop-indicator {
  position: absolute;
  left: 0;
  right: 0;
  pointer-events: none;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Drag preview */
.drag-preview {
  position: fixed;
  pointer-events: none;
  z-index: 9999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Typography */
.block-wrapper p {
  margin: 0;
  line-height: 1.6;
}

.block-wrapper h1,
.block-wrapper h2,
.block-wrapper h3 {
  margin: 0;
  line-height: 1.3;
  font-weight: 700;
}

.block-wrapper h1 { font-size: 2rem; }
.block-wrapper h2 { font-size: 1.5rem; }
.block-wrapper h3 { font-size: 1.25rem; }

/* Code blocks */
.block-wrapper pre {
  margin: 0;
  border-radius: 6px;
  background: hsl(var(--muted));
  padding: 1rem;
  overflow-x: auto;
}

.block-wrapper code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
}

/* Focus states */
.block-wrapper.is-selected {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
  border-radius: 4px;
}

/* Placeholder text */
.is-empty::before {
  content: attr(data-placeholder);
  color: hsl(var(--muted-foreground));
  opacity: 0.5;
  position: absolute;
  pointer-events: none;
}

p.is-empty::before {
  content: "Type '/' for commands";
}

h1.is-empty::before {
  content: "Heading 1";
}

h2.is-empty::before {
  content: "Heading 2";
}

h3.is-empty::before {
  content: "Heading 3";
}
```

#### 5.2 Extension Configuration
```typescript
// features/editor/config/extensions.ts

import { StarterKit } from '@tiptap/starter-kit';
import { createDragDropPlugin } from '../plugins/drag-drop-plugin';
import { ParagraphBlock, HeadingBlock, CodeBlock } from '../blocks';

export const extensions = [
  StarterKit.configure({
    // Disable default implementations
    paragraph: false,
    heading: false,
    codeBlock: false,
  }),

  // Custom block implementations
  Node.create({
    name: 'paragraph',
    group: 'block',
    content: 'inline*',
    attrs: {
      id: { default: null }
    },
    parseHTML() {
      return [{ tag: 'p' }];
    },
    renderHTML({ HTMLAttributes }) {
      return ['p', HTMLAttributes, 0];
    },
    addNodeView() {
      return ReactNodeViewRenderer(ParagraphBlock);
    }
  }),

  Node.create({
    name: 'heading',
    group: 'block',
    content: 'inline*',
    defining: true,
    attrs: {
      id: { default: null },
      level: { default: 1 }
    },
    parseHTML() {
      return [
        { tag: 'h1', attrs: { level: 1 } },
        { tag: 'h2', attrs: { level: 2 } },
        { tag: 'h3', attrs: { level: 3 } },
      ];
    },
    renderHTML({ node, HTMLAttributes }) {
      const level = node.attrs.level;
      return [`h${level}`, HTMLAttributes, 0];
    },
    addNodeView() {
      return ReactNodeViewRenderer(HeadingBlock);
    }
  }),

  Node.create({
    name: 'codeBlock',
    group: 'block',
    content: 'text*',
    marks: '',
    code: true,
    defining: true,
    attrs: {
      id: { default: null },
      language: { default: 'javascript' }
    },
    parseHTML() {
      return [{
        tag: 'pre',
        preserveWhitespace: 'full',
      }];
    },
    renderHTML({ HTMLAttributes }) {
      return ['pre', HTMLAttributes, ['code', 0]];
    },
    addNodeView() {
      return ReactNodeViewRenderer(CodeBlock);
    }
  }),

  // Add drag and drop
  Extension.create({
    name: 'dragDrop',
    addProseMirrorPlugins() {
      return [createDragDropPlugin()];
    }
  }),

  // Other extensions...
  SlashCommand,
  Placeholder,
];
```

## Testing & Debugging

### Debug Utilities
```typescript
// utils/editor-debug.ts

export const EditorDebugger = {
  // Visualize block structure
  showBlockStructure() {
    const blocks = document.querySelectorAll('.block-wrapper');
    console.table(Array.from(blocks).map((block, i) => ({
      index: i,
      id: block.getAttribute('data-block-id'),
      type: block.getAttribute('data-block-type'),
      content: block.textContent?.substring(0, 50),
      hasHandle: !!block.querySelector('.block-handle'),
      isEditable: !!block.querySelector('[contenteditable="true"]')
    })));
  },

  // Show hover zones
  showHoverZones() {
    document.querySelectorAll('.block-hover-target').forEach(target => {
      (target as HTMLElement).style.background = 'rgba(255, 0, 0, 0.1)';
      (target as HTMLElement).style.border = '1px dashed red';
    });
  },

  // Test drag preview
  testDragPreview() {
    dragDropManager.startDrag(
      new DragEvent('dragstart'),
      { blockId: 'test', blockPos: 0, type: 'paragraph' }
    );
  },

  // Check content editability
  checkEditability() {
    const editables = document.querySelectorAll('[contenteditable]');
    editables.forEach((el, i) => {
      console.log(`Editable ${i}:`, {
        contentEditable: el.getAttribute('contenteditable'),
        isNodeViewContent: el.classList.contains('node-view-content'),
        parent: el.parentElement?.className,
        canFocus: el instanceof HTMLElement && el.focus !== undefined
      });
    });
  }
};

// Add to window for console access
if (typeof window !== 'undefined') {
  (window as any).editorDebug = EditorDebugger;
}
```

## Common Issues & Solutions

### Issue: Content Not Editable
**Solution**: Ensure `NodeViewContent` is used properly and `contentEditable` is not set to false on parent elements.

### Issue: Drag Preview Not Showing
**Solution**: Check if drag preview element is being created and positioned correctly. Use debug mode to verify.

### Issue: Placeholders Visible During Drag
**Solution**: Verify `.is-dragging` class is applied to editor and CSS rules are working.

### Issue: Handle Not Appearing
**Solution**: Check hover target dimensions and z-index stacking. Use `showHoverZones()` to debug.

## Migration Checklist

- [ ] Fix slash command error handling
- [ ] Fix content visibility in React node views
- [ ] Implement BaseBlock component
- [ ] Convert all block types to new architecture
- [ ] Add drag and drop manager
- [ ] Implement drop zone visualization
- [ ] Add focus management during drag
- [ ] Test all block types
- [ ] Add performance optimizations
- [ ] Final CSS polish

## Success Metrics

1. **Text Editing**: All text is visible and editable
2. **Block Handles**: Appear reliably on hover
3. **Drag and Drop**: Smooth preview and drop indication
4. **Performance**: No lag with 100+ blocks
5. **Focus Management**: Clean drag experience
6. **Error Free**: No console errors

This implementation provides a robust, Notion-like editing experience with proper architecture for long-term maintainability.