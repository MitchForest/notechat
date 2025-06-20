// Simplified TypeScript grammar worker that works with Turbopack
console.log('[Grammar Worker] Loading...');

import { unified } from 'unified'
import retextEnglish from 'retext-english'
// import retextContractions from 'retext-contractions' // We'll use a custom rule instead
import retextRepeatedWords from 'retext-repeated-words'
import retextIndefiniteArticle from 'retext-indefinite-article'
import retextSentenceSpacing from 'retext-sentence-spacing'
import retextSpell from 'retext-spell'
import retextStringify from 'retext-stringify'
import { VFile } from 'vfile'
import { visit } from 'unist-util-visit'
import { Node } from 'unist'
import { customCapitalizationRule, customContractionsRule } from './custom-rules'

// Types
export interface TextError {
  message: string;
  start: number;
  end: number;
  rule: string;
  source: string;
  suggestions?: string[];
}

// Define a type for our options
interface CustomCapitalizationOptions {
  properNouns?: string[];
}

// We'll build a retext processor
let processor: any = null;
let isInitialized = false;
let baseUrl = '';
let dictionary: any;

// Simple error conversion function
function convertMessageToError(message: any, text: string): TextError | null {
    const position = message.place || message.position;
    
    if (!position || !position.start || !position.end) {
        console.log('[Grammar Worker] Skipping message without position:', message);
        return null;
    }

    const { start, end } = position;
    
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
    };
}

// Initialize function
async function initialize() {
    try {
        console.log('[Grammar Worker] Initializing retext processor...');

        // Fetch the dictionary files as buffers
        const [dicBuffer, affBuffer] = await Promise.all([
            fetch(`${baseUrl}/dictionaries/en_US.dic`).then(res => res.arrayBuffer()),
            fetch(`${baseUrl}/dictionaries/en_US.aff`).then(res => res.arrayBuffer()),
        ]);

        const dic = Buffer.from(dicBuffer);
        const aff = Buffer.from(affBuffer);
        
        // Build the text processing pipeline using unified
        processor = unified()
            .use(retextEnglish)
            .use(customContractionsRule)
            .use(retextRepeatedWords)
            .use(retextIndefiniteArticle)
            .use(retextSentenceSpacing)
            // Spell check should come after other grammatical checks
            .use(retextSpell, { dictionary: { dic, aff } })
            .use(customCapitalizationRule, {
                properNouns: ['Mitchell', 'Tiptap', 'ProseMirror', 'JavaScript', 'TypeScript']
            })
            .use(retextStringify);
            
        console.log('[Grammar Worker] Retext processor created with spell check');
        
        isInitialized = true;
        console.log('[Grammar Worker] Initialization complete');
        self.postMessage({ type: "ready" });
        
    } catch (error) {
        console.error('[Grammar Worker] Initialization failed:', error);
        self.postMessage({ type: "error", error: (error as Error).message });
    }
}

// Check function
async function check(id: string, text: string) {
    try {
        console.log(`[Grammar Worker] Checking text (id: ${id}): "${text.substring(0, 50)}..."`);
        
        if (!processor) {
            throw new Error("Processor not available.");
        }

        const file = await processor.process(text);
        
        console.log(`[Grammar Worker] Processing complete. Messages found: ${file.messages.length}`);
        
        if (file.messages.length > 0) {
            console.log("[Grammar Worker] First message:", file.messages[0]);
        }
        
        const errors = file.messages
            .map((msg: any) => convertMessageToError(msg, text))
            .filter((error: TextError | null): error is TextError => error !== null);

        console.log(`[Grammar Worker] Converted to ${errors.length} errors`);
        
        if (errors.length > 0) {
            console.log("[Grammar Worker] First error:", errors[0]);
        }

        self.postMessage({
            type: 'result',
            id: id,
            errors: errors,
        });

    } catch (error) {
        console.error("[Grammar Worker] Check failed:", error);
        self.postMessage({ type: "error", id: id, error: (error as Error).message });
    }
}

// Message handler
self.onmessage = (event) => {
    const { type, id, text, baseUrl: newBaseUrl } = event.data;
    console.log(`[Grammar Worker] Received message: ${type}`);
    
    switch(type) {
        case "init":
            baseUrl = newBaseUrl; // Store baseUrl for fetching
            initialize();
            break;
        case "check":
            if (!text) return; // Ignore empty checks
            check(id, text);
            break;
        default:
            console.log('[Grammar Worker] Unknown message type:', type);
    }
};

console.log('[Grammar Worker] Ready');