# Epic 2: Core Organization - Remaining Work Plan

**Created:** 2024-12-19
**Estimated Time:** 3-4 days

## Overview

This document details the remaining work needed to complete Epic 2. We have 70% of the work done with the core infrastructure in place. The remaining 30% focuses on UX polish and feature completion.

## Remaining Tasks Breakdown

### 1. Emoji Picker Component (4 hours)

**Priority:** HIGH - Critical for space creation UX

**Files to create:**
- `features/organization/components/emoji-picker.tsx`

**Implementation details:**
```typescript
// Component structure
interface EmojiPickerProps {
  value?: string
  onChange: (emoji: string) => void
  trigger?: ReactNode // Custom trigger button
}

// Features needed:
- Popover-based picker using shadcn/ui Popover
- Common emoji categories (Smileys, Objects, Activities, etc.)
- Search functionality
- Recently used emojis (localStorage)
- Default suggestions for spaces: 📁 📂 🗂️ 📊 💼 🏠 🎯 📝
```

**Integration points:**
- Space creation dialog (to be created)
- Space editing in context menu
- Update `handleNewSpace` in sidebar-nav.tsx

### 2. Search Implementation (3 hours)

**Priority:** HIGH - UI exists but non-functional

**Files to modify:**
- `features/organization/store/organization-store.ts` - Add filtering logic
- `components/layout/sidebar-nav.tsx` - Apply filters to displayed items

**Implementation details:**
```typescript
// Add to organization store
const filteredSpaces = computed(() => {
  if (!searchQuery) return spaces
  
  // Search in:
  // - Space names and emojis
  // - Collection names
  // - Note/chat titles
  // - Note/chat content (first 100 chars)
  
  return spaces.map(space => ({
    ...space,
    collections: space.collections?.map(collection => ({
      ...collection,
      // Filter items based on search
      itemCount: getFilteredItemCount(collection.id, searchQuery)
    }))
  }))
})
```

**Features:**
- Case-insensitive search
- Highlight matched terms
- Show only spaces/collections with matches
- Clear search button when active
- Keyboard shortcut (Cmd+K)

### 3. Context Menu Component (4 hours)

**Priority:** MEDIUM - Better UX than prompts

**Files to create:**
- `features/organization/components/space-context-menu.tsx`
- `features/organization/components/collection-context-menu.tsx`
- `features/organization/components/item-context-menu.tsx`

**Implementation using shadcn/ui ContextMenu:**

```typescript
// Space context menu options
- Rename (with emoji picker)
- Delete (with confirmation)
- Duplicate
- Add to Favorites (pin to top)

// Collection context menu options
- Rename
- Delete (move items to Uncategorized)
- Sort by (Name, Date, Manual)

// Item context menu options
- Rename
- Star/Unstar
- Move to...
- Duplicate
- Delete
```

**Special handling:**
- Permanent spaces: No delete option
- Seeded spaces: Can delete/rename
- Smart collections: No delete/rename

### 4. Inline Editing Component (3 hours)

**Priority:** MEDIUM - Professional UX

**Files to create:**
- `features/organization/components/inline-edit.tsx`

**Implementation details:**
```typescript
interface InlineEditProps {
  value: string
  onSave: (value: string) => void
  className?: string
  placeholder?: string
}

// Features:
- Click to edit (or F2 key)
- Auto-select all text on focus
- Enter to save, Escape to cancel
- Click outside to save
- Validation (min length, required)
- Loading state during save
```

**Integration:**
- Replace prompts in sidebar-nav.tsx
- Use in editor for title editing
- Use in context menus

### 5. Editor Integration (4 hours)

**Priority:** MEDIUM - Core feature connection

**Files to modify:**
- `features/editor/components/editor.tsx`
- `components/layout/canvas-view.tsx`

**Implementation:**
- Display current note/chat title above editor
- Inline edit for title
- Auto-save title changes
- Show collection breadcrumb
- Star/unstar button in toolbar
- Last modified timestamp

### 6. Create Space Dialog (3 hours)

**Priority:** LOW - Better than prompt

**Files to create:**
- `features/organization/components/create-space-dialog.tsx`

**Features:**
- Dialog with form
- Space name input
- Emoji picker
- Type selection (if needed)
- Create button with loading state

### 7. Loading & Error States (2 hours)

**Priority:** LOW - Polish

**Files to modify:**
- All components in organization feature

**Implementation:**
- Skeleton loaders for sidebar sections
- Error boundaries with retry
- Empty states with helpful messages
- Loading spinners for actions

### 8. Animations (2 hours)

**Priority:** LOW - Polish

**Note:** Keep animations minimal due to instant hover preference

**Animations to add:**
- Expand/collapse for spaces (height animation)
- Drag ghost preview
- Item reordering
- Success checkmarks for actions

## Implementation Order

### Day 1 (High Priority)
1. **Emoji Picker Component** (4 hours)
   - Build the component
   - Integrate with space creation
   - Test with different emojis

2. **Search Implementation** (3 hours)
   - Add filtering logic
   - Update UI to show filtered results
   - Add keyboard shortcut

### Day 2 (Medium Priority)
3. **Context Menu Component** (4 hours)
   - Create all three menu types
   - Integrate with sidebar items
   - Test all operations

4. **Inline Editing** (3 hours)
   - Build reusable component
   - Replace all prompts
   - Add validation

### Day 3 (Integration & Polish)
5. **Editor Integration** (4 hours)
   - Connect to organization store
   - Add title editing
   - Show metadata

6. **Create Space Dialog** (3 hours)
   - Better UI than prompt
   - Form validation
   - Emoji picker integration

### Day 4 (Final Polish)
7. **Loading & Error States** (2 hours)
   - Add throughout app
   - Test error scenarios

8. **Animations** (2 hours)
   - Subtle, fast animations
   - Test performance

## Testing Checklist

- [ ] Create new space with emoji
- [ ] Search filters correctly
- [ ] Right-click menus work on all items
- [ ] Inline editing saves properly
- [ ] Editor shows correct title
- [ ] Drag & drop still works
- [ ] Error states display correctly
- [ ] Animations are smooth
- [ ] Keyboard shortcuts work
- [ ] Mobile responsive

## Success Criteria

1. No more browser prompts - all inline or dialog
2. Search actually filters the sidebar
3. Right-click feels natural and fast
4. Editor is connected to organization
5. Everything feels polished and complete

## Notes

- Keep all interactions instant (no/minimal transitions)
- Maintain neutral hover colors (no primary)
- Test with both light and dark themes
- Ensure mobile responsiveness
- Follow existing patterns from shadcn/ui 