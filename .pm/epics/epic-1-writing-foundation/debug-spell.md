// features/editor/workers/grammar-with-spell.worker.ts
import { unified } from "unified"
import retextEnglish from "retext-english"
import retextSpell from "retext-spell"
import retextRepeatedWords from "retext-repeated-words"
import retextSentenceSpacing from "retext-sentence-spacing"
import { VFile } from "vfile"

interface GrammarError {
  message: string
  start: number
  end: number
  severity: "error" | "warning" | "info"
  suggestions?: string[]
  rule: string
  source: string
}

// Store the dictionary after loading
let dictionaryData: any = null
let isInitialized = false

// Load dictionary from public folder
async function loadDictionary() {
  try {
    console.log('[Grammar Worker] Loading dictionary...')
    
    // Fetch the dictionary files from public folder
    const [aff, dic] = await Promise.all([
      fetch('/dictionaries/en-US.aff').then(r => r.text()),
      fetch('/dictionaries/en-US.dic').then(r => r.text())
    ])
    
    // Parse the dictionary format for retext-spell
    // retext-spell expects a specific format
    const words = new Set<string>()
    
    // Parse .dic file (each line is a word, possibly with flags)
    dic.split('\n').forEach(line => {
      const word = line.split('/')[0].trim().toLowerCase()
      if (word && word.length > 0) {
        words.add(word)
      }
    })
    
    // Create dictionary object in the format retext-spell expects
    dictionaryData = {
      aff,
      dic: Array.from(words)
    }
    
    console.log(`[Grammar Worker] Dictionary loaded with ${words.size} words`)
    isInitialized = true
    
    // Notify main thread that we're ready
    postMessage({ type: 'ready' })
    
  } catch (error) {
    console.error('[Grammar Worker] Failed to load dictionary:', error)
    postMessage({ 
      type: 'error', 
      error: 'Failed to load dictionary: ' + error.message 
    })
  }
}

// Custom dictionary callback for retext-spell
function createDictionaryCallback() {
  return (word: string) => {
    if (!dictionaryData) return null
    
    const normalizedWord = word.toLowerCase()
    return dictionaryData.dic.includes(normalizedWord)
  }
}

// Configure processor with loaded dictionary
function createProcessor() {
  if (!dictionaryData) {
    throw new Error('Dictionary not loaded')
  }
  
  return unified()
    .use(retextEnglish)
    .use(retextSpell, {
      // Use custom dictionary callback
      dictionary: createDictionaryCallback(),
      // Add common technical terms to ignore
      ignore: [
        'github', 'npm', 'tiptap', 'prosemirror', 'retext',
        'api', 'ui', 'ux', 'css', 'html', 'js', 'ts', 'tsx',
        'webpack', 'vite', 'nextjs', 'react', 'vue', 'svelte'
      ],
      // Maximum number of suggestions
      max: 5,
      // Check personal names (disable if too many false positives)
      personal: false
    })
    .use(retextRepeatedWords)
    .use(retextSentenceSpacing, { preferred: 1 })
    // Add custom rules for contractions and capitalization
    .use(customGrammarRules)
}

// Custom grammar rules plugin
function customGrammarRules() {
  return (tree: any, file: VFile) => {
    // Implementation from previous artifact
    // ... (capitalization and contraction rules)
  }
}

// Process text for grammar and spelling errors
async function checkGrammar(id: string, text: string) {
  if (!isInitialized) {
    console.warn('[Grammar Worker] Not initialized yet, queuing request')
    // Queue the request to process after initialization
    setTimeout(() => checkGrammar(id, text), 100)
    return
  }
  
  const errors: GrammarError[] = []
  
  try {
    const processor = createProcessor()
    const file = new VFile(text)
    await processor.process(file)
    
    // Convert messages to our format
    for (const message of file.messages) {
      const error: GrammarError = {
        message: message.reason,
        start: message.position?.start?.offset || 0,
        end: message.position?.end?.offset || 0,
        severity: message.fatal ? 'error' : 'warning',
        rule: message.ruleId || message.source || 'unknown',
        source: message.source || 'retext',
        suggestions: Array.isArray(message.expected) ? message.expected : []
      }
      
      // Separate spell check errors from grammar errors
      if (message.source === 'retext-spell') {
        error.severity = 'error'
        error.rule = 'spelling'
      }
      
      errors.push(error)
    }
    
    console.log(`[Grammar Worker] Found ${errors.length} issues`)
    
    postMessage({
      type: 'grammarResult',
      id,
      errors
    })
  } catch (error) {
    console.error('[Grammar Worker] Error:', error)
    postMessage({
      type: 'error',
      id,
      error: error.message
    })
  }
}

// Initialize on worker start
loadDictionary()

