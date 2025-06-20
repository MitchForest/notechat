# Epic: Writing Foundation 📝 - Sprint 0.1

## Goal
Implement a blazing-fast, professional writing experience with Novel editor and real-time spell/grammar checking. This sprint focuses on setting up the Novel editor and implementing a performant spell-checking system.

## Success Criteria
- **Performance**: <50ms latency for spell check feedback while typing
- **UX**: Seamless typing experience with no stutters or lag
- **Functionality**: Core spell-checking works as expected.

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