# Epic 3: AI Chat Foundation 💬

## Overview
**Goal**: Build a streaming AI chat system that seamlessly integrates with notes, enabling users to have intelligent conversations and extract insights  
**Duration**: 2 sprints (1 week)  
**Prerequisites**: Epic 1 (Writing Foundation) completed - we need the editor for note extraction  
**Outcome**: Users can have AI conversations, extract valuable responses to notes, and use dedicated AI assistants for each note

## Success Criteria
- **Streaming Performance**: First token appears <1s after sending
- **Stream Quality**: Smooth token-by-token rendering without stutters
- **Context Accuracy**: AI correctly references note content in 95%+ of responses
- **Extraction Quality**: 90%+ of extracted notes have appropriate formatting
- **Reliability**: <1% error rate on API calls with graceful fallbacks
- **Chat Management**: Automatic cleanup with intuitive starring system
- **UX Polish**: Loading states, error recovery, and animations feel premium

## Context & Motivation

AI chat is the gateway to making AI Notes more than just an editor. Users need:
- **Immediate AI Access** - No context switching to ChatGPT or Claude
- **Contextual Understanding** - AI that knows what they're working on
- **Knowledge Capture** - Turn ephemeral chats into permanent knowledge
- **Dedicated Assistants** - Each note gets its own specialized AI helper

This epic delivers the conversational AI foundation that transforms AI Notes from a writing tool into an intelligent knowledge partner.

## Sprints

### Sprint 3.1: Chat Infrastructure (3 days)
Building the core streaming chat experience:

#### Day 1-2: Basic Chat Interface with AI SDK

**Dependencies Installation**
```bash
# AI SDK core packages
bun add ai @ai-sdk/openai

# Optional providers (for future flexibility)
bun add @ai-sdk/anthropic @ai-sdk/google

# Streaming utilities
bun add eventsource-parser nanoid
```

**Core Components**
- **AI SDK Integration**
  - Vercel AI SDK setup with OpenAI/Anthropic
  - Streaming response handling with `useChat` hook
  - Token usage tracking
  - Model selection (GPT-4, Claude 3)
  - Error handling and retry logic

- **Chat Interface Components**
  - Message bubbles with role indicators (user/assistant)
  - Markdown rendering with `react-markdown`
  - Syntax highlighting with `react-syntax-highlighter`
  - Code block copying and formatting
  - Loading animations (typing indicators with animated dots)
  - Error states with retry functionality

- **Chat Store (Zustand)**
  - Chat creation and persistence
  - 7-day auto-expiration with countdown
  - Star to prevent expiration
  - Active chats tracking
  - Preview generation from last message

#### Day 3: Message Components & Streaming

**Message Processing**
- Token-by-token streaming display
- Stream buffering for performance (50ms flush interval)
- Smooth auto-scroll management
- Message actions (copy, extract, regenerate)
- Hover states for action buttons
- Loading states during streaming

**API Route Implementation**
- Edge runtime for streaming support
- System prompt injection based on context
- Model fallback on errors
- Exponential backoff retry logic
- Rate limiting protection

#### Day 4: Active Chats & Sidebar Integration

**Active Chats Management**
- Active chats list in sidebar
- Real-time preview updates
- Expiration countdown display
- Star indicator for preserved chats
- Chat navigation with router
- Empty states with helpful prompts

**Sidebar Updates**
- "New Chat" button prominently placed
- Active chats section at top
- Visual indicators for current chat
- Quick access to recent conversations
- Cleanup of expired chats on schedule

### Sprint 3.2: Note Integration (4 days)

#### Day 1-2: Home Chat Implementation

**Note Home Chat Features**
- Dedicated chat per note
- Persistent conversation history
- Note content automatically included as context
- Clear chat with optional AI summary
- Resizable chat panel with `react-resizable-panels`
- Collapsible panel with floating button

**Home Chat Provider**
- Context provider for chat state
- Message storage per note
- Summary generation on clear
- Token limit management
- Context window optimization

#### Day 3-4: Chat to Note Extraction

**Extraction Service**
- AI-powered extraction using `generateObject`
- Structured output with Zod schemas
- Title and tag generation
- Content formatting with markdown
- Note type classification (insight, action, reference, idea)
- Confidence scoring

**Extraction UI**
- One-click extraction button on messages
- Preview dialog before saving
- Editable extracted content
- Tag management interface
- Direct navigation to created note
- Success/error toast notifications

## Technical Architecture

### AI Service Layer

```typescript
// Core AI service abstraction
interface AIService {
  chat: (messages: Message[], options: ChatOptions) => AsyncIterator<string>
  complete: (prompt: string, options: CompletionOptions) => Promise<string>
  generateObject: <T>(prompt: string, schema: z.Schema<T>) => Promise<T>
  embed: (text: string) => Promise<number[]>
}

interface ChatOptions {
  model: "gpt-4-turbo" | "claude-3-opus" | "gpt-3.5-turbo"
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
  stream?: boolean
  context?: {
    noteContent?: string
    noteTitle?: string
    referencedNotes?: Note[]
  }
}
```

