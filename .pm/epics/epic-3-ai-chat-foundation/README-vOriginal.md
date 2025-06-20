# Epic: AI Chat Foundation 💬

## Overview
**Goal**: Build the core AI chat functionality with streaming responses, note context, and extraction capabilities  
**Duration**: 1 week (2 sprints)  
**Prerequisites**: Writing Foundation epic completed (Novel editor working)  
**Outcome**: Users can have AI conversations, extract insights to notes, and each note has a dedicated AI assistant

## Success Criteria
- **Streaming Performance**: First token appears <1s after sending
- **Context Accuracy**: AI correctly uses note context in responses
- **Extraction Quality**: 90%+ of extracted notes have appropriate formatting
- **Reliability**: <1% error rate on API calls
- **UX Polish**: Smooth animations, clear loading states, error recovery

## Sprint 1: Core Chat Infrastructure

### Day 1-2: Basic Chat Interface with AI SDK

#### 1. Install AI SDK Dependencies
```bash
# AI SDK core packages
bun add ai @ai-sdk/openai

# Optional providers (for future flexibility)
bun add @ai-sdk/anthropic @ai-sdk/google

# Streaming utilities
bun add eventsource-parser
bun add nanoid
```

#### 2. Chat Store Setup
```typescript
// features/chat/stores/chat-store.ts
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { nanoid } from "nanoid"

export interface Chat {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
  starred: boolean
  spaceId?: string
  noteId?: string // For home chats
  preview?: string // First few words of last message
}

interface ChatStore {
  chats: Chat[]
  activeChats: Chat[] // Non-expired chats
  
  createChat: (options?: { noteId?: string; spaceId?: string }) => Chat
  updateChat: (id: string, updates: Partial<Chat>) => void
  deleteChat: (id: string) => void
  starChat: (id: string) => void
  
  // Cleanup expired chats
  cleanupExpiredChats: () => void
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      chats: [],
      activeChats: [],
      
      createChat: (options) => {
        const chat: Chat = {
          id: nanoid(),
          title: "New Chat",
          createdAt: new Date(),
          updatedAt: new Date(),
          starred: false,
          ...options,
        }
        
        set((state) => ({
          chats: [chat, ...state.chats],
          activeChats: [chat, ...state.activeChats],
        }))
        
        return chat
      },
      
      updateChat: (id, updates) => {
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === id
              ? { ...chat, ...updates, updatedAt: new Date() }
              : chat
          ),
          activeChats: state.activeChats.map((chat) =>
            chat.id === id
              ? { ...chat, ...updates, updatedAt: new Date() }
              : chat
          ),
        }))
      },
      
      deleteChat: (id) => {
        set((state) => ({
          chats: state.chats.filter((chat) => chat.id !== id),
          activeChats: state.activeChats.filter((chat) => chat.id !== id),
        }))
      },
      
      starChat: (id) => {
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === id ? { ...chat, starred: !chat.starred } : chat
          ),
        }))
      },
      
      cleanupExpiredChats: () => {
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        
        set((state) => ({
          activeChats: state.chats.filter(
            (chat) =>
              chat.starred ||
              chat.noteId || // Home chats don't expire
              chat.updatedAt > sevenDaysAgo
          ),
        }))
      },
    }),
    {
      name: "chat-storage",
      partialize: (state) => ({
        chats: state.chats,
      }),
    }
  )
)
```

