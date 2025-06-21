# Epic: Writing Foundation 📝

## Overview
**Goal**: Implement a blazing-fast, professional writing experience with Novel editor and real-time spell/grammar checking  
**Duration**: 2 sprints (1 week)  
**Outcome**: A writing environment that rivals or exceeds Google Docs/Grammarly in performance and accuracy

## Success Criteria
- **Performance**: <50ms latency for spell check feedback while typing
- **Accuracy**: 95%+ spell check accuracy, 85%+ grammar detection
- **Scale**: Smooth performance with 100k+ word documents
- **UX**: Seamless typing experience with no stutters or lag
- **Memory**: <100MB memory overhead for checking system

## Sprint 0.1: Novel Editor Setup & Basic Spell Check

### Objectives
- Install and configure Novel editor properly
- Implement performant spell checking with typo.js
- Create efficient decoration system for errors
- Handle all input methods (typing, paste, undo/redo)

### Day 1-2: Novel Editor Installation & Configuration

#### 1. Install Dependencies
```bash
# Core Novel dependencies
bun add novel @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder
bun add @tiptap/extension-highlight @tiptap/extension-task-list @tiptap/extension-task-item
bun add @tiptap/extension-horizontal-rule @tiptap/extension-code-block-lowlight
bun add lowlight react-markdown

# Spell check dependencies
bun add typo-js
bun add -d @types/typo-js

# Performance monitoring (dev)
bun add -d web-vitals
```

#### 2. Novel Editor Setup
```typescript
// features/editor/components/novel-editor.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import { SpellCheckExtension } from "../extensions/spellcheck"
import { EditorBubbleMenu } from "./editor-bubble-menu"
import { cn } from "@/lib/utils"

interface NovelEditorProps {
  content?: string
  onChange?: (content: string) => void
  onSelectionChange?: (selection: { from: number; to: number }) => void
  className?: string
  editable?: boolean
}

export function NovelEditor({
  content = "",
  onChange,
  onSelectionChange,
  className,
  editable = true,
}: NovelEditorProps) {
  const [hydrated, setHydrated] = useState(false)
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: "list-disc list-outside leading-3",
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: "list-decimal list-outside leading-3",
          },
        },
        listItem: {
          HTMLAttributes: {
            class: "leading-normal",
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: "border-l-4 border-border pl-4",
          },
        },
        codeBlock: {
          HTMLAttributes: {
            class: "rounded-lg bg-muted p-4 font-mono text-sm",
          },
        },
        code: {
          HTMLAttributes: {
            class: "rounded-md bg-muted px-1.5 py-1 font-mono text-sm",
          },
        },
        heading: {
          levels: [1, 2, 3],
          HTMLAttributes: {
            class: "font-heading",
          },
        },
        paragraph: {
          HTMLAttributes: {
            class: "leading-7",
          },
        },
      }),
      Placeholder.configure({
        placeholder: "Start writing...",
        emptyEditorClass: "is-empty",
      }),
      SpellCheckExtension.configure({
        enabled: true,
        debounceMs: 300,
        language: "en_US",
      }),
    ],
    content,
    editable,
    autofocus: "end",
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-neutral dark:prose-invert max-w-none",
          "focus:outline-none",
          "min-h-[500px]",
          className
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection
      onSelectionChange?.({ from, to })
    },
  })
  
  // Hydration fix for SSR
  useEffect(() => {
    setHydrated(true)
  }, [])
  
  if (!editor || !hydrated) {
    return (
      <div className={cn("min-h-[500px] animate-pulse rounded-lg bg-muted", className)} />
    )
  }
  
  return (
    <div className="relative">
      <EditorContent editor={editor} />
      <EditorBubbleMenu editor={editor} />
    </div>
  )
}
```

### Day 3-4: High-Performance Spell Check Implementation

