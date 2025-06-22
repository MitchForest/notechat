/**
 * Component: VirtualMessageList
 * Purpose: Handle 10,000+ messages smoothly with <16ms render time
 * Features:
 * - Dynamic height virtualization
 * - Smooth auto-scroll behavior
 * - Instant message rendering
 * - Memory efficient
 * - Support for tool confirmations
 * - Loading states
 * - Empty state
 * 
 * Updated: 2024-12-30 - Added support for all chat features
 */

'use client'

import '../styles/animations.css'
import { useRef, useEffect, useState, useCallback } from 'react'
import { Message } from 'ai'
import { ChatMessage } from './chat-message'
import { ChatEmptyState } from './chat-empty-state'
import { ChatSkeleton } from './chat-skeleton'
import { ToolConfirmation } from './tool-confirmation'
import { ToolLoading } from './loading-states'
import { TypingIndicator } from './loading-states'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface VirtualMessageListProps {
  messages: Message[]
  isLoading: boolean
  isInitialLoading?: boolean
  onRegenerate: () => void
  onSuggestionClick?: (suggestion: string) => void
  hasNoteContext?: boolean
  // Pagination props
  hasMore?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => void
  // Tool-related props
  pendingToolCall?: {
    toolName: string
    args: any
  }
  onToolConfirm?: () => void
  onToolDeny?: () => void
  isExecutingTool?: boolean
  toolResult?: {
    success: boolean
    message?: string
    data?: any
  }
  // User info
  userName?: string
  userImage?: string
  // Search props
  searchQuery?: string
  currentSearchMatch?: {
    messageId: string
    matchIndex: number
  } | null
}

