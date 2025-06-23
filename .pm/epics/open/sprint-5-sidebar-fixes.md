# Sprint 5: Critical Sidebar Fixes

**Epic:** Sidebar Navigation Improvements  
**Sprint Number:** 5  
**Status:** In Progress  
**Created:** 2024-12-30  
**Estimated Duration:** 2-3 days  

## Sprint Goal
Fix critical sidebar bugs including expansion issues, hover actions visibility, chevron alignment, and ensure active context properly determines where new notes/chats are created.

## Context
The sidebar has several critical issues discovered during investigation:
1. Smart collections ("All" filters) don't expand properly - weird indentation
2. Hover action menus are completely missing (edit, delete, etc.)
3. Chevrons are misaligned across different item types
4. Active context needs to properly determine save location for new items
5. Smart collections are just filters - items should save to the space, not the filter

## Technical Issues Identified

### 1. **Double State Update in Smart Collections**
- **File:** `features/organization/components/smart-collection-item.tsx`
- **Problem:** Click handler calls both `onClick()` and `onToggle()` causing conflicts
- **Solution:** Only call `onToggle()` in the click handler, let parent handle active state

### 2. **Hover Actions CSS Selector Mismatch**
- **File:** `app/globals.css` and component structure
- **Problem:** CSS expects `.group:hover > .hover-actions-trigger` but HTML has nested structure
- **Solution:** Fix HTML structure or update CSS to use descendant selector

### 3. **Inconsistent Chevron Sizing**
- **Problem:** Different components use different chevron sizes (h-3 vs h-4)
- **Solution:** Standardize all chevrons to h-4 w-4

### 4. **Toggle Logic Defaults**
- **File:** `features/organization/stores/ui-store.ts`
- **Problem:** `undefined` state defaults to `false` instead of `true`
- **Solution:** Change default to `true` for first click expansion

### 5. **Active State Styling Overflow**
- **File:** `app/globals.css`
- **Problem:** Active accent affects child elements when expanded
- **Solution:** Apply active state only to the header button, not container

## Implementation Plan

### Phase 1: Fix Expansion Logic (Day 1 Morning) ✅
- [x] Fix smart collection click handler to only call `onToggle()`
- [x] Update toggle functions in UI store to default to `true`
- [x] Test expansion behavior across all collection types
- [x] Ensure active context is set separately from expansion

### Phase 2: Fix Hover Actions (Day 1 Afternoon)
- [ ] Restructure HTML to match CSS selectors OR update CSS
- [ ] Move `group` class to correct container
- [ ] Test hover actions appear on all item types
- [ ] Ensure dropdown menus work correctly
- [ ] Fix z-index issues if any

### Phase 3: Visual Alignment (Day 2 Morning)
- [ ] Standardize all chevrons to h-4 w-4
- [ ] Fix margin/padding consistency
- [ ] Align hover action buttons properly
- [ ] Fix active state styling to not affect children
- [ ] Ensure consistent indentation levels

### Phase 4: Active Context & Save Logic (Day 2 Afternoon)
- [ ] Update `handleNewChat` and `handleNewNote` to respect context rules:
  - If in a smart collection → save to the parent space
  - If in a regular collection → save to that collection
  - If in a space → save to the space root
  - If no context → save to Inbox
- [ ] Add visual feedback showing where items will be saved
- [ ] Test save behavior in all contexts

### Phase 5: Testing & Polish (Day 3)
- [ ] Test all expansion/collapse behaviors
- [ ] Test hover actions on all item types
- [ ] Test drag & drop still works
- [ ] Test new item creation in all contexts
- [ ] Run full test suite (lint, typecheck, build)
- [ ] Update documentation

## Success Criteria
1. ✅ All collections (smart and regular) expand/collapse smoothly
2. ✅ Hover actions visible and functional on all items
3. ✅ Chevrons properly aligned across all item types
4. ✅ Active context correctly determines save location
5. ✅ No visual glitches or indentation issues
6. ✅ All tests passing

## Technical Details

### Smart Collection Save Behavior
```typescript
// When in a smart collection context:
if (context?.type === 'smart-collection') {
  // Items save to the parent space, NOT the collection
  spaceId = context.spaceId
  collectionId = null // Smart collections don't own items
}
```

### Hover Actions Structure Fix
```typescript
// Current (broken):
<div className="group relative">
  <div className="flex items-center">
    <button>...</button>
    <HoverActions /> // Not direct child of .group
  </div>
</div>

// Fixed:
<div className="group relative flex items-center">
  <button>...</button>
  <HoverActions /> // Direct child of .group
</div>
```

### Toggle Logic Fix
```typescript
// Current (broken):
[collectionId]: currentState === undefined ? false : !currentState

// Fixed:
[collectionId]: currentState === undefined ? true : !currentState
```

## Files to Modify
1. `features/organization/components/smart-collection-item.tsx`
2. `features/organization/stores/ui-store.ts`
3. `app/globals.css`
4. `components/layout/sidebar-nav.tsx`
5. `features/organization/components/space-section.tsx`
6. `features/organization/components/sidebar-collection-item.tsx`
7. `features/organization/components/hover-actions.tsx`

## Risks & Mitigations
- **Risk:** Breaking existing drag & drop
  - **Mitigation:** Test thoroughly after HTML structure changes
- **Risk:** CSS changes affecting other components
  - **Mitigation:** Scope CSS changes carefully
- **Risk:** State management conflicts
  - **Mitigation:** Clear separation between expansion and active state

## Notes
- Smart collections are filters, not containers
- Active context should be visual feedback + save location determinant
- Maintain backward compatibility with existing saved data
- Consider adding tooltips to show where new items will be saved

## Session Log
<!-- Update after each work session -->

### Planning Session - 2024-12-30
- Investigated all sidebar issues
- Identified root causes
- Created detailed implementation plan
- Ready to begin Phase 1

### Phase 1 Implementation - 2024-12-30
**Completed:**
- ✅ Fixed toggle logic in UI store - all three toggle functions now default to `true` when undefined
- ✅ Verified smart collection click handler already properly separated (onClick sets active, onToggle handles expansion)
- ✅ Confirmed SpaceSection follows same pattern for consistency
- ✅ All tests passing (lint, typecheck)

**Key Changes:**
- `modified: features/organization/stores/ui-store.ts` - Fixed toggle defaults
- `modified: features/organization/components/smart-collection-item.tsx` - Added clarifying comments

**Findings:**
- The click handler separation was already correct in sidebar-nav.tsx
- The main issue was the toggle default behavior
- First click now properly expands items

**Next:** Phase 2 - Fix hover actions visibility 