# Complete Editor Architecture Transformation Plan

**Created**: December 20, 2024  
**Epic**: 1.7 - Improve Editor  
**Author**: AI Senior Full-Stack Engineer

## Executive Summary

This plan outlines the complete transformation of our editor from the current problematic implementation to a robust, Notion-style block editor. We'll implement this incrementally, starting with paragraphs, then expanding to all block types while preserving placeholders, slash commands, and fixing ghost text visibility.

## Current State Assessment

### Critical Issues
1. **Text Invisibility**: React node views wrapping content incorrectly
2. **Ghost Text Not Showing**: Component re-renders and state management issues
3. **Hover Handles**: Not appearing due to container reference problems
4. **Performance**: Every block wrapped in React causing overhead
5. **Architecture**: Mixed concerns between block UI and content editing

### What Must Be Preserved
1. Slash commands (`/` menu)
2. Placeholders (custom text for empty blocks)
3. Ghost text completions (`++` trigger)
4. AI bubble menu
5. Drag and drop foundation
6. All existing keyboard shortcuts

## Target Architecture

### Core Principles
1. **Selective React Usage**: Only use React node views where necessary
2. **Native ContentEditable**: Let Tiptap handle text editing naturally
3. **Overlay UI Pattern**: Block handles as overlays, not wrappers
4. **State Isolation**: AI state separate from editor state
5. **Performance First**: Minimal React overhead for text blocks

## Phase 1: Foundation Reset (Day 1 Morning)

### 1.1 Remove React Node Views from Text Blocks
**Goal**: Restore native text editing for paragraphs, headings, lists

```typescript
// features/editor/config/extensions.ts
// REMOVE React node views from:
// - paragraph
// - heading (all levels)
// - bulletList/orderedList
// - listItem
// - blockquote

// These will use native Tiptap rendering
```

### 1.2 Create Block Identification System
**File**: `features/editor/extensions/block-id.ts`

```typescript
// Extension that adds unique IDs to all blocks
// Works with native Tiptap blocks
export const BlockId = Extension.create({
  name: 'blockId',
  
  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading', 'codeBlock', 'blockquote', 'listItem'],
        attributes: {
          blockId: {
            default: null,
            parseHTML: element => element.getAttribute('data-block-id'),
            renderHTML: attributes => {
              if (!attributes.blockId) {
                attributes.blockId = generateBlockId();
              }
              return { 'data-block-id': attributes.blockId };
            }
          }
        }
      }
    ];
  },
  
  onCreate() {
    // Ensure all existing blocks have IDs
    ensureBlockIds(this.editor);
  }
});
```

### 1.3 Fix Container References
**File**: `features/editor/components/editor.tsx`

```typescript
// Simplified structure without EditorInner
export function Editor({ 
  initialContent,
  onUpdate,
  placeholder,
  className 
}: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  
  // Create editor with proper container
  const editor = useStableEditor({
    content: initialContent,
    placeholder,
    onUpdate,
    onCreate: ({ editor }) => {
      // Editor is ready with container
      setMounted(true);
    }
  });

  if (!editor) return null;

  return (
    <ErrorBoundary>
      <div 
        ref={containerRef}
        className={cn("editor-wrapper relative", className)}
      >
        <EditorContent 
          editor={editor} 
          className="prose prose-lg max-w-none"
        />
        
        {/* Overlay components */}
        {mounted && (
          <>
            <BlockHandleOverlay editor={editor} container={containerRef.current} />
            <EditorBubbleMenu editor={editor} />
            <GhostTextHandler editor={editor} />
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}
```

## Phase 2: Block Handle Overlay System (Day 1 Afternoon)

### 2.1 Create Block Handle Overlay
**File**: `features/editor/components/block-handle-overlay.tsx`

```typescript
// This component overlays handles on native blocks
export function BlockHandleOverlay({ editor, container }: Props) {
  const [activeBlock, setActiveBlock] = useState<BlockInfo | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  useEffect(() => {
    if (!container) return;
    
    // Track mouse position to show handles
    const handleMouseMove = throttle((e: MouseEvent) => {
      if (isDragging) return;
      
      // Find block at mouse position
      const block = findBlockAtPosition(e, container, editor);
      setActiveBlock(block);
    }, 50);
    
    // Track mouse leave
    const handleMouseLeave = () => {
      if (!isDragging) {
        setActiveBlock(null);
      }
    };
    
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      handleMouseMove.cancel();
    };
  }, [container, editor, isDragging]);
  
  if (!activeBlock || isDragging) return null;
  
  return (
    <Portal>
      <BlockHandle
        key={activeBlock.id}
        block={activeBlock}
        editor={editor}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
      />
    </Portal>
  );
}
```

