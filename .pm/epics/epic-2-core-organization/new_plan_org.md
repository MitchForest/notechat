# Epic 2: Core Organization - New Implementation Plan

## Overview
This document outlines the comprehensive plan for implementing the new organization structure for NoteChat. The database already has most of the required schema in place, so we'll focus on implementing the UI/UX and business logic.

**Overall Progress: 85% Complete**

## Current Database State
Based on inspection, we have:
- ✅ `chats` table with `collection_id`
- ✅ `spaces` table with `type` column (entity_type enum: static, seeded, user)
- ✅ `collections` table with `type` column
- ✅ `notes` table with `is_starred` and `collection_id`
- ✅ Proper foreign key relationships

## Requirements Summary

### Sidebar Structure
```
Header
├── New Chat
├── New Note
├── Search
│
├── Notes (permanent space - collapsible)
│   ├── All
│   ├── Recent (last 7 days)
│   ├── Saved (starred items)
│   └── Uncategorized
│
├── Chats (permanent space - collapsible)
│   ├── All
│   ├── Recent (last 7 days)
│   ├── Saved (starred items)
│   └── Uncategorized
│
├── Personal (seeded space - deletable/renameable)
│   ├── All
│   ├── Recent
│   ├── Saved
│   └── + New Collection
│
├── Work (seeded space - deletable/renameable)
│   ├── All
│   ├── Recent
│   ├── Saved
│   └── + New Collection
│
└── + New Space
```

### Key Features
1. **Drag & Drop**: Notes/chats can be dragged between collections
2. **Starring**: Items can be starred to appear in "Saved" collections
3. **Recent Logic**: Items modified in the last 7 days appear in "Recent"
4. **Smart Collections**: Recent/Saved are computed, not stored
5. **Emoji Support**: Each space has an emoji for organization
6. **Inline Editing**: Titles can be edited inline
7. **Context Menus**: Right-click for rename/delete operations

### Business Rules
1. Items in "Recent" also appear in their assigned collections
2. Starred items appear in both "Saved" and their assigned collections
3. Dragging to a space places the item in that space's "All" collection
4. When a collection is deleted, items move to the appropriate "Uncategorized" collection
5. No limit on user-created spaces

## Implementation Plan

### ✅ Phase 1: Backend & Data Layer Updates (COMPLETE)

#### ✅ Task 1.1: Update Database Schema Types
**Files modified:**
- `lib/db/schema.ts`

**Changes:**
- ✅ Updated type definitions to match actual database
- ✅ Added proper enum for entity_type
- ✅ Ensured all relationships are properly defined

#### ✅ Task 1.2: Create User Account Seeding Function
**Files created:**
- `lib/db/seed-user.ts`

**Implementation:**
- ✅ Function to create default spaces and collections for new users
- ✅ Personal and Work spaces with type='seeded'
- ✅ All, Recent, Saved collections in each space

#### ✅ Task 1.3: Update API Endpoints
**Files modified/created:**
- ✅ `app/api/spaces/route.ts` - Added seeding logic on first fetch
- ✅ `app/api/notes/route.ts` - Added recent/starred filtering
- ✅ `app/api/chats/route.ts` - Created full CRUD endpoints
- ✅ `app/api/chats/[chatId]/route.ts` - Individual chat operations

**Filtering logic implemented:**
- ✅ Recent: `updatedAt > now() - interval '7 days'`
- ✅ Starred: `isStarred = true`
- ✅ Uncategorized: `collectionId IS NULL`

### ✅ Phase 2: State Management Updates (COMPLETE)

#### ✅ Task 2.1: Update Organization Store
**Files modified:**
- `features/organization/store/organization-store.ts`

**Changes:**
- ✅ Added chat management functions
- ✅ Implemented smart collection filtering
- ✅ Added permanent spaces handling
- ✅ Updated data structures for new hierarchy
- ✅ Added optimistic updates for drag & drop

