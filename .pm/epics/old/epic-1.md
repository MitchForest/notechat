# Epic 1: Foundation + Core Value 🏗️

## Overview
**Goal**: Build the core features that enable users to write, chat, and organize with AI assistance  
**Duration**: 4 sprints (2 weeks)  
**Prerequisites**: Epic 0 completed (UI foundation in place)  
**Outcome**: Fully functional AI-powered knowledge workspace with writing, chatting, and organization

## Sprint 1.1: Rich Text Editor + AI Chat Interface

### Objectives
- Implement Novel editor with real-time spell/grammar checking
- Build streaming AI chat interface
- Create the foundation for AI-assisted writing

### Feature F01: Rich Text Editor with Real-time Corrections

#### Implementation Plan

**1. Novel Editor Setup**
```typescript
// features/editor/components/novel-editor.tsx
"use client"

import { useEffect, useRef } from "react"
import { Editor as NovelEditor } from "novel"
import { defaultExtensions } from "novel/extensions"
import { handleImageDrop, handleImagePaste } from "novel/plugins"
import { SpellCheckExtension } from "../extensions/spellcheck"
import { GrammarCheckExtension } from "../extensions/grammar"
import { cn } from "@/lib/utils"

interface EditorProps {
  content?: string
  onChange?: (content: string) => void
  className?: string
}

export function Editor({ content, onChange, className }: EditorProps) {
  return (
    <NovelEditor
      defaultValue={content}
      onUpdate={(editor) => {
        onChange?.(editor.getHTML())
      }}
      className={cn(
        "prose prose-neutral dark:prose-invert max-w-none",
        "focus:outline-none",
        className
      )}
      extensions={[
        ...defaultExtensions,
        SpellCheckExtension,
        GrammarCheckExtension,
      ]}
      editorProps={{
        handleDrop: (view, event, slice, moved) => handleImageDrop(view, event, slice, moved),
        handlePaste: (view, event) => handleImagePaste(view, event),
        attributes: {
          class: "font-mono text-base leading-relaxed px-8 py-6 min-h-[500px]",
        },
      }}
    />
  )
}
```

**2. Spell Check Extension with typo.js**
```typescript
// features/editor/extensions/spellcheck.ts
import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "prosemirror-state"
import { Decoration, DecorationSet } from "prosemirror-view"
import Typo from "typo-js"

// Load dictionary in web worker for performance
const spellCheckWorker = new Worker(
  new URL("../workers/spellcheck.worker.ts", import.meta.url)
)

export const SpellCheckExtension = Extension.create({
  name: "spellCheck",
  
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("spellCheck"),
        state: {
          init() {
            return DecorationSet.empty
          },
          apply(tr, oldState) {
            if (!tr.docChanged) return oldState
            
            const decorations: Decoration[] = []
            const doc = tr.doc
            
            doc.descendants((node, pos) => {
              if (node.isText && node.text) {
                const words = node.text.split(/\s+/)
                let offset = 0
                
                words.forEach(word => {
                  const cleanWord = word.replace(/[^a-zA-Z]/g, "")
                  if (cleanWord && !this.checkSpelling(cleanWord)) {
                    decorations.push(
                      Decoration.inline(
                        pos + offset,
                        pos + offset + word.length,
                        { class: "spell-error" },
                        { word: cleanWord }
                      )
                    )
                  }
                  offset += word.length + 1
                })
              }
            })
            
            return DecorationSet.create(doc, decorations)
          },
        },
        props: {
          decorations(state) {
            return this.getState(state)
          },
          handleClick(view, pos, event) {
            // Show correction menu on right-click
            if (event.button === 2) {
              const decorations = this.getState(view.state)
              const decoration = decorations.find(pos, pos)
              if (decoration.length) {
                showCorrectionMenu(view, pos, decoration[0])
                return true
              }
            }
            return false
          },
        },
      }),
    ]
  },
})

// CSS for spell check underlines
const spellCheckStyles = `
  .spell-error {
    text-decoration: underline wavy #ef4444;
    text-underline-offset: 4px;
  }
`
```

**3. Grammar Check Extension with retext**
```typescript
// features/editor/extensions/grammar.ts
import { Extension } from "@tiptap/core"
import { unified } from "unified"
import retextEnglish from "retext-english"
import retextSpell from "retext-spell"
import retextRepeatedWords from "retext-repeated-words"
import retextIndefiniteArticle from "retext-indefinite-article"
import { Plugin, PluginKey } from "prosemirror-state"

const processor = unified()
  .use(retextEnglish)
  .use(retextRepeatedWords)
  .use(retextIndefiniteArticle)

export const GrammarCheckExtension = Extension.create({
  name: "grammarCheck",
  
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("grammarCheck"),
        state: {
          init() {
            return { decorations: DecorationSet.empty, issues: [] }
          },
          apply(tr, oldState) {
            if (!tr.docChanged) return oldState
            
            // Debounce grammar checking
            clearTimeout(this.timeout)
            this.timeout = setTimeout(() => {
              this.checkGrammar(tr.doc)
            }, 500)
            
            return oldState
          },
        },
        props: {
          decorations(state) {
            return this.getState(state).decorations
          },
        },
      }),
    ]
  },
})

// CSS for grammar underlines
const grammarStyles = `
  .grammar-error {
    text-decoration: underline wavy #3b82f6;
    text-underline-offset: 4px;
  }
