/**
 * Component: ChatSkeleton
 * Purpose: Beautiful loading states
 * Features:
 * - Skeleton messages
 * - Shimmer animation
 * - Smooth transitions
 * 
 * Created: December 2024
 */

'use client'

import { cn } from '@/lib/utils'

interface ChatSkeletonProps {
  messageCount?: number
  className?: string
}

export function ChatSkeleton({ messageCount = 3, className }: ChatSkeletonProps) {
  return (
    <div className={cn("space-y-4 p-4", className)}>
      {[...Array(messageCount)].map((_, i) => (
        <MessageSkeleton key={i} isUser={i % 2 === 0} />
      ))}
    </div>
  )
}

interface MessageSkeletonProps {
  isUser?: boolean
}

function MessageSkeleton({ isUser = false }: MessageSkeletonProps) {
  return (
    <div className={cn(
      "flex gap-3",
      isUser && "flex-row-reverse"
    )}>
      {/* Avatar skeleton */}
      <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
      
      {/* Message content skeleton */}
      <div className={cn(
        "flex-1 space-y-2",
        isUser && "flex flex-col items-end"
      )}>
        <div className={cn(
          "space-y-2 p-4 rounded-lg",
          isUser ? "bg-primary/10" : "bg-muted"
        )}>
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-4 w-1/2 rounded" />
          <div className="skeleton h-4 w-5/6 rounded" />
        </div>
      </div>
    </div>
  )
}

export function ChatInputSkeleton() {
  return (
    <div className="border-t bg-background">
      <div className="max-w-3xl mx-auto p-4">
        <div className="skeleton h-[52px] w-full rounded-lg" />
        <div className="skeleton h-3 w-48 rounded mt-2" />
      </div>
    </div>
  )
}

export function ChatHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-3">
        <div className="skeleton h-6 w-32 rounded" />
      </div>
      <div className="flex items-center gap-2">
        <div className="skeleton h-8 w-8 rounded" />
        <div className="skeleton h-8 w-8 rounded" />
      </div>
    </div>
  )
}

export function TypingIndicator() {
  return (
    <div className="flex gap-3 px-4 py-2">
      <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0" />
      <div className="bg-muted rounded-lg px-4 py-3">
        <div className="typing-indicator">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  )
} 