// test-worker-simulation.mjs
// Run this with: node test-worker-simulation.mjs
// This simulates the exact worker environment to test the grammar checking

import { unified } from 'unified'
import { VFile } from 'vfile'
import retextEnglish from 'retext-english'
import retextSpell from 'retext-spell'
import retextRepeatedWords from 'retext-repeated-words'
import retextSentenceSpacing from 'retext-sentence-spacing'
import retextRedundantAcronyms from 'retext-redundant-acronyms'
import retextQuotes from 'retext-quotes'
import retextStringify from 'retext-stringify'
import { toString } from 'nlcst-to-string'
import { visit } from 'unist-util-visit'
import fs from 'fs'

// Simulate custom rules (matching custom-rules.ts)
function customCapitalizationRule() {
  return (tree, file) => {
    // Check for sentence capitalization
    visit(tree, 'SentenceNode', (sentence) => {
      const firstWord = sentence.children.find(
        (child) => child.type === 'WordNode'
      )
      if (firstWord) {
        const text = toString(firstWord)
        if (text && text[0] && text[0] === text[0].toLowerCase()) {
          const message = file.message(
            'Sentence should start with a capital letter',
            firstWord
          )
          message.source = 'custom-capitalization'
          message.ruleId = 'sentence-start'
          message.expected = [text.charAt(0).toUpperCase() + text.slice(1)]
        }
      }
    })

    // Check for uncapitalized "I"
    visit(tree, 'WordNode', (word) => {
      const text = toString(word)
      if (text === 'i') {
        const message = file.message('"i" should be capitalized', word)
        message.source = 'custom-capitalization'
        message.ruleId = 'personal-pronoun'
        message.expected = ['I']
      }
    })
  }
}

function customContractionsRule() {
  const contractions = {
    "cant": "can't", "wont": "won't", "dont": "don't", "isnt": "isn't",
    "arent": "aren't", "wasnt": "wasn't", "werent": "weren't", "its": "it's"
  }
  
  return (tree, file) => {
    visit(tree, 'WordNode', (word) => {
      const text = toString(word).toLowerCase()
      if (contractions[text]) {
        const message = file.message('Missing apostrophe in contraction', word)
        message.source = 'custom-contractions'
        message.ruleId = 'missing-apostrophe'
        message.expected = [contractions[text]]
      }
    })
  }
}

// Simulate the worker environment
class WorkerSimulator {
  constructor() {
    this.processor = null
    this.dictionary = null
  }
  
  async initialize() {
    console.log('[Worker Simulator] Starting initialization...')
    
    try {
      // Load dictionary files as buffers (simulating fetch)
      const affBuffer = fs.readFileSync('./public/dictionaries/en_US.aff')
      const dicBuffer = fs.readFileSync('./public/dictionaries/en_US.dic')
      
      console.log('[Worker Simulator] Dictionary buffers loaded:', {
        affSize: affBuffer.byteLength,
        dicSize: dicBuffer.byteLength
      })
      
      // Create dictionary object for retext-spell
      this.dictionary = {
        aff: new Uint8Array(affBuffer),
        dic: new Uint8Array(dicBuffer)
      }
      
      console.log('[Worker Simulator] Dictionary created successfully')
    } catch (error) {
      console.error('[Worker Simulator] Failed to load dictionary:', error)
      this.dictionary = null
    }
    
    // Create processor with or without spell checking
    if (this.dictionary) {
      console.log('[Worker Simulator] Creating processor with spell checking')
      this.processor = unified()
        .use(retextEnglish)
        .use(retextSpell, { dictionary: this.dictionary })
        .use(retextRepeatedWords)
        .use(retextRedundantAcronyms)
        .use(retextSentenceSpacing)
        .use(retextQuotes, { preferred: "straight" })
        .use(customCapitalizationRule)
        .use(customContractionsRule)
        .use(retextStringify)
    } else {
      console.log('[Worker Simulator] Creating processor without spell checking')
      this.processor = unified()
        .use(retextEnglish)
        .use(retextRepeatedWords)
        .use(retextRedundantAcronyms)
        .use(retextSentenceSpacing)
        .use(retextQuotes, { preferred: "straight" })
        .use(customCapitalizationRule)
        .use(customContractionsRule)
        .use(retextStringify)
    }
    
    console.log('[Worker Simulator] Initialization complete')
  }
  
  VFileMessageToCheckError(message, text) {
    // In vfile messages, the position is stored in 'place' property
    const position = message.place || message.position
    
    if (!position || !position.start || !position.end) {
      console.log('[Worker Simulator] Skipping message without position:', message)
      return null
    }
    
    const { start, end } = position
    
    // Ensure we have offset values
    if (typeof start.offset !== 'number' || typeof end.offset !== 'number') {
      console.log('[Worker Simulator] Skipping message without offset values:', message)
      return null
    }
    
    return {
      message: message.reason,
      start: start.offset,
      end: end.offset,
      rule: message.ruleId || "unknown",
      source: message.source || "unknown",
      suggestions: message.expected || [],
    }
  }
  
  async check(text) {
    try {
      console.log(`[Worker Simulator] Checking text: "${text.substring(0, 50)}..."`)
      
      if (!this.processor) throw new Error("Processor not available.")
      
      const results = await this.processor.process(text)
      
      console.log(`[Worker Simulator] Processing complete. Messages found: ${results.messages.length}`)
      
      // Debug: Log first few messages
      if (results.messages.length > 0) {
        console.log("[Worker Simulator] First message:", results.messages[0])
      }
      
      const errors = results.messages
        .map((msg) => this.VFileMessageToCheckError(msg, text))
        .filter((error) => error !== null)
      
      console.log(`[Worker Simulator] Converted to ${errors.length} errors`)
      
      // Debug: Log first error
      if (errors.length > 0) {
        console.log("[Worker Simulator] First error:", errors[0])
      }
      
      return errors
      
    } catch (error) {
      console.error("[Worker Simulator] Check failed:", error)
      throw error
    }
  }
}

// Test the worker simulator
async function runTests() {
  console.log('Testing Worker Simulation\n' + '='.repeat(50))
  
  const worker = new WorkerSimulator()
  await worker.initialize()
  
  const testCases = [
    "hi three what is your namee? my name is Mitchell. no errors are ofund.",
    "my nameee is is Mitchell",
    "i cant spell gud. This is a testt of the spell checker.",
    "The the cat sat on mat.",
    "Its a beautiful day",
    "this is a test.  Two spaces"
  ]
  
  for (const text of testCases) {
    console.log(`\nTesting: "${text}"`)
    console.log('-'.repeat(40))
    
    try {
      const errors = await worker.check(text)
      
      if (errors.length === 0) {
        console.log('✗ No errors found')
      } else {
        console.log(`✓ Found ${errors.length} errors:`)
        
        errors.forEach((error, i) => {
          console.log(`\n  ${i + 1}. ${error.message}`)
          console.log(`     Position: ${error.start} - ${error.end}`)
          console.log(`     Text: "${text.substring(error.start, error.end)}"`)
          console.log(`     Source: ${error.source}`)
          console.log(`     Rule: ${error.rule}`)
          if (error.suggestions.length > 0) {
            console.log(`     Suggestions: ${error.suggestions.join(', ')}`)
          }
        })
      }
    } catch (error) {
      console.error('✗ Error:', error.message)
    }
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('Test complete')
}

// Run the tests
runTests() 