`
```

### Feature F02: AI Chat Interface

#### Implementation Plan

**1. Chat Interface Component**
```typescript
// features/chat/components/chat-interface.tsx
"use client"

import { useChat } from "ai/react"
import { useRef, useEffect } from "react"
import { Send, StopCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMessage } from "./chat-message"
import { ChatInput } from "./chat-input"
import { useAutoScroll } from "../hooks/use-auto-scroll"

interface ChatInterfaceProps {
  chatId?: string
  context?: string
  onExtract?: (content: string) => void
}

export function ChatInterface({ chatId, context, onExtract }: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { enableAutoScroll } = useAutoScroll(scrollRef)
  
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    reload,
    error,
  } = useChat({
    api: "/api/chat",
    id: chatId,
    body: {
      context,
    },
    onFinish: (message) => {
      // Enable extraction option for AI messages
      if (message.role === "assistant") {
        enableAutoScroll()
      }
    },
  })

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium">Start a conversation</p>
              <p className="text-sm">Ask questions, explore ideas, or get help with your notes.</p>
            </div>
          )}
          
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              onExtract={onExtract}
              isLoading={isLoading && message === messages[messages.length - 1]}
            />
          ))}
          
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <p className="text-sm text-destructive">{error.message}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => reload()}
                className="mt-2"
              >
                Try again
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <ChatInput
            value={input}
            onChange={handleInputChange}
            placeholder="Ask anything..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className="ai-gradient-bg"
          >
            {isLoading ? (
              <StopCircle className="h-4 w-4" onClick={stop} />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
```

**2. Chat Message Component**
```typescript
// features/chat/components/chat-message.tsx
import { Message } from "ai"
import { Copy, FileText, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface ChatMessageProps {
  message: Message
  onExtract?: (content: string) => void
  isLoading?: boolean
}

export function ChatMessage({ message, onExtract, isLoading }: ChatMessageProps) {
  const isUser = message.role === "user"
  
  return (
    <div
      className={cn(
        "group flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar className={cn("h-8 w-8", isUser ? "bg-primary" : "ai-gradient-bg")}>
        <span className="text-xs font-medium text-primary-foreground">
          {isUser ? "You" : "AI"}
        </span>
      </Avatar>
      
      <div
        className={cn(
          "flex-1 space-y-2",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-lg px-4 py-2",
            isUser
              ? "bg-primary text-primary-foreground"
              : "glass border border-border/50"
          )}
        >
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {message.content}
          </div>
          
          {isLoading && (
            <div className="mt-2 flex gap-1">
              <div className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground/50" />
              <div className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground/50 delay-75" />
              <div className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground/50 delay-150" />
            </div>
          )}
        </div>
        
        {!isUser && !isLoading && (
          <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onExtract?.(message.content)}
            >
              <FileText className="mr-1 h-3 w-3" />
              Create Note
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigator.clipboard.writeText(message.content)}
            >
              <Copy className="h-3 w-3" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Star Message</DropdownMenuItem>
                <DropdownMenuItem>Share</DropdownMenuItem>
                <DropdownMenuItem>Report Issue</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  )
}
```

**3. Chat API Route**
```typescript
// app/api/chat/route.ts
import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"

export async function POST(req: Request) {
  const { messages, context } = await req.json()

  const result = await streamText({
    model: openai("gpt-4-turbo"),
    messages,
    system: context
      ? `You are a helpful AI assistant. Context about the current note: ${context}`
      : "You are a helpful AI assistant for a knowledge management application.",
    temperature: 0.7,
    maxTokens: 2000,
  })

  return result.toAIStreamResponse()
}
```

### Testing for Sprint 1.1
- [ ] Editor loads without errors
- [ ] Spell check underlines misspelled words in red
- [ ] Grammar check underlines issues in blue
- [ ] Right-click shows correction suggestions
- [ ] Chat messages stream in real-time
- [ ] Stop generation button works
- [ ] Extract to note button appears on hover
- [ ] Auto-scroll works during streaming
- [ ] Error states display properly
- [ ] Performance: <100ms for spell check

---

## Sprint 1.2: Chat → Note Extraction + Home Chat

