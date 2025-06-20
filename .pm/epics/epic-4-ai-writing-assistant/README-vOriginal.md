# Epic: AI Writing Assistant ✨

## Overview
**Goal**: Integrate AI capabilities directly into the writing experience with ghost text completions, inline commands, and seamless editor-chat integration  
**Duration**: 1 week (2 sprints)  
**Prerequisites**: AI Chat Foundation epic completed  
**Outcome**: Writers have AI assistance at their fingertips without leaving the editor

## Success Criteria
- **Ghost Text Performance**: Suggestions appear within 1s of pause
- **Acceptance Rate**: >30% of ghost text suggestions accepted
- **Inline AI Speed**: <2s for inline transformations
- **Zero Disruption**: Writing flow never interrupted
- **Context Quality**: AI understands surrounding content accurately

## Sprint 1: Ghost Text Completions

### Day 1-2: Ghost Text Infrastructure

#### 1. Completion Service with AI SDK
```typescript
// features/editor/services/completion-service.ts
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

interface CompletionContext {
  textBefore: string
  textAfter: string
  currentParagraph: string
  noteTitle?: string
  noteType?: string
}

export class CompletionService {
  private cache = new Map<string, string>()
  private readonly maxCacheSize = 100
  
  async getCompletion(context: CompletionContext): Promise<string> {
    // Create cache key from context
    const cacheKey = this.createCacheKey(context)
    
    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached) return cached
    
    try {
      // Build prompt with context
      const prompt = this.buildPrompt(context)
      
      const { text } = await generateText({
        model: openai("gpt-3.5-turbo"), // Faster model for completions
        prompt,
        temperature: 0.7,
        maxTokens: 50, // Keep completions concise
        stopSequences: ["\n\n", ".", "!", "?"], // Stop at sentence boundaries
      })
      
      // Clean and cache the completion
      const completion = this.cleanCompletion(text)
      this.addToCache(cacheKey, completion)
      
      return completion
    } catch (error) {
      console.error("Completion failed:", error)
      return ""
    }
  }
  
  private buildPrompt(context: CompletionContext): string {
    const { textBefore, textAfter, noteTitle, noteType } = context
    
    let prompt = `You are helping write a ${noteType || "document"}`
    if (noteTitle) {
      prompt += ` titled "${noteTitle}"`
    }
    prompt += `. Continue the text naturally from where the cursor is (marked with |):

${textBefore}|${textAfter}

Provide only the continuation text, nothing else. Write in the same style and tone.`
    
    return prompt
  }
  
  private cleanCompletion(text: string): string {
    // Remove any leading/trailing whitespace
    let cleaned = text.trim()
    
    // Ensure single space at start if needed
    if (cleaned && !cleaned.startsWith(" ")) {
      cleaned = " " + cleaned
    }
    
    return cleaned
  }
  
  private createCacheKey(context: CompletionContext): string {
    // Use last 100 chars before cursor for cache key
    const key = context.textBefore.slice(-100)
    return Buffer.from(key).toString("base64")
  }
  
  private addToCache(key: string, value: string) {
    // LRU cache implementation
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    this.cache.set(key, value)
  }
  
  clearCache() {
    this.cache.clear()
  }
}

export const completionService = new CompletionService()
```

