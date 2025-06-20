// Test the worker directly to debug the exact issue
import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Creating worker...');

// Note: This is a rough simulation - in the browser it would be a Web Worker
// Let's create a test that mimics the browser environment

async function testWorkerDirectly() {
    console.log('Testing worker directly...');
    
    // Test text with obvious errors
    const testText = "hi three what is your namee? my name is Mitchell. no errors are ofund.";
    
    console.log(`Testing text: "${testText}"`);
    
    // Let's simulate what the worker should receive
    const workerMessage = {
        type: 'check',
        id: 'test-123',
        text: testText
    };
    
    console.log('Worker message:', workerMessage);
    
    // Since we can't directly test the Web Worker in Node, 
    // let's test the core logic that should be in the worker
    const { unified } = await import('unified');
    const { VFile } = await import('vfile');
    const retextEnglish = (await import('retext-english')).default;
    const retextRepeatedWords = (await import('retext-repeated-words')).default;
    const retextSentenceSpacing = (await import('retext-sentence-spacing')).default;
    const retextQuotes = (await import('retext-quotes')).default;
    
    console.log('Creating processor...');
    
    const processor = unified()
        .use(retextEnglish)
        .use(retextRepeatedWords)
        .use(retextSentenceSpacing)
        .use(retextQuotes, { preferred: "straight" });
    
    console.log('Processing text...');
    
    const result = await processor.process(testText);
    
    console.log('Raw messages from processor:', result.messages.length);
    
    result.messages.forEach((msg, i) => {
        console.log(`Message ${i + 1}:`, {
            reason: msg.reason,
            position: msg.position,
            place: msg.place,
            source: msg.source,
            ruleId: msg.ruleId,
            expected: msg.expected
        });
    });
    
    // Test the conversion function
    function VFileMessageToCheckError(message, text) {
        const position = message.place || message.position;
        
        if (!position || !position.start || !position.end) {
            console.log('Skipping message without position:', message);
            return null;
        }

        const { start, end } = position;
        
        if (typeof start.offset !== 'number' || typeof end.offset !== 'number') {
            console.log('Skipping message without offset values:', message);
            return null;
        }
        
        return {
            message: message.reason,
            start: start.offset,
            end: end.offset,
            rule: message.ruleId || "unknown",
            source: message.source || "unknown",
            suggestions: message.expected || [],
        };
    }
    
    const errors = result.messages
        .map(msg => VFileMessageToCheckError(msg, testText))
        .filter(error => error !== null);
    
    console.log(`Converted to ${errors.length} errors:`);
    errors.forEach((error, i) => {
        console.log(`Error ${i + 1}:`, error);
        console.log(`  Text: "${testText.substring(error.start, error.end)}"`);
    });
}

testWorkerDirectly().catch(console.error); 