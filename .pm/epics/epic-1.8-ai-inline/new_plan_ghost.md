# Ghost Text Feature Stabilization Plan

**Created**: December 19, 2024  
**Epic**: 1.8 - AI Inline Features  
**Sprint**: 6 - Ghost Text Completions  
**Author**: AI Senior Full-Stack Architect

## Executive Summary

The ghost text feature (`++` trigger) is experiencing critical stability issues due to component re-rendering loops, improper state management, and decoration persistence problems. This plan outlines a comprehensive refactoring to create a stable, performant implementation following our established patterns.

## Current State Analysis

### Problems Identified

1. **Re-render Loop**
   - `useGhostText` hook inside `EditorInner` causes circular dependencies
   - State changes trigger component re-renders, which reinitialize the hook
   - Event listeners are repeatedly attached/detached
   - Multiple API calls are triggered for single `++` input

2. **Decoration Persistence Issues**
   - ProseMirror decorations not properly mapped through document changes
   - Ghost text disappears when it should be visible
   - Decoration update transactions not always dispatched

3. **Architecture Violations**
   - State management mixed with presentation logic
   - Hook placement violates React best practices
   - No separation between AI state and editor state

### Root Cause

The fundamental issue is that changing AI state (loading/completion) is coupled to the editor component's render cycle, creating a feedback loop that destabilizes the entire feature.

## Implementation Plan

### Overview

We will implement a complete architectural separation between AI state management and editor rendering, ensuring the editor remains stable while AI operations occur. This follows the "stable editor, dynamic AI" pattern.

### Files to Create

1. **`features/ai/components/ghost-text-handler.tsx`**
   - Purpose: Isolated component for AI state and loading UI
   - Handles all ghost text state changes without affecting editor
   - Renders loading indicator when AI is processing

2. **`features/ai/types/ghost-text.ts`**
   - Purpose: Type definitions for ghost text feature
   - Ensures type safety across the implementation

### Files to Modify

1. **`features/editor/components/editor.tsx`**
   - Remove `useGhostText` from `EditorInner`
   - Remove `EditorInner` component entirely (unnecessary abstraction)
   - Add `GhostTextHandler` as sibling component
   - Simplify component structure

2. **`features/ai/hooks/use-ghost-text.ts`**
   - Remove `requestAnimationFrame` wrapper
   - Simplify effect dependencies
   - Add cleanup for pending operations
   - Remove console logs after stabilization

3. **`features/ai/extensions/ghost-text.ts`**
   - Fix decoration persistence in `apply` function
   - Add proper transaction mapping
   - Implement debouncing for `++` trigger
   - Improve error handling

4. **`features/editor/hooks/use-stable-editor.ts`**
   - Add missing `dragManager` default value
   - Ensure proper TypeScript types

### Implementation Steps

#### Step 1: Create Type Definitions

```typescript
// features/ai/types/ghost-text.ts
export interface GhostTextStorage {
  ghostText: string;
  isActive: boolean;
  position: number | null;
  triggerTimeout?: NodeJS.Timeout;
}

export interface GhostTextHandlerProps {
  editor: Editor;
}
```

#### Step 2: Create Ghost Text Handler Component

```typescript
// features/ai/components/ghost-text-handler.tsx
/**
 * Component: GhostTextHandler
 * Purpose: Manages AI ghost text state independently from editor rendering
 * Features:
 * - Displays loading indicator during AI processing
 * - Isolates re-renders from editor component
 * - Handles ghost text lifecycle
 */
```

The component will:
- Use `useGhostText` hook internally
- Render a floating loading indicator when AI is thinking
- Position indicator at bottom center of viewport
- Use design tokens for styling

#### Step 3: Refactor Editor Component

Remove the `EditorInner` abstraction and integrate components directly:
- EditorContent remains stable
- EditorBubbleMenu as before
- GhostTextHandler as new sibling
- Remove all ghost text logic from main component

#### Step 4: Fix ProseMirror Plugin

Update the `apply` function to:
- Properly handle `ghostTextUpdate` meta transactions
- Map decorations through document changes correctly
- Clear decorations when cursor moves away
- Add try/catch for decoration creation

Add debouncing to `handleTextInput`:
- Store timeout in extension storage
- Clear existing timeout before new trigger
- 100ms delay to prevent duplicate calls

#### Step 5: Simplify useGhostText Hook

- Remove complex effect chains
- Direct command dispatch without RAF
- Add mounted check for async operations
- Proper cleanup on unmount

### Testing Strategy

#### Unit Tests
- Test decoration persistence through document changes
- Test debouncing prevents multiple API calls
- Test cleanup on component unmount
- Test error handling in API calls

#### Integration Tests
- Test `++` trigger creates ghost text
- Test Tab accepts completion
- Test Escape rejects completion
- Test typing dismisses ghost text

#### E2E Tests
- Full user flow: type `++` → see suggestion → Tab to accept
- Multiple rapid `++` inputs handled correctly
- Ghost text persists during document scrolling
- Loading indicator appears/disappears correctly

### UI/UX Considerations

#### Loading States
- Floating pill indicator: "AI is thinking..."
- Position: fixed bottom center
- Style: `bg-background border rounded-md px-2 py-1`
- Animation: fade in/out with 200ms transition

#### Error Handling
- Toast notifications for API errors
- Clear ghost text on error
- No console errors in production

#### Empty States
- No ghost text shown if no context
- Minimum context length: 10 characters