#### ✅ Task 2.2: Create Drag & Drop Hook
**Files created:**
- ✅ `features/organization/hooks/use-drag-drop.ts`
- ✅ `features/organization/types/drag-drop.ts`

**Implementation:**
- ✅ Used @dnd-kit/sortable for drag & drop
- ✅ Handle drop targets (collections only)
- ✅ Optimistic updates during drag
- ✅ API calls on drop completion

### ✅ Phase 3: UI Components (95% COMPLETE)

#### ✅ Task 3.1: Create Emoji Picker Component
**Files created:**
- `features/organization/components/emoji-picker.tsx`

**Implementation:**
- ✅ Popover-based emoji picker
- ✅ Integration with space creation/editing
- ✅ Default emoji suggestions

#### ✅ Task 3.2: Rebuild Sidebar Navigation
**Files modified:**
- `components/layout/sidebar-nav.tsx`

**Major changes:**
- ✅ Complete restructure to new hierarchy
- ✅ Implement collapsible sections with Collapsible component
- ✅ Add drag & drop zones
- ✅ Implement dialogs for space/collection creation
- ✅ Add hover/active states per design system
- ✅ Handle permanent vs user spaces differently
- ✅ Fixed expand/collapse functionality for collections
- ✅ Separated collection selection from expansion
- ✅ Proper filtering of items by space and collection

#### ✅ Task 3.3: Create Context Menu Components
**Files created:**
- `features/organization/components/item-context-menu.tsx`
- `features/organization/components/space-context-menu.tsx`
- `features/organization/components/collection-context-menu.tsx`

**Implementation:**
- ✅ Right-click menu components created
- ✅ Options: Rename, Delete, Star/Unstar
- ✅ Different options for spaces vs collections vs items
- ✅ NOT YET INTEGRATED into sidebar-nav.tsx

#### ✅ Task 3.4: Create Dialog Components
**Files created:**
- `features/organization/components/create-space-dialog.tsx`
- `features/organization/components/create-collection-dialog.tsx`

**Implementation:**
- ✅ Replaced browser prompts with proper dialogs
- ✅ Form validation
- ✅ Emoji picker integration for spaces
- ✅ Loading states
- ✅ Error handling
- ✅ FULLY INTEGRATED and working in sidebar

### ✅ Phase 4: Feature Implementation (50% COMPLETE)

#### ✅ Task 4.1: Integrate Context Menus
**Files modified:**
- `components/layout/sidebar-nav.tsx`
- `features/organization/components/space-context-menu.tsx`
- `features/organization/components/collection-context-menu.tsx`
- `features/organization/components/item-context-menu.tsx`

**Implementation:**
- ✅ Refactored context menu components to use wrapping pattern
- ✅ Added onAction callbacks to all context menus
- ✅ Integrated SpaceContextMenu for user spaces
- ✅ Integrated CollectionContextMenu for all collections
- ✅ Integrated ItemContextMenu for all notes/chats
- ✅ Connected menu actions to store methods
- ✅ Added handlers for rename, delete, star/unstar actions
- ⚠️ Some actions still use browser prompts (TODO: replace with dialogs)

#### ❌ Task 4.2: Connect Drag & Drop UI
**Files to modify:**
- `components/layout/sidebar-nav.tsx`

**Implementation needed:**
- ❌ Wrap sidebar in DndContext
- ❌ Add Draggable to items
- ❌ Add Droppable to collections
- ❌ Visual feedback during drag
- ❌ Connect to existing drag & drop hooks

#### ❌ Task 4.3: Implement Search Results Display
**Files to modify:**
- `components/layout/sidebar-nav.tsx`
- `features/organization/store/organization-store.ts` - ✅ Search state already exists

**Implementation needed:**
- ❌ Show search results when searching
- ❌ Highlight matching items
- ❌ Filter sidebar to show only matches
- ❌ Empty state for no results

