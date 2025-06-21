# Epic: Writing Foundation 📝 - Sprint 0.2

## Sprint 0.2: Grammar Checking & Advanced Features

### Objectives
- Add retext-based grammar checking
- Implement smart caching and performance optimizations
- Handle edge cases and large documents
- Polish the UX with smooth animations

### Day 1-2: Retext Grammar Integration

#### 1. Install Grammar Dependencies
```bash
# Retext and plugins
bun add unified retext retext-english
bun add retext-repeated-words retext-indefinite-article retext-redundant-acronyms
bun add retext-sentence-spacing retext-quotes retext-contractions
bun add retext-diacritics retext-no-emojis

# Grammar-specific utilities
bun add nlcst-to-string unist-util-visit
```

#### 2. Grammar Check Worker
```typescript
// features/editor/workers/grammar.worker.ts
import { unified } from "unified"
import retextEnglish from "retext-english"
import retextRepeatedWords from "retext-repeated-words"
import retextIndefiniteArticle from "retext-indefinite-article"
import retextRedundantAcronyms from "retext-redundant-acronyms"
import retextSentenceSpacing from "retext-sentence-spacing"
import retextQuotes from "retext-quotes"
import retextContractions from "retext-contractions"
import { visit } from "unist-util-visit"

// Configure retext pipeline
const processor = unified()
  .use(retextEnglish)
  .use(retextRepeatedWords)
  .use(retextIndefiniteArticle)
  .use(retextRedundantAcronyms)
  .use(retextSentenceSpacing)
  .use(retextQuotes, { preferred: "straight" })
  .use(retextContractions, { straight: true })

interface GrammarError {
  message: string
  start: number
  end: number
  severity: "error" | "warning" | "info"
  suggestions?: string[]
  rule: string
}

// Cache for processed sentences
const sentenceCache = new Map<string, GrammarError[]>()
const MAX_CACHE_SIZE = 5000

// Process text for grammar errors
async function checkGrammar(id: string, text: string, ranges?: Array<{ start: number; end: number }>) {
  const errors: GrammarError[] = []
  
  try {
    // Process with retext
    const tree = processor.parse(text)
    const messages = await processor.run(tree)
    
    // Extract errors from messages
    visit(tree, "SentenceNode", (node: any) => {
      const sentenceStart = node.position.start.offset
      const sentenceEnd = node.position.end.offset
      const sentenceText = text.slice(sentenceStart, sentenceEnd)
      
      // Check cache
      const cacheKey = sentenceText.trim()
      const cached = sentenceCache.get(cacheKey)
      
      if (cached) {
        // Adjust positions for cached results
        cached.forEach((error) => {
          errors.push({
            ...error,
            start: sentenceStart + error.start,
            end: sentenceStart + error.end,
          })
        })
        return
      }
      
      // Process new sentence
      const sentenceErrors: GrammarError[] = []
      
      messages.forEach((message: any) => {
        if (
          message.position &&
          message.position.start.offset >= sentenceStart &&
          message.position.end.offset <= sentenceEnd
        ) {
          sentenceErrors.push({
            message: message.message,
            start: message.position.start.offset - sentenceStart,
            end: message.position.end.offset - sentenceStart,
            severity: message.fatal ? "error" : "warning",
            rule: message.ruleId || message.source || "grammar",
            suggestions: message.expected || [],
          })
        }
      })
      
      // Cache result
      if (sentenceCache.size >= MAX_CACHE_SIZE) {
        // LRU eviction - remove oldest entries
        const firstKey = sentenceCache.keys().next().value
        sentenceCache.delete(firstKey)
      }
      sentenceCache.set(cacheKey, sentenceErrors)
      
      // Add to results with adjusted positions
      sentenceErrors.forEach((error) => {
        errors.push({
          ...error,
          start: sentenceStart + error.start,
          end: sentenceStart + error.end,
        })
      })
    })
    
    postMessage({
      type: "grammarResult",
      id,
      errors,
    })
  } catch (error) {
    postMessage({
      type: "error",
      id,
      error: error.message,
    })
  }
}

// Message handler
self.addEventListener("message", (event) => {
  const { type, id, text, ranges } = event.data
  
  switch (type) {
    case "checkGrammar":
      checkGrammar(id, text, ranges)
      break
      
    case "clearCache":
      sentenceCache.clear()
      break
  }
})
```

### Day 3-4: Combined Spell & Grammar System

