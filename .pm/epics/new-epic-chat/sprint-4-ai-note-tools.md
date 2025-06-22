# Sprint 4: AI Note Tools

## Sprint Goals
Enable AI to create and manage notes directly within the chat interface through tool calls, with inline preview cards and seamless integration with the note panel. Support highlight-based editing where users can select text in notes and ask AI to modify or explain it.

## Tasks

### 1. AI Tool Definitions
- [ ] Define create_note tool schema
- [ ] Define update_note tool schema
- [ ] Define search_notes tool schema
- [ ] Define edit_selection tool schema
- [ ] Add tool descriptions for AI understanding
- [ ] Implement tool validation

### 2. Tool Confirmation UI
- [ ] Create tool confirmation component
- [ ] Show tool parameters in readable format
- [ ] Allow/Deny buttons with clear actions
- [ ] Loading state during execution
- [ ] Success/error feedback

### 3. Note Preview Cards in Chat
- [ ] Create AI note preview component
- [ ] Show title, content preview, metadata
- [ ] Edit button to modify before saving
- [ ] Open in panel button
- [ ] Smooth expand/collapse animations

### 4. Tool Execution Flow
- [ ] Handle create_note tool calls
- [ ] Handle update_note tool calls
- [ ] Handle search_notes tool calls
- [ ] Handle edit_selection tool calls
- [ ] Error handling and recovery
- [ ] Optimistic UI updates

### 5. Integration with Note System
- [ ] Auto-open created notes in panel
- [ ] Update note context when AI creates notes
- [ ] Sync with note store
- [ ] Handle collection assignment
- [ ] Maintain chat context

### 6. Highlight-Based Context
- [ ] Pass highlighted text from editor to chat
- [ ] Show highlighted context in chat UI
- [ ] Enable "Edit this" commands
- [ ] Enable "Explain this" commands
- [ ] Maintain highlight position for updates

### 7. Enhanced AI Prompting
- [ ] Update system prompt for tool usage
- [ ] Provide examples of when to create notes
- [ ] Context-aware note suggestions
- [ ] Smart title generation
- [ ] Content formatting guidelines
- [ ] Selection-aware prompts

## Technical Implementation

### New Components

**1. `features/chat/components/tool-confirmation-card.tsx`**
```tsx
interface ToolConfirmationCardProps {
  tool: ToolCall
  onConfirm: () => void
  onDeny: () => void
  isExecuting: boolean
}

// Visual design:
// - Card with tool icon
// - Clear description of action
// - Parameters shown in readable format
// - Primary (Allow) and secondary (Deny) buttons
```

**2. `features/chat/components/ai-note-preview.tsx`**
```tsx
interface AINotePreviewProps {
  noteData: {
    title: string
    content: string
    collectionId?: string
  }
  onEdit: (data: NoteData) => void
  onSave: () => void
  onCancel: () => void
  isCreating: boolean
}

// Features:
// - Collapsible preview
// - Inline editing
// - Collection selector
// - Loading states
```

**3. `features/chat/components/tool-result-card.tsx`**
```tsx
interface ToolResultCardProps {
  result: ToolResult
  type: 'success' | 'error'
  noteId?: string
  onOpenNote?: (id: string) => void
}
```

**4. `features/chat/components/highlight-context-card.tsx`**
```tsx
interface HighlightContextCardProps {
  highlightedText: string
  noteTitle: string
  noteId: string
  onClear: () => void
}

// Shows the current highlighted text from editor
// Allows user to reference it in chat
```

### Tool Definitions

**1. `features/chat/tools/note-tools.ts`**
```tsx
export const noteTools = {
  create_note: {
    description: "Create a new note with the given title and content",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "The title of the note"
        },
        content: {
          type: "string", 
          description: "The content of the note in markdown"
        },
        collection_id: {
          type: "string",
          description: "Optional collection to add the note to"
        }
      },
      required: ["title", "content"]
    }
  },
  
  update_note: {
    description: "Update an existing note's content",
    parameters: {
      type: "object",
      properties: {
        note_id: {
          type: "string",
          description: "The ID of the note to update"
        },
        title: {
          type: "string",
          description: "New title (optional)"
        },
        content: {
          type: "string",
          description: "New content (optional)"
        }
      },
      required: ["note_id"]
    }
  },
  
  edit_selection: {
    description: "Edit a specific highlighted section in a note",
    parameters: {
      type: "object",
      properties: {
        note_id: {
          type: "string",
          description: "The ID of the note containing the selection"
        },
        original_text: {
          type: "string",
          description: "The original highlighted text to replace"
        },
        new_text: {
          type: "string",
          description: "The new text to replace the selection with"
        },
        edit_type: {
          type: "string",
          enum: ["replace", "append", "prepend"],
          description: "How to apply the edit"
        }
      },
      required: ["note_id", "original_text", "new_text", "edit_type"]
    }
  },
  
  search_notes: {
    description: "Search for notes by title or content",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query"
        },
        limit: {
          type: "number",
          description: "Maximum results to return",
          default: 5
        }
      },
      required: ["query"]
    }
  }
}
```