### Objectives
- Enable seamless extraction of chat content to notes
- Implement dedicated home chat for each note
- Create the bidirectional flow between chats and notes

### Feature F03: Chat → Note Extraction

#### Implementation Plan

**1. Extraction Service**
```typescript
// features/chat/services/extraction.ts
import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

const extractionSchema = z.object({
  title: z.string(),
  summary: z.string(),
  tags: z.array(z.string()),
  content: z.string(),
})

export async function extractNoteFromChat(content: string) {
  const { object } = await generateObject({
    model: openai("gpt-4-turbo"),
    schema: extractionSchema,
    prompt: `Extract and format the following chat content into a well-structured note:
    
    ${content}
    
    Create a clear title, brief summary, relevant tags, and formatted content.`,
  })
  
  return object
}

// Extraction with selection
export async function extractSelection(
  fullContent: string,
  selection: string
) {
  const { object } = await generateObject({
    model: openai("gpt-4-turbo"),
    schema: extractionSchema,
    prompt: `Extract the selected portion into a note, using the full content for context:
    
    Full content: ${fullContent}
    
    Selection to extract: ${selection}
    
    Create a clear title and format the selection as a standalone note.`,
  })
  
  return object
}
```

**2. Extraction UI Flow**
```typescript
// features/chat/components/extraction-dialog.tsx
"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { extractNoteFromChat } from "../services/extraction"

interface ExtractionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  content: string
  onConfirm: (note: any) => void
}

export function ExtractionDialog({
  open,
  onOpenChange,
  content,
  onConfirm,
}: ExtractionDialogProps) {
  const [extracting, setExtracting] = useState(false)
  const [extracted, setExtracted] = useState<any>(null)
  
  const handleExtract = async () => {
    setExtracting(true)
    try {
      const result = await extractNoteFromChat(content)
      setExtracted(result)
    } catch (error) {
      console.error("Extraction failed:", error)
    } finally {
      setExtracting(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Note from Chat</DialogTitle>
          <DialogDescription>
            AI will extract and format this content into a structured note.
          </DialogDescription>
        </DialogHeader>
        
        {!extracted ? (
          <div className="space-y-4 py-4">
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="line-clamp-4 text-sm">{content}</p>
            </div>
            <Button
              onClick={handleExtract}
              disabled={extracting}
              className="w-full"
            >
              {extracting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Extracting...
                </>
              ) : (
                "Extract with AI"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={extracted.title}
                onChange={(e) =>
                  setExtracted({ ...extracted, title: e.target.value })
                }
              />
            </div>
            
            <div>
              <Label>Tags</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {extracted.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <Label>Content Preview</Label>
              <div className="mt-2 rounded-lg border bg-muted/50 p-4">
                <p className="line-clamp-6 text-sm">{extracted.content}</p>
              </div>
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {extracted && (
            <Button onClick={() => onConfirm(extracted)}>
              Create Note
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### Feature F04: Note Home Chat

#### Implementation Plan

**1. Home Chat Provider**
```typescript
// features/notes/providers/home-chat-provider.tsx
"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { Message } from "ai"

interface HomeChatContextType {
  messages: Record<string, Message[]>
  addMessage: (noteId: string, message: Message) => void
  clearChat: (noteId: string, summary?: string) => void
  getMessages: (noteId: string) => Message[]
}

const HomeChatContext = createContext<HomeChatContextType | undefined>(undefined)

export function HomeChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  
  const addMessage = (noteId: string, message: Message) => {
    setMessages((prev) => ({
      ...prev,
      [noteId]: [...(prev[noteId] || []), message],
    }))
  }
  
  const clearChat = (noteId: string, summary?: string) => {
    if (summary) {
      // Add summary as system message
      const summaryMessage: Message = {
        id: `summary-${Date.now()}`,
        role: "system",
        content: `Previous conversation summary: ${summary}`,
      }
      setMessages((prev) => ({
        ...prev,
        [noteId]: [summaryMessage],
      }))
    } else {
      setMessages((prev) => ({
        ...prev,
        [noteId]: [],
      }))
    }
  }
  
  const getMessages = (noteId: string) => {
    return messages[noteId] || []
  }
  
  return (
    <HomeChatContext.Provider
      value={{ messages, addMessage, clearChat, getMessages }}
    >
      {children}
    </HomeChatContext.Provider>
  )
}

export const useHomeChat = () => {
  const context = useContext(HomeChatContext)
  if (!context) {
    throw new Error("useHomeChat must be used within HomeChatProvider")
  }
  return context
}
```

**2. Note View with Home Chat**
```typescript
// features/notes/components/note-view.tsx
"use client"

import { useState } from "react"
import { Panels } from "@/components/layout/panels"
import { Editor } from "@/features/editor/components/novel-editor"
import { ChatInterface } from "@/features/chat/components/chat-interface"
import { useHomeChat } from "../providers/home-chat-provider"
import { Button } from "@/components/ui/button"
import { Trash2, RefreshCw } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface NoteViewProps {
  noteId: string
  initialContent?: string
}

