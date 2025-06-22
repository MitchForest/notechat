/**
 * Service: MessageCache
 * Purpose: Instant chat switching with smart caching
 * Features:
 * - LRU cache for messages
 * - Background sync
 * - Offline support
 * - Predictive loading
 * 
 * Created: December 2024
 */

import { Message } from 'ai'

interface CachedChat {
  messages: Message[]
  timestamp: number
  isDirty?: boolean
}

class MessageCache {
  private cache = new Map<string, CachedChat>()
  private maxSize = 50 // Cache up to 50 chats
  private syncQueue = new Set<string>()
  private dbName = 'notechat-cache'
  private storeName = 'messages'
  private db: IDBDatabase | null = null

  constructor() {
    this.initDB()
  }

  private async initDB() {
    if (typeof window === 'undefined') return

    const request = indexedDB.open(this.dbName, 1)
    
    request.onerror = () => {
      console.error('Failed to open IndexedDB')
    }
    
    request.onsuccess = () => {
      this.db = request.result
    }
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(this.storeName)) {
        db.createObjectStore(this.storeName, { keyPath: 'chatId' })
      }
    }
  }

  async getChatMessages(chatId: string): Promise<Message[]> {
    // Check memory cache first
    const cached = this.cache.get(chatId)
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      // Cache hit - return immediately
      return cached.messages
    }

    // Check IndexedDB for offline support
    const stored = await this.getFromIndexedDB(chatId)
    if (stored) {
      // Update memory cache
      this.cache.set(chatId, stored)
      
      // Schedule background sync if needed
      if (stored.isDirty || Date.now() - stored.timestamp > 60 * 1000) {
        this.scheduleBgSync(chatId)
      }
      
      return stored.messages
    }

    // Fetch from server
    return this.fetchFromServer(chatId)
  }

  async preloadChat(chatId: string) {
    if (!this.cache.has(chatId)) {
      // Load in background without blocking
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          this.getChatMessages(chatId)
        })
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
          this.getChatMessages(chatId)
        }, 100)
      }
    }
  }

  async saveMessages(chatId: string, messages: Message[]) {
    const cached: CachedChat = {
      messages,
      timestamp: Date.now(),
      isDirty: true
    }
    
    // Update memory cache
    this.cache.set(chatId, cached)
    
    // Enforce LRU eviction
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }
    
    // Save to IndexedDB
    await this.saveToIndexedDB(chatId, cached)
    
    // Schedule sync
    this.scheduleBgSync(chatId)
  }

  private scheduleBgSync(chatId: string) {
    this.syncQueue.add(chatId)
    
    // Sync when idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.performBackgroundSync()
      })
    } else {
      setTimeout(() => {
        this.performBackgroundSync()
      }, 5000)
    }
  }

  private async performBackgroundSync() {
    for (const chatId of this.syncQueue) {
      try {
        const cached = this.cache.get(chatId)
        if (cached?.isDirty) {
          // Sync to server
          await this.syncToServer(chatId, cached.messages)
          
          // Mark as clean
          cached.isDirty = false
          this.cache.set(chatId, cached)
          await this.saveToIndexedDB(chatId, cached)
        }
        
        this.syncQueue.delete(chatId)
      } catch (error) {
        // Keep in queue for retry
        console.error(`Failed to sync chat ${chatId}:`, error)
      }
    }
  }

  private async fetchFromServer(chatId: string): Promise<Message[]> {
    try {
      const response = await fetch(`/api/chats/${chatId}/messages`)
      if (!response.ok) throw new Error('Failed to fetch messages')
      
      const messages = await response.json()
      
      // Cache the result
      const cached: CachedChat = {
        messages,
        timestamp: Date.now(),
        isDirty: false
      }
      
      this.cache.set(chatId, cached)
      await this.saveToIndexedDB(chatId, cached)
      
      return messages
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      return []
    }
  }

  private async syncToServer(chatId: string, messages: Message[]) {
    const response = await fetch(`/api/chats/${chatId}/messages`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages })
    })
    
    if (!response.ok) {
      throw new Error('Failed to sync messages')
    }
  }

  private async getFromIndexedDB(chatId: string): Promise<CachedChat | null> {
    if (!this.db) return null
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(chatId)
      
      request.onsuccess = () => {
        resolve(request.result || null)
      }
      
      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  private async saveToIndexedDB(chatId: string, cached: CachedChat): Promise<void> {
    if (!this.db) return
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.put({ chatId, ...cached })
      
      request.onsuccess = () => {
        resolve()
      }
      
      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  // Clear all caches
  async clearAll() {
    this.cache.clear()
    this.syncQueue.clear()
    
    if (this.db) {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      store.clear()
    }
  }

  // Get cache statistics
  getStats() {
    return {
      memoryCacheSize: this.cache.size,
      syncQueueSize: this.syncQueue.size,
      cacheHitRate: 0, // TODO: Implement hit rate tracking
    }
  }
}

// Singleton instance
export const messageCache = new MessageCache() 