#### 2. Ghost Text Hook with AI SDK
```typescript
// features/editor/hooks/use-ghost-text.ts
import { useCallback, useEffect, useRef, useState } from "react"
import { Editor } from "@tiptap/core"
import { useCompletion } from "ai/react"
import { debounce } from "lodash"

interface UseGhostTextProps {
  editor: Editor | null
  enabled?: boolean
  debounceMs?: number
}

interface GhostTextState {
  text: string
  position: number
  isVisible: boolean
}

export function useGhostText({ 
  editor, 
  enabled = true,
  debounceMs = 1000 
}: UseGhostTextProps) {
  const [ghostState, setGhostState] = useState<GhostTextState>({
    text: "",
    position: 0,
    isVisible: false,
  })
  
  const abortControllerRef = useRef<AbortController>()
  
  // Use AI SDK's useCompletion hook
  const {
    complete,
    completion,
    isLoading,
    stop,
  } = useCompletion({
    api: "/api/completion",
    onFinish: (prompt, completion) => {
      // Show the ghost text
      if (completion && editor) {
        const { from } = editor.state.selection
        setGhostState({
          text: completion,
          position: from,
          isVisible: true,
        })
      }
    },
    onError: (error) => {
      console.error("Ghost text error:", error)
      setGhostState(prev => ({ ...prev, isVisible: false }))
    },
  })
  
  // Get context around cursor
  const getContext = useCallback(() => {
    if (!editor) return null
    
    const { from } = editor.state.selection
    const doc = editor.state.doc
    
    // Get text before and after cursor
    const textBefore = doc.textBetween(
      Math.max(0, from - 500),
      from,
      " "
    )
    const textAfter = doc.textBetween(
      from,
      Math.min(doc.content.size, from + 200),
      " "
    )
    
    // Get current paragraph
    const $pos = doc.resolve(from)
    const paragraph = $pos.parent.textContent
    
    return {
      textBefore,
      textAfter,
      currentParagraph: paragraph,
      cursorPosition: from,
    }
  }, [editor])
  
  // Debounced trigger for completion
  const triggerCompletion = useRef(
    debounce(async () => {
      if (!enabled || !editor || isLoading) return
      
      const context = getContext()
      if (!context || !context.textBefore.trim()) return
      
      // Abort previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      
      // Create new abort controller
      abortControllerRef.current = new AbortController()
      
      // Hide existing ghost text
      setGhostState(prev => ({ ...prev, isVisible: false }))
      
      // Request completion
      await complete(JSON.stringify(context), {
        body: {
          mode: "ghost-text",
        },
      })
    }, debounceMs)
  ).current
  
  // Watch for editor updates
  useEffect(() => {
    if (!editor || !enabled) return
    
    const handleUpdate = () => {
      // Hide ghost text when typing
      setGhostState(prev => ({ ...prev, isVisible: false }))
      
      // Cancel ongoing completion
      stop()
      
      // Trigger new completion
      triggerCompletion()
    }
    
    const handleSelectionUpdate = () => {
      // Hide ghost text when cursor moves
      if (ghostState.isVisible) {
        const { from } = editor.state.selection
        if (from !== ghostState.position + ghostState.text.length) {
          setGhostState(prev => ({ ...prev, isVisible: false }))
        }
      }
    }
    
    editor.on("update", handleUpdate)
    editor.on("selectionUpdate", handleSelectionUpdate)
    
    return () => {
      editor.off("update", handleUpdate)
      editor.off("selectionUpdate", handleSelectionUpdate)
      triggerCompletion.cancel()
    }
  }, [editor, enabled, stop, triggerCompletion, ghostState])
  
  // Accept completion
  const acceptCompletion = useCallback(() => {
    if (!editor || !ghostState.isVisible || !ghostState.text) return false
    
    // Insert the completion at the saved position
    editor
      .chain()
      .focus()
      .insertContentAt(ghostState.position, ghostState.text)
      .run()
    
    // Hide ghost text
    setGhostState({
      text: "",
      position: 0,
      isVisible: false,
    })
    
    // Cancel any ongoing requests
    stop()
    
    return true
  }, [editor, ghostState, stop])
  
  // Dismiss completion
  const dismissCompletion = useCallback(() => {
    setGhostState({
      text: "",
      position: 0,
      isVisible: false,
    })
    stop()
  }, [stop])
  
  return {
    ghostText: ghostState.isVisible ? ghostState.text : "",
    position: ghostState.position,
    isLoading,
    acceptCompletion,
    dismissCompletion,
  }
}
```

