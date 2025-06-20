# Production-Grade Architecture for Real-Time Spell/Grammar Checking

## Current Architecture Issues

Your current architecture has several architectural flaws:

1. **Tight coupling** between React components and ProseMirror plugins
2. **Complex state management** across multiple layers
3. **Unclear ownership** of the checking lifecycle
4. **Race conditions** between worker initialization and editor usage
5. **No clear separation of concerns**

## Industry-Standard Architecture

Here's how production editors actually implement this:

```
┌─────────────────────────────────────────────────────────────┐
│                        React Layer                          │
│  ┌─────────────────┐                                        │
│  │   EditorView    │  (Only handles UI/UX)                  │
│  │                 │                                        │
│  │  - Renders editor                                        │
│  │  - Handles user input                                    │
│  │  - NO business logic                                     │
│  └────────┬────────┘                                        │
│           │                                                 │
└───────────┼─────────────────────────────────────────────────┘
            │
            │ Commands & Queries
            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Editor Core Layer                        │
│  ┌─────────────────┐    ┌─────────────────┐               │
│  │  EditorService  │───▶│ ProseMirror/    │               │
│  │                 │    │ Tiptap Instance │               │
│  │ - Single source │    └─────────────────┘               │
│  │   of truth      │                                       │
│  │ - Manages state │    ┌─────────────────┐               │
│  │ - Event bus     │───▶│ Plugin System   │               │
│  │                 │    │                 │               │
│  └────────┬────────┘    │ - Decorations   │               │
│           │             │ - Transactions  │               │
│           │             │ - Event handlers│               │
│           │             └─────────────────┘               │
└───────────┼─────────────────────────────────────────────────┘
            │
            │ Events
            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Check Service Layer                       │
│  ┌─────────────────┐    ┌─────────────────┐               │
│  │ CheckOrchestrator│───▶│ WorkerPool     │               │
│  │                 │    │                 │               │
│  │ - Debouncing    │    │ - Load balancing│               │
│  │ - Prioritization│    │ - Parallel work │               │
│  │ - Caching       │    │ - Error recovery│               │
│  │ - Retry logic   │    └─────────────────┘               │
│  └─────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
```

## The Correct Implementation

### 1. **Editor Service (Single Source of Truth)**

```typescript
// services/editor/EditorService.ts
import { Editor } from '@tiptap/core'
import { EventEmitter } from 'events'

export class EditorService extends EventEmitter {
  private editor: Editor
  private checkOrchestrator: CheckOrchestrator
  private decorationManager: DecorationManager
  
  constructor() {
    super()
    this.initializeEditor()
    this.initializeServices()
    this.setupEventFlow()
  }
  
  private setupEventFlow() {
    // Editor → Check Service
    this.editor.on('update', ({ editor, transaction }) => {
      if (transaction.docChanged) {
        this.emit('contentChanged', {
          doc: editor.state.doc,
          changes: transaction.steps
        })
      }
    })
    
    // Check Service → Decoration Manager
    this.checkOrchestrator.on('checksComplete', (results) => {
      this.decorationManager.updateDecorations(results)
    })
    
    // Decoration Manager → Editor
    this.decorationManager.on('decorationsUpdated', (decorations) => {
      this.editor.commands.setDecorations(decorations)
    })
  }
  
  // Public API
  public getEditor(): Editor {
    return this.editor
  }
  
  public destroy() {
    this.editor.destroy()
    this.checkOrchestrator.destroy()
    this.removeAllListeners()
  }
}
```

### 2. **Check Orchestrator (Smart Checking Logic)**

```typescript
// services/checking/CheckOrchestrator.ts
export class CheckOrchestrator extends EventEmitter {
  private workerPool: WorkerPool
  private cache: LRUCache<string, CheckResult>
  private pendingChecks: Map<string, AbortController>
  private checkQueue: PriorityQueue<CheckTask>
  
  constructor() {
    super()
    this.workerPool = new WorkerPool({
      workerScript: '/workers/check.worker.js',
      maxWorkers: navigator.hardwareConcurrency || 4,
      warmupTasks: true
    })
    
    this.cache = new LRUCache({ max: 1000 })
    this.pendingChecks = new Map()
    this.checkQueue = new PriorityQueue()
    
    this.startProcessing()
  }
  
  public async checkContent(content: ContentBlock[]): Promise<void> {
    const tasks = content.map(block => this.createCheckTask(block))
    
    // Cancel obsolete checks
    this.cancelObsoleteChecks(tasks)
    
    // Add new tasks to queue
    tasks.forEach(task => {
      if (!this.cache.has(task.cacheKey)) {
        this.checkQueue.enqueue(task)
      }
    })
  }
  
  private async processQueue() {
    while (true) {
      const task = await this.checkQueue.dequeue()
      
      if (this.cache.has(task.cacheKey)) {
        this.emitResults(task.id, this.cache.get(task.cacheKey))
        continue
      }
      
      try {
        const worker = await this.workerPool.getWorker()
        const result = await worker.check(task)
        
        this.cache.set(task.cacheKey, result)
        this.emitResults(task.id, result)
        
      } catch (error) {
        this.handleError(task, error)
      }
    }
  }
  
  private createCheckTask(block: ContentBlock): CheckTask {
    return {
      id: block.id,
      text: block.text,
      cacheKey: hash(block.text),
      priority: block.isVisible ? Priority.HIGH : Priority.LOW,
      timestamp: Date.now(),
      abortController: new AbortController()
    }
  }
}
```

