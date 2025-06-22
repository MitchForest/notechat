import { create } from 'zustand'
import { Space as DbSpace, Collection, Note, Chat } from '@/lib/db/schema'
import { toast } from 'sonner'
import { PERMANENT_SPACES_DATA } from '@/features/organization/lib/permanent-space-config'

export type Space = DbSpace & { collections: Collection[] }

type OrganizationState = {
  spaces: Space[]
  collections: Collection[]
  notes: Note[]
  chats: Chat[]
  activeSpaceId: string | null
  activeCollectionId: string | null
  activeNoteId: string | null
  activeChatId: string | null
  loading: boolean
  error: string | null
  // Search state
  searchQuery: string
  searchResults: {
    notes: Note[]
    chats: Chat[]
  }
  isSearching: boolean
}

type OrganizationActions = {
  fetchInitialData: () => Promise<void>
  setActiveSpace: (spaceId: string) => void
  setActiveCollection: (collectionId: string, spaceId: string) => Promise<void>
  createSpace: (name: string, emoji: string) => Promise<void>
  createCollection: (name: string, spaceId: string) => Promise<void>
  createNote: (title: string, collectionId: string | null, id?: string) => Promise<Note | null>
  createChat: (title: string, collectionId: string | null, id?: string) => Promise<Chat | null>
  updateNote: (noteId: string, data: Partial<Note>) => Promise<void>
  updateChat: (chatId: string, data: Partial<Chat>) => Promise<void>
  deleteNote: (noteId: string) => Promise<void>
  deleteChat: (chatId: string) => Promise<void>
  // New actions
  setSearchQuery: (query: string) => void
  performSearch: (query: string) => Promise<void>
  clearSearch: () => void
  toggleNoteStar: (noteId: string) => Promise<void>
  toggleChatStar: (chatId: string) => Promise<void>
  moveItem: (itemId: string, itemType: 'note' | 'chat', targetCollectionId: string | null) => Promise<void>
}

type OrganizationStore = OrganizationState & OrganizationActions

// Debounce helper
let searchTimeout: NodeJS.Timeout | null = null

