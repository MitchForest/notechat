# Epic 4: AI Writing Assistant ✨

## Overview
**Goal**: Integrate AI capabilities directly into the writing experience with ghost text completions, inline commands, and seamless editor-chat integration  
**Duration**: 2 sprints (1 week)  
**Prerequisites**: Epic 3 (AI Chat Foundation) completed - we need the chat system for send-to-chat functionality  
**Outcome**: Writers have AI assistance at their fingertips without leaving the editor, transforming AI Notes into an intelligent writing partner

## Success Criteria
- **Ghost Text Performance**: Suggestions appear within 1s of pause
- **Acceptance Rate**: >30% of ghost text suggestions accepted
- **Inline AI Speed**: <2s for inline transformations
- **Zero Disruption**: Writing flow never interrupted by AI features
- **Context Quality**: AI understands surrounding content accurately
- **Selection Actions**: <500ms to show selection menu
- **Send to Chat**: Seamless transition with full context preserved
- **Memory Efficiency**: <50MB additional memory usage with all features active

## Context & Motivation

The AI Writing Assistant transforms the editing experience from passive to actively intelligent. Traditional writing tools make you stop and ask for help; AI Notes provides assistance as you think. This epic delivers:

- **Invisible Intelligence**: AI suggestions that feel like natural extensions of your thoughts
- **Contextual Commands**: Transform text with natural language right where you're writing
- **Fluid Workflows**: Move between focused writing and exploratory chat without friction
- **Adaptive Assistance**: AI that learns your writing style and provides personalized suggestions

This is where AI Notes evolves from a tool you use to a partner that actively helps you think and write better.

## Features

### F05: Ghost Text Completions
**Epic**: 1 | **Sprint**: 3 | **Complexity**: Large

#### User Story
As a knowledge professional, I want AI to suggest what I'm typing next based on context so that I can write faster and overcome writer's block.

#### Acceptance Criteria
- [ ] Ghost text appears after 1s pause in typing
- [ ] Shows as semi-transparent gray text inline with cursor
- [ ] Tab to accept, any other key to dismiss
- [ ] Context-aware based on current paragraph and document
- [ ] Learns from user's writing style over time
- [ ] Can be disabled in settings with granular control
- [ ] Smooth fade in/out animations (300ms)
- [ ] Works in all text areas including titles
- [ ] No suggestions in code blocks or URLs
- [ ] Debounce time configurable (500ms-2000ms)

#### Business Rules
1. Max 20 tokens per suggestion (5-15 words)
2. No suggestions in code blocks or when typing URLs
3. Debounced to avoid API spam
4. User acceptance tracked for improvements
5. Cache recent completions for 5 minutes
6. Use faster model (GPT-3.5) for low latency

### F06: Inline AI (//)
**Epic**: 1 | **Sprint**: 3 | **Complexity**: Small

#### User Story
As a knowledge professional, I want to make natural language AI requests anywhere in my notes so that I can get help without switching contexts.

#### Acceptance Criteria
- [ ] Type "//" anywhere to trigger inline AI
- [ ] Natural language requests like "// make this more formal"
- [ ] AI response replaces the command inline
- [ ] Works with selection or cursor position context
- [ ] Shows inline loading state with pulsing indicator
- [ ] Escape cancels request
- [ ] Enter executes command
- [ ] History of recent commands available
- [ ] Smooth text replacement animation
- [ ] Error states show inline without disrupting flow

#### Business Rules
1. Max request length: 200 characters
2. Context includes surrounding paragraphs (±500 chars)
3. Timeout after 30 seconds with graceful failure
4. Rate limited with AI quota
5. Commands are not saved in document history until executed

## Sprints

### Sprint 4.1: Ghost Text Completions (3 days)

#### Day 1: Ghost Text Infrastructure

**Core Services Setup**
- **Completion Service**: AI SDK integration with smart caching
  - LRU cache for recent completions (100 item limit)
  - Context extraction from editor state
  - Token counting and limiting
  - Model selection based on context length

- **Ghost Text Hook**: React hook managing completion lifecycle
  - Debounced trigger mechanism (configurable delay)
  - Cursor position tracking
  - Acceptance/dismissal handling
  - Performance metrics collection

- **Performance Optimizations**:
  - Web Worker for context extraction
  - Request cancellation on cursor movement
  - Intelligent batching for multiple requests
  - Progressive rendering for long completions

#### Day 2: Ghost Text Rendering