export function NoteView({ noteId, initialContent }: NoteViewProps) {
  const [content, setContent] = useState(initialContent || "")
  const { clearChat } = useHomeChat()
  const [showClearDialog, setShowClearDialog] = useState(false)
  
  const handleClearChat = async (withSummary: boolean) => {
    if (withSummary) {
      // Generate summary of conversation
      const summary = await generateChatSummary(noteId)
      clearChat(noteId, summary)
    } else {
      clearChat(noteId)
    }
    setShowClearDialog(false)
  }
  
  return (
    <Panels defaultLayout={[70, 30]}>
      <div className="h-full">
        <Editor
          content={content}
          onChange={setContent}
          className="h-full"
        />
      </div>
      
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b p-2">
          <h3 className="text-sm font-medium">Note Assistant</h3>
          <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear chat history?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove all messages from this note's chat.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleClearChat(false)}
                  variant="outline"
                >
                  Clear without summary
                </AlertDialogAction>
                <AlertDialogAction onClick={() => handleClearChat(true)}>
                  Clear with summary
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        
        <ChatInterface
          chatId={`note-${noteId}`}
          context={content}
          onExtract={(extractedContent) => {
            // Append to current note
            setContent(content + "\n\n" + extractedContent)
          }}
        />
      </div>
    </Panels>
  )
}
```

### Testing for Sprint 1.2
- [ ] Selection extraction creates proper note
- [ ] Full message extraction works
- [ ] Extraction dialog shows AI-generated title and tags
- [ ] Home chat persists across note sessions
- [ ] Clear chat with summary works
- [ ] Note context is available in home chat
- [ ] Panel resizing saves preference
- [ ] Extracted content formats properly

---

## Sprint 1.3: Ghost Text + Inline AI + Spaces

### Objectives
- Implement AI-powered ghost text completions
- Add inline AI commands with //
- Build spaces and collections organization

### Feature F05: Ghost Text Completions

#### Implementation Plan

**1. Ghost Text Hook**
```typescript
// features/editor/hooks/use-ghost-text.ts
import { useCompletion } from "ai/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { debounce } from "lodash"
import { Editor } from "@tiptap/core"

interface UseGhostTextProps {
  editor: Editor | null
  enabled?: boolean
}

export function useGhostText({ editor, enabled = true }: UseGhostTextProps) {
  const [showGhost, setShowGhost] = useState(false)
  const [ghostPosition, setGhostPosition] = useState(0)
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  const { completion, complete, stop, isLoading } = useCompletion({
    api: "/api/completion",
    onFinish: () => {
      setShowGhost(true)
    },
  })
  
  // Debounced completion trigger
  const triggerCompletion = useCallback(
    debounce(async (context: string, position: number) => {
      if (!enabled || !context.trim()) return
      
      setGhostPosition(position)
      await complete(context)
    }, 1000),
    [enabled, complete]
  )
  
  // Watch for cursor pause
  useEffect(() => {
    if (!editor || !enabled) return
    
    const handleUpdate = () => {
      // Clear existing timeout
      clearTimeout(timeoutRef.current)
      setShowGhost(false)
      stop()
      
      // Get context around cursor
      const { from } = editor.state.selection
      const context = getContextAroundCursor(editor, from, 100)
      
      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        triggerCompletion(context, from)
      }, 1000)
    }
    
    editor.on("update", handleUpdate)
    editor.on("selectionUpdate", handleUpdate)
    
    return () => {
      editor.off("update", handleUpdate)
      editor.off("selectionUpdate", handleUpdate)
      clearTimeout(timeoutRef.current)
    }
  }, [editor, enabled, triggerCompletion, stop])
  
  // Accept completion
  const acceptCompletion = useCallback(() => {
    if (!editor || !completion || !showGhost) return
    
    editor
      .chain()
      .focus()
      .insertContentAt(ghostPosition, completion)
      .run()
    
    setShowGhost(false)
  }, [editor, completion, showGhost, ghostPosition])
  
  // Dismiss on any key except Tab
  useEffect(() => {
    if (!showGhost) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault()
        acceptCompletion()
      } else {
        setShowGhost(false)
      }
    }
    
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [showGhost, acceptCompletion])
  
  return {
    completion: showGhost ? completion : "",
    isLoading,
    position: ghostPosition,
  }
}

function getContextAroundCursor(
  editor: Editor,
  position: number,
  chars: number
): string {
  const doc = editor.state.doc
  const start = Math.max(0, position - chars)
  const end = Math.min(doc.content.size, position + chars)
  
  return doc.textBetween(start, end, " ")
}
```

**2. Ghost Text Renderer**
```typescript
// features/editor/components/ghost-text-renderer.tsx
import { useEffect, useRef } from "react"
import { Editor } from "@tiptap/core"

