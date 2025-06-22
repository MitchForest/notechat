# Critical Bugs Fix Plan - NoteChat

## Executive Summary
The application has several critical bugs that make it feel like a 90s app:
1. Content is shared between different notes (CRITICAL)
2. Sidebar performance is terrible with visible flashing
3. Panel close logic doesn't work properly
4. Overall state management is a mess

## Root Cause Analysis

### 1. Content Sharing Between Notes
**Problem**: When typing in one note, content appears in another note
**Root Cause**: 
- The Editor component is not properly keyed/isolated
- Content state is being shared across instances
- Editor service might be singleton instead of per-instance

### 2. Performance Issues
**Problem**: All numbers flash when opening/closing collections
**Root Cause**:
- The entire sidebar re-renders when ANY state changes
- No proper memoization boundaries
- Expensive filtering operations run on every render
- No React keys or stable references

### 3. Panel Close Logic
**Problem**: Closing a note doesn't close the panel
**Root Cause**:
- The onClose handler in NoteComponent doesn't call the app shell's closeNote
- Panel state is not properly synced

### 4. State Management Issues
**Problem**: Multiple sources of truth and race conditions
**Root Cause**:
- Organization store, app shell context, and local component state all trying to manage the same data
- No clear data flow architecture

## Immediate Action Plan

### Phase 1: Fix Content Sharing (CRITICAL - 30 mins)
1. **Add proper keys to Editor instances**
   - Each Editor must have a unique key based on note ID
   - Clear editor state when switching notes

2. **Isolate Editor State**
   - Ensure each Editor instance has its own state
   - Fix the EditorService to be instance-based, not singleton

3. **Fix Content Loading**
   - Properly reset content when note changes
   - Add key prop to force remount when needed

### Phase 2: Fix Performance (1 hour)
1. **Implement Proper Memoization**
   - Wrap entire sidebar sections in React.memo
   - Use useMemo for all derived state
   - Implement stable callbacks with useCallback

2. **Optimize Render Boundaries**
   - Each space should be its own component
   - Each collection should be isolated
   - Item counts should be computed once

3. **Add Virtualization**
   - For lists with many items, implement windowing
   - Only render visible items

### Phase 3: Fix Panel Logic (30 mins)
1. **Connect Close Handlers**
   - NoteComponent onClose must call app shell's closeNote
   - ChatComponent onClose must call app shell's closeChat

2. **Fix Panel State**
   - Ensure viewConfig properly updates
   - Handle all edge cases (single panel, dual panel)

### Phase 4: Refactor State Management (2 hours)
1. **Single Source of Truth**
   - App shell context manages view state
   - Organization store manages data
   - Components only have UI state

2. **Clear Data Flow**
   - Props down, events up
   - No circular dependencies
   - Proper separation of concerns

## Implementation Details

### Fix 1: Content Isolation
```typescript
// In CanvasView - Add key to force remount
<NoteComponent 
  key={note.id} // CRITICAL: Forces new instance
  note={note}
  onClose={() => closeNote()} // Proper handler
/>

// In Editor - Ensure state isolation
const Editor = ({ noteId, content, onChange }) => {
  // Use noteId to ensure unique instance
  const editorKey = `editor-${noteId}`;
  
  // Force cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear any shared state
    };
  }, [noteId]);
}
```

### Fix 2: Performance Optimization
```typescript
// Memoized Space Component
const SpaceSection = React.memo(({ space, children }) => {
  // All space logic here
}, (prev, next) => {
  // Custom comparison
  return prev.space.id === next.space.id;
});

// Computed values outside render
const useComputedCounts = (items, collections) => {
  return useMemo(() => {
    // Calculate all counts once
    return collections.reduce((acc, col) => {
      acc[col.id] = calculateCount(items, col);
      return acc;
    }, {});
  }, [items, collections]);
};
```

### Fix 3: Panel Management
```typescript
// In NoteComponent
const handleClose = () => {
  // Call the app shell handler
  onClose?.(); // This should trigger closeNote in parent
};

// In CanvasView
<NoteComponent 
  note={activeNote}
  onClose={() => {
    closeNote(); // From app shell context
  }}
/>
```

## Success Criteria
1. ✅ Each note has its own content - no sharing
2. ✅ Sidebar updates without any flashing
3. ✅ Closing a note properly closes the panel
4. ✅ App feels modern and responsive
5. ✅ No race conditions or state conflicts

## Testing Plan
1. Open multiple notes - verify content isolation
2. Expand/collapse collections - no flashing
3. Close notes/chats - proper panel behavior
4. Stress test with many items - still performant
5. Rapid switching between items - no glitches

## Timeline
- Phase 1: Immediate (30 mins) - CRITICAL
- Phase 2: Today (1 hour)
- Phase 3: Today (30 mins)
- Phase 4: Tomorrow (2 hours)

Total: ~4 hours to fix all critical issues 