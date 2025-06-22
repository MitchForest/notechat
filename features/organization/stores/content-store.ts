import { create } from 'zustand'
import { Note, Chat, SmartCollection } from '@/lib/db/schema'
import { toast } from 'sonner'

interface FilterConfig {
  type?: 'all' | 'note' | 'chat'
  timeRange?: {
    unit: 'days' | 'weeks' | 'months'
    value: number
  }
  isStarred?: boolean
  orderBy?: 'updatedAt' | 'createdAt' | 'title'
  orderDirection?: 'asc' | 'desc'
}

interface ContentState {
  // Data
  notes: Note[]
  chats: Chat[]
  
  // Cache management
  lastFetchedCollection: string | null
  isCacheValid: boolean
}

interface ContentActions {
  // Setters
  setNotes: (notes: Note[]) => void
  setChats: (chats: Chat[]) => void
  clearContent: () => void
  
  // Fetch content based on smart collection filters
  fetchSmartCollectionContent: (smartCollection: SmartCollection) => Promise<void>
  
  // CRUD operations
  createNote: (title: string, spaceId: string | null, collectionId: string | null, id?: string) => Promise<Note | null>
  createChat: (title: string, spaceId: string | null, collectionId: string | null, id?: string) => Promise<Chat | null>
  updateNote: (noteId: string, data: Partial<Note>) => Promise<void>
  updateChat: (chatId: string, data: Partial<Chat>) => Promise<void>
  deleteNote: (noteId: string) => Promise<void>
  deleteChat: (chatId: string) => Promise<void>
  
  // Star operations
  toggleNoteStar: (noteId: string) => Promise<void>
  toggleChatStar: (chatId: string) => Promise<void>
  
  // Move operations
  moveItem: (itemId: string, itemType: 'note' | 'chat', targetCollectionId: string | null) => Promise<void>
  
  // Cache management
  invalidateCache: () => void
  setCacheValid: (collectionId: string) => void
}

type ContentStore = ContentState & ContentActions

