# Epic 5: AI Commands & Transformations 🎯

## Overview
**Goal**: Build a comprehensive command system for text transformations and AI-powered note organization  
**Duration**: 2 sprints (1 week)  
**Prerequisites**: Epic 4 (AI Writing Assistant) completed - we need the inline AI infrastructure  
**Outcome**: Users can transform text with natural language commands and AI automatically organizes their knowledge base

## Success Criteria
- **Command Performance**: <2s execution time for all transformations
- **Discovery**: 80% of users discover slash commands in first session
- **Smart Collections Accuracy**: >85% relevant note suggestions
- **Command Success Rate**: >95% successful executions
- **Organization Efficiency**: 50% reduction in manual categorization time
- **UI Responsiveness**: Command menu renders in <50ms
- **Pattern Recognition**: AI identifies meaningful patterns in 90% of note sets

## Context & Motivation

This epic transforms AI Notes from a writing tool into an intelligent knowledge management system. While previous epics focused on real-time assistance, Epic 5 introduces powerful batch operations and intelligent organization:

- **Command-Driven Workflows**: Power users can transform entire documents with simple commands
- **Intelligent Organization**: AI understands your knowledge structure and suggests organization
- **Extensible Framework**: A command system that can grow with user needs
- **Zero-Friction Transformations**: Natural language commands that just work

This is where AI Notes becomes not just a tool for creating knowledge, but for managing and evolving it over time.

## Features

### F10: Slash Commands
**Epic**: 2 | **Sprint**: 1 | **Complexity**: Small

#### User Story
As a student, I want to quickly transform my text with commands so that I can reformat notes for different purposes.

#### Acceptance Criteria
- [ ] Type "/" anywhere in editor to trigger command menu
- [ ] Core commands implemented: /summarize, /expand, /bullets, /rewrite, /explain, /fix, /translate
- [ ] Works on selection or current paragraph if no selection
- [ ] Command menu shows with fuzzy search
- [ ] Keyboard navigation (arrow keys, enter, escape)
- [ ] Shows loading state during processing
- [ ] Can undo transformation (preserves original)
- [ ] Smooth replacement animation
- [ ] Command shortcuts (e.g., /sum for /summarize)
- [ ] Recent commands shown at top
- [ ] Custom command creation supported

#### Business Rules
1. Commands process max 5000 characters
2. Original text saved for undo functionality
3. Rate limited with user's AI quota
4. Command history persisted per user
5. Timeout after 30 seconds with graceful failure

### F11: Smart Collections
**Epic**: 2 | **Sprint**: 1 | **Complexity**: Large

#### User Story
As a user, I want AI to automatically organize my notes so that I don't have to manually categorize everything.

#### Acceptance Criteria
- [ ] AI analyzes all notes for patterns and themes
- [ ] Suggests collection names with descriptions
- [ ] Shows confidence scores for suggestions
- [ ] Can accept/reject/modify suggestions
- [ ] Dynamic rules: by topic, date, type, keywords, writing style
- [ ] Updates suggestions as new notes are added
- [ ] Manual override always possible
- [ ] Visual indicators distinguish AI vs manual collections
- [ ] Batch accept/reject for efficiency
- [ ] Can convert smart to manual collection

#### Business Rules
1. Analysis runs daily or on-demand
2. Max 5 smart collections per space
3. Minimum 3 notes required for pattern detection
4. Suggestions expire after 7 days if not acted upon
5. User actions train the AI for better future suggestions

## Sprints

### Sprint 5.1: Slash Commands (3 days)

#### Day 1: Command Infrastructure & Registry

**Command System Architecture**
- **Command Registry**: Extensible system for registering commands
  - Built-in commands with consistent interface
  - Plugin architecture for custom commands
  - Command aliasing and shortcuts
  - Category organization

- **Command Parser**: Natural language understanding
  - Fuzzy matching for command names
  - Parameter extraction from commands
  - Context awareness (selection vs paragraph)
  - Multi-language support prep

- **Execution Engine**: Reliable command processing
  - Queue management for multiple commands
  - Cancellation support
  - Progress tracking
  - Error recovery

#### Day 2: Core Commands Implementation

