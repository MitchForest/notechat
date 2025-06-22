# Technical Architecture: Chat UI/UX Redesign

## Overview
This document outlines the technical architecture and implementation patterns for the chat redesign epic.

## Core Principles
1. **Minimal Changes** - Reuse existing infrastructure where possible
2. **Performance First** - Maintain smooth scrolling and fast interactions
3. **Progressive Enhancement** - Core features work everywhere, enhance for modern browsers
4. **Type Safety** - Full TypeScript coverage with proper types

## Component Architecture

### Layout Structure
```
ChatInterface
├── ChatHeader (existing)
├── NoteContextPills (new)
│   └── NotePill (new)
├── ChatDropZone (new)
├── MessageContainer (modified)
│   ├── VirtualMessageList (existing)
│   │   └── ChatMessage (modified)
│   │       ├── Avatar (new)
│   │       ├── MessageContent
│   │       └── MessageActions (modified)
│   └── SelectionMenu (new)
├── NotePreviewCard (new)
└── ChatInput (modified)
```

### State Management

**1. Note Context Store (Extended)**
```typescript
interface NoteContextStore {
  // Multi-note support
  contextNotes: Map<string, {
    id: string
    title: string
    content?: string
    addedAt: Date
  }>
  
  // Actions
  addNote: (note: Note) => void
  removeNote: (noteId: string) => void
  clearAllNotes: () => void
  
  // AI Integration
  getContextForAI: () => string
  highlightNote: (noteId: string) => void
  
  // UI State
  isDropZoneActive: boolean
  highlightedNoteId: string | null
}
```

**2. Selection Store (New)**
```typescript
interface SelectionStore {
  // Selection state
  selectedText: string
  selectionRange: Range | null
  menuPosition: { x: number; y: number } | null
  
  // Actions
  setSelection: (text: string, range: Range) => void
  clearSelection: () => void
  showMenu: (position: { x: number; y: number }) => void
  hideMenu: () => void
}
```

### API Integration

**1. Enhanced Chat Endpoint**
```typescript
// POST /api/chat
interface ChatRequest {
  messages: Message[]
  noteContext?: {
    notes: Array<{
      id: string
      content: string // First 2000 chars
    }>
  }
}
```

**2. Note Creation from Chat**
```typescript
// POST /api/notes/from-chat
interface CreateNoteFromChatRequest {
  title: string
  content: string
  sourceMessageIds?: string[]
  collectionId?: string
}
```

## CSS Architecture

### Design Tokens Usage
```css
/* Use existing tokens from globals.css */
.chat-message-user {
  background: var(--secondary);
  color: var(--secondary-foreground);
}

.chat-message-ai {
  border: 1px solid var(--border);
  background: transparent;
}

.send-button-active {
  background: var(--primary);
  color: var(--primary-foreground);
}
```

### New CSS Modules
```
features/chat/styles/
├── chat-layout.css      (container, spacing)
├── chat-messages.css    (message styles)
├── chat-selection.css   (selection highlights)
└── chat-context.css     (pills, drop zones)
```

## Performance Considerations

### 1. Virtual Scrolling
- Keep existing virtual scrolling for messages
- Ensure selection works with virtualization
- Lazy load message content if needed

### 2. Context Management
- Limit context to 10 notes maximum
- Truncate note content to 2000 chars
- Cache processed context strings

### 3. Selection Performance
- Debounce selection events (100ms)
- Use CSS for selection highlighting
- Optimize menu positioning calculations

## Mobile Adaptations

### Touch Interactions
```typescript
// Long press for selection
const LONG_PRESS_DURATION = 500

// Touch-friendly menu
const MOBILE_MENU_OFFSET = 20

// Swipe to remove context pills
const SWIPE_THRESHOLD = 100
```

### Responsive Breakpoints
```css
/* Mobile: < 640px */
@media (max-width: 640px) {
  .chat-container {
    padding: 1rem;
  }
  
  .message {
    max-width: 90%;
  }
}
```

## Error Handling

### Chat Creation Fix
```typescript
// Fix the current error
try {
  const createdChat = await createChat(title, collectionId, chatId)
  if (!createdChat) {
    throw new Error('Failed to create chat')
  }
  // Continue...
} catch (error) {
  console.error('Chat creation failed:', error)
  toast.error('Failed to create chat. Please try again.')
  // Don't proceed with message sending
}
```

### Context Errors
- Handle notes that fail to load
- Gracefully degrade if context too large
- Show user-friendly error messages

## Testing Strategy

### Unit Tests
- Selection utilities
- Context management
- Message formatting

### Integration Tests
- Note creation flow
- Context synchronization
- API interactions

### E2E Tests
- Full chat flow
- Selection to note creation
- Multi-note context

## Migration Plan

### Phase 1: Non-Breaking Changes
1. Add new CSS without removing old
2. Create new components alongside existing
3. Add feature flags for new features

### Phase 2: Gradual Rollout
1. Update message components
2. Add selection system
3. Implement context pills

### Phase 3: Cleanup
1. Remove old styles
2. Delete unused components
3. Update documentation

## Security Considerations

- Sanitize HTML in note previews
- Validate note IDs before adding to context
- Rate limit note creation from chat
- Ensure proper user authorization

## Accessibility

### Keyboard Navigation
- Tab through messages
- Enter to open selection menu
- Escape to close menus
- Arrow keys for menu navigation

### Screen Readers
- Proper ARIA labels
- Announce context changes
- Describe visual indicators

### Color Contrast
- Ensure WCAG AA compliance
- Test in both light/dark modes
- Provide non-color indicators

## Future Considerations

### Potential Enhancements
- Voice message support
- File attachments
- Collaborative chat
- Chat templates
- Export conversations

### Performance Optimizations
- Web Workers for heavy processing
- IndexedDB for offline support
- Service Worker caching
- WebSocket for real-time updates 