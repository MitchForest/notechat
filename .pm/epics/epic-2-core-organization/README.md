# Epic 2: Core Organization 🗂️

## Overview
**Goal**: Build a flexible, intuitive organization system that helps users manage their knowledge effortlessly  
**Duration**: 2 sprints (1 week)  
**Prerequisites**: Epic 0 (UI Foundation) and Epic 1 (Writing Foundation) completed  
**Outcome**: Users can organize notes into spaces and collections with powerful search and drag-and-drop management

## Success Criteria
- **Organization Speed**: <100ms to create/move notes between collections
- **Search Performance**: <50ms for search results on 10,000+ notes
- **Drag & Drop**: Smooth 60fps drag operations with visual feedback
- **Data Integrity**: Zero data loss during organization operations
- **Scalability**: Support 50+ spaces, 500+ collections, 10,000+ notes
- **User Success**: 90%+ can organize notes without documentation

## Context & Motivation

Knowledge management fails when organization becomes a burden. Users need a system that:
- **Adapts to their mental models** - Work, School, Personal, or custom spaces
- **Reduces friction** - Drag and drop, not complex dialogs
- **Scales with their knowledge** - From 10 notes to 10,000
- **Helps them find anything** - Instant fuzzy search across everything

This epic delivers the organizational foundation that makes AI Notes a trusted second brain.

## Sprints

### **[Sprint 2.1: Spaces & Collections](./sprints/sprint-2.1.md)** (3 days)
Building the hierarchical organization system:

- **Spaces Implementation**
  - Default spaces: All Notes, Work, School, Personal
  - Custom space creation with emoji icons
  - Space switching (Cmd+1-9 shortcuts)
  - Active space persistence

- **Collections System**
  - Default collections per space (Recent, Favorites)
  - Manual collection creation
  - Smart collection rules engine
  - Drag & drop between collections

- **Note Management**
  - Create notes within spaces
  - Multi-collection membership
  - Bulk operations (select all, move, delete)
  - Star/unstar functionality

- **State Management**
  - Zustand store with persistence
  - Optimistic updates for instant feedback
  - Conflict resolution for concurrent edits
  - Undo/redo for organization actions

### **[Sprint 2.2: Search & Navigation](./sprints/sprint-2.2.md)** (4 days)
Creating powerful discovery and navigation:

- **Universal Search Implementation**
  - Fuse.js integration for fuzzy matching
  - Search index with automatic updates
  - Multi-field search (title, content, tags)
  - Search result previews with highlights

- **Search Filters & Refinement**
  - Filter by space, collection, date range
  - Tag-based filtering
  - Search history and suggestions
  - Saved searches

- **Quick Navigation**
  - Recent items tracking
  - Breadcrumb navigation
  - Quick switcher (Cmd+K enhancement)
  - Collection jump menu

- **Performance Optimization**
  - Incremental search indexing
  - Search result caching
  - Virtual scrolling for large result sets
  - Background index updates

## Technical Architecture

### Data Models

```typescript
interface Space {
  id: string
  name: string
  icon: string
  order: number
  isDefault: boolean
  collections: Collection[]
  createdAt: Date
  updatedAt: Date
}

interface Collection {
  id: string
  spaceId: string
  name: string
  type: "manual" | "smart" | "default"
  icon?: string
  color?: string
  rules?: SmartRule[]
  noteIds: string[]
  order: number
  createdAt: Date
  updatedAt: Date
}

interface SmartRule {
  id: string
  field: "title" | "content" | "tags" | "created" | "modified"
  operator: "contains" | "equals" | "startsWith" | "after" | "before"
  value: string | Date
  caseSensitive?: boolean
}

interface Note {
  id: string
  title: string
  content: string
  spaceId: string
  collectionIds: string[]
  tags: string[]
  starred: boolean
  createdAt: Date
  updatedAt: Date
  lastAccessedAt: Date
}
```

### State Management Architecture

```typescript
// Zustand store structure
interface OrganizationStore {
  // Spaces
  spaces: Space[]
  activeSpaceId: string
  
  // Collections
  getCollectionsBySpace: (spaceId: string) => Collection[]
  getCollectionById: (id: string) => Collection | undefined
  
  // Notes
  notes: Note[]
  getNotesByCollection: (collectionId: string) => Note[]
  getNotesBySpace: (spaceId: string) => Note[]
  
  // Actions
  createSpace: (name: string, icon: string) => void
  updateSpace: (id: string, updates: Partial<Space>) => void
  deleteSpace: (id: string) => void
  
  createCollection: (spaceId: string, collection: Omit<Collection, "id">) => void
  updateCollection: (id: string, updates: Partial<Collection>) => void
  deleteCollection: (id: string) => void
  
  moveNote: (noteId: string, targetCollectionId: string) => void
  moveNotes: (noteIds: string[], targetCollectionId: string) => void
  
  // Drag & Drop
  reorderSpaces: (sourceIndex: number, destIndex: number) => void
  reorderCollections: (spaceId: string, sourceIndex: number, destIndex: number) => void
  
  // Search
  searchNotes: (query: string, filters?: SearchFilters) => Note[]
  updateSearchIndex: (noteId: string) => void
}
```

### Search Architecture