**Text Transformation Commands**
- **/summarize**: AI-powered summarization
  - Multiple summary lengths (brief, standard, detailed)
  - Key points extraction
  - Maintains original tone
  
- **/expand**: Elaborate on content
  - Context-aware expansion
  - Adds examples and details
  - Preserves original structure

- **/bullets**: Convert to bullet points
  - Smart paragraph parsing
  - Nested bullet support
  - Maintains logical flow

- **/rewrite**: Multiple style options
  - Formal/casual/technical/creative
  - Tone preservation options
  - Grammar improvement

- **/explain**: Simplify complex text
  - ELI5 mode
  - Technical term definitions
  - Concept breakdown

- **/fix**: Grammar and style correction
  - Spelling, grammar, punctuation
  - Style consistency
  - Readability improvements

- **/translate**: Multi-language support
  - Auto-detect source language
  - Common languages supported
  - Preserves formatting

#### Day 3: Command UI & Polish

**Command Menu Interface**
- **Visual Design**: Polished command palette
  - Glass morphism styling
  - Smooth animations
  - Category grouping
  - Icon system

- **Interaction Patterns**:
  - Keyboard-first navigation
  - Mouse support
  - Touch-friendly on mobile
  - Accessibility compliant

- **Performance Optimizations**:
  - Virtual scrolling for long lists
  - Debounced search
  - Preloaded common commands
  - Instant feedback

### Sprint 5.2: Smart Collections (4 days)

#### Day 1: AI Analysis Engine

**Pattern Recognition System**
- **Content Analysis**: Deep understanding of notes
  - Topic extraction using embeddings
  - Keyword frequency analysis
  - Writing style patterns
  - Temporal patterns

- **Clustering Algorithm**: Intelligent grouping
  - Similarity scoring between notes
  - Hierarchical clustering
  - Optimal group size detection
  - Outlier handling

- **Suggestion Generation**: Meaningful collections
  - Natural naming based on themes
  - Descriptive summaries
  - Confidence scoring
  - Rule generation

#### Day 2: Smart Collection Rules

**Rule Engine**
- **Rule Types**:
  - Content-based (keywords, topics, entities)
  - Metadata-based (dates, tags, length)
  - Style-based (formal, technical, creative)
  - Relationship-based (linked notes, references)

- **Rule Evaluation**:
  - Real-time note matching
  - Composite rule support (AND/OR)
  - Fuzzy matching options
  - Performance optimization

- **Dynamic Updates**:
  - New note evaluation
  - Rule refinement based on feedback
  - Suggestion evolution
  - Batch processing

#### Day 3: Collection Management UI

**Suggestion Interface**
- **Discovery Flow**:
  - AI analysis trigger
  - Progress visualization
  - Results presentation
  - Action interface

- **Review Interface**:
  - Card-based suggestions
  - Confidence indicators
  - Preview of matching notes
  - Bulk actions

- **Customization Options**:
  - Rename suggestions
  - Modify rules
  - Merge collections
  - Split collections

#### Day 4: Integration & Intelligence

**System Integration**
- **Space Integration**: Collections within spaces
  - Smart collections per space
  - Cross-space patterns
  - Global vs local collections

- **Learning System**: Improving over time
  - User feedback incorporation
  - Pattern refinement
  - Personalization
  - A/B testing

- **Performance & Scale**:
  - Incremental analysis
  - Caching strategies
  - Background processing
  - Resource management

## Technical Architecture

### Command System Architecture

