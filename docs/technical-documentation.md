# NoteChat Technical Documentation

## Table of Contents
1. [System Architecture](#system-architecture)
2. [AI Implementation with Vercel AI SDK](#ai-implementation)
3. [Core AI Features](#core-ai-features)
4. [Grammar & Spell Checking System](#grammar-spell-checking)
5. [Block Editor Architecture](#block-editor)
6. [AI Learning & Feedback Loops](#ai-learning)
7. [API Architecture](#api-architecture)

## System Architecture {#system-architecture}

### Overview

NoteChat employs a modern, AI-first architecture built on Next.js 15's App Router with React 19. The system is designed for real-time AI interactions, featuring streaming responses, web worker processing, and edge runtime optimization.

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
├─────────────────────┬───────────────────┬───────────────────┤
│   TipTap Editor     │   AI Components   │   React UI        │
│   - Block Editor    │   - Ghost Text    │   - Sidebar       │
│   - Extensions      │   - Bubble Menu   │   - Chat Interface│
│   - Drag & Drop     │   - Slash Commands│   - Modals        │
├─────────────────────┴───────────────────┴───────────────────┤
│                     State Management                         │
│   - Zustand Stores (Content, UI, Smart Collections)         │
│   - Optimistic Updates with Server Reconciliation           │
├─────────────────────────────────────────────────────────────┤
│                    Edge Runtime APIs                         │
│   - AI Streaming (/api/ai/*)                               │
│   - Authentication (/api/auth/*)                           │
│   - CRUD Operations (/api/notes/*, /api/chats/*)          │
├─────────────────────────────────────────────────────────────┤
│                    Service Layer                             │
│   - Vercel AI SDK Integration                              │
│   - Retext Grammar Processing (Web Workers)                │
│   - Content Transformation Pipeline                        │
├─────────────────────────────────────────────────────────────┤
│                    Data Layer                                │
│   - PostgreSQL + Drizzle ORM                               │
│   - Session-based Auth (Arctic)                            │
│   - Hierarchical Data Model                                │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

1. **Edge Runtime for AI APIs**: Reduces latency for streaming responses by running closer to users
2. **Web Workers for Grammar Checking**: Prevents UI blocking during intensive text analysis
3. **Streaming-First Design**: All AI interactions use streaming for real-time feedback
4. **Component-Based Extensions**: TipTap extensions for modular editor features
5. **Optimistic UI Updates**: Immediate feedback with background synchronization

## AI Implementation with Vercel AI SDK {#ai-implementation}

### Core Integration Pattern

The AI implementation leverages Vercel AI SDK v4.3.16 with sophisticated streaming, tool calling, and error handling:

```typescript
// Core AI configuration (features/ai/lib/ai-config.ts)
export const AI_CONFIG = {
  models: {
    fast: 'gpt-4o-mini',      // Ghost text, completions, quick operations
    accurate: 'gpt-4-turbo',   // Chat, complex transformations
  },
  temperature: {
    creative: 0.7,             // Ghost text, content generation
    balanced: 0.5,             // General transformations
    precise: 0.3,              // Grammar fixes, technical content
  },
  maxTokens: {
    completion: 150,           // Ghost text suggestions
    transformation: 500,       // Text improvements
    chat: 1500,               // Full conversations
  }
}
```

### Streaming Architecture

#### 1. Chat Streaming with Adaptive Buffering

```typescript
// features/chat/hooks/use-smooth-streaming.ts
export function useSmoothStreaming(text: string, isStreaming: boolean) {
  const [displayText, setDisplayText] = useState('')
  const bufferRef = useRef<string[]>([])
  const frameRef = useRef<number>()
  
  // Adaptive buffer size based on stream speed
  const adaptiveBufferSize = useCallback(() => {
    const speed = measureStreamSpeed()
    return speed > 100 ? 32 : 16 // ms
  }, [])
  
  useEffect(() => {
    if (isStreaming) {
      // 60fps token rendering
      const render = () => {
        if (bufferRef.current.length > 0) {
          const token = bufferRef.current.shift()!
          setDisplayText(prev => prev + token)
        }
        frameRef.current = requestAnimationFrame(render)
      }
      frameRef.current = requestAnimationFrame(render)
    }
  }, [isStreaming])
}
```

#### 2. Tool Calling Implementation

```typescript
// features/chat/tools/note-tools.ts
export const noteTools = {
  create_note: {
    description: 'Create a new note with specified content',
    parameters: z.object({
      title: z.string(),
      content: z.string(),
      content_type: z.enum(['markdown', 'html']),
      collection_id: z.string().optional(),
    }),
    execute: async (args, context) => {
      // Convert markdown to TipTap HTML if needed
      const processedContent = args.content_type === 'markdown'
        ? markdownToTiptapHTML(args.content)
        : args.content
        
      // Create note with proper context
      const note = await createNote({
        ...args,
        spaceId: context.spaceId,
        content: processedContent,
      })
      
      // Log for learning system
      await logToolUsage('create_note', { success: true })
      
      return note
    }
  },
  
  update_note: {
    // Similar implementation with content merging strategies
  },
  
  search_notes: {
    // Natural language search with embedding similarity
  }
}
```

### AI SDK Hook Usage

```typescript
// features/chat/hooks/use-chat-with-retry.ts
export function useChatWithRetry(chatId: string) {
  const { messages, append, reload, stop, isLoading, error } = useChat({
    api: `/api/chats/${chatId}/messages`,
    
    // Automatic retry with exponential backoff
    onError: (error) => {
      if (error.message.includes('rate_limit')) {
        return { retry: true, delay: 2000 }
      }
      return { retry: false }
    },
    
    // Stream processing
    onResponse: (response) => {
      if (!response.ok && response.status === 429) {
        handleRateLimit(response)
      }
    },
    
    // Tool execution
    experimental_onToolCall: async ({ toolCall }) => {
      const tool = noteTools[toolCall.toolName]
      if (tool) {
        return await tool.execute(toolCall.args, getContext())
      }
    },
  })
  
  return {
    messages,
    append,
    reload,
    stop,
    isLoading,
    error,
  }
}
```

## Core AI Features {#core-ai-features}

### 1. Ghost Text Completions

The ghost text feature provides intelligent autocomplete suggestions triggered by typing `++`:

```typescript
// features/ai/extensions/ghost-text.ts
export const GhostText = Extension.create({
  name: 'ghostText',
  
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleTextInput(view, from, to, text) {
            if (text === '+') {
              const before = view.state.doc.textBetween(from - 1, from)
              if (before === '+') {
                // Delete the ++ trigger
                view.dispatch(view.state.tr.delete(from - 1, to))
                
                // Get paragraph context for better suggestions
                const $pos = view.state.doc.resolve(from - 1)
                const paragraph = $pos.parent
                const context = paragraph.textBetween(0, $pos.pos - $pos.start())
                
                // Emit event for AI processing
                ;(this.editor as any).emit('ghostTextTrigger', {
                  position: from - 1,
                  context: context.trim()
                })
                
                return true
              }
            }
            return false
          },
          
          decorations(state) {
            // Render ghost text as widget decoration
            if (storage.isActive && storage.ghostText) {
              const decoration = Decoration.widget(
                storage.position,
                () => {
                  const span = document.createElement('span')
                  span.className = 'ghost-text-widget'
                  span.textContent = storage.ghostText
                  span.style.cssText = `
                    color: var(--muted-foreground);
                    opacity: 0.6;
                    font-style: italic;
                    pointer-events: none;
                  `
                  return span
                },
                { side: 1 } // Place after cursor
              )
              return DecorationSet.create(state.doc, [decoration])
            }
            return DecorationSet.empty
          }
        }
      })
    ]
  }
})
```

```typescript
// features/ai/hooks/use-ghost-text.ts
export function useGhostText(editor: Editor | null) {
  const { complete, completion, isLoading, stop } = useCompletion({
    api: '/api/ai/completion',
    
    onFinish: (prompt, completion) => {
      // Log acceptance/rejection for learning
      logGhostTextInteraction({
        prompt,
        suggestion: completion,
        accepted: false, // Will be updated on accept
      })
    }
  })
  
  useEffect(() => {
    const handleTrigger = ({ position, context }) => {
      // Minimum context length for quality suggestions
      if (context.length >= 10) {
        complete(context, { 
          body: { 
            mode: 'ghost-text',
            // Include user preferences for personalization
            preferences: getUserPreferences(),
          } 
        })
      }
    }
    
    const handleAccept = (text: string) => {
      editor.chain().focus().insertContentAt(position, text).run()
      logGhostTextInteraction({ accepted: true })
      editor.commands.clearGhostText()
    }
    
    ;(editor as any).on('ghostTextTrigger', handleTrigger)
    ;(editor as any).on('ghostTextAccept', handleAccept)
  }, [editor])
}
```

### 2. AI Slash Commands

```typescript
// features/editor/extensions/slash-command.tsx
export const SlashCommand = Extension.create({
  name: 'slashCommand',
  
  addProseMirrorPlugins() {
    return [
      Suggestion({
        char: '/',
        command: ({ editor, range, props }) => {
          if (props.command === 'ai') {
            // Open inline AI interface
            editor.commands.openAIInline(range)
          } else {
            // Execute formatting command
            props.command({ editor, range })
          }
        },
        
        items: ({ query }) => {
          return [
            {
              title: 'Ask AI',
              command: 'ai',
              icon: Sparkles,
              description: 'Get AI assistance',
            },
            // Other commands...
          ].filter(item => 
            item.title.toLowerCase().includes(query.toLowerCase())
          )
        },
      })
    ]
  }
})
```

### 3. AI Quick Actions (Bubble Menu)

```typescript
// features/ai/components/ai-bubble-menu-commands.tsx
export function AIBubbleMenuCommands({ editor, onTransform }) {
  const quickActions = [
    { id: 'improve', label: 'Improve writing', icon: Sparkles },
    { id: 'shorter', label: 'Make shorter', icon: Minimize2 },
    { id: 'longer', label: 'Make longer', icon: Maximize2 },
    { id: 'fix-grammar', label: 'Fix grammar', icon: CheckCircle },
    { id: 'simplify', label: 'Simplify', icon: Zap },
    { id: 'formal', label: 'More formal', icon: Briefcase },
    { id: 'casual', label: 'More casual', icon: Smile },
  ]
  
  // User's custom actions from settings
  const customActions = useUserCustomActions()
  
  const handleAction = async (action: string) => {
    const selection = editor.state.selection
    const selectedText = editor.state.doc.textBetween(selection.from, selection.to)
    
    // Log action for learning
    logQuickAction({ action, textLength: selectedText.length })
    
    await onTransform({
      text: selectedText,
      action,
      customPrompt: customActions[action]?.prompt,
    })
  }
}
```

### 4. Personalization System

```typescript
// features/ai/lib/personalization.ts
export class PersonalizationEngine {
  async getPersonalizedPrompt(basePrompt: string, userId: string) {
    const preferences = await getUserPreferences(userId)
    const history = await getUserInteractionHistory(userId)
    
    // Analyze user's writing style
    const styleProfile = analyzeWritingStyle(history)
    
    // Adjust prompt based on preferences
    return {
      systemPrompt: `${basePrompt}
        User preferences: ${JSON.stringify(preferences)}
        Writing style: ${styleProfile.tone}, ${styleProfile.complexity}
        Avoid: ${preferences.avoidTerms.join(', ')}
        Prefer: ${preferences.preferTerms.join(', ')}`,
      temperature: preferences.creativity || 0.5,
    }
  }
  
  async logInteraction(interaction: AIInteraction) {
    // Store in database for learning
    await db.insert(aiInteractions).values({
      userId: interaction.userId,
      type: interaction.type,
      input: interaction.input,
      output: interaction.output,
      accepted: interaction.accepted,
      modified: interaction.modified,
      timestamp: new Date(),
    })
    
    // Update user preferences based on patterns
    if (interaction.accepted) {
      await this.updatePreferencesFromAcceptance(interaction)
    }
  }
}
```

## Grammar & Spell Checking System {#grammar-spell-checking}

### Architecture Overview

The grammar checking system uses Retext with web workers for non-blocking processing:

```typescript
// features/editor/services/SpellCheckExtension.ts
export const SpellCheckExtension = Extension.create({
  name: 'spellCheck',
  
  onCreate() {
    // Initialize web worker
    this.storage.worker = new Worker(
      new URL('./spell-check.worker.ts', import.meta.url)
    )
    
    // Debounced checking
    this.storage.checkDocument = debounce(
      this.checkDocument.bind(this),
      500
    )
  },
  
  addProseMirrorPlugins() {
    return [
      new Plugin({
        state: {
          init: () => ({ decorations: DecorationSet.empty }),
          
          apply: (tr, value, oldState, newState) => {
            if (tr.docChanged) {
              // Queue check in web worker
              this.storage.checkDocument(newState.doc)
              
              // Map existing decorations
              return {
                decorations: value.decorations.map(tr.mapping, tr.doc)
              }
            }
            
            // Handle worker results
            const meta = tr.getMeta('addSpellCheckResults')
            if (meta) {
              return {
                decorations: this.createDecorations(newState.doc, meta.errors)
              }
            }
            
            return value
          }
        }
      })
    ]
  }
})
```

### Web Worker Implementation

```typescript
// features/editor/services/spell-check.worker.ts
import { unified } from 'unified'
import retextEnglish from 'retext-english'
import retextSpell from 'retext-spell'
import retextIndefiniteArticle from 'retext-indefinite-article'
import retextRepeatedWords from 'retext-repeated-words'
import retextRedundantAcronyms from 'retext-redundant-acronyms'
import retextSentenceSpacing from 'retext-sentence-spacing'
import dictionary from 'dictionary-en'

const processor = unified()
  .use(retextEnglish)
  .use(retextSpell, dictionary)
  .use(retextIndefiniteArticle)
  .use(retextRepeatedWords)
  .use(retextRedundantAcronyms)
  .use(retextSentenceSpacing)

self.addEventListener('message', async (event) => {
  const { id, text, options } = event.data
  
  try {
    const file = await processor.process(text)
    
    const errors = file.messages.map(message => ({
      from: message.position.start.offset,
      to: message.position.end.offset,
      message: message.reason,
      severity: message.fatal ? 'error' : 'warning',
      suggestions: message.expected || [],
      ruleId: message.ruleId,
    }))
    
    self.postMessage({ id, errors })
  } catch (error) {
    self.postMessage({ id, error: error.message })
  }
})
```

### Error Decoration Rendering

```typescript
createDecorations(doc: Node, errors: SpellError[]): DecorationSet {
  const decorations: Decoration[] = []
  
  errors.forEach(error => {
    // Create inline decoration with error styling
    const decoration = Decoration.inline(
      error.from,
      error.to,
      {
        class: `spell-error spell-error--${error.severity}`,
        title: error.message,
        'data-suggestions': JSON.stringify(error.suggestions),
      }
    )
    decorations.push(decoration)
  })
  
  return DecorationSet.create(doc, decorations)
}
```

## Block Editor Architecture {#block-editor}

### TipTap Extension System

```typescript
// features/editor/extensions/index.ts
export function createEditorExtensions() {
  return [
    // Core extensions
    StarterKit.configure({
      dropcursor: { width: 2, class: 'drop-cursor' },
      gapcursor: false,
    }),
    
    // Custom drag handle
    CustomDragHandle.configure({
      onDragStart: (event, node) => {
        // Add visual feedback
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('block-id', node.attrs.id)
      },
      
      onDrop: (event, { from, to }) => {
        // Handle block reordering with animation
        const blockId = event.dataTransfer.getData('block-id')
        moveBlock(blockId, from, to)
      },
    }),
    
    // Block identification system
    BlockId.configure({
      generateId: () => `block-${nanoid()}`,
      persist: true,
    }),
    
    // AI extensions
    GhostText,
    SlashCommand,
    SpellCheckExtension,
    
    // Rich content
    CodeBlockLowlight.configure({
      lowlight: createLowlight(common),
      defaultLanguage: 'javascript',
    }),
    
    TaskList,
    TaskItem.configure({
      nested: true,
      HTMLAttributes: {
        class: 'task-item',
      },
    }),
  ]
}
```

### Custom Drag Handle Implementation

```typescript
// features/editor/extensions/custom-drag-handle.ts
export const CustomDragHandle = Extension.create({
  name: 'customDragHandle',
  
  addProseMirrorPlugins() {
    return [
      new Plugin({
        view: () => new DragHandleView(this.editor),
      })
    ]
  }
})

class DragHandleView {
  private handle: HTMLElement
  private isDragging = false
  
  constructor(private editor: Editor) {
    this.handle = this.createHandle()
    this.editor.view.dom.parentElement?.appendChild(this.handle)
    
    // Position handle on hover
    this.editor.view.dom.addEventListener('mousemove', this.updatePosition)
  }
  
  private createHandle() {
    const handle = document.createElement('div')
    handle.className = 'drag-handle'
    handle.innerHTML = '<svg>...</svg>' // Drag icon
    handle.draggable = true
    
    handle.addEventListener('dragstart', this.handleDragStart)
    handle.addEventListener('dragend', this.handleDragEnd)
    
    return handle
  }
  
  private updatePosition = (event: MouseEvent) => {
    const pos = this.editor.view.posAtCoords({
      left: event.clientX,
      top: event.clientY,
    })
    
    if (pos) {
      const node = this.editor.view.nodeDOM(pos.pos)
      if (node && this.isBlockNode(node)) {
        const rect = node.getBoundingClientRect()
        this.handle.style.cssText = `
          display: block;
          top: ${rect.top}px;
          left: ${rect.left - 30}px;
        `
      }
    }
  }
}
```

## AI Learning & Feedback Loops {#ai-learning}

### Interaction Tracking System

```typescript
// features/ai/lib/learning-system.ts
export class AILearningSystem {
  private readonly LEARNING_EVENTS = {
    GHOST_TEXT_ACCEPTED: 'ghost_text_accepted',
    GHOST_TEXT_REJECTED: 'ghost_text_rejected',
    QUICK_ACTION_USED: 'quick_action_used',
    TOOL_CALL_SUCCESS: 'tool_call_success',
    TOOL_CALL_FAILURE: 'tool_call_failure',
    TRANSFORMATION_ACCEPTED: 'transformation_accepted',
    TRANSFORMATION_MODIFIED: 'transformation_modified',
  }
  
  async trackInteraction(event: LearningEvent) {
    // Store raw interaction data
    await db.insert(aiLearningEvents).values({
      userId: event.userId,
      eventType: event.type,
      context: event.context,
      input: event.input,
      output: event.output,
      metadata: {
        modelUsed: event.model,
        temperature: event.temperature,
        timestamp: new Date(),
        sessionId: event.sessionId,
      },
    })
    
    // Process for immediate learning
    await this.processForRealTimeLearning(event)
    
    // Queue for batch analysis
    await this.queueForBatchAnalysis(event)
  }
  
  private async processForRealTimeLearning(event: LearningEvent) {
    switch (event.type) {
      case this.LEARNING_EVENTS.GHOST_TEXT_ACCEPTED:
        await this.updateGhostTextPreferences(event)
        break
        
      case this.LEARNING_EVENTS.QUICK_ACTION_USED:
        await this.updateQuickActionRanking(event)
        break
        
      case this.LEARNING_EVENTS.TRANSFORMATION_MODIFIED:
        await this.analyzeModificationPatterns(event)
        break
    }
  }
  
  private async updateGhostTextPreferences(event: LearningEvent) {
    const { userId, context, output } = event
    
    // Extract patterns from accepted completions
    const patterns = this.extractCompletionPatterns(context, output)
    
    // Update user's completion preferences
    await db.update(userPreferences)
      .set({
        completionPatterns: sql`
          array_append(completion_patterns, ${patterns})
        `,
        lastUpdated: new Date(),
      })
      .where(eq(userPreferences.userId, userId))
  }
  
  async getPersonalizedSuggestions(userId: string, context: string) {
    // Fetch user's learned preferences
    const preferences = await this.getUserPreferences(userId)
    
    // Analyze context similarity with past interactions
    const similarInteractions = await this.findSimilarInteractions(
      userId,
      context,
      limit: 10
    )
    
    // Generate personalized prompt adjustments
    return {
      systemPromptAdjustments: this.generatePromptAdjustments(
        preferences,
        similarInteractions
      ),
      temperatureOverride: this.calculateOptimalTemperature(
        similarInteractions
      ),
      // Boost certain completion patterns based on acceptance rate
      completionBiases: this.calculateCompletionBiases(preferences),
    }
  }
}
```

### Feedback Processing Pipeline

```typescript
// features/ai/services/feedback-processor.ts
export class FeedbackProcessor {
  async processBatch() {
    // Run daily to analyze interaction patterns
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    const events = await db
      .select()
      .from(aiLearningEvents)
      .where(gte(aiLearningEvents.timestamp, yesterday))
    
    // Group by user and analyze patterns
    const userPatterns = this.groupByUser(events)
    
    for (const [userId, userEvents] of userPatterns) {
      const analysis = {
        acceptanceRate: this.calculateAcceptanceRate(userEvents),
        preferredActions: this.identifyPreferredActions(userEvents),
        writingStyle: this.analyzeWritingStyle(userEvents),
        commonModifications: this.findCommonModifications(userEvents),
      }
      
      // Update user model
      await this.updateUserModel(userId, analysis)
      
      // Generate insights for improving AI
      const insights = this.generateInsights(analysis)
      await this.storeInsights(userId, insights)
    }
  }
  
  private analyzeWritingStyle(events: LearningEvent[]) {
    const acceptedTexts = events
      .filter(e => e.eventType.includes('accepted'))
      .map(e => e.output)
    
    return {
      averageLength: this.calculateAverageLength(acceptedTexts),
      vocabularyComplexity: this.analyzeVocabulary(acceptedTexts),
      sentenceStructure: this.analyzeSentencePatterns(acceptedTexts),
      tonePreference: this.identifyTone(acceptedTexts),
    }
  }
}
```

## API Architecture {#api-architecture}

### Edge Runtime APIs

All AI endpoints use Edge Runtime for optimal performance:

```typescript
// app/api/ai/completion/route.ts
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

export const runtime = 'edge'

export async function POST(req: Request) {
  const { prompt, mode, preferences } = await req.json()
  
  // Get personalized settings
  const userId = await getUserId(req)
  const personalization = await learningSystem.getPersonalizedSuggestions(
    userId,
    prompt
  )
  
  // Select model based on mode
  const model = mode === 'ghost-text' 
    ? openai('gpt-4o-mini')
    : openai('gpt-4-turbo')
  
  const result = await streamText({
    model,
    system: `${AI_SYSTEM_PROMPTS[mode]}
      ${personalization.systemPromptAdjustments}`,
    prompt,
    temperature: personalization.temperatureOverride || AI_CONFIG.temperature[mode],
    maxTokens: AI_CONFIG.maxTokens[mode],
    
    // Track usage for learning
    onFinish: async ({ text, usage }) => {
      await learningSystem.trackInteraction({
        userId,
        type: 'completion',
        input: prompt,
        output: text,
        model: model.modelId,
        usage,
      })
    },
  })
  
  return result.toDataStreamResponse()
}
```

### Tool Calling API

```typescript
// app/api/chats/[chatId]/messages/route.ts
export async function POST(req: Request, { params }: { params: { chatId: string } }) {
  const { messages, noteContext } = await req.json()
  
  const result = await streamText({
    model: openai('gpt-4-turbo'),
    messages: [
      {
        role: 'system',
        content: `You are an AI assistant with access to the user's notes.
          Current context: ${JSON.stringify(noteContext)}`,
      },
      ...messages,
    ],
    
    tools: {
      create_note: {
        description: 'Create a new note',
        parameters: createNoteSchema,
        execute: async (args) => {
          const result = await noteTools.create_note.execute(args, {
            userId,
            chatId: params.chatId,
          })
          
          // Log tool usage
          await learningSystem.trackInteraction({
            type: 'tool_call',
            tool: 'create_note',
            args,
            result,
            success: !!result,
          })
          
          return result
        },
      },
      // Other tools...
    },
    
    // Enable parallel tool calls
    maxToolRoundtrips: 3,
    toolChoice: 'auto',
  })
  
  return result.toDataStreamResponse()
}
```

### Database Operations

```typescript
// app/api/notes/[noteId]/route.ts
export async function PATCH(req: Request, { params }: { params: { noteId: string } }) {
  const session = await getSession()
  if (!session) return unauthorized()
  
  const { content, title } = await req.json()
  
  // Validate ownership
  const note = await db.query.notes.findFirst({
    where: and(
      eq(notes.id, params.noteId),
      eq(notes.userId, session.userId)
    ),
  })
  
  if (!note) return notFound()
  
  // Update with optimistic locking
  const [updated] = await db
    .update(notes)
    .set({
      content,
      title,
      updatedAt: new Date(),
      version: sql`version + 1`,
    })
    .where(
      and(
        eq(notes.id, params.noteId),
        eq(notes.version, note.version)
      )
    )
    .returning()
  
  if (!updated) {
    return conflict('Note was modified by another request')
  }
  
  return json(updated)
}
```

## Performance Optimizations

### 1. Virtual Scrolling for Chat

```typescript
// features/chat/components/virtual-message-list.tsx
export function VirtualMessageList({ messages, height }) {
  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 100, // Estimated message height
    overscan: 5,
  })
  
  return (
    <div ref={scrollRef} style={{ height, overflow: 'auto' }}>
      <div style={{ height: rowVirtualizer.getTotalSize() }}>
        {rowVirtualizer.getVirtualItems().map(virtualItem => (
          <MessageItem
            key={messages[virtualItem.index].id}
            message={messages[virtualItem.index]}
            style={{
              position: 'absolute',
              top: virtualItem.start,
              height: virtualItem.size,
            }}
          />
        ))}
      </div>
    </div>
  )
}
```

### 2. Debounced Operations

```typescript
// features/editor/hooks/use-debounced-save.ts
export function useDebouncedSave(noteId: string, content: string) {
  const saveNote = useMutation({
    mutationFn: async (content: string) => {
      return fetch(`/api/notes/${noteId}`, {
        method: 'PATCH',
        body: JSON.stringify({ content }),
      })
    },
  })
  
  const debouncedSave = useMemo(
    () => debounce((content: string) => {
      saveNote.mutate(content)
    }, 1000),
    [noteId]
  )
  
  useEffect(() => {
    if (content) {
      debouncedSave(content)
    }
  }, [content, debouncedSave])
  
  return saveNote
}
```

### 3. Optimistic Updates

```typescript
// features/organization/stores/content-store.ts
export const useContentStore = create<ContentStore>((set, get) => ({
  updateNote: async (noteId: string, updates: Partial<Note>) => {
    // Optimistic update
    set(state => ({
      notes: state.notes.map(note =>
        note.id === noteId ? { ...note, ...updates } : note
      ),
    }))
    
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update note')
      }
      
      const updated = await response.json()
      
      // Reconcile with server response
      set(state => ({
        notes: state.notes.map(note =>
          note.id === noteId ? updated : note
        ),
      }))
    } catch (error) {
      // Revert optimistic update
      set(state => ({
        notes: get().notes, // Restore previous state
      }))
      throw error
    }
  },
}))
```

## Conclusion

NoteChat's technical architecture represents a sophisticated integration of modern web technologies with AI capabilities. The system's strength lies in its:

1. **Streaming-first architecture** for responsive AI interactions
2. **Comprehensive learning system** that improves with usage
3. **Modular extension system** for the block editor
4. **Performance optimizations** throughout the stack
5. **Edge runtime deployment** for global low latency

The combination of Vercel AI SDK, TipTap, and custom extensions creates a unique platform that seamlessly blends traditional note-taking with AI-powered intelligence, setting a new standard for knowledge management applications.