export function VirtualMessageList({ 
  messages, 
  isLoading,
  isInitialLoading = false,
  onRegenerate,
  onSuggestionClick,
  hasNoteContext = false,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  pendingToolCall,
  onToolConfirm,
  onToolDeny,
  isExecutingTool,
  toolResult,
  userName,
  userImage,
  searchQuery,
  currentSearchMatch,
}: VirtualMessageListProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const heightCache = useRef(new Map<string, number>())

  // Calculate total items including tool UI and loading states
  type ExtraItemType = 'tool-confirmation' | 'tool-loading' | 'typing' | 'load-more'
  interface ExtraItem {
    type: ExtraItemType
  }
  
  const extraItems: ExtraItem[] = []
  // Add load more button at the top if there are more messages
  if (hasMore && messages.length > 0) extraItems.push({ type: 'load-more' })
  // Add other items at the bottom
  if (pendingToolCall) extraItems.push({ type: 'tool-confirmation' })
  if (isExecutingTool && !toolResult && pendingToolCall) extraItems.push({ type: 'tool-loading' })
  if (isLoading && messages[messages.length - 1]?.role === 'user') extraItems.push({ type: 'typing' })

  // Adjust total items calculation
  const loadMoreOffset = hasMore && messages.length > 0 ? 1 : 0
  const totalItems = messages.length + extraItems.length

  const rowVirtualizer = useVirtualizer({
    count: totalItems,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback((index) => {
      // Load more button
      if (hasMore && index === 0 && messages.length > 0) {
        return 60
      }
      
      // Adjust index for messages when load more is present
      const messageIndex = loadMoreOffset > 0 ? index - loadMoreOffset : index
      
      if (messageIndex < messages.length && messageIndex >= 0) {
        // Regular message
        const message = messages[messageIndex]
        const cached = heightCache.current.get(message.id)
        if (cached) return cached
        
        // Better estimates based on content
        return message.role === 'user' ? 80 : 120
      } else {
        // Extra items (tool UI, loading, etc) - excluding load more
        const extraIndex = messageIndex - messages.length
        const extraItem = extraItems.find((_, idx) => {
          if (loadMoreOffset > 0 && idx === 0) return false // Skip load-more in this calculation
          return idx - loadMoreOffset === extraIndex
        })
        
        switch (extraItem?.type) {
          case 'tool-confirmation':
            return 150
          case 'tool-loading':
            return 80
          case 'typing':
            return 60
          default:
            return 100
        }
      }
    }, [messages, extraItems, hasMore, loadMoreOffset]),
    overscan: 3,
    measureElement: (element) => {
      // Cache actual heights for smooth scrolling
      const htmlElement = element as HTMLElement
      const id = htmlElement?.dataset.messageId || htmlElement?.dataset.itemType
      if (id) {
        const height = htmlElement.getBoundingClientRect().height
        heightCache.current.set(id, height)
        return height
      }
      return 120
    },
  })

  // Smooth auto-scroll with RAF
  useEffect(() => {
    if (autoScroll && parentRef.current) {
      requestAnimationFrame(() => {
        parentRef.current?.scrollTo({
          top: parentRef.current.scrollHeight,
          behavior: 'smooth'
        })
      })
    }
  }, [messages, extraItems, autoScroll])

  // Detect manual scroll with debouncing
  useEffect(() => {
    const scrollElement = parentRef.current
    if (!scrollElement) return

    let scrollTimeout: NodeJS.Timeout
    const handleScroll = () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        const { scrollTop, scrollHeight, clientHeight } = scrollElement
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 100
        setAutoScroll(isAtBottom)
        
        // Check if we should load more messages (scrolled near top)
        if (scrollTop < 200 && hasMore && !isLoadingMore && onLoadMore) {
          // Save current scroll position
          const currentScrollHeight = scrollHeight
          
          onLoadMore()
          
          // Restore scroll position after messages load
          requestAnimationFrame(() => {
            const newScrollHeight = scrollElement.scrollHeight
            const scrollDiff = newScrollHeight - currentScrollHeight
            scrollElement.scrollTop = scrollTop + scrollDiff
          })
        }
      }, 150)
    }

    scrollElement.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimeout)
    }
  }, [hasMore, isLoadingMore, onLoadMore])

  // Show skeleton or empty state
  if (isInitialLoading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="chat-messages-container">
          <ChatSkeleton messageCount={3} />
        </div>
      </div>
    )
  }

  if (messages.length === 0 && onSuggestionClick) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="chat-messages-container">
          <ChatEmptyState 
            onSuggestionClick={onSuggestionClick}
            hasNoteContext={hasNoteContext}
          />
        </div>
      </div>
    )
  }

  return (
    <div ref={parentRef} className="flex-1 overflow-y-auto chat-scroll-smooth">
      <div className="chat-messages-container">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
          className="chat-messages-list"
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const { index, key, start, size } = virtualItem

            // Handle load more button
            if (hasMore && index === 0 && messages.length > 0) {
              return (
                <div
                  key={key}
                  data-item-type="load-more"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${size}px`,
                    transform: `translateY(${start}px)`,
                  }}
                  className="flex items-center justify-center p-2"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onLoadMore}
                    disabled={isLoadingMore}
                    className="text-muted-foreground"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading earlier messages...
                      </>
                    ) : (
                      'Load earlier messages'
                    )}
                  </Button>
                </div>
              )
            }

            // Adjust index for messages when load more is present
            const messageIndex = loadMoreOffset > 0 ? index - loadMoreOffset : index

            if (messageIndex < messages.length && messageIndex >= 0) {
              // Regular message
              const message = messages[messageIndex]
              const isLastMessage = messageIndex === messages.length - 1

              return (
                <div
                  key={key}
                  data-message-id={message.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${size}px`,
                    transform: `translateY(${start}px)`,
                  }}
                >
                  <ChatMessage
                    message={message}
                    isStreaming={isLoading && isLastMessage && message.role === 'assistant'}
                    onRegenerate={isLastMessage && message.role === 'assistant' ? onRegenerate : undefined}
                    userName={userName}
                    userImage={userImage}
                    searchQuery={searchQuery}
                    isCurrentSearchMatch={currentSearchMatch?.messageId === message.id}
                  />
                </div>
              )
            } else {
              // Extra items (tool UI, loading states)
              const extraIndex = messageIndex - messages.length
              const extraItem = extraItems[extraIndex]

              return (
                <div
                  key={key}
                  data-item-type={extraItem.type}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${size}px`,
                    transform: `translateY(${start}px)`,
                  }}
                >
                  {extraItem.type === 'tool-confirmation' && pendingToolCall && onToolConfirm && onToolDeny && (
                    <ToolConfirmation
                      tool={pendingToolCall}
                      onConfirm={onToolConfirm}
                      onDeny={onToolDeny}
                      isExecuting={isExecutingTool || false}
                      result={toolResult}
                    />
                  )}
                  
                  {extraItem.type === 'tool-loading' && pendingToolCall && (
                    <div className="chat-message-wrapper assistant">
                      <div className="w-8 h-8" /> {/* Spacer for avatar */}
                      <div className="chat-message-bubble assistant">
                        <ToolLoading toolName={pendingToolCall.toolName} />
                      </div>
                    </div>
                  )}
                  
                  {extraItem.type === 'typing' && (
                    <div className="chat-message-wrapper assistant">
                      <TypingIndicator />
                    </div>
                  )}
                </div>
              )
            }
          })}
        </div>
      </div>
    </div>
  )
} 