```typescript
// Core command system
interface Command {
  id: string
  name: string
  description: string
  category: CommandCategory
  aliases: string[]
  parameters?: CommandParameter[]
  execute: (context: CommandContext) => Promise<CommandResult>
  canExecute?: (context: CommandContext) => boolean
  preview?: (context: CommandContext) => Promise<string>
}

interface CommandContext {
  editor: Editor
  selection?: string
  fullText: string
  cursorPosition: number
  noteMetadata?: NoteMetadata
  userPreferences: UserPreferences
}

interface CommandResult {
  success: boolean
  output?: string
  error?: Error
  undo?: () => void
  analytics?: CommandAnalytics
}

// Command registry
class CommandRegistry {
  private commands = new Map<string, Command>()
  private aliases = new Map<string, string>()
  private history: CommandHistoryEntry[] = []
  
  register(command: Command): void {
    this.commands.set(command.id, command)
    command.aliases.forEach(alias => {
      this.aliases.set(alias.toLowerCase(), command.id)
    })
  }
  
  async execute(
    commandName: string, 
    context: CommandContext
  ): Promise<CommandResult> {
    const command = this.findCommand(commandName)
    if (!command) {
      throw new CommandNotFoundError(commandName)
    }
    
    if (command.canExecute && !command.canExecute(context)) {
      throw new CommandNotExecutableError(commandName)
    }
    
    // Track execution
    const startTime = performance.now()
    
    try {
      const result = await command.execute(context)
      
      // Record history
      this.history.push({
        commandId: command.id,
        timestamp: new Date(),
        duration: performance.now() - startTime,
        success: result.success,
      })
      
      return result
    } catch (error) {
      // Error handling and recovery
      return {
        success: false,
        error: error as Error,
      }
    }
  }
  
  search(query: string): Command[] {
    const normalizedQuery = query.toLowerCase()
    const results: Array<{command: Command; score: number}> = []
    
    this.commands.forEach(command => {
      const score = this.calculateMatchScore(command, normalizedQuery)
      if (score > 0) {
        results.push({ command, score })
      }
    })
    
    return results
      .sort((a, b) => b.score - a.score)
      .map(r => r.command)
  }
}
```

### Smart Collections Architecture

```typescript
// Smart collection system
interface SmartCollection {
  id: string
  name: string
  description: string
  icon: string
  rules: CollectionRule[]
  matchedNotes: string[]
  suggestedNotes: string[]
  confidence: number
  isActive: boolean
  createdAt: Date
  lastUpdated: Date
}

interface CollectionRule {
  id: string
  type: 'content' | 'metadata' | 'style' | 'relationship'
  field: string
  operator: RuleOperator
  value: any
  weight: number
}

class SmartCollectionEngine {
  private analyzer: NoteAnalyzer
  private clusterer: NoteClustering
  private ruleEngine: RuleEngine
  
  async analyzeNotes(notes: Note[]): Promise<CollectionSuggestion[]> {
    // Extract features from all notes
    const features = await this.analyzer.extractFeatures(notes)
    
    // Perform clustering
    const clusters = await this.clusterer.cluster(features)
    
    // Generate suggestions from clusters
    const suggestions = await Promise.all(
      clusters.map(cluster => this.generateSuggestion(cluster))
    )
    
    // Filter and rank suggestions
    return this.rankSuggestions(suggestions)
  }
  
  private async generateSuggestion(
    cluster: NoteCluster
  ): Promise<CollectionSuggestion> {
    // Extract common patterns
    const patterns = this.extractPatterns(cluster)
    
    // Generate natural name and description
    const { name, description } = await this.generateMetadata(patterns)
    
    // Create rules that would match this cluster
    const rules = this.generateRules(patterns)
    
    // Calculate confidence based on cluster cohesion
    const confidence = this.calculateConfidence(cluster)
    
    return {
      name,
      description,
      icon: this.selectIcon(patterns),
      rules,
      noteIds: cluster.noteIds,
      confidence,
      patterns,
    }
  }
}

// Note analyzer using AI
class NoteAnalyzer {
  async extractFeatures(notes: Note[]): Promise<NoteFeatures[]> {
    return Promise.all(notes.map(async note => {
      // Generate embeddings for semantic similarity
      const embedding = await this.generateEmbedding(note.content)
      
      // Extract topics and entities
      const { topics, entities } = await this.extractTopicsAndEntities(note)
      
      // Analyze writing style
      const style = this.analyzeStyle(note.content)
      
      // Extract temporal patterns
      const temporal = this.extractTemporalPatterns(note)
      
      return {
        noteId: note.id,
        embedding,
        topics,
        entities,
        style,
        temporal,
        metadata: {
          wordCount: note.content.split(' ').length,
          created: note.createdAt,
          modified: note.updatedAt,
          tags: note.tags,
        }
      }
    }))
  }
}
```

### Command Execution Pipeline

