/**
 * Page: Canvas - Main Application Canvas
 * Purpose: Flexible main content area that adapts to different view configurations
 * Features:
 * - Handles empty state, single views (chat/note), and split views
 * - Resizable panels for split views
 * - Proper component switching based on view configuration
 * - Close functionality for individual panels
 * 
 * Modified: 2024-12-19 - Updated to use new ViewConfig system and Claude.ai theme
 */
'use client'

import React, { useState, useCallback } from 'react'
import { useAppShell, OpenItem } from '@/lib/app-shell-context'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { X, Send, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NovelEditor } from "@/features/editor/components/novel-editor"

// Placeholder components - these will be replaced with actual implementations
function ChatComponent({
  chat,
  onClose
}: {
  chat: { id: string; title?: string }
  onClose?: () => void
}) {
  const [message, setMessage] = React.useState('')

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log('Sending message:', message)
      setMessage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="text-lg font-semibold">
          {chat.title || 'AI Chat'}
        </CardTitle>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            ID: {chat.id}
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      {/* Chat Messages Area */}
      <CardContent className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-accent flex items-center justify-center">
            <Bot className="h-6 w-6 text-accent-foreground" />
          </div>
          <p className="text-lg mb-2 text-foreground">AI Chat</p>
          <p className="text-sm">Start a conversation below</p>
        </div>
      </CardContent>

      {/* Chat Input */}
      <div className="p-4 border-t">
        <div className="flex gap-3">
          <Input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

function NoteComponent({
  note,
  onClose,
  content,
  onContentChange
}: {
  note: { id:string; title?: string };
  onClose?: () => void;
  content: string;
  onContentChange: (content: string) => void;
}) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="text-lg font-semibold">
          {note.title || 'Note'}
        </CardTitle>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            ID: {note.id}
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="w-8 h-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-y-auto">
        <NovelEditor 
          onChange={onContentChange}
          content={content}
        />
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  const { openChat, openNote } = useAppShell()

  const handleNewChat = () => {
    openChat({
      id: `chat-${Date.now()}`,
      type: 'chat',
      title: 'New Chat'
    })
  }

  const handleNewNote = () => {
    openNote({
      id: `note-${Date.now()}`,
      type: 'note',
      title: 'New Note'
    })
  }

  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome to NoteChat.AI
          </h1>
          <p className="text-muted-foreground text-lg">
            Choose how you&apos;d like to start
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Card
            onClick={handleNewChat}
            className="group w-48 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all duration-200 hover:scale-105"
          >
            <CardContent className="p-6 flex flex-col items-center">
              <div className="text-2xl mb-3 ai-gradient-text">💬</div>
              <div className="text-foreground font-medium">Start Chat</div>
              <div className="text-muted-foreground text-sm">Chat with AI</div>
            </CardContent>
          </Card>

          <Card
            onClick={handleNewNote}
            className="group w-48 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all duration-200 hover:scale-105"
          >
            <CardContent className="p-6 flex flex-col items-center">
              <div className="text-2xl mb-3 ai-gradient-text">📝</div>
              <div className="text-foreground font-medium">Create Note</div>
              <div className="text-muted-foreground text-sm">Start writing</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function CanvasPage() {
  const { viewConfig, activeChat, activeNote, closeChat, closeNote } = useAppShell()
  const [content, setContent] = useState<string>("")

  const handleUpdate = useCallback((newContent: string) => {
    setContent(newContent)
    // console.log(newContent) // For debugging
  }, [])

  // Empty state
  if (viewConfig.primary === 'empty') {
    return <EmptyState />
  }

  // Single view (no secondary panel)
  if (!viewConfig.secondary) {
    if (viewConfig.primary === 'chat' && activeChat) {
      return (
        <div className="h-full p-4">
          <ChatComponent 
            chat={activeChat} 
            onClose={closeChat}
          />
        </div>
      )
    }
    
    if (viewConfig.primary === 'note' && activeNote) {
      return (
        <div className="h-full p-4">
          <NoteComponent 
            note={activeNote} 
            onClose={closeNote}
            content={content}
            onContentChange={handleUpdate}
          />
        </div>
      )
    }
  }

  // Split view (primary + secondary)
  if (viewConfig.secondary) {
    const primarySize = viewConfig.primarySize || 50
    
    const renderPanel = (item: OpenItem | null, onClose: () => void) => {
        if (!item) return null;
        switch (item.type) {
          case 'chat':
            return <ChatComponent chat={item} onClose={onClose} />
          case 'note':
            return (
              <NoteComponent
                note={item}
                onClose={onClose}
                content={content}
                onContentChange={handleUpdate}
              />
            )
          default:
            return null
        }
    }

    const primaryItem = viewConfig.primary === 'chat' ? activeChat : activeNote;
    const secondaryItem = viewConfig.secondary === 'chat' ? activeChat : activeNote;
    
    const primaryContent = renderPanel(
        primaryItem,
        viewConfig.primary === 'chat' ? closeChat : closeNote
    );

    const secondaryContent = renderPanel(
        secondaryItem,
        viewConfig.secondary === 'chat' ? closeChat : closeNote
    );

    return (
      <div className="h-full p-4">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={primarySize} minSize={30}>
            <div className="h-full pr-2">
              {primaryContent}
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={100 - primarySize} minSize={30}>
            <div className="h-full pl-2">
              {secondaryContent}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    )
  }

  // Should not happen, but as a fallback
  return <EmptyState />
} 