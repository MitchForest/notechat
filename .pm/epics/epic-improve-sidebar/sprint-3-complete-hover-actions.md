# Sprint 3: Complete Hover Actions

## Goal
Finish all hover menu functionality with consistent positioning, proper actions for all item types, and a new change icon dialog.

## Problem Statement
Several hover actions are incomplete or have TODO comments:
- Change icon for collections not implemented
- Inconsistent positioning (`right-7` vs `right-8`)
- Smart collections missing change icon option
- Some actions not properly wired up

## Implementation Tasks

### Task 1: Create Change Icon Dialog (2 hours)
**File**: `features/organization/components/change-icon-dialog.tsx`

```typescript
interface ChangeIconDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentIcon: string
  itemName: string
  itemType: 'collection' | 'smart-collection'
  onChangeIcon: (newIcon: string) => void
}

// Icon categories
const ICON_CATEGORIES = {
  'General': ['folder', 'archive', 'box', 'package'],
  'Work': ['briefcase', 'clipboard', 'file-text', 'calendar'],
  'Creative': ['palette', 'image', 'music', 'video'],
  'Development': ['code', 'git-branch', 'terminal', 'database'],
  'Communication': ['mail', 'message-square', 'phone', 'globe'],
  'Finance': ['dollar-sign', 'credit-card', 'trending-up', 'pie-chart'],
  'Health': ['heart', 'activity', 'thermometer', 'pill'],
  'Education': ['book', 'graduation-cap', 'pen-tool', 'bookmark'],
}

// Component structure:
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Change Icon for {itemName}</DialogTitle>
    </DialogHeader>
    
    <Tabs defaultValue="general">
      <TabsList>
        {Object.keys(ICON_CATEGORIES).map(category => (
          <TabsTrigger key={category} value={category.toLowerCase()}>
            {category}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {Object.entries(ICON_CATEGORIES).map(([category, icons]) => (
        <TabsContent key={category} value={category.toLowerCase()}>
          <div className="grid grid-cols-6 gap-2">
            {icons.map(icon => (
              <IconButton
                key={icon}
                icon={icon}
                isSelected={icon === currentIcon}
                onClick={() => onChangeIcon(icon)}
              />
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  </DialogContent>
</Dialog>
```

### Task 2: Update Hover Actions Component (1 hour)
**File**: `features/organization/components/hover-actions.tsx`

```typescript
// Fix positioning - use consistent spacing
const HOVER_ACTION_POSITION = "absolute right-1 top-1/2 -translate-y-1/2"

// Add change icon for smart collections
{variant === 'collection' && (
  <>
    {onRename && (
      <DropdownMenuItem onClick={onRename}>
        <Edit2 className="mr-2 h-4 w-4" />
        Rename Collection
      </DropdownMenuItem>
    )}
    
    {onChangeIcon && (
      <DropdownMenuItem onClick={onChangeIcon}>
        <Palette className="mr-2 h-4 w-4" />
        Change Icon
      </DropdownMenuItem>
    )}
    
    {onMove && (
      <DropdownMenuItem onClick={onMove}>
        <FolderOpen className="mr-2 h-4 w-4" />
        Move to Space...
      </DropdownMenuItem>
    )}
  </>
)}

// Add for smart collections too
{variant === 'smart-collection' && (
  <>
    {onChangeIcon && (
      <DropdownMenuItem onClick={onChangeIcon}>
        <Palette className="mr-2 h-4 w-4" />
        Change Icon
      </DropdownMenuItem>
    )}
  </>
)}
```

### Task 3: Wire Up Change Icon Actions (2 hours)
**File**: `components/layout/sidebar-nav.tsx`

```typescript
// Add state for change icon dialog
const [changeIconDialog, setChangeIconDialog] = useState<{
  open: boolean
  itemId: string
  itemType: 'collection' | 'smart-collection'
  itemName: string
  currentIcon: string
}>({
  open: false,
  itemId: '',
  itemType: 'collection',
  itemName: '',
  currentIcon: 'folder'
})

// Update collection action handler
const handleCollectionAction = useCallback((action: string, collectionId: string) => {
  const collection = collections.find(c => c.id === collectionId)
  if (!collection) return

  switch (action) {
    case 'changeIcon':
      setChangeIconDialog({
        open: true,
        itemId: collectionId,
        itemType: 'collection',
        itemName: collection.name,
        currentIcon: collection.icon || 'folder'
      })
      break
    // ... other cases
  }
}, [collections])

// Add handler for smart collections
const handleSmartCollectionAction = useCallback((action: string, smartCollectionId: string) => {
  const smartCollection = smartCollections.find(sc => sc.id === smartCollectionId)
  if (!smartCollection) return

  switch (action) {
    case 'changeIcon':
      setChangeIconDialog({
        open: true,
        itemId: smartCollectionId,
        itemType: 'smart-collection',
        itemName: smartCollection.name,
        currentIcon: smartCollection.icon || 'filter'
      })
      break
    // ... other cases
  }
}, [smartCollections])
```

### Task 4: Fix Positioning Consistency (1 hour)
**Files**: All components using hover actions

Update all hover action positions to use consistent spacing:
```typescript
// In space-section.tsx
<HoverActions
  className="absolute right-1" // Changed from right-8
/>

// In sidebar-collection-item.tsx
<HoverActions
  className="absolute right-1" // Changed from right-7
/>

// In smart-collection-item.tsx
<HoverActions
  className="absolute right-1" // Already correct
/>
```

### Task 5: Add Move to Space Dialog (2 hours)
**File**: `features/organization/components/move-to-space-dialog.tsx`

```typescript
interface MoveToSpaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemType: 'collection' | 'note' | 'chat'
  itemName: string
  currentSpaceId: string
  spaces: Space[]
  onMove: (targetSpaceId: string) => void
}

// Show list of available spaces
// Disable current space
// Show space emoji and name
// Confirm button
```

### Task 6: Complete All TODO Actions (1 hour)
- Wire up move to space for collections
- Implement duplicate for notes/chats
- Add proper error handling for all actions
- Show loading states during async operations

## Visual Improvements

1. **Hover State Timing**
```css
.hover-actions {
  opacity: 0;
  transition: opacity 200ms ease-in-out;
}

.group:hover .hover-actions {
  opacity: 1;
}
```

2. **Active State for Dropdown**
```css
/* Highlight active dropdown item */
[data-state="open"] .hover-actions {
  opacity: 1;
}
```

## Acceptance Criteria

- [ ] Change icon dialog works for collections and smart collections
- [ ] All hover actions have consistent positioning (right-1)
- [ ] Move to space dialog implemented and working
- [ ] All TODO comments removed and actions implemented
- [ ] Proper error handling with toast notifications
- [ ] Loading states for async operations
- [ ] Smooth hover transitions
- [ ] Keyboard accessible (tab navigation)

## Testing

1. Test each action for each item type
2. Verify icon changes persist after refresh
3. Test move operations with drag/drop disabled
4. Verify error handling for failed operations
5. Test keyboard navigation through menus
6. Test on touch devices (long press)

## Notes

- Consider adding keyboard shortcuts for common actions
- May want to add confirmation dialogs for destructive actions
- Watch for z-index issues with overlapping menus
- Consider adding action history/undo 