interface GhostTextRendererProps {
  editor: Editor | null
  completion: string
  position: number
}

export function GhostTextRenderer({
  editor,
  completion,
  position,
}: GhostTextRendererProps) {
  const ghostRef = useRef<HTMLSpanElement>(null)
  
  useEffect(() => {
    if (!editor || !completion || !ghostRef.current) return
    
    // Get cursor coordinates
    const coords = editor.view.coordsAtPos(position)
    const editorRect = editor.view.dom.getBoundingClientRect()
    
    // Position ghost text
    ghostRef.current.style.position = "absolute"
    ghostRef.current.style.left = `${coords.left - editorRect.left}px`
    ghostRef.current.style.top = `${coords.top - editorRect.top}px`
  }, [editor, completion, position])
  
  if (!completion) return null
  
  return (
    <span
      ref={ghostRef}
      className="pointer-events-none select-none opacity-40 animate-pulse"
      style={{
        fontFamily: "inherit",
        fontSize: "inherit",
        lineHeight: "inherit",
      }}
    >
      {completion}
    </span>
  )
}
```

### Feature F06: Inline AI (//)

#### Implementation Plan

**1. Inline AI Extension**
```typescript
// features/editor/extensions/inline-ai.ts
import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "prosemirror-state"
import { Decoration, DecorationSet } from "prosemirror-view"

export const InlineAIExtension = Extension.create({
  name: "inlineAI",
  
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("inlineAI"),
        state: {
          init() {
            return {
              active: false,
              position: null,
              query: "",
            }
          },
          apply(tr, oldState) {
            const meta = tr.getMeta(this.key)
            if (meta) return meta
            
            // Check for // pattern
            const { $from } = tr.selection
            const textBefore = $from.parent.textBetween(
              Math.max(0, $from.parentOffset - 2),
              $from.parentOffset
            )
            
            if (textBefore === "//") {
              return {
                active: true,
                position: $from.pos - 2,
                query: "",
              }
            }
            
            if (oldState.active) {
              // Continue capturing query
              const query = $from.parent.textBetween(
                oldState.position - $from.start() + 2,
                $from.parentOffset
              )
              
              return {
                ...oldState,
                query,
              }
            }
            
            return { active: false, position: null, query: "" }
          },
        },
        props: {
          handleKeyDown(view, event) {
            const state = this.getState(view.state)
            
            if (state.active && event.key === "Enter") {
              event.preventDefault()
              // Process AI command
              processInlineAI(view, state.position, state.query)
              return true
            }
            
            if (state.active && event.key === "Escape") {
              event.preventDefault()
              // Cancel inline AI
              cancelInlineAI(view, state.position)
              return true
            }
            
            return false
          },
          decorations(state) {
            const pluginState = this.getState(state)
            if (!pluginState.active) return DecorationSet.empty
            
            // Highlight the command
            return DecorationSet.create(state.doc, [
              Decoration.inline(
                pluginState.position,
                pluginState.position + 2 + pluginState.query.length,
                { class: "inline-ai-command" }
              ),
            ])
          },
        },
      }),
    ]
  },
})

async function processInlineAI(view: any, position: number, query: string) {
  // Show loading state
  const tr = view.state.tr
  tr.setMeta(PluginKey.get("inlineAI"), {
    active: false,
    position: null,
    query: "",
  })
  
  // Get context
  const context = view.state.doc.textBetween(
    Math.max(0, position - 200),
    Math.min(view.state.doc.content.size, position + 200)
  )
  
  try {
    // Call AI API
    const response = await fetch("/api/inline-ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, context }),
    })
    
    const { result } = await response.json()
    
    // Replace command with result
    view.dispatch(
      tr.replaceRangeWith(
        position,
        position + 2 + query.length,
        view.state.schema.text(result)
      )
    )
  } catch (error) {
    console.error("Inline AI failed:", error)
  }
}
```

### Feature F07: Spaces & Collections

#### Implementation Plan

**1. Space Management**
```typescript
// features/organization/stores/spaces-store.ts
import { create } from "zustand"
import { persist } from "zustand/middleware"

interface Space {
  id: string
  name: string
  icon: string
  collections: Collection[]
  order: number
}

interface Collection {
  id: string
  name: string
  type: "manual" | "smart" | "default"
  icon?: string
  rules?: SmartRule[]
  noteIds: string[]
  order: number
}

interface SmartRule {
  field: "title" | "content" | "tags" | "created" | "modified"
  operator: "contains" | "equals" | "startsWith" | "after" | "before"
  value: string
}