```typescript
class CommandExecutor {
  private queue: CommandQueueItem[] = []
  private processing = false
  
  async executeCommand(
    command: Command,
    context: CommandContext
  ): Promise<CommandResult> {
    // Add to queue
    const queueItem = {
      id: generateId(),
      command,
      context,
      status: 'pending' as const,
      promise: null as Promise<CommandResult> | null,
    }
    
    this.queue.push(queueItem)
    
    // Process queue
    if (!this.processing) {
      this.processQueue()
    }
    
    // Return promise for this command
    return queueItem.promise!
  }
  
  private async processQueue() {
    this.processing = true
    
    while (this.queue.length > 0) {
      const item = this.queue.find(i => i.status === 'pending')
      if (!item) break
      
      item.status = 'processing'
      
      try {
        // Show loading state
        this.showLoadingState(item)
        
        // Execute with timeout
        const result = await this.executeWithTimeout(
          item.command,
          item.context,
          30000 // 30s timeout
        )
        
        // Apply transformation
        if (result.success && result.output) {
          await this.applyTransformation(
            item.context.editor,
            result.output,
            item.context.selection
          )
        }
        
        item.status = 'completed'
        item.promise = Promise.resolve(result)
        
      } catch (error) {
        item.status = 'failed'
        item.promise = Promise.resolve({
          success: false,
          error: error as Error,
        })
      } finally {
        this.hideLoadingState(item)
      }
    }
    
    this.processing = false
  }
}
```

## UI/UX Design Patterns

### Slash Command Menu Design
```
┌─────────────────────────────────────┐
│ 🔍 Search commands...               │
├─────────────────────────────────────┤
│ RECENT                              │
│ 📝 /summarize  - Last used 2m ago   │
│ ✍️  /rewrite   - Last used 1h ago   │
├─────────────────────────────────────┤
│ ALL COMMANDS                        │
│ 📝 /summarize  - Create a summary   │
│ 🔍 /expand     - Add more detail    │
│ •  /bullets    - Convert to list    │
│ ✍️  /rewrite   - Change style       │
│ 💡 /explain    - Simplify text      │
│ ✓  /fix        - Fix grammar        │
│ 🌐 /translate  - Change language    │
└─────────────────────────────────────┘
  ↑/↓ Navigate  Enter Select  Esc Cancel
```

### Smart Collection Suggestion Card
```
┌─────────────────────────────────────┐
│ 📚 Suggested Collection             │
│                                     │
│ Name: "Project Planning Notes"      │
│ ════════════════════════════════    │
│                                     │
│ 📊 85% confidence                   │
│                                     │
│ Found 12 related notes about        │
│ project management, timelines,      │
│ and task organization.              │
│                                     │
│ Rules:                              │
│ • Contains "project" or "plan"      │
│ • Created in last 30 days           │
│ • Has task-related keywords         │
│                                     │
│ Matching Notes:                     │
│ • Q1 Project Roadmap               │
│ • Sprint Planning Notes            │
│ • Feature Prioritization           │
│ + 9 more...                        │
│                                     │
│ [Accept] [Modify] [Reject]         │
└─────────────────────────────────────┘
```

### Command Loading States
```
Before: "This is my original text"
         ↓ User types /summarize
During: "This is my original text"
        ✨ Summarizing...
         ↓ 
After:  "Here's a concise summary of the key points."
```

## Implementation Details

### File Structure
```
features/commands/
├── components/
│   ├── slash-command-menu.tsx
│   ├── command-item.tsx
│   ├── command-preview.tsx
│   └── loading-indicator.tsx
├── registry/
│   ├── command-registry.ts
│   ├── built-in-commands.ts
│   └── command-types.ts
├── extensions/
│   └── slash-command-extension.ts
├── services/
│   ├── command-executor.ts
│   ├── transformation-service.ts
│   └── command-analytics.ts
└── hooks/
    ├── use-command-menu.ts
    └── use-command-history.ts

features/smart-collections/
├── components/
│   ├── smart-collection-creator.tsx
│   ├── collection-suggestions.tsx
│   ├── suggestion-card.tsx
│   ├── rule-builder.tsx
│   └── collection-manager.tsx
├── engine/
│   ├── collection-engine.ts
│   ├── note-analyzer.ts
│   ├── pattern-detector.ts
│   └── rule-engine.ts
├── services/
│   ├── suggestion-service.ts
│   ├── clustering-service.ts
│   └── learning-service.ts
└── hooks/
    ├── use-smart-collections.ts
    └── use-collection-suggestions.ts
```

