/**
 * Store: ChatStore
 * Purpose: Centralized chat state management
 * Features:
 * - Message storage and caching
 * - Chat preview updates
 * - Persistence to database
 * - Optimistic updates
 * 
 * Created: December 2024
 * Updated: December 2024 - Added optimistic updates
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Message } from 'ai'

interface OptimisticMessage extends Message {
  metadata?: {
    status?: 'pending' | 'sent' | 'failed'
  }
}

interface ChatStore {
  // Message storage (in-memory cache)
  messages: Record<string, Message[]>
  
  // Actions
  saveMessage: (chatId: string, message: Message) => Promise<void>
  loadMessages: (chatId: string) => Message[]
  updateChatPreview: (chatId: string, preview: string) => Promise<void>
  clearMessages: (chatId: string) => void
  
  // Optimistic updates
  addOptimisticMessage: (chatId: string, message: OptimisticMessage) => void
  confirmMessage: (chatId: string, tempId: string, realMessage: Message) => void
  markMessageFailed: (chatId: string, tempId: string) => void
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
      
      // Add optimistic message immediately
      addOptimisticMessage: (chatId, message) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: [...(state.messages[chatId] || []), message],
          },
        }))
      },
      
      // Replace temporary message with real one
      confirmMessage: (chatId, tempId, realMessage) => {
        set((state) => {
          const messages = state.messages[chatId] || []
          const index = messages.findIndex(m => m.id === tempId)
          
          if (index !== -1) {
            const updatedMessages = [...messages]
            updatedMessages[index] = realMessage
            
            return {
              messages: {
                ...state.messages,
                [chatId]: updatedMessages,
              },
            }
          }
          
          return state
        })
      },
      
      // Mark message as failed
      markMessageFailed: (chatId, tempId) => {
        set((state) => {
          const messages = state.messages[chatId] || []
          const index = messages.findIndex(m => m.id === tempId)
          
          if (index !== -1) {
            const updatedMessages = [...messages]
            const failedMessage = updatedMessages[index] as OptimisticMessage
            failedMessage.metadata = { ...failedMessage.metadata, status: 'failed' }
            
            return {
              messages: {
                ...state.messages,
                [chatId]: updatedMessages,
              },
            }
          }
          
          return state
        })
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