#### 3. Chat Interface Component with AI SDK
```typescript
// features/chat/components/chat-interface.tsx
"use client"

import { useChat } from "ai/react"
import { useRef, useEffect } from "react"
import { Send, StopCircle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMessage } from "./chat-message"
import { ChatInput } from "./chat-input"
import { cn } from "@/lib/utils"

interface ChatInterfaceProps {
  chatId: string
  noteContext?: string
  className?: string
  onExtract?: (content: string) => void
}

export function ChatInterface({
  chatId,
  noteContext,
  className,
  onExtract,
}: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  
  // Using AI SDK's useChat hook
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    reload,
    error,
    append,
  } = useChat({
    id: chatId,
    api: "/api/chat",
    body: {
      noteContext,
    },
    onResponse: (response) => {
      // Scroll to bottom on new message
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    },
    onFinish: (message) => {
      // Update chat preview in store
      if (message.role === "assistant" && message.content) {
        const preview = message.content.slice(0, 100) + "..."
        useChatStore.getState().updateChat(chatId, { preview })
      }
    },
    onError: (error) => {
      console.error("Chat error:", error)
    },
  })
  
  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])
  
  // Empty state
  if (messages.length === 0) {
    return (
      <div className={cn("flex h-full flex-col", className)}>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-4 max-w-md">
            <Sparkles className="w-12 h-12 mx-auto text-muted-foreground/50" />
            <div>
              <h3 className="text-lg font-medium">Start a conversation</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Ask questions, explore ideas, or get help with your notes.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => append({ role: "user", content: "Help me understand this note" })}
              >
                Explain this note
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => append({ role: "user", content: "What are the key points?" })}
              >
                Key points
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => append({ role: "user", content: "How can I improve this?" })}
              >
                Suggestions
              </Button>
            </div>
          </div>
        </div>
        
        <ChatInputForm
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          stop={stop}
        />
      </div>
    )
  }
  
  return (
    <div className={cn("flex h-full flex-col", className)}>
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4 space-y-4">
          {messages.map((message, index) => (
            <ChatMessage
              key={message.id}
              message={message}
              isLoading={isLoading && index === messages.length - 1}
              onExtract={onExtract}
            />
          ))}
          
          {error && (
            <ErrorMessage error={error} onRetry={() => reload()} />
          )}
        </div>
      </ScrollArea>
      
      <ChatInputForm
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        stop={stop}
      />
    </div>
  )
}

// Extracted input form component
function ChatInputForm({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  stop,
}: {
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
  stop: () => void
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])
  
  return (
    <div className="border-t p-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          placeholder="Ask anything..."
          disabled={isLoading}
          rows={1}
          className={cn(
            "flex-1 resize-none rounded-md border border-input bg-background px-3 py-2",
            "text-sm ring-offset-background placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "min-h-[40px] max-h-[200px]"
          )}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e as any)
            }
          }}
        />
        <Button
          type="submit"
          size="icon"
          disabled={isLoading || !input.trim()}
          className="self-end"
        >
          {isLoading ? (
            <StopCircle className="h-4 w-4" onClick={stop} />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
      <p className="text-xs text-muted-foreground mt-2">
        {isLoading ? "AI is thinking..." : "Press Enter to send, Shift+Enter for new line"}
      </p>
    </div>
  )
}

// Error message component
function ErrorMessage({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
      <p className="text-sm text-destructive">{error.message}</p>
      <Button
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="mt-2"
      >
        Try again
      </Button>
    </div>
  )
}
```

### Day 3-4: Message Components & Streaming

#### 4. Chat Message Component
```typescript
// features/chat/components/chat-message.tsx
"use client"

import { Message } from "ai"
import { Copy, FileText, MoreHorizontal, User, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useState } from "react"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"

interface ChatMessageProps {
  message: Message
  isLoading?: boolean
  onExtract?: (content: string) => void
}

export function ChatMessage({ message, isLoading, onExtract }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === "user"
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <div
      className={cn(
        "group flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar className={cn("h-8 w-8 flex-shrink-0")}>
        <AvatarFallback
          className={cn(
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-gradient-to-br from-[#06B6D4] to-[#EC4899] text-white"
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      
      <div
        className={cn(
          "flex-1 space-y-2",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-lg px-4 py-2 max-w-[80%]",
            isUser
              ? "bg-primary text-primary-foreground ml-auto"
              : "bg-muted"
          )}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "")
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={oneDark}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
          
          {isLoading && !isUser && (
            <div className="flex gap-1 mt-2">
              <div className="w-2 h-2 rounded-full bg-foreground/30 animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-foreground/30 animate-pulse delay-75" />
              <div className="w-2 h-2 rounded-full bg-foreground/30 animate-pulse delay-150" />
            </div>
          )}
        </div>
        
        {!isUser && !isLoading && (
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onExtract?.(message.content)}
              className="h-8 text-xs"
            >
              <FileText className="mr-1 h-3 w-3" />
              Create Note
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 text-xs"
            >
              <Copy className="mr-1 h-3 w-3" />
              {copied ? "Copied!" : "Copy"}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Regenerate</DropdownMenuItem>
                <DropdownMenuItem>Edit</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  )
}
```

