# Sprint 4: Visual Polish & Drag/Drop

## Goal
Fix visual layout issues, improve active state styling, clarify drag/drop behavior, and ensure consistent spacing throughout the sidebar.

## Problem Statement
Current visual issues:
- Chevrons not aligned to the far right
- Weak active state indication
- Unclear drag/drop rules for smart collections
- Inconsistent spacing and alignment
- No smooth transitions

## Implementation Tasks

### Task 1: Fix Chevron Alignment (1 hour)
**Files**: All expandable components

```css
/* Current - chevron next to content */
.sidebar-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* New - chevron far right */
.sidebar-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-item-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.sidebar-item-chevron {
  margin-left: auto;
  flex-shrink: 0;
}
```

Update components:
```typescript
// space-section.tsx
<button className="flex-1 flex items-center justify-between">
  <div className="flex items-center gap-2">
    <span className="text-base">{space.emoji}</span>
    <span>{space.name}</span>
  </div>
  <ChevronIcon className="h-4 w-4 ml-2" />
</button>

// sidebar-collection-item.tsx
<button className="flex-1 flex items-center justify-between">
  <div className="flex items-center gap-2 flex-1 min-w-0">
    <Icon className="h-3 w-3 flex-shrink-0" />
    <span className="truncate">{collection.name}</span>
    {itemCount > 0 && (
      <span className="text-xs text-muted-foreground">
        ({itemCount})
      </span>
    )}
  </div>
  <ChevronIcon className="h-3 w-3 flex-shrink-0 ml-2" />
</button>
```

### Task 2: Improve Active State Styling (2 hours)
**File**: `app/globals.css`

```css
/* Active state with left accent border */
.sidebar-item-active {
  position: relative;
  background-color: hsl(var(--hover-2));
}

.sidebar-item-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: hsl(var(--primary));
  border-radius: 0 2px 2px 0;
}

/* Adjust padding to account for border */
.sidebar-item-active .sidebar-item-button {
  padding-left: calc(0.5rem - 3px);
}

/* Hover state for non-active items */
.sidebar-item:not(.sidebar-item-active) .sidebar-item-button:hover {
  background-color: hsl(var(--hover-1));
}

/* Smooth transitions */
.sidebar-item-button {
  transition: background-color 150ms ease-in-out;
}
```

### Task 3: Visual Drag/Drop Indicators (2 hours)
**File**: `features/organization/hooks/use-drag-drop.ts`

```typescript
// Add visual states for drag operations
export const useDragDrop = () => {
  // ... existing code
  
  const getDragOverStyles = (isOver: boolean, canDrop: boolean) => {
    if (!isOver) return {}
    
    if (canDrop) {
      return {
        backgroundColor: 'hsl(var(--primary) / 0.1)',
        borderColor: 'hsl(var(--primary))',
        borderStyle: 'dashed',
        borderWidth: '2px',
      }
    } else {
      return {
        backgroundColor: 'hsl(var(--destructive) / 0.1)',
        cursor: 'not-allowed',
      }
    }
  }
}
```

**File**: `features/organization/components/smart-collection-item.tsx`

```typescript
// Add tooltip for smart collections
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// Wrap the component with tooltip when being dragged over
{isDragOver && (
  <Tooltip open={true}>
    <TooltipTrigger asChild>
      <div>{/* existing content */}</div>
    </TooltipTrigger>
    <TooltipContent>
      <p>Smart collections are filters and cannot accept items</p>
    </TooltipContent>
  </Tooltip>
)}
```

### Task 4: Smooth Expand/Collapse Animations (1 hour)
**File**: Create `features/organization/components/animated-collapse.tsx`

```typescript
import { motion, AnimatePresence } from 'framer-motion'

interface AnimatedCollapseProps {
  isOpen: boolean
  children: React.ReactNode
}

export function AnimatedCollapse({ isOpen, children }: AnimatedCollapseProps) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ 
            height: { duration: 0.2, ease: 'easeInOut' },
            opacity: { duration: 0.15 }
          }}
          style={{ overflow: 'hidden' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

Use in all expandable components:
```typescript
<AnimatedCollapse isOpen={isExpanded}>
  <div className="mt-0.5 ml-5 space-y-0.5">
    {/* content */}
  </div>
</AnimatedCollapse>
```

### Task 5: Fix Spacing and Alignment (1 hour)
Create consistent spacing variables:

```css
:root {
  /* Sidebar spacing */
  --sidebar-item-height: 2rem;
  --sidebar-item-padding-x: 0.5rem;
  --sidebar-item-padding-y: 0.375rem;
  --sidebar-nested-indent: 1.25rem;
  --sidebar-icon-size: 1rem;
  --sidebar-chevron-size: 0.75rem;
  --sidebar-item-gap: 0.5rem;
}

/* Apply consistently */
.sidebar-item-button {
  height: var(--sidebar-item-height);
  padding: var(--sidebar-item-padding-y) var(--sidebar-item-padding-x);
  gap: var(--sidebar-item-gap);
}

.sidebar-nested {
  margin-left: var(--sidebar-nested-indent);
}
```

### Task 6: Add Loading Skeletons (1 hour)
**File**: `features/organization/components/sidebar-skeleton.tsx`

```typescript
export function SidebarSkeleton() {
  return (
    <div className="space-y-2 p-2">
      {/* Space skeleton */}
      <div className="space-y-1">
        <Skeleton className="h-8 w-full" />
        {/* Collections under space */}
        <div className="ml-5 space-y-1">
          <Skeleton className="h-7 w-4/5" />
          <Skeleton className="h-7 w-3/5" />
        </div>
      </div>
      
      {/* Another space */}
      <div className="space-y-1">
        <Skeleton className="h-8 w-full" />
        <div className="ml-5 space-y-1">
          <Skeleton className="h-7 w-3/4" />
        </div>
      </div>
    </div>
  )
}
```

## Acceptance Criteria

- [ ] All chevrons aligned to the far right
- [ ] Active state has left accent border and stronger background
- [ ] Smooth expand/collapse animations (200ms)
- [ ] Drag over smart collections shows "cannot drop" indicator
- [ ] Consistent spacing throughout sidebar
- [ ] Loading skeletons during data fetch
- [ ] No layout shift when toggling items
- [ ] Proper text truncation for long names

## Performance Considerations

1. Use CSS transforms for animations (GPU accelerated)
2. Debounce hover state changes
3. Memoize style calculations
4. Use `will-change` sparingly for animations

## Accessibility

1. Maintain focus states during animations
2. Respect `prefers-reduced-motion`
3. Ensure contrast ratios meet WCAG AA
4. Add proper ARIA labels for state changes

## Testing

1. Test chevron alignment with long names
2. Verify animations are smooth on low-end devices
3. Test drag/drop visual feedback
4. Verify no layout shifts
5. Test with `prefers-reduced-motion` enabled
6. Check color contrast in light/dark modes

## Notes

- Consider adding a subtle box-shadow to active items
- May want to add hover delay for better UX
- Watch for z-index issues with overlapping elements
- Consider persisting collapse states in localStorage 