// Fixed Grammar Worker with proper message handling
console.log('[Grammar Worker] Loading...');

import { unified } from 'unified'
import retextEnglish from 'retext-english'
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
  word: string;
}

// Global state
let processor: any = null;
let isInitialized = false;
let baseUrl = '';

// Store active check data
const activeChecks = new Map<string, { paragraphId: string; skipWords?: string[] }>();

async function getProcessor(options: { ignore?: string[] } = {}) {
  if (processor && (!options.ignore || options.ignore.length === 0)) {
    return processor;
  }

  const [dicBuffer, affBuffer] = await Promise.all([
    fetch(`${baseUrl}/dictionaries/en_US.dic`).then(res => res.arrayBuffer()),
    fetch(`${baseUrl}/dictionaries/en_US.aff`).then(res => res.arrayBuffer()),
  ]);

  const dic = Buffer.from(dicBuffer);
  const aff = Buffer.from(affBuffer);

  return unified()
    .use(retextEnglish)
    .use(customContractionsRule)
    .use(retextRepeatedWords)
    .use(retextIndefiniteArticle)
    .use(retextSentenceSpacing)
    .use(retextSpell, { 
      dictionary: { dic, aff },
      ignore: options.ignore || [],
    })
    .use(customCapitalizationRule)
    .use(retextStringify);
}

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
  
  // Extract the actual word from the text
  const word = text.substring(start.offset, end.offset);
  
  return {
    message: message.reason || 'Error found',
    start: start.offset,
    end: end.offset,
    rule: message.ruleId || message.source || "unknown",
    source: message.source || "retext",
    suggestions: message.expected || [],
    word: word,
  };
}

async function initialize(newBaseUrl: string) {
  try {
    console.log('[Grammar Worker] Initializing with baseUrl:', newBaseUrl);
    baseUrl = newBaseUrl;

    // Pre-warm the processor
    processor = await getProcessor();
    
    console.log('[Grammar Worker] Processor created successfully');
    isInitialized = true;
    
    // Send ready message
    self.postMessage({ type: "ready" });
    console.log('[Grammar Worker] Initialization complete, ready message sent');
    
  } catch (error) {
    console.error('[Grammar Worker] Initialization failed:', error);
    self.postMessage({ 
      type: "error", 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
}

async function checkText(id: string, text: string, paragraphId: string, skipWords: string[] = []) {
  try {
    console.log(`[Grammar Worker] Starting check:`, {
      id,
      paragraphId,
      textLength: text.length,
      textPreview: text.substring(0, 50) + '...',
      skipWordsCount: skipWords.length
    });
    
    // Store the check info
    activeChecks.set(id, { paragraphId, skipWords });
    
    // Get processor with skip words
    const localProcessor = await getProcessor({ ignore: skipWords });
    
    // Process the text
    const file = await localProcessor.process(text);
    
    console.log(`[Grammar Worker] Processing complete for ${id}:`, {
      messagesFound: file.messages.length,
      messages: file.messages
    });
    
    // Convert messages to errors
    const errors = file.messages
      .map((msg: any) => convertMessageToError(msg, text))
      .filter((error: TextError | null): error is TextError => error !== null);

    console.log(`[Grammar Worker] Converted to ${errors.length} errors for ${id}`);
    
    if (errors.length > 0) {
      console.log("[Grammar Worker] Sample errors:", errors.slice(0, 3));
    }

    // Get the stored check info
    const checkInfo = activeChecks.get(id);
    if (!checkInfo) {
      console.error(`[Grammar Worker] No check info found for ${id}`);
      return;
    }

    // Send the result with the correct paragraph ID
    const result = {
      type: 'result',
      id: id,
      paragraphId: checkInfo.paragraphId,
      errors: errors
    };
    
    console.log(`[Grammar Worker] Sending result:`, {
      id: result.id,
      paragraphId: result.paragraphId,
      errorCount: result.errors.length
    });
    
    self.postMessage(result);
    
    // Clean up
    activeChecks.delete(id);

  } catch (error) {
    console.error("[Grammar Worker] Check failed:", error);
    const checkInfo = activeChecks.get(id);
    
    self.postMessage({ 
      type: "error", 
      id: id,
      paragraphId: checkInfo?.paragraphId,
      error: error instanceof Error ? error.message : String(error)
    });
    
    // Clean up
    activeChecks.delete(id);
  }
}

// Message handler
self.onmessage = async (event) => {
  const { type, id, text, baseUrl: newBaseUrl, paragraphId, skipWords } = event.data;
  
  console.log(`[Grammar Worker] Received message:`, {
    type,
    id,
    paragraphId,
    hasText: !!text,
    textLength: text?.length
  });
  
  switch(type) {
    case "init":
      if (!newBaseUrl) {
        console.error('[Grammar Worker] No baseUrl provided for init');
        return;
      }
      await initialize(newBaseUrl);
      break;
      
    case "check":
      if (!isInitialized) {
        console.error('[Grammar Worker] Not initialized yet, cannot check');
        self.postMessage({ 
          type: "error", 
          id: id,
          paragraphId: paragraphId,
          error: "Worker not initialized" 
        });
        return;
      }
      
      if (!text || !id || !paragraphId) {
        console.error('[Grammar Worker] Missing required fields for check:', { text: !!text, id: !!id, paragraphId: !!paragraphId });
        return;
      }
      
      await checkText(id, text, paragraphId, skipWords || []);
      break;
      
    default:
      console.log('[Grammar Worker] Unknown message type:', type);
  }
};

console.log('[Grammar Worker] Worker script loaded, waiting for init message');

// Also add some test data for debugging
if (typeof self !== 'undefined') {
  (self as any).debugInfo = {
    isInitialized: () => isInitialized,
    activeChecksCount: () => activeChecks.size,
    baseUrl: () => baseUrl
  };
}