# Epic: Sidebar Navigation Improvements

## Overview
This epic addresses critical usability issues in the sidebar navigation system. The current implementation has fragmented state management, incomplete UI components, and poor visual feedback for user interactions.

## Current Issues Analysis

### 1. Active State Management (Critical)
**Problem**: Multiple stores track different active states independently
- `activeSpaceId` in space-store
- `activeCollectionId` in collection-store  
- `activeSmartCollectionId` in smart-collection-store
- No coordination between these states
- Weak visual indication (only `bg-hover-1` or `bg-hover-2`)
- New items don't know where to be saved

**Impact**: Users can't tell which collection/space is active, and new notes/chats may be saved in unexpected locations.

### 2. Smart Collections Not Expandable (High)
**Problem**: Smart collections are implemented as simple buttons
- No expand/collapse functionality
- No chevron icon
- Can't display filtered items
- Missing UI state management

**Impact**: Users can't see what's inside smart collections or interact with filtered items.

### 3. Incomplete Hover Actions (Medium)
**Problem**: Hover menus are partially implemented
- Change icon for collections is TODO
- Inconsistent positioning (`right-7` vs `right-8`)
- Smart collections missing change icon option
- Some actions not wired up

**Impact**: Users can't fully manage their collections and spaces.

### 4. Empty Collection States (Medium)
**Problem**: Inconsistent empty state handling
- Regular collections show "No items" when empty
- Smart collections can't be opened at all
- No visual indication that a collection is empty

**Impact**: Poor user experience when working with empty collections.

### 5. Item Display Under Smart Collections (High)
**Problem**: Smart collections don't show their filtered items
- `fetchSmartCollectionContent` exists but UI doesn't use it
- No visual hierarchy for filtered items
- Drag/drop behavior unclear

**Impact**: Smart collections appear broken - users can't see filtered content.

## Proposed Architecture

### Unified Active Context System
```typescript
// New unified active context
interface ActiveContext {
  type: 'space' | 'collection' | 'smart-collection'
  id: string
  spaceId: string // Always track parent space
}

// Single source of truth in UI store
activeContext: ActiveContext | null
```

### Component Architecture
```
SidebarNav
├── SidebarHeader
├── SidebarActionButtons
├── SidebarSearch
├── ScrollArea
│   ├── SpaceSection (expandable)
│   │   ├── SmartCollectionItem (NEW: expandable)
│   │   │   └── FilteredItemsList
│   │   ├── CollectionItem (expandable)
│   │   │   └── ItemsList
│   │   └── NewCollectionButton
│   └── NewSpaceButton
└── SidebarUserMenu
```

## Implementation Plan

### Sprint 1: Unified Active State Management
**Goal**: Create single source of truth for active context
**Duration**: 2 days

#### Tasks:
1. Add unified active context to UI store
2. Create helper functions for context management
3. Update all components to use unified context
4. Implement strong visual indicators (left border + background)
5. Ensure new items save to correct location
6. Add tests for context switching

#### Files to modify:
- `features/organization/stores/ui-store.ts`
- `features/organization/stores/space-store.ts`
- `features/organization/stores/collection-store.ts`
- `features/organization/stores/smart-collection-store.ts`
- `components/layout/sidebar-nav.tsx`
- `features/organization/components/space-section.tsx`
- `features/organization/components/sidebar-collection-item.tsx`
- `features/organization/components/smart-collection-item.tsx`

### Sprint 2: Smart Collection Expansion
**Goal**: Make smart collections fully functional with expand/collapse
**Duration**: 2 days

#### Tasks:
1. Add expansion state for smart collections to UI store
2. Create new `ExpandableSmartCollectionItem` component
3. Implement chevron icon (far right position)
4. Add filtered items display when expanded
5. Show empty state when no items match filter
6. Connect to `fetchSmartCollectionContent`

#### Files to modify:
- `features/organization/stores/ui-store.ts`
- `features/organization/components/smart-collection-item.tsx`
- `components/layout/sidebar-nav.tsx`
- Create: `features/organization/components/filtered-items-list.tsx`

### Sprint 3: Complete Hover Actions
**Goal**: Finish all hover menu functionality
**Duration**: 1 day

#### Tasks:
1. Create change icon dialog component
2. Wire up all TODO actions
3. Fix positioning consistency (use `right-1` for all)
4. Add proper hover states and transitions
5. Ensure all actions have proper error handling

#### Files to modify:
- `features/organization/components/hover-actions.tsx`
- Create: `features/organization/components/change-icon-dialog.tsx`
- `components/layout/sidebar-nav.tsx`

### Sprint 4: Visual Polish & Drag/Drop
**Goal**: Fix visual layout and clarify drag/drop behavior
**Duration**: 1 day

#### Tasks:
1. Move all chevrons to far right with `justify-between`
2. Add visual indicators for non-droppable items
3. Improve active state styling (consider left accent border)
4. Add smooth transitions for expand/collapse
5. Fix spacing and alignment issues
6. Add tooltips for smart collections explaining they're filters

#### Files to modify:
- All component files for visual updates
- `features/organization/hooks/use-drag-drop.ts`
- Add new CSS classes to `globals.css` if needed

### Sprint 5: Testing & Documentation
**Goal**: Ensure reliability and maintainability
**Duration**: 1 day

#### Tasks:
1. Add comprehensive tests for active context
2. Test smart collection filtering
3. Test drag/drop edge cases
4. Update component documentation
5. Create user guide for new features
6. Performance testing with many items

## Success Criteria

1. **Active State**: Only one collection/space can be active at a time with clear visual indication
2. **Smart Collections**: Fully expandable showing filtered items with proper empty states
3. **Hover Actions**: All actions functional with consistent positioning
4. **Visual Consistency**: Chevrons aligned right, proper spacing, smooth animations
5. **Performance**: No lag with 1000+ items in sidebar
6. **Accessibility**: Full keyboard navigation and screen reader support

## Technical Decisions

### State Management
- Keep Zustand for stores
- Unify active state in UI store
- Use optimistic updates for all mutations

### Component Patterns
- Use compound components for lists
- Implement proper React.memo for performance
- Use CSS-in-JS for dynamic styles only

### Testing Strategy
- Unit tests for store logic
- Integration tests for user flows
- Visual regression tests for UI changes

## Rollback Plan

1. Feature flag: `ENABLE_SIDEBAR_IMPROVEMENTS`
2. Keep old implementation alongside new
3. Gradual rollout to subset of users
4. Monitor error rates and performance
5. One-click rollback if issues arise

## Dependencies

- No new npm packages required
- Uses existing Radix UI components
- Leverages current drag/drop setup

## Timeline

- Total Duration: 7 days
- Start Date: TBD
- End Date: TBD

## Notes

- Priority order matches business impact
- Each sprint is independently deployable
- Focus on backwards compatibility
- Consider A/B testing for active state styling 