#### 3. Unified Check Manager
```typescript
// features/editor/services/check-manager.ts
import { Editor } from "@tiptap/core"
import PQueue from "p-queue"

interface CheckResult {
  spell: SpellError[]
  grammar: GrammarError[]
}

export class CheckManager {
  private spellWorker: Worker
  private grammarWorker: Worker
  private checkQueue: PQueue
  private paragraphCache: Map<string, CheckResult>
  private pendingChecks: Map<string, AbortController>
  
  constructor() {
    this.spellWorker = new Worker(
      new URL("../workers/spellcheck.worker.ts", import.meta.url)
    )
    this.grammarWorker = new Worker(
      new URL("../workers/grammar.worker.ts", import.meta.url)
    )
    
    // Priority queue for check operations
    this.checkQueue = new PQueue({
      concurrency: 2,
      timeout: 5000,
    })
    
    this.paragraphCache = new Map()
    this.pendingChecks = new Map()
    
    this.initializeWorkers()
  }
  
  private initializeWorkers() {
    this.spellWorker.postMessage({
      type: "init",
      language: "en_US",
    })
    
    // Warm up grammar worker
    this.grammarWorker.postMessage({
      type: "checkGrammar",
      id: "warmup",
      text: "This is a warmup sentence.",
    })
  }
  
  async checkParagraph(
    id: string,
    text: string,
    priority: "high" | "normal" | "low" = "normal"
  ): Promise<CheckResult> {
    // Check cache first
    const cacheKey = this.hashText(text)
    const cached = this.paragraphCache.get(cacheKey)
    if (cached) return cached
    
    // Cancel any pending check for this paragraph
    this.pendingChecks.get(id)?.abort()
    
    const controller = new AbortController()
    this.pendingChecks.set(id, controller)
    
    // Queue the check with priority
    const priorityValue = { high: 1, normal: 5, low: 10 }[priority]
    
    try {
      const result = await this.checkQueue.add(
        async () => {
          if (controller.signal.aborted) {
            throw new Error("Check cancelled")
          }
          
          // Run spell and grammar check in parallel
          const [spellErrors, grammarErrors] = await Promise.all([
            this.runSpellCheck(id, text),
            this.runGrammarCheck(id, text),
          ])
          
          const result: CheckResult = {
            spell: spellErrors,
            grammar: grammarErrors,
          }
          
          // Cache result
          this.paragraphCache.set(cacheKey, result)
          
          // Limit cache size
          if (this.paragraphCache.size > 1000) {
            const firstKey = this.paragraphCache.keys().next().value
            this.paragraphCache.delete(firstKey)
          }
          
          return result
        },
        { priority: priorityValue }
      )
      
      return result
    } finally {
      this.pendingChecks.delete(id)
    }
  }
  
  private runSpellCheck(id: string, text: string): Promise<SpellError[]> {
    return new Promise((resolve) => {
      const handler = (event: MessageEvent) => {
        if (event.data.type === "result" && event.data.id === id) {
          this.spellWorker.removeEventListener("message", handler)
          resolve(event.data.errors)
        }
      }
      
      this.spellWorker.addEventListener("message", handler)
      this.spellWorker.postMessage({
        type: "checkText",
        id,
        text,
      })
    })
  }
  
  private runGrammarCheck(id: string, text: string): Promise<GrammarError[]> {
    return new Promise((resolve) => {
      const handler = (event: MessageEvent) => {
        if (event.data.type === "grammarResult" && event.data.id === id) {
          this.grammarWorker.removeEventListener("message", handler)
          resolve(event.data.errors)
        }
      }
      
      this.grammarWorker.addEventListener("message", handler)
      this.grammarWorker.postMessage({
        type: "checkGrammar",
        id,
        text,
      })
    })
  }
  
  async getSuggestions(word: string): Promise<string[]> {
    return new Promise((resolve) => {
      const handler = (event: MessageEvent) => {
        if (event.data.type === "suggestions" && event.data.word === word) {
          this.spellWorker.removeEventListener("message", handler)
          resolve(event.data.suggestions)
        }
      }
      
      this.spellWorker.addEventListener("message", handler)
      this.spellWorker.postMessage({
        type: "getSuggestions",
        word,
      })
    })
  }
  
  addToUserDictionary(word: string) {
    this.spellWorker.postMessage({
      type: "addWord",
      word,
    })
    
    // Clear cache entries containing this word
    this.paragraphCache.forEach((value, key) => {
      if (key.includes(word)) {
        this.paragraphCache.delete(key)
      }
    })
  }
  
  private hashText(text: string): string {
    // Simple but fast hash function
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i)
      hash = hash & hash
    }
    return `${hash}-${text.length}`
  }
  
  destroy() {
    this.spellWorker.terminate()
    this.grammarWorker.terminate()
    this.checkQueue.clear()
    this.paragraphCache.clear()
    this.pendingChecks.forEach((controller) => controller.abort())
  }
}
```

### Day 5: Performance Monitoring & Polish

#### 4. Performance Monitor
```typescript
// features/editor/utils/performance-monitor.ts
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()
  
  measure<T>(name: string, fn: () => T): T {
    const start = performance.now()
    const result = fn()
    const duration = performance.now() - start
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    const metricArray = this.metrics.get(name)!
    metricArray.push(duration)
    
    // Keep last 100 measurements
    if (metricArray.length > 100) {
      metricArray.shift()
    }
    
    // Log if slow
    if (duration > 50) {
      console.warn(`Slow ${name}: ${duration.toFixed(2)}ms`)
    }
    
    return result
  }
  
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    const result = await fn()
    const duration = performance.now() - start
    
    // ... same metric tracking
    
    return result
  }
  
  getStats(name: string) {
    const metrics = this.metrics.get(name) || []
    if (metrics.length === 0) return null
    
    const sorted = [...metrics].sort((a, b) => a - b)
    
    return {
      count: metrics.length,
      mean: metrics.reduce((a, b) => a + b, 0) / metrics.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      min: sorted[0],
      max: sorted[sorted.length - 1],
    }
  }
  
  logAllStats() {
    console.group("Performance Stats")
    for (const [name, _] of this.metrics) {
      const stats = this.getStats(name)
      if (stats) {
        console.log(`${name}:`, {
          mean: `${stats.mean.toFixed(2)}ms`,
          p95: `${stats.p95.toFixed(2)}ms`,
          p99: `${stats.p99.toFixed(2)}ms`,
        })
      }
    }
    console.groupEnd()
  }
}
```

### Testing for Sprint 0.2
- [ ] Grammar errors show blue wavy underlines
- [ ] Both spell and grammar check work simultaneously
- [ ] No performance degradation with both enabled
- [ ] Cache prevents redundant checks
- [ ] Large documents (100k+ words) remain responsive
- [ ] Memory usage stays reasonable
- [ ] Worker crashes are handled gracefully
- [ ] Suggestions load quickly on hover
- [ ] Performance metrics show <50ms average
- [ ] Paste operations complete smoothly
- [ ] Undo/redo maintains error decorations 