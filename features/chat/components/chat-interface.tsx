'use client'

/**
 * Component: ChatInterface
 * Purpose: Main chat container with streaming message support
 * Features:
 * - Real-time streaming with AI SDK useChat
 * - Auto-scrolling message list
 * - Responsive layout
 * - Loading states
 * - Extract to note functionality
 * 
 * Created: December 2024
 * Updated: December 2024 - Added extract to note
 */

import '../styles/animations.css'
import { useChat } from 'ai/react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { PanelHeader } from '@/components/shared/panel-header'
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog'
import { ChatMessage } from './chat-message'
import { ChatInput } from './chat-input'
import { ChatHeader } from './chat-header'
import { ChatEmptyState } from './chat-empty-state'
import { ExtractToNoteDialog } from './extract-to-note-dialog'
import { VirtualMessageList } from './virtual-message-list'
import { ChatSkeleton, TypingIndicator } from './chat-skeleton'
import { useChatPersistence } from '../hooks/use-chat-persistence'
import useOrganizationStore from '@/features/organization/store/organization-store'
import { useNoteContext } from '../stores/note-context-store'
import { toast } from 'sonner'
import { FileText, MousePointer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Message } from 'ai'

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
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  
  // Dialog states
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showExtractDialog, setShowExtractDialog] = useState(false)
  
  // Selection mode for extracting multiple messages
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set())

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
    
    // Check if user is asking to extract conversation
    const extractPattern = /extract\s+(this\s+)?conversation|create\s+a?\s+note\s+from\s+this/i
    if (extractPattern.test(input)) {
      // Extract all messages
      setShowExtractDialog(true)
      handleInputChange({ target: { value: '' } } as React.ChangeEvent<HTMLTextAreaElement>)
      return
    }
    
    // If this is the first message and chat is temporary, persist it first
    if (isTemporary && !hasBeenPersisted && input.trim()) {
      try {
        // Get the active collection from the organization store or default to null
        const { activeCollectionId } = useOrganizationStore.getState()
        
        // Check if it's a virtual collection (permanent collections)
        const virtualCollectionIds = [
          'notes-all', 'notes-recent', 'notes-saved', 'notes-uncategorized',
          'chats-all', 'chats-recent', 'chats-saved', 'chats-uncategorized'
        ];
        
        const collectionId = virtualCollectionIds.includes(activeCollectionId || '') 
          ? null 
          : activeCollectionId;
        
        const createdChat = await createChat(chatTitle, collectionId, chatId)
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

  // Set initial loading to false once messages are loaded
  useEffect(() => {
    if (messages.length > 0 || error) {
      setIsInitialLoading(false)
    }
  }, [messages, error])

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

  const toggleMessageSelection = (messageId: string) => {
    const newSelected = new Set(selectedMessages)
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId)
    } else {
      newSelected.add(messageId)
    }
    setSelectedMessages(newSelected)
  }

  const handleExtractSelected = () => {
    const messagesToExtract = messages.filter(m => selectedMessages.has(m.id))
    if (messagesToExtract.length > 0) {
      setShowExtractDialog(true)
    }
  }

  const exitSelectionMode = () => {
    setIsSelectionMode(false)
    setSelectedMessages(new Set())
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
          
          {/* Selection mode toolbar */}
          {isSelectionMode && (
            <div className="px-4 py-2 border-b bg-primary/10 flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedMessages.size} message{selectedMessages.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exitSelectionMode}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleExtractSelected}
                  disabled={selectedMessages.size === 0}
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Extract
                </Button>
              </div>
            </div>
          )}
          
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto scroll-smooth"
          >
            {isInitialLoading ? (
              <ChatSkeleton messageCount={3} />
            ) : messages.length === 0 ? (
              <ChatEmptyState 
                onSuggestionClick={(suggestion: string) => append({ role: 'user', content: suggestion })}
                hasNoteContext={hasContext}
              />
            ) : (
              <>
                <VirtualMessageList
                  messages={messages}
                  isLoading={isLoading}
                  onRegenerate={() => reload()}
                />
                
                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <TypingIndicator />
                )}
                
                {error && (
                  <div className="px-4 pb-4 max-w-3xl mx-auto">
                    <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
                      <p className="text-sm">{error.message}</p>
                      <button
                        onClick={() => reload()}
                        className="text-sm underline mt-1"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                )}
              </>
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

      {/* Extract action button */}
      {messages.length > 0 && !isSelectionMode && (
        <Button
          className="fixed bottom-20 right-8 shadow-lg"
          size="sm"
          variant="outline"
          onClick={() => setIsSelectionMode(true)}
        >
          <MousePointer className="w-4 h-4 mr-1" />
          Select Messages
        </Button>
      )}

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

      {showExtractDialog && (
        <ExtractToNoteDialog
          open={showExtractDialog}
          onOpenChange={(open) => {
            setShowExtractDialog(open)
            if (!open) exitSelectionMode()
          }}
          extractOptions={{
            source: selectedMessages.size > 0 ? 'selection' : 'chat',
            content: selectedMessages.size > 0 
              ? messages.filter(m => selectedMessages.has(m.id))
              : messages,
          }}
        />
      )}
    </>
  )
} 