#### 3. Web Worker Setup
```typescript
// features/editor/workers/spellcheck.worker.ts
import Typo from "typo-js"

let dictionary: Typo | null = null
let userDictionary: Set<string> = new Set()
let wordCache: Map<string, boolean> = new Map()

// Message types
interface CheckTextMessage {
  type: "checkText"
  id: string
  text: string
  ranges?: Array<{ start: number; end: number }>
}

interface AddWordMessage {
  type: "addWord"
  word: string
}

interface InitMessage {
  type: "init"
  language: string
  userWords?: string[]
}

// Initialize dictionary
async function initializeDictionary(language: string) {
  try {
    // Load dictionary files from public folder
    const [affData, dicData] = await Promise.all([
      fetch(`/dictionaries/${language}.aff`).then(r => r.text()),
      fetch(`/dictionaries/${language}.dic`).then(r => r.text()),
    ])
    
    dictionary = new Typo(language, affData, dicData)
    
    // Pre-warm cache with common words
    const commonWords = ["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for"]
    commonWords.forEach(word => wordCache.set(word, true))
    
    postMessage({ type: "ready", language })
  } catch (error) {
    postMessage({ type: "error", error: error.message })
  }
}

// Optimized word extraction
function extractWords(text: string): Array<{ word: string; start: number; end: number }> {
  const words: Array<{ word: string; start: number; end: number }> = []
  const wordRegex = /\b[\w']+\b/g
  let match
  
  while ((match = wordRegex.exec(text)) !== null) {
    words.push({
      word: match[0],
      start: match.index,
      end: match.index + match[0].length,
    })
  }
  
  return words
}

// Fast spell check with caching
function checkText(id: string, text: string, ranges?: Array<{ start: number; end: number }>) {
  if (!dictionary) {
    postMessage({ type: "error", id, error: "Dictionary not initialized" })
    return
  }
  
  const errors: Array<{
    word: string
    start: number
    end: number
    suggestions?: string[]
  }> = []
  
  // If ranges provided, only check those areas (for incremental updates)
  const checkRanges = ranges || [{ start: 0, end: text.length }]
  
  for (const range of checkRanges) {
    const rangeText = text.slice(range.start, range.end)
    const words = extractWords(rangeText)
    
    for (const { word, start, end } of words) {
      const absoluteStart = range.start + start
      const absoluteEnd = range.start + end
      
      // Skip if in user dictionary
      if (userDictionary.has(word.toLowerCase())) {
        continue
      }
      
      // Check cache first
      const cacheKey = word.toLowerCase()
      let isCorrect = wordCache.get(cacheKey)
      
      if (isCorrect === undefined) {
        // Not in cache, check with Typo.js
        isCorrect = dictionary.check(word)
        // Cache result (limit cache size)
        if (wordCache.size < 10000) {
          wordCache.set(cacheKey, isCorrect)
        }
      }
      
      if (!isCorrect) {
        errors.push({
          word,
          start: absoluteStart,
          end: absoluteEnd,
          // Don't calculate suggestions yet (lazy loading)
        })
      }
    }
  }
  
  postMessage({
    type: "result",
    id,
    errors,
  })
}

// Get suggestions for a specific word (called on hover)
function getSuggestions(word: string): string[] {
  if (!dictionary) return []
  
  // Limit suggestions for performance
  const suggestions = dictionary.suggest(word)
  return suggestions.slice(0, 5)
}

// Message handler
self.addEventListener("message", (event) => {
  const message = event.data
  
  switch (message.type) {
    case "init":
      initializeDictionary(message.language)
      if (message.userWords) {
        message.userWords.forEach(word => userDictionary.add(word.toLowerCase()))
      }
      break
      
    case "checkText":
      checkText(message.id, message.text, message.ranges)
      break
      
    case "addWord":
      userDictionary.add(message.word.toLowerCase())
      // Clear cache for this word
      wordCache.delete(message.word.toLowerCase())
      break
      
    case "getSuggestions":
      const suggestions = getSuggestions(message.word)
      postMessage({
        type: "suggestions",
        word: message.word,
        suggestions,
      })
      break
  }
})
```

