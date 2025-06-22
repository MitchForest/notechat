# UI Consistency Update Tracker

## Overview
This document tracks all UI component updates made for consistency in Phase 3.

## Component Update Status

### Core UI Components (`components/ui/`)

| Component | File | Status | Changes |
|-----------|------|--------|---------|
| Tooltip | `tooltip.tsx` | ✅ Complete | Changed bg-primary to tooltip-content class |
| Dropdown Menu | `dropdown-menu.tsx` | ✅ Complete | Replaced focus:bg-accent with menu-item class |
| Button | `button.tsx` | ✅ Complete | Updated ghost variant to use hover:bg-hover-2 |
| Sidebar | `sidebar.tsx` | ✅ Complete | Updated all hover states to use hover:bg-hover-2 |
| Select | `select.tsx` | ✅ Complete | Updated option to use menu-item class |
| Badge | `badge.tsx` | ✅ Complete | Updated outline variant to use hover:bg-hover-1 |
| Toggle | `toggle.tsx` | ✅ Complete | Updated outline variant to use hover:bg-hover-1 |

### New Components (`features/organization/components/`)

| Component | File | Status | Purpose |
|-----------|------|--------|---------|
| Emoji Picker | `emoji-picker.tsx` | ⏳ Pending | Space emoji selection |
| Item Context Menu | `item-context-menu.tsx` | ⏳ Pending | Right-click menu for notes/chats |
| Space Context Menu | `space-context-menu.tsx` | ⏳ Pending | Right-click menu for spaces |
| Collection Context Menu | `collection-context-menu.tsx` | ⏳ Pending | Right-click menu for collections |
| Sidebar Skeleton | `sidebar-skeleton.tsx` | ⏳ Pending | Loading state |
| Item Skeleton | `item-skeleton.tsx` | ⏳ Pending | Loading state for items |

### Modified Components

| Component | File | Status | Changes |
|-----------|------|--------|---------|
| Sidebar Nav | `components/layout/sidebar-nav.tsx` | ✅ Complete | Complete rebuild with new structure, neutral hover states |

## Design Tokens Added to `app/globals.css`

✅ **Hover States**
- `--hover-1`: Subtle hover (gray-50/gray-900)
- `--hover-2`: Medium hover (gray-100/gray-800)
- `--hover-3`: Strong hover (gray-200/gray-700)

✅ **Utility Classes**
- `.interactive-element`: Base interactive element
- `.interactive-element-medium`: Medium emphasis
- `.interactive-element-strong`: Strong emphasis
- `.menu-item`: Dropdown/context menu items
- `.menu-item-destructive`: Destructive menu items
- `.sidebar-item`: Updated sidebar items
- `.tooltip-content`: Neutral tooltip styling

## Before/After Examples

### Tooltip
```tsx
// Before
className={cn(
  "bg-primary text-primary-foreground ...",
  className
)}

// After
className={cn(
  "tooltip-content ...",
  className
)}
```

### Dropdown Menu Item
```tsx
// Before
className={cn(
  "focus:bg-accent focus:text-accent-foreground ...",
  className
)}

// After
className={cn(
  "menu-item ...",
  className
)}
```

### Button Ghost Variant
```tsx
// Before
"hover:bg-accent hover:text-accent-foreground"

// After
"hover:bg-hover-2 hover:text-foreground"
```

## Testing Checklist

- [ ] Light mode: All hovers are subtle gray
- [ ] Dark mode: All hovers are subtle gray
- [ ] No green/teal hovers except active states
- [ ] Tooltips readable in both themes
- [ ] Focus states remain accessible
- [ ] Transitions smooth (200ms)
- [ ] No visual regressions

## Notes

- Keep primary color for: active states, primary buttons, focus rings
- Use hover-1 for: very subtle interactions
- Use hover-2 for: standard interactions (most common)
- Use hover-3 for: pressed/active states
- Always test in both themes before marking complete 