const useOrganizationStore = create<OrganizationStore>((set, get) => ({
  spaces: [],
  collections: [],
  notes: [],
  chats: [],
  activeSpaceId: null,
  activeCollectionId: null,
  activeNoteId: null,
  activeChatId: null,
  loading: false,
  error: null,
  searchQuery: '',
  searchResults: { notes: [], chats: [] },
  isSearching: false,

  fetchInitialData: async () => {
    set({ loading: true, error: null })
    try {
      const response = await fetch('/api/spaces')
      if (!response.ok) throw new Error('Failed to fetch spaces')
      const spaces: Space[] = await response.json()

      // Set permanent-notes as the default active space
      const activeSpaceId = 'permanent-notes'
      let collections: Collection[] = []
      const notesSpace = spaces.find((s: Space) => s.id === 'permanent-notes')
      if (notesSpace) {
        collections = notesSpace.collections || []
      }
      
      set({ spaces, collections, activeSpaceId, loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  setActiveSpace: (spaceId: string) => {
    const space = get().spaces.find(s => s.id === spaceId)
    if (space) {
      set({ 
        activeSpaceId: spaceId,
        collections: space.collections || [],
        notes: [],
        chats: [],
        activeCollectionId: null,
        activeNoteId: null,
        activeChatId: null
      })
    }
  },

  setActiveCollection: async (collectionId: string, spaceId: string) => {
    set({ loading: true, error: null, activeCollectionId: collectionId });

    let url = '';
    let isChatsApi = false;

    // Find the collection in either permanent data or user-created spaces
    let collectionToFetch: any = null;

    for (const space of PERMANENT_SPACES_DATA) {
      const foundCollection = space.collections.find(c => c.id === collectionId);
      if (foundCollection) {
        collectionToFetch = foundCollection;
        break;
      }
    }

    if (collectionToFetch && collectionToFetch.fetchConfig) {
      const { api, filter } = collectionToFetch.fetchConfig;
      url = `/api/${api}?filter=${filter}`;
      isChatsApi = api === 'chats';
    } else {
      const allUserCollections = get().spaces.flatMap(s => s.collections);
      const userOrDBCollection = allUserCollections.find(c => c.id === collectionId);
      if (userOrDBCollection) {
        // For now, all user collections are assumed to be notes
        url = `/api/notes?collectionId=${collectionId}`;
        isChatsApi = false;
      } else {
        console.warn(`Collection with id ${collectionId} not found.`);
        url = '/api/notes?filter=all'; // A safe fallback
        isChatsApi = false;
      }
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || `Failed to fetch items`);
      }
      const data = await response.json();

      if (isChatsApi) {
        set({ chats: data, notes: [], loading: false });
      } else {
        set({ notes: data, chats: [], loading: false });
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
      set({
        error: (error as Error).message,
        loading: false,
      });
      toast.error(`Failed to load items`);
    }
  },

  createSpace: async (name: string, emoji: string) => {
    try {
      const response = await fetch('/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, emoji }),
      })
      if (!response.ok) throw new Error('Failed to create space')
      const newSpace = await response.json()
      
      // Add the new space to the list (permanent spaces remain at the beginning)
      set(state => ({ 
        spaces: [...state.spaces.filter(s => s.type === 'static'), newSpace, ...state.spaces.filter(s => s.type !== 'static' && s.id !== newSpace.id)]
      }))
      
      toast.success(`Created space "${name}"`)
    } catch (error) {
      set({ error: (error as Error).message })
      toast.error('Failed to create space')
    }
  },

  createCollection: async (name: string, spaceId: string) => {
    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, spaceId }),
      })
      if (!response.ok) throw new Error('Failed to create collection')
      const newCollection = await response.json()
      
      set(state => {
        const spaces = state.spaces.map(s => {
          if (s.id === spaceId) {
            return { ...s, collections: [...s.collections, newCollection] }
          }
          return s
        })
        return { spaces }
      })
      
      toast.success(`Created collection "${name}"`)
    } catch (error) {
      set({ error: (error as Error).message })
      toast.error('Failed to create collection')
    }
  },

  createNote: async (title: string, collectionId: string | null, id?: string) => {
    try {
      const noteData: any = { title }
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
      set({ error: (error as Error).message })
      toast.error('Failed to create note')
      return null
    }
  },

  createChat: async (title: string, collectionId: string | null, id?: string) => {
    try {
      const chatData: any = { title, collectionId }
      if (id) chatData.id = id
      
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatData),
      })
      if (!response.ok) throw new Error('Failed to create chat')
      const newChat = await response.json()
      set(state => ({ chats: [newChat, ...state.chats] }))
      return newChat
    } catch (error) {
      set({ error: (error as Error).message })
      toast.error('Failed to create chat')
      return null
    }
  },

  updateNote: async (noteId: string, data: Partial<Note>) => {
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
      // Rollback optimistic update on failure
      console.error("Failed to update note, rolling back:", error)
      const { activeCollectionId, activeSpaceId } = get()
      if (activeCollectionId && activeSpaceId) {
        get().setActiveCollection(activeCollectionId, activeSpaceId)
      }
      toast.error('Failed to update note')
    }
  },

  updateChat: async (chatId: string, data: Partial<Chat>) => {
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
      // Rollback optimistic update on failure
      console.error("Failed to update chat, rolling back:", error)
      const { activeCollectionId, activeSpaceId } = get()
      if (activeCollectionId && activeSpaceId) {
        get().setActiveCollection(activeCollectionId, activeSpaceId)
      }
      toast.error('Failed to update chat')
    }
  },

  deleteNote: async (noteId: string) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete note')
      set(state => ({ notes: state.notes.filter(n => n.id !== noteId) }))
      toast.success('Note deleted')
    } catch (error) {
      set({ error: (error as Error).message })
      toast.error('Failed to delete note')
    }
  },

  deleteChat: async (chatId: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete chat')
      set(state => ({ chats: state.chats.filter(c => c.id !== chatId) }))
      toast.success('Chat deleted')
    } catch (error) {
      set({ error: (error as Error).message })
      toast.error('Failed to delete chat')
    }
  },

  // Search functionality
  setSearchQuery: (query: string) => {
    set({ searchQuery: query })
    
    // Clear existing timeout
    if (searchTimeout) clearTimeout(searchTimeout)
    
    // Debounce search by 300ms
    if (query.trim()) {
      searchTimeout = setTimeout(() => {
        get().performSearch(query)
      }, 300)
    } else {
      set({ searchResults: { notes: [], chats: [] } })
    }
  },

  performSearch: async (query: string) => {
    if (!query.trim()) return
    
    set({ isSearching: true })
    
    try {
      // Search both notes and chats in parallel
      const [notesResponse, chatsResponse] = await Promise.all([
        fetch(`/api/notes?search=${encodeURIComponent(query)}`),
        fetch(`/api/chats?search=${encodeURIComponent(query)}`)
      ])
      
      if (!notesResponse.ok || !chatsResponse.ok) {
        throw new Error('Search failed')
      }
      
      const [notes, chats] = await Promise.all([
        notesResponse.json(),
        chatsResponse.json()
      ])
      
      set({ searchResults: { notes, chats }, isSearching: false })
    } catch (error) {
      console.error('Search failed:', error)
      set({ isSearching: false })
      toast.error('Search failed')
    }
  },

  clearSearch: () => {
    if (searchTimeout) clearTimeout(searchTimeout)
    set({ searchQuery: '', searchResults: { notes: [], chats: [] }, isSearching: false })
  },

  // Starring functionality
  toggleNoteStar: async (noteId: string) => {
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
      toast.error('Failed to update star')
    }
  },

  toggleChatStar: async (chatId: string) => {
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
      toast.error('Failed to update star')
    }
  },

  // Move item functionality
  moveItem: async (itemId: string, itemType: 'note' | 'chat', targetCollectionId: string | null) => {
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
      
      // Find target collection name for toast
      let collectionName = 'Uncategorized'
      if (targetCollectionId) {
        const allCollections = get().spaces.flatMap(s => s.collections)
        const targetCollection = allCollections.find(c => c.id === targetCollectionId)
        collectionName = targetCollection?.name || 'collection'
      }
      
      toast.success(`Moved to ${collectionName}`)
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
      toast.error('Failed to move item')
    }
  }
}))

export default useOrganizationStore 