#### Responsive Design
- Loading indicator responsive to viewport
- Ghost text styling works on all screen sizes

## Architecture Benefits

### Separation of Concerns
- **Editor**: Stable, single instance, no re-renders
- **AI State**: Isolated in handler component
- **Decorations**: Managed by ProseMirror plugin

### Performance
- No render loops
- Debounced API calls
- Efficient decoration updates
- Minimal DOM mutations

### Maintainability
- Clear component boundaries
- Single responsibility principle
- Easier to test in isolation
- Follows established patterns

## Migration Path

1. **Phase 1**: Implement new architecture (this plan)
2. **Phase 2**: Remove console logs after verification
3. **Phase 3**: Add analytics for feature usage
4. **Phase 4**: Optimize API response times

## Success Criteria

- [ ] No component re-render loops
- [ ] Single API call per `++` trigger
- [ ] Ghost text visible and stable
- [ ] Tab/Escape handlers work reliably
- [ ] Loading indicator shows during AI processing
- [ ] No console errors or warnings
- [ ] All tests passing

## Risk Mitigation

### Risk: Breaking existing functionality
**Mitigation**: Implement changes incrementally, test each step

### Risk: Performance regression
**Mitigation**: Profile before/after, ensure no additional renders

### Risk: User confusion with new UI
**Mitigation**: Keep loading indicator minimal and unobtrusive

## Questions for Clarification

1. **Loading Indicator Position**: Should it be fixed bottom-center or near the cursor position?
   - **Suggested**: Fixed bottom-center for consistency

2. **Debounce Timing**: Is 100ms appropriate for the `++` trigger?
   - **Suggested**: 100ms balances responsiveness with stability

3. **Error Recovery**: Should we retry failed completions automatically?
   - **Suggested**: No auto-retry, user can type `++` again

## Next Steps

Upon approval of this plan:
1. Create type definitions file
2. Implement GhostTextHandler component
3. Refactor Editor component
4. Fix ProseMirror plugin
5. Update useGhostText hook
6. Run comprehensive tests
7. Update documentation

## Appendix: Code Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Editor Component                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │  - Stable reference (useStableEditor)            │   │
│  │  - No ghost text logic                           │   │
│  │  - Minimal re-renders                            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────────────┐  ┌────────────────────────────┐ │
│  │  EditorContent   │  │   EditorBubbleMenu         │ │
│  │  (Stable)        │  │   (Context-based)          │ │
│  └──────────────────┘  └────────────────────────────┘ │
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │           GhostTextHandler (New)                  │ │
│  │  - Uses useGhostText hook                         │ │
│  │  - Can re-render freely                           │ │
│  │  - Shows loading indicator                        │ │
│  └──────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

                            ↓

┌─────────────────────────────────────────────────────────┐
│              ProseMirror Plugin (ghost-text)             │
│  - Handles ++ trigger detection                          │
│  - Manages decorations                                   │
│  - Debounces API calls                                   │
│  - Handles keyboard events                               │
└─────────────────────────────────────────────────────────┘
```

---

*This plan follows the established patterns in code-standards.md and maintains consistency with our architecture.* 

## Addendum: Simplified Drag-and-Drop Integration

**Added**: December 20, 2024  
**Author**: AI Senior Full-Stack Engineer

### Integration Analysis

After implementing the drag-and-drop system, we've identified that **no complex integration is needed** between ghost text and drag features. The features are naturally mutually exclusive due to editor state management.

### Why No Integration Code is Needed

1. **Natural Mutual Exclusion**
   - Drag start: `editor.view.dom.blur()` → Clears any active ghost text
   - Drag active: `editable: false` → Ghost text cannot trigger
   - Drag end: `editable: true` + `editor.focus()` → Normal operation resumes

2. **Ghost Text Requirements**
   - Only activates during active typing
   - Requires cursor at specific position
   - Needs editable state

3. **Drag State Prevents Ghost Text**
   - No cursor visible during drag
   - No text input possible
   - No `++` trigger can occur

### Simplified Implementation

The only change needed is one safety check in the ghost text extension:

```typescript
// In ghost-text.ts handleTextInput:
if (!view.editable) return false; // Don't process if editor is read-only
```

This single line ensures ghost text respects the editor's editable state, which the drag system already manages.

### Benefits of This Approach

1. **Simplicity**: No cross-feature dependencies
2. **Maintainability**: Each feature is self-contained
3. **Robustness**: Uses existing editor state management
4. **Performance**: No additional checks or coordination

### Updated Implementation Steps

The original plan remains unchanged except:

1. **Step 4 Addition**: Add the `!view.editable` check to ghost text extension
2. **No Integration Code**: Skip any drag-specific integration
3. **Testing**: Verify features work independently, not together

### Testing the Non-Integration

1. **Sequential Testing**:
   - Type `++` → See ghost text → Start drag → Ghost text clears ✓
   - During drag → Type (nothing happens) → Drop → Type `++` → Ghost text works ✓

2. **State Verification**:
   - Ghost text cannot activate during drag (editable = false)
   - Drag cannot start with ghost text loading (blur clears it)

### Conclusion

The best integration is no integration. By relying on the editor's existing state management (focus/blur, editable/read-only), both features work perfectly without awareness of each other. This is more robust and maintainable than explicit coordination.

**Total implementation time saved: ~1.5 hours**

---

*This addendum confirms that the original ghost text plan can proceed without modification for drag-and-drop compatibility.* 