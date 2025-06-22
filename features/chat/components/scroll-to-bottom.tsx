/**
 * Component: ScrollToBottom
 * Purpose: Floating button to scroll to bottom of chat
 * Features:
 * - Appears when scrolled up
 * - Smooth scroll animation
 * - Shows unread count
 * 
 * Created: December 2024
 */

'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScrollToBottomProps {
  scrollRef: React.RefObject<HTMLDivElement>
  threshold?: number
  className?: string
  unreadCount?: number
}

export function ScrollToBottom({ 
  scrollRef, 
  threshold = 100,
  className,
  unreadCount = 0
}: ScrollToBottomProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const scrollElement = scrollRef.current
    if (!scrollElement) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement
      const isNearBottom = scrollHeight - scrollTop - clientHeight < threshold
      setIsVisible(!isNearBottom)
    }

    scrollElement.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Check initial state

    return () => {
      scrollElement.removeEventListener('scroll', handleScroll)
    }
  }, [scrollRef, threshold])

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div
      className={cn(
        "absolute bottom-4 right-4 transition-all duration-300",
        isVisible 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-2 pointer-events-none",
        className
      )}
    >
      <Button
        onClick={scrollToBottom}
        size="sm"
        className={cn(
          "rounded-full shadow-lg",
          "hover:scale-110 active:scale-95",
          "transition-transform duration-200"
        )}
      >
        <ArrowDown className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="ml-1.5 text-xs font-semibold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>
    </div>
  )
} 