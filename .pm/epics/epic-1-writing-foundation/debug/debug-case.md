// Option 1: Use retext-sentence-case (if it exists)
// Based on the search, there's a mention of it but it's not widely available
// npm search shows: "A retext plugin to encourage the use of sentence case"
// by danielgolden, but it might be a private/unpublished package

// Option 2: Create a custom retext plugin for capitalization
// This is the most reliable approach

// features/editor/plugins/retext-capitalization-custom.ts
import { visit } from 'unist-util-visit'
import { toString } from 'nlcst-to-string'
import type { Plugin } from 'unified'
import type { Node } from 'unist'

/**
 * Custom retext plugin for checking capitalization
 * Checks for:
 * - Sentences starting with lowercase letters
 * - Uncapitalized "I" pronoun
 * - Proper nouns that should be capitalized
 */
export const retextCapitalizationCustom: Plugin = () => {
  return (tree, file) => {
    // Check sentence capitalization
    visit(tree, 'SentenceNode', (sentence: any) => {
      const firstWord = sentence.children.find(
        (child: any) => child.type === 'WordNode'
      )
      
      if (firstWord) {
        const text = toString(firstWord)
        
        // Check if first letter is lowercase
        if (text && /^[a-z]/.test(text)) {
          const message = file.message(
            `Sentence should start with a capital letter`,
            firstWord
          )
          message.source = 'retext-capitalization'
          message.ruleId = 'sentence-start'
          message.actual = text
          message.expected = [text[0].toUpperCase() + text.slice(1)]
        }
      }
    })
    
    // Check for uncapitalized "I"
    visit(tree, 'WordNode', (word: any) => {
      const text = toString(word)
      
      if (text === 'i') {
        // Check if it's actually the pronoun "I" and not part of a contraction
        const parent = word.parent
        const index = parent?.children?.indexOf(word)
        
        // Simple heuristic: if it's between punctuation/whitespace, it's likely the pronoun
        const prevNode = parent?.children?.[index - 1]
        const nextNode = parent?.children?.[index + 1]
        
        const isPronoun = 
          (!prevNode || prevNode.type === 'WhiteSpaceNode' || prevNode.type === 'PunctuationNode') &&
          (!nextNode || nextNode.type === 'WhiteSpaceNode' || nextNode.type === 'PunctuationNode')
        
        if (isPronoun) {
          const message = file.message(
            `Personal pronoun "I" should be capitalized`,
            word
          )
          message.source = 'retext-capitalization'
          message.ruleId = 'personal-pronoun-i'
          message.actual = 'i'
          message.expected = ['I']
        }
      }
    })
    
    // Check common proper nouns (expandable list)
    const properNouns = new Set([
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
      'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
      'september', 'october', 'november', 'december',
      'english', 'spanish', 'french', 'german', 'chinese', 'japanese',
      'america', 'europe', 'asia', 'africa', 'australia'
    ])
    
    visit(tree, 'WordNode', (word: any) => {
      const text = toString(word).toLowerCase()
      
      if (properNouns.has(text)) {
        const actual = toString(word)
        const expected = text[0].toUpperCase() + text.slice(1)
        
        if (actual !== expected) {
          const message = file.message(
            `Proper noun "${actual}" should be capitalized`,
            word
          )
          message.source = 'retext-capitalization'
          message.ruleId = 'proper-noun'
          message.actual = actual
          message.expected = [expected]
        }
      }
    })
  }
}

// Option 3: Use existing npm packages for case conversion
// These aren't retext plugins but can be used in custom rules

// Using 'sentence-case' package (exists on npm)
// npm install sentence-case
import { sentenceCase } from 'sentence-case'

// Using 'title-case' package
// npm install title-case
import { titleCase } from 'title-case'

// Option 4: Complete working grammar checker with custom rules
// features/editor/workers/grammar-complete.worker.ts

import { unified } from 'unified'
import retextEnglish from 'retext-english'
import retextRepeatedWords from 'retext-repeated-words'
import retextRedundantAcronyms from 'retext-redundant-acronyms'
import retextSentenceSpacing from 'retext-sentence-spacing'
import retextQuotes from 'retext-quotes'
import retextReadability from 'retext-readability'
import { visit } from 'unist-util-visit'
import { toString } from 'nlcst-to-string'
import type { VFile } from 'vfile'

