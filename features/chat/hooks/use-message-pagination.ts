/**
 * Hook: useMessagePagination
 * Purpose: Handle paginated message loading with cursor-based pagination
 * Features:
 * - Load messages in chunks
 * - Maintain scroll position
 * - Merge new messages with existing
 * - Handle loading states
 * 
 * Created: 2024-12-30
 */

import { useState, useCallback, useRef } from 'react'
import { Message } from 'ai'
import { toast } from 'sonner'

interface PaginationState {
  messages: Message[]
  hasMore: boolean
  isLoadingMore: boolean
  nextCursor: string | null
}

interface UseMessagePaginationProps {
  chatId: string
  initialMessages?: Message[]
}

export function useMessagePagination({ 
  chatId, 
  initialMessages = [] 
}: UseMessagePaginationProps) {
  const [state, setState] = useState<PaginationState>({
    messages: initialMessages,
    hasMore: true,
    isLoadingMore: false,
    nextCursor: null,
  })
  
  // Track if we've done the initial load
  const hasInitialLoad = useRef(false)
  
  // Load more messages
  const loadMore = useCallback(async () => {
    if (state.isLoadingMore || !state.hasMore) return
    
    setState(prev => ({ ...prev, isLoadingMore: true }))
    
    try {
      const params = new URLSearchParams()
      if (state.nextCursor) {
        params.append('cursor', state.nextCursor)
      }
      params.append('limit', '50')
      
      const response = await fetch(`/api/chats/${chatId}/messages?${params}`)
      if (!response.ok) throw new Error('Failed to load messages')
      
      const data = await response.json()
      
      setState(prev => ({
        messages: [...data.messages, ...prev.messages],
        hasMore: data.hasMore,
        isLoadingMore: false,
        nextCursor: data.nextCursor,
      }))
      
      return data.messages.length
    } catch (error) {
      console.error('Failed to load messages:', error)
      toast.error('Failed to load earlier messages')
      setState(prev => ({ ...prev, isLoadingMore: false }))
      return 0
    }
  }, [chatId, state.isLoadingMore, state.hasMore, state.nextCursor])
  
  // Initial load
  const loadInitial = useCallback(async () => {
    if (hasInitialLoad.current) return
    hasInitialLoad.current = true
    
    setState(prev => ({ ...prev, isLoadingMore: true }))
    
    try {
      const response = await fetch(`/api/chats/${chatId}/messages?limit=50`)
      if (!response.ok) throw new Error('Failed to load messages')
      
      const data = await response.json()
      
      setState({
        messages: data.messages,
        hasMore: data.hasMore,
        isLoadingMore: false,
        nextCursor: data.nextCursor,
      })
    } catch (error) {
      console.error('Failed to load initial messages:', error)
      // Don't show error toast for initial load - the chat might be new
      setState(prev => ({ ...prev, isLoadingMore: false, hasMore: false }))
    }
  }, [chatId])
  
  // Add a new message (for real-time updates)
  const addMessage = useCallback((message: Message) => {
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
    }))
  }, [])
  
  // Update messages (for replacing temporary messages)
  const updateMessage = useCallback((tempId: string, newMessage: Message) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(m => 
        m.id === tempId ? newMessage : m
      ),
    }))
  }, [])
  
  // Clear all messages
  const clearMessages = useCallback(() => {
    setState({
      messages: [],
      hasMore: true,
      isLoadingMore: false,
      nextCursor: null,
    })
    hasInitialLoad.current = false
  }, [])
  
  return {
    messages: state.messages,
    hasMore: state.hasMore,
    isLoadingMore: state.isLoadingMore,
    loadMore,
    loadInitial,
    addMessage,
    updateMessage,
    clearMessages,
  }
} 