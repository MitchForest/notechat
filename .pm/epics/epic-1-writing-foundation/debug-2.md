// test-grammar-worker.js
// Run this with: node test-grammar-worker.js
// This tests the grammar checking logic in isolation

import { unified } from 'unified'
import retextEnglish from 'retext-english'
import retextRepeatedWords from 'retext-repeated-words'
import retextSentenceSpacing from 'retext-sentence-spacing'
import retextQuotes from 'retext-quotes'
import { toString } from 'nlcst-to-string'
import { visit } from 'unist-util-visit'
import { VFile } from 'vfile'

// Custom contractions checker
function retextContractionsCustom() {
  return (tree, file) => {
    visit(tree, 'WordNode', (node) => {
      const word = toString(node).toLowerCase()
      
      const contractions = {
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

// Custom capitalization checker
function retextCapitalizationCustom() {
  return (tree, file) => {
    // Check uncapitalized "I"
    visit(tree, 'WordNode', (node) => {
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
    visit(tree, 'SentenceNode', (sentence) => {
      const firstWord = sentence.children.find(child => child.type === 'WordNode')
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

// Main test function
async function testGrammarChecking() {
  console.log('Testing Grammar Checking Logic\n' + '='.repeat(50))
  
  const testCases = [
    "my nameee is is Mitchell",
    "i cant believe its working",
    "The the cat sat on mat.",
    "Its a beautiful day",
    "this is a test.  Two spaces",
    "He said "hello" to me"
  ]
  
  for (const text of testCases) {
    console.log(`\nTesting: "${text}"`)
    console.log('-'.repeat(40))
    
    try {
      const file = new VFile(text)
      
      const processor = unified()
        .use(retextEnglish)
        .use(retextRepeatedWords)
        .use(retextSentenceSpacing, { preferred: 1 })
        .use(retextQuotes, { preferred: 'straight' })
        .use(retextContractionsCustom)
        .use(retextCapitalizationCustom)
      
      await processor.process(file)
      
      if (file.messages.length === 0) {
        console.log('✗ No errors found (This is the bug!)')
      } else {
        console.log(`✓ Found ${file.messages.length} errors:`)
        
        file.messages.forEach((msg, i) => {
          console.log(`\n  ${i + 1}. ${msg.reason}`)
          console.log(`     Position: ${msg.position?.start?.offset || 0} - ${msg.position?.end?.offset || 0}`)
          console.log(`     Source: ${msg.source || 'unknown'}`)
          console.log(`     Rule: ${msg.ruleId || 'none'}`)
          if (msg.actual) console.log(`     Actual: "${msg.actual}"`)
          if (msg.expected) console.log(`     Expected: ${msg.expected.join(', ')}`)
        })
      }
      
    } catch (error) {
      console.error('✗ Error processing:', error)
    }
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('Test complete')
}

// Debug the AST structure
async function debugAST() {
  console.log('\nDebugging AST Structure\n' + '='.repeat(50))
  
  const text = "i cant believe"
  const file = new VFile(text)
  
  const processor = unified()
    .use(retextEnglish)
    .use(() => {
      return (tree) => {
        console.log('Full AST:')
        console.log(JSON.stringify(tree, null, 2))
        
        visit(tree, 'WordNode', (node) => {
          console.log(`\nWord: "${toString(node)}"`)
          console.log('Node:', node)
        })
      }
    })
  
  await processor.process(file)
}

// Run tests
console.log('Running grammar checking tests...\n')
await testGrammarChecking()

// Uncomment to debug AST structure
// await debugAST()