import { useChat as useAIChat, Message } from 'ai/react'
import { useState, useCallback, useRef, useEffect } from 'react'
import { withRetry, RetryError } from '../utils/retry-logic'
import { offlineQueue } from '../services/offline-queue'
import { useChatStore } from '../stores/chat-store'
import { toast } from 'sonner'

// Define ChatRequestOptions based on AI SDK documentation
interface ChatRequestOptions {
  headers?: Record<string, string> | Headers
  body?: object
  data?: any
}

interface UseChatWithRetryOptions {
  chatId: string
  onError?: (error: Error) => void
  onFinish?: (message: Message) => void
  onResponse?: (response: Response) => void
  maxRetries?: number
  initialMessages?: Message[]
  body?: any
}

interface RetryState {
  isRetrying: boolean
  attempt: number
  maxAttempts: number
  nextRetryIn: number
  lastError?: Error
}

export function useChatWithRetry({
  chatId,
  onError,
  onFinish,
  onResponse,
  maxRetries = 3,
  initialMessages = [],
  body = {}
}: UseChatWithRetryOptions) {
  const [retryState, setRetryState] = useState<RetryState>({
    isRetrying: false,
    attempt: 0,
    maxAttempts: maxRetries,
    nextRetryIn: 0
  })
  
  const [isOnline, setIsOnline] = useState(true)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { addOptimisticMessage, confirmMessage, markMessageFailed } = useChatStore()
  
  // Monitor connection status
  useEffect(() => {
    const unsubscribe = offlineQueue.onConnectionChange((online: boolean) => {
      setIsOnline(online)
    })
    return unsubscribe
  }, [])
  
  // Base useChat hook
  const {
    messages,
    append: originalAppend,
    reload: originalReload,
    stop,
    isLoading,
    input,
    setInput,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
    error: chatError,
    setMessages,
    data,
    setData,
  } = useAIChat({
    id: chatId,
    api: '/api/chat',
    initialMessages,
    headers: {
      'x-chat-id': chatId
    },
    onError: (error) => {
      console.error('Chat error:', error)
      console.error('Chat error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        cause: error.cause
      })
      
      // Check if it's a specific error type
      if (error.message.includes('An error occurred')) {
        console.error('Generic streaming error - check server logs for details')
      }
      
      setRetryState(prev => ({
        ...prev,
        lastError: error
      }))
      
      // Show user-friendly error message
      if (error.message.includes('rate limit')) {
        toast.error('Too many requests. Please wait a moment and try again.')
      } else if (error.message.includes('API key')) {
        toast.error('AI service is not configured properly. Please contact support.')
      } else {
        toast.error('Failed to send message. Please try again.')
      }
    },
    onFinish,
    onResponse: (response) => {
      console.log('[Chat Hook] Response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })
      onResponse?.(response)
    },
    body
  })
  
  // Clear retry timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [])
  
  // Enhanced append with retry logic
  const append = useCallback(async (
    message: Message | { role: 'user' | 'assistant'; content: string }
  ) => {
    // If offline, queue the message
    if (!isOnline) {
      const fullMessage: Message = {
        id: `temp-${Date.now()}`,
        createdAt: new Date(),
        ...message
      } as Message
      
      await offlineQueue.addToQueue(chatId, fullMessage)
      addOptimisticMessage(chatId, {
        ...fullMessage,
        metadata: { status: 'pending' }
      })
      
      toast.error('You\'re offline. Message queued for when you\'re back online.')
      return
    }
    
    // Create optimistic message
    const tempId = `temp-${Date.now()}`
    const optimisticMessage: Message = {
      id: tempId,
      createdAt: new Date(),
      ...message
    } as Message
    
    addOptimisticMessage(chatId, {
      ...optimisticMessage,
      metadata: { status: 'pending' }
    })
    
    try {
      // Use retry wrapper
      await withRetry(
        async () => {
          const result = await originalAppend(message)
          // Confirm the message was sent
          confirmMessage(chatId, tempId, optimisticMessage)
          return result
        },
        {
          maxRetries,
          onRetry: (error, attempt) => {
            setRetryState({
              isRetrying: true,
              attempt,
              maxAttempts: maxRetries,
              nextRetryIn: Math.pow(2, attempt - 1),
              lastError: error
            })
            
            // Countdown timer
            let timeLeft = Math.pow(2, attempt - 1)
            const countdownInterval = setInterval(() => {
              timeLeft--
              setRetryState(prev => ({ ...prev, nextRetryIn: timeLeft }))
              if (timeLeft <= 0) {
                clearInterval(countdownInterval)
              }
            }, 1000)
          }
        }
      )
      
      // Clear retry state on success
      setRetryState({
        isRetrying: false,
        attempt: 0,
        maxAttempts: maxRetries,
        nextRetryIn: 0
      })
    } catch (error) {
      markMessageFailed(chatId, tempId)
      
      if (error instanceof RetryError) {
        // All retries failed
        toast.error(`Failed to send message after ${error.attempts} attempts`)
        
        // Queue for later
        await offlineQueue.addToQueue(chatId, optimisticMessage)
      }
      
      onError?.(error as Error)
      throw error
    }
  }, [
    isOnline,
    chatId,
    originalAppend,
    addOptimisticMessage,
    confirmMessage,
    markMessageFailed,
    maxRetries,
    onError
  ])
  
  // Enhanced reload with retry
  const reload = useCallback(async (options?: ChatRequestOptions) => {
    try {
      await withRetry(
        () => originalReload(options),
        {
          maxRetries,
          onRetry: (error, attempt) => {
            toast.error(`Retrying... (${attempt}/${maxRetries})`)
          }
        }
      )
    } catch (error) {
      toast.error('Failed to reload chat')
      onError?.(error as Error)
      throw error
    }
  }, [originalReload, maxRetries, onError])
  
  // Manual retry function
  const retry = useCallback(async () => {
    if (messages.length === 0) return
    
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
    if (!lastUserMessage) return
    
    setRetryState(prev => ({ ...prev, isRetrying: true }))
    
    try {
      await append(lastUserMessage)
    } catch (error) {
      // Error already handled in append
    } finally {
      setRetryState(prev => ({ ...prev, isRetrying: false }))
    }
  }, [messages, append])
  
  // Process queued messages when back online
  useEffect(() => {
    if (isOnline) {
      offlineQueue.processQueue()
    }
  }, [isOnline])
  
  // Enhanced submit that checks connection first
  const handleSubmit = useCallback((e?: React.FormEvent<HTMLFormElement>) => {
    if (!isOnline) {
      e?.preventDefault()
      toast.error('You\'re offline. Please check your connection.')
      return
    }
    
    originalHandleSubmit(e)
  }, [isOnline, originalHandleSubmit])
  
  return {
    messages,
    append,
    reload,
    stop,
    isLoading: isLoading || retryState.isRetrying,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    error: chatError || retryState.lastError,
    setMessages,
    data,
    setData,
    
    // Additional retry-specific state
    retryState,
    retry,
    isOnline
  }
} 