// Custom contractions rule
const retextContractionsCustom = () => {
  const contractionPatterns = [
    { pattern: /\bcant\b/gi, suggestion: "can't" },
    { pattern: /\bwont\b/gi, suggestion: "won't" },
    { pattern: /\bdont\b/gi, suggestion: "don't" },
    { pattern: /\bdoesnt\b/gi, suggestion: "doesn't" },
    { pattern: /\bdidnt\b/gi, suggestion: "didn't" },
    { pattern: /\bcouldnt\b/gi, suggestion: "couldn't" },
    { pattern: /\bwouldnt\b/gi, suggestion: "wouldn't" },
    { pattern: /\bshouldnt\b/gi, suggestion: "shouldn't" },
    { pattern: /\bhavent\b/gi, suggestion: "haven't" },
    { pattern: /\bhasnt\b/gi, suggestion: "hasn't" },
    { pattern: /\bhadnt\b/gi, suggestion: "hadn't" },
    { pattern: /\bisnt\b/gi, suggestion: "isn't" },
    { pattern: /\barent\b/gi, suggestion: "aren't" },
    { pattern: /\bwasnt\b/gi, suggestion: "wasn't" },
    { pattern: /\bwerent\b/gi, suggestion: "weren't" },
    { pattern: /\bits\b/g, suggestion: "it's", context: true }, // needs context to differentiate from possessive
  ]
  
  return (tree: any, file: VFile) => {
    visit(tree, 'WordNode', (node: any) => {
      const word = toString(node)
      
      for (const { pattern, suggestion, context } of contractionPatterns) {
        if (pattern.test(word)) {
          // Reset regex
          pattern.lastIndex = 0
          
          // For context-sensitive contractions, check surrounding words
          if (context && word.toLowerCase() === 'its') {
            // Simple heuristic: if followed by a verb/adjective, likely "it's"
            // This is imperfect but better than nothing
            const parent = node.parent
            const index = parent?.children?.indexOf(node)
            const nextWord = parent?.children?.[index + 2] // +2 to skip whitespace
            
            if (nextWord?.type === 'WordNode') {
              const next = toString(nextWord).toLowerCase()
              // Common words that follow "it's"
              const likelyContraction = ['a', 'an', 'the', 'not', 'been', 'going', 'getting', 'very', 'really', 'quite']
              if (!likelyContraction.includes(next)) {
                continue // Skip this one, might be possessive
              }
            }
          }
          
          const message = file.message(
            `Missing apostrophe in contraction`,
            node
          )
          message.source = 'retext-contractions'
          message.ruleId = 'missing-apostrophe'
          message.actual = word
          message.expected = [suggestion]
          break
        }
      }
    })
  }
}

// Create the complete processor
const processor = unified()
  .use(retextEnglish)
  .use(retextRepeatedWords)
  .use(retextRedundantAcronyms)
  .use(retextSentenceSpacing)
  .use(retextQuotes, { preferred: 'straight' })
  .use(retextReadability, { age: 16, minWords: 7 })
  // Add our custom rules
  .use(retextCapitalizationCustom)
  .use(retextContractionsCustom)

// Test the setup
async function testGrammar() {
  const testCases = [
    'i cant go to the store.',
    'Its a beautiful day.',
    'the the cat sat on the mat.',
    'This is a NASA ARP document.',
    'She said "hello" to me.',
  ]
  
  for (const text of testCases) {
    console.log(`\nTesting: "${text}"`)
    const file = new VFile(text)
    await processor.process(file)
    
    for (const message of file.messages) {
      console.log(`- ${message.message} at position ${message.position?.start?.offset}`)
      if (message.expected) {
        console.log(`  Suggestion: ${message.expected.join(', ')}`)
      }
    }
  }
}

// Export for use in worker
export { processor, retextCapitalizationCustom, retextContractionsCustom }

// Simple test if running directly
if (typeof self === 'undefined') {
  testGrammar()
}