### 3. **Worker Pool (Efficient Resource Usage)**

```typescript
// services/checking/WorkerPool.ts
export class WorkerPool {
  private workers: CheckWorker[]
  private availableWorkers: CheckWorker[]
  private taskQueue: Queue<WorkerTask>
  
  constructor(config: WorkerPoolConfig) {
    this.workers = this.createWorkers(config.maxWorkers)
    this.availableWorkers = [...this.workers]
    this.warmupWorkers()
  }
  
  private createWorkers(count: number): CheckWorker[] {
    return Array.from({ length: count }, (_, i) => 
      new CheckWorker({
        id: i,
        onMessage: this.handleWorkerMessage.bind(this),
        onError: this.handleWorkerError.bind(this)
      })
    )
  }
  
  public async getWorker(): Promise<CheckWorker> {
    // Return available worker or wait for one
    if (this.availableWorkers.length > 0) {
      return this.availableWorkers.pop()!
    }
    
    return new Promise(resolve => {
      this.taskQueue.enqueue({ resolve })
    })
  }
  
  private releaseWorker(worker: CheckWorker) {
    const waiting = this.taskQueue.dequeue()
    if (waiting) {
      waiting.resolve(worker)
    } else {
      this.availableWorkers.push(worker)
    }
  }
}
```

### 4. **Decoration Manager (Clean State Management)**

```typescript
// services/editor/DecorationManager.ts
export class DecorationManager {
  private decorationSets: Map<string, DecorationSet>
  private editor: Editor
  
  constructor(editor: Editor) {
    this.editor = editor
    this.decorationSets = new Map()
    this.installPlugin()
  }
  
  private installPlugin() {
    // Install a single plugin that manages all decorations
    this.editor.registerPlugin(
      new Plugin({
        key: new PluginKey('decorationManager'),
        state: {
          init: () => DecorationSet.empty,
          apply: (tr, decorations) => {
            // Check for decoration updates in transaction
            const newDecorations = tr.getMeta('decorations')
            if (newDecorations) {
              return newDecorations
            }
            // Map through doc changes
            return decorations.map(tr.mapping, tr.doc)
          }
        },
        props: {
          decorations(state) {
            return this.getState(state)
          }
        }
      })
    )
  }
  
  public updateDecorations(checkResults: CheckResult[]) {
    const decorations = this.createDecorations(checkResults)
    
    this.editor.view.dispatch(
      this.editor.state.tr.setMeta('decorations', decorations)
    )
  }
}
```

### 5. **React Integration (Minimal and Clean)**

```typescript
// components/Editor.tsx
export function Editor() {
  const editorService = useRef<EditorService>()
  const [isReady, setIsReady] = useState(false)
  
  useEffect(() => {
    // Create service once
    editorService.current = new EditorService()
    
    editorService.current.on('ready', () => {
      setIsReady(true)
    })
    
    return () => {
      editorService.current?.destroy()
    }
  }, []) // Empty deps - create once
  
  if (!isReady) {
    return <EditorSkeleton />
  }
  
  return (
    <EditorProvider service={editorService.current}>
      <EditorContent />
      <StatusBar />
    </EditorProvider>
  )
}

// Minimal hook for components that need editor access
export function useEditorService() {
  const service = useContext(EditorContext)
  if (!service) {
    throw new Error('useEditorService must be used within EditorProvider')
  }
  return service
}
```

## Key Architectural Principles

### 1. **Separation of Concerns**
- React handles UI only
- Editor service owns editor state
- Check service owns checking logic
- Workers handle computation
- Each layer has a single responsibility

### 2. **Event-Driven Architecture**
- Loosely coupled components
- Clear data flow
- Easy to debug
- Testable in isolation

### 3. **Performance Optimizations**
- Worker pool for parallel processing
- LRU cache for repeated content
- Priority queue for visible content
- Debouncing at the orchestrator level
- Virtual scrolling for large documents

### 4. **Error Resilience**
- Worker crashes don't break the editor
- Retry logic with exponential backoff
- Graceful degradation
- User-visible error states

### 5. **Testing Strategy**
```typescript
// Each layer can be tested independently
describe('CheckOrchestrator', () => {
  it('prioritizes visible content', async () => {
    const orchestrator = new CheckOrchestrator()
    const results = await orchestrator.checkContent([
      { text: 'visible', isVisible: true },
      { text: 'hidden', isVisible: false }
    ])
    
    expect(results[0].id).toBe('visible')
  })
})
```

## What You're Missing

1. **No Service Layer** - Everything is coupled to React components
2. **No Worker Pool** - Single worker is a bottleneck
3. **No Proper Caching** - Rechecking unchanged content
4. **Tight Coupling** - Can't test components in isolation
5. **No Error Boundaries** - One failure breaks everything

## Migration Path

1. **Phase 1**: Extract EditorService from React component
2. **Phase 2**: Implement CheckOrchestrator with existing worker
3. **Phase 3**: Add worker pool for performance
4. **Phase 4**: Implement proper caching layer
5. **Phase 5**: Add monitoring and error handling

This architecture is what production applications use because it's:
- **Scalable**: Can handle documents with 100k+ words
- **Maintainable**: Clear boundaries and responsibilities
- **Testable**: Each component can be tested in isolation
- **Performant**: Optimized at every layer
- **Resilient**: Failures don't cascade

The key insight is that **the editor should not know about checking**, and **checking should not know about React**. They communicate through well-defined events and interfaces.