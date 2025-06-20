// test-grammar-worker-isolated.mjs
// Run this with: node test-grammar-worker-isolated.mjs
// This tests the grammar checking logic in complete isolation

import { unified } from 'unified'
import retextEnglish from 'retext-english'
import retextRepeatedWords from 'retext-repeated-words'
import retextSentenceSpacing from 'retext-sentence-spacing'
import retextQuotes from 'retext-quotes'
import retextStringify from 'retext-stringify'
import { toString } from 'nlcst-to-string'
import { visit } from 'unist-util-visit'

// Custom contractions checker
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
        message.actual = text
        message.expected = [contractions[text]]
      }
    })
  }
}

// Custom capitalization checker
function customCapitalizationRule() {
  return (tree, file) => {
    // Check uncapitalized "I"
    visit(tree, 'WordNode', (node) => {
      const word = toString(node)
      if (word === 'i') {
        const message = file.message('Personal pronoun "I" should be capitalized', node)
        message.actual = 'i'
        message.expected = ['I']
        message.source = 'custom-capitalization'
        message.ruleId = 'personal-pronoun-i'
      }
    })
    
    // Check sentence capitalization
    visit(tree, 'SentenceNode', (sentence) => {
      const firstWord = sentence.children.find(child => child.type === 'WordNode')
      if (firstWord) {
        const text = toString(firstWord)
        if (text && /^[a-z]/.test(text)) {
          const message = file.message('Sentence should start with capital letter', firstWord)
          message.actual = text
          message.expected = [text.charAt(0).toUpperCase() + text.slice(1)]
          message.source = 'custom-capitalization'
          message.ruleId = 'sentence-start'
        }
      }
    })
  }
}

// Main test function
async function testGrammarChecking() {
  console.log('Testing Grammar Checking Logic (without spell check)\n' + '='.repeat(50))
  
  // Just test one case with detailed debug
  const text = "i cant believe its working"
  
  console.log(`\nTesting: "${text}"`)
  console.log('-'.repeat(40))
  
  try {
    // Create processor with grammar plugins only (no spell check for now)
    const processor = unified()
      .use(retextEnglish)
      .use(retextRepeatedWords)
      .use(retextSentenceSpacing, { preferred: 1 })
      .use(retextQuotes, { preferred: 'straight' })
      .use(customCapitalizationRule)
      .use(customContractionsRule)
      .use(retextStringify)  // Add the compiler
    
    // Process the text
    const result = await processor.process(text)
    
    console.log(`\nMessages found: ${result.messages.length}`)
    
    if (result.messages.length === 0) {
      console.log('✗ No errors found')
    } else {
      console.log('✓ Errors found:')
      
      result.messages.forEach((msg, i) => {
        console.log(`\n  ${i + 1}. ${msg.reason}`)
        
        // Debug: Print the full message object
        console.log('\n  DEBUG - Full message object:')
        console.log(JSON.stringify(msg, null, 2))
      })
    }
    
  } catch (error) {
    console.error('✗ Error processing:', error)
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('Test complete')
}

// Run tests
testGrammarChecking() 