interface SpacesStore {
  spaces: Space[]
  activeSpaceId: string
  createSpace: (name: string, icon: string) => void
  updateSpace: (id: string, updates: Partial<Space>) => void
  deleteSpace: (id: string) => void
  setActiveSpace: (id: string) => void
  createCollection: (spaceId: string, collection: Omit<Collection, "id" | "order">) => void
  updateCollection: (spaceId: string, collectionId: string, updates: Partial<Collection>) => void
  deleteCollection: (spaceId: string, collectionId: string) => void
  addNoteToCollection: (spaceId: string, collectionId: string, noteId: string) => void
  removeNoteFromCollection: (spaceId: string, collectionId: string, noteId: string) => void
  reorderSpaces: (newOrder: string[]) => void
  reorderCollections: (spaceId: string, newOrder: string[]) => void
}

export const useSpacesStore = create<SpacesStore>()(
  persist(
    (set) => ({
      spaces: [
        {
          id: "all",
          name: "All Notes",
          icon: "🌐",
          order: 0,
          collections: [
            {
              id: "recent",
              name: "Recent",
              type: "default",
              icon: "⏱️",
              noteIds: [],
              order: 0,
            },
            {
              id: "favorites",
              name: "Favorites",
              type: "default",
              icon: "⭐",
              noteIds: [],
              order: 1,
            },
          ],
        },
        {
          id: "work",
          name: "Work",
          icon: "💼",
          order: 1,
          collections: [
            {
              id: "work-recent",
              name: "Recent",
              type: "default",
              icon: "⏱️",
              noteIds: [],
              order: 0,
            },
            {
              id: "work-favorites",
              name: "Favorites",
              type: "default",
              icon: "⭐",
              noteIds: [],
              order: 1,
            },
          ],
        },
      ],
      activeSpaceId: "all",
      
      createSpace: (name, icon) =>
        set((state) => ({
          spaces: [
            ...state.spaces,
            {
              id: `space-${Date.now()}`,
              name,
              icon,
              order: state.spaces.length,
              collections: [
                {
                  id: `${name.toLowerCase()}-recent`,
                  name: "Recent",
                  type: "default",
                  icon: "⏱️",
                  noteIds: [],
                  order: 0,
                },
                {
                  id: `${name.toLowerCase()}-favorites`,
                  name: "Favorites",
                  type: "default",
                  icon: "⭐",
                  noteIds: [],
                  order: 1,
                },
              ],
            },
          ],
        })),
      
      // ... other methods
    }),
    {
      name: "spaces-storage",
    }
  )
)
```

**2. Drag and Drop Collections**
```typescript
// features/organization/components/collection-list.tsx
"use client"

import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Folder, Plus, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSpacesStore } from "../stores/spaces-store"

function SortableCollection({ collection, spaceId }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: collection.id })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="group relative"
    >
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start"
        {...listeners}
      >
        <Folder className="mr-2 h-4 w-4" />
        <span className="flex-1 text-left">{collection.name}</span>
        <span className="text-xs text-muted-foreground">
          {collection.noteIds.length}
        </span>
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-0 top-0 opacity-0 group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation()
          // Show collection menu
        }}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function CollectionList({ spaceId }: { spaceId: string }) {
  const { spaces, reorderCollections } = useSpacesStore()
  const space = spaces.find((s) => s.id === spaceId)
  
  if (!space) return null
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      const oldIndex = space.collections.findIndex((c) => c.id === active.id)
      const newIndex = space.collections.findIndex((c) => c.id === over.id)
      
      const newOrder = [...space.collections]
      const [movedItem] = newOrder.splice(oldIndex, 1)
      newOrder.splice(newIndex, 0, movedItem)
      
      reorderCollections(
        spaceId,
        newOrder.map((c) => c.id)
      )
    }
  }
  
  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={space.collections.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1">
          {space.collections.map((collection) => (
            <SortableCollection
              key={collection.id}
              collection={collection}
              spaceId={spaceId}
            />
          ))}
        </div>
      </SortableContext>
      
      <Button
        variant="ghost"
        size="sm"
        className="mt-2 w-full justify-start"
        onClick={() => {
          // Create new collection
        }}
      >
        <Plus className="mr-2 h-4 w-4" />
        New Collection
      </Button>
    </DndContext>
  )
}
```

### Testing for Sprint 1.3
- [ ] Ghost text appears after 1s pause
- [ ] Tab accepts completion
- [ ] Other keys dismiss ghost text
- [ ] // triggers inline AI mode
- [ ] Enter processes command
- [ ] Escape cancels inline AI
- [ ] Spaces can be created/renamed/deleted
- [ ] Collections support drag and drop
- [ ] Notes can be added to collections
- [ ] Smart collections update automatically

---

## Sprint 1.4: Universal Search + Authentication

### Objectives
- Implement fast, fuzzy universal search
- Set up authentication with Arctic.js
- Complete the MVP feature set

### Feature F08: Universal Search

#### Implementation Plan

**1. Search Index**
```typescript
// features/search/services/search-index.ts
import Fuse from "fuse.js"
import { Note } from "@/types"
import { Chat } from "@/types"

