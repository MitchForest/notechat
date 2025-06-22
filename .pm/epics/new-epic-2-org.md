# Epic: Organization Module Refactoring

## Overview
The `features/organization` module is responsible for managing the hierarchical structure of spaces, collections, notes, and chats. While functional, the current implementation has several architectural issues that need to be addressed.

## Current State Analysis

### Architecture Issues
1. **Monolithic Store** - `organization-store.ts` (575 lines) manages too many concerns:
   - Spaces, collections, notes, chats
   - Search functionality
   - UI state (active items, loading, errors)
   - Data fetching and caching
   - Optimistic updates

2. **God Component** - `sidebar-nav.tsx` (1082 lines) handles:
   - Rendering entire sidebar UI
   - Managing local state for expansions, dialogs
   - Business logic for filtering
   - Drag & drop orchestration
   - User menu and theme switching

3. **Duplicated Configuration** - Permanent spaces defined in multiple places:
   - `organization-store.ts` (now fixed)
   - `seed-user.ts`
   - `permanent-space-config.ts` (newly created)

4. **Incomplete Features** - Multiple TODOs for:
   - Delete space/collection
   - Rename space/collection
   - Move collection to space
   - Duplicate items

### Strengths
- Good TypeScript usage
- Optimistic updates with rollback
- Drag & drop implementation
- Context menus for actions
- Search functionality

## Refactoring Plan

### Phase 1: Store Decomposition
Break the monolithic store into focused, single-responsibility stores:

#### 1.1 Create `useSpaceStore`
```typescript
// features/organization/stores/space-store.ts
- Manage spaces CRUD operations
- Handle space-specific actions (create, rename, delete)
- Maintain active space state
```

#### 1.2 Create `useCollectionStore`
```typescript
// features/organization/stores/collection-store.ts
- Manage collections CRUD operations
- Handle collection-specific actions
- Maintain active collection state
```

#### 1.3 Create `useContentStore`
```typescript
// features/organization/stores/content-store.ts
- Manage notes and chats
- Handle content operations (create, update, delete, star)
- Implement caching strategy
```

#### 1.4 Create `useSearchStore`
```typescript
// features/organization/stores/search-store.ts
- Manage search state
- Handle search operations
- Debounced search logic
```

#### 1.5 Create `useUIStore`
```typescript
// features/organization/stores/ui-store.ts
- Manage UI state (expansions, active items)
- Handle loading and error states
- Sidebar collapsed state
```

### Phase 2: Component Decomposition
Break the god component into smaller, focused components:

#### 2.1 Extract Search Component
```typescript
// features/organization/components/sidebar-search.tsx
- Search input
- Search results overlay
- Keyboard navigation
```

#### 2.2 Extract Space List Component
```typescript
// features/organization/components/space-list.tsx
- Render spaces
- Handle space interactions
- Manage space expansion state
```

#### 2.3 Extract Collection List Component
```typescript
// features/organization/components/collection-list.tsx
- Render collections within a space
- Handle collection interactions
- Manage collection expansion state
```

#### 2.4 Extract Item List Component
```typescript
// features/organization/components/item-list.tsx
- Render notes/chats within a collection
- Handle item interactions
- Implement virtualization for performance
```

#### 2.5 Extract Sidebar Header
```typescript
// features/organization/components/sidebar-header.tsx
- App branding
- Collapse/expand button
- New note/chat buttons
```

#### 2.6 Extract User Menu
```typescript
// features/organization/components/sidebar-user-menu.tsx
- User profile display
- Theme toggle
- Sign out
```

### Phase 3: Data Layer Improvements

#### 3.1 Implement Caching Strategy
```typescript
// features/organization/lib/cache.ts
- LRU cache for collections
- Stale-while-revalidate pattern
- Background refresh
```

#### 3.2 Create Data Fetching Hooks
```typescript
// features/organization/hooks/use-collection-items.ts
- Fetch and cache collection items
- Handle pagination
- Implement infinite scroll
```

#### 3.3 Optimize API Calls
- Batch operations where possible
- Implement proper error boundaries
- Add retry logic with exponential backoff

### Phase 4: Configuration Consolidation

#### 4.1 Centralize All Configuration
```typescript
// features/organization/config/index.ts
- Merge permanent spaces config
- Define feature flags
- Set up constants
```

#### 4.2 Create Type-Safe Builders
```typescript
// features/organization/lib/builders.ts
- Space builder
- Collection builder
- Filter builder
```

### Phase 5: Complete Missing Features

#### 5.1 Implement Delete Operations
- Delete space (with confirmation)
- Delete collection (with confirmation)
- Bulk delete items

#### 5.2 Implement Rename Operations
- Inline rename for spaces/collections
- Rename dialog improvements

#### 5.3 Implement Move Operations
- Move collection between spaces
- Bulk move items

#### 5.4 Implement Duplicate Operations
- Duplicate space with collections
- Duplicate items

### Phase 6: Performance Optimizations

#### 6.1 Virtualization
- Implement react-window for item lists
- Lazy load collections

#### 6.2 Memoization
- Optimize re-renders with proper memo usage
- Implement selector patterns

#### 6.3 Code Splitting
- Lazy load dialogs
- Split drag & drop functionality

## Implementation Order

1. **Week 1**: Store Decomposition (Phase 1)
   - Start with `useContentStore` as it's most critical
   - Then `useSpaceStore` and `useCollectionStore`
   - Finally `useSearchStore` and `useUIStore`

2. **Week 2**: Component Decomposition (Phase 2)
   - Extract search first (standalone)
   - Then header and user menu
   - Finally lists (most complex)

3. **Week 3**: Data Layer (Phase 3)
   - Implement caching
   - Create data hooks
   - Optimize API calls

4. **Week 4**: Features & Polish (Phases 4-6)
   - Complete missing features
   - Performance optimizations
   - Testing and documentation

## Migration Strategy

1. **Parallel Implementation**: Build new stores alongside old one
2. **Feature Flag**: Use feature flag to switch between implementations
3. **Gradual Migration**: Migrate one feature at a time
4. **Backward Compatibility**: Ensure no breaking changes
5. **Data Migration**: Handle any data structure changes

## Success Metrics

- Reduce `organization-store.ts` from 575 to <100 lines
- Reduce `sidebar-nav.tsx` from 1082 to <300 lines
- Improve Time to Interactive by 30%
- Zero breaking changes during migration
- 100% feature parity

## Risk Mitigation

1. **Testing**: Comprehensive test suite before refactoring
2. **Feature Flags**: Ability to rollback quickly
3. **Incremental Changes**: Small, reviewable PRs
4. **Documentation**: Update as we go
5. **Performance Monitoring**: Track metrics throughout

## Technical Decisions

### State Management
- Keep Zustand for stores (already in use)
- Use Immer for immutable updates
- Implement proper TypeScript discriminated unions

### Component Architecture
- Use compound components pattern for lists
- Implement proper accessibility (ARIA)
- Use CSS modules for styling isolation

### Data Fetching
- Keep current fetch approach
- Add SWR for caching if needed later
- Implement proper loading states

## Next Steps

1. Review and approve this plan
2. Create detailed tickets for each phase
3. Set up feature flags
4. Begin with Phase 1.1 (useContentStore)

## Notes

- The refactoring should maintain 100% backward compatibility
- Each phase should be independently deployable
- Focus on developer experience improvements
- Consider adding Storybook for component documentation 