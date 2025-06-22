/**
 * Store: ChatStore
 * Purpose: Centralized chat state management
 * Features:
 * - Message storage and caching
 * - Chat preview updates
 * - Persistence to database
 * 
 * Created: December 2024
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Message } from 'ai'

interface ChatStore {
  // Message storage (in-memory cache)
  messages: Record<string, Message[]>
  
  // Actions
  saveMessage: (chatId: string, message: Message) => Promise<void>
  loadMessages: (chatId: string) => Message[]
  updateChatPreview: (chatId: string, preview: string) => Promise<void>
  clearMessages: (chatId: string) => void
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      messages: {},

      saveMessage: async (chatId, message) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: [...(state.messages[chatId] || []), message],
          },
        }))

        // Also persist to database
        try {
          await fetch(`/api/chats/${chatId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }),
          })
        } catch (error) {
          console.error('Failed to persist message:', error)
        }
      },

      loadMessages: (chatId) => {
        return get().messages[chatId] || []
      },

      updateChatPreview: async (chatId, preview) => {
        try {
          await fetch(`/api/chats/${chatId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: preview }),
          })
        } catch (error) {
          console.error('Failed to update chat preview:', error)
        }
      },

      clearMessages: (chatId) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: [],
          },
        }))
      },
    }),
    {
      name: 'chat-messages',
      partialize: (state) => ({
        messages: Object.fromEntries(
          Object.entries(state.messages).slice(-10) // Keep only last 10 chats in localStorage
        ),
      }),
    }
  )
) 