**Visual Implementation**
- **Ghost Text Renderer**: Overlay component for suggestions
  - Precise positioning using editor coordinates
  - Semi-transparent gray text (opacity: 0.5)
  - Fade in/out animations (300ms)
  - Font matching with editor
  - Responsive to editor scrolling

- **Editor Integration**: Novel editor extensions
  - Keyboard event handling (Tab/Escape)
  - Ghost text state management
  - Coordinate calculation for positioning
  - Theme-aware styling

#### Day 3: Settings & Polish

**User Control**
- **Ghost Text Settings**: Preferences UI
  - Enable/disable toggle
  - Debounce delay slider (500-2000ms)
  - Suggestion length preference
  - Model selection (speed vs quality)
  - Acceptance rate display

- **Analytics Integration**:
  - Track suggestion events (shown, accepted, dismissed)
  - Calculate acceptance rates
  - Measure latency metrics
  - User behavior patterns

### Sprint 4.2: Inline AI & Send to Chat (4 days)

#### Day 1: Inline AI Extension

**TipTap Extension Development**
- **Inline AI Extension**: ProseMirror plugin
  - Pattern detection for "//"
  - Command capture and parsing
  - State management within editor
  - Decoration rendering for active commands
  - Keyboard shortcut handling

- **Processing Pipeline**:
  - Context extraction around command
  - AI request formatting
  - Streaming response handling
  - Text replacement with undo support
  - Error recovery mechanisms

#### Day 2: Inline AI Processing

**AI Integration**
- **Command Processing**: Natural language understanding
  - Context-aware prompt construction
  - Multiple command types support
  - Fallback handling for ambiguous commands
  - Response streaming for long outputs

- **Command Types**:
  - Transformations: "make this more formal/casual"
  - Expansions: "elaborate on this point"
  - Corrections: "fix grammar and style"
  - Generations: "write a conclusion"
  - Questions: "what's missing here?"

#### Day 3: Send to Chat Integration

**Chat Bridge Features**
- **Send to Chat Hook**: Bridge between editor and chat
  - Selection capture and formatting
  - Chat creation with context
  - Navigation with initial message
  - Toast notifications for feedback

- **Selection Menu**: Floating UI for text actions
  - Position calculation based on selection
  - AI action quick access
  - Keyboard shortcuts (Cmd+Enter)
  - Mobile-friendly touch targets

#### Day 4: Integration & Polish

**Complete Integration**
- **Unified AI Editor**: All features working together
  - Ghost text + inline AI compatibility
  - Selection menu with all actions
  - Settings panel for all AI features
  - Performance monitoring

- **Quality Assurance**:
  - Cross-browser testing
  - Mobile responsiveness
  - Accessibility compliance
  - Performance benchmarking

## Technical Architecture

### AI Service Architecture

```typescript
// Unified AI service for all writing features
interface AIWritingService {
  // Ghost text completions
  getCompletion(context: CompletionContext): Promise<string>
  
  // Inline AI processing
  processInlineCommand(command: string, context: EditorContext): Promise<string>
  
  // Selection transformations
  transformSelection(text: string, action: TransformAction): Promise<string>
  
  // Analytics
  trackUsage(event: AIUsageEvent): void
}

interface CompletionContext {
  textBefore: string       // 500 chars before cursor
  textAfter: string        // 200 chars after cursor
  currentParagraph: string // Full current paragraph
  noteTitle?: string       // For context
  noteType?: string        // For style matching
  userWritingStyle?: WritingStyleProfile // Learned preferences
}

interface EditorContext {
  command: string
  selectionText?: string
  surroundingText: string
  documentOutline?: string[]
  recentEdits?: Edit[]
}
```

### State Management

```typescript
interface AIWritingStore {
  // Ghost text state
  ghostText: {
    suggestions: Map<string, GhostSuggestion>
    currentSuggestion: string | null
    isLoading: boolean
    settings: GhostTextSettings
  }
  
  // Inline AI state
  inlineAI: {
    activeCommands: Map<string, InlineCommand>
    commandHistory: string[]
    isProcessing: boolean
  }
  
  // Metrics
  metrics: {
    ghostTextAcceptance: number
    inlineAIUsage: Map<string, number>
    averageLatency: number
  }
  
  // Actions
  actions: {
    showGhostText: (text: string, position: number) => void
    acceptGhostText: () => void
    dismissGhostText: () => void
    processInlineCommand: (command: string) => Promise<void>
    updateSettings: (settings: Partial<GhostTextSettings>) => void
  }
}
```