// Message handler
self.addEventListener('message', (event) => {
  const { type, id, text } = event.data
  
  switch (type) {
    case 'checkGrammar':
      checkGrammar(id, text)
      break
      
    case 'addWord':
      // Add word to custom dictionary
      if (dictionaryData && event.data.word) {
        dictionaryData.dic.push(event.data.word.toLowerCase())
        console.log(`[Grammar Worker] Added "${event.data.word}" to dictionary`)
      }
      break
  }
})

// Alternative: Lighter-weight spell check using a word list
// features/editor/utils/simple-spellcheck.ts
export class SimpleSpellChecker {
  private wordSet: Set<string> = new Set()
  private ready = false
  
  async initialize() {
    try {
      // Load a simple word list (one word per line)
      const response = await fetch('/dictionaries/words.txt')
      const text = await response.text()
      
      // Parse words
      text.split('\n').forEach(word => {
        const cleaned = word.trim().toLowerCase()
        if (cleaned) {
          this.wordSet.add(cleaned)
        }
      })
      
      this.ready = true
      console.log(`[SimpleSpellChecker] Loaded ${this.wordSet.size} words`)
      
    } catch (error) {
      console.error('[SimpleSpellChecker] Failed to load:', error)
    }
  }
  
  check(word: string): boolean {
    if (!this.ready) return true // Don't mark as error if not ready
    
    const normalized = word.toLowerCase()
    
    // Check exact match
    if (this.wordSet.has(normalized)) return true
    
    // Check without common suffixes
    const suffixes = ['s', 'es', 'ed', 'ing', 'er', 'est', 'ly']
    for (const suffix of suffixes) {
      if (normalized.endsWith(suffix)) {
        const stem = normalized.slice(0, -suffix.length)
        if (this.wordSet.has(stem)) return true
      }
    }
    
    return false
  }
  
  suggest(word: string, maxSuggestions = 5): string[] {
    const suggestions: Array<{ word: string; distance: number }> = []
    const normalized = word.toLowerCase()
    
    // Simple edit distance for suggestions
    for (const dictWord of this.wordSet) {
      // Skip if too different in length
      if (Math.abs(dictWord.length - normalized.length) > 2) continue
      
      const distance = this.levenshteinDistance(normalized, dictWord)
      if (distance <= 2) {
        suggestions.push({ word: dictWord, distance })
      }
      
      if (suggestions.length > maxSuggestions * 3) break // Limit search
    }
    
    // Sort by distance and return top suggestions
    return suggestions
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxSuggestions)
      .map(s => s.word)
  }
  
  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = []
    
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          )
        }
      }
    }
    
    return matrix[b.length][a.length]
  }
}

// Setup instructions for dictionary files
/*
SETUP INSTRUCTIONS:

1. Download dictionary files:
   - Option A: Hunspell dictionaries (used by Firefox/LibreOffice)
     wget https://cgit.freedesktop.org/libreoffice/dictionaries/plain/en/en_US.aff
     wget https://cgit.freedesktop.org/libreoffice/dictionaries/plain/en/en_US.dic
   
   - Option B: Simple word list
     wget https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt -O words.txt

2. Place files in public/dictionaries/
   public/
   └── dictionaries/
       ├── en-US.aff
       ├── en-US.dic
       └── words.txt (optional, for simple checker)

3. Add to .gitignore (dictionaries can be large):
   public/dictionaries/*.dic
   public/dictionaries/*.aff
   public/dictionaries/words.txt

4. For production, consider:
   - Compressing dictionaries (gzip)
   - Using CDN for dictionary files
   - Creating subset dictionaries (common words only)
   - Lazy loading based on user language
*/

// Example usage in your check manager
// features/editor/services/check-manager.ts
export class CheckManager {
  private grammarWorker: Worker
  
  constructor() {
    this.grammarWorker = new Worker(
      new URL('../workers/grammar-with-spell.worker.ts', import.meta.url),
      { type: 'module' }
    )
    
    // Wait for worker to be ready
    this.grammarWorker.addEventListener('message', (event) => {
      if (event.data.type === 'ready') {
        console.log('[CheckManager] Grammar worker ready with dictionary')
      }
    })
  }
  
  async checkText(text: string): Promise<{ spell: any[], grammar: any[] }> {
    return new Promise((resolve) => {
      const id = Math.random().toString(36)
      
      const handler = (event: MessageEvent) => {
        if (event.data.type === 'grammarResult' && event.data.id === id) {
          this.grammarWorker.removeEventListener('message', handler)
          
          // Separate spell and grammar errors
          const errors = event.data.errors
          const spellErrors = errors.filter((e: any) => e.rule === 'spelling')
          const grammarErrors = errors.filter((e: any) => e.rule !== 'spelling')
          
          resolve({ spell: spellErrors, grammar: grammarErrors })
        }
      }
      
      this.grammarWorker.addEventListener('message', handler)
      this.grammarWorker.postMessage({ type: 'checkGrammar', id, text })
    })
  }
}