### Built-in Commands Implementation

```typescript
// features/commands/registry/built-in-commands.ts
export const builtInCommands: Command[] = [
  {
    id: 'summarize',
    name: 'Summarize',
    description: 'Create a concise summary',
    category: 'transformation',
    aliases: ['sum', 'tldr'],
    parameters: [
      {
        name: 'length',
        type: 'enum',
        options: ['brief', 'standard', 'detailed'],
        default: 'standard',
      }
    ],
    execute: async (context) => {
      const { text } = await generateText({
        model: openai('gpt-4-turbo'),
        messages: [
          {
            role: 'system',
            content: 'Summarize the text concisely while preserving key information.',
          },
          {
            role: 'user',
            content: context.selection || context.fullText,
          }
        ],
        temperature: 0.3,
        maxTokens: 200,
      })
      
      return {
        success: true,
        output: text,
        undo: () => context.editor.commands.undo(),
      }
    },
    preview: async (context) => {
      const wordCount = context.selection?.split(' ').length || 0
      return `Summarize ${wordCount} words into key points`
    }
  },
  
  {
    id: 'bullets',
    name: 'Convert to Bullets',
    description: 'Transform into bullet points',
    category: 'formatting',
    aliases: ['list', 'bulletize'],
    execute: async (context) => {
      const { object } = await generateObject({
        model: openai('gpt-4-turbo'),
        schema: z.object({
          bullets: z.array(z.string()),
          subBullets: z.array(z.array(z.string())).optional(),
        }),
        prompt: `Convert this text into clear, logical bullet points:\n\n${context.selection}`,
      })
      
      // Format bullets with proper nesting
      let output = ''
      object.bullets.forEach((bullet, i) => {
        output += `• ${bullet}\n`
        if (object.subBullets?.[i]) {
          object.subBullets[i].forEach(sub => {
            output += `  ◦ ${sub}\n`
          })
        }
      })
      
      return {
        success: true,
        output: output.trim(),
        undo: () => context.editor.commands.undo(),
      }
    }
  },
  
  {
    id: 'rewrite',
    name: 'Rewrite',
    description: 'Rewrite in a different style',
    category: 'transformation',
    aliases: ['rephrase', 'reword'],
    parameters: [
      {
        name: 'style',
        type: 'enum',
        options: ['formal', 'casual', 'technical', 'creative', 'concise'],
        required: true,
      }
    ],
    execute: async (context, params) => {
      const style = params.style || 'formal'
      const stylePrompts = {
        formal: 'Rewrite this text in a formal, professional tone',
        casual: 'Rewrite this text in a casual, conversational tone',
        technical: 'Rewrite this text with technical precision',
        creative: 'Rewrite this text with creative flair',
        concise: 'Rewrite this text to be more concise and direct',
      }
      
      const { text } = await generateText({
        model: openai('gpt-4-turbo'),
        prompt: `${stylePrompts[style]}:\n\n${context.selection}`,
        temperature: 0.7,
      })
      
      return {
        success: true,
        output: text,
        undo: () => context.editor.commands.undo(),
      }
    }
  },
]
```

### Smart Collection Analysis Implementation