#### 3. Ghost Text Renderer Component
```typescript
// features/editor/components/ghost-text-renderer.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { Editor } from "@tiptap/core"
import { cn } from "@/lib/utils"

interface GhostTextRendererProps {
  editor: Editor
  text: string
  position: number
}

export function GhostTextRenderer({ editor, text, position }: GhostTextRendererProps) {
  const ghostRef = useRef<HTMLSpanElement>(null)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  
  useEffect(() => {
    if (!text || !editor.view) return
    
    try {
      // Get coordinates at the position
      const pos = editor.view.coordsAtPos(position)
      const editorRect = editor.view.dom.getBoundingClientRect()
      
      setCoords({
        top: pos.top - editorRect.top,
        left: pos.left - editorRect.left,
      })
    } catch (error) {
      console.error("Failed to position ghost text:", error)
      setCoords(null)
    }
  }, [editor, text, position])
  
  if (!text || !coords) return null
  
  return (
    <span
      ref={ghostRef}
      className={cn(
        "absolute pointer-events-none select-none",
        "text-muted-foreground/50 opacity-0 animate-in fade-in duration-300"
      )}
      style={{
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        fontFamily: "inherit",
        fontSize: "inherit",
        lineHeight: "inherit",
        whiteSpace: "pre-wrap",
      }}
      aria-hidden="true"
    >
      {text}
    </span>
  )
}
```

### Day 3-4: Editor Integration & Keyboard Handling

#### 4. Extended Novel Editor with Ghost Text
```typescript
// features/editor/components/novel-editor-with-ai.tsx
"use client"

import { useRef, useCallback, useEffect } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { useGhostText } from "../hooks/use-ghost-text"
import { GhostTextRenderer } from "./ghost-text-renderer"
import { SpellCheckExtension } from "../extensions/spellcheck"
import { GrammarCheckExtension } from "../extensions/grammar"
import { InlineAIExtension } from "../extensions/inline-ai"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"

interface NovelEditorWithAIProps {
  content?: string
  onChange?: (content: string) => void
  onSendToChat?: (selection: string) => void
  className?: string
  enableGhostText?: boolean
  enableInlineAI?: boolean
}

export function NovelEditorWithAI({
  content = "",
  onChange,
  onSendToChat,
  className,
  enableGhostText = true,
  enableInlineAI = true,
}: NovelEditorWithAIProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // ... starter kit config
      }),
      SpellCheckExtension,
      GrammarCheckExtension,
      ...(enableInlineAI ? [InlineAIExtension] : []),
    ],
    content,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-neutral dark:prose-invert max-w-none",
          "focus:outline-none min-h-[500px] px-8 py-6",
          "font-mono text-base leading-relaxed",
          className
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
  })
  
  // Ghost text integration
  const {
    ghostText,
    position,
    isLoading,
    acceptCompletion,
    dismissCompletion,
  } = useGhostText({
    editor,
    enabled: enableGhostText,
  })
  
  // Global keyboard shortcuts
  useEffect(() => {
    if (!editor) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tab to accept ghost text
      if (e.key === "Tab" && ghostText && !e.shiftKey) {
        e.preventDefault()
        const accepted = acceptCompletion()
        if (accepted) {
          toast({
            description: "Ghost text accepted",
            duration: 1000,
          })
        }
      }
      
      // Escape to dismiss ghost text
      if (e.key === "Escape" && ghostText) {
        e.preventDefault()
        dismissCompletion()
      }
      
      // Cmd+Enter to send to chat
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault()
        const selection = editor.state.doc.textBetween(
          editor.state.selection.from,
          editor.state.selection.to,
          " "
        )
        if (selection && onSendToChat) {
          onSendToChat(selection)
        }
      }
      
      // Cmd+J to continue writing
      if ((e.metaKey || e.ctrlKey) && e.key === "j") {
        e.preventDefault()
        // Trigger immediate completion
        editor.commands.focus("end")
        // Ghost text hook will trigger automatically
      }
    }
    
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [editor, ghostText, acceptCompletion, dismissCompletion, onSendToChat])
  
  if (!editor) {
    return (
      <div className={cn("animate-pulse bg-muted rounded-lg", className)} />
    )
  }
  
  return (
    <div ref={editorRef} className="relative">
      <EditorContent editor={editor} />
      {ghostText && editor && (
        <GhostTextRenderer
          editor={editor}
          text={ghostText}
          position={position}
        />
      )}
      {isLoading && (
        <div className="absolute bottom-4 right-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-foreground/30 animate-pulse" />
            AI thinking...
          </div>
        </div>
      )}
    </div>
  )
}
```

