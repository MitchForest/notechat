'use client'

/**
 * Component: ChatInterface
 * Purpose: Main chat container with streaming message support
 * Features:
 * - Real-time streaming with AI SDK useChat
 * - Auto-scrolling message list
 * - Responsive layout
 * - Loading states
 * - Claude-like centered design
 * - Text selection → Note creation
 * - Multi-note context system
 * 
 * Created: December 2024
 * Updated: December 2024 - Added multi-note context
 */

import '../styles/animations.css'
import '../styles/chat.css'
import '../styles/chat-selection.css'
import { useChat } from 'ai/react'
import { useChatWithRetry } from '../hooks/use-chat-with-retry'
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { PanelHeader } from '@/components/shared/panel-header'
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog'
import { ChatMessage } from './chat-message'
import { ChatInput } from './chat-input'
import { ChatEmptyState } from './chat-empty-state'
import { ExtractToNoteDialog } from './extract-to-note-dialog'
import { ChatSkeleton } from './chat-skeleton'
import { TypingIndicator, StreamingIndicator, ToolLoading } from './loading-states'
import { SelectionMenu } from './selection-menu'
import { NotePreviewCard } from './note-preview-card'
import { NoteContextPills } from './note-context-pills'
import { ChatDropZone } from './chat-drop-zone'
import { VirtualMessageList } from './virtual-message-list'
import { useChatPersistence } from '../hooks/use-chat-persistence'
import { useMessagePagination } from '../hooks/use-message-pagination'
import { useTextSelection } from '../hooks/use-text-selection'
import { useContentStore, useCollectionStore, useUIStore, useSpaceStore } from '@/features/organization/stores'
import { useNoteContext } from '../stores/note-context-store'
import { useMultiNoteContext } from '../stores/multi-note-context'
import { useHighlightContext } from '../stores/highlight-context-store'
import { HighlightContextCard } from './highlight-context-card'
import { ToolConfirmation } from './tool-confirmation'
import { toast } from 'sonner'
import { FileText, AlertCircle, RefreshCw, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Message } from 'ai'
import { useRouter } from 'next/navigation'
import { markdownToTiptapHTML } from '@/features/ai/utils/content-parser'
import { useSmartCollectionStore } from '@/features/organization/stores/smart-collection-store'
import { ConnectionStatus } from './connection-status'
import { ChatSearch } from './chat-search'
import { useMessageSearch } from '../hooks/use-message-search'
import { useAppShell } from '@/components/layout/app-shell-context'

// Helper function to escape HTML
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m])
}

interface ChatInterfaceProps {
  chatId: string
  className?: string
  onClose?: () => void
  noteContext?: {
    id: string
    title: string
    content: string
  }
  metadata?: {
    spaceId?: string | null
    collectionId?: string | null
  }
}

