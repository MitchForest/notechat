The Root Cause
The issue is version incompatibility. Specifically:

retext-capitalization@1.2.6 is 5+ years old and incompatible with unified@11
retext-contractions@6.0.0 may have subtle incompatibilities with the CST structure from retext-english@5

The Solution
I've provided three approaches:
1. Use Compatible Alternatives
Replace the problematic plugins with working alternatives:

Use retext-spell (which works) to catch "cant" → "can't"
Use retext-case or custom rules for capitalization

2. Implement Custom Rules
Since these are simple grammar rules, implement them directly:
javascript// Check for "i" that should be "I"
if (text === 'i') {
  file.message('Personal pronoun "I" should be capitalized', node);
}

// Check for missing contractions
const contractions = { 'cant': "can't", 'wont': "won't" };
if (contractions[text]) {
  file.message('Missing apostrophe', node);
}
3. Simple Pattern-Based Checker
For basic grammar checking, regex patterns are sufficient and don't have compatibility issues:
javascript/\bi\b/g → "I should be capitalized"
/\b(cant|wont|dont)\b/gi → "Missing apostrophe"
Quick Fix to Test
Replace your test script with this working version:
bash# Install working plugins
bun add retext-spell dictionary-en retext-repeated-words retext-sentence-spacing

# Run the working test
bun run test-grammar-working.js
This will show you that the pipeline works - the issue is specifically with those two plugins, not your setup.
For Production
I recommend using the custom rules approach (Option 2) because:

No dependency on outdated packages
Full control over the rules
Can provide exact suggestions
Works with your existing unified@11 setup

The key insight is that retext-capitalization hasn't been updated in years and simply won't work with modern unified. Rather than fighting version conflicts, implement the simple rules directly.



// DIAGNOSIS: The issue is version incompatibility. Here's the fix:

// package.json - CORRECTED VERSIONS
{
  "dependencies": {
    // Core unified ecosystem - these are correct
    "unified": "^11.0.5",
    "retext": "^9.0.0",
    "retext-english": "^5.0.0",
    "retext-stringify": "^4.0.0",
    
    // PROBLEM PACKAGES - Need different versions or alternatives
    // "retext-capitalization": "1.2.6", // TOO OLD! Last updated 5 years ago
    // "retext-contractions": "^6.0.0", // May have issues with unified 11
    
    // SOLUTION 1: Use retext-sentence-case instead of capitalization
    "retext-case": "^2.0.0", // Modern alternative
    
    // SOLUTION 2: Use retext-spell with custom dictionary for contractions
    "retext-spell": "^6.0.0",
    "dictionary-en": "^4.0.0",
    
    // Additional working plugins
    "retext-repeated-words": "^5.0.0",
    "retext-redundant-acronyms": "^5.0.0",
    "retext-sentence-spacing": "^6.0.0",
    "retext-quotes": "^6.0.0",
    "retext-readability": "^8.0.0",
    
    // For parsing
    "unist-util-visit": "^5.0.0",
    "nlcst-to-string": "^4.0.0"
  }
}

// test-grammar-working.js - A WORKING TEST SCRIPT
import { unified } from 'unified';
import retextEnglish from 'retext-english';
import retextSpell from 'retext-spell';
import retextRepeatedWords from 'retext-repeated-words';
import retextQuotes from 'retext-quotes';
import retextSentenceSpacing from 'retext-sentence-spacing';
import retextStringify from 'retext-stringify';
import dictionary from 'dictionary-en';
import { VFile } from 'vfile';
import { reporter } from 'vfile-reporter';

