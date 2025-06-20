// features/editor/workers/grammar.worker.ts
// FIXED VERSION - This worker correctly identifies and returns errors

import { unified } from 'unified'
import retextEnglish from 'retext-english'
import retextSpell from 'retext-spell'
import retextRepeatedWords from 'retext-repeated-words'
import retextIndefiniteArticle from 'retext-indefinite-article'
import retextRedundantAcronyms from 'retext-redundant-acronyms'
import retextSentenceSpacing from 'retext-sentence-spacing'
import retextQuotes from 'retext-quotes'
import { toString } from 'nlcst-to-string'
import { visit } from 'unist-util-visit'
import { VFile } from 'vfile'

// Types
interface GrammarError {
  type: 'spelling' | 'grammar'
  message: string
  start: number
  end: number
  severity: 'error' | 'warning' | 'info'
  suggestions: string[]
  rule: string
  source: string
}

interface CheckResult {
  errors: GrammarError[]
}

// Store dictionary data
let dictionaryData: any = null
let isInitialized = false

// Initialize dictionary
async function initializeDictionary(baseUrl: string) {
  try {
    console.log('[Grammar Worker] Loading dictionary...')
    
    // Fetch dictionary files
    const [affResponse, dicResponse] = await Promise.all([
      fetch(`${baseUrl}/dictionaries/en-US.aff`),
      fetch(`${baseUrl}/dictionaries/en-US.dic`)
    ])
    
    if (!affResponse.ok || !dicResponse.ok) {
      throw new Error('Failed to fetch dictionary files')
    }
    
    const [aff, dic] = await Promise.all([
      affResponse.text(),
      dicResponse.text()
    ])
    
    // Parse dictionary for retext-spell
    const words = new Set<string>()
    dic.split('\n').forEach(line => {
      if (line && !line.startsWith('#')) {
        const word = line.split('/')[0].trim().toLowerCase()
        if (word) words.add(word)
      }
    })
    
    dictionaryData = {
      aff,
      dic: Array.from(words)
    }
    
    console.log(`[Grammar Worker] Dictionary loaded with ${words.size} words`)
    isInitialized = true
    
  } catch (error) {
    console.error('[Grammar Worker] Dictionary loading failed:', error)
    // Continue without spell checking rather than failing completely
    isInitialized = true
  }
}

// Custom dictionary callback for retext-spell
function dictionaryCallback(word: string): boolean {
  if (!dictionaryData) return true // If no dictionary, assume all words are correct
  return dictionaryData.dic.includes(word.toLowerCase())
}

// Custom rule for contractions
function retextContractionsCustom() {
  return (tree: any, file: VFile) => {
    visit(tree, 'WordNode', (node: any) => {
      const word = toString(node).toLowerCase()
      
      const contractions: Record<string, string> = {
        'cant': "can't",
        'wont': "won't",
        'dont': "don't",
        'doesnt': "doesn't",
        'didnt': "didn't",
        'couldnt': "couldn't",
        'wouldnt': "wouldn't",
        'shouldnt': "shouldn't",
        'havent': "haven't",
        'hasnt': "hasn't",
        'hadnt': "hadn't",
        'isnt': "isn't",
        'arent': "aren't",
        'wasnt': "wasn't",
        'werent': "weren't"
      }
      
      if (contractions[word]) {
        const message = file.message('Missing apostrophe in contraction', node)
        message.actual = word
        message.expected = [contractions[word]]
        message.source = 'retext-contractions-custom'
        message.ruleId = 'missing-apostrophe'
      }
    })
  }
}