#### 5. Chat API Route with Streaming
```typescript
// app/api/chat/route.ts
import { openai } from "@ai-sdk/openai"
import { anthropic } from "@ai-sdk/anthropic"
import { StreamingTextResponse, streamText } from "ai"
import { NextRequest } from "next/server"

// Allow streaming responses
export const runtime = "edge"

export async function POST(req: NextRequest) {
  try {
    const { messages, noteContext } = await req.json()
    
    // Build system prompt based on context
    const systemPrompt = noteContext
      ? `You are a helpful AI assistant helping the user with their note. Here is the current note content for context:

${noteContext}

Please provide helpful, relevant responses based on this context. If asked to explain or elaborate, reference specific parts of the note.`
      : "You are a helpful AI assistant for a knowledge management application. Help users organize thoughts, develop ideas, and create meaningful notes."
    
    // Stream the response using AI SDK
    const result = await streamText({
      model: openai("gpt-4-turbo"), // or anthropic("claude-3-opus-20240229")
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      maxTokens: 2000,
    })
    
    // Return the streaming response
    return result.toAIStreamResponse()
    
  } catch (error) {
    console.error("Chat API error:", error)
    
    return new Response(
      JSON.stringify({ error: "An error occurred during the conversation" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}
```

### Day 5: Active Chats & Sidebar Integration

#### 6. Active Chats List Component
```typescript
// features/chat/components/active-chats-list.tsx
"use client"

import { useEffect } from "react"
import { MessageSquare, Star, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useChatStore } from "../stores/chat-store"
import { formatDistanceToNow } from "date-fns"
import { useRouter, usePathname } from "next/navigation"

export function ActiveChatsList() {
  const router = useRouter()
  const pathname = usePathname()
  const { activeChats, cleanupExpiredChats } = useChatStore()
  
  // Cleanup expired chats on mount
  useEffect(() => {
    cleanupExpiredChats()
    
    // Run cleanup daily
    const interval = setInterval(cleanupExpiredChats, 24 * 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [cleanupExpiredChats])
  
  if (activeChats.length === 0) {
    return (
      <div className="px-2 py-4">
        <p className="text-xs text-muted-foreground text-center">
          No active chats
        </p>
      </div>
    )
  }
  
  return (
    <div className="space-y-1 px-2">
      {activeChats.map((chat) => {
        const isActive = pathname === `/chat/${chat.id}`
        
        return (
          <Button
            key={chat.id}
            variant={isActive ? "secondary" : "ghost"}
            size="sm"
            className={cn(
              "w-full justify-start group",
              isActive && "bg-muted"
            )}
            onClick={() => router.push(`/chat/${chat.id}`)}
          >
            <MessageSquare className="mr-2 h-4 w-4 flex-shrink-0" />
            <div className="flex-1 text-left">
              <div className="flex items-center justify-between">
                <span className="truncate text-sm font-medium">
                  {chat.title}
                </span>
                {chat.starred && (
                  <Star className="h-3 w-3 fill-current text-yellow-500" />
                )}
              </div>
              {chat.preview && (
                <p className="text-xs text-muted-foreground truncate">
                  {chat.preview}
                </p>
              )}
            </div>
            <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100">
              <Clock className="h-3 w-3" />
            </div>
          </Button>
        )
      })}
    </div>
  )
}
```

#### 7. Updated Sidebar with Active Chats
```typescript
// components/layout/sidebar.tsx
"use client"

import { Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { ActiveChatsList } from "@/features/chat/components/active-chats-list"
import { SpacesList } from "@/features/organization/components/spaces-list"
import { useChatStore } from "@/features/chat/stores/chat-store"
import { useRouter } from "next/navigation"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const router = useRouter()
  const { createChat } = useChatStore()
  
  const handleNewChat = () => {
    const chat = createChat()
    router.push(`/chat/${chat.id}`)
  }
  
  const handleNewNote = () => {
    router.push("/notes/new")
  }
  
  return (
    <div className={cn("flex h-full w-64 flex-col border-r bg-card", className)}>
      {/* Action Buttons */}
      <div className="flex gap-2 p-4">
        <Button size="sm" variant="default" className="flex-1" onClick={handleNewNote}>
          <Plus className="mr-1 h-4 w-4" />
          New Note
        </Button>
        <Button size="sm" variant="outline" className="flex-1" onClick={handleNewChat}>
          <Plus className="mr-1 h-4 w-4" />
          New Chat
        </Button>
      </div>
      
      {/* Search */}
      <div className="px-4 pb-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-8"
          />
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="px-2 pb-2">
          {/* Active Chats Section */}
          <div className="mb-4">
            <h3 className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">
              Active Chats
            </h3>
            <ActiveChatsList />
          </div>
          
          <Separator className="my-2" />
          
          {/* Spaces Section */}
          <div>
            <h3 className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">
              Spaces
            </h3>
            <SpacesList />
          </div>
        </div>
      </ScrollArea>
      
      {/* Bottom Actions */}
      <div className="border-t p-2">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="flex-1">
            <Plus className="mr-1 h-3 w-3" />
            New Space
          </Button>
          <Button variant="ghost" size="icon">
            ⚙️
          </Button>
        </div>
      </div>
    </div>
  )
}
```

