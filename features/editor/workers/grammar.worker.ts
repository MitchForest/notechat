// features/editor/workers/grammar.worker.ts
import { unified } from "unified"
import retextEnglish from "retext-english"
import retextRepeatedWords from "retext-repeated-words"
import retextIndefiniteArticle from "retext-indefinite-article"
import retextRedundantAcronyms from "retext-redundant-acronyms"
import retextSentenceSpacing from "retext-sentence-spacing"
import retextQuotes from "retext-quotes"
import retextContractions from "retext-contractions"
import { VFile } from "vfile"
import { Position } from "unist"

let isProcessing = false;
const messageQueue: any[] = [];

// Configure retext pipeline
const processor = unified()
  .use(retextEnglish)
  .use(retextRepeatedWords)
  .use(retextIndefiniteArticle)
  .use(retextRedundantAcronyms)
  .use(retextSentenceSpacing)
  .use(retextQuotes, { preferred: "straight" })
  .use(retextContractions, { straight: true })

interface GrammarError {
  message: string
  start: number
  end: number
  severity: "error" | "warning" | "info"
  suggestions?: string[]
  rule: string
}

// Cache for processed sentences
const sentenceCache = new Map<string, GrammarError[]>()
const MAX_CACHE_SIZE = 5000

function isPosition(place: any): place is Position {
  return place && typeof place.start === "object" && typeof place.end === "object";
}

// Process text for grammar errors
async function checkGrammar(id: string, text: string) {
  try {
    const file = await processor.process(text)
    const errors: GrammarError[] = file.messages
      .filter((message) => isPosition(message.place))
      .map((message) => {
        const place = message.place as Position;
        return {
          message: message.reason,
          start: place.start.offset ?? 0,
          end: place.end.offset ?? 0,
          severity: message.fatal ? "error" : "warning",
          suggestions: (message as any).expected || [],
          rule: message.ruleId || message.source || "unknown",
        };
      })

    postMessage({
      type: "grammarResult",
      id,
      errors,
    })
  } catch (error) {
    postMessage({
      type: "error",
      id,
      error: (error as Error).message,
    })
  }
}

function processQueue() {
  if (isProcessing || messageQueue.length === 0) {
    return;
  }
  isProcessing = true;
  const message = messageQueue.shift();
  if (message) {
    handleMessage(message);
  } else {
    isProcessing = false;
  }
}

async function handleMessage(message: any) {
  try {
    switch (message.type) {
      case "checkGrammar":
        await checkGrammar(message.id, message.text)
        break
        
      case "clearCache":
        // Caching was removed, so this is a no-op but we keep it for API compatibility
        break
    }
  } catch (e) {
    postMessage({
      type: "error",
      id: message.id || "unknown",
      error: (e as Error).message,
    });
  } finally {
    isProcessing = false;
    processQueue();
  }
}

// Message handler
self.addEventListener("message", (event) => {
  messageQueue.push(event.data);
  processQueue();
}) 