### Performance Optimization Strategy

```typescript
class PerformanceOptimizer {
  // Request debouncing and cancellation
  private pendingRequests = new Map<string, AbortController>()
  private requestQueue = new PriorityQueue<AIRequest>()
  
  // Intelligent caching
  private cache = new LRUCache<string, CachedResponse>({
    max: 100,
    ttl: 5 * 60 * 1000, // 5 minutes
    updateAgeOnGet: true,
  })
  
  // Context optimization
  optimizeContext(fullText: string, cursorPos: number): OptimizedContext {
    // Smart windowing around cursor
    const window = this.calculateContextWindow(fullText, cursorPos)
    
    // Extract key information
    const outline = this.extractDocumentOutline(fullText)
    const style = this.analyzeWritingStyle(window.text)
    
    return {
      text: window.text,
      outline,
      style,
      metadata: {
        totalLength: fullText.length,
        position: cursorPos,
      }
    }
  }
  
  // Request prioritization
  prioritizeRequest(request: AIRequest): number {
    // Ghost text gets higher priority than inline AI
    if (request.type === 'ghost-text') return 1
    if (request.type === 'inline-ai') return 2
    return 3
  }
}
```

## UI/UX Design Patterns

### Ghost Text Visual Design
```
Before cursor | [Ghost text appears here in gray] |
              ↑                                    ↑
          Cursor position                   Fades out gradually
```

**Visual Specifications**:
- Font: Matches editor font (JetBrains Mono)
- Color: `text-muted-foreground/50` (50% opacity)
- Animation: 300ms fade in/out
- Position: Inline with text flow
- Z-index: Below cursor but above text

### Inline AI Visual Flow
```
Step 1: User types //
Step 2: Command highlight appears
Step 3: User types command and presses Enter
Step 4: Loading indicator replaces command
Step 5: AI response replaces everything
```

**Command Highlighting**:
- Background: `hsl(var(--ai-primary) / 0.1)`
- Text color: `hsl(var(--ai-primary))`
- Border radius: 0.25rem
- Padding: 0 0.25rem

### Selection Menu Design
```
┌─────────────────────────────┐
│ [💬 Chat] [✨ AI Actions ▼] │
└─────────────────────────────┘
         ↓ Expands to ↓
┌─────────────────────────────┐
│ 💡 Explain                  │
│ ✏️  Improve                  │
│ 📄 Summarize                │
│ ✅ Continue                 │
└─────────────────────────────┘
```

## Implementation Details

### File Structure
```
features/editor/
├── components/
│   ├── novel-editor-with-ai.tsx
│   ├── ghost-text-renderer.tsx
│   ├── ghost-text-settings.tsx
│   ├── selection-menu.tsx
│   └── inline-ai-indicator.tsx
├── extensions/
│   ├── inline-ai.ts
│   ├── ghost-text.ts
│   └── selection-tracking.ts
├── hooks/
│   ├── use-ghost-text.ts
│   ├── use-inline-ai.ts
│   ├── use-send-to-chat.ts
│   └── use-ai-analytics.ts
├── services/
│   ├── completion-service.ts
│   ├── transformation-service.ts
│   └── analytics-service.ts
└── utils/
    ├── context-extraction.ts
    ├── text-processing.ts
    └── performance.ts
```

### Key API Routes

```typescript
// app/api/completion/route.ts
export async function POST(req: NextRequest) {
  const { prompt, mode } = await req.json()
  
  // Different strategies for different modes
  const config = mode === "ghost-text"
    ? { model: "gpt-3.5-turbo", maxTokens: 30, temperature: 0.7 }
    : { model: "gpt-4-turbo", maxTokens: 200, temperature: 0.8 }
  
  const result = await streamText({
    model: openai(config.model),
    messages: [
      { role: "system", content: getSystemPrompt(mode) },
      { role: "user", content: prompt },
    ],
    ...config,
  })
  
  return result.toAIStreamResponse()
}

// app/api/transform/route.ts
export async function POST(req: NextRequest) {
  const { text, action, context } = await req.json()
  
  const result = await generateText({
    model: openai("gpt-4-turbo"),
    messages: [
      { 
        role: "system", 
        content: "Transform text according to user instructions. Maintain the original meaning while applying the requested changes." 
      },
      { 
        role: "user", 
        content: formatTransformRequest(text, action, context) 
      },
    ],
    temperature: 0.7,
    maxTokens: Math.min(text.length * 2, 1000),
  })
  
  return Response.json({ transformed: result.text })
}
```