---

## Sprint 2: Note Context & Extraction

### Day 1-2: Home Chat Implementation

#### 1. Home Chat Context Provider
```typescript
// features/chat/providers/home-chat-provider.tsx
"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { Message } from "ai"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

interface HomeChatContextType {
  // Get messages for a specific note
  getMessages: (noteId: string) => Message[]
  
  // Clear chat with optional summary
  clearChat: (noteId: string, withSummary?: boolean) => Promise<void>
  
  // Check if a note has a home chat
  hasChat: (noteId: string) => boolean
}

const HomeChatContext = createContext<HomeChatContextType | undefined>(undefined)

export function HomeChatProvider({ children }: { children: ReactNode }) {
  // Store messages per note in memory (persisted via chat store)
  const [messagesByNote, setMessagesByNote] = useState<Record<string, Message[]>>({})
  
  const getMessages = useCallback((noteId: string) => {
    return messagesByNote[noteId] || []
  }, [messagesByNote])
  
  const clearChat = useCallback(async (noteId: string, withSummary = false) => {
    const messages = messagesByNote[noteId] || []
    
    if (withSummary && messages.length > 0) {
      try {
        // Generate summary of the conversation
        const { text: summary } = await generateText({
          model: openai("gpt-4-turbo"),
          prompt: `Summarize this conversation concisely, highlighting key insights and decisions:

${messages.map(m => `${m.role}: ${m.content}`).join("\n\n")}`,
          maxTokens: 200,
        })
        
        // Add summary as system message
        const summaryMessage: Message = {
          id: `summary-${Date.now()}`,
          role: "system",
          content: `Previous conversation summary: ${summary}`,
        }
        
        setMessagesByNote(prev => ({
          ...prev,
          [noteId]: [summaryMessage],
        }))
      } catch (error) {
        console.error("Failed to generate summary:", error)
        // Clear without summary on error
        setMessagesByNote(prev => ({
          ...prev,
          [noteId]: [],
        }))
      }
    } else {
      // Clear without summary
      setMessagesByNote(prev => ({
        ...prev,
        [noteId]: [],
      }))
    }
  }, [messagesByNote])
  
  const hasChat = useCallback((noteId: string) => {
    return (messagesByNote[noteId]?.length || 0) > 0
  }, [messagesByNote])
  
  return (
    <HomeChatContext.Provider value={{ getMessages, clearChat, hasChat }}>
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

#### 2. Note View with Home Chat Panel
```typescript
// features/notes/components/note-view.tsx
"use client"