### 2.2 Block Detection Utilities
**File**: `features/editor/utils/block-detection.ts`

```typescript
export function findBlockAtPosition(
  event: MouseEvent,
  container: HTMLElement,
  editor: Editor
): BlockInfo | null {
  // Get element at position
  const element = document.elementFromPoint(event.clientX, event.clientY);
  if (!element) return null;
  
  // Find nearest block element
  const blockEl = element.closest('[data-block-id]');
  if (!blockEl || !container.contains(blockEl)) return null;
  
  const blockId = blockEl.getAttribute('data-block-id');
  if (!blockId) return null;
  
  // Get block position in document
  const pos = getBlockPosition(editor, blockId);
  if (pos === null) return null;
  
  // Get block bounds
  const rect = blockEl.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  
  return {
    id: blockId,
    pos,
    element: blockEl as HTMLElement,
    rect,
    relativeTop: rect.top - containerRect.top,
    type: getBlockType(editor, pos)
  };
}
```

### 2.3 Handle Positioning
**File**: `features/editor/components/block-handle.tsx`

```typescript
export function BlockHandle({ block, editor, onDragStart, onDragEnd }: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const handleRef = useRef<HTMLDivElement>(null);
  
  // Position handle relative to block
  useLayoutEffect(() => {
    if (!handleRef.current) return;
    
    const handle = handleRef.current;
    const containerRect = editor.view.dom.getBoundingClientRect();
    
    // Position to the left of the block
    handle.style.position = 'fixed';
    handle.style.left = `${containerRect.left - 40}px`;
    handle.style.top = `${block.rect.top}px`;
  }, [block.rect, editor]);
  
  return (
    <div 
      ref={handleRef}
      className="block-handle-container"
      style={{ position: 'fixed' }}
    >
      {/* Drag handle */}
      <button
        className="drag-handle"
        draggable
        onDragStart={(e) => {
          handleDragStart(e, block, editor);
          onDragStart();
        }}
        onDragEnd={() => {
          handleDragEnd();
          onDragEnd();
        }}
      >
        <GripVertical size={16} />
      </button>
      
      {/* Action menu */}
      <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
        {/* ... menu items ... */}
      </DropdownMenu>
    </div>
  );
}
```

## Phase 3: Paragraph Implementation (Day 2 Morning)

### 3.1 Enhanced Paragraph Extension
**File**: `features/editor/extensions/paragraph.ts`

```typescript
export const Paragraph = Node.create({
  name: 'paragraph',
  priority: 1000,
  
  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },
  
  group: 'block',
  content: 'inline*',
  
  addAttributes() {
    return {
      blockId: {
        default: null,
        parseHTML: element => element.getAttribute('data-block-id'),
        renderHTML: attributes => {
          if (!attributes.blockId) {
            attributes.blockId = generateBlockId();
          }
          return { 'data-block-id': attributes.blockId };
        }
      }
    };
  },
  
  parseHTML() {
    return [{ tag: 'p' }];
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['p', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },
  
  addCommands() {
    return {
      setParagraph: () => ({ commands }) => {
        return commands.setNode(this.name);
      },
    };
  },
  
  addKeyboardShortcuts() {
    return {
      'Mod-Alt-0': () => this.editor.commands.setParagraph(),
    };
  },
});
```

### 3.2 Paragraph-Specific Placeholders
**File**: `features/editor/extensions/placeholder.ts`