```typescript
// features/smart-collections/engine/collection-engine.ts
export class SmartCollectionEngine {
  private readonly minNotesForPattern = 3
  private readonly maxSuggestionsPerSpace = 5
  
  async analyzeSpace(spaceId: string, notes: Note[]): Promise<CollectionSuggestion[]> {
    if (notes.length < this.minNotesForPattern) {
      return []
    }
    
    // Step 1: Extract features from all notes
    const features = await this.extractNoteFeatures(notes)
    
    // Step 2: Find patterns using multiple strategies
    const patterns = await Promise.all([
      this.findTopicPatterns(features),
      this.findTemporalPatterns(features),
      this.findStylePatterns(features),
      this.findEntityPatterns(features),
    ])
    
    // Step 3: Merge and rank patterns
    const mergedPatterns = this.mergePatterns(patterns.flat())
    
    // Step 4: Generate suggestions from top patterns
    const suggestions = await Promise.all(
      mergedPatterns
        .slice(0, this.maxSuggestionsPerSpace)
        .map(pattern => this.patternToSuggestion(pattern))
    )
    
    return suggestions.filter(s => s.confidence > 0.7)
  }
  
  private async findTopicPatterns(features: NoteFeatures[]): Promise<Pattern[]> {
    // Use embeddings to find semantic clusters
    const embeddings = features.map(f => f.embedding)
    const clusters = await this.clusterByEmbeddings(embeddings)
    
    return clusters.map(cluster => ({
      type: 'topic',
      noteIds: cluster.noteIds,
      strength: cluster.cohesion,
      metadata: {
        centroid: cluster.centroid,
        keywords: this.extractKeywords(cluster),
      }
    }))
  }
  
  private async patternToSuggestion(pattern: Pattern): Promise<CollectionSuggestion> {
    const notes = pattern.noteIds.map(id => this.getNoteById(id))
    
    // Generate name and description using AI
    const { object: metadata } = await generateObject({
      model: openai('gpt-4-turbo'),
      schema: z.object({
        name: z.string(),
        description: z.string(),
        icon: z.string(),
        keywords: z.array(z.string()),
      }),
      prompt: `Analyze these notes and suggest a collection name:
      
      ${notes.map(n => `- ${n.title}: ${n.content.slice(0, 100)}...`).join('\n')}
      
      Pattern type: ${pattern.type}
      Common elements: ${JSON.stringify(pattern.metadata)}
      
      Provide a clear, descriptive name and explanation.`,
    })
    
    // Generate rules that would capture this pattern
    const rules = this.generateRulesFromPattern(pattern, metadata.keywords)
    
    return {
      id: generateId(),
      name: metadata.name,
      description: metadata.description,
      icon: metadata.icon,
      rules,
      noteIds: pattern.noteIds,
      confidence: pattern.strength,
      metadata: pattern.metadata,
    }
  }
}
```

## Error Handling & Recovery

### Command Error Handling

```typescript
class CommandErrorHandler {
  handleCommandError(error: Error, command: Command, context: CommandContext): void {
    // Categorize error
    const errorType = this.categorizeError(error)
    
    switch (errorType) {
      case 'timeout':
        this.showTimeoutError(command)
        this.offerRetry(command, context)
        break
        
      case 'rate_limit':
        this.showRateLimitError()
        this.showUpgradePrompt()
        break
        
      case 'invalid_selection':
        this.showSelectionError()
        this.highlightValidSelections()
        break
        
      case 'ai_error':
        this.showAIError()
        this.offerAlternativeCommand()
        break
        
      default:
        this.showGenericError(error)
        this.logError(error, command, context)
    }
  }
  
  async recoverFromError(
    error: Error,
    command: Command,
    context: CommandContext
  ): Promise<CommandResult | null> {
    // Try recovery strategies
    const strategies = [
      () => this.retryWithBackoff(command, context),
      () => this.tryAlternativeModel(command, context),
      () => this.reduceScope(command, context),
      () => this.fallbackToBasicTransform(command, context),
    ]
    
    for (const strategy of strategies) {
      try {
        const result = await strategy()
        if (result?.success) return result
      } catch {
        continue
      }
    }
    
    return null
  }
}
```

### Smart Collection Error Recovery

```typescript
class CollectionErrorRecovery {
  async handleAnalysisFailure(
    notes: Note[],
    error: Error
  ): Promise<CollectionSuggestion[]> {
    // Fallback to simpler analysis
    console.error('Smart collection analysis failed:', error)
    
    // Try basic keyword-based grouping
    try {
      return await this.basicKeywordGrouping(notes)
    } catch {
      // Last resort: group by date
      return this.groupByTimeRange(notes)
    }
  }
  
  private async basicKeywordGrouping(notes: Note[]): Promise<CollectionSuggestion[]> {
    // Extract common words
    const wordFrequency = this.calculateWordFrequency(notes)
    const topKeywords = this.getTopKeywords(wordFrequency, 10)
    
    // Group notes by keyword presence
    const groups = topKeywords.map(keyword => ({
      keyword,
      notes: notes.filter(n => 
        n.content.toLowerCase().includes(keyword.toLowerCase())
      ),
    }))
    
    // Convert to suggestions
    return groups
      .filter(g => g.notes.length >= 3)
      .map(g => ({
        id: generateId(),
        name: `${g.keyword} Notes`,
        description: `Notes containing "${g.keyword}"`,
        icon: '📝',
        rules: [{
          id: generateId(),
          type: 'content',
          field: 'content',
          operator: 'contains',
          value: g.keyword,
          weight: 1,
        }],
        noteIds: g.notes.map(n => n.id),
        confidence: 0.7,
      }))
  }
}
```