#### ✅ Task 4.4: Connect Editor to Organization
**Files modified:**
- `features/editor/components/editor.tsx` - ✅ Connected
- `components/layout/canvas-view.tsx` - ✅ Connected

**Changes:**
- ✅ Display note/chat title
- ✅ Allow inline title editing
- ✅ Auto-save to correct collection
- ✅ Fixed virtual collection ID issue

### ❌ Phase 5: Polish & Testing (NOT STARTED)

#### ❌ Task 5.1: Add Loading & Error States
**All modified components**

**Implementation:**
- ❌ Skeleton loaders during fetch
- ❌ Error boundaries for failures
- ❌ Toast notifications for actions

#### ❌ Task 5.2: Add Animations
**Files to modify:**
- `components/layout/sidebar-nav.tsx`

**Implementation:**
- ❌ Smooth expand/collapse animations
- ❌ Drag preview animations
- ❌ Hover state transitions

#### ❌ Task 5.3: Comprehensive Testing
**Files to create:**
- `tests/organization.test.ts`

**Test cases:**
- ❌ User seeding on first load
- ❌ Drag & drop between collections
- ❌ Recent filtering (7-day window)
- ❌ Starred items in Saved
- ❌ Delete cascading
- ❌ Search functionality

## Technical Decisions

### Why These Approaches:

1. **Permanent Spaces as Constants**: Ensures they can't be accidentally deleted and simplifies logic
2. **Smart Collections as Computed**: Avoids data duplication and ensures consistency
3. **Optimistic Updates**: Better UX for drag & drop and other operations
4. **Context Menus over Inline Buttons**: Cleaner UI, follows modern patterns
5. **DND Kit over Native**: Better accessibility and mobile support

### Database Considerations:

1. **No Collection Type Changes**: Recent/Saved are computed, not stored
2. **Soft References**: Items can exist without collections (Uncategorized)
3. **Cascade Deletes**: Handled by foreign keys for data integrity

## Migration Strategy

Since the database already has the schema:
1. ✅ No database migrations needed
2. ✅ Focus on seeding existing users with default spaces/collections
3. ✅ Handle backward compatibility for existing data

## Success Metrics

1. ✅ All existing notes/chats properly categorized
2. ✅ No browser prompts - proper dialogs everywhere
3. ⚡ Context menus on all items (partially complete)
4. ⚡ Drag & drop works smoothly (backend ready, UI pending)
5. ❌ Search shows results properly
6. ✅ No data loss during reorganization
7. ⚡ Professional UI/UX (80% complete)

## Timeline Estimate

- Phase 1 (Context Menus): ~~1 day~~ 0.5 days
- Phase 2 (Drag & Drop): 1 day
- Phase 3 (Search): 0.5 days
- Phase 4 (Polish): 1-2 days

**Total: ~3-4 days remaining**

## Next Steps

1. ✅ Review and approve this plan
2. ✅ Start with Phase 1, Task 1.1
3. ⚡ Test each phase before moving to the next
4. ⚡ Daily progress updates in sprint file

## Recent Updates (2024-12-19 Evening)

### Critical Bug Fixes
- ✅ Fixed virtual collection ID issue preventing note/chat creation
- ✅ Updated canvas-view.tsx to check for virtual collections
- ✅ Updated chat-interface.tsx to check for virtual collections
- ✅ Modified organization store to accept null collection IDs
- ✅ All TypeScript and linting errors resolved

### Component Creation Status
- ✅ All dialog components created AND integrated
- ✅ Emoji picker created AND integrated
- ✅ All context menu components created AND integrated
- ✅ Drag & drop hooks created but NOT connected to UI

### Context Menu Integration (2024-12-19)
- ✅ Refactored all context menu components to use Radix UI wrapping pattern
- ✅ Integrated context menus for spaces, collections, and items
- ✅ Connected rename, delete, star/unstar actions
- ✅ All builds passing with no errors