#### 5. Completion API Route
```typescript
// app/api/completion/route.ts
import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"
import { NextRequest } from "next/server"

export const runtime = "edge"

export async function POST(req: NextRequest) {
  try {
    const { prompt, mode = "ghost-text" } = await req.json()
    
    let context
    try {
      context = JSON.parse(prompt)
    } catch {
      context = { textBefore: prompt }
    }
    
    // Different prompts for different modes
    const systemPrompt = mode === "ghost-text"
      ? "You are a writing assistant providing brief, natural completions. Continue the text in the same style and tone. Provide only the completion, no explanations."
      : "You are a writing assistant helping to expand and improve text."
    
    const userPrompt = mode === "ghost-text"
      ? `Continue this text naturally (provide 5-15 words): ${context.textBefore}`
      : prompt
    
    const result = await streamText({
      model: openai("gpt-3.5-turbo"), // Fast model for completions
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      maxTokens: mode === "ghost-text" ? 30 : 200,
    })
    
    return result.toAIStreamResponse()
    
  } catch (error) {
    console.error("Completion error:", error)
    return new Response("Completion failed", { status: 500 })
  }
}
```

### Day 5: Performance & Polish

#### 6. Ghost Text Settings Component
```typescript
// features/editor/components/ghost-text-settings.tsx
"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Card } from "@/components/ui/card"
import { Sparkles, Timer, Zap } from "lucide-react"

interface GhostTextSettingsProps {
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  debounceMs: number
  onDebounceChange: (ms: number) => void
}

export function GhostTextSettings({
  enabled,
  onEnabledChange,
  debounceMs,
  onDebounceChange,
}: GhostTextSettingsProps) {
  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="ghost-text">Ghost Text Completions</Label>
        </div>
        <Switch
          id="ghost-text"
          checked={enabled}
          onCheckedChange={onEnabledChange}
        />
      </div>
      
      {enabled && (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Suggestion Delay</Label>
              <span className="text-sm text-muted-foreground">
                {debounceMs}ms
              </span>
            </div>
            <Slider
              value={[debounceMs]}
              onValueChange={([value]) => onDebounceChange(value)}
              min={500}
              max={2000}
              step={100}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Fast
              </span>
              <span className="flex items-center gap-1">
                <Timer className="h-3 w-3" />
                Slow
              </span>
            </div>
          </div>
          
          <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1">
            <p className="font-medium">Tips:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Press Tab to accept suggestions</li>
              <li>Press Escape to dismiss</li>
              <li>Keep typing to ignore</li>
            </ul>
          </div>
        </>
      )}
    </Card>
  )
}
```

---

## Sprint 2: Inline AI & Send to Chat

### Day 1-2: Inline AI Commands