## Error Handling & Recovery

### Graceful Degradation
```typescript
class AIWritingErrorHandler {
  handleGhostTextError(error: Error): void {
    // Silently fail - don't disrupt writing
    console.error("Ghost text error:", error)
    
    // Track error metrics
    this.metrics.trackError("ghost_text", error)
    
    // No user notification for ghost text failures
  }
  
  handleInlineAIError(error: Error, command: string): void {
    // Show inline error message
    this.showInlineError("AI couldn't process this command. Try again?")
    
    // Restore original command for retry
    this.restoreCommand(command)
    
    // Log for debugging
    console.error("Inline AI error:", error, { command })
  }
  
  handleSendToChatError(error: Error): void {
    // Show toast notification
    toast({
      title: "Couldn't send to chat",
      description: "Please try again or copy the text manually",
      variant: "destructive",
    })
    
    // Keep selection active for manual copy
    this.maintainSelection()
  }
}
```

### Performance Monitoring

```typescript
interface PerformanceMetrics {
  ghostText: {
    latency: number[]      // Time to first character
    acceptanceRate: number // Percentage accepted
    cacheHitRate: number   // Cache effectiveness
  }
  inlineAI: {
    processingTime: number[] // Command execution time
    successRate: number      // Successful completions
    commandTypes: Map<string, number> // Usage by type
  }
  memory: {
    heapUsed: number      // Memory consumption
    cacheSize: number     // Items in cache
  }
}
```

## Testing Strategy

### Unit Tests
```typescript
describe("GhostTextService", () => {
  test("respects debounce timing", async () => {
    const service = new GhostTextService({ debounceMs: 1000 })
    const spy = jest.spyOn(service, "fetchCompletion")
    
    service.requestCompletion(context)
    service.requestCompletion(context) // Rapid second call
    
    await wait(500)
    expect(spy).not.toHaveBeenCalled()
    
    await wait(600) // Total 1100ms
    expect(spy).toHaveBeenCalledTimes(1)
  })
  
  test("cancels pending requests on new input", async () => {
    const controller = new AbortController()
    const service = new GhostTextService()
    
    const promise1 = service.requestCompletion(context1)
    const promise2 = service.requestCompletion(context2)
    
    await expect(promise1).rejects.toThrow("AbortError")
    await expect(promise2).resolves.toBeDefined()
  })
})

describe("InlineAIExtension", () => {
  test("captures commands after //", () => {
    const editor = createTestEditor()
    editor.commands.insertContent("// make this formal")
    
    const state = getInlineAIState(editor)
    expect(state.active).toBe(true)
    expect(state.query).toBe("make this formal")
  })
  
  test("processes command on Enter", async () => {
    const editor = createTestEditor()
    editor.commands.insertContent("Hello // add punctuation")
    
    await triggerEnter(editor)
    await waitForProcessing()
    
    expect(editor.getText()).toBe("Hello.")
  })
})
```

### Integration Tests
- Ghost text appears correctly positioned
- Tab acceptance works across browsers
- Inline AI preserves undo history
- Selection menu tracks cursor accurately
- Send to chat maintains context

### E2E Test Scenarios

1. **Ghost Text Flow**
   - Type → Pause → See suggestion → Accept with Tab
   - Type → Pause → See suggestion → Dismiss by typing
   - Rapid typing → No suggestions shown

2. **Inline AI Flow**
   - Type // → Enter command → Press Enter → See result
   - Type // → Enter command → Press Escape → Command cancelled
   - Multiple commands in sequence work correctly

3. **Send to Chat Flow**
   - Select text → Click Chat → New chat opens with context
   - Select text → Choose AI action → Chat opens with action

### Performance Benchmarks
- Ghost text latency: <1s from pause to appearance ✓
- Inline AI response: <2s for typical commands ✓
- Memory usage: <50MB additional with all features ✓
- No UI blocking during AI operations ✓
- 60 FPS maintained during ghost text rendering ✓

## Accessibility & Internationalization

### Accessibility Features
- Ghost text announced to screen readers
- Keyboard-only operation for all features
- High contrast mode support
- Clear focus indicators
- Escape key consistently cancels operations

