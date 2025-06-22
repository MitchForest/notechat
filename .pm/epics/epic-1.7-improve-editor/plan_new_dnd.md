# Notion-Style Block Editor DnD Implementation Plan

## Overview

This plan outlines the step-by-step implementation to fix the current drag-and-drop issues in our block editor. The implementation will follow the architecture outlined in `fix-dnd.md` while preserving all existing editor functionality (placeholders, slash commands, etc.).

## Current Issues

1. **Container Reference Problem**: BlockUi extension receives wrong container reference
2. **Missing Editor Wrapper**: The `.editor-wrapper` class is not applied
3. **No Invisible Hover Targets**: Current hover detection is unreliable
4. **Portal-based Positioning**: Handles use absolute positioning instead of proper layout
5. **Missing Block Structure**: No BlockWrapper component to organize blocks

## Implementation Phases

### Phase 1: Foundation Fixes (Day 1)

#### 1.1 Fix Container References
- **File**: `features/editor/components/editor.tsx`
- **Changes**:
  - Add `editor-wrapper` class to the container div
  - Pass the correct container reference to EditorService
  - Ensure container is available before initializing extensions

#### 1.2 Update EditorService
- **File**: `features/editor/services/EditorService.ts`
- **Changes**:
  - Modify constructor to wait for container
  - Add container validation
  - Pass container properly to extensions

#### 1.3 Create Debug Utilities
- **File**: `features/editor/utils/block-debug.ts`
- **Features**:
  - Visual hover zone debugging
  - Block structure logging
  - Drag state monitoring
  - Performance metrics

### Phase 2: Block Wrapper System (Day 2)

#### 2.1 Create BlockWrapper Component
- **File**: `features/editor/components/block-wrapper.tsx`
- **Features**:
  - Wraps each block with consistent structure
  - Manages hover state
  - Provides invisible hover target
  - Handles drag state

#### 2.2 Implement Invisible Hover Targets
- **Strategy**:
  - Full-width hover detection
  - Extends beyond content area
  - Proper z-index management
  - Debug visualization option

#### 2.3 Update Block Handle Component
- **File**: `features/editor/components/block-handle.tsx`
- **Changes**:
  - Remove portal-based positioning
  - Use relative positioning within BlockWrapper
  - Simplify hover logic
  - Keep all existing functionality (menu, actions)

### Phase 3: Drag and Drop Implementation (Day 3)

#### 3.1 Create Drag Manager Hook
- **File**: `features/editor/hooks/use-drag-and-drop.ts`
- **Features**:
  - Centralized drag state management
  - Custom drag preview
  - Drop zone indicators
  - Cleanup utilities

#### 3.2 Update Block UI Plugin
- **File**: `features/editor/extensions/block-ui-plugin.tsx`
- **Changes**:
  - Integrate with BlockWrapper system
  - Remove portal-based approach
  - Use new drag manager
  - Maintain all existing drag logic

#### 3.3 Implement Visual Feedback
- **Features**:
  - Ghost preview that follows cursor
  - Drop zone indicators
  - Dragging block opacity
  - Smooth transitions

### Phase 4: Polish and Enhancement (Day 4)

#### 4.1 Auto-scroll Implementation
- **Features**:
  - Detect when dragging near viewport edges
  - Smooth scrolling during drag
  - Configurable thresholds
  - Performance optimized

#### 4.2 Performance Optimization
- **Tasks**:
  - Throttle mouse events to 60fps
  - Use requestAnimationFrame
  - Minimize DOM queries
  - Profile and optimize

#### 4.3 Edge Case Handling
- **Scenarios**:
  - Empty blocks
  - Very long content
  - Nested structures
  - Rapid interactions

## CSS Architecture

### New CSS Structure
```
features/editor/styles/
├── editor.css (existing, minimal changes)
├── block-system.css (new)
└── drag-drop.css (new)
```

### CSS Variables
```css
:root {
  /* Block spacing */
  --block-spacing: 0.25rem; /* 4px */
  
  /* Handle positioning */
  --handle-offset: 2.5rem; /* 40px */
  --handle-size: 1.5rem; /* 24px */
  
  /* Drop zones */
  --drop-zone-height: 1.75rem;
  --drop-zone-color: rgba(59, 130, 246, 0.08);
}
```

## Integration Strategy

### Step 1: Parallel Development
- Create new components alongside existing ones
- Use feature flag to toggle between implementations
- Ensure no breaking changes

### Step 2: Gradual Migration
- Test new components in isolation
- Replace one system at a time
- Maintain backward compatibility

### Step 3: Cleanup
- Remove old portal-based system
- Consolidate CSS
- Update documentation

## Testing Plan

### Unit Tests
- BlockWrapper component behavior
- Drag state management
- Position calculations
- Event handling

### Integration Tests
- Full drag and drop flow
- Multiple block types
- Edge cases
- Performance benchmarks

### Manual Testing Checklist
- [ ] Hover detection works across full width
- [ ] Handles appear/disappear smoothly
- [ ] Drag preview follows cursor
- [ ] Drop zones appear correctly
- [ ] Blocks reorder properly
- [ ] No visual glitches
- [ ] Performance is smooth
- [ ] All existing features still work

## Success Criteria

1. **Reliability**: Hover detection works 100% of the time
2. **Performance**: Maintains 60fps during all interactions
3. **Compatibility**: All existing features continue to work
4. **UX**: Feels as smooth as Notion's implementation
5. **Code Quality**: Clean, maintainable, well-documented

## Risk Mitigation

### Potential Risks
1. **Breaking Existing Features**: Mitigated by careful testing and feature flags
2. **Performance Regression**: Mitigated by profiling and optimization
3. **Browser Compatibility**: Test across all supported browsers
4. **Complex Edge Cases**: Comprehensive testing and debug tools

### Rollback Plan
- Keep old implementation available
- Feature flag for quick switching
- Version control for easy reversion

## Implementation Order

1. **Debug Utilities First**: Essential for development
2. **Foundation Fixes**: Required for everything else
3. **Block Wrapper System**: Core architecture
4. **Drag Implementation**: Main functionality
5. **Polish**: Performance and UX refinement

## Notes

- **DO NOT** modify placeholder functionality
- **DO NOT** change slash command behavior
- **DO NOT** alter existing editor features
- **FOCUS ONLY** on drag-and-drop and block handle system

## Next Steps

1. Review this plan
2. Set up debug utilities
3. Begin Phase 1 implementation
4. Daily progress updates

---

*This plan is based on the comprehensive guide in `fix-dnd.md` but adapted to our specific codebase and constraints.* 