#### 4. Spell Check Extension
```typescript
// features/editor/extensions/spellcheck.ts
import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "prosemirror-state"
import { Decoration, DecorationSet } from "prosemirror-view"
import debounce from "lodash/debounce"

interface SpellCheckOptions {
  enabled: boolean
  debounceMs: number
  language: string
}

interface SpellError {
  word: string
  start: number
  end: number
  suggestions?: string[]
}

const spellCheckPluginKey = new PluginKey("spellCheck")

export const SpellCheckExtension = Extension.create<SpellCheckOptions>({
  name: "spellCheck",
  
  addOptions() {
    return {
      enabled: true,
      debounceMs: 300,
      language: "en_US",
    }
  },
  
  addProseMirrorPlugins() {
    const extension = this
    
    return [
      new Plugin({
        key: spellCheckPluginKey,
        state: {
          init() {
            return {
              decorations: DecorationSet.empty,
              worker: null as Worker | null,
              errors: new Map<string, SpellError[]>(),
              paragraphHashes: new Map<string, string>(),
              pendingChecks: new Map<string, AbortController>(),
            }
          },
          apply(tr, state) {
            if (!tr.docChanged) return state
            
            // Mark affected paragraphs for rechecking
            const affectedParagraphs = new Set<number>()
            
            tr.steps.forEach((step) => {
              const stepMap = step.getMap()
              // This is simplified - in real implementation, 
              // we'd calculate exact paragraph positions
              tr.doc.nodesBetween(0, tr.doc.content.size, (node, pos) => {
                if (node.type.name === "paragraph") {
                  affectedParagraphs.add(pos)
                }
              })
            })
            
            return {
              ...state,
              affectedParagraphs,
            }
          },
        },
        
        props: {
          decorations(state) {
            return this.getState(state).decorations
          },
        },
        
        view(view) {
          const state = spellCheckPluginKey.getState(view.state)
          
          // Initialize worker
          const worker = new Worker(
            new URL("../workers/spellcheck.worker.ts", import.meta.url)
          )
          
          worker.postMessage({
            type: "init",
            language: extension.options.language,
          })
          
          // Debounced check function
          const checkDocument = debounce(() => {
            const pluginState = spellCheckPluginKey.getState(view.state)
            const { doc } = view.state
            
            // Check each paragraph
            doc.nodesBetween(0, doc.content.size, (node, pos) => {
              if (node.type.name === "paragraph") {
                const text = node.textContent
                const paragraphId = `p-${pos}`
                
                // Calculate hash for caching
                const hash = simpleHash(text)
                const oldHash = pluginState.paragraphHashes.get(paragraphId)
                
                if (hash !== oldHash) {
                  // Cancel pending check for this paragraph
                  pluginState.pendingChecks.get(paragraphId)?.abort()
                  
                  const controller = new AbortController()
                  pluginState.pendingChecks.set(paragraphId, controller)
                  
                  // Send to worker
                  worker.postMessage({
                    type: "checkText",
                    id: paragraphId,
                    text,
                    position: pos,
                  })
                  
                  // Update hash
                  pluginState.paragraphHashes.set(paragraphId, hash)
                }
              }
            })
          }, extension.options.debounceMs)
          
          // Handle worker messages
          worker.onmessage = (event) => {
            const { type, id, errors } = event.data
            
            if (type === "result") {
              const pluginState = spellCheckPluginKey.getState(view.state)
              const position = parseInt(id.split("-")[1])
              
              // Create decorations for errors
              const decorations: Decoration[] = errors.map((error: SpellError) => {
                return Decoration.inline(
                  position + error.start + 1, // +1 for paragraph start
                  position + error.end + 1,
                  {
                    class: "spell-error",
                    nodeName: "span",
                  },
                  {
                    error,
                    position,
                  }
                )
              })
              
              // Update decorations efficiently
              const tr = view.state.tr
              const oldDecorations = pluginState.decorations
              
              // Remove old decorations for this paragraph
              const newDecorations = oldDecorations.remove(
                oldDecorations.find(position, position + node.nodeSize)
              )
              
              // Add new decorations
              const finalDecorations = newDecorations.add(
                tr.doc,
                decorations
              )
              
              // Update state
              tr.setMeta(spellCheckPluginKey, {
                decorations: finalDecorations,
              })
              
              view.dispatch(tr)
            }
          }
          
          // Initial check
          checkDocument()
          
          return {
            update(view, prevState) {
              if (!view.state.doc.eq(prevState.doc)) {
                checkDocument()
              }
            },
            
            destroy() {
              worker.terminate()
              checkDocument.cancel()
            },
          }
        },
      }),
    ]
  },
})

// Simple hash function for paragraph caching
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash.toString(36)
}
```

