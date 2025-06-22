# Phase 3: UI Components & Consistency Update

## Overview
Phase 3 will focus on creating a more consistent and refined UI/UX experience across NoteChat, with special attention to hover states, interactive elements, and maintaining visual hierarchy without overusing the primary color.

## Design Principles

### Color Usage Guidelines
1. **Primary (Teal #0D7377)**: Reserved for primary actions and active states only
   - Primary buttons (New Chat, New Note)
   - Active navigation items
   - Focus rings
   - NOT for general hover states

2. **Hover States**: Subtle, context-appropriate
   - Light mode: `bg-gray-100` or `bg-gray-50` (neutral grays)
   - Dark mode: `bg-gray-800` or `bg-gray-900`
   - 10-20% opacity overlays for interactive elements

3. **Interactive Feedback**
   - Consistent 200ms transitions
   - Subtle scale transforms (1.02) for clickable items
   - Clear focus states for accessibility

## Updated Task Breakdown

### Task 3.0: Create Design System Constants (NEW)
**Purpose**: Establish consistent design tokens before implementing components

**Files to create:**
- `lib/design-system/colors.ts` - Color constants and utilities
- `lib/design-system/animations.ts` - Transition and animation presets
- `lib/design-system/patterns.ts` - Common UI patterns

**Implementation:**
```typescript
// colors.ts
export const hoverColors = {
  light: {
    subtle: 'hover:bg-gray-50',
    medium: 'hover:bg-gray-100',
    strong: 'hover:bg-gray-200'
  },
  dark: {
    subtle: 'dark:hover:bg-gray-900',
    medium: 'dark:hover:bg-gray-800',
    strong: 'dark:hover:bg-gray-700'
  }
}
```

### Task 3.1: Update Core UI Components
**Purpose**: Ensure all base components follow consistent patterns

**Files to modify:**
1. `components/ui/tooltip.tsx`
   - Change from `bg-primary` to `bg-gray-900 dark:bg-gray-100`
   - Update text color accordingly
   - Add subtle shadow

2. `components/ui/dropdown-menu.tsx`
   - Replace `focus:bg-accent` with neutral hover states
   - Add hover transition animations
   - Implement consistent spacing

3. `components/ui/button.tsx`
   - Update ghost variant hover to use neutral colors
   - Keep primary variant as-is (it should use primary color)
   - Add consistent focus rings

4. `components/ui/sidebar.tsx`
   - Update `SidebarMenuButton` hover states
   - Remove primary color from non-active items

5. `components/ui/select.tsx`
   - Update option hover states to neutral colors

### Task 3.2: Create Emoji Picker Component
**Files to create:**
- `features/organization/components/emoji-picker.tsx`

**Features:**
- Popover-based picker using existing `Popover` component
- Grid layout with categories
- Search functionality
- Recent emojis section
- Keyboard navigation
- Neutral hover states (not primary)

**Design:**
```typescript
interface EmojiPickerProps {
  value?: string
  onSelect: (emoji: string) => void
  trigger?: React.ReactNode
}
```

### Task 3.3: Rebuild Sidebar Navigation
**Files to modify:**
- `components/layout/sidebar-nav.tsx`

**Major changes:**
1. **Remove primary color from hover states**
   - Use `hover:bg-gray-100 dark:hover:bg-gray-800`
   - Active items keep primary background

2. **Implement new hierarchy structure**
   - Permanent spaces (Notes, Chats)
   - User spaces with emoji support
   - Proper collection nesting

3. **Add drag & drop integration**
   - Import and use `useDragDrop` hook
   - Make items draggable
   - Make collections drop targets

4. **Consistent spacing and sizing**
   - 8px vertical spacing between sections
   - 4px between items
   - Consistent padding (12px horizontal)

5. **Interactive states**
   ```css
   /* Hover */
   .sidebar-item:hover {
     background: rgb(243 244 246); /* gray-100 */
     transform: translateX(2px);
     transition: all 200ms ease;
   }
   
   /* Active */
   .sidebar-item.active {
     background: var(--primary);
     color: white;
   }
   ```

### Task 3.4: Create Context Menu Component
**Files to create:**
- `features/organization/components/item-context-menu.tsx`
- `features/organization/components/space-context-menu.tsx`
- `features/organization/components/collection-context-menu.tsx`

**Features:**
- Right-click menus using `@radix-ui/react-context-menu`
- Different options based on item type
- Consistent styling with dropdown menus
- Keyboard shortcuts display
- Icons for each action

**Actions by type:**
- **Items**: Star/Unstar, Rename, Move to, Delete
- **Collections**: Rename, Delete (with item count warning)
- **Spaces**: Rename, Change emoji, Delete (with confirmation)

### Task 3.5: Update Global Styles
**Files to modify:**
- `app/globals.css`

**Changes:**
1. Add new CSS variables for hover states
2. Create utility classes for consistent hovers
3. Update component layer styles

```css
:root {
  /* Neutral hover colors */
  --hover-light: oklch(0.97 0 0); /* gray-50 */
  --hover-medium: oklch(0.96 0 0); /* gray-100 */
  --hover-strong: oklch(0.93 0 0); /* gray-200 */
}

.dark {
  --hover-light: oklch(0.15 0 0); /* gray-900 */
  --hover-medium: oklch(0.20 0 0); /* gray-800 */
  --hover-strong: oklch(0.25 0 0); /* gray-700 */
}

/* Utility classes */
.interactive-item {
  @apply transition-all duration-200 rounded-md;
  @apply hover:bg-[--hover-medium];
}
```

### Task 3.6: Create Loading States Component
**Files to create:**
- `features/organization/components/sidebar-skeleton.tsx`
- `features/organization/components/item-skeleton.tsx`

**Purpose**: Consistent loading states across the app

### Task 3.7: Add Animations
**Implementation approach:**
- Use Framer Motion for complex animations
- CSS transitions for simple hover/active states
- Consistent timing functions (ease-out)
- Respect prefers-reduced-motion

**Key animations:**
1. Sidebar expand/collapse
2. Drag & drop preview
3. Context menu appearance
4. Search results highlight
5. Star toggle animation

## Implementation Order

1. **Start with design system** (Task 3.0) - Creates foundation
2. **Update core components** (Task 3.1) - Fixes immediate issues
3. **Create context menus** (Task 3.4) - Needed for sidebar
4. **Rebuild sidebar** (Task 3.3) - Main UI update
5. **Add emoji picker** (Task 3.2) - Enhancement
6. **Update global styles** (Task 3.5) - Refinement
7. **Add loading states** (Task 3.6) - Polish
8. **Add animations** (Task 3.7) - Final polish

## Testing Checklist

- [ ] All hover states use neutral colors (not primary)
- [ ] Consistent spacing throughout sidebar
- [ ] Tooltips are readable in both themes
- [ ] Dropdown menus have subtle hover effects
- [ ] Focus states are clearly visible
- [ ] Animations respect reduced motion preference
- [ ] Context menus work with keyboard navigation
- [ ] Drag & drop has clear visual feedback
- [ ] Loading states match design language

## Success Metrics

1. **Visual Consistency**: No jarring color changes on hover
2. **Performance**: Smooth 60fps animations
3. **Accessibility**: All interactive elements keyboard accessible
4. **User Feedback**: Clear but not distracting
5. **Theme Support**: Looks great in both light and dark modes

## Design References

- **Hover states**: Linear, Notion (subtle grays)
- **Context menus**: VS Code (clean, functional)
- **Animations**: Framer (smooth, purposeful)
- **Loading**: Vercel (skeleton screens)

## Notes

- Primary color should feel special and intentional
- Every interaction should feel smooth and responsive
- Consistency > Creativity for utility components
- Test everything in both themes before completing 