import { useState, useEffect } from "react"
import { Trash2, Minimize2, Maximize2, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { NovelEditor } from "@/features/editor/components/novel-editor"
import { ChatInterface } from "@/features/chat/components/chat-interface"
import { useHomeChat } from "@/features/chat/providers/home-chat-provider"
import { cn } from "@/lib/utils"

interface NoteViewProps {
  noteId: string
  initialTitle?: string
  initialContent?: string
}

export function NoteView({ noteId, initialTitle = "", initialContent = "" }: NoteViewProps) {
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false)
  const { clearChat, hasChat } = useHomeChat()
  
  // Home chat ID is derived from note ID
  const homeChatId = `note-${noteId}`
  
  const handleClearChat = async (withSummary: boolean) => {
    await clearChat(noteId, withSummary)
    setShowClearDialog(false)
  }
  
  const handleExtract = (extractedContent: string) => {
    // Append extracted content to the note
    setContent(prev => prev + "\n\n---\n\n" + extractedContent)
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Note Title */}
      <div className="border-b px-6 py-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled Note"
          className="w-full bg-transparent text-2xl font-semibold outline-none placeholder:text-muted-foreground"
        />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={70} minSize={50}>
            <NovelEditor
              content={content}
              onChange={setContent}
              className="h-full overflow-auto"
            />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel
            defaultSize={30}
            minSize={20}
            collapsible
            collapsedSize={0}
            onCollapse={() => setIsPanelCollapsed(true)}
            onExpand={() => setIsPanelCollapsed(false)}
          >
            <div className="h-full flex flex-col bg-muted/30">
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b px-4 py-2 bg-background">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">Note Assistant</h3>
                </div>
                <div className="flex items-center gap-1">
                  <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setShowClearDialog(true)}
                      disabled={!hasChat(noteId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Clear chat history?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove all messages from this note's assistant chat.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          variant="outline"
                          onClick={() => handleClearChat(false)}
                        >
                          Clear without summary
                        </AlertDialogAction>
                        <AlertDialogAction onClick={() => handleClearChat(true)}>
                          Clear with summary
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setIsPanelCollapsed(true)}
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Chat Interface */}
              <ChatInterface
                chatId={homeChatId}
                noteContext={content}
                className="flex-1"
                onExtract={handleExtract}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      
      {/* Collapsed Panel Button */}
      {isPanelCollapsed && (
        <Button
          variant="outline"
          size="icon"
          className="fixed right-4 bottom-4 h-12 w-12 rounded-full shadow-lg"
          onClick={() => setIsPanelCollapsed(false)}
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
      )}
    </div>
  )
}
```

### Day 3-4: Chat to Note Extraction

#### 3. Extraction Service
```typescript
// features/chat/services/extraction-service.ts
import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

const extractionSchema = z.object({
  title: z.string().describe("A clear, descriptive title for the note"),
  summary: z.string().describe("A brief summary of the main points"),
  content: z.string().describe("The formatted content for the note"),
  tags: z.array(z.string()).describe("Relevant tags for categorization"),
  type: z.enum(["insight", "action", "reference", "idea"]).describe("The type of note"),
})

export type ExtractedNote = z.infer<typeof extractionSchema>

export class ExtractionService {
  async extractFromMessage(messageContent: string): Promise<ExtractedNote> {
    const { object } = await generateObject({
      model: openai("gpt-4-turbo"),
      schema: extractionSchema,
      prompt: `Extract the following AI response into a well-structured note. Format it with proper markdown, identify key points, and suggest relevant tags:

${messageContent}

Create a clear title and organize the content in a way that would be useful for future reference.`,
    })
    
    return object
  }
  
  async extractFromConversation(messages: Message[]): Promise<ExtractedNote> {
    const conversationText = messages
      .map(m => `${m.role === "user" ? "User" : "AI"}: ${m.content}`)
      .join("\n\n")
    
    const { object } = await generateObject({
      model: openai("gpt-4-turbo"),
      schema: extractionSchema,
      prompt: `Extract the key insights from this conversation into a comprehensive note. Focus on the main topics discussed, important conclusions, and actionable items:

${conversationText}

Create a note that captures the essence of this discussion for future reference.`,
    })
    
    return object
  }
  
  async extractSelection(fullContent: string, selection: string): Promise<ExtractedNote> {
    const { object } = await generateObject({
      model: openai("gpt-4-turbo"),
      schema: extractionSchema,
      prompt: `Extract the selected portion into a standalone note. Use the full content for context but focus on the selection:

Full context: ${fullContent}

Selection to extract: ${selection}

Create a self-contained note from this selection.`,
    })
    
    return object
  }
}

export const extractionService = new ExtractionService()
```

#### 4. Extraction Dialog Component
```typescript
// features/chat/components/extraction-dialog.tsx
"use client"

import { useState } from "react"
import { Loader2, FileText, Hash } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { extractionService, ExtractedNote } from "../services/extraction-service"
import { useNotesStore } from "@/features/notes/stores/notes-store"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

interface ExtractionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  content: string
  onSuccess?: (noteId: string) => void
}

