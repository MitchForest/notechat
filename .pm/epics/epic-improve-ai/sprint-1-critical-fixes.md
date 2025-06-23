# Sprint 1: Ghost Completions & Bubble Menu Fixes

**Status:** In Progress  
**Priority:** CRITICAL  
**Duration:** 4 hours  

## Overview

Fix critical AI functionality that's currently broken - ghost completions not showing and bubble menu not appearing.

## Goals

1. Fix ghost completion visibility when typing `++`
2. Ensure Tab accepts and other keys reject ghost text
3. Fix bubble menu not showing on text selection
4. Test all fixes in both themes

## Tasks

### Task 1: Fix Ghost Completion Visibility ⏱️ 1.5 hours

**Problem:** Ghost completions trigger but don't show visually

**Solution:**
1. Update ghost text decoration implementation
2. Fix CSS pseudo-element issues
3. Add visual debugging

**Files to modify:**
- `features/ai/extensions/ghost-text.ts` - Fix decoration application
- `features/editor/styles/ghost-text.css` - Update styles
- `features/ai/hooks/use-ghost-text.ts` - Add debugging

**Implementation:**

```typescript
// ghost-text.ts - Update decoration to use widget instead of inline
const decoration = Decoration.widget(
  storage.position,
  () => {
    const span = document.createElement('span')
    span.className = 'ghost-text-widget'
    span.textContent = storage.ghostText
    span.setAttribute('data-ghost-text', 'true')
    return span
  },
  { side: 1 } // Place after cursor
)
```

```css
/* ghost-text.css - More reliable styling */
.ghost-text-widget {
  color: hsl(var(--muted-foreground));
  opacity: 0.6;
  font-style: italic;
  pointer-events: none;
  margin-left: 1px;
}

/* Remove the ::after approach */
.ProseMirror .ghost-text::after {
  display: none;
}
```

### Task 2: Fix Key Handling ⏱️ 1 hour

**Problem:** Tab/Escape/Enter handling needs refinement

**Solution:**
1. Tab accepts completion
2. Enter or continuing to type rejects
3. Escape explicitly rejects

**Implementation:**

```typescript
// ghost-text.ts - Update handleKeyDown
handleKeyDown(view, event) {
  const storage = extension.storage as GhostTextStorage
  if (!storage.isActive) return false

  // Tab accepts
  if (event.key === 'Tab') {
    event.preventDefault()
    ;(extension.editor as any).emit('ghostTextAccept', storage.ghostText)
    return true
  }

  // Escape or Enter rejects
  if (event.key === 'Escape' || event.key === 'Enter') {
    event.preventDefault()
    ;(extension.editor as any).emit('ghostTextReject')
    return true
  }

  // Any other character input rejects (except modifiers)
  if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key.length === 1) {
    ;(extension.editor as any).emit('ghostTextReject')
    return false // Let the character be typed
  }

  return false
}
```

### Task 3: Fix Bubble Menu Not Showing ⏱️ 1.5 hours

**Problem:** Bubble menu doesn't appear on text selection

**Solution:**
1. Debug why BubbleMenu extension isn't triggering
2. Fix the custom bubble menu component
3. Ensure proper positioning

**Files to modify:**
- `features/editor/components/custom-bubble-menu.tsx`
- `features/editor/config/extensions.ts`
- `features/editor/components/editor.tsx`

**Implementation:**

```typescript
// custom-bubble-menu.tsx - Fix the implementation
import { BubbleMenu } from '@tiptap/react'

export function CustomBubbleMenu({ editor }: CustomBubbleMenuProps) {
  const [showAI, setShowAI] = useState(false)

  // Remove the manual attachment logic, use BubbleMenu component directly
  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{
        duration: 100,
        placement: 'top-start',
      }}
      shouldShow={({ editor, from, to }) => {
        // Only show if there's a selection
        return from !== to
      }}
    >
      <div className="flex items-center gap-0.5 p-1 bg-popover rounded-lg border shadow-md">
        {showAI ? (
          <AIBubbleMenuCommands editor={editor} onBack={() => setShowAI(false)} />
        ) : (
          <>
            {/* Format buttons */}
            <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBold().run()}>
              <Bold className="h-4 w-4" />
            </Button>
            {/* ... other buttons ... */}
            <Button variant="ghost" size="icon" onClick={() => setShowAI(true)}>
              <Sparkles className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </BubbleMenu>
  )
}
```

```typescript
// extensions.ts - Ensure BubbleMenu is included
import { BubbleMenu } from '@tiptap/extension-bubble-menu'

export const defaultExtensions = [
  // ... other extensions
  BubbleMenu.configure({
    pluginKey: 'customBubbleMenu',
    element: null, // Let React component handle it
  }),
  // ...
]
```

## Testing Checklist

- [ ] Type `++` and see ghost text appear
- [ ] Press Tab to accept ghost text
- [ ] Press Escape to reject ghost text
- [ ] Press Enter to reject ghost text
- [ ] Continue typing to reject ghost text
- [ ] Select text and see bubble menu
- [ ] Test bubble menu AI commands
- [ ] Test in light theme
- [ ] Test in dark theme
- [ ] Test with multiple editors open

## Definition of Done

- Ghost completions visually appear after `++`
- Tab accepts, other keys reject appropriately
- Bubble menu shows on text selection
- All tests pass in both themes
- No console errors

## Session Summary

**Completed:**
- ✅ Updated ghost text extension to use widget decorations instead of inline decorations
- ✅ Added proper key handling for Tab/Enter/Escape/character input
- ✅ Updated ghost text CSS to support widget approach
- ✅ Rewrote bubble menu to use @tiptap/react's BubbleMenu component directly
- ✅ Removed complex manual DOM attachment logic
- ✅ Added debugging logs to help verify functionality
- ✅ All TypeScript and linting checks pass (except unrelated sidebar-nav.tsx issues)
- ✅ Fixed context gathering to only use current paragraph instead of entire document
- ✅ Fixed premature clearing of ghost text that prevented completions from showing
- ✅ Added extensive debugging to track completion flow

**Files Changed:**
- `modified: features/ai/extensions/ghost-text.ts` - Changed to widget decorations, improved key handling, fixed context gathering
- `modified: features/editor/styles/ghost-text.css` - Updated for widget styling
- `modified: features/editor/components/custom-bubble-menu.tsx` - Complete rewrite using BubbleMenu component
- `modified: features/ai/hooks/use-ghost-text.ts` - Added debugging and removed premature clearing
- `modified: features/ai/components/ghost-text-handler.tsx` - Added debugging

**Remaining:**
- Manual testing to verify ghost completions appear visually
- Manual testing to verify bubble menu shows on text selection
- Test in both light and dark themes
- Fix unrelated linting errors in sidebar-nav.tsx (not part of this sprint)

**Known Issues Fixed:**
- Context was gathering text from entire document across paragraphs
- Ghost text was being cleared immediately after trigger, preventing completions
- Bubble menu was using complex manual DOM attachment that wasn't working 