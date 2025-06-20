import PQueue from "p-queue"

interface CheckError {
  message: string
  start: number
  end: number
  rule: string
  source: string
  suggestions?: string[]
}

export class CheckManager {
  private worker: Worker
  private checkQueue: PQueue
  private paragraphCache: Map<string, CheckError[]>
  private pendingChecks: Map<string, AbortController>
  
  constructor() {
    this.worker = new Worker(
      new URL("../workers/grammar.worker.ts", import.meta.url),
      { type: 'module' }
    )
    
    this.checkQueue = new PQueue({ concurrency: 1, timeout: 5000 })
    this.paragraphCache = new Map()
    this.pendingChecks = new Map()

    this.worker.postMessage({
      type: "init",
      baseUrl: window.location.origin,
    })
  }
  
  async checkParagraph(
    id: string,
    text: string,
  ): Promise<CheckError[]> {
    const cacheKey = this.hashText(text)
    const cached = this.paragraphCache.get(cacheKey)
    if (cached) return cached
    
    this.pendingChecks.get(id)?.abort()
    const controller = new AbortController()
    this.pendingChecks.set(id, controller)
    
    try {
      const result = await this.checkQueue.add(
        () => {
          if (controller.signal.aborted) {
            return Promise.resolve([]);
          }
          return this.runCheck(id, text)
        }
      )
      
      if (!result) {
        return [];
      }
      
      this.paragraphCache.set(cacheKey, result)
      if (this.paragraphCache.size > 1000) {
        const firstKey = this.paragraphCache.keys().next().value
        if (firstKey) {
          this.paragraphCache.delete(firstKey)
        }
      }
      
      return result
    } finally {
      this.pendingChecks.delete(id)
    }
  }
  
  private runCheck(id: string, text: string): Promise<CheckError[]> {
    return new Promise((resolve, reject) => {
      const handler = (event: MessageEvent) => {
        if (event.data.id === id) {
          this.worker.removeEventListener("message", handler)
          if (event.data.type === 'result') {
            resolve(event.data.errors)
          } else if (event.data.type === 'error') {
            reject(new Error(event.data.error))
          }
        }
      }
      
      this.worker.addEventListener("message", handler)
      this.worker.postMessage({ type: "check", id, text })
    })
  }

  // Suggestions are now part of the main check result, but we might need this later.
  // For now, it can be a no-op or removed.
  async getSuggestions(word: string): Promise<string[]> {
    // The main `check` now returns suggestions with the error.
    // This function can be adapted if we need on-demand suggestions for a specific word
    // without re-checking the whole paragraph. For now, we return an empty array.
    console.log(`[CheckManager] getSuggestions for "${word}" - returning empty for now.`)
    return []
  }

  addToUserDictionary(word: string) {
    // This functionality would need to be re-implemented in the new worker if desired.
    // For now, this is a no-op.
    console.log(`[CheckManager] addToUserDictionary for "${word}" - not implemented.`)
  }
  
  private hashText(text: string): string {
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i)
      hash = hash & hash
    }
    return `${hash}-${text.length}`
  }
  
  destroy() {
    this.worker.terminate()
    this.checkQueue.clear()
    this.paragraphCache.clear()
    this.pendingChecks.forEach((controller) => controller.abort())
  }
} 