#### 1. Inline AI Extension
```typescript
// features/editor/extensions/inline-ai.ts
import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "prosemirror-state"
import { Decoration, DecorationSet } from "prosemirror-view"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

interface InlineAIState {
  active: boolean
  position: number
  query: string
  isProcessing: boolean
}

const inlineAIKey = new PluginKey<InlineAIState>("inlineAI")

export const InlineAIExtension = Extension.create({
  name: "inlineAI",
  
  addProseMirrorPlugins() {
    const extension = this
    
    return [
      new Plugin({
        key: inlineAIKey,
        state: {
          init(): InlineAIState {
            return {
              active: false,
              position: 0,
              query: "",
              isProcessing: false,
            }
          },
          apply(tr, state): InlineAIState {
            const meta = tr.getMeta(inlineAIKey)
            if (meta) return { ...state, ...meta }
            
            // Check for // pattern
            const { $from } = tr.selection
            if ($from.parent.type.name !== "paragraph") return state
            
            const textBefore = $from.parent.textBetween(
              Math.max(0, $from.parentOffset - 2),
              $from.parentOffset
            )
            
            if (textBefore === "//" && !state.active) {
              return {
                active: true,
                position: $from.pos - 2,
                query: "",
                isProcessing: false,
              }
            }
            
            if (state.active && !state.isProcessing) {
              // Continue capturing query
              try {
                const query = $from.parent.textBetween(
                  state.position - $from.start() + 2,
                  $from.parentOffset
                )
                return { ...state, query }
              } catch {
                return { ...state, active: false }
              }
            }
            
            return state
          },
        },
        
        props: {
          decorations(state) {
            const pluginState = inlineAIKey.getState(state)
            if (!pluginState?.active) return DecorationSet.empty
            
            try {
              const $pos = state.doc.resolve(pluginState.position)
              const from = pluginState.position
              const to = from + 2 + pluginState.query.length
              
              return DecorationSet.create(state.doc, [
                Decoration.inline(from, to, {
                  class: "inline-ai-command",
                  nodeName: "span",
                }),
              ])
            } catch {
              return DecorationSet.empty
            }
          },
          
          handleKeyDown(view, event) {
            const state = inlineAIKey.getState(view.state)
            if (!state?.active) return false
            
            if (event.key === "Enter" && !state.isProcessing) {
              event.preventDefault()
              processInlineAI(view, state)
              return true
            }
            
            if (event.key === "Escape") {
              event.preventDefault()
              cancelInlineAI(view)
              return true
            }
            
            return false
          },
        },
      }),
    ]
  },
})

async function processInlineAI(view: any, state: InlineAIState) {
  // Update state to processing
  view.dispatch(
    view.state.tr.setMeta(inlineAIKey, {
      ...state,
      isProcessing: true,
    })
  )
  
  // Show loading state
  const loadingText = " ✨"
  view.dispatch(
    view.state.tr.insertText(
      loadingText,
      state.position + 2 + state.query.length
    )
  )
  
  try {
    // Get context
    const $pos = view.state.doc.resolve(state.position)
    const paragraph = $pos.parent.textContent
    const beforeCommand = paragraph.substring(0, state.position - $pos.start())
    const afterCommand = paragraph.substring(
      state.position - $pos.start() + 2 + state.query.length
    )
    
    // Generate response
    const { text } = await generateText({
      model: openai("gpt-4-turbo"),
      messages: [
        {
          role: "system",
          content: "You are a writing assistant. Process the user's inline command and provide the appropriate text transformation or completion. Respond only with the text to insert, no explanations.",
        },
        {
          role: "user",
          content: `Context before: "${beforeCommand}"
Context after: "${afterCommand}"
Command: "${state.query}"

Process this command and provide the appropriate text.`,
        },
      ],
      temperature: 0.7,
      maxTokens: 200,
    })
    
    // Replace command with result
    const tr = view.state.tr.deleteRange(
      state.position,
      state.position + 2 + state.query.length + loadingText.length
    )
    tr.insertText(text, state.position)
    
    // Reset state
    tr.setMeta(inlineAIKey, {
      active: false,
      position: 0,
      query: "",
      isProcessing: false,
    })
    
    view.dispatch(tr)
  } catch (error) {
    console.error("Inline AI failed:", error)
    
    // Remove loading state
    const tr = view.state.tr.deleteRange(
      state.position + 2 + state.query.length,
      state.position + 2 + state.query.length + loadingText.length
    )
    
    // Show error
    tr.setMeta(inlineAIKey, {
      active: false,
      position: 0,
      query: "",
      isProcessing: false,
    })
    
    view.dispatch(tr)
    
    // Show toast
    if (window.showToast) {
      window.showToast({
        title: "AI command failed",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }
}

function cancelInlineAI(view: any) {
  const state = inlineAIKey.getState(view.state)
  if (!state) return
  
  view.dispatch(
    view.state.tr.setMeta(inlineAIKey, {
      active: false,
      position: 0,
      query: "",
      isProcessing: false,
    })
  )
}

// CSS for inline AI
export const inlineAIStyles = `
  .inline-ai-command {
    background-color: hsl(var(--ai-primary) / 0.1);
    color: hsl(var(--ai-primary));
    border-radius: 0.25rem;
    padding: 0 0.25rem;
    font-family: var(--font-mono);
  }
