# Simplified Editor Fix Plan

**Created**: December 20, 2024  
**Epic**: 1.7 - Improve Editor  
**Author**: AI Senior Full-Stack Engineer

## Current Situation

We have a working drag-and-drop system and block UI, but the editor is broken due to:
1. **Slash command error**: `Cannot read properties of undefined (reading '0')`
2. **Text invisibility**: React node views not properly implementing contentEditable
3. **Over-engineering**: Every block wrapped in React causing complexity

## Philosophy

**Don't rebuild what works.** We have:
- ✅ Working drag-and-drop system (`useBlockDragDrop`, `BlockDragPlugin`)
- ✅ Working block handles (`BlockUi` plugin)
- ✅ Working ghost text (just needs editor stability)
- ✅ Good CSS architecture

## Implementation Plan

### Phase 1: Fix Critical Issues (30 mins)

#### 1.1 Fix Slash Command Error

**File**: `features/editor/extensions/slash-command.tsx`

**Issue**: `popup` array can be undefined when `onExit` is called

**Fix**:
```typescript
// Line ~140: Initialize popup properly
let popup: Instance<Props>[] | undefined

// Line ~183: Add null checks in onExit
onExit: () => {
  if (popup && popup[0]) {
    popup[0].destroy()
  }
  component?.destroy()
}
```

#### 1.2 Remove React Node Views (Temporarily)

**File**: `features/editor/config/extensions.ts`

**Issue**: React node views are blocking contentEditable

**Fix**: Comment out all React node view implementations:
```typescript
// Temporarily disable React node views to restore basic editing
Paragraph, // Remove .extend({ addNodeView() })
Heading,   // Remove .extend({ addNodeView() })
// ... etc
```

#### 1.3 Verify Basic Functionality

**Tests**:
- [ ] Text is visible when typing
- [ ] Slash commands work without errors
- [ ] Basic formatting works
- [ ] Cursor/selection works normally

### Phase 2: Restore Features Incrementally (45 mins)

#### 2.1 Verify Existing Systems Work

**BlockUi Plugin** (`block-ui-plugin.tsx`):
- Should show handles on hover
- Should work without React node views
- Already has container reference fixes

**Drag System**:
- `useBlockDragDrop` - manages drag state
- `BlockDragPlugin` - handles drag events
- Focus management already implemented

#### 2.2 Fix Block Handle Visibility

If handles don't show after removing React node views:

1. **Check BlockUi selector**:
   ```typescript
   // In block-ui-plugin.tsx
   // Ensure it finds blocks correctly without .block-wrapper
   ```

2. **Add minimal block identification**:
   ```typescript
   // Add data attributes to blocks without React wrapper
   Paragraph.extend({
     renderHTML({ HTMLAttributes }) {
       return ['p', { ...HTMLAttributes, 'data-block-type': 'paragraph' }, 0]
     }
   })
   ```

#### 2.3 Test Drag and Drop

- [ ] Hover shows handles
- [ ] Drag handle works
- [ ] Drop zones appear
- [ ] Focus management works
- [ ] Ghost text doesn't interfere

### Phase 3: Selective Enhancement (30 mins)

#### 3.1 Add React ONLY Where Needed

**Keep Native Tiptap for**:
- Paragraph
- Heading (all levels)
- Lists (bullet, ordered)
- Blockquote

**Use React Node Views for**:
- Code blocks (syntax highlighting)
- Custom embeds (if any)
- Interactive components (if any)

#### 3.2 Fix React Node View Implementation

If we need React for specific blocks:

```typescript
// Proper implementation with NodeViewContent
const CodeBlockView = ({ node, ...props }) => {
  return (
    <NodeViewWrapper className="code-block-wrapper">
      <select>{/* Language selector */}</select>
      <NodeViewContent as="pre" /> {/* THIS IS CRITICAL */}
    </NodeViewWrapper>
  )
}
```

### Phase 4: Polish (15 mins)

#### 4.1 Verify All Features Work Together

- [ ] Slash commands
- [ ] Drag and drop  
- [ ] Ghost text (++)
- [ ] Block handles
- [ ] Placeholders

#### 4.2 Clean Up

- Remove console.logs
- Remove unused imports
- Update types if needed

## Implementation Order

1. **Fix slash command** (5 mins)
2. **Remove React node views** (10 mins)
3. **Test basic editing** (5 mins)
4. **Verify drag/drop works** (10 mins)
5. **Fix any handle issues** (15 mins)
6. **Selectively add React** (20 mins)
7. **Final testing** (10 mins)

## Key Files to Modify

1. `features/editor/extensions/slash-command.tsx` - Fix popup error
2. `features/editor/config/extensions.ts` - Remove React node views
3. `features/editor/extensions/block-ui-plugin.tsx` - Verify/fix if needed
4. `features/editor/extensions/react-node-view.tsx` - Fix if we need React blocks

## What NOT to Change

- ❌ Don't touch the drag system (it works)
- ❌ Don't rebuild BlockUi (it works)
- ❌ Don't change CSS architecture (it's good)
- ❌ Don't modify ghost text (just needs stable editor)

## Success Criteria

1. **No console errors**
2. **Text is visible and editable**
3. **Slash commands work**
4. **Drag and drop works**
5. **Handles appear on hover**
6. **Ghost text works**

## Debugging Commands

```javascript
// In browser console

// Check if content is editable
document.querySelectorAll('[contenteditable]').forEach(el => 
  console.log(el, el.contentEditable)
)

// Check block structure
document.querySelectorAll('[data-block-type]').forEach(el =>
  console.log(el.dataset.blockType, el.textContent.slice(0, 50))
)

// Check if editor is editable
window.editor?.isEditable

// Force enable editing
window.editor?.setEditable(true)
```

## Risk Mitigation

If removing React node views breaks something:
1. Check what functionality was in the React wrapper
2. Implement that functionality in the Tiptap extension
3. Only add React back for that specific block type

## Time Estimate

- Phase 1: 30 minutes
- Phase 2: 45 minutes  
- Phase 3: 30 minutes
- Phase 4: 15 minutes
- **Total: ~2 hours**

But we should see basic editing working within 15 minutes.

---

*This plan focuses on fixing what's broken without rebuilding what works.* 