```typescript
export const Placeholder = Extension.create({
  name: 'placeholder',
  
  addOptions() {
    return {
      placeholder: ({ node, pos }) => {
        // Custom placeholders based on context
        if (pos === 0 && node.type.name === 'paragraph') {
          return "Type '/' for commands, '++' for AI assistance";
        }
        
        if (node.type.name === 'paragraph') {
          return "Type '/' for commands";
        }
        
        // Other block types
        const placeholders = {
          heading: 'Heading',
          bulletList: 'List item',
          codeBlock: '// Type code here'
        };
        
        return placeholders[node.type.name] || '';
      },
      
      showOnlyWhenEditable: true,
      showOnlyCurrent: false,
      includeChildren: false,
    };
  },
  
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          decorations: ({ doc, selection }) => {
            const decorations: Decoration[] = [];
            const { anchor } = selection;
            const { placeholder } = this.options;
            
            doc.descendants((node, pos) => {
              const hasAnchor = anchor >= pos && anchor <= pos + node.nodeSize;
              const isEmpty = !node.isLeaf && !node.childCount;
              
              if (isEmpty && (hasAnchor || !this.options.showOnlyCurrent)) {
                const decoration = Decoration.node(pos, pos + node.nodeSize, {
                  'class': 'is-empty',
                  'data-placeholder': typeof placeholder === 'function'
                    ? placeholder({ node, pos, hasAnchor })
                    : placeholder,
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
```

### 3.3 CSS for Native Paragraphs
**File**: `features/editor/styles/blocks.css`

```css
/* Paragraph styles */
.ProseMirror p {
  margin: 0;
  padding: 0;
  min-height: 1.5em;
  line-height: 1.6;
  position: relative;
}

/* Block spacing - 4px between all blocks */
.ProseMirror p + *,
.ProseMirror * + p {
  margin-top: 0.25rem;
}

/* Placeholder styles */
.ProseMirror p.is-empty::before {
  content: attr(data-placeholder);
  color: hsl(var(--muted-foreground));
  opacity: 0.5;
  position: absolute;
  pointer-events: none;
  height: 0;
  font-style: normal;
}

/* Ensure placeholders don't affect layout */
.ProseMirror .is-empty {
  position: relative;
}

/* Hide placeholders during drag */
.ProseMirror.is-dragging .is-empty::before {
  display: none !important;
}
```

## Phase 4: Fix Ghost Text Visibility (Day 2 Afternoon)

### 4.1 Debug Ghost Text Decorations
**File**: `features/editor/extensions/ghost-text.ts`

```typescript
// Update the ghost text extension
addProseMirrorPlugins() {
  return [
    new Plugin({
      key: ghostTextPluginKey,
      
      state: {
        init: () => ({ ghostText: '', isActive: false, position: null }),
        
        apply: (tr, value, oldState, newState) => {
          // Check for ghost text meta
          const meta = tr.getMeta('ghostTextUpdate');
          if (meta) {
            console.log('[GhostText] Applying meta:', meta);
            return meta;
          }
          
          // Map position through changes
          if (value.position !== null) {
            const mapped = tr.mapping.map(value.position);
            return { ...value, position: mapped };
          }
          
          return value;
        }
      },
      
      props: {
        decorations(state) {
          const { ghostText, isActive, position } = this.getState(state);
          
          if (!isActive || !ghostText || position === null) {
            return DecorationSet.empty;
          }
          
          try {
            // Create inline decoration
            const decoration = Decoration.inline(
              position,
              position,
              { 
                class: 'ghost-text',
                'data-ghost-text': ghostText 
              },
              { 
                inclusiveStart: true, 
                inclusiveEnd: true 
              }
            );
            
            console.log('[GhostText] Creating decoration at', position, 'with text:', ghostText);
            
            return DecorationSet.create(state.doc, [decoration]);
          } catch (error) {
            console.error('[GhostText] Decoration error:', error);
            return DecorationSet.empty;
          }
        }
      }
    })
  ];
}
```

### 4.2 Ghost Text CSS
**File**: `features/editor/styles/ghost-text.css`

```css
/* Ghost text visualization */
.ProseMirror .ghost-text::after {
  content: attr(data-ghost-text);
  color: hsl(var(--muted-foreground));
  opacity: 0.6;
  font-style: italic;
}

/* Debug mode - make ghost text more visible */
.ProseMirror.debug-ghost .ghost-text::after {
  background: rgba(59, 130, 246, 0.1);
  border: 1px dashed rgba(59, 130, 246, 0.5);
  padding: 0 2px;
}
```

### 4.3 Ghost Text Handler Component
**File**: `features/ai/components/ghost-text-handler.tsx`

```typescript
export function GhostTextHandler({ editor }: { editor: Editor }) {
  const { isLoading, error } = useGhostText(editor);
  
  // Show loading indicator when AI is processing
  if (isLoading) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-background border rounded-md px-3 py-1.5 shadow-sm flex items-center gap-2">
          <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full" />
          <span className="text-sm text-muted-foreground">AI is thinking...</span>
        </div>
      </div>
    );
  }
  
  return null;
}
```

