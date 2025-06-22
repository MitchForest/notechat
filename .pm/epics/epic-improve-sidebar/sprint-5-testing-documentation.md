# Sprint 5: Testing & Documentation

## Goal
Ensure reliability and maintainability through comprehensive testing, documentation, and performance optimization.

## Implementation Tasks

### Task 1: Unit Tests for Stores (2 hours)
**File**: `features/organization/stores/__tests__/unified-active-context.test.ts`

```typescript
import { renderHook, act } from '@testing-library/react'
import { useUIStore } from '../ui-store'
import { useSpaceStore } from '../space-store'
import { useCollectionStore } from '../collection-store'

describe('Unified Active Context', () => {
  beforeEach(() => {
    // Reset stores
    useUIStore.setState({ activeContext: null })
  })

  test('setting active context clears previous', () => {
    const { result } = renderHook(() => useUIStore())
    
    // Set space as active
    act(() => {
      result.current.setActiveContext({
        type: 'space',
        id: 'space-1',
        spaceId: 'space-1'
      })
    })
    
    expect(result.current.activeContext?.type).toBe('space')
    
    // Set collection as active
    act(() => {
      result.current.setActiveContext({
        type: 'collection',
        id: 'collection-1',
        spaceId: 'space-1'
      })
    })
    
    expect(result.current.activeContext?.type).toBe('collection')
    expect(result.current.activeContext?.id).toBe('collection-1')
  })

  test('isContextActive returns correct state', () => {
    const { result } = renderHook(() => useUIStore())
    
    act(() => {
      result.current.setActiveContext({
        type: 'collection',
        id: 'collection-1',
        spaceId: 'space-1'
      })
    })
    
    expect(result.current.isContextActive('collection', 'collection-1')).toBe(true)
    expect(result.current.isContextActive('collection', 'collection-2')).toBe(false)
    expect(result.current.isContextActive('space', 'space-1')).toBe(false)
  })
})
```

### Task 2: Integration Tests for Smart Collections (2 hours)
**File**: `features/organization/__tests__/smart-collection-filtering.test.tsx`

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SmartCollectionItem } from '../components/smart-collection-item'

describe('Smart Collection Filtering', () => {
  test('expands and shows filtered items', async () => {
    const smartCollection = {
      id: 'sc-1',
      name: 'Recent',
      icon: 'clock',
      filterConfig: { timeRange: { unit: 'days', value: 7 } }
    }
    
    render(
      <SmartCollectionItem
        smartCollection={smartCollection}
        isActive={false}
        isExpanded={false}
        items={[]}
        onToggle={jest.fn()}
        onClick={jest.fn()}
        onItemClick={jest.fn()}
        onItemAction={jest.fn()}
      />
    )
    
    // Click to expand
    const button = screen.getByRole('button')
    await userEvent.click(button)
    
    // Should trigger onToggle
    expect(onToggle).toHaveBeenCalled()
    
    // When expanded with items
    rerender(
      <SmartCollectionItem
        smartCollection={smartCollection}
        isExpanded={true}
        items={mockItems}
        // ... other props
      />
    )
    
    // Should show items
    expect(screen.getByText('Note 1')).toBeInTheDocument()
    expect(screen.getByText('Chat 1')).toBeInTheDocument()
  })
})
```

### Task 3: E2E Tests for User Flows (3 hours)
**File**: `e2e/sidebar-navigation.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Sidebar Navigation', () => {
  test('active state management', async ({ page }) => {
    await page.goto('/')
    
    // Click on a space
    await page.click('text=Personal')
    
    // Should have active styling
    const spaceButton = page.locator('button:has-text("Personal")')
    await expect(spaceButton).toHaveClass(/sidebar-item-active/)
    
    // Click on a collection
    await page.click('text=Projects')
    
    // Space should no longer be active
    await expect(spaceButton).not.toHaveClass(/sidebar-item-active/)
    
    // Collection should be active
    const collectionButton = page.locator('button:has-text("Projects")')
    await expect(collectionButton).toHaveClass(/sidebar-item-active/)
  })

  test('smart collection expansion', async ({ page }) => {
    await page.goto('/')
    
    // Find and click Recent smart collection
    const recentButton = page.locator('button:has-text("Recent")')
    await recentButton.click()
    
    // Should expand and show items
    await expect(page.locator('text=No items')).toBeVisible()
    // or
    await expect(page.locator('[data-testid="note-item"]').first()).toBeVisible()
  })

  test('drag and drop restrictions', async ({ page }) => {
    await page.goto('/')
    
    // Try to drag item to smart collection
    const item = page.locator('[data-testid="note-item"]').first()
    const smartCollection = page.locator('button:has-text("Starred")')
    
    await item.dragTo(smartCollection)
    
    // Should show tooltip
    await expect(page.locator('text=cannot accept items')).toBeVisible()
  })
})
```

### Task 4: Performance Testing (2 hours)
**File**: `features/organization/__tests__/performance.test.ts`

```typescript
import { measureRenderTime } from '@/test-utils/performance'

describe('Sidebar Performance', () => {
  test('renders 1000 items without lag', async () => {
    const items = Array.from({ length: 1000 }, (_, i) => ({
      id: `item-${i}`,
      title: `Item ${i}`,
      // ... other props
    }))
    
    const renderTime = await measureRenderTime(
      <SidebarNav items={items} />
    )
    
    expect(renderTime).toBeLessThan(100) // 100ms threshold
  })

  test('expand/collapse animation performance', async () => {
    const { rerender, getAnimationFrames } = renderWithAnimationTracking(
      <CollectionItem isExpanded={false} />
    )
    
    rerender(<CollectionItem isExpanded={true} />)
    
    const frames = await getAnimationFrames()
    expect(frames).toBeGreaterThan(12) // 60fps = ~12 frames for 200ms
  })
})
```

### Task 5: Component Documentation (2 hours)
**File**: `features/organization/README.md`

```markdown
# Organization Module