### Chat State Management

```typescript
interface ChatStore {
  // Chat data
  chats: Map<string, Chat>
  messages: Map<string, Message[]>
  activeChats: string[] // Non-expired chat IDs
  
  // Stream state
  streamingChats: Set<string>
  streamControllers: Map<string, AbortController>
  
  // Actions
  createChat: (options?: CreateChatOptions) => Chat
  sendMessage: (chatId: string, content: string) => Promise<void>
  stopGeneration: (chatId: string) => void
  regenerateMessage: (chatId: string, messageId: string) => Promise<void>
  
  // Extraction
  extractToNote: (chatId: string, messageId: string) => Promise<Note>
  extractConversation: (chatId: string) => Promise<Note>
  
  // Home chat
  getHomeChatId: (noteId: string) => string
  clearHomeChat: (noteId: string, withSummary?: boolean) => Promise<void>
  
  // Lifecycle
  cleanupExpiredChats: () => void
  starChat: (chatId: string) => void
}
```

### Message Processing Pipeline

```typescript
class MessageProcessor {
  // Pre-processing
  async preprocessMessage(content: string, context: ChatContext): Promise<ProcessedMessage> {
    return {
      content: await this.injectContext(content, context),
      tokens: await this.countTokens(content),
      references: await this.extractReferences(content),
    }
  }
  
  // Streaming handler
  async *processStream(
    stream: AsyncIterator<string>,
    chatId: string
  ): AsyncIterator<StreamChunk> {
    let buffer = ""
    let totalTokens = 0
    
    for await (const chunk of stream) {
      buffer += chunk
      totalTokens++
      
      // Yield processed chunks
      yield {
        content: chunk,
        totalTokens,
        formattedContent: await this.formatMarkdown(buffer),
      }
      
      // Update UI optimistically
      this.updateMessageUI(chatId, buffer)
    }
    
    // Post-processing
    await this.finalizeMessage(chatId, buffer, totalTokens)
  }
}
```

### Extraction Engine

```typescript
const extractionSchema = z.object({
  title: z.string().describe("A clear, descriptive title for the note"),
  summary: z.string().describe("A brief summary of the main points"),
  content: z.string().describe("The formatted content for the note"),
  tags: z.array(z.string()).describe("Relevant tags for categorization"),
  type: z.enum(["insight", "action", "reference", "idea"]).describe("The type of note"),
  confidence: z.number().min(0).max(1).describe("Extraction confidence score"),
})

interface ExtractionEngine {
  // Single message extraction
  extractMessage(message: Message): Promise<ExtractedNote>
  
  // Conversation extraction
  extractConversation(messages: Message[]): Promise<ExtractedNote>
  
  // Context-aware extraction
  extractWithContext(selection: string, fullContext: string): Promise<ExtractedNote>
}
```

## UI/UX Design Patterns

### Chat Interface Design
```
┌─────────────────────────────────────┐
│ Chat Title              ⭐ ••• │ X │
├─────────────────────────────────────┤
│                                     │
│  👤 User                            │
│  ┌─────────────────────────────┐   │
│  │ Can you explain this note?  │   │
│  └─────────────────────────────┘   │
│                                     │
│  🤖 AI Assistant                   │
│  ┌─────────────────────────────┐   │
│  │ I'd be happy to explain...  │   │
│  │                             │   │
│  │ [Streaming content...]      │   │
│  │ ● ● ●                       │   │
│  └─────────────────────────────┘   │
│     [📄 Extract] [📋 Copy]          │
│                                     │
├─────────────────────────────────────┤
│ [Type a message...          ] [Send]│
└─────────────────────────────────────┘
```

### Message States
- **Sending**: Opacity 0.7, right-aligned
- **Streaming**: Animated dots, progressive reveal
- **Complete**: Full opacity, action buttons on hover
- **Error**: Red border, retry button
- **Regenerating**: Fade out → Fade in

### Empty States
- Suggested prompts based on context
- Quick action buttons for common queries
- Helpful tips about features
- Recent topics if applicable

### Responsive Behavior
- Mobile: Full screen chat with slide-up input
- Tablet: Collapsible sidebar chat
- Desktop: Resizable side panel

## Performance Optimizations

### 1. Stream Buffering
```typescript
class StreamBuffer {
  private buffer: string[] = []
  private flushInterval: number = 50 // ms
  
  async *optimizeStream(stream: AsyncIterator<string>) {
    for await (const chunk of stream) {
      this.buffer.push(chunk)
      
      if (this.shouldFlush()) {
        yield this.buffer.join("")
        this.buffer = []
      }
    }
    
    // Flush remaining
    if (this.buffer.length > 0) {
      yield this.buffer.join("")
    }
  }
}
```

