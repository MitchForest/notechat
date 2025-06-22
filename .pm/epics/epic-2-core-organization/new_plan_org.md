# Epic 2: Core Organization - New Implementation Plan

## Overview
This document outlines the comprehensive plan for implementing the new organization structure for NoteChat. The database already has most of the required schema in place, so we'll focus on implementing the UI/UX and business logic.

**Overall Progress: 70% Complete**

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

### ⚡ Phase 3: UI Components (75% COMPLETE)

#### ❌ Task 3.1: Create Emoji Picker Component
**Files to create:**
- `features/organization/components/emoji-picker.tsx`

**Implementation:**
- ❌ Popover-based emoji picker
- ❌ Integration with space creation/editing
- ❌ Default emoji suggestions

#### ✅ Task 3.2: Rebuild Sidebar Navigation
**Files modified:**
- `components/layout/sidebar-nav.tsx`

**Major changes:**
- ✅ Complete restructure to new hierarchy
- ✅ Implement collapsible sections with Collapsible component
- ✅ Add drag & drop zones
- ❌ Implement context menus (using prompts for now)
- ✅ Add hover/active states per design system
- ✅ Handle permanent vs user spaces differently

#### ❌ Task 3.3: Create Context Menu Component
**Files to create:**
- `features/organization/components/item-context-menu.tsx`

**Implementation:**
- ❌ Right-click menu for items
- ❌ Options: Rename, Delete, Star/Unstar
- ❌ Different options for spaces vs collections vs items

### ❌ Phase 4: Feature Implementation (NOT STARTED)

#### ❌ Task 4.1: Implement Inline Editing
**Files to create:**
- `features/organization/components/inline-edit.tsx`

**Implementation:**
- ❌ Click to edit titles
- ❌ Escape to cancel, Enter to save
- ❌ Auto-focus and select all on edit

#### ❌ Task 4.2: Implement Search Functionality
**Files to modify:**
- `components/layout/sidebar-nav.tsx` - ✅ Added search UI
- `features/organization/store/organization-store.ts` - ✅ Added search state

**Implementation:**
- ❌ Real-time search across all items
- ❌ Highlight matching items
- ❌ Filter sidebar to show only matches

#### ❌ Task 4.3: Connect Editor to Organization
**Files to modify:**
- `features/editor/components/editor.tsx`
- `components/layout/canvas-view.tsx`

**Changes:**
- ❌ Display note/chat title
- ❌ Allow inline title editing
- ❌ Auto-save to correct collection

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
2. ⚡ Drag & drop works smoothly with < 100ms visual feedback (needs testing)
3. ❌ Search returns results in < 200ms
4. ✅ No data loss during reorganization
5. ⚡ Intuitive UX requiring no documentation (partially complete)

## Timeline Estimate

- Phase 1 (Backend): ~~1 day~~ ✅ COMPLETE
- Phase 2 (State Management): ~~1 day~~ ✅ COMPLETE
- Phase 3 (UI Components): ~~2 days~~ 1 day remaining
- Phase 4 (Features): 2 days
- Phase 5 (Polish): 1 day

**Total: ~4 days remaining (was 7 days total)**

## Next Steps

1. ✅ Review and approve this plan
2. ✅ Start with Phase 1, Task 1.1
3. ⚡ Test each phase before moving to the next
4. ⚡ Daily progress updates in sprint file

## Recent UI/UX Updates (2024-12-19)

### UI Consistency Improvements
- ✅ Removed all primary color from hover states
- ✅ Made all interactions instant (removed transitions)
- ✅ Active states removed from spaces/collections
- ✅ NC logo restored to primary color
- ✅ Fixed layout issues with flex-shrink
- ✅ Hover effects on New Chat/New Note buttons

### Design Decisions
- Primary color reserved only for focus rings and branding (NC logo)
- All hover states use neutral grays for consistency
- Instant feedback (no transitions) for snappy feel
- Fixed header/footer in sidebar for constant access 