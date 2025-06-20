import PQueue from "p-queue"
import { type Editor } from "@tiptap/core"

// Define interfaces for errors, assuming they are defined elsewhere
// or should be defined here. For now, we'll use 'any' as a placeholder.
type SpellError = any
type GrammarError = any
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
  private initializationPromise: Promise<void>
  
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
      timeout: 10000, // Increased timeout for safety
    })
    
    this.paragraphCache = new Map()
    this.pendingChecks = new Map()
    
    this.initializationPromise = this.initializeWorkers()
  }
  
  private initializeWorkers(): Promise<void> {
    // The grammar worker is self-contained and queues internally.
    // The spellcheck worker needs to tell us when it's ready.
    return new Promise((resolve, reject) => {
      const handler = (event: MessageEvent) => {
        if (event.data.type === "ready") {
          console.log("Spellcheck worker is ready.")
          this.spellWorker.removeEventListener("message", handler)
          resolve()
        } else if (event.data.type === "error" && event.data.id === "init") {
          console.error("Spellcheck worker failed to initialize:", event.data.error)
          this.spellWorker.removeEventListener("message", handler)
          reject(
            new Error(`Spellcheck worker failed to initialize: ${event.data.error}`)
          )
        }
      }
      
      this.spellWorker.addEventListener("message", handler)
      this.spellWorker.postMessage({
        type: "init",
        language: "en_US",
        baseUrl: window.location.origin,
      })
    })
  }
  
  async checkParagraph(
    id: string,
    text: string,
    priority: "high" | "normal" | "low" = "normal"
  ): Promise<CheckResult> {
    // Wait for the workers to be fully initialized before proceeding.
    await this.initializationPromise
    
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
      const result = await this.checkQueue.add<CheckResult | void>(
        async () => {
          if (controller.signal.aborted) {
            return;
          }
          
          // Run spell and grammar check in parallel
          const [spellErrors, grammarErrors] = await Promise.all([
            this.runSpellCheck(id, text),
            this.runGrammarCheck(id, text),
          ])
          
          const checkResult: CheckResult = {
            spell: spellErrors,
            grammar: grammarErrors,
          }
          
          // Cache result
          this.paragraphCache.set(cacheKey, checkResult)
          
          // Limit cache size
          if (this.paragraphCache.size > 1000) {
            const firstKey = this.paragraphCache.keys().next().value
            if (firstKey) {
              this.paragraphCache.delete(firstKey)
            }
          }
          
          return checkResult
        },
        { priority: priorityValue }
      )

      if (!result) {
        throw new Error("Check timed out or was cancelled");
      }

      return result;
    } finally {
      this.pendingChecks.delete(id)
    }
  }
  
  private runSpellCheck(id: string, text: string): Promise<SpellError[]> {
    return new Promise((resolve, reject) => {
      const handler = (event: MessageEvent) => {
        if (event.data.id !== id) return;

        if (event.data.type === "result") {
          this.spellWorker.removeEventListener("message", handler)
          resolve(event.data.errors)
        } else if (event.data.type === "error") {
          this.spellWorker.removeEventListener("message", handler)
          reject(new Error(`Spellcheck worker error: ${event.data.error}`))
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
    return new Promise((resolve, reject) => {
      const handler = (event: MessageEvent) => {
        if (event.data.id !== id) return;

        if (event.data.type === "grammarResult") {
          this.grammarWorker.removeEventListener("message", handler)
          resolve(event.data.errors)
        } else if (event.data.type === "error") {
          this.grammarWorker.removeEventListener("message", handler)
          reject(new Error(`Grammar worker error: ${event.data.error}`))
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