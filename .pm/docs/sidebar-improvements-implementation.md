# Sidebar Improvements Implementation Plan

## Overview
This document outlines the implementation plan for fixing and enhancing the sidebar functionality, including real-time updates, missing features, UI improvements, and bug fixes.

## Issues to Address

1. **No real-time updates** when creating spaces/collections
2. **Missing features** in create collection dialog (icons, smart collections)
3. **Context menus not working** on macOS
4. **Double toast notifications** appearing
5. **No optimistic updates** in stores

## Implementation Plan

### Phase 1: Fix Double Toast Notifications
**Problem**: Toast notifications are being triggered both in the store and in the component.

**Solution**:
- Remove toast calls from components (sidebar-nav.tsx)
- Keep toast notifications only in store methods
- Ensure stores return proper success/error states

**Files to modify**:
- `features/organization/stores/space-store.ts`
- `features/organization/stores/collection-store.ts`
- `components/layout/sidebar-nav.tsx`

### Phase 2: Implement Optimistic Updates
**Goal**: UI updates immediately while API calls happen in background

**Implementation**:
```typescript
// Example for createSpace in space-store.ts
createSpace: async (name: string, emoji: string) => {
  // 1. Generate temporary ID
  const tempId = `temp-${Date.now()}`
  
  // 2. Optimistically add to store
  const optimisticSpace = {
    id: tempId,
    name,
    emoji,
    type: 'user',
    userId: currentUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
    collections: [],
    smartCollections: DEFAULT_SMART_COLLECTIONS
  }
  
  set(state => ({
    spaces: [...state.spaces, optimisticSpace]
  }))
  
  try {
    // 3. Make API call
    const response = await fetch('/api/spaces', {...})
    const newSpace = await response.json()
    
    // 4. Replace temp with real data
    set(state => ({
      spaces: state.spaces.map(s => 
        s.id === tempId ? newSpace : s
      )
    }))
    
    toast.success(`Space "${name}" created`)
    return newSpace
  } catch (error) {
    // 5. Rollback on error
    set(state => ({
      spaces: state.spaces.filter(s => s.id !== tempId)
    }))
    
    toast.error('Failed to create space')
    throw error
  }
}
```

**Apply similar pattern to**:
- `createCollection`
- `updateSpace`
- `updateCollection`
- `deleteSpace`
- `deleteCollection`

### Phase 3: Replace Context Menus with Hover Actions
**Design**: Add a three-dot menu button that appears on hover

**Component Structure**:
```tsx
// New component: features/organization/components/hover-actions.tsx
interface HoverActionsProps {
  onEdit?: () => void
  onDelete?: () => void
  onRename?: () => void
  onChangeIcon?: () => void
  onMove?: () => void
  className?: string
}

export function HoverActions({ ... }: HoverActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className={cn(
            "h-6 w-6 p-0 opacity-0 group-hover:opacity-100",
            "transition-opacity duration-200",
            className
          )}
        >
          <MoreHorizontal className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onRename && (
          <DropdownMenuItem onClick={onRename}>
            <Edit2 className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
        )}
        {/* ... other actions ... */}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

**Integration**:
- Add `group` class to space/collection containers
- Position hover actions absolutely within containers
- Remove all SpaceContextMenu and CollectionContextMenu wrappers
- Delete the context menu components

### Phase 4: Enhanced Create Collection Dialog
**New Features**:
1. Collection type selector (Regular/Smart)
2. Icon picker
3. Smart collection configuration

**Component Structure**:
```tsx
// Update: features/organization/components/create-collection-dialog.tsx
interface CreateCollectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  spaceName: string
  spaceId: string
  onCreateCollection: (data: {
    name: string
    icon: string
    type: 'regular' | 'smart'
    filterConfig?: SmartCollectionFilter
  }) => void
}

// Dialog content structure:
// 1. Collection Type Toggle
// 2. Name Input
// 3. Icon Picker Grid (20 icons from collection-icons.ts)
// 4. If Smart Collection:
//    - Filter Type: All/Notes/Chats
//    - Time Range: All/7days/30days/Custom
//    - Starred Only: Checkbox
//    - Sort By: Updated/Created/Title
//    - Order: Asc/Desc
```

**Icon Picker Component**:
```tsx
// New component: features/organization/components/icon-picker-grid.tsx
interface IconPickerGridProps {
  selectedIcon: string
  onSelectIcon: (icon: string) => void
}

export function IconPickerGrid({ ... }: IconPickerGridProps) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {COLLECTION_ICONS.map(({ name, label }) => {
        const Icon = getCollectionIcon(name)
        return (
          <Button
            key={name}
            variant={selectedIcon === name ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectIcon(name)}
            className="h-10 w-10 p-0"
          >
            <Icon className="h-4 w-4" />
          </Button>
        )
      })}
    </div>
  )
}
```

### Phase 5: Update Store Methods for Smart Collections
**Add to collection-store.ts**:
```typescript
createSmartCollection: async (
  name: string,
  icon: string,
  spaceId: string,
  filterConfig: SmartCollectionFilter
) => {
  // Similar optimistic update pattern
  // Call /api/smart-collections endpoint
}
```

### Phase 6: Fix Collection Icon Display
**Current Issue**: Regular collections don't have icon field in the database

**Options**:
1. Add migration to add `icon` column to collections table
2. Use a default icon for regular collections

**Recommendation**: Add icon column to collections table
```sql
ALTER TABLE collections ADD COLUMN icon VARCHAR(50) DEFAULT 'folder';
```

## File Changes Summary

### Modified Files:
1. `components/layout/sidebar-nav.tsx` - Remove toast calls, integrate hover actions
2. `features/organization/stores/space-store.ts` - Add optimistic updates
3. `features/organization/stores/collection-store.ts` - Add optimistic updates, smart collection creation
4. `features/organization/stores/smart-collection-store.ts` - Add creation method
5. `features/organization/components/create-collection-dialog.tsx` - Complete rewrite
6. `features/organization/components/space-section.tsx` - Add hover actions
7. `features/organization/components/sidebar-collection-item.tsx` - Add hover actions
8. `lib/db/schema.ts` - Add icon field to collections

### New Files:
1. `features/organization/components/hover-actions.tsx`
2. `features/organization/components/icon-picker-grid.tsx`
3. `features/organization/components/smart-collection-config.tsx`

### Deleted Files:
1. `features/organization/components/space-context-menu.tsx`
2. `features/organization/components/collection-context-menu.tsx`
3. `features/organization/components/item-context-menu.tsx`

## Testing Plan
1. Test optimistic updates with network throttling
2. Test rollback on API failures
3. Verify single toast notifications
4. Test hover actions on all platforms
5. Test smart collection creation with various filters
6. Test icon selection and persistence

## Migration Strategy
1. Add icon column to collections table
2. Set default icon for existing collections
3. Update all API endpoints to handle icon field

## Estimated Timeline
- Phase 1-2: 2 hours (Toast fixes + Optimistic updates)
- Phase 3: 2 hours (Hover actions replacement)
- Phase 4: 3 hours (Enhanced dialog)
- Phase 5-6: 2 hours (Smart collections + icons)
- Testing: 1 hour

Total: ~10 hours of implementation 