### 2. Message Virtualization
- Only render visible messages using virtual scrolling
- Overscan of 5 messages for smooth scrolling
- Dynamic height calculation for variable content

### 3. Context Optimization
- Sliding window approach for large notes
- Prioritize content around cursor position
- Include document summary for context
- Smart truncation to fit token limits

### 4. Caching Strategy
- Cache extracted notes for 5 minutes
- Cache AI responses for regeneration
- Cache context embeddings
- Persistent chat history with IndexedDB

## Implementation Details

### File Structure
```
features/chat/
├── components/
│   ├── chat-interface.tsx
│   ├── chat-message.tsx
│   ├── chat-input.tsx
│   ├── active-chats-list.tsx
│   └── extraction-dialog.tsx
├── stores/
│   └── chat-store.ts
├── providers/
│   └── home-chat-provider.tsx
├── services/
│   └── extraction-service.ts
└── hooks/
    ├── use-chat-stream.ts
    └── use-extraction.ts
```

### Key Implementation Files

#### Chat Store Implementation
```typescript
// features/chat/stores/chat-store.ts
export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      chats: [],
      activeChats: [],
      
      createChat: (options) => {
        const chat: Chat = {
          id: nanoid(),
          title: "New Chat",
          createdAt: new Date(),
          updatedAt: new Date(),
          starred: false,
          ...options,
        }
        
        set((state) => ({
          chats: [chat, ...state.chats],
          activeChats: [chat, ...state.activeChats],
        }))
        
        return chat
      },
      
      cleanupExpiredChats: () => {
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        
        set((state) => ({
          activeChats: state.chats.filter(
            (chat) =>
              chat.starred ||
              chat.noteId || // Home chats don't expire
              chat.updatedAt > sevenDaysAgo
          ),
        }))
      },
    }),
    {
      name: "chat-storage",
    }
  )
)
```

#### API Route with Streaming
```typescript
// app/api/chat/route.ts
export async function POST(req: NextRequest) {
  const { messages, noteContext } = await req.json()
  
  const systemPrompt = noteContext
    ? `You are a helpful AI assistant helping the user with their note. 
       Current note content: ${noteContext}`
    : "You are a helpful AI assistant for a knowledge management application."
  
  const result = await streamText({
    model: openai("gpt-4-turbo"),
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
    temperature: 0.7,
    maxTokens: 2000,
  })
  
  return result.toAIStreamResponse()
}
```

## Error Handling & Recovery

### API Failures
- Exponential backoff with max 3 retries
- Automatic model fallback (GPT-4 → GPT-3.5)
- User-friendly error messages
- Retry button in UI

### Stream Interruptions
- Automatic reconnection for network issues
- Resume from last received token
- Show partial response with "Continue" option
- Save draft for manual retry

### Rate Limiting
- Client-side request queuing
- Show estimated wait time
- Offer model downgrade option
- Batch small requests when possible

## Testing Strategy

### Unit Tests
```typescript
describe("ChatStore", () => {
  test("creates chat with correct defaults", () => {
    const chat = store.createChat()
    expect(chat.expiresAt).toBe(7 * 24 * 60 * 60 * 1000)
    expect(chat.starred).toBe(false)
  })
  
  test("prevents expired chat deletion when starred", () => {
    const chat = store.createChat()
    store.starChat(chat.id)
    jest.advanceTimersByTime(8 * 24 * 60 * 60 * 1000)
    store.cleanupExpiredChats()
    expect(store.chats.has(chat.id)).toBe(true)
  })
})
```

### Integration Tests
- AI service with mock responses
- Streaming with interruption simulation
- Context injection accuracy
- Extraction formatting validation

### E2E Test Scenarios
1. **Basic Conversation Flow**
   - Start chat → Send message → Receive response → Extract to note

2. **Home Chat Workflow**  
   - Open note → Use assistant → Clear with summary → Verify context

3. **Error Recovery**
   - Interrupt stream → Retry → Success
   - API failure → Fallback → Recovery

## Testing Checklist

### Sprint 1 Tests
- [ ] Chat messages stream token by token
- [ ] Stop button halts generation immediately
- [ ] Error states show and allow retry
- [ ] Empty state shows helpful prompts
- [ ] Messages format markdown correctly
- [ ] Code blocks have syntax highlighting
- [ ] Copy button works for messages
- [ ] Active chats show in sidebar
- [ ] Chat preview updates after AI response
- [ ] Expired chats are cleaned up after 7 days
- [ ] Starred chats don't expire
- [ ] Auto-scroll works during streaming
- [ ] Input auto-resizes with content
- [ ] Send on Enter, new line on Shift+Enter