interface SearchItem {
  id: string
  type: "note" | "chat" | "collection"
  title: string
  content: string
  space?: string
  tags?: string[]
  lastModified: Date
}

class SearchIndex {
  private fuse: Fuse<SearchItem>
  
  constructor() {
    this.fuse = new Fuse([], {
      keys: [
        { name: "title", weight: 0.4 },
        { name: "content", weight: 0.3 },
        { name: "tags", weight: 0.2 },
        { name: "space", weight: 0.1 },
      ],
      threshold: 0.4,
      includeScore: true,
      includeMatches: true,
    })
  }
  
  addNotes(notes: Note[]) {
    const items: SearchItem[] = notes.map((note) => ({
      id: note.id,
      type: "note",
      title: note.title,
      content: note.content,
      space: note.spaceId,
      tags: note.tags,
      lastModified: note.updatedAt,
    }))
    
    this.fuse.setCollection([
      ...this.fuse.getIndex().docs,
      ...items,
    ])
  }
  
  addChats(chats: Chat[]) {
    const items: SearchItem[] = chats
      .filter((chat) => !chat.expired)
      .map((chat) => ({
        id: chat.id,
        type: "chat",
        title: chat.title || "Untitled Chat",
        content: chat.preview,
        lastModified: chat.updatedAt,
      }))
    
    this.fuse.setCollection([
      ...this.fuse.getIndex().docs,
      ...items,
    ])
  }
  
  search(query: string, options?: { limit?: number; type?: string }) {
    let results = this.fuse.search(query)
    
    if (options?.type) {
      results = results.filter((r) => r.item.type === options.type)
    }
    
    if (options?.limit) {
      results = results.slice(0, options.limit)
    }
    
    return results
  }
  
  remove(id: string) {
    const items = this.fuse.getIndex().docs.filter((item) => item.id !== id)
    this.fuse.setCollection(items)
  }
}

export const searchIndex = new SearchIndex()
```

**2. Command Palette with Search**
```typescript
// features/search/components/command-palette.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Command } from "cmdk"
import {
  Search,
  FileText,
  MessageSquare,
  Clock,
  Star,
  Hash,
} from "lucide-react"
import { searchIndex } from "../services/search-index"
import { cn } from "@/lib/utils"

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [recent, setRecent] = useState<string[]>([])
  const router = useRouter()
  
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])
  
  useEffect(() => {
    if (search) {
      const searchResults = searchIndex.search(search, { limit: 10 })
      setResults(searchResults)
    } else {
      setResults([])
    }
  }, [search])
  
  const handleSelect = (item: any) => {
    // Add to recent
    setRecent((prev) => [item.id, ...prev.filter((id) => id !== item.id)].slice(0, 5))
    
    // Navigate
    if (item.type === "note") {
      router.push(`/notes/${item.id}`)
    } else if (item.type === "chat") {
      router.push(`/chats/${item.id}`)
    }
    
    setOpen(false)
    setSearch("")
  }
  
  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global search"
    >
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] backdrop-blur-sm">
        <div className="glass w-full max-w-2xl overflow-hidden rounded-lg border shadow-2xl">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search notes, chats, or type a command..."
              className="flex h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          
          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            {!search && recent.length > 0 && (
              <Command.Group heading="Recent">
                {recent.map((id) => (
                  <Command.Item
                    key={id}
                    onSelect={() => {
                      // Handle recent item
                    }}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    <span>Recent item</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
            
            {search && results.length > 0 && (
              <Command.Group heading="Search Results">
                {results.map((result) => (
                  <Command.Item
                    key={result.item.id}
                    value={result.item.id}
                    onSelect={() => handleSelect(result.item)}
                    className="group"
                  >
                    {result.item.type === "note" ? (
                      <FileText className="mr-2 h-4 w-4" />
                    ) : (
                      <MessageSquare className="mr-2 h-4 w-4" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{result.item.title}</div>
                      {result.matches && (
                        <div className="text-xs text-muted-foreground">
                          {highlightMatches(result.item.content, result.matches[0])}
                        </div>
                      )}
                    </div>
                    <div className="ml-auto text-xs text-muted-foreground">
                      {result.item.type}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
            
            <Command.Group heading="Commands">
              <Command.Item
                onSelect={() => {
                  router.push("/notes/new")
                  setOpen(false)
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                New Note
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  router.push("/chats/new")
                  setOpen(false)
                }}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                New Chat
              </Command.Item>
            </Command.Group>
          </Command.List>
        </div>
      </div>
    </Command.Dialog>
  )
}

function highlightMatches(text: string, match: any) {
  // Implement match highlighting
  return text.slice(0, 50) + "..."
}
```

### Feature F09: User Authentication

#### Implementation Plan

**1. Arctic.js Setup**
```typescript
// lib/auth/arctic.ts
import { Arctic, GitHub, Google } from "arctic"

export const arctic = new Arctic({
  domain: process.env.NEXT_PUBLIC_APP_URL!,
  clientId: process.env.OAUTH_CLIENT_ID!,
  clientSecret: process.env.OAUTH_CLIENT_SECRET!,
  redirectURI: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
})

export const github = new GitHub(
  process.env.GITHUB_CLIENT_ID!,
  process.env.GITHUB_CLIENT_SECRET!
)

export const google = new Google(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
)
```

**2. Auth API Routes**
```typescript
// app/api/auth/github/route.ts
import { generateState } from "arctic"
import { github } from "@/lib/auth/arctic"
import { cookies } from "next/headers"

export async function GET() {
  const state = generateState()
  const url = await github.createAuthorizationURL(state, {
    scopes: ["user:email"],
  })
  
  cookies().set("github_oauth_state", state, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 10, // 10 minutes
    sameSite: "lax",
  })
  
  return Response.redirect(url)
}

// app/api/auth/github/callback/route.ts
import { github } from "@/lib/auth/arctic"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { generateIdFromEntropySize } from "lucia"
import { createSession } from "@/lib/auth/session"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const storedState = cookies().get("github_oauth_state")?.value ?? null
  
  if (!code || !state || !storedState || state !== storedState) {
    return new Response(null, { status: 400 })
  }
  
  try {
    const tokens = await github.validateAuthorizationCode(code)
    const githubUserResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    })
    
    const githubUser = await githubUserResponse.json()
    
    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, githubUser.email))
      .limit(1)
    
    if (existingUser.length > 0) {
      // Create session
      await createSession(existingUser[0].id)
      return Response.redirect("/")
    }
    
    // Create new user
    const userId = generateIdFromEntropySize(10)
    await db.insert(users).values({
      id: userId,
      email: githubUser.email,
      name: githubUser.name,
      avatar: githubUser.avatar_url,
      provider: "github",
    })
    
    await createSession(userId)
    return Response.redirect("/onboarding")
  } catch (e) {
    console.error(e)
    return new Response(null, { status: 500 })
  }
}
```

**3. Session Management**
```typescript
// lib/auth/session.ts
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

export async function createSession(userId: string) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret)
  
  cookies().set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: "/",
  })
  
  return token
}

