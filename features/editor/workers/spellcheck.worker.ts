import Typo from "typo-js";

let dictionary: Typo | null = null;
let userDictionary: Set<string> = new Set();
let wordCache: Map<string, boolean> = new Map();

interface CheckTextMessage {
  type: "checkText";
  id: string;
  text: string;
  ranges?: Array<{ start: number; end: number }>;
}

interface AddWordMessage {
  type: "addWord";
  word: string;
}

interface InitMessage {
  type: "init";
  language: string;
  userWords?: string[];
  baseUrl: string;
}

interface GetSuggestionsMessage {
  type: "getSuggestions";
  word: string;
}

// Initialize dictionary
async function initializeDictionary(language: string, baseUrl: string) {
  try {
    // Load dictionary files from public folder
    const [affData, dicData] = await Promise.all([
      fetch(`${baseUrl}/dictionaries/${language}.aff`).then((r) => r.text()),
      fetch(`${baseUrl}/dictionaries/${language}.dic`).then((r) => r.text()),
    ]);

    dictionary = new Typo(language, affData, dicData);
    
    // Pre-warm cache with common words
    const commonWords = ["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for"];
    commonWords.forEach((word: string) => wordCache.set(word, true));
    
    postMessage({ type: "ready", language });
  } catch (error) {
    postMessage({ type: "error", error: (error as Error).message, id: "init" });
  }
}

// Optimized word extraction
function extractWords(
  text: string
): Array<{ word: string; start: number; end: number }> {
  const words: Array<{ word: string; start: number; end: number }> = [];
  const wordRegex = /\b[\w']+\b/g;
  let match;

  while ((match = wordRegex.exec(text)) !== null) {
    words.push({
      word: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return words;
}

// Fast spell check with caching
function checkText(
  id: string,
  text: string,
  ranges?: Array<{ start: number; end: number }>
) {
  if (!dictionary) {
    // This should technically not be reachable due to the new CheckManager logic
    postMessage({ type: "error", id, error: "Dictionary not initialized" });
    return;
  }

  const errors: Array<{
    word: string;
    start: number;
    end: number;
    suggestions?: string[];
  }> = [];

  // If ranges provided, only check those areas (for incremental updates)
  const checkRanges = ranges || [{ start: 0, end: text.length }];

  for (const range of checkRanges) {
    const rangeText = text.slice(range.start, range.end);
    const words = extractWords(rangeText);

    for (const { word, start, end } of words) {
      const absoluteStart = range.start + start;
      const absoluteEnd = range.start + end;

      // Skip if in user dictionary
      if (userDictionary.has(word.toLowerCase())) {
        continue;
      }

      // Check cache first
      const cacheKey = word.toLowerCase();
      let isCorrect = wordCache.get(cacheKey);

      if (isCorrect === undefined) {
        // Not in cache, check with Typo.js
        isCorrect = dictionary.check(word);
        // Cache result (limit cache size)
        if (wordCache.size < 10000) {
          wordCache.set(cacheKey, isCorrect);
        }
      }

      if (!isCorrect) {
        errors.push({
          word,
          start: absoluteStart,
          end: absoluteEnd,
          // Don't calculate suggestions yet (lazy loading)
        });
      }
    }
  }

  postMessage({
    type: "result",
    id,
    errors,
  });
}

// Get suggestions for a specific word (called on hover)
function getSuggestions(word: string): string[] {
  if (!dictionary) return [];

  // Limit suggestions for performance
  const suggestions = dictionary.suggest(word);
  return suggestions.slice(0, 5);
}

// Message handler
self.addEventListener(
  "message",
  (event: MessageEvent<CheckTextMessage | AddWordMessage | InitMessage | GetSuggestionsMessage>) => {
    const message = event.data;

    switch (message.type) {
      case "init":
        initializeDictionary(message.language, message.baseUrl);
        if (message.userWords) {
          message.userWords.forEach((word: string) =>
            userDictionary.add(word.toLowerCase())
          );
        }
        break;

      case "checkText":
        checkText(message.id, message.text, message.ranges);
        break;

      case "addWord":
        userDictionary.add(message.word.toLowerCase());
        // Clear cache for this word
        wordCache.delete(message.word.toLowerCase());
        break;

      case "getSuggestions":
        const suggestions = getSuggestions(message.word);
        postMessage({
          type: "suggestions",
          word: message.word,
          suggestions,
        });
        break;
    }
  }
); 