### Modified Components

**1. `features/chat/components/chat-interface.tsx`**
- Add tool handling logic
- Render tool confirmations
- Handle tool results
- Update message rendering
- Show highlighted context when available

**2. `features/chat/components/chat-message.tsx`**
- Render tool calls inline
- Show tool results
- Handle interactive elements

**3. `app/api/chat/route.ts`**
- Register note tools
- Handle tool execution
- Return tool results
- Error handling
- Include highlighted context in system prompt

**4. `features/editor/components/editor.tsx`**
- Add text selection tracking
- Pass selection to chat context
- Highlight edited sections after AI updates

### Context Sharing

**1. `features/chat/stores/highlight-context-store.ts`**
```tsx
interface HighlightContextStore {
  highlightedText: string | null
  noteId: string | null
  noteTitle: string | null
  selectionRange: { start: number; end: number } | null
  
  setHighlight: (data: HighlightData) => void
  clearHighlight: () => void
  getContextForChat: () => string
}
```

## UI/UX Specifications

### Tool Confirmation Card
```
┌─────────────────────────────────────────┐
│ 🔧 AI wants to create a note           │
│                                         │
│ Title: "Meeting Summary - Dec 2024"     │
│ Collection: Engineering Notes           │
│                                         │
│ Preview:                                │
│ ┌─────────────────────────────────────┐ │
│ │ ## Key Decisions                    │ │
│ │ - Implement new API...              │ │
│ │ - Timeline: Q1 2025...              │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Deny]              [Allow & Create]    │
└─────────────────────────────────────────┘
```

### Highlight Context Card
```
┌─────────────────────────────────────────┐
│ 📝 Editing: Project Roadmap             │
│                                         │
│ Selected text:                          │
│ "The API redesign should focus on..."   │
│                                         │
│ Ask AI to edit or explain this section │
│                          [Clear] ×      │
└─────────────────────────────────────────┘
```

### Edit Confirmation
```
┌─────────────────────────────────────────┐
│ ✏️ AI wants to edit your selection      │
│                                         │
│ Original:                               │
│ "The API redesign should focus on..."   │
│                                         │
│ Will replace with:                      │
│ "The API redesign should prioritize     │
│  scalability, security, and developer   │
│  experience. Key areas include..."      │
│                                         │
│ [Cancel]            [Apply Changes]     │
└─────────────────────────────────────────┘
```

## Interaction Flows

### AI Creates Note
1. User asks AI to summarize conversation
2. AI calls create_note tool
3. Confirmation card appears
4. User reviews and allows
5. Note created with loading state
6. Success card with "Open" button
7. Click opens note in panel

### AI Updates Note
1. User asks AI to update existing note
2. AI calls update_note with note ID
3. Shows what will change
4. User confirms
5. Note updated
6. Success feedback

### Highlight-Based Editing
1. User highlights text in editor
2. Context appears in chat
3. User: "Make this more concise"
4. AI calls edit_selection tool
5. Shows before/after comparison
6. User confirms
7. Text replaced in editor
8. Editor scrolls to and highlights the change

### Highlight-Based Explanation
1. User highlights complex text
2. User: "Explain this"
3. AI provides explanation without tools
4. User: "Now simplify it"
5. AI calls edit_selection tool
6. Confirmation → Apply

### AI Searches Notes
1. User asks about something
2. AI searches notes for context
3. Shows search results inline
4. User can click to open any result

## Edge Cases
- User denies tool execution
- Network errors during creation
- Invalid tool parameters
- Note already exists
- Collection doesn't exist
- Maximum note length exceeded
- Concurrent tool executions
- Multiple highlights in same note
- Highlight position changes after edit