## Testing Strategy

### Unit Tests

```typescript
describe('CommandRegistry', () => {
  let registry: CommandRegistry
  
  beforeEach(() => {
    registry = new CommandRegistry()
    registry.register(mockSummarizeCommand)
  })
  
  test('finds command by name', () => {
    const command = registry.findCommand('summarize')
    expect(command).toBeDefined()
    expect(command?.id).toBe('summarize')
  })
  
  test('finds command by alias', () => {
    const command = registry.findCommand('sum')
    expect(command?.id).toBe('summarize')
  })
  
  test('executes command with selection', async () => {
    const context = createMockContext({
      selection: 'Long text to summarize...',
    })
    
    const result = await registry.execute('summarize', context)
    expect(result.success).toBe(true)
    expect(result.output).toContain('summary')
  })
  
  test('handles command timeout', async () => {
    const slowCommand = {
      ...mockSummarizeCommand,
      execute: async () => {
        await delay(35000) // Longer than timeout
        return { success: true }
      },
    }
    
    registry.register(slowCommand)
    await expect(registry.execute('slow', mockContext))
      .rejects.toThrow('Command timeout')
  })
})

describe('SmartCollectionEngine', () => {
  let engine: SmartCollectionEngine
  
  beforeEach(() => {
    engine = new SmartCollectionEngine()
  })
  
  test('identifies topic patterns', async () => {
    const notes = [
      createNote({ content: 'JavaScript async programming' }),
      createNote({ content: 'Promise patterns in JS' }),
      createNote({ content: 'Async/await best practices' }),
    ]
    
    const suggestions = await engine.analyzeNotes(notes)
    
    expect(suggestions).toHaveLength(1)
    expect(suggestions[0].name).toContain('JavaScript')
    expect(suggestions[0].noteIds).toHaveLength(3)
  })
  
  test('respects minimum notes threshold', async () => {
    const notes = [
      createNote({ content: 'Single note' }),
      createNote({ content: 'Another note' }),
    ]
    
    const suggestions = await engine.analyzeNotes(notes)
    expect(suggestions).toHaveLength(0)
  })
  
  test('generates appropriate rules', async () => {
    const notes = createProjectNotes(5)
    const suggestions = await engine.analyzeNotes(notes)
    
    const rules = suggestions[0].rules
    expect(rules).toContainEqual(
      expect.objectContaining({
        field: 'content',
        operator: 'contains',
        value: 'project',
      })
    )
  })
})
```

### Integration Tests

- Command menu appears on "/" key
- Commands execute within 2s timeout
- Undo restores original text
- Smart collections update with new notes
- User feedback improves suggestions

### E2E Test Scenarios

1. **Command Workflow**
   - Type text → Select → Type / → Choose command → See result
   - Multiple commands in sequence
   - Undo/redo command transformations

2. **Smart Collection Flow**
   - Create 10 notes → Trigger analysis → Review suggestions → Accept collection
   - Add new note → See collection update
   - Modify rules → See membership change

3. **Error Recovery**
   - Slow network → Command retries → Success
   - Rate limit → See upgrade prompt → Continue with basic

### Performance Benchmarks
- Command menu renders: <50ms ✓
- Command execution: <2s for 95% ✓
- Smart analysis for 100 notes: <5s ✓
- Rule evaluation per note: <10ms ✓
- UI remains responsive during processing ✓

## Accessibility & Internationalization

### Accessibility Features
- Full keyboard navigation for command menu
- Screen reader announcements for commands
- High contrast mode for visual indicators
- Clear focus states throughout
- Alternative text for all icons

