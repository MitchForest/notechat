# Sprint 2: Smart Collection Expansion

## Goal
Make smart collections fully functional with expand/collapse capability, showing filtered items with proper empty states.

## Problem Statement
Smart collections are currently simple buttons that can't be expanded to show their filtered content. Users have no way to see what items match the filter criteria.

## Technical Design

### Component Architecture
```
SmartCollectionItem (expandable)
├── Header (click to expand/collapse)
│   ├── Icon
│   ├── Name
│   ├── Item Count
│   └── Chevron (far right)
└── Content (when expanded)
    ├── FilteredItemsList
    │   ├── DraggableNoteItem
    │   └── DraggableChatItem
    └── EmptyState
```

### Data Flow
1. Smart collection expanded → Fetch filtered content
2. Store filtered items in content store
3. Display items with same UI as regular collections
4. Update count badge in real-time

## Implementation Tasks

### Task 1: Update UI Store for Smart Collection Expansion (1 hour)
**File**: `features/organization/stores/ui-store.ts`

```typescript
interface UIState {
  // Add:
  smartCollectionExpansion: Record<string, boolean>
  smartCollectionLoading: Record<string, boolean>
}

interface UIActions {
  // Add:
  toggleSmartCollection: (collectionId: string) => void
  setSmartCollectionExpanded: (collectionId: string, expanded: boolean) => void
  setSmartCollectionLoading: (collectionId: string, loading: boolean) => void
}
```

### Task 2: Create Expandable Smart Collection Component (3 hours)
**File**: `features/organization/components/smart-collection-item.tsx`

```typescript
interface SmartCollectionItemProps {
  smartCollection: SmartCollection
  isActive: boolean
  isExpanded: boolean
  items: (Note | Chat)[] // Filtered items
  onToggle: () => void
  onClick: () => void
  onAction?: (action: string, collectionId: string) => void
  onItemClick: (item: Note | Chat, type: 'note' | 'chat') => void
  onItemAction: (action: string, itemId: string) => void
}

// Component structure:
<div className="group relative">
  {/* Header - always visible */}
  <div className="flex items-center">
    <button className="flex-1 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon />
        <span>{name}</span>
        <span className="text-xs text-muted-foreground">
          ({items.length})
        </span>
      </div>
      <ChevronIcon className="h-3 w-3" />
    </button>
    <HoverActions />
  </div>
  
  {/* Content - when expanded */}
  {isExpanded && (
    <div className="mt-0.5 ml-5 space-y-0.5">
      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <FilteredItemsList items={items} />
      )}
    </div>
  )}
</div>
```

### Task 3: Create Filtered Items List Component (2 hours)
**File**: `features/organization/components/filtered-items-list.tsx`

```typescript
export function FilteredItemsList({ 
  items, 
  onItemClick,
  onItemAction 
}: Props) {
  // Important: Smart collections can't accept drops
  // Items are read-only views of filtered content
  
  return (
    <div className="space-y-0.5">
      {items.map(item => (
        <DraggableNoteItem
          key={item.id}
          item={item}
          itemType={getItemType(item)}
          dragData={createDragData(item)}
          onItemClick={onItemClick}
          onItemAction={onItemAction}
          isDragDisabled={false} // Can drag FROM smart collection
          isDropDisabled={true}  // Can't drop INTO smart collection
        />
      ))}
    </div>
  )
}
```

### Task 4: Update Sidebar Nav to Handle Smart Collections (2 hours)
**File**: `components/layout/sidebar-nav.tsx`

```typescript
// Add state for filtered items per smart collection
const [smartCollectionItems, setSmartCollectionItems] = useState<
  Record<string, (Note | Chat)[]>
>({})

// Update smart collection rendering:
{spaceSmartCollections.map((smartCollection) => {
  const isExpanded = smartCollectionExpansion[smartCollection.id] ?? false
  const filteredItems = smartCollectionItems[smartCollection.id] || []
  
  return (
    <SmartCollectionItem
      key={smartCollection.id}
      smartCollection={smartCollection}
      isActive={isContextActive('smart-collection', smartCollection.id)}
      isExpanded={isExpanded}
      items={filteredItems}
      onToggle={() => {
        toggleSmartCollection(smartCollection.id)
        if (!isExpanded) {
          // Fetch items when expanding
          fetchAndSetSmartCollectionItems(smartCollection)
        }
      }}
      onClick={() => {
        setActiveContext({
          type: 'smart-collection',
          id: smartCollection.id,
          spaceId: space.id
        })
      }}
      onAction={handleSmartCollectionAction}
      onItemClick={handleItemClick}
      onItemAction={handleItemAction}
    />
  )
})}
```

### Task 5: Connect to Content Store (2 hours)
**File**: `features/organization/stores/content-store.ts`

Update `fetchSmartCollectionContent` to:
- Cache results per smart collection
- Return filtered items
- Handle loading states
- Update counts in real-time

### Task 6: Add Visual Polish (1 hour)
- Smooth expand/collapse animations
- Loading spinner while fetching
- Proper empty state messaging
- Tooltip explaining filters can't accept drops

## Edge Cases to Handle

1. **Performance**: Large result sets (1000+ items)
   - Implement virtualization if needed
   - Add pagination or "show more"

2. **Real-time Updates**: Items changing while expanded
   - Subscribe to changes
   - Update filtered results automatically

3. **Drag & Drop**: Clear visual indication
   - Can drag items FROM smart collections
   - Cannot drop items INTO smart collections
   - Show tooltip on drag over

## Acceptance Criteria

- [ ] Smart collections have expand/collapse chevron (far right)
- [ ] Clicking header expands/collapses collection
- [ ] Expanded state shows filtered items
- [ ] Empty state shows appropriate message
- [ ] Item count updates in real-time
- [ ] Can drag items from smart collection
- [ ] Cannot drop items into smart collection
- [ ] Loading state while fetching items
- [ ] Smooth animations for expand/collapse

## Testing

1. Expand smart collection → see filtered items
2. Create new item → appears in relevant smart collections
3. Delete item → removed from smart collections
4. Star/unstar → updates "Starred" collection
5. Drag from smart collection → works
6. Drag to smart collection → shows not allowed

## Notes

- Consider caching expanded state in localStorage
- May need debouncing for real-time updates
- Watch memory usage with many expanded collections 