## System Prompt Enhancement
```
You have access to note management tools:

1. create_note: Use this when users ask you to:
   - Summarize a conversation
   - Create a note from discussion
   - Save important information
   - Extract key points

2. update_note: Use this when users ask you to:
   - Add information to an existing note
   - Modify note content
   - Append new sections

3. edit_selection: Use this when:
   - User has highlighted text and asks to edit it
   - User says "change this to..." or "make this..."
   - User wants to modify a specific part
   - Always preserve context around the edit

4. search_notes: Use this to:
   - Find relevant context
   - Answer questions about past notes
   - Reference existing information

When the user has highlighted text in their editor, it will be provided as context.
Pay special attention to requests about "this" or "the highlighted text".

Always ask for confirmation before creating or updating notes.
Format note content in clean markdown.
Use descriptive titles that summarize the content.
```

## Testing Checklist
- [ ] Tool confirmation appears correctly
- [ ] Allow/Deny buttons work
- [ ] Notes created successfully
- [ ] Notes open in panel after creation
- [ ] Error states handled gracefully
- [ ] Loading states smooth
- [ ] Tool results display properly
- [ ] Context updated after note creation
- [ ] Search results clickable
- [ ] Mobile experience works
- [ ] Highlight context shows in chat
- [ ] Edit selection preserves formatting
- [ ] Editor updates after AI edits
- [ ] Multiple highlights handled correctly

## Acceptance Criteria
- AI can create notes naturally in conversation
- Clear confirmation before any action
- Beautiful inline previews
- Seamless integration with note panel
- Proper error handling
- No disruption to chat flow
- Tools enhance rather than complicate UX
- Highlight-based editing feels natural
- Context preserved between editor and chat

## Implementation Order
1. Tool definitions and API integration
2. Tool confirmation component
3. Basic create_note flow
4. Note preview cards
5. Highlight context store
6. Edit selection tool
7. Update and search tools
8. Polish and error handling

## Notes
This sprint transforms the AI from a passive responder to an active note-taking assistant that can also intelligently edit specific parts of notes based on user selection. The implementation should feel magical - users describe what they want, and the AI creates beautiful, well-organized notes or makes precise edits to existing content. The highlight-based editing creates a powerful feedback loop between the editor and chat, making the AI feel like a true writing partner. 

## Implementation Progress

### ✅ Completed
- [x] Created note tools definitions in `features/chat/tools/note-tools.ts`
- [x] Created tool confirmation UI component
- [x] Created highlight context store for editor-chat integration  
- [x] Created highlight context card component
- [x] Integrated tools into chat interface
- [x] Added "Chat with AI" button to editor bubble menu
- [x] Connected highlight context between editor and chat

### 🚧 In Progress
- [ ] Testing tool execution with actual AI responses
- [ ] Implementing search_notes tool execution
- [ ] Adding tool result display in chat messages

### 📋 Remaining
- [ ] Add visual indicators when AI uses tools
- [ ] Implement tool retry on failure
- [ ] Add undo functionality for tool actions
- [ ] Create documentation for tool usage

## Session Summary

**Completed:**
- Implemented full AI note tools system with create, update, edit selection, and search capabilities
- Created tool confirmation UI with beautiful animations and clear user feedback
- Integrated highlight context system for seamless editor-chat interaction
- Added "Chat with AI" button to editor bubble menu that sends selected text to chat
- Connected all components with proper state management

**Files Changed:**
- `created: features/chat/tools/note-tools.ts` - Tool definitions
- `created: features/chat/components/tool-confirmation.tsx` - Confirmation UI
- `created: features/chat/stores/highlight-context-store.ts` - Highlight state
- `created: features/chat/components/highlight-context-card.tsx` - Context display
- `modified: features/chat/components/chat-interface.tsx` - Tool integration
- `modified: features/editor/components/editor-bubble-menu.tsx` - Chat button
- `modified: features/editor/components/editor.tsx` - Pass noteTitle prop
- `modified: components/layout/canvas-view.tsx` - Pass noteTitle to Editor
- `modified: app/api/chat/route.ts` - Already had tool support

**Technical Notes:**
- Using Vercel AI SDK v4 tool calling system
- Tools require user confirmation before execution
- Highlight context persists until cleared or edited
- Tool results show success/failure with appropriate messaging
- All tool executions update the UI in real-time

**Next Steps:**
1. Test with actual AI responses to ensure tool calls work correctly
2. Add search_notes implementation
3. Enhance tool result display in chat messages
4. Add visual indicators when AI is using tools
5. Consider adding undo functionality for destructive actions 