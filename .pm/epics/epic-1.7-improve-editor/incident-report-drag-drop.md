# Incident Report: Block Editor Drag & Drop Critical Issues

**Date**: December 20, 2024  
**Severity**: Critical  
**Affected Component**: Block Editor Drag & Drop System  
**Reporter**: Senior Full-Stack Engineer

## Executive Summary

The block editor's drag & drop system has three critical issues preventing proper functionality:

1. **Excessive Indentation** - Content starts ~144px from left edge
2. **Multiple Simultaneous Drags** - System allows multiple blocks to be dragged at once
3. **Stuck Cursor State** - Drag operations don't complete properly, leaving cursor in grab state

## Issue Details

### Issue 1: Excessive Indentation

**Current State:**
- `.editor-wrapper` has `padding-left: 4rem` (64px)
- `.ProseMirror` has `padding: 4px 40px 4px 80px` (80px left)
- Total: ~144px from left edge

**Impact:**
- Content appears centered/indented on page
- Poor use of horizontal space
- Unprofessional appearance

**Root Cause:**
- Padding was added to accommodate block handles
- Cumulative padding from multiple elements

### Issue 2: Multiple Simultaneous Drags

**Current State:**
- Each block manages its own drag state independently
- No global drag state management
- Hover handlers remain active during drag

**Impact:**
- Multiple blocks can enter drag state simultaneously
- Browser drag system gets confused
- Unpredictable behavior

**Root Cause:**
```tsx
// Each BlockWrapper has independent state
const [isDragging, setIsDragging] = useState(false)

// No check for existing drags
const handleDragStart = useCallback((e: React.DragEvent) => {
  setIsDragging(true) // Always allows drag
```

### Issue 3: Stuck Cursor State

**Current State:**
- Drag end doesn't always fire
- No cleanup on failed drops
- Plugin returns false on dragend

**Impact:**
- Cursor remains in grabbing state
- User must refresh page
- Data loss risk

**Root Cause:**
- Insufficient error handling
- Browser native drag events not properly managed
- React synthetic events conflicting with native events

## Technical Analysis

### Drag Event Flow
```
1. User mousedown on handle → dragstart
2. Browser takes over with native drag
3. React synthetic events may not fire
4. If drop fails, dragend may not fire
5. Cleanup code never runs
```

### State Management Issues
- Local component state (isDragging) per block
- No global drag coordinator
- No mutex/lock on drag operations
- Hover effects not disabled during drag

## Proposed Solutions

### Solution 1: Fix Indentation
```css
/* Reduce editor wrapper padding */
.editor-wrapper {
  padding-left: 2.5rem; /* Was 4rem */
  padding-right: 1rem;  /* Was 2rem */
}

/* Remove ProseMirror extra padding */
.ProseMirror {
  padding: 1rem 0; /* Was 4px 40px 4px 80px */
}

/* Adjust handle position */
.block-handle {
  left: -2rem; /* Was -3rem */
}
```

### Solution 2: Global Drag State Manager
```typescript
// Create a singleton drag manager
class DragStateManager {
  private static instance: DragStateManager
  private currentDrag: string | null = null
  
  static getInstance() {
    if (!this.instance) {
      this.instance = new DragStateManager()
    }
    return this.instance
  }
  
  canStartDrag(blockId: string): boolean {
    return this.currentDrag === null
  }
  
  startDrag(blockId: string): boolean {
    if (this.currentDrag) return false
    this.currentDrag = blockId
    document.body.classList.add('global-dragging')
    return true
  }
  
  endDrag(): void {
    this.currentDrag = null
    document.body.classList.remove('global-dragging')
    // Force cursor reset
    document.body.style.cursor = ''
  }
}
```

### Solution 3: Robust Drag Handling
```typescript
const handleDragStart = useCallback((e: React.DragEvent) => {
  const dragManager = DragStateManager.getInstance()
  
  if (!dragManager.canStartDrag(blockId)) {
    e.preventDefault()
    return
  }
  
  if (!dragManager.startDrag(blockId)) {
    e.preventDefault()
    return
  }
  
  // Set up dragend fallback
  const cleanup = () => {
    dragManager.endDrag()
    setIsDragging(false)
    editor.view.dom.classList.remove('is-dragging')
    document.removeEventListener('mouseup', cleanup)
    document.removeEventListener('dragend', cleanup)
  }
  
  // Multiple cleanup paths
  document.addEventListener('mouseup', cleanup)
  document.addEventListener('dragend', cleanup)
  setTimeout(cleanup, 5000) // Failsafe timeout
  
  // Continue with normal drag setup...
}, [blockId, editor])
```

### Solution 4: CSS Global Drag State
```css
/* Disable ALL hover effects during drag */
body.global-dragging .block-wrapper:hover::before {
  display: none !important;
}

body.global-dragging .block-handle {
  pointer-events: none !important;
  opacity: 0 !important;
}

/* Force cursor during drag */
body.global-dragging,
body.global-dragging * {
  cursor: grabbing !important;
}

/* Ensure cursor resets */
body:not(.global-dragging) {
  cursor: auto;
}
```

## Implementation Priority

1. **Immediate** (Fix cursor stuck):
   - Add global drag state manager
   - Add failsafe cleanup timers
   - Force cursor reset on body

2. **High** (Fix indentation):
   - Adjust CSS padding values
   - Test on different screen sizes

3. **Medium** (Prevent multiple drags):
   - Implement drag mutex
   - Disable hover during drag

## Testing Plan

1. **Manual Testing**:
   - Drag single block 10 times rapidly
   - Drag to invalid drop zones
   - Start drag and press ESC
   - Drag off screen
   - Drag between browser tabs

2. **Automated Testing**:
   - Simulate dragstart without dragend
   - Simulate multiple simultaneous drags
   - Test cleanup timer expiration

## Risk Assessment

- **High Risk**: Current implementation can corrupt document state
- **User Impact**: 100% of users affected
- **Data Loss**: Possible if save during bad state

## Recommendation

Implement all solutions immediately. The drag & drop system should be considered broken until these fixes are applied. Consider adding feature flag to disable drag & drop until fixed.

---

**Next Steps**: 
1. Get approval for emergency fix
2. Implement global drag manager
3. Fix CSS indentation
4. Add comprehensive error handling
5. Deploy with monitoring 