```typescript
// Fuse.js configuration
const fuseOptions = {
  keys: [
    { name: "title", weight: 0.4 },
    { name: "content", weight: 0.3 },
    { name: "tags", weight: 0.2 },
    { name: "space.name", weight: 0.1 },
  ],
  threshold: 0.3,
  includeScore: true,
  includeMatches: true,
  ignoreLocation: true,
  minMatchCharLength: 2,
}

// Search index management
class SearchIndexManager {
  private fuse: Fuse<Note>
  private updateQueue: Set<string>
  private updateDebounced: () => void
  
  constructor() {
    this.updateDebounced = debounce(this.processUpdateQueue, 1000)
  }
  
  // Incremental updates for performance
  updateNote(noteId: string) {
    this.updateQueue.add(noteId)
    this.updateDebounced()
  }
  
  private processUpdateQueue() {
    // Batch update search index
  }
}
```

## UI/UX Considerations

### Drag & Drop Experience
- Visual drop zones with hover states
- Drag preview showing note count
- Multi-select with Cmd/Ctrl+Click
- Undo notification after drops
- Smooth spring animations

### Empty States
- Helpful prompts for new users
- Quick action buttons
- Illustration or icon
- Example: "Create your first collection to organize notes"

### Search Experience
- Instant results as you type
- Clear highlighting of matches
- Keyboard navigation (arrow keys)
- Recent searches on focus
- "No results" suggestions

### Mobile Considerations
- Touch-friendly tap targets (44px minimum)
- Swipe gestures for common actions
- Bottom sheet for space/collection selection
- Simplified drag & drop (long press)

## Performance Optimizations

### 1. **Virtual Scrolling**
```typescript
// Use react-window for large lists
<FixedSizeList
  height={600}
  itemCount={notes.length}
  itemSize={80}
  width="100%"
>
  {NoteRow}
</FixedSizeList>
```

### 2. **Optimistic Updates**
```typescript
// Update UI immediately, sync in background
const moveNote = async (noteId: string, collectionId: string) => {
  // Optimistic update
  updateUIImmediately(noteId, collectionId)
  
  try {
    await api.moveNote(noteId, collectionId)
  } catch (error) {
    // Rollback on failure
    rollbackUI(noteId, previousCollectionId)
    showError("Failed to move note")
  }
}
```

### 3. **Search Debouncing**
```typescript
const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    searchIndex.search(query)
  }, 300),
  []
)
```

### 4. **Lazy Loading**
- Load space contents only when accessed
- Paginate large collections (50 items per page)
- Load search index progressively

## Error Handling & Edge Cases

### Data Integrity
- Prevent circular references in collections
- Handle deletion of spaces with notes
- Validate smart rules before saving
- Maintain referential integrity

### Conflict Resolution
- Last-write-wins for concurrent edits
- Offline queue for organization changes
- Sync status indicators
- Manual conflict resolution UI

### Edge Cases
- Moving last note from collection
- Deleting default spaces (prevented)
- Circular drag & drop (prevented)
- Search with special characters
- Very long space/collection names

## Accessibility Requirements

- **Keyboard Navigation**: Full functionality without mouse
- **Screen Reader Support**: Proper ARIA labels and live regions
- **Focus Management**: Clear focus indicators and logical tab order
- **Color Contrast**: WCAG AA compliance for all text
- **Motion Preferences**: Respect prefers-reduced-motion

## Testing Strategy

### Unit Tests
- State management actions
- Search index operations
- Smart rule evaluation
- Drag & drop calculations

### Integration Tests
- Space/collection CRUD operations
- Note organization workflows
- Search with filters
- Data persistence

### E2E Tests
- Create space → Create collection → Add notes
- Search across multiple spaces
- Drag & drop between collections
- Bulk operations

### Performance Tests
- Search with 10,000+ notes
- Drag & drop with 100+ items
- Space switching speed
- Index update performance

## Migration & Backwards Compatibility

For future updates:
- Version organization schema
- Provide migration scripts
- Maintain backwards compatibility for 2 versions
- Clear upgrade notifications

## Analytics & Monitoring

Track key metrics:
- Average collections per user
- Search queries per session
- Drag & drop usage frequency
- Most used smart rule types
- Time to first organization action

## Success Metrics

### Performance Metrics
- Search results: <50ms for 10k notes ✓
- Drag & drop: 60fps maintained ✓
- Space switching: <100ms ✓
- Collection updates: <100ms ✓

### User Metrics
- 80% use collections within first week
- 90% successful searches on first try
- <5% error rate on drag operations
- 95% can organize without help

### Technical Metrics
- 0% data loss during operations
- <1% sync conflicts
- 99.9% search accuracy
- <100MB memory for 10k notes

## Future Enhancements

After this epic, we'll be ready for:
- AI-powered smart collections (Epic 5)
- Advanced filtering and views
- Collaborative spaces
- Public/private collections
- Import from other tools

## Dependencies

### Technical Dependencies
- `fuse.js`: Fuzzy search
- `@dnd-kit/sortable`: Drag & drop
- `zustand`: State management
- `react-window`: Virtual scrolling

### Epic Dependencies
- Epic 0: UI components and layout
- Epic 1: Note creation and editing

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|---------|------------|
| Search performance degradation | High | Implement progressive indexing |
| Complex state management | Medium | Use Zustand with clear patterns |
| Drag & drop browser compatibility | Medium | Thoroughly test, provide fallbacks |
| Data loss during organization | High | Implement undo/redo system |

## Conclusion

This epic transforms AI Notes from a simple editor into a powerful knowledge management system. By focusing on intuitive organization and lightning-fast search, we're building the foundation that will make users trust AI Notes with their most important information.

The combination of flexible spaces, smart collections, and powerful search ensures that users can organize their knowledge in ways that match their mental models, not ours.