### Day 5: Error Decorations & Interactions

#### 5. CSS for Error Decorations
```css
/* features/editor/styles/spellcheck.css */
.spell-error {
  position: relative;
  text-decoration: underline wavy transparent;
  text-decoration-color: rgb(239 68 68 / 0.8);
  text-decoration-thickness: 2px;
  text-underline-offset: 3px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.spell-error:hover {
  text-decoration-color: rgb(239 68 68);
  background-color: rgb(254 202 202 / 0.1);
  border-radius: 2px;
}

.grammar-error {
  text-decoration: underline wavy transparent;
  text-decoration-color: rgb(59 130 246 / 0.8);
  text-decoration-thickness: 2px;
  text-underline-offset: 3px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.grammar-error:hover {
  text-decoration-color: rgb(59 130 246);
  background-color: rgb(191 219 254 / 0.1);
  border-radius: 2px;
}

/* Tooltip styles */
.spell-check-tooltip {
  position: absolute;
  z-index: 50;
  padding: 0.5rem;
  background: hsl(var(--popover));
  border: 1px solid hsl(var(--border));
  border-radius: 0.375rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.15s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Loading state for suggestions */
.suggestion-loading {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid hsl(var(--muted));
  border-top-color: hsl(var(--primary));
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

#### 6. Suggestion Tooltip Component
```typescript
// features/editor/components/suggestion-tooltip.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { Check, X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SuggestionTooltipProps {
  word: string
  suggestions: string[]
  position: { top: number; left: number }
  onApply: (suggestion: string) => void
  onIgnore: () => void
  onAddToDictionary: () => void
  onClose: () => void
}