export const useContentStore = create<ContentStore>((set, get) => ({
  // Initial state
  notes: [],
  chats: [],
  lastFetchedCollection: null,
  isCacheValid: false,
  
  // Setters
  setNotes: (notes) => {
    console.log('ContentStore: Setting notes:', notes.length)
    set({ notes })
  },
  setChats: (chats) => {
    console.log('ContentStore: Setting chats:', chats.length)
    set({ chats })
  },
  clearContent: () => set({ notes: [], chats: [], lastFetchedCollection: null, isCacheValid: false }),
  
  // Fetch content based on smart collection filters
  fetchSmartCollectionContent: async (smartCollection) => {
    const filterConfig = smartCollection.filterConfig as FilterConfig
    
    // Build query parameters from filter config
    const params = new URLSearchParams()
    
    // Type filter
    if (filterConfig.type) {
      params.append('type', filterConfig.type)
    }
    
    // Time range filter
    if (filterConfig.timeRange) {
      const date = new Date()
      const { unit, value } = filterConfig.timeRange
      
      switch (unit) {
        case 'days':
          date.setDate(date.getDate() - value)
          break
        case 'weeks':
          date.setDate(date.getDate() - (value * 7))
          break
        case 'months':
          date.setMonth(date.getMonth() - value)
          break
      }
      
      params.append('since', date.toISOString())
    }
    
    // Starred filter
    if (filterConfig.isStarred !== undefined) {
      params.append('starred', String(filterConfig.isStarred))
    }
    
    // Sorting
    if (filterConfig.orderBy) {
      params.append('orderBy', filterConfig.orderBy)
    }
    if (filterConfig.orderDirection) {
      params.append('order', filterConfig.orderDirection)
    }
    
    // Space filter
    if (smartCollection.spaceId) {
      params.append('spaceId', smartCollection.spaceId)
    }
    
    try {
      // Fetch based on type
      let notesData: Note[] = []
      let chatsData: Chat[] = []
      
      if (!filterConfig.type || filterConfig.type === 'all' || filterConfig.type === 'note') {
        const notesResponse = await fetch(`/api/notes?${params}`)
        if (!notesResponse.ok) throw new Error('Failed to fetch notes')
        notesData = await notesResponse.json()
      }
      
      if (!filterConfig.type || filterConfig.type === 'all' || filterConfig.type === 'chat') {
        const chatsResponse = await fetch(`/api/chats?${params}`)
        if (!chatsResponse.ok) throw new Error('Failed to fetch chats')
        chatsData = await chatsResponse.json()
        
        // Filter out soft-deleted chats
        chatsData = chatsData.filter((chat: Chat) => !chat.deletedAt)
      }
      
      // Combine and sort if needed
      if (filterConfig.type === 'all') {
        // Combine and sort by the specified field
        const combined = [...notesData, ...chatsData]
        const orderBy = filterConfig.orderBy || 'updatedAt'
        const orderDirection = filterConfig.orderDirection || 'desc'
        
        combined.sort((a, b) => {
          let aValue: any
          let bValue: any
          
          if (orderBy === 'title') {
            aValue = a.title
            bValue = b.title
          } else if (orderBy === 'createdAt') {
            aValue = new Date(a.createdAt).getTime()
            bValue = new Date(b.createdAt).getTime()
          } else {
            // updatedAt
            aValue = new Date(a.updatedAt).getTime()
            bValue = new Date(b.updatedAt).getTime()
          }
          
          if (orderDirection === 'asc') {
            return aValue > bValue ? 1 : -1
          } else {
            return aValue < bValue ? 1 : -1
          }
        })
        
        // Separate back into notes and chats
        set({
          notes: combined.filter(item => 'content' in item && !('messages' in item)) as Note[],
          chats: combined.filter(item => 'messages' in item || ('content' in item && item.id.startsWith('chat-'))) as Chat[],
          lastFetchedCollection: smartCollection.id,
          isCacheValid: true
        })
      } else {
        set({
          notes: notesData,
          chats: chatsData,
          lastFetchedCollection: smartCollection.id,
          isCacheValid: true
        })
      }
    } catch (error) {
      console.error('Failed to fetch smart collection content:', error)
      toast.error('Failed to load collection items')
      throw error
    }
  },
  
  // Create note
  createNote: async (title, spaceId, collectionId, id) => {
    try {
      const noteData: any = { title }
      if (spaceId) noteData.spaceId = spaceId
      if (collectionId) noteData.collectionId = collectionId
      if (id) noteData.id = id
      
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData),
      })
      
      if (!response.ok) throw new Error('Failed to create note')
      
      const newNote = await response.json()
      set(state => ({ notes: [newNote, ...state.notes] }))
      return newNote
    } catch (error) {
      console.error('Failed to create note:', error)
      toast.error('Failed to create note')
      return null
    }
  },
  
  // Create chat
  createChat: async (title, spaceId, collectionId, id) => {
    try {
      const chatData: any = { title, spaceId, collectionId }
      if (id) chatData.id = id
      
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatData),
      })
      
      if (!response.ok) throw new Error('Failed to create chat')
      
      const newChat = await response.json()
      
      // Only add to state if not soft-deleted
      if (!newChat.deletedAt) {
        set(state => ({ chats: [newChat, ...state.chats] }))
      }
      
      return newChat
    } catch (error) {
      console.error('Failed to create chat:', error)
      toast.error('Failed to create chat')
      return null
    }
  },
  
  // Update note
  updateNote: async (noteId, data) => {
    const originalNote = get().notes.find(n => n.id === noteId)
    if (!originalNote) return
    
    // Optimistic update
    set(state => ({
      notes: state.notes.map(n => n.id === noteId ? { ...n, ...data } : n)
    }))
    
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) throw new Error('Failed to update note')
    } catch (error) {
      // Rollback on failure
      set(state => ({
        notes: state.notes.map(n => n.id === noteId ? originalNote : n)
      }))
      console.error('Failed to update note:', error)
      toast.error('Failed to update note')
      throw error
    }
  },
  
  // Update chat
  updateChat: async (chatId, data) => {
    const originalChat = get().chats.find(c => c.id === chatId)
    if (!originalChat) return
    
    // Optimistic update
    set(state => ({
      chats: state.chats.map(c => c.id === chatId ? { ...c, ...data } : c)
    }))
    
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) throw new Error('Failed to update chat')
    } catch (error) {
      // Rollback on failure
      set(state => ({
        chats: state.chats.map(c => c.id === chatId ? originalChat : c)
      }))
      console.error('Failed to update chat:', error)
      toast.error('Failed to update chat')
      throw error
    }
  },
  
  // Delete note
  deleteNote: async (noteId) => {
    const originalNotes = get().notes
    
    // Optimistic update
    set(state => ({ notes: state.notes.filter(n => n.id !== noteId) }))
    
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('Failed to delete note')
      
      toast.success('Note deleted')
    } catch (error) {
      // Rollback on failure
      set({ notes: originalNotes })
      console.error('Failed to delete note:', error)
      toast.error('Failed to delete note')
      throw error
    }
  },
  
  // Delete chat
  deleteChat: async (chatId) => {
    const originalChats = get().chats
    
    // Optimistic update
    set(state => ({ chats: state.chats.filter(c => c.id !== chatId) }))
    
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('Failed to delete chat')
      
      toast.success('Chat deleted')
    } catch (error) {
      // Rollback on failure
      set({ chats: originalChats })
      console.error('Failed to delete chat:', error)
      toast.error('Failed to delete chat')
      throw error
    }
  },
  
  // Toggle note star
  toggleNoteStar: async (noteId) => {
    const note = get().notes.find(n => n.id === noteId)
    if (!note) return
    
    const newStarredState = !note.isStarred
    
    // Optimistic update
    set(state => ({
      notes: state.notes.map(n => 
        n.id === noteId ? { ...n, isStarred: newStarredState } : n
      )
    }))
    
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStarred: newStarredState }),
      })
      
      if (!response.ok) throw new Error('Failed to update star')
      
      toast.success(newStarredState ? 'Note starred' : 'Note unstarred')
    } catch (error) {
      // Rollback
      set(state => ({
        notes: state.notes.map(n => 
          n.id === noteId ? { ...n, isStarred: !newStarredState } : n
        )
      }))
      console.error('Failed to update star:', error)
      toast.error('Failed to update star')
      throw error
    }
  },
  
  // Toggle chat star
  toggleChatStar: async (chatId) => {
    const chat = get().chats.find(c => c.id === chatId)
    if (!chat) return
    
    const newStarredState = !chat.isStarred
    
    // Optimistic update
    set(state => ({
      chats: state.chats.map(c => 
        c.id === chatId ? { ...c, isStarred: newStarredState } : c
      )
    }))
    
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStarred: newStarredState }),
      })
      
      if (!response.ok) throw new Error('Failed to update star')
      
      toast.success(newStarredState ? 'Chat starred' : 'Chat unstarred')
    } catch (error) {
      // Rollback
      set(state => ({
        chats: state.chats.map(c => 
          c.id === chatId ? { ...c, isStarred: !newStarredState } : c
        )
      }))
      console.error('Failed to update star:', error)
      toast.error('Failed to update star')
      throw error
    }
  },
  
  // Move item
  moveItem: async (itemId, itemType, targetCollectionId) => {
    const isNote = itemType === 'note'
    const items = isNote ? get().notes : get().chats
    const item = items.find(i => i.id === itemId)
    
    if (!item) return
    
    // Store previous collection for rollback
    const previousCollectionId = item.collectionId
    
    // Optimistic update
    if (isNote) {
      set(state => ({
        notes: state.notes.map(n => 
          n.id === itemId ? { ...n, collectionId: targetCollectionId } : n
        )
      }))
    } else {
      set(state => ({
        chats: state.chats.map(c => 
          c.id === itemId ? { ...c, collectionId: targetCollectionId } : c
        )
      }))
    }
    
    try {
      const endpoint = isNote ? `/api/notes/${itemId}` : `/api/chats/${itemId}`
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionId: targetCollectionId }),
      })
      
      if (!response.ok) throw new Error('Failed to move item')
      
      toast.success('Item moved successfully')
    } catch (error) {
      // Rollback
      if (isNote) {
        set(state => ({
          notes: state.notes.map(n => 
            n.id === itemId ? { ...n, collectionId: previousCollectionId } : n
          )
        }))
      } else {
        set(state => ({
          chats: state.chats.map(c => 
            c.id === itemId ? { ...c, collectionId: previousCollectionId } : c
          )
        }))
      }
      console.error('Failed to move item:', error)
      toast.error('Failed to move item')
      throw error
    }
  },
  
  // Cache management
  invalidateCache: () => set({ isCacheValid: false, lastFetchedCollection: null }),
  setCacheValid: (collectionId) => set({ isCacheValid: true, lastFetchedCollection: collectionId }),
})) 