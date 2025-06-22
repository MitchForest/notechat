import { Message } from 'ai'

interface QueuedMessage {
  id: string
  chatId: string
  message: Message
  timestamp: number
  attempts: number
  lastError?: string
}

class OfflineQueueService {
  private dbName = 'notechat-offline-queue'
  private storeName = 'messages'
  private db: IDBDatabase | null = null
  private isOnline = typeof window !== 'undefined' ? navigator.onLine : true
  private listeners: Set<(online: boolean) => void> = new Set()
  
  constructor() {
    // Only set up event listeners in browser environment
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline)
      window.addEventListener('offline', this.handleOffline)
    }
  }
  
  private handleOnline = () => {
    this.isOnline = true
    this.notifyListeners(true)
    // Automatically retry queued messages when coming back online
    this.processQueue()
  }
  
  private handleOffline = () => {
    this.isOnline = false
    this.notifyListeners(false)
  }
  
  private notifyListeners(online: boolean) {
    this.listeners.forEach(listener => listener(online))
  }
  
  onConnectionChange(listener: (online: boolean) => void) {
    this.listeners.add(listener)
    // Immediately call with current status
    listener(this.isOnline)
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }
  
  async init(): Promise<void> {
    // Skip initialization on server
    if (typeof window === 'undefined') {
      return Promise.resolve()
    }
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1)
      
      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'))
      }
      
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' })
          store.createIndex('chatId', 'chatId', { unique: false })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }
  
  async addToQueue(chatId: string, message: Message): Promise<void> {
    if (!this.db) await this.init()
    
    const queuedMessage: QueuedMessage = {
      id: `${chatId}-${Date.now()}-${Math.random()}`,
      chatId,
      message,
      timestamp: Date.now(),
      attempts: 0
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.add(queuedMessage)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to add message to queue'))
    })
  }
  
  async getQueuedMessages(chatId?: string): Promise<QueuedMessage[]> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      
      let request: IDBRequest
      if (chatId) {
        const index = store.index('chatId')
        request = index.getAll(chatId)
      } else {
        request = store.getAll()
      }
      
      request.onsuccess = () => {
        const messages = request.result as QueuedMessage[]
        // Sort by timestamp
        messages.sort((a, b) => a.timestamp - b.timestamp)
        resolve(messages)
      }
      
      request.onerror = () => reject(new Error('Failed to get queued messages'))
    })
  }
  
  async updateQueuedMessage(id: string, updates: Partial<QueuedMessage>): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      
      // First get the existing message
      const getRequest = store.get(id)
      
      getRequest.onsuccess = () => {
        const existing = getRequest.result as QueuedMessage
        if (!existing) {
          reject(new Error('Message not found in queue'))
          return
        }
        
        // Update the message
        const updated = { ...existing, ...updates }
        const putRequest = store.put(updated)
        
        putRequest.onsuccess = () => resolve()
        putRequest.onerror = () => reject(new Error('Failed to update queued message'))
      }
      
      getRequest.onerror = () => reject(new Error('Failed to get queued message'))
    })
  }
  
  async removeFromQueue(id: string): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(id)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to remove message from queue'))
    })
  }
  
  async clearQueue(chatId?: string): Promise<void> {
    if (!this.db) await this.init()
    
    if (!chatId) {
      // Clear all messages
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readwrite')
        const store = transaction.objectStore(this.storeName)
        const request = store.clear()
        
        request.onsuccess = () => resolve()
        request.onerror = () => reject(new Error('Failed to clear queue'))
      })
    }
    
    // Clear messages for specific chat
    const messages = await this.getQueuedMessages(chatId)
    await Promise.all(messages.map(msg => this.removeFromQueue(msg.id)))
  }
  
  async processQueue(): Promise<void> {
    if (!this.isOnline) return
    
    const messages = await this.getQueuedMessages()
    
    // Process messages in order, grouped by chat
    const messagesByChat = messages.reduce((acc, msg) => {
      if (!acc[msg.chatId]) acc[msg.chatId] = []
      acc[msg.chatId].push(msg)
      return acc
    }, {} as Record<string, QueuedMessage[]>)
    
    // Process each chat's messages sequentially
    for (const [chatId, chatMessages] of Object.entries(messagesByChat)) {
      for (const queuedMessage of chatMessages) {
        // This will be implemented when we integrate with the chat system
        // For now, just mark that we need to process these
        console.log('Need to process queued message:', queuedMessage)
      }
    }
  }
  
  getConnectionStatus(): boolean {
    return this.isOnline
  }
  
  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline)
      window.removeEventListener('offline', this.handleOffline)
    }
    this.listeners.clear()
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}

// Export singleton instance
export const offlineQueue = new OfflineQueueService() 