## Phase 5: Extend to All Block Types (Day 3)

### 5.1 Heading Blocks
**File**: `features/editor/extensions/heading.ts`

```typescript
// Native heading with block IDs
export const Heading = Node.create({
  name: 'heading',
  
  addAttributes() {
    return {
      level: {
        default: 1,
      },
      blockId: {
        default: null,
        // ... same as paragraph
      }
    };
  },
  
  content: 'inline*',
  group: 'block',
  defining: true,
  
  parseHTML() {
    return [
      { tag: 'h1', attrs: { level: 1 } },
      { tag: 'h2', attrs: { level: 2 } },
      { tag: 'h3', attrs: { level: 3 } },
      { tag: 'h4', attrs: { level: 4 } },
      { tag: 'h5', attrs: { level: 5 } },
      { tag: 'h6', attrs: { level: 6 } },
    ];
  },
  
  renderHTML({ node, HTMLAttributes }) {
    const level = node.attrs.level;
    const tag = `h${level}`;
    return [tag, mergeAttributes(HTMLAttributes), 0];
  }
});
```

### 5.2 List Blocks
**File**: `features/editor/extensions/lists.ts`

```typescript
// Enhanced list items with block IDs
export const ListItem = Node.create({
  name: 'listItem',
  
  addAttributes() {
    return {
      blockId: {
        default: null,
        // ... same implementation
      }
    };
  },
  
  content: 'paragraph block*',
  defining: true,
  
  parseHTML() {
    return [{ tag: 'li' }];
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['li', mergeAttributes(HTMLAttributes), 0];
  }
});
```

### 5.3 Code Blocks (Keep React)
**File**: `features/editor/blocks/code-block.tsx`

```typescript
// Code blocks benefit from React for syntax highlighting
export const CodeBlockComponent = ({ node, updateAttributes }) => {
  const language = node.attrs.language || 'javascript';
  
  return (
    <NodeViewWrapper className="code-block-wrapper" data-block-id={node.attrs.blockId}>
      <select
        contentEditable={false}
        value={language}
        onChange={e => updateAttributes({ language: e.target.value })}
        className="code-block-language-select"
      >
        <option value="javascript">JavaScript</option>
        <option value="typescript">TypeScript</option>
        <option value="python">Python</option>
        {/* ... more languages ... */}
      </select>
      
      <NodeViewContent 
        as="pre"
        className="code-block-content"
      >
        <code className={`language-${language}`} />
      </NodeViewContent>
    </NodeViewWrapper>
  );
};
```

## Phase 6: Integration Testing (Day 4)

### 6.1 Test Matrix

| Feature | Paragraph | Heading | List | Code Block | Expected Result |
|---------|-----------|---------|------|------------|-----------------|
| Block IDs | ✓ | ✓ | ✓ | ✓ | All blocks have unique IDs |
| Hover Handles | ✓ | ✓ | ✓ | ✓ | Handles appear on hover |
| Drag & Drop | ✓ | ✓ | ✓ | ✓ | Blocks can be reordered |
| Placeholders | ✓ | ✓ | ✓ | ✓ | Show when empty |
| Slash Commands | ✓ | ✓ | ✓ | ✓ | Menu appears on `/` |
| Ghost Text | ✓ | ✓ | ✓ | ✗ | Works in text blocks |
| Performance | ✓ | ✓ | ✓ | ✓ | No lag with 100+ blocks |

### 6.2 Debug Utilities
**File**: `features/editor/utils/editor-debugger.ts`