export function ExtractionDialog({
  open,
  onOpenChange,
  content,
  onSuccess,
}: ExtractionDialogProps) {
  const router = useRouter()
  const { createNote } = useNotesStore()
  const [extracting, setExtracting] = useState(false)
  const [extracted, setExtracted] = useState<ExtractedNote | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  
  const handleExtract = async () => {
    setExtracting(true)
    try {
      const result = await extractionService.extractFromMessage(content)
      setExtracted(result)
      setIsEditing(true) // Allow editing by default
    } catch (error) {
      console.error("Extraction failed:", error)
      toast({
        title: "Extraction failed",
        description: "Failed to extract content. Please try again.",
        variant: "destructive",
      })
    } finally {
      setExtracting(false)
    }
  }
  
  const handleCreate = async () => {
    if (!extracted) return
    
    try {
      const noteId = await createNote({
        title: extracted.title,
        content: extracted.content,
        tags: extracted.tags,
      })
      
      toast({
        title: "Note created",
        description: "Your note has been created successfully.",
      })
      
      onOpenChange(false)
      onSuccess?.(noteId)
      
      // Navigate to the new note
      router.push(`/notes/${noteId}`)
    } catch (error) {
      console.error("Failed to create note:", error)
      toast({
        title: "Creation failed",
        description: "Failed to create note. Please try again.",
        variant: "destructive",
      })
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create Note from Chat</DialogTitle>
          <DialogDescription>
            AI will extract and format this content into a structured note.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          {!extracted ? (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <ScrollArea className="max-h-[200px]">
                  <p className="text-sm whitespace-pre-wrap">{content}</p>
                </ScrollArea>
              </div>
              <Button
                onClick={handleExtract}
                disabled={extracting}
                className="w-full"
              >
                {extracting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Extracting with AI...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Extract to Note
                  </>
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
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label>Type</Label>
                <div className="mt-1">
                  <Badge variant="secondary" className="capitalize">
                    {extracted.type}
                  </Badge>
                </div>
              </div>
              
              <div>
                <Label>Tags</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {extracted.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      <Hash className="mr-1 h-3 w-3" />
                      {tag}
                    </Badge>
                  ))}
                  {isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => {
                        // TODO: Add tag functionality
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={extracted.content}
                  onChange={(e) =>
                    setExtracted({ ...extracted, content: e.target.value })
                  }
                  disabled={!isEditing}
                  className="mt-1 min-h-[200px] font-mono text-sm"
                />
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {extracted && (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Preview" : "Edit"}
              </Button>
              <Button onClick={handleCreate}>
                Create Note
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### Day 5: Testing & Polish

#### 5. Chat Page Component
```typescript
// app/(dashboard)/chat/[id]/page.tsx
"use client"

import { useParams } from "next/navigation"
import { ChatInterface } from "@/features/chat/components/chat-interface"
import { useChatStore } from "@/features/chat/stores/chat-store"
import { useEffect } from "react"

export default function ChatPage() {
  const params = useParams()
  const chatId = params.id as string
  const { chats, updateChat } = useChatStore()
  
  const chat = chats.find(c => c.id === chatId)
  
  // Update last accessed time
  useEffect(() => {
    if (chat) {
      updateChat(chatId, { updatedAt: new Date() })
    }
  }, [chatId, chat, updateChat])
  
  if (!chat) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Chat not found</p>
      </div>
    )
  }
  
  return (
    <div className="h-full">
      <ChatInterface
        chatId={chatId}
        onExtract={(content) => {
          // TODO: Show extraction dialog
          console.log("Extract:", content)
        }}
      />
    </div>
  )
}
```

## Testing Checklist

### Sprint 1 Tests
- [ ] Chat messages stream token by token
- [ ] Stop button halts generation immediately
- [ ] Error states show and allow retry
- [ ] Empty state shows helpful prompts
- [ ] Messages format markdown correctly
- [ ] Code blocks have syntax highlighting
- [ ] Copy button works for messages
- [ ] Active chats show in sidebar
- [ ] Chat preview updates after AI response
- [ ] Expired chats are cleaned up after 7 days
- [ ] Starred chats don't expire

### Sprint 2 Tests
- [ ] Home chat persists with note
- [ ] Clear chat works with/without summary
- [ ] Note context is included in AI responses
- [ ] Extract button appears on AI messages
- [ ] Extraction dialog shows AI-formatted content
- [ ] Extracted content can be edited before saving
- [ ] New note is created with proper formatting
- [ ] Tags are extracted appropriately
- [ ] Panel resizing works smoothly
- [ ] Collapsed panel shows floating button

## Performance Metrics
- First token latency: <1s
- Full response time: <5s for typical queries
- Extraction time: <3s
- UI remains responsive during streaming
- Memory usage stable with long conversations

## Next Steps
With the AI Chat Foundation complete, users can:
- Have streaming AI conversations
- Extract valuable insights to notes
- Use dedicated AI assistants for each note
- Maintain context across conversations

The next epic (AI Writing Assistant) will add:
- Ghost text completions
- Inline AI commands
- Send to chat functionality