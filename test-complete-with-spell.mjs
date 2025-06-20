// test-complete-with-spell.mjs
// Run this with: node test-complete-with-spell.mjs
// This tests the complete grammar AND spell checking logic

import { unified } from 'unified'
import retextEnglish from 'retext-english'
import retextSpell from 'retext-spell'
import retextRepeatedWords from 'retext-repeated-words'
import retextSentenceSpacing from 'retext-sentence-spacing'
import retextRedundantAcronyms from 'retext-redundant-acronyms'
import retextQuotes from 'retext-quotes'
import retextStringify from 'retext-stringify'
import { toString } from 'nlcst-to-string'
import { visit } from 'unist-util-visit'
import nspell from 'nspell'
import fs from 'fs'

// Load dictionary files as buffers
const affBuffer = fs.readFileSync('./public/dictionaries/en_US.aff')
const dicBuffer = fs.readFileSync('./public/dictionaries/en_US.dic')

// Create dictionary object for retext-spell
const dictionary = { aff: affBuffer, dic: dicBuffer }

// Custom rules (copied from custom-rules.ts)
function customCapitalizationRule() {
  return (tree, file) => {
    // Check for sentence capitalization
    visit(tree, 'SentenceNode', (sentence) => {
      const firstWord = sentence.children.find(
        (child) => child.type === 'WordNode'
      );
      
      if (firstWord) {
        const text = toString(firstWord);
        if (text && /^[a-z]/.test(text)) {
          const message = file.message(
            `Sentence should start with a capital letter`,
            firstWord
          );
          message.source = 'custom-capitalization';
          message.ruleId = 'sentence-start';
          message.actual = text;
          message.expected = [text[0].toUpperCase() + text.slice(1)];
        }
      }
    });
    
    // Check for uncapitalized "i"
    visit(tree, 'WordNode', (word) => {
      const text = toString(word);
      if (text === 'i') {
        const message = file.message(
          `"i" should be capitalized`,
          word
        );
        message.source = 'custom-capitalization';
        message.ruleId = 'personal-pronoun';
        message.actual = 'i';
        message.expected = ['I'];
      }
    });
  };
}

function customContractionsRule() {
  const contractions = {
    "cant": "can't", "wont": "won't", "dont": "don't", "isnt": "isn't",
    "arent": "aren't", "wasnt": "wasn't", "werent": "weren't", "its": "it's"
  };
  
  return (tree, file) => {
    visit(tree, 'WordNode', (word) => {
      const text = toString(word).toLowerCase();
      if (contractions[text]) {
        if (text === 'its') {
            const nextNode = word.parent?.children[word.parent.children.indexOf(word) + 2];
            if (nextNode && nextNode.type === 'WordNode') {
                const nextWord = toString(nextNode).toLowerCase();
                if (['a', 'an', 'the', 'is', 'was', 'has', 'been'].indexOf(nextWord) === -1) {
                    return;
                }
            }
        }

        const message = file.message(
          `Missing apostrophe in contraction`,
          word
        );
        message.source = 'custom-contractions';
        message.ruleId = 'missing-apostrophe';
        message.actual = text;
        message.expected = [contractions[text]];
      }
    });
  };
}

// Simulate the VFileMessageToCheckError function
function VFileMessageToCheckError(message, text) {
    // In vfile messages, the position is stored in 'place' property
    const position = message.place || message.position;
    
    if (!position || !position.start || !position.end) {
        console.log('[Grammar Worker] Skipping message without position:', message);
        return null;
    }

    const { start, end } = position;
    
    // Ensure we have offset values
    if (typeof start.offset !== 'number' || typeof end.offset !== 'number') {
        console.log('[Grammar Worker] Skipping message without offset values:', message);
        return null;
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

// Main test function
async function testCompleteChecking() {
  console.log('Testing Complete Grammar + Spell Checking\n' + '='.repeat(50))
  
  const testCases = [
    "my nameee is is Mitchell",
    "i cant spell gud. This is a testt of the spell checker.",
    "i cant believe its working",
    "The the cat sat on mat.",
    "Its a beautiful day",
    "this is a test.  Two spaces",
    'He said "hello" to me',
    "I have a speling error here",
    "This sentense has misteaks"
  ]
  
  for (const text of testCases) {
    console.log(`\nTesting: "${text}"`)
    console.log('-'.repeat(40))
    
    try {
      // Create processor matching the worker WITH spell checking
      const processor = unified()
        .use(retextEnglish)
        .use(retextSpell, { dictionary: dictionary })
        .use(retextRepeatedWords)
        .use(retextRedundantAcronyms)
        .use(retextSentenceSpacing)
        .use(retextQuotes, { preferred: "straight" })
        .use(customCapitalizationRule)
        .use(customContractionsRule)
        .use(retextStringify)
      
      // Process the text
      const result = await processor.process(text)
      
      // Convert messages to CheckError format
      const errors = result.messages
        .map((msg) => VFileMessageToCheckError(msg, text))
        .filter((error) => error !== null);
      
      console.log(`\nTotal errors found: ${errors.length}`)
      
      // Group errors by type
      const spellingErrors = errors.filter(e => e.source === 'retext-spell')
      const grammarErrors = errors.filter(e => e.source !== 'retext-spell')
      
      console.log(`- Spelling errors: ${spellingErrors.length}`)
      console.log(`- Grammar errors: ${grammarErrors.length}`)
      
      if (errors.length === 0) {
        console.log('\n✗ No errors found')
      } else {
        console.log('\n✓ Errors:')
        
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
      console.error('✗ Error processing:', error)
      console.error('Stack:', error.stack)
    }
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('Test complete')
}

// Run tests
testCompleteChecking() 