## Remaining Implementation Plan (Updated 2024-12-19)

### Phase 1: Integrate Context Menus (Day 1)

#### Task 1.1: Add Context Menu to Spaces
**Implementation:**
```typescript
// Add onContextMenu handler to space items
// Import SpaceContextMenu
// Position menu at cursor
// Connect rename/delete actions
```

#### Task 1.2: Add Context Menu to Collections
**Implementation:**
```typescript
// Add onContextMenu handler to collection items
// Import CollectionContextMenu
// Handle permanent vs user collections differently
```

#### Task 1.3: Add Context Menu to Items
**Implementation:**
```typescript
// Add onContextMenu handler to note/chat items
// Import ItemContextMenu
// Connect star/unstar, move, delete actions
```

### Phase 2: Complete Drag & Drop (Day 2)

#### Task 2.1: Connect DnD Context
**Implementation:**
```typescript
// Wrap sidebar content in DndContext
// Import existing use-drag-drop hook
// Add SortableContext for collections
```

#### Task 2.2: Make Items Draggable
**Implementation:**
```typescript
// Wrap note/chat items with Draggable
// Add drag handle or make entire item draggable
// Show drag preview
```

#### Task 2.3: Make Collections Droppable
**Implementation:**
```typescript
// Add Droppable to collections
// Visual feedback on valid drop targets
// Handle drop events
// Update item's collection
```

### Phase 3: Search Experience (Day 3)

#### Task 3.1: Create Search Results Overlay
**Implementation:**
```typescript
// Show overlay when search is active
// Display grouped results (Notes/Chats)
// Click to navigate to item
// Escape to clear search
```

#### Task 3.2: Add Search Highlighting
**Implementation:**
```typescript
// Highlight matching text in results
// Show match context
// Indicate total matches
```

### Phase 4: Polish (Days 4-5)

#### Task 4.1: Empty States
- Collection empty states with CTA
- Space empty states
- Search no results state

#### Task 4.2: Animations
- Smooth expand/collapse
- Drag animations
- Micro-interactions

#### Task 4.3: Loading States
- Skeleton loaders
- Operation progress
- Error recovery

## Next Immediate Steps

1. ✅ Fix virtual collection ID bug (DONE)
2. ⚡ Integrate context menus (NEXT)
3. ⚡ Connect drag & drop UI
4. ⚡ Implement search results display
5. ⚡ Add polish and animations

## Success Metrics

1. ✅ All existing notes/chats properly categorized
2. ✅ No browser prompts - proper dialogs everywhere
3. ⚡ Context menus on all items (partially complete)
4. ⚡ Drag & drop works smoothly (backend ready, UI pending)
5. ❌ Search shows results properly
6. ✅ No data loss during reorganization
7. ⚡ Professional UI/UX (80% complete)

## Timeline Estimate

- Phase 1 (Context Menus): ~~1 day~~ 0.5 days
- Phase 2 (Drag & Drop): 1 day
- Phase 3 (Search): 0.5 days
- Phase 4 (Polish): 1-2 days

**Total: ~3-4 days remaining**

## Dependencies

### Required Packages
```json
{
  "@emoji-mart/react": "^1.1.1",
  "@emoji-mart/data": "^1.1.2",
  "framer-motion": "^10.16.0",
  "@dnd-kit/core": "^6.0.0",
  "@dnd-kit/sortable": "^7.0.0",
  "react-hotkeys-hook": "^4.4.0"
}
```

### UI Components Needed
- Dialog (already have)
- Popover (already have)
- ContextMenu (need to add)
- Skeleton (already have)

## Risk Mitigation

1. **Performance**: Test with 1000+ items
2. **Accessibility**: Keyboard navigation for everything
3. **Mobile**: Progressive enhancement approach
4. **Data Loss**: Confirm all destructive actions
5. **UX Consistency**: Design system adherence 