export async function getSession() {
  const token = cookies().get("session")?.value
  
  if (!token) return null
  
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as { userId: string }
  } catch {
    return null
  }
}

export async function deleteSession() {
  cookies().delete("session")
}
```

**4. Auth UI**
```typescript
// app/(auth)/login/page.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Github, Chrome } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold">Welcome to AI Notes</h1>
          <p className="text-muted-foreground">
            Sign in to access your knowledge workspace
          </p>
        </div>
        
        <div className="space-y-4">
          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              window.location.href = "/api/auth/github"
            }}
          >
            <Github className="mr-2 h-5 w-5" />
            Continue with GitHub
          </Button>
          
          <Button
            className="w-full"
            size="lg"
            variant="outline"
            onClick={() => {
              window.location.href = "/api/auth/google"
            }}
          >
            <Chrome className="mr-2 h-5 w-5" />
            Continue with Google
          </Button>
        </div>
        
        <p className="mt-6 text-center text-sm text-muted-foreground">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </Card>
    </div>
  )
}
```

### Testing for Sprint 1.4
- [ ] Cmd+K opens search from anywhere
- [ ] Search finds notes and chats
- [ ] Fuzzy matching works
- [ ] Recent searches are saved
- [ ] OAuth flow completes without errors
- [ ] Sessions persist across refreshes
- [ ] Protected routes redirect to login
- [ ] Logout clears session
- [ ] User profile displays correctly

---

## Success Metrics

By the end of Epic 1:
1. **Core Loop Complete**: Users can write → chat → organize
2. **Real-time Corrections**: <100ms for spell check feedback
3. **AI Response Time**: <2s for first token in chat
4. **Search Performance**: <50ms for results
5. **Zero Errors**: No console errors in production
6. **Mobile Responsive**: All features work on mobile
7. **Auth Success Rate**: >95% OAuth completion

## Handoff to Epic 2

With Epic 1 complete, users have:
- A powerful AI-assisted writing environment
- Seamless chat integration with extraction
- Smart organization with spaces
- Fast universal search
- Secure authentication

Epic 2 will build on this foundation with:
- Advanced AI features (slash commands, smart collections)
- Power user features (shortcuts, multi-note context)
- Polish (themes, versioning, export)