/**
 * Hook: useChatPersistence
 * Purpose: Manage chat message persistence
 * Features:
 * - Save messages to database
 * - Load initial messages
 * - Update chat preview
 * 
 * Created: December 2024
 */

import { useCallback } from 'react'
import { Message } from 'ai'
import { useChatStore } from '../stores/chat-store'

export function useChatPersistence(chatId: string) {
  const { saveMessage, loadMessages, updateChatPreview } = useChatStore()

  const persistMessage = useCallback(
    async (message: Message) => {
      await saveMessage(chatId, message)
      
      // Update chat preview with latest AI message
      if (message.role === 'assistant') {
        const preview = message.content.slice(0, 100) + 
          (message.content.length > 100 ? '...' : '')
        await updateChatPreview(chatId, preview)
      }
    },
    [chatId, saveMessage, updateChatPreview]
  )

  const loadChatMessages = useCallback(() => {
    return loadMessages(chatId)
  }, [chatId, loadMessages])

  return {
    saveMessage: persistMessage,
    loadMessages: loadChatMessages,
  }
} 