export function ChatInterface({ chatId, className, onClose, noteContext, metadata }: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { loadMessages, saveMessage } = useChatPersistence(chatId)
  const { chats, updateChat, deleteChat, createChat, createNote, notes } = useContentStore()
  
  // Message pagination
  const {
    messages: paginatedMessages,
    hasMore,
    isLoadingMore,
    loadMore,
    loadInitial,
    addMessage,
    updateMessage,
    clearMessages: clearPaginatedMessages,
  } = useMessagePagination({ chatId })
  
  // Multi-note context
  const multiNoteContext = useMultiNoteContext()
  const { getNotesArray, addNote, removeNote, getContextString, highlightNoteTemporarily } = multiNoteContext
  const contextNotes = getNotesArray()
  
  // Highlight context
  const highlightContext = useHighlightContext()
  const { highlightedText, noteTitle: highlightNoteTitle, noteId: highlightNoteId, clearHighlight, getContextForChat } = highlightContext
  
  // Drag and drop state
  const [isDraggingNote, setIsDraggingNote] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  
  // Text selection hook
  const { selection, showMenu, menuPosition, clearSelection } = useTextSelection()
  const [showNotePreview, setShowNotePreview] = useState(false)
  const [selectedTextForNote, setSelectedTextForNote] = useState('')
  
  // Get note context from store (legacy, will phase out)
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
  
  // Tool confirmation state
  const [pendingToolCall, setPendingToolCall] = useState<any>(null)
  const [isExecutingTool, setIsExecutingTool] = useState(false)
  const [toolResult, setToolResult] = useState<{ success: boolean; message?: string; data?: any } | undefined>(undefined)

  // Message search - temporarily disabled
  let isSearchOpen = false
  let searchQuery = ''
  let currentMatch: any = null
  let openSearch = () => {}
  let closeSearch = () => {}
  let handleResultSelect = () => {}
  
  // Check if this chat exists in the store (i.e., has been persisted)
  useEffect(() => {
    const existingChat = chats.find(c => c.id === chatId)
    if (existingChat) {
      setIsTemporary(false)
      setHasBeenPersisted(true)
    }
  }, [chatId, chats])

  // Handle drag events
  useEffect(() => {
    const handleDragStart = (e: DragEvent) => {
      const dragData = e.dataTransfer?.getData('text/plain')
      if (dragData) {
        try {
          const data = JSON.parse(dragData)
          if (data.type === 'note') {
            setIsDraggingNote(true)
          }
        } catch {}
      }
    }

    const handleDragEnd = () => {
      setIsDraggingNote(false)
      setIsDragOver(false)
    }

    document.addEventListener('dragstart', handleDragStart)
    document.addEventListener('dragend', handleDragEnd)

    return () => {
      document.removeEventListener('dragstart', handleDragStart)
      document.removeEventListener('dragend', handleDragEnd)
    }
  }, [])

  const handleNoteDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const dragData = e.dataTransfer.getData('text/plain')
    if (!dragData) return

    try {
      const data = JSON.parse(dragData)
      if (data.type === 'note' && data.id) {
        const note = notes.find(n => n.id === data.id)
        if (note) {
          addNote({
            ...note,
            content: typeof note.content === 'string' ? note.content : null
          })
          toast.success(`Added "${note.title}" to context`)
        }
      }
    } catch (error) {
      console.error('Failed to handle drop:', error)
    }
  }

  const handleNoteClick = (noteId: string) => {
    // Use app shell context to open note
    const { openNote } = useAppShell()
    const note = notes.find(n => n.id === noteId)
    if (note) {
      openNote({ id: noteId, type: 'note', title: note.title })
    }
  }

  // Handle selection menu actions
  const handleCopySelection = useCallback(() => {
    if (selection.text) {
      navigator.clipboard.writeText(selection.text)
      toast.success('Copied to clipboard')
      clearSelection()
    }
  }, [selection.text, clearSelection])

  const handleCreateNoteFromSelection = useCallback(() => {
    if (selection.text) {
      setSelectedTextForNote(selection.text)
      setShowNotePreview(true)
      clearSelection()
    }
  }, [selection.text, clearSelection])

  const handleAskAIAboutSelection = useCallback(() => {
    if (selection.text) {
      // Add quoted text to input
      const quotedText = `"${selection.text}"\n\n`
      handleInputChange({ 
        target: { value: quotedText } 
      } as React.ChangeEvent<HTMLTextAreaElement>)
      clearSelection()
      
      // Focus the input
      setTimeout(() => {
        const textarea = document.querySelector('textarea')
        if (textarea) {
          textarea.focus()
          textarea.setSelectionRange(quotedText.length, quotedText.length)
        }
      }, 100)
    }
  }, [selection.text, clearSelection])

  const handleSaveNote = async (title: string, content: string, collectionId: string | null) => {
    try {
      const noteId = `note_${Date.now()}`
      const context = useUIStore.getState().getActiveContext()
      const spaceId = context?.spaceId || null
      const createdNote = await createNote(title, spaceId, collectionId, noteId)
      
      if (createdNote) {
        // Save content
        const response = await fetch(`/api/notes/${noteId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        })

        if (!response.ok) {
          throw new Error('Failed to save note content')
        }

        toast.success('Note created successfully')
        setShowNotePreview(false)
        setSelectedTextForNote('')
        
        // Open the note in the panel
        const { openNote } = useAppShell()
        openNote({ id: noteId, type: 'note', title: title })
      }
    } catch (error) {
      console.error('Failed to create note:', error)
      toast.error('Failed to create note')
    }
  }

  // Load initial messages on mount
  useEffect(() => {
    loadInitial()
  }, [loadInitial])

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
        // Use metadata if provided, otherwise get from store
        let spaceId: string | null
        let collectionId: string | null
        
        if (metadata) {
          // Use the metadata passed from creation
          spaceId = metadata.spaceId || null
          collectionId = metadata.collectionId || null
        } else {
          // Fallback to current store state
          const context = useUIStore.getState().getActiveContext()
          spaceId = context?.spaceId || null
          collectionId = context?.type === 'collection' ? context.id : null
        }
        
        const createdChat = await createChat(chatTitle, spaceId, collectionId, chatId)
        if (createdChat) {
          setIsTemporary(false)
          setHasBeenPersisted(true)
          // Don't show toast for seamless experience
        } else {
          throw new Error('Chat creation returned null')
        }
      } catch (error) {
        console.error('Failed to create chat:', error)
        toast.error('Failed to save chat. Please try again.')
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
    retryState,
    retry,
    isOnline
  } = useChatWithRetry({
    chatId,
    body: {
      // Include all context: multi-note, highlight, and legacy
      noteContext: contextNotes.length > 0 
        ? getContextString() + (highlightedText ? '\n\n' + getContextForChat() : '')
        : (highlightedText 
          ? getContextForChat() 
          : (contextString || (noteContext ? {
              id: noteContext.id,
              content: noteContext.content.slice(0, 2000),
            } : undefined))),
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
      // Defer message persistence to avoid state updates during streaming
      setTimeout(() => {
        // Persist message to database
        saveMessage(message)
      }, 0)
      
      // Check if AI referenced any notes
      if (message.role === 'assistant' && contextNotes.length > 0) {
        contextNotes.forEach(note => {
          if (message.content.toLowerCase().includes(note.title.toLowerCase())) {
            highlightNoteTemporarily(note.id)
          }
        })
      }
      
      // Check for tool calls in the message
      if (message.role === 'assistant' && message.toolInvocations?.length) {
        const lastToolCall = message.toolInvocations[message.toolInvocations.length - 1]
        if (lastToolCall.state === 'call') {
          setPendingToolCall({
            toolName: lastToolCall.toolName,
            args: lastToolCall.args,
          })
        }
      }
    },
    onError: (error) => {
      console.error('Chat error:', error)
      toast.error('Failed to send message')
    }
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
    clearPaginatedMessages()
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

  // Handle tool execution
  const handleToolConfirm = async () => {
    if (!pendingToolCall) return
    
    setIsExecutingTool(true)
    try {
      const { toolName, args } = pendingToolCall
      
      if (toolName === 'create_note') {
        const noteId = `note_${Date.now()}`
        const context = useUIStore.getState().getActiveContext()
        const spaceId = context?.spaceId || null
        const createdNote = await createNote(args.title, spaceId, args.collection_id || null, noteId)
        
        if (createdNote) {
          // Process content based on type
          const processedContent = args.content_type === 'markdown'
            ? markdownToTiptapHTML(args.content)
            : args.content
          
          // Save content
          const response = await fetch(`/api/notes/${noteId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: processedContent }),
          })

          if (!response.ok) {
            throw new Error('Failed to save note content')
          }

          setToolResult({ success: true, message: `Created note "${args.title}"` })
          toast.success('Note created successfully')
          
          // Open the note
          const { openNote } = useAppShell()
          openNote({ id: noteId, type: 'note', title: args.title })
        }
      } else if (toolName === 'update_note') {
        // Process content if provided
        let processedContent = args.content
        if (args.content && args.content_type === 'markdown') {
          processedContent = markdownToTiptapHTML(args.content)
        }
        
        const response = await fetch(`/api/notes/${args.note_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: args.title,
            content: processedContent,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to update note')
        }

        setToolResult({ success: true, message: 'Note updated successfully' })
        toast.success('Note updated')
      } else if (toolName === 'edit_selection') {
        // Get the current note content
        const noteResponse = await fetch(`/api/notes/${args.note_id}`)
        if (!noteResponse.ok) throw new Error('Failed to fetch note')
        
        const note = await noteResponse.json()
        let newContent = note.content || ''
        
        // Format the new text based on output_format
        let formattedText = args.new_text
        if (args.output_format === 'code') {
          const language = args.code_language || 'plaintext'
          formattedText = `<pre><code class="language-${language}">${escapeHtml(args.new_text)}</code></pre>`
        } else if (args.output_format === 'list') {
          const items = args.new_text.split('\n').filter((line: string) => line.trim())
          formattedText = `<ul>${items.map((item: string) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
        } else if (args.output_format === 'heading') {
          formattedText = `<h2>${escapeHtml(args.new_text)}</h2>`
        } else if (args.output_format === 'quote') {
          formattedText = `<blockquote>${escapeHtml(args.new_text)}</blockquote>`
        }
        
        // Apply the edit
        if (args.edit_type === 'replace') {
          newContent = newContent.replace(args.original_text, formattedText)
        } else if (args.edit_type === 'append') {
          newContent = newContent.replace(args.original_text, args.original_text + formattedText)
        } else if (args.edit_type === 'prepend') {
          newContent = newContent.replace(args.original_text, formattedText + args.original_text)
        }
        
        // Save the updated content
        const updateResponse = await fetch(`/api/notes/${args.note_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: newContent }),
        })

        if (!updateResponse.ok) {
          throw new Error('Failed to update note')
        }

        setToolResult({ success: true, message: 'Selection edited successfully' })
        toast.success('Text updated')
        
        // Clear highlight context since we've edited it
        clearHighlight()
      } else if (toolName === 'search_notes') {
        // Search for notes
        const response = await fetch(`/api/notes?q=${encodeURIComponent(args.query)}&limit=${args.limit || 5}`)
        if (!response.ok) throw new Error('Failed to search notes')
        
        const notes = await response.json()
        
        if (notes.length === 0) {
          setToolResult({ success: true, message: 'No notes found matching your search' })
        } else {
          setToolResult({ 
            success: true, 
            message: `Found ${notes.length} note${notes.length > 1 ? 's' : ''}`,
            data: notes
          })
        }
        
        toast.success(`Found ${notes.length} note${notes.length > 1 ? 's' : ''}`)
      }
      
      // Clear pending tool after success
      setTimeout(() => {
        setPendingToolCall(null)
        setToolResult(undefined)
      }, 2000)
    } catch (error) {
      console.error('Tool execution error:', error)
      setToolResult({ success: false, message: 'Failed to execute action' })
      toast.error('Action failed')
    } finally {
      setIsExecutingTool(false)
    }
  }

  const handleToolDeny = () => {
    setPendingToolCall(null)
    setToolResult(undefined)
    toast.info('Action cancelled')
  }

  return (
    <>
      {/* Main chat container with Card */}
      <Card className={cn('h-full flex flex-col', className)}>
        <PanelHeader
          title={chatTitle}
          onTitleChange={handleTitleChange}
          onAction={handleAction}
          type="chat"
          extraActions={
            <Button
              size="icon"
              variant="ghost"
              onClick={openSearch}
              className="h-8 w-8"
              title="Search messages (Cmd/Ctrl+F)"
            >
              <Search className="h-4 w-4" />
            </Button>
          }
        />

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* Note context pills */}
          {contextNotes.length > 0 && (
            <NoteContextPills
              notes={contextNotes}
              onRemove={removeNote}
              onNoteClick={handleNoteClick}
            />
          )}

          {/* Highlight context card */}
          {highlightedText && (
            <HighlightContextCard
              highlightedText={highlightedText}
              noteTitle={highlightNoteTitle || 'Unknown Note'}
              noteId={highlightNoteId || ''}
              onClear={clearHighlight}
              className="mx-4 mt-2"
            />
          )}

          {/* Search interface */}
          {isSearchOpen && (
            <ChatSearch
              isOpen={isSearchOpen}
              messages={messages}
              onResultSelect={handleResultSelect}
              onClose={closeSearch}
            />
          )}

          {/* Messages area */}
          <div 
            ref={scrollRef}
            className={cn(
              'flex-1 overflow-y-auto',
              'chat-scroll-smooth',
              isDragOver && 'ring-2 ring-primary ring-offset-2'
            )}
            onDrop={handleNoteDrop}
            onDragOver={(e) => {
              if (isDraggingNote) {
                e.preventDefault()
                setIsDragOver(true)
              }
            }}
            onDragLeave={() => setIsDragOver(false)}
          >
            <div className="chat-messages-container">
              {/* Drop zone indicator */}
              {isDraggingNote && (
                <ChatDropZone 
                  isActive={isDraggingNote}
                  isDragOver={isDragOver}
                  onDragEnter={() => setIsDragOver(true)}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleNoteDrop}
                />
              )}

              {/* Empty state */}
              {!isInitialLoading && messages.length === 0 && !error && (
                <ChatEmptyState 
                  onSuggestionClick={(suggestion: string) => {
                    handleInputChange({ 
                      target: { value: suggestion } 
                    } as React.ChangeEvent<HTMLTextAreaElement>)
                    // Submit the form
                    setTimeout(() => {
                      const form = document.querySelector('form')
                      if (form) {
                        form.requestSubmit()
                      }
                    }, 100)
                  }}
                  hasNoteContext={hasContext || contextNotes.length > 0}
                />
              )}

              {/* Loading state */}
              {isInitialLoading && <ChatSkeleton />}

              {/* Error state */}
              {error && !isLoading && (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center space-y-4">
                    <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                    <div>
                      <p className="text-lg font-medium">Something went wrong</p>
                      <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
                    </div>
                    <Button onClick={() => reload()} variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try again
                    </Button>
                  </div>
                </div>
              )}

              {/* Messages */}
              {!isInitialLoading && messages.length > 0 && (
                <>
                  {/* Load more button - hide for now since we're not using pagination */}
                  {false && hasMore && (
                    <div className="flex justify-center pb-4">
                      <Button
                        onClick={loadMore}
                        disabled={isLoadingMore}
                        variant="ghost"
                        size="sm"
                      >
                        {isLoadingMore ? 'Loading...' : 'Load older messages'}
                      </Button>
                    </div>
                  )}

                  {/* Message list */}
                  <div className="chat-messages-list pb-4">
                    {messages.map((message, index) => (
                      <ChatMessage
                        key={`${message.id}-${index}`}
                        message={message}
                        isStreaming={isLoading && index === messages.length - 1}
                        onRegenerate={reload}
                        userName={undefined}
                        userImage={undefined}
                        searchQuery={searchQuery}
                        isCurrentSearchMatch={currentMatch?.messageId === message.id}
                      />
                    ))}
                  </div>

                  {/* Loading indicators */}
                  {isLoading && (
                    <div className="pb-4">
                      {retryState.isRetrying ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground px-4">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Retrying... (Attempt {retryState.attempt} of {retryState.maxAttempts})
                        </div>
                      ) : messages[messages.length - 1]?.role === 'user' ? (
                        <TypingIndicator />
                      ) : (
                        <StreamingIndicator />
                      )}
                    </div>
                  )}

                  {/* Tool execution loading */}
                  {isExecutingTool && (
                    <div className="pb-4">
                      <ToolLoading toolName={pendingToolCall?.toolName || 'tool'} />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Input area - integrated with better design */}
          <ChatInput
            input={input}
            onChange={handleInputChange}
            onSubmit={handleCustomSubmit}
            isLoading={isLoading}
            onStop={stop}
            placeholder={
              contextNotes.length > 0
                ? `Message with ${contextNotes.length} note${contextNotes.length > 1 ? 's' : ''} in context...`
                : highlightedText
                ? 'Ask about the highlighted text...'
                : 'Send a message...'
            }
          />
        </CardContent>
      </Card>

      <SelectionMenu
        position={menuPosition}
        selectedText={selection.text}
        onCopy={handleCopySelection}
        onCreateNote={handleCreateNoteFromSelection}
        onAskAI={handleAskAIAboutSelection}
        onClose={clearSelection}
        isOpen={showMenu}
      />

      <NotePreviewCard
        initialContent={selectedTextForNote}
        onSave={handleSaveNote}
        onCancel={() => {
          setShowNotePreview(false)
          setSelectedTextForNote('')
        }}
        isOpen={showNotePreview}
      />

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