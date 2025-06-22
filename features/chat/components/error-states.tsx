/**
 * Component: ErrorStates
 * Purpose: Beautiful error states with animations
 * Features:
 * - Rate limit with countdown
 * - Connection errors
 * - Failed messages
 * - Retry actions
 * 
 * Created: December 2024
 */

'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Clock, RefreshCw, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import '../styles/animations.css'

interface RateLimitErrorProps {
  retryAfter: number // seconds
  onRetry?: () => void
  className?: string
}

export function RateLimitError({ retryAfter, onRetry, className }: RateLimitErrorProps) {
  const [timeLeft, setTimeLeft] = useState(retryAfter)

  useEffect(() => {
    if (timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  return (
    <div className={cn(
      "flex items-center gap-3 p-4 rounded-lg",
      "bg-yellow-500/10 border border-yellow-500/20",
      "animate-in fade-in-0 slide-in-from-bottom-2",
      className
    )}>
      <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
          Rate limit reached
        </p>
        <p className="text-sm text-yellow-700 dark:text-yellow-300">
          {timeLeft > 0 
            ? `Try again in ${formatTime(timeLeft)}`
            : 'You can try again now'
          }
        </p>
      </div>
      {timeLeft === 0 && onRetry && (
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          className="flex-shrink-0"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Retry
        </Button>
      )}
    </div>
  )
}

interface ConnectionErrorProps {
  onRetry?: () => void
  className?: string
}

export function ConnectionError({ onRetry, className }: ConnectionErrorProps) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-4 rounded-lg",
      "bg-destructive/10 border border-destructive/20",
      "animate-in fade-in-0 slide-in-from-bottom-2",
      className
    )}>
      <WifiOff className="h-5 w-5 text-destructive flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium">Connection error</p>
        <p className="text-sm text-muted-foreground">
          Check your internet connection and try again
        </p>
      </div>
      {onRetry && (
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Retry
        </Button>
      )}
    </div>
  )
}

interface FailedMessageProps {
  error?: string
  onRetry?: () => void
  onDelete?: () => void
  className?: string
}

export function FailedMessage({ error, onRetry, onDelete, className }: FailedMessageProps) {
  const [isShaking, setIsShaking] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsShaking(false), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-lg",
      "bg-destructive/5 border border-destructive/10",
      "animate-in fade-in-0",
      isShaking && "error-shake",
      className
    )}>
      <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium text-destructive">
          Failed to send message
        </p>
        {error && (
          <p className="text-xs text-muted-foreground">{error}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          {onRetry && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onRetry}
              className="h-7 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              className="h-7 text-xs text-destructive hover:text-destructive"
            >
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

interface ErrorBoundaryFallbackProps {
  error: Error
  resetErrorBoundary: () => void
}

export function ErrorBoundaryFallback({ error, resetErrorBoundary }: ErrorBoundaryFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="text-center space-y-4 max-w-md">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">
          {error.message || 'An unexpected error occurred'}
        </p>
        <Button onClick={resetErrorBoundary}>
          Try again
        </Button>
      </div>
    </div>
  )
} 