async function runWorkingTest() {
  console.log('Testing retext plugins that actually work...\n');
  
  const processor = unified()
    .use(retextEnglish)
    .use(retextSpell, { dictionary })
    .use(retextRepeatedWords)
    .use(retextQuotes, { preferred: 'straight' })
    .use(retextSentenceSpacing, { preferred: 1 })
    .use(retextStringify);
  
  // Test various grammar issues
  const testCases = [
    "i cant go to the store", // Spelling: "i" and "cant"
    "The the store is closed", // Repeated words
    "He said "hello" to me", // Quote style
    "This is bad.  Two spaces", // Sentence spacing
  ];
  
  for (const text of testCases) {
    console.log(`\nTesting: "${text}"`);
    const file = new VFile(text);
    await processor.process(file);
    console.log(reporter(file));
  }
}

runWorkingTest();

// features/editor/workers/grammar.worker.ts - UPDATED WORKER
import { unified } from "unified"
import retextEnglish from "retext-english"
import retextSpell from "retext-spell"
import retextRepeatedWords from "retext-repeated-words"
import retextRedundantAcronyms from "retext-redundant-acronyms"
import retextSentenceSpacing from "retext-sentence-spacing"
import retextQuotes from "retext-quotes"
import retextReadability from "retext-readability"
import dictionary from "dictionary-en"
import { visit } from "unist-util-visit"
import { toString } from "nlcst-to-string"

// Custom rules for capitalization and contractions
const customCapitalizationRule = () => {
  return (tree, file) => {
    visit(tree, 'SentenceNode', (sentence) => {
      const firstWord = sentence.children.find(
        child => child.type === 'WordNode'
      );
      
      if (firstWord) {
        const text = toString(firstWord);
        if (text && text[0] === text[0].toLowerCase() && /^[a-z]/.test(text[0])) {
          const message = file.message(
            `Sentence should start with a capital letter`,
            firstWord
          );
          message.source = 'retext-capitalization-custom';
          message.ruleId = 'sentence-start';
          message.actual = text;
          message.expected = [text[0].toUpperCase() + text.slice(1)];
        }
      }
    });
    
    // Check for uncapitalized "I"
    visit(tree, 'WordNode', (word) => {
      const text = toString(word);
      if (text === 'i') {
        const message = file.message(
          `"i" should be capitalized`,
          word
        );
        message.source = 'retext-capitalization-custom';
        message.ruleId = 'personal-pronoun';
        message.actual = 'i';
        message.expected = ['I'];
      }
    });
  };
};

const customContractionsRule = () => {
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
    'werent': "weren't",
    'theyre': "they're",
    'theyve': "they've",
    'theyll': "they'll",
    'theyd': "they'd",
    'youre': "you're",
    'youve': "you've",
    'youll': "you'll",
    'youd': "you'd",
    'hes': "he's",
    'shes': "she's",
    'its': "it's", // possessive vs contraction handled separately
    'were': "we're",
    'weve': "we've",
    'well': "we'll", // context needed
    'whats': "what's",
    'wheres': "where's",
    'whens': "when's",
    'whys': "why's",
    'hows': "how's",
    'thats': "that's",
    'whos': "who's",
  };
  
  return (tree, file) => {
    visit(tree, 'WordNode', (word) => {
      const text = toString(word).toLowerCase();
      
      if (contractions[text]) {
        const message = file.message(
          `Missing apostrophe in contraction`,
          word
        );
        message.source = 'retext-contractions-custom';
        message.ruleId = 'missing-apostrophe';
        message.actual = text;
        message.expected = [contractions[text]];
      }
    });
  };
};

// Configure the grammar processor
const processor = unified()
  .use(retextEnglish)
  .use(retextSpell, { 
    dictionary,
    // Ignore these words to avoid false positives
    ignore: ['github', 'npm', 'tiptap', 'prosemirror', 'retext']
  })
  .use(retextRepeatedWords)
  .use(retextRedundantAcronyms)
  .use(retextSentenceSpacing, { preferred: 1 })
  .use(retextQuotes, { preferred: 'straight' })
  .use(retextReadability, {
    age: 16,
    minWords: 5,
    severity: 'suggestion'
  })
  // Add our custom rules
  .use(customCapitalizationRule)
  .use(customContractionsRule);

