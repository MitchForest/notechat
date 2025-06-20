// Grammar checking worker - JavaScript version
console.log('[Grammar Worker] Loading...');

// We'll need to load the dependencies dynamically
let processor = null;
let isInitialized = false;

// Simple error conversion function
function convertMessageToError(message, text) {
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
            process: async (text) => {
                console.log('[Grammar Worker] Processing text:', text.substring(0, 50) + '...');
                
                const messages = [];
                
                // Simple checks for demonstration
                // 1. Check for repeated words
                const words = text.split(/\s+/);
                for (let i = 0; i < words.length - 1; i++) {
                    if (words[i].toLowerCase() === words[i + 1].toLowerCase() && words[i].length > 0) {
                        const start = text.indexOf(words[i] + ' ' + words[i + 1]);
                        if (start >= 0) {
                            messages.push({
                                reason: `Unexpected repeated \`${words[i]}\`, remove one occurrence`,
                                place: {
                                    start: { offset: start },
                                    end: { offset: start + words[i].length + 1 + words[i + 1].length }
                                },
                                source: 'simple-repeated-words',
                                ruleId: words[i].toLowerCase(),
                                expected: [words[i]]
                            });
                        }
                    }
                }
                
                // 2. Check for lowercase sentence starts
                const sentences = text.split(/[.!?]+/);
                let currentOffset = 0;
                for (const sentence of sentences) {
                    const trimmed = sentence.trim();
                    if (trimmed.length > 0 && /^[a-z]/.test(trimmed)) {
                        const start = text.indexOf(trimmed, currentOffset);
                        if (start >= 0) {
                            const firstWord = trimmed.split(/\s+/)[0];
                            messages.push({
                                reason: 'Sentence should start with a capital letter',
                                place: {
                                    start: { offset: start },
                                    end: { offset: start + firstWord.length }
                                },
                                source: 'simple-capitalization',
                                ruleId: 'sentence-start',
                                expected: [firstWord.charAt(0).toUpperCase() + firstWord.slice(1)]
                            });
                        }
                    }
                    currentOffset += sentence.length + 1;
                }
                
                // 3. Check for some common misspellings
                const commonMisspellings = {
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
        self.postMessage({ type: "error", error: error.message });
    }
}

// Check function
async function check(id, text) {
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
            .map(msg => convertMessageToError(msg, text))
            .filter(error => error !== null);

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
        self.postMessage({ type: "error", id: id, error: error.message });
    }
}

// Message handler
self.onmessage = function(event) {
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