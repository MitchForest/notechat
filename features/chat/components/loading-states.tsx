/**
 * Component: LoadingStates
 * Purpose: Reusable loading indicators for chat interface
 * Features:
 * - Message streaming indicator
 * - Tool execution loading
 * - Initial chat loading skeleton
 * - Smooth animations
 * 
 * Created: December 2024
 */

'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StreamingIndicatorProps {
  className?: string
}

export function StreamingIndicator({ className }: StreamingIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex gap-1">
        <span className="animate-bounce text-primary" style={{ animationDelay: '0ms' }}>●</span>
        <span className="animate-bounce text-primary" style={{ animationDelay: '150ms' }}>●</span>
        <span className="animate-bounce text-primary" style={{ animationDelay: '300ms' }}>●</span>
      </div>
      <span className="text-sm text-muted-foreground">AI is thinking</span>
    </div>
  )
}

interface ToolLoadingProps {
  toolName: string
  className?: string
}

export function ToolLoading({ toolName, className }: ToolLoadingProps) {
  const getLoadingText = () => {
    switch (toolName) {
      case 'create_note':
        return 'Creating note...'
      case 'update_note':
        return 'Updating note...'
      case 'edit_selection':
        return 'Editing text...'
      case 'search_notes':
        return 'Searching notes...'
      default:
        return 'Processing...'
    }
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Loader2 className="w-4 h-4 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">{getLoadingText()}</span>
    </div>
  )
}

interface MessageSkeletonProps {
  role?: 'user' | 'assistant'
  className?: string
}

export function MessageSkeleton({ role = 'assistant', className }: MessageSkeletonProps) {
  return (
    <div className={cn(
      "chat-message-wrapper animate-pulse",
      role === 'user' ? 'user' : 'assistant',
      className
    )}>
      {/* Avatar skeleton */}
      <div className="w-8 h-8 rounded-full bg-muted" />
      
      {/* Message skeleton */}
      <div className={cn(
        "chat-message-bubble",
        role === 'user' ? 'user' : 'assistant'
      )}>
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-4 bg-muted rounded w-5/6" />
        </div>
      </div>
    </div>
  )
}

interface ChatLoadingSkeletonProps {
  messageCount?: number
  className?: string
}

export function ChatLoadingSkeleton({ messageCount = 3, className }: ChatLoadingSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: messageCount }).map((_, i) => (
        <MessageSkeleton
          key={i}
          role={i % 2 === 0 ? 'user' : 'assistant'}
        />
      ))}
    </div>
  )
}

interface TypingIndicatorProps {
  userName?: string
  className?: string
}

export function TypingIndicator({ userName, className }: TypingIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
      <div className="flex gap-0.5">
        <span 
          className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
          style={{ animationDelay: '0ms', animationDuration: '1.4s' }}
        />
        <span 
          className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
          style={{ animationDelay: '200ms', animationDuration: '1.4s' }}
        />
        <span 
          className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
          style={{ animationDelay: '400ms', animationDuration: '1.4s' }}
        />
      </div>
      <span>{userName || 'AI'} is typing</span>
    </div>
  )
} 