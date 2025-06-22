/**
 * Hook: useChatPersistence
 * Purpose: Manage chat message persistence
 * Features:
 * - Save messages to database
 * - Load initial messages
 * - Update chat preview
 * 
 * Created: December 2024
 * Updated: 2024-12-30 - Updated to use messages table
 */

import { useCallback } from 'react'
import { Message } from 'ai'
import { useChatStore } from '../stores/chat-store'

export function useChatPersistence(chatId: string) {
  const { saveMessage: saveToStore, loadMessages: loadFromStore, updateChatPreview } = useChatStore()

  const persistMessage = useCallback(
    async (message: Message) => {
      // Save to local store for immediate access
      await saveToStore(chatId, message)
      
      // Save to database via API
      try {
        await fetch(`/api/chats/${chatId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message }),
        })
      } catch (error) {
        console.error('Failed to persist message to database:', error)
      }
      
      // Update chat preview with latest AI message
      if (message.role === 'assistant') {
        const preview = message.content.slice(0, 100) + 
          (message.content.length > 100 ? '...' : '')
        await updateChatPreview(chatId, preview)
      }
    },
    [chatId, saveToStore, updateChatPreview]
  )

  const loadChatMessages = useCallback(() => {
    // For now, return empty array as we're using pagination
    // The pagination hook will load messages from the API
    return []
  }, [])

  return {
    saveMessage: persistMessage,
    loadMessages: loadChatMessages,
  }
} 