export function SuggestionTooltip({
  word,
  suggestions,
  position,
  onApply,
  onIgnore,
  onAddToDictionary,
  onClose,
}: SuggestionTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
          e.preventDefault()
          setSelectedIndex((i) => Math.max(0, i - 1))
          break
        case "ArrowDown":
          e.preventDefault()
          setSelectedIndex((i) => Math.min(suggestions.length - 1, i + 1))
          break
        case "Enter":
          e.preventDefault()
          if (suggestions[selectedIndex]) {
            onApply(suggestions[selectedIndex])
          }
          break
        case "Escape":
          e.preventDefault()
          onClose()
          break
      }
    }
    
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedIndex, suggestions, onApply, onClose])
  
  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [onClose])
  
  // Position tooltip to avoid viewport edges
  useEffect(() => {
    if (tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      // Adjust horizontal position
      if (rect.right > viewportWidth) {
        tooltipRef.current.style.left = `${viewportWidth - rect.width - 10}px`
      }
      
      // Adjust vertical position
      if (rect.bottom > viewportHeight) {
        tooltipRef.current.style.top = `${position.top - rect.height - 10}px`
      }
    }
  }, [position])
  
  return (
    <div
      ref={tooltipRef}
      className="spell-check-tooltip"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className="mb-2 text-sm font-medium text-muted-foreground">
        Suggestions for "{word}"
      </div>
      
      {suggestions.length > 0 ? (
        <div className="space-y-1">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              className={cn(
                "flex w-full items-center rounded px-2 py-1 text-left text-sm transition-colors",
                index === selectedIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              )}
              onClick={() => onApply(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : (
        <div className="py-2 text-sm text-muted-foreground">
          No suggestions available
        </div>
      )}
      
      <div className="mt-3 flex gap-1 border-t pt-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={onIgnore}
          className="h-7 text-xs"
        >
          <X className="mr-1 h-3 w-3" />
          Ignore
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onAddToDictionary}
          className="h-7 text-xs"
        >
          <Plus className="mr-1 h-3 w-3" />
          Add to dictionary
        </Button>
      </div>
    </div>
  )
}
```

### Testing for Sprint 0.1
- [ ] Novel editor loads without errors
- [ ] Typing feels smooth with no lag
- [ ] Spell errors appear within 300ms of typing
- [ ] Red wavy underlines render correctly
- [ ] Hover shows suggestion tooltip
- [ ] Click on error shows suggestions
- [ ] Apply suggestion works correctly
- [ ] Add to dictionary works
- [ ] Paste large text doesn't freeze UI
- [ ] Memory usage stays under 100MB
- [ ] Dictionary loads successfully
- [ ] Works offline after initial load

---

## Sprint 0.2: Grammar Checking & Advanced Features

### Objectives
- Add retext-based grammar checking
- Implement smart caching and performance optimizations
- Handle edge cases and large documents
- Polish the UX with smooth animations

### Day 1-2: Retext Grammar Integration

#### 1. Install Grammar Dependencies
```bash
# Retext and plugins
bun add unified retext retext-english
bun add retext-repeated-words retext-indefinite-article retext-redundant-acronyms
bun add retext-sentence-spacing retext-quotes retext-contractions
bun add retext-diacritics retext-no-emojis

# Grammar-specific utilities
bun add nlcst-to-string unist-util-visit
```

#### 2. Grammar Check Worker
```typescript
// features/editor/workers/grammar.worker.ts
import { unified } from "unified"
import retextEnglish from "retext-english"
import retextRepeatedWords from "retext-repeated-words"
import retextIndefiniteArticle from "retext-indefinite-article"
import retextRedundantAcronyms from "retext-redundant-acronyms"
import retextSentenceSpacing from "retext-sentence-spacing"
import retextQuotes from "retext-quotes"
import retextContractions from "retext-contractions"
import { visit } from "unist-util-visit"

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

// Process text for grammar errors
async function checkGrammar(id: string, text: string, ranges?: Array<{ start: number; end: number }>) {
  const errors: GrammarError[] = []
  
  try {
    // Process with retext
    const tree = processor.parse(text)
    const messages = await processor.run(tree)
    
    // Extract errors from messages
    visit(tree, "SentenceNode", (node: any) => {
      const sentenceStart = node.position.start.offset
      const sentenceEnd = node.position.end.offset
      const sentenceText = text.slice(sentenceStart, sentenceEnd)
      
      // Check cache
      const cacheKey = sentenceText.trim()
      const cached = sentenceCache.get(cacheKey)
      
      if (cached) {
        // Adjust positions for cached results
        cached.forEach((error) => {
          errors.push({
            ...error,
            start: sentenceStart + error.start,
            end: sentenceStart + error.end,
          })
        })
        return
      }
      
      // Process new sentence
      const sentenceErrors: GrammarError[] = []
      
      messages.forEach((message: any) => {
        if (
          message.position &&
          message.position.start.offset >= sentenceStart &&
          message.position.end.offset <= sentenceEnd
        ) {
          sentenceErrors.push({
            message: message.message,
            start: message.position.start.offset - sentenceStart,
            end: message.position.end.offset - sentenceStart,
            severity: message.fatal ? "error" : "warning",
            rule: message.ruleId || message.source || "grammar",
            suggestions: message.expected || [],
          })
        }
      })
      
      // Cache result
      if (sentenceCache.size >= MAX_CACHE_SIZE) {
        // LRU eviction - remove oldest entries
        const firstKey = sentenceCache.keys().next().value
        sentenceCache.delete(firstKey)
      }
      sentenceCache.set(cacheKey, sentenceErrors)
      
      // Add to results with adjusted positions
      sentenceErrors.forEach((error) => {
        errors.push({
          ...error,
          start: sentenceStart + error.start,
          end: sentenceStart + error.end,
        })
      })
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
      error: error.message,
    })
  }
}

// Message handler
self.addEventListener("message", (event) => {
  const { type, id, text, ranges } = event.data
  
  switch (type) {
    case "checkGrammar":
      checkGrammar(id, text, ranges)
      break
      
    case "clearCache":
      sentenceCache.clear()
      break
  }
})
```

### Day 3-4: Combined Spell & Grammar System

#### 3. Unified Check Manager
```typescript
// features/editor/services/check-manager.ts
import { Editor } from "@tiptap/core"
import PQueue from "p-queue"

interface CheckResult {
  spell: SpellError[]
  grammar: GrammarError[]
}

export class CheckManager {
  private spellWorker: Worker
  private grammarWorker: Worker
  private checkQueue: PQueue
  private paragraphCache: Map<string, CheckResult>
  private pendingChecks: Map<string, AbortController>
  
  constructor() {
    this.spellWorker = new Worker(
      new URL("../workers/spellcheck.worker.ts", import.meta.url)
    )
    this.grammarWorker = new Worker(
      new URL("../workers/grammar.worker.ts", import.meta.url)
    )
    
    // Priority queue for check operations
    this.checkQueue = new PQueue({
      concurrency: 2,
      timeout: 5000,
    })
    
    this.paragraphCache = new Map()
    this.pendingChecks = new Map()
    
    this.initializeWorkers()
  }
  
  private initializeWorkers() {
    this.spellWorker.postMessage({
      type: "init",
      language: "en_US",
    })
    
    // Warm up grammar worker
    this.grammarWorker.postMessage({
      type: "checkGrammar",
      id: "warmup",
      text: "This is a warmup sentence.",
    })
  }
  
  async checkParagraph(
    id: string,
    text: string,
    priority: "high" | "normal" | "low" = "normal"
  ): Promise<CheckResult> {
    // Check cache first
    const cacheKey = this.hashText(text)
    const cached = this.paragraphCache.get(cacheKey)
    if (cached) return cached
    
    // Cancel any pending check for this paragraph
    this.pendingChecks.get(id)?.abort()
    
    const controller = new AbortController()
    this.pendingChecks.set(id, controller)
    
    // Queue the check with priority
    const priorityValue = { high: 1, normal: 5, low: 10 }[priority]
    
    try {
      const result = await this.checkQueue.add(
        async () => {
          if (controller.signal.aborted) {
            throw new Error("Check cancelled")
          }
          
          // Run spell and grammar check in parallel
          const [spellErrors, grammarErrors] = await Promise.all([
            this.runSpellCheck(id, text),
            this.runGrammarCheck(id, text),
          ])
          
          const result: CheckResult = {
            spell: spellErrors,
            grammar: grammarErrors,
          }
          
          // Cache result
          this.paragraphCache.set(cacheKey, result)
          
          // Limit cache size
          if (this.paragraphCache.size > 1000) {
            const firstKey = this.paragraphCache.keys().next().value
            this.paragraphCache.delete(firstKey)
          }
          
          return result
        },
        { priority: priorityValue }
      )
      
      return result
    } finally {
      this.pendingChecks.delete(id)
    }
  }
  
  private runSpellCheck(id: string, text: string): Promise<SpellError[]> {
    return new Promise((resolve) => {
      const handler = (event: MessageEvent) => {
        if (event.data.type === "result" && event.data.id === id) {
          this.spellWorker.removeEventListener("message", handler)
          resolve(event.data.errors)
        }
      }
      
      this.spellWorker.addEventListener("message", handler)
      this.spellWorker.postMessage({
        type: "checkText",
        id,
        text,
      })
    })
  }
  
  private runGrammarCheck(id: string, text: string): Promise<GrammarError[]> {
    return new Promise((resolve) => {
      const handler = (event: MessageEvent) => {
        if (event.data.type === "grammarResult" && event.data.id === id) {
          this.grammarWorker.removeEventListener("message", handler)
          resolve(event.data.errors)
        }
      }
      
      this.grammarWorker.addEventListener("message", handler)
      this.grammarWorker.postMessage({
        type: "checkGrammar",
        id,
        text,
      })
    })
  }
  
  async getSuggestions(word: string): Promise<string[]> {
    return new Promise((resolve) => {
      const handler = (event: MessageEvent) => {
        if (event.data.type === "suggestions" && event.data.word === word) {
          this.spellWorker.removeEventListener("message", handler)
          resolve(event.data.suggestions)
        }
      }
      
      this.spellWorker.addEventListener("message", handler)
      this.spellWorker.postMessage({
        type: "getSuggestions",
        word,
      })
    })
  }
  
  addToUserDictionary(word: string) {
    this.spellWorker.postMessage({
      type: "addWord",
      word,
    })
    
    // Clear cache entries containing this word
    this.paragraphCache.forEach((value, key) => {
      if (key.includes(word)) {
        this.paragraphCache.delete(key)
      }
    })
  }
  
  private hashText(text: string): string {
    // Simple but fast hash function
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i)
      hash = hash & hash
    }
    return `${hash}-${text.length}`
  }
  
  destroy() {
    this.spellWorker.terminate()
    this.grammarWorker.terminate()
    this.checkQueue.clear()
    this.paragraphCache.clear()
    this.pendingChecks.forEach((controller) => controller.abort())
  }
}
```

### Day 5: Performance Monitoring & Polish

#### 4. Performance Monitor
```typescript
// features/editor/utils/performance-monitor.ts
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()
  
  measure<T>(name: string, fn: () => T): T {
    const start = performance.now()
    const result = fn()
    const duration = performance.now() - start
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    const metricArray = this.metrics.get(name)!
    metricArray.push(duration)
    
    // Keep last 100 measurements
    if (metricArray.length > 100) {
      metricArray.shift()
    }
    
    // Log if slow
    if (duration > 50) {
      console.warn(`Slow ${name}: ${duration.toFixed(2)}ms`)
    }
    
    return result
  }
  
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    const result = await fn()
    const duration = performance.now() - start
    
    // ... same metric tracking
    
    return result
  }
  
  getStats(name: string) {
    const metrics = this.metrics.get(name) || []
    if (metrics.length === 0) return null
    
    const sorted = [...metrics].sort((a, b) => a - b)
    
    return {
      count: metrics.length,
      mean: metrics.reduce((a, b) => a + b, 0) / metrics.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      min: sorted[0],
      max: sorted[sorted.length - 1],
    }
  }
  
  logAllStats() {
    console.group("Performance Stats")
    for (const [name, _] of this.metrics) {
      const stats = this.getStats(name)
      if (stats) {
        console.log(`${name}:`, {
          mean: `${stats.mean.toFixed(2)}ms`,
          p95: `${stats.p95.toFixed(2)}ms`,
          p99: `${stats.p99.toFixed(2)}ms`,
        })
      }
    }
    console.groupEnd()
  }
}
```

### Testing for Sprint 0.2
- [ ] Grammar errors show blue wavy underlines
- [ ] Both spell and grammar check work simultaneously
- [ ] No performance degradation with both enabled
- [ ] Cache prevents redundant checks
- [ ] Large documents (100k+ words) remain responsive
- [ ] Memory usage stays reasonable
- [ ] Worker crashes are handled gracefully
- [ ] Suggestions load quickly on hover
- [ ] Performance metrics show <50ms average
- [ ] Paste operations complete smoothly
- [ ] Undo/redo maintains error decorations

---

## Architecture Benefits

1. **Web Worker Isolation**: Checking never blocks the main thread
2. **Smart Caching**: Unchanged text is never rechecked
3. **Priority Queue**: Visible content checked first
4. **Incremental Updates**: Only changed paragraphs are processed
5. **Lazy Suggestions**: Calculated only when needed
6. **Memory Bounded**: All caches have size limits
7. **Graceful Degradation**: Falls back if workers fail

## Production Considerations

### Dictionary Hosting
```nginx
# Serve dictionary files with long cache
location /dictionaries/ {
  expires 1y;
  add_header Cache-Control "public, immutable";
  gzip_static on;
}
```

### Error Tracking
```typescript
// Track check performance
analytics.track("editor.spellcheck", {
  documentSize: text.length,
  checkDuration: duration,
  errorCount: errors.length,
  cacheHitRate: cacheHits / totalChecks,
})
```

### User Preferences
```typescript
interface EditorPreferences {
  spellCheck: {
    enabled: boolean
    language: string
    customDictionary: string[]
  }
  grammarCheck: {
    enabled: boolean
    rules: {
      repeatedWords: boolean
      articleErrors: boolean
      sentenceSpacing: boolean
      // ... other rules
    }
  }
  performance: {
    mode: "aggressive" | "balanced" | "battery-saver"
    maxWorkers: number
  }
}
```

This implementation provides a world-class writing experience that rivals Google Docs and Grammarly while maintaining excellent performance and user experience.