### Sprint 2 Tests
- [ ] Home chat persists with note
- [ ] Clear chat works with/without summary
- [ ] Note context is included in AI responses
- [ ] Extract button appears on AI messages
- [ ] Extraction dialog shows AI-formatted content
- [ ] Extracted content can be edited before saving
- [ ] New note is created with proper formatting
- [ ] Tags are extracted appropriately
- [ ] Panel resizing works smoothly
- [ ] Collapsed panel shows floating button
- [ ] Navigation to new note works
- [ ] Toast notifications appear correctly

## Performance Metrics
- Time to first token: <1s ✓
- Full response time: <5s for typical queries ✓
- Extraction time: <3s ✓
- Smooth streaming at 30 tokens/sec ✓
- 100 message history: <100ms render ✓
- Context preparation: <200ms ✓
- Memory stable with 1000+ messages ✓

## Security & Privacy Considerations

### Data Protection
- No message persistence without user consent
- Encrypted storage for chat history
- Secure API key management
- No PII in analytics

### Content Filtering
- Prompt injection prevention
- Output sanitization
- Rate limiting per user
- Abuse detection

## Analytics & Monitoring

### Key Metrics to Track
```typescript
interface ChatAnalytics {
  // Usage
  messagesPerSession: number
  averageConversationLength: number
  extractionRate: number // % of chats with extraction
  
  // Performance
  timeToFirstToken: number[]
  streamingFrameRate: number
  errorRate: number
  
  // Features
  homeChatUsage: number
  starredChatRatio: number
  modelUsageBreakdown: Record<string, number>
  
  // User Success
  successfulExtractions: number
  chatCompletionRate: number
  retryRate: number
}
```

## Migration & Upgrade Path

### Future Considerations
- Multi-modal support (images, files)
- Voice input/output
- Conversation branching
- Chat templates/personas
- Collaborative chat sessions

### Data Migration Strategy
```typescript
interface ChatMigration {
  version: number
  up: (data: any) => any
  down: (data: any) => any
}

const migrations: ChatMigration[] = [
  {
    version: 1,
    up: (data) => ({
      ...data,
      modelPreference: data.model || "gpt-4-turbo",
    }),
    down: (data) => omit(data, ["modelPreference"]),
  },
]
```

## Success Metrics

### Performance Metrics
- Streaming latency: <1s first token ✓
- Error rate: <1% ✓
- Extraction accuracy: >90% ✓
- Context relevance: >95% ✓

### User Engagement
- 70% of users try chat in first session
- 50% extract at least one note
- 80% use home chat feature
- <5% abandon due to errors

### Technical Health
- 99.9% uptime for chat service
- <100ms UI response time
- <1% memory leaks
- Zero data loss incidents

## Dependencies

### External Services
- OpenAI API / Anthropic API
- Vercel AI SDK
- Rate limiting service
- Analytics platform

### Internal Dependencies
- Epic 1: Editor for note extraction
- Epic 2: Spaces for chat organization
- Auth system for user identity

### NPM Dependencies
```json
{
  "dependencies": {
    "ai": "^3.x",
    "@ai-sdk/openai": "^0.x",
    "@ai-sdk/anthropic": "^0.x",
    "react-markdown": "^9.x",
    "react-syntax-highlighter": "^15.x",
    "react-resizable-panels": "^2.x",
    "date-fns": "^3.x",
    "zod": "^3.x",
    "nanoid": "^5.x"
  }
}
```

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|---------|------------|------------|
| API costs spiral | High | Medium | Implement strict rate limits, token counting, usage alerts |
| Streaming complexity causes bugs | High | Medium | Extensive testing, fallback to non-streaming |
| Context window limits hit | Medium | High | Smart truncation, summary generation, sliding window |
| Chat history growth impacts performance | Medium | Medium | Auto-expiration, pagination, virtual scrolling |
| Users lose valuable chats | High | Low | Clear expiration warnings, easy starring, export option |

## Conclusion

This epic establishes AI chat as the intelligent core of AI Notes. By focusing on streaming performance, seamless note integration, and thoughtful UX, we're creating an AI assistant that feels like a natural extension of the user's thinking process.

The combination of ephemeral chats and persistent notes solves the fundamental problem of AI conversations: valuable insights get lost. With one-click extraction and dedicated note assistants, every conversation can contribute to the user's growing knowledge base.

## Next Steps
With the AI Chat Foundation complete, users can:
- Have streaming AI conversations with <1s latency
- Extract valuable insights to notes with one click
- Use dedicated AI assistants for each note with full context
- Maintain organized conversations with automatic cleanup

The next epic (AI Writing Assistant) will build on this foundation to add:
- Ghost text completions in the editor
- Inline AI commands with //
- Send selected text to chat
- Continue writing with AI assistance