### Internationalization Prep
- Extracted UI strings for translation
- RTL layout support for ghost text
- Locale-aware text transformations
- Multi-language command recognition

## Analytics & Monitoring

### Key Metrics to Track
```typescript
interface AIWritingAnalytics {
  // Ghost Text
  ghostTextShown: number
  ghostTextAccepted: number
  ghostTextDismissed: number
  ghostTextAcceptanceRate: number
  averageGhostTextLength: number
  
  // Inline AI
  inlineAITriggered: number
  inlineAICompleted: number
  inlineAIFailed: number
  inlineAICancelled: number
  popularCommands: string[]
  
  // Send to Chat
  sendToChatUsed: number
  sendToChatWithAction: Record<string, number>
  averageSelectionLength: number
  
  // Performance
  averageLatency: {
    ghostText: number
    inlineAI: number
  }
  errorRate: number
  cacheHitRate: number
}
```

### Real-time Monitoring
- Sentry integration for error tracking
- Performance monitoring with Web Vitals
- Custom dashboards for AI usage
- A/B testing framework for improvements

## Security & Privacy Considerations

### Data Protection
- No sensitive content in completion requests
- Context truncation for privacy
- Local caching only, no server persistence
- Opt-out available for all AI features

### Content Safety
- Inappropriate suggestion filtering
- Command injection prevention
- Rate limiting per user
- Audit logs for unusual patterns

## Migration & Upgrade Path

### Future Enhancements
- Voice-to-text with AI processing
- Multi-modal completions (code, tables, lists)
- Personalized writing style learning
- Team writing style consistency
- Offline completion support

### Compatibility
- Graceful fallback for older browsers
- Progressive enhancement approach
- Feature detection for optimal experience
- Settings migration for updates

## Success Metrics

### User Engagement
- 50% of users try ghost text in first session
- 30% ghost text acceptance rate achieved
- 70% of users use inline AI weekly
- 40% send to chat usage among active users

### Technical Health
- <1s ghost text latency (p95)
- <2s inline AI response time (p95)
- <1% error rate across all features
- <50MB memory overhead maintained

### Business Impact
- 25% increase in writing speed
- 40% reduction in context switching
- 30% more content created per session
- 90% user satisfaction with AI features

## Dependencies

### External Services
- OpenAI API (GPT-3.5 for speed, GPT-4 for quality)
- Vercel AI SDK for streaming
- Analytics service for tracking
- Error monitoring service

### Internal Dependencies
- Epic 3: Chat system for send-to-chat
- Epic 1: Novel editor as foundation
- Epic 2: Note organization for context
- Auth system for user preferences

### NPM Dependencies
```json
{
  "dependencies": {
    "ai": "^3.x",
    "@ai-sdk/openai": "^0.x",
    "@tiptap/core": "^2.x",
    "@tiptap/react": "^2.x",
    "@tiptap/pm": "^2.x",
    "lodash": "^4.x",
    "lru-cache": "^10.x"
  }
}
```

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|---------|------------|------------|
| Ghost text latency >1s | High | Medium | Use edge functions, aggressive caching, fallback to simpler model |
| Low acceptance rate | High | Medium | A/B test timing and length, personalization, quality improvements |
| Inline AI breaks flow | High | Low | Careful UX design, instant feedback, easy cancellation |
| Memory leaks from observers | Medium | Medium | Cleanup on unmount, periodic garbage collection, memory monitoring |
| API costs exceed budget | High | Medium | Smart caching, rate limiting, cheaper models for completions |

## Conclusion

The AI Writing Assistant epic transforms AI Notes from a passive editor into an active writing partner. By implementing ghost text completions, inline AI commands, and seamless chat integration, we're creating an experience where AI assistance feels natural and unobtrusive.

The key innovation is making AI invisible until needed - it's there when you pause to think, when you need help with phrasing, or when you want to explore ideas further. This isn't about replacing human creativity; it's about augmenting it with intelligent assistance that adapts to each user's unique style and needs.

## Next Steps
With the AI Writing Assistant complete, users can:
- Write faster with intelligent ghost text completions
- Transform text with natural language commands using //
- Seamlessly transition between focused writing and AI chat
- Get contextual help without breaking their flow

The next epic (AI Commands & Transformations) will build on this foundation to add:
- Comprehensive slash command system (/summarize, /expand, etc.)
- Smart collections with AI-powered organization
- Advanced text transformations and templates
- Bulk operations with AI assistance