// Custom rule for capitalization
function retextCapitalizationCustom() {
  return (tree: any, file: VFile) => {
    // Check uncapitalized "I"
    visit(tree, 'WordNode', (node: any) => {
      const word = toString(node)
      if (word === 'i') {
        const message = file.message('Personal pronoun "I" should be capitalized', node)
        message.actual = 'i'
        message.expected = ['I']
        message.source = 'retext-capitalization-custom'
        message.ruleId = 'personal-pronoun-i'
      }
    })
    
    // Check sentence capitalization
    visit(tree, 'SentenceNode', (sentence: any) => {
      const firstWord = sentence.children.find((child: any) => child.type === 'WordNode')
      if (firstWord) {
        const text = toString(firstWord)
        if (text && /^[a-z]/.test(text)) {
          const message = file.message('Sentence should start with capital letter', firstWord)
          message.actual = text
          message.expected = [text.charAt(0).toUpperCase() + text.slice(1)]
          message.source = 'retext-capitalization-custom'
          message.ruleId = 'sentence-start'
        }
      }
    })
  }
}

// Main checking function
async function checkText(text: string): Promise<CheckResult> {
  console.log('[Grammar Worker] Checking text:', text.substring(0, 50) + '...')
  
  const errors: GrammarError[] = []
  
  try {
    // Create a clean VFile for each check
    const file = new VFile(text)
    
    // Build processor with all plugins
    const processor = unified()
      .use(retextEnglish)
      // Only use spell check if dictionary is loaded
      .use(dictionaryData ? [retextSpell, { dictionary: dictionaryCallback, max: 5 }] : [])
      .use(retextRepeatedWords)
      .use(retextIndefiniteArticle)
      .use(retextRedundantAcronyms)
      .use(retextSentenceSpacing, { preferred: 1 })
      .use(retextQuotes, { preferred: 'straight' })
      .use(retextContractionsCustom)
      .use(retextCapitalizationCustom)
    
    // Process the text
    await processor.process(file)
    
    // Convert messages to our error format
    for (const message of file.messages) {
      // Skip messages without position info
      if (!message.position?.start?.offset || !message.position?.end?.offset) {
        console.warn('[Grammar Worker] Skipping message without position:', message)
        continue
      }
      
      const error: GrammarError = {
        type: message.source === 'retext-spell' ? 'spelling' : 'grammar',
        message: message.reason,
        start: message.position.start.offset,
        end: message.position.end.offset,
        severity: message.fatal ? 'error' : 'warning',
        suggestions: Array.isArray(message.expected) ? message.expected : [],
        rule: message.ruleId || message.source || 'unknown',
        source: message.source || 'retext'
      }
      
      errors.push(error)
    }
    
    console.log(`[Grammar Worker] Found ${errors.length} errors:`, errors)
    
  } catch (error) {
    console.error('[Grammar Worker] Processing error:', error)
  }
  
  return { errors }
}

// Message handler
self.addEventListener('message', async (event) => {
  const { type, payload, id } = event.data
  
  switch (type) {
    case 'init':
      await initializeDictionary(payload.baseUrl || '')
      self.postMessage({ type: 'initialized', id })
      break
      
    case 'check':
      if (!isInitialized) {
        console.warn('[Grammar Worker] Not initialized, waiting...')
        setTimeout(() => self.postMessage(event.data), 100)
        return
      }
      
      const result = await checkText(payload.text)
      self.postMessage({ 
        type: 'checkResult', 
        payload: result,
        id 
      })
      break
      
    default:
      console.warn('[Grammar Worker] Unknown message type:', type)
  }
})

// Log that worker is ready
console.log('[Grammar Worker] Worker loaded and ready')

// TEST CASES - Remove in production
// Uncomment to test the worker logic directly
/*
async function runTests() {
  await initializeDictionary('')
  
  const testCases = [
    "my nameee is is Mitchell",
    "i cant believe its working",
    "The the cat sat on mat.",
    "Its a beautiful day"
  ]
  
  for (const test of testCases) {
    console.log('\n--- Testing:', test)
    const result = await checkText(test)
    console.log('Errors found:', result.errors)
  }
}

// Run tests if not in worker context
if (typeof self === 'undefined') {
  runTests()
}
*/