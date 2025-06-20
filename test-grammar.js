import { unified } from 'unified';
import retextEnglish from 'retext-english';
import retextCapitalization from 'retext-capitalization';
import retextContractions from 'retext-contractions';
import retextStringify from 'retext-stringify';
import { VFile } from 'vfile';
import { reporter } from 'vfile-reporter';

async function runTest() {
  console.log('Running test exactly as per documentation...');

  const processor = unified()
    .use(retextEnglish)
    .use(retextCapitalization)
    .use(retextContractions)
    .use(retextStringify);

  const text = "i cant go to the store. its closed.";
  const file = new VFile(text);

  try {
    await processor.process(file);

    console.log(`\nTesting text: "${text}"`);
    console.error(reporter(file));

  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTest(); 