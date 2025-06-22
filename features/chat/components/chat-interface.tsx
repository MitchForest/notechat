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
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { ChatMessage } from './chat-message'
import { ChatInput } from './chat-input'
import { ChatHeader } from './chat-header'
import { ChatEmptyState } from './chat-empty-state'
import { useChatPersistence } from '../hooks/use-chat-persistence'

interface ChatInterfaceProps {
  chatId: string
  className?: string
  noteContext?: {
    id: string
    title: string
    content: string
  }
}

export function ChatInterface({ chatId, className, noteContext }: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { loadMessages, saveMessage } = useChatPersistence(chatId)
  
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
      noteContext: noteContext ? {
        id: noteContext.id,
        content: noteContext.content.slice(0, 2000), // Limit context size
      } : undefined,
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

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      <ChatHeader 
        chatId={chatId}
        messageCount={messages.length}
        onClear={() => setMessages([])}
      />
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto scroll-smooth"
      >
        {messages.length === 0 ? (
          <ChatEmptyState 
            onSuggestionClick={(suggestion) => append({ role: 'user', content: suggestion })}
            hasNoteContext={!!noteContext}
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
        onSubmit={handleSubmit}
        isLoading={isLoading}
        onStop={stop}
        placeholder={noteContext ? `Ask about "${noteContext.title}"...` : 'Send a message...'}
      />
    </div>
  )
} 