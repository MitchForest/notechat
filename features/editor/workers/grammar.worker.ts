// Simplified TypeScript grammar worker that works with Turbopack
console.log('[Grammar Worker] Loading...');

// Types
export interface TextError {
  message: string;
  start: number;
  end: number;
  rule: string;
  source: string;
  suggestions?: string[];
}

// We'll need to load the dependencies dynamically
let processor: any = null;
let isInitialized = false;

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
        console.log('[Grammar Worker] Starting initialization...');
        
        // For now, let's create a simple processor that finds basic issues
        // We'll simulate some grammar checking
        processor = {
            process: async (text: string) => {
                console.log('[Grammar Worker] Processing text:', text.substring(0, 50) + '...');
                
                const messages: any[] = [];
                
                // 1. More robust check for repeated words
                const wordRegex = /\b(\w+)\b/g;
                let match;
                const wordPositions = [];
                while ((match = wordRegex.exec(text)) !== null) {
                    wordPositions.push({
                        word: match[1],
                        start: match.index,
                        end: match.index + match[0].length
                    });
                }

                for (let i = 0; i < wordPositions.length - 1; i++) {
                    const currentWord = wordPositions[i];
                    const nextWord = wordPositions[i + 1];

                    if (currentWord.word.toLowerCase() === nextWord.word.toLowerCase()) {
                        const textBetween = text.substring(currentWord.end, nextWord.start);
                        if (textBetween.length > 0 && /^\s+$/.test(textBetween)) {
                            messages.push({
                                reason: `Unexpected repeated \`${currentWord.word}\`, remove one occurrence`,
                                place: {
                                    start: { offset: currentWord.end },
                                    end: { offset: nextWord.end }
                                },
                                source: 'simple-repeated-words',
                                ruleId: currentWord.word.toLowerCase(),
                                expected: [""]
                            });
                            i++; // Skip the next word as it's part of the pair
                        }
                    }
                }
                
                // 2. More robust check for lowercase sentence starts
                const sentenceRegex = /(^|[\.!?]\s+)([a-z])/g;
                while ((match = sentenceRegex.exec(text)) !== null) {
                    const lowercaseLetter = match[2];
                    const startPos = match.index === 0 ? 0 : match.index + match[1].length;
                    
                    // Find the end of the first word
                    const wordEndMatch = text.substring(startPos).match(/\w+/);
                    if (wordEndMatch) {
                        const firstWord = wordEndMatch[0];
                        messages.push({
                            reason: 'Sentence should start with a capital letter',
                            place: {
                                start: { offset: startPos },
                                end: { offset: startPos + firstWord.length }
                            },
                            source: 'simple-capitalization',
                            ruleId: 'sentence-start',
                            expected: [firstWord.charAt(0).toUpperCase() + firstWord.slice(1)]
                        });
                    }
                }
                
                // 3. Check for some common misspellings
                const commonMisspellings: Record<string, string> = {
                    'namee': 'name',
                    'testt': 'test',
                    'ofund': 'found',
                    'gud': 'good'
                };
                
                for (const [wrong, correct] of Object.entries(commonMisspellings)) {
                    const regex = new RegExp('\\b' + wrong + '\\b', 'gi');
                    let match;
                    while ((match = regex.exec(text)) !== null) {
                        messages.push({
                            reason: `Possible misspelling of "${wrong}"`,
                            place: {
                                start: { offset: match.index },
                                end: { offset: match.index + wrong.length }
                            },
                            source: 'simple-spell',
                            ruleId: wrong,
                            expected: [correct]
                        });
                    }
                }
                
                console.log('[Grammar Worker] Found', messages.length, 'issues');
                return { messages };
            }
        };
        
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

        const results = await processor.process(text);
        
        console.log(`[Grammar Worker] Processing complete. Messages found: ${results.messages.length}`);
        
        if (results.messages.length > 0) {
            console.log("[Grammar Worker] First message:", results.messages[0]);
        }
        
        const errors = results.messages
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
    const { type, id, text, baseUrl } = event.data;
    console.log(`[Grammar Worker] Received message: ${type}`);
    
    switch(type) {
        case "init":
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