```typescript
export const EditorDebugger = {
  // Check all blocks have IDs
  checkBlockIds() {
    const blocks = document.querySelectorAll('[data-block-id]');
    const missing = document.querySelectorAll('p:not([data-block-id]), h1:not([data-block-id])');
    
    console.log(`Blocks with IDs: ${blocks.length}`);
    console.log(`Blocks missing IDs: ${missing.length}`);
    
    if (missing.length > 0) {
      console.warn('Blocks without IDs:', missing);
    }
  },
  
  // Test ghost text
  testGhostText() {
    const editor = (window as any).editor;
    if (!editor) {
      console.error('No editor found on window');
      return;
    }
    
    // Trigger ghost text at current position
    const { state } = editor;
    const { tr } = state;
    
    tr.setMeta('ghostTextUpdate', {
      ghostText: 'This is a test ghost text',
      isActive: true,
      position: state.selection.from
    });
    
    editor.view.dispatch(tr);
    
    // Check decorations
    setTimeout(() => {
      const decorations = document.querySelectorAll('.ghost-text');
      console.log('Ghost text decorations:', decorations);
    }, 100);
  },
  
  // Visualize block structure
  visualizeBlocks() {
    // Add debug classes
    document.querySelectorAll('[data-block-id]').forEach(block => {
      (block as HTMLElement).style.outline = '1px dashed red';
      (block as HTMLElement).style.outlineOffset = '2px';
    });
    
    // Show hover zones
    const style = document.createElement('style');
    style.textContent = `
      [data-block-id]::before {
        content: attr(data-block-id);
        position: absolute;
        top: -20px;
        left: 0;
        font-size: 10px;
        background: yellow;
        padding: 2px 4px;
        z-index: 9999;
      }
    `;
    document.head.appendChild(style);
  }
};

// Attach to window in development
if (process.env.NODE_ENV === 'development') {
  (window as any).editorDebug = EditorDebugger;
}
```

## Phase 7: Performance Optimization (Day 5)

### 7.1 Lazy Load Heavy Components
```typescript
// Only load code highlighting when needed
const CodeBlockComponent = lazy(() => import('./blocks/code-block'));

// Only load drag manager when dragging
const DragManager = lazy(() => import('./services/drag-manager'));
```

### 7.2 Optimize Re-renders
```typescript
// Memoize block handle overlay
export const BlockHandleOverlay = memo(({ editor, container }) => {
  // ... implementation
}, (prevProps, nextProps) => {
  // Only re-render if container changes
  return prevProps.container === nextProps.container;
});
```

### 7.3 Throttle Updates
```typescript
// Throttle hover detection
const handleMouseMove = useThrottle((e: MouseEvent) => {
  // ... find block
}, 50);

// Debounce block ID generation
const generateBlockId = useDebounce(() => {
  return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}, 10);
```

## Migration Checklist

### Phase 1 - Foundation
- [ ] Remove React node views from text blocks
- [ ] Implement block ID extension
- [ ] Fix container references
- [ ] Create error boundary

### Phase 2 - Block Handles
- [ ] Create block handle overlay component
- [ ] Implement block detection utilities
- [ ] Add handle positioning logic
- [ ] Test hover detection

### Phase 3 - Paragraphs
- [ ] Enhance paragraph extension
- [ ] Add paragraph placeholders
- [ ] Style native paragraphs
- [ ] Test paragraph editing

### Phase 4 - Ghost Text
- [ ] Debug decoration application
- [ ] Fix CSS for visibility
- [ ] Create loading indicator
- [ ] Test `++` trigger

### Phase 5 - All Blocks
- [ ] Convert headings
- [ ] Convert lists
- [ ] Keep React for code blocks
- [ ] Test all block types

### Phase 6 - Integration
- [ ] Run full test matrix
- [ ] Fix any edge cases
- [ ] Add debug utilities
- [ ] Performance profiling

### Phase 7 - Optimization
- [ ] Lazy load components
- [ ] Optimize re-renders
- [ ] Throttle updates
- [ ] Final performance test

## Success Criteria

1. **Text Visibility**: All text content is visible and editable
2. **Ghost Text**: `++` trigger shows AI suggestions properly
3. **Block Handles**: Appear reliably on hover for all blocks
4. **Placeholders**: Show appropriate text for empty blocks
5. **Slash Commands**: `/` menu works without errors
6. **Performance**: Smooth editing with 100+ blocks
7. **No Breaking Changes**: All existing features preserved

## Risk Mitigation

1. **Incremental Changes**: Each phase can be tested independently
2. **Feature Flags**: Can toggle between old/new implementation
3. **Comprehensive Testing**: Test matrix covers all scenarios
4. **Debug Tools**: Built-in debugging for troubleshooting
5. **Rollback Plan**: Git commits at each phase for easy reversion

## Next Steps

1. Review and approve this plan
2. Create feature branch: `feature/editor-architecture-v2`
3. Implement Phase 1 (Foundation Reset)
4. Test and verify each phase before proceeding
5. Daily progress updates in sprint file

---

*This plan ensures a complete transformation while preserving all functionality and fixing current issues.* 