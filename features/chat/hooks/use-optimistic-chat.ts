/**
 * Hook: useOptimisticChat
 * Purpose: Zero-latency feel with instant feedback
 * Features:
 * - Optimistic message sending
 * - Smart caching
 * - Background persistence
 * - Instant retry on failure
 * 
 * Created: December 2024
 */

'use client'

import { useCallback, useRef } from 'react'
import { Message } from 'ai'
import { useChatStore } from '../stores/chat-store'

interface OptimisticMessage extends Message {
  metadata?: {
    status: 'pending' | 'sent' | 'failed'
  }
}

export function useOptimisticChat(chatId: string) {
  const { addOptimisticMessage, confirmMessage, markMessageFailed } = useChatStore()
  const pendingRef = useRef(new Map<string, AbortController>())

  const sendOptimisticMessage = useCallback(async (content: string) => {
    // Generate temporary ID
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Add to UI immediately with pending state
    const optimisticMessage: OptimisticMessage = {
      id: tempId,
      role: 'user',
      content,
      createdAt: new Date(),
      metadata: { status: 'pending' }
    }
    
    addOptimisticMessage(chatId, optimisticMessage)
    
    // Create abort controller for this request
    const abortController = new AbortController()
    pendingRef.current.set(tempId, abortController)
    
    try {
      // Send to server
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chatId, 
          message: content,
          tempId 
        }),
        signal: abortController.signal
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const realMessage = await response.json()
      
      // Replace temporary message with real one
      confirmMessage(chatId, tempId, realMessage)
      
      return realMessage
      
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        // Mark as failed for retry UI
        markMessageFailed(chatId, tempId)
        throw error
      }
    } finally {
      pendingRef.current.delete(tempId)
    }
  }, [chatId, addOptimisticMessage, confirmMessage, markMessageFailed])

  const cancelPending = useCallback((tempId: string) => {
    const controller = pendingRef.current.get(tempId)
    if (controller) {
      controller.abort()
      pendingRef.current.delete(tempId)
    }
  }, [])

  const retryFailedMessage = useCallback(async (tempId: string, content: string) => {
    // Remove the failed message
    cancelPending(tempId)
    
    // Send again
    return sendOptimisticMessage(content)
  }, [cancelPending, sendOptimisticMessage])

  // Cancel all pending messages on unmount
  const cancelAllPending = useCallback(() => {
    pendingRef.current.forEach((controller) => {
      controller.abort()
    })
    pendingRef.current.clear()
  }, [])

  return {
    sendOptimisticMessage,
    cancelPending,
    retryFailedMessage,
    cancelAllPending,
  }
} 