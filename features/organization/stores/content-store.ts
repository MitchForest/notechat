import { create } from 'zustand'
import { Note, Chat, SmartCollection } from '@/lib/db/schema'
import { toast } from 'sonner'
import { isNoteId, isChatId } from '@/lib/utils/id-generator'

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
    set({ notes })
  },
  setChats: (chats) => {
    set({ chats })
  },
  clearContent: () => set({ notes: [], chats: [], lastFetchedCollection: null, isCacheValid: false }),
  
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