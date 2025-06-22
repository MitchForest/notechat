'use client'

/**
 * Component: ChatInterface
 * Purpose: Main chat container with streaming message support
 * Features:
 * - Real-time streaming with AI SDK useChat
 * - Auto-scrolling message list
 * - Responsive layout
 * - Loading states
 * 
 * Created: December 2024
 */

import { useChat } from 'ai/react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { PanelHeader } from '@/components/shared/panel-header'
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog'
import { ChatMessage } from './chat-message'
import { ChatInput } from './chat-input'
import { ChatEmptyState } from './chat-empty-state'
import { useChatPersistence } from '../hooks/use-chat-persistence'
import useOrganizationStore from '@/features/organization/store/organization-store'
import { useNoteContext } from '../stores/note-context-store'
import { toast } from 'sonner'
import { FileText } from 'lucide-react'

interface ChatInterfaceProps {
  chatId: string
  className?: string
  onClose?: () => void
  noteContext?: {
    id: string
    title: string
    content: string
  }
}

export function ChatInterface({ chatId, className, onClose, noteContext }: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { loadMessages, saveMessage } = useChatPersistence(chatId)
  const { chats, updateChat, deleteChat, createChat } = useOrganizationStore()
  
  // Get note context from store
  const { currentNote, contextString, hasContext } = useNoteContext()
  
  // Find the chat in the store
  const chat = chats.find(c => c.id === chatId)
  const [chatTitle, setChatTitle] = useState(chat?.title || 'AI Chat')
  const [isTemporary, setIsTemporary] = useState(true)
  const [hasBeenPersisted, setHasBeenPersisted] = useState(false)
  
  // Dialog states
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Check if this chat exists in the store (i.e., has been persisted)
  useEffect(() => {
    const existingChat = chats.find(c => c.id === chatId)
    if (existingChat) {
      setIsTemporary(false)
      setHasBeenPersisted(true)
    }
  }, [chatId, chats])

  // Custom submit handler to persist chat on first message
  const handleCustomSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // If this is the first message and chat is temporary, persist it first
    if (isTemporary && !hasBeenPersisted && input.trim()) {
      try {
        // Get the active collection from the organization store or default to null
        const { activeCollectionId } = useOrganizationStore.getState()
        const createdChat = await createChat(chatTitle, activeCollectionId || 'chats-all', chatId)
        if (createdChat) {
          setIsTemporary(false)
          setHasBeenPersisted(true)
          toast.success('Chat created')
        }
      } catch (error) {
        toast.error('Failed to create chat')
        return // Don't send message if chat creation failed
      }
    }
    
    // Now proceed with normal submit
    handleSubmit(e)
  }
  
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    reload,
    stop,
    append,
    setMessages,
  } = useChat({
    id: chatId,
    api: '/api/chat',
    initialMessages: loadMessages(),
    body: {
      // Use note context from store, fallback to prop if provided
      noteContext: contextString || (noteContext ? {
        id: noteContext.id,
        content: noteContext.content.slice(0, 2000), // Limit context size
      } : undefined),
    },
    onResponse: (response) => {
      // Smooth scroll to bottom
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth',
        })
      }
    },
    onFinish: (message) => {
      // Persist message to database
      saveMessage(message)
    },
    onError: (error) => {
      console.error('Chat error:', error)
    },
  })

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      const scrollElement = scrollRef.current
      const isNearBottom = 
        scrollElement.scrollHeight - scrollElement.scrollTop - scrollElement.clientHeight < 100
      
      if (isNearBottom) {
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: 'smooth',
        })
      }
    }
  }, [messages])

  const handleTitleChange = async (newTitle: string) => {
    setChatTitle(newTitle)
    
    // Only update in database if chat is not temporary
    if (!isTemporary) {
      try {
        await updateChat(chatId, { title: newTitle })
        toast.success('Chat renamed')
      } catch (error) {
        toast.error('Failed to rename chat')
        // Revert title
        setChatTitle(chat?.title || 'AI Chat')
      }
    }
  }

  const handleAction = (action: 'rename' | 'delete' | 'clear' | 'close') => {
    switch (action) {
      case 'rename':
        // Handled by PanelHeader inline edit
        break
      case 'clear':
        setShowClearDialog(true)
        break
      case 'delete':
        if (!isTemporary) {
          setShowDeleteDialog(true)
        } else {
          // Just close if temporary
          onClose?.()
        }
        break
      case 'close':
        onClose?.()
        break
    }
  }

  const handleClearHistory = () => {
    setMessages([])
    toast.success('Chat history cleared')
  }

  const handleDelete = async () => {
    try {
      if (!isTemporary) {
        await deleteChat(chatId)
        toast.success('Chat deleted')
      }
      onClose?.()
    } catch (error) {
      toast.error('Failed to delete chat')
    }
  }

  return (
    <>
      <Card className={cn('h-full flex flex-col', className)}>
        <PanelHeader 
          title={chatTitle}
          type="chat"
          onTitleChange={handleTitleChange}
          onAction={handleAction}
        />
        
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* Show context indicator if there's a current note */}
          {currentNote && (
            <div className="px-4 py-2 border-b bg-muted/50 flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Chatting about: <span className="font-medium text-foreground">{currentNote.title}</span>
              </span>
            </div>
          )}
          
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto scroll-smooth"
          >
            {messages.length === 0 ? (
              <ChatEmptyState 
                onSuggestionClick={(suggestion) => append({ role: 'user', content: suggestion })}
                hasNoteContext={hasContext}
              />
            ) : (
              <div className="px-4 py-6 space-y-6 max-w-3xl mx-auto">
                {messages.map((message, index) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isStreaming={isLoading && index === messages.length - 1}
                    onRegenerate={() => reload()}
                    onEdit={(content) => {
                      const updatedMessages = [...messages]
                      updatedMessages[index] = { ...message, content }
                      setMessages(updatedMessages)
                    }}
                  />
                ))}
                
                {error && (
                  <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
                    <p className="text-sm">{error.message}</p>
                    <button
                      onClick={() => reload()}
                      className="text-sm underline mt-1"
                    >
                      Try again
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <ChatInput
            input={input}
            onChange={handleInputChange}
            onSubmit={handleCustomSubmit}
            isLoading={isLoading}
            onStop={stop}
            placeholder={currentNote ? `Ask about "${currentNote.title}"...` : 'Send a message...'}
          />
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={showClearDialog}
        onOpenChange={setShowClearDialog}
        title="Clear chat history?"
        description="This will permanently delete all messages in this chat. This action cannot be undone."
        confirmText="Clear History"
        onConfirm={handleClearHistory}
        isDestructive
      />

      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete chat?"
        description="This will permanently delete this chat and all its messages. This action cannot be undone."
        confirmText="Delete Chat"
        onConfirm={handleDelete}
        isDestructive
      />
    </>
  )
} 