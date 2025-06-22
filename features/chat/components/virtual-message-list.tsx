/**
 * Component: VirtualMessageList
 * Purpose: Handle 10,000+ messages smoothly with <16ms render time
 * Features:
 * - Dynamic height virtualization
 * - Smooth auto-scroll behavior
 * - Instant message rendering
 * - Memory efficient
 */

'use client'

import '../styles/animations.css'
import { useRef, useEffect, useState, useCallback } from 'react'
import { Message } from 'ai'
import { ChatMessage } from './chat-message'
import { useVirtualizer } from '@tanstack/react-virtual'

interface VirtualMessageListProps {
  messages: Message[]
  isLoading: boolean
  onRegenerate: () => void
}

export function VirtualMessageList({ 
  messages, 
  isLoading, 
  onRegenerate
}: VirtualMessageListProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const heightCache = useRef(new Map<string, number>())

  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback((index) => {
      // Use cached height or estimate based on role
      const message = messages[index]
      const cached = heightCache.current.get(message.id)
      if (cached) return cached
      
      // Better estimates based on content
      return message.role === 'user' ? 80 : 120
    }, [messages]),
    overscan: 3,
    measureElement: (element) => {
      // Cache actual heights for smooth scrolling
      const htmlElement = element as HTMLElement
      if (htmlElement?.dataset.messageId) {
        const height = htmlElement.getBoundingClientRect().height
        heightCache.current.set(htmlElement.dataset.messageId, height)
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
  }, [messages, autoScroll])

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
      }, 150)
    }

    scrollElement.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimeout)
    }
  }, [])

  return (
    <div ref={parentRef} className="flex-1 overflow-y-auto scroll-smooth">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualItem) => {
          const message = messages[virtualItem.index]
          const isLastMessage = virtualItem.index === messages.length - 1

          return (
            <div
              key={virtualItem.key}
              data-message-id={message.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
                '--stagger': virtualItem.index,
              } as React.CSSProperties}
              className="message-container message-enter"
            >
              <ChatMessage
                message={message}
                isStreaming={isLoading && isLastMessage}
                onRegenerate={onRegenerate}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
} 