## Overview
The organization module manages the hierarchical structure of spaces, collections, and items in the sidebar.

## Architecture

### Stores
- **UIStore**: Manages UI state including active context and expansions
- **SpaceStore**: Handles space CRUD operations
- **CollectionStore**: Manages regular collections
- **SmartCollectionStore**: Handles smart collections (filters)
- **ContentStore**: Manages notes and chats

### Key Components

#### SidebarNav
Main orchestrator component that brings everything together.

```typescript
<SidebarNav user={user} />
```

#### SpaceSection
Renders a space with its collections and items.

Props:
- `space`: Space object
- `isExpanded`: Boolean
- `isActive`: Boolean
- `onToggle`: Function
- `onAction`: Function for hover menu actions

#### SmartCollectionItem
Renders an expandable smart collection with filtered items.

Props:
- `smartCollection`: SmartCollection object
- `isExpanded`: Boolean
- `items`: Filtered items array
- Various action handlers

### Active Context System

The unified active context ensures only one item can be active at a time:

```typescript
interface ActiveContext {
  type: 'space' | 'collection' | 'smart-collection'
  id: string
  spaceId: string
  collectionId?: string
}
```

### Drag & Drop

Items can be dragged between regular collections and spaces, but NOT into smart collections:

```typescript
// Regular collection - accepts drops
<DroppableCollection id={collection.id} acceptsType="both">

// Smart collection - read-only view
<div className="non-droppable">
```

## Usage Examples

### Setting Active Context
```typescript
const { setActiveContext } = useUIStore()

setActiveContext({
  type: 'collection',
  id: 'collection-123',
  spaceId: 'space-456'
})
```

### Expanding Smart Collections
```typescript
const { toggleSmartCollection } = useUIStore()
const { fetchSmartCollectionContent } = useContentStore()

// Toggle expansion
toggleSmartCollection('smart-collection-id')

// Fetch filtered content
await fetchSmartCollectionContent(smartCollection)
```

## Performance Considerations

1. **Virtualization**: Not currently implemented but ready for react-window if needed
2. **Memoization**: Heavy use of React.memo and useMemo for expensive computations
3. **Debouncing**: Search input debounced to 300ms
4. **Lazy Loading**: Smart collection items only fetched when expanded

## Accessibility

- Full keyboard navigation support
- ARIA labels for all interactive elements
- Focus management during drag operations
- Screen reader announcements for state changes

## Future Enhancements

1. Bulk operations (select multiple items)
2. Keyboard shortcuts for common actions
3. Undo/redo for destructive actions
4. Advanced filtering UI for smart collections
```

### Task 6: User Guide (1 hour)
**File**: `docs/user-guide/sidebar-navigation.md`

```markdown
# Sidebar Navigation Guide

## Understanding the Hierarchy

```
📦 Spaces (top level)
  📁 Collections (organize within spaces)
    📄 Notes & 💬 Chats (your content)
  🔍 Smart Collections (automatic filters)
```

## Active Context

The sidebar shows where new items will be saved with a blue accent border:

- Click a **Space** → New items save to that space
- Click a **Collection** → New items save to that collection
- Click a **Smart Collection** → New items save to the parent space

## Smart Collections

Smart collections are automatic filters that update in real-time:

- **All Items**: Everything in the space
- **Recent**: Items modified in the last 7 days
- **Starred**: Your starred items
- **Uncategorized**: Items not in any collection

### Expanding Smart Collections
1. Click the collection name to make it active
2. Click again (or the chevron) to expand/collapse
3. Items shown are read-only views - you can open but not move them

## Drag & Drop

### What You Can Do:
- ✅ Drag items between regular collections
- ✅ Drag items to different spaces
- ✅ Drag items out of smart collections

### What You Can't Do:
- ❌ Drop items into smart collections (they're filters!)
- ❌ Reorder smart collections
- ❌ Move system spaces

## Hover Actions

Hover over any item to see available actions:

### Spaces
- Rename
- Change emoji
- Delete (moves all items to Inbox)

### Collections
- Rename
- Change icon
- Move to different space
- Delete (moves items to space root)

### Items
- Open
- Rename
- Star/Unstar
- Move to collection
- Delete

## Keyboard Shortcuts

- `Tab` - Navigate through sidebar
- `Enter` - Expand/collapse or open item
- `Space` - Toggle selection
- `Delete` - Delete selected item (with confirmation)

## Tips

1. **Organize by Project**: Create a space for each major project
2. **Use Smart Collections**: Let Recent and Starred collections surface important items
3. **Star Important Items**: They'll appear in the Starred collection across all spaces
4. **Clean Inbox Regularly**: Move items from Inbox to proper spaces/collections
```

## Acceptance Criteria

- [ ] All unit tests passing (>90% coverage)
- [ ] Integration tests cover main user flows
- [ ] E2E tests pass in CI/CD pipeline
- [ ] Performance benchmarks met (<100ms render)
- [ ] Documentation complete and accurate
- [ ] User guide published
- [ ] No console errors or warnings
- [ ] Accessibility audit passes

## Notes

- Consider adding visual regression tests with Percy
- May want to add analytics for feature usage
- Monitor performance metrics in production
- Gather user feedback for future improvements 