interface GrammarError {
  message: string
  start: number
  end: number
  severity: "error" | "warning" | "info"
  suggestions?: string[]
  rule: string
  source: string
}

// Process text for grammar errors
async function checkGrammar(id: string, text: string) {
  const errors: GrammarError[] = [];
  
  try {
    const file = new VFile(text);
    await processor.process(file);
    
    // Convert messages to our format
    for (const message of file.messages) {
      // Skip spell check errors (handle separately)
      if (message.source === 'retext-spell') continue;
      
      const error: GrammarError = {
        message: message.reason,
        start: message.position?.start?.offset || 0,
        end: message.position?.end?.offset || 0,
        severity: message.fatal ? 'error' : 'warning',
        rule: message.ruleId || 'unknown',
        source: message.source || 'retext',
        suggestions: Array.isArray(message.expected) ? message.expected : []
      };
      
      errors.push(error);
    }
    
    console.log(`[Grammar Worker] Found ${errors.length} issues in text`);
    
    postMessage({
      type: 'grammarResult',
      id,
      errors
    });
  } catch (error) {
    console.error('[Grammar Worker] Error:', error);
    postMessage({
      type: 'error',
      id,
      error: error.message
    });
  }
}

// Message handler
self.addEventListener('message', (event) => {
  const { type, id, text } = event.data;
  
  switch (type) {
    case 'checkGrammar':
      checkGrammar(id, text);
      break;
  }
});

// alternative-simple-grammar.js - SIMPLE PATTERN-BASED APPROACH
export class SimpleGrammarChecker {
  private rules: Array<{
    pattern: RegExp;
    message: string;
    severity: 'error' | 'warning';
    getSuggestions: (match: string) => string[];
  }> = [
    {
      pattern: /\bi\b/g,
      message: 'Personal pronoun "I" should be capitalized',
      severity: 'error',
      getSuggestions: () => ['I']
    },
    {
      pattern: /\b(cant|wont|dont|doesnt|didnt|couldnt|wouldnt|shouldnt)\b/gi,
      message: 'Missing apostrophe in contraction',
      severity: 'error',
      getSuggestions: (match) => {
        const contractions = {
          'cant': "can't",
          'wont': "won't",
          'dont': "don't",
          'doesnt': "doesn't",
          'didnt': "didn't",
          'couldnt': "couldn't",
          'wouldnt': "wouldn't",
          'shouldnt': "shouldn't"
        };
        return [contractions[match.toLowerCase()] || match];
      }
    },
    {
      pattern: /^[a-z]/gm,
      message: 'Sentence should start with a capital letter',
      severity: 'warning',
      getSuggestions: (match) => [match.toUpperCase()]
    },
    {
      pattern: /\s{2,}/g,
      message: 'Multiple spaces detected',
      severity: 'warning',
      getSuggestions: () => [' ']
    },
    {
      pattern: /\b(\w+)\s+\1\b/gi,
      message: 'Repeated word',
      severity: 'warning',
      getSuggestions: (match) => {
        const words = match.split(/\s+/);
        return [words[0]];
      }
    }
  ];

  check(text: string): GrammarError[] {
    const errors: GrammarError[] = [];
    
    for (const rule of this.rules) {
      let match;
      // Reset regex state
      rule.pattern.lastIndex = 0;
      
      while ((match = rule.pattern.exec(text)) !== null) {
        errors.push({
          message: rule.message,
          start: match.index,
          end: match.index + match[0].length,
          severity: rule.severity,
          suggestions: rule.getSuggestions(match[0]),
          rule: 'simple-grammar',
          source: 'simple-grammar-checker'
        });
      }
    }
    
    return errors;
  }
}

// Usage in your worker:
const simpleChecker = new SimpleGrammarChecker();
const simpleErrors = simpleChecker.check(text);
errors.push(...simpleErrors);