### Internationalization Prep
- Command names and descriptions extracted
- Multi-language command aliases
- Locale-aware collection naming
- RTL support for command menu
- Date/time formatting for temporal rules

## Analytics & Monitoring

### Key Metrics to Track

```typescript
interface CommandAnalytics {
  // Usage metrics
  totalCommandsExecuted: number
  commandUsageByType: Record<string, number>
  averageExecutionTime: number
  successRate: number
  
  // User behavior
  discoveryMethod: 'slash' | 'menu' | 'shortcut'
  commandsPerSession: number
  mostUsedCommands: string[]
  customCommandsCreated: number
  
  // Performance
  timeToFirstCommand: number
  commandLatency: Percentiles
  errorRate: number
  timeoutRate: number
}

interface SmartCollectionAnalytics {
  // Adoption metrics
  collectionsCreated: number
  suggestionsAccepted: number
  suggestionsRejected: number
  acceptanceRate: number
  
  // Quality metrics
  averageConfidenceScore: number
  notesPerCollection: number
  ruleAccuracy: number
  falsePositiveRate: number
  
  // Engagement
  collectionsActivelyUsed: number
  manualAdjustments: number
  conversionToManual: number
}
```

### Real-time Monitoring
- Command execution tracking
- Error rate monitoring
- Performance degradation alerts
- User satisfaction signals

## Security & Privacy Considerations

### Data Protection
- Text transformations happen server-side
- No command history stored permanently
- Collection patterns anonymized
- User content never used for training

### Rate Limiting
- Per-user command quotas
- Burst protection
- Graceful degradation
- Clear quota visibility

## Migration & Upgrade Path

### Future Enhancements
- Custom command creation UI
- Command macros and chains
- Voice-triggered commands
- Cross-note batch operations
- AI command learning from usage

### Extensibility
- Plugin API for custom commands
- Community command marketplace
- Team-shared commands
- Command version control

## Success Metrics

### User Engagement
- 60% discover slash commands in first session
- 40% use commands daily
- 80% accept at least one smart collection
- 25% create custom collection rules

### Technical Health
- <2s command execution (p95)
- <5s smart analysis for 100 notes
- >95% command success rate
- <0.1% error rate

### Business Impact
- 50% reduction in manual organization time
- 30% increase in note creation
- 40% better knowledge retrieval
- 90% user satisfaction with AI organization

## Dependencies

### External Services
- OpenAI API for transformations
- Embeddings API for similarity
- Analytics service
- Error tracking service

### Internal Dependencies
- Epic 4: Inline AI infrastructure
- Epic 3: Chat system for context
- Epic 1: Editor for transformations
- Epic 2: Spaces for collections

### NPM Dependencies
```json
{
  "dependencies": {
    "ai": "^3.x",
    "@ai-sdk/openai": "^0.x",
    "fuse.js": "^7.x",
    "ml-kmeans": "^6.x",
    "natural": "^6.x",
    "commander": "^11.x"
  }
}
```

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|---------|------------|------------|
| Commands too slow | High | Medium | Aggressive caching, timeout handling, progress indicators |
| Poor collection suggestions | High | Medium | User feedback loop, manual override, quality thresholds |
| Command discovery issues | Medium | High | Interactive tutorial, visual hints, command palette |
| AI costs exceed budget | High | Low | Rate limiting, caching, efficient prompts |
| Complex commands confuse users | Medium | Medium | Progressive disclosure, preview mode, undo support |

## Conclusion

Epic 5 transforms AI Notes from an intelligent editor into a comprehensive knowledge management system. By combining powerful text transformations with intelligent organization, users can not only create content efficiently but also maintain and evolve their knowledge base over time.

The slash command system provides power users with lightning-fast transformations, while smart collections ensure that even casual users benefit from AI-powered organization. Together, these features create a system that grows more valuable with use, learning from patterns and adapting to each user's unique knowledge structure.

## Next Steps

With AI Commands & Transformations complete, users can:
- Transform any text with natural language commands
- Access powerful transformations through the slash menu
- Let AI organize their notes into meaningful collections
- Build a self-organizing knowledge base

The next epic (Advanced AI Context) will build on this foundation to add:
- Multi-note reference system
- Cross-note pattern detection
- Knowledge synthesis across collections
- Intelligent contradiction detection