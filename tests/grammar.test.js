import { unified } from 'unified';
import retextEnglish from 'retext-english';
import retextSpell from 'retext-spell';
import retextRepeatedWords from 'retext-repeated-words';
import retextSentenceSpacing from 'retext-sentence-spacing';
import retextQuotes from 'retext-quotes';
import retextStringify from 'retext-stringify';
import { VFile } from 'vfile';
import { reporter } from 'vfile-reporter';
import fs from 'fs';
import path from 'path';
import { customCapitalizationRule, customContractionsRule } from '../features/editor/workers/custom-rules.js';

async function runVerificationTest() {
  console.log('--- Running Unified Checker Verification Test ---');

  // Load dictionary from file system for Node.js test environment
  const aff = fs.readFileSync(path.join(process.cwd(), 'public/dictionaries/en_US.aff'));
  const dic = fs.readFileSync(path.join(process.cwd(), 'public/dictionaries/en_US.dic'));

  const processor = unified()
    .use(retextEnglish)
    .use(retextSpell, { dictionary: { aff, dic } })
    .use(retextRepeatedWords)
    .use(retextSentenceSpacing)
    .use(retextQuotes, { preferred: 'straight' })
    .use(customCapitalizationRule)
    .use(customContractionsRule)
    .use(retextStringify);

  const testCases = [
    "this sentence has two errrors.", // Capitalization + Spelling
    "i cant believe its not butter.", // Capitalization (i) + Contraction (cant) + Contraction (its)
    "This is is a test of the checker.", // Repeated word
    "This is a sentance.", // Spelling
    "He said 'hello world' but meant to use straight quotes." // Quote check (should not find error)
  ];

  console.log('\\n--- Processing Test Cases ---');
  for (const text of testCases) {
    console.log(`\\n>>> Testing: "${text}"`);
    const file = new VFile(text);
    await processor.process(file);
    const report = reporter(file);
    if (report) {
      console.error(report);
    } else {
      console.log('    No issues found.');
    }
  }
  console.log('\\n--- Test Complete ---');
}

runVerificationTest(); 