`
```

### Day 3-4: Send to Chat Integration

#### 2. Send to Chat Hook
```typescript
// features/editor/hooks/use-send-to-chat.ts
import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { useChatStore } from "@/features/chat/stores/chat-store"
import { toast } from "@/components/ui/use-toast"

interface UseSendToChatProps {
  noteId?: string
  noteTitle?: string
}

export function useSendToChat({ noteId, noteTitle }: UseSendToChatProps = {}) {
  const router = useRouter()
  const { createChat } = useChatStore()
  const [isSending, setIsSending] = useState(false)
  
  const sendToChat = useCallback(async (
    text: string,
    options?: {
      question?: string
      action?: "explain" | "improve" | "summarize" | "continue"
    }
  ) => {
    if (!text.trim()) {
      toast({
        title: "No text selected",
        description: "Please select some text to send to chat",
        variant: "destructive",
      })
      return
    }
    
    setIsSending(true)
    
    try {
      // Create a new chat
      const chat = createChat({
        noteId,
        title: `Chat about: ${noteTitle || "Selection"}`,
      })
      
      // Build the initial message based on action
      let initialMessage = ""
      switch (options?.action) {
        case "explain":
          initialMessage = `Please explain this text:\n\n${text}`
          break
        case "improve":
          initialMessage = `Please help me improve this text:\n\n${text}`
          break
        case "summarize":
          initialMessage = `Please summarize this text:\n\n${text}`
          break
        case "continue":
          initialMessage = `Please continue writing from:\n\n${text}`
          break
        default:
          initialMessage = options?.question 
            ? `${options.question}\n\nContext:\n${text}`
            : `I'd like to discuss this text:\n\n${text}`
      }
      
      // Navigate to chat with initial message
      router.push(`/chat/${chat.id}?message=${encodeURIComponent(initialMessage)}`)
      
      toast({
        title: "Sent to chat",
        description: "Opening chat with your selection",
      })
    } catch (error) {
      console.error("Failed to send to chat:", error)
      toast({
        title: "Failed to create chat",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }, [createChat, noteId, noteTitle, router])
  
  return {
    sendToChat,
    isSending,
  }
}
```

#### 3. Selection Menu with AI Actions
```typescript
// features/editor/components/selection-menu.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { Editor } from "@tiptap/core"
import {
  MessageSquare,
  Sparkles,
  FileText,
  Lightbulb,
  PenTool,
  ListChecks,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useSendToChat } from "../hooks/use-send-to-chat"

interface SelectionMenuProps {
  editor: Editor
  noteId?: string
  noteTitle?: string
}

interface MenuPosition {
  top: number
  left: number
}

export function SelectionMenu({ editor, noteId, noteTitle }: SelectionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState<MenuPosition>({ top: 0, left: 0 })
  const [selectedText, setSelectedText] = useState("")
  const menuRef = useRef<HTMLDivElement>(null)
  const { sendToChat, isSending } = useSendToChat({ noteId, noteTitle })
  
  useEffect(() => {
    const updateMenu = () => {
      const { selection } = editor.state
      const { from, to } = selection
      
      // Check if there's a selection
      if (from === to) {
        setIsOpen(false)
        return
      }
      
      // Get selected text
      const text = editor.state.doc.textBetween(from, to, " ")
      if (!text.trim()) {
        setIsOpen(false)
        return
      }
      
      setSelectedText(text)
      
      // Get position for menu
      const view = editor.view
      const start = view.coordsAtPos(from)
      const end = view.coordsAtPos(to)
      const editorRect = view.dom.getBoundingClientRect()
      
      setPosition({
        top: start.top - editorRect.top - 50,
        left: (start.left + end.left) / 2 - editorRect.left,
      })
      
      setIsOpen(true)
    }
    
    editor.on("selectionUpdate", updateMenu)
    editor.on("blur", () => setIsOpen(false))
    
    return () => {
      editor.off("selectionUpdate", updateMenu)
      editor.off("blur", () => setIsOpen(false))
    }
  }, [editor])
  
  const handleAction = async (action: string) => {
    switch (action) {
      case "send-to-chat":
        await sendToChat(selectedText)
        break
      case "explain":
        await sendToChat(selectedText, { action: "explain" })
        break
      case "improve":
        await sendToChat(selectedText, { action: "improve" })
        break
      case "summarize":
        await sendToChat(selectedText, { action: "summarize" })
        break
      case "continue":
        editor.commands.focus("end")
        await sendToChat(selectedText, { action: "continue" })
        break
    }
    setIsOpen(false)
  }
  
  if (!isOpen) return null
  
  return (
    <div
      ref={menuRef}
      className={cn(
        "absolute z-50 animate-in fade-in slide-in-from-bottom-2",
        "duration-200"
      )}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: "translateX(-50%)",
      }}
    >
      <div className="glass rounded-lg border p-1 shadow-lg">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAction("send-to-chat")}
            disabled={isSending}
            className="h-8"
          >
            <MessageSquare className="mr-1 h-3 w-3" />
            Chat
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isSending}
                className="h-8"
              >
                <Sparkles className="mr-1 h-3 w-3" />
                AI Actions
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1" align="start">
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleAction("explain")}
                >
                  <Lightbulb className="mr-2 h-4 w-4" />
                  Explain
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleAction("improve")}
                >
                  <PenTool className="mr-2 h-4 w-4" />
                  Improve
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleAction("summarize")}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Summarize
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleAction("continue")}
                >
                  <ListChecks className="mr-2 h-4 w-4" />
                  Continue
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  )
}
```

### Day 5: Integration & Polish

#### 4. Updated Note View with AI Features
```typescript
// features/notes/components/note-view-with-ai.tsx
"use client"

import { useState } from "react"
import { NovelEditorWithAI } from "@/features/editor/components/novel-editor-with-ai"
import { SelectionMenu } from "@/features/editor/components/selection-menu"
import { GhostTextSettings } from "@/features/editor/components/ghost-text-settings"
import { useSendToChat } from "@/features/editor/hooks/use-send-to-chat"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface NoteViewWithAIProps {
  noteId: string
  noteTitle: string
  initialContent?: string
  onContentChange?: (content: string) => void
}

export function NoteViewWithAI({
  noteId,
  noteTitle,
  initialContent = "",
  onContentChange,
}: NoteViewWithAIProps) {
  const [content, setContent] = useState(initialContent)
  const [ghostTextEnabled, setGhostTextEnabled] = useState(true)
  const [ghostTextDelay, setGhostTextDelay] = useState(1000)
  const { sendToChat } = useSendToChat({ noteId, noteTitle })
  
  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    onContentChange?.(newContent)
  }
  
  return (
    <div className="relative h-full">
      {/* Settings Button */}
      <div className="absolute top-4 right-4 z-10">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <h4 className="font-medium mb-4">Editor Settings</h4>
            <GhostTextSettings
              enabled={ghostTextEnabled}
              onEnabledChange={setGhostTextEnabled}
              debounceMs={ghostTextDelay}
              onDebounceChange={setGhostTextDelay}
            />
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Editor with AI features */}
      <NovelEditorWithAI
        content={content}
        onChange={handleContentChange}
        onSendToChat={sendToChat}
        enableGhostText={ghostTextEnabled}
        enableInlineAI={true}
        className="h-full"
      />
      
      {/* Selection menu will be rendered by editor */}
    </div>
  )
}
```

#### 5. Analytics Tracking
```typescript
// features/editor/hooks/use-ai-analytics.ts
import { useCallback, useEffect, useRef } from "react"

interface AIAnalyticsEvent {
  event: string
  properties?: Record<string, any>
}

export function useAIAnalytics() {
  const ghostTextStats = useRef({
    shown: 0,
    accepted: 0,
    dismissed: 0,
  })
  
  const inlineAIStats = useRef({
    triggered: 0,
    completed: 0,
    failed: 0,
  })
  
  const track = useCallback((event: AIAnalyticsEvent) => {
    // In production, send to analytics service
    if (process.env.NODE_ENV === "production") {
      // Example: posthog.capture(event.event, event.properties)
    }
    
    console.log("[AI Analytics]", event)
  }, [])
  
  const trackGhostText = useCallback((action: "shown" | "accepted" | "dismissed") => {
    ghostTextStats.current[action]++
    
    track({
      event: `ghost_text_${action}`,
      properties: {
        total_shown: ghostTextStats.current.shown,
        total_accepted: ghostTextStats.current.accepted,
        acceptance_rate: ghostTextStats.current.shown > 0
          ? ghostTextStats.current.accepted / ghostTextStats.current.shown
          : 0,
      },
    })
  }, [track])
  
  const trackInlineAI = useCallback((action: "triggered" | "completed" | "failed", query?: string) => {
    inlineAIStats.current[action]++
    
    track({
      event: `inline_ai_${action}`,
      properties: {
        query_length: query?.length,
        total_triggered: inlineAIStats.current.triggered,
        success_rate: inlineAIStats.current.triggered > 0
          ? inlineAIStats.current.completed / inlineAIStats.current.triggered
          : 0,
      },
    })
  }, [track])
  
  // Report stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (ghostTextStats.current.shown > 0) {
        track({
          event: "ai_writing_stats",
          properties: {
            ghost_text: ghostTextStats.current,
            inline_ai: inlineAIStats.current,
          },
        })
      }
    }, 60000) // Every minute
    
    return () => clearInterval(interval)
  }, [track])
  
  return {
    trackGhostText,
    trackInlineAI,
  }
}
```

## Testing Checklist

### Sprint 1 Tests
- [ ] Ghost text appears after 1s pause
- [ ] Ghost text position aligns with cursor
- [ ] Tab accepts ghost text
- [ ] Escape dismisses ghost text
- [ ] Any other key dismisses and continues typing
- [ ] Ghost text doesn't appear in code blocks
- [ ] Settings control ghost text behavior
- [ ] Performance: <100ms UI response
- [ ] No ghost text during rapid typing
- [ ] Cache prevents duplicate API calls

### Sprint 2 Tests
- [ ] // triggers inline AI mode
- [ ] Enter processes inline command
- [ ] Escape cancels inline command
- [ ] Loading state shows during processing
- [ ] Error handling for failed commands
- [ ] Selection menu appears on text selection
- [ ] Send to chat creates new chat with context
- [ ] AI actions work from selection menu
- [ ] Cmd+Enter sends selection to chat
- [ ] Cmd+J triggers continue writing

## Performance Metrics
- Ghost text suggestion latency: <1s
- Inline AI response time: <2s
- Zero UI blocking during AI operations
- Memory stable with frequent completions
- Acceptance rate tracking functional

## Next Steps
With the AI Writing Assistant complete, users can:
- Get intelligent completions while writing
- Transform text with natural language commands
- Seamlessly move between editor and chat
- Work with AI without context switching

The next epic (AI Commands & Transformations) will add:
- Comprehensive slash command system
- Text transformation commands
- Highlight menu for quick actions