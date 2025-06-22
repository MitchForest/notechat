import { create } from 'zustand'
import { Space as DbSpace, Collection, Note } from '@/lib/db/schema'

export type Space = DbSpace & { collections: Collection[] }

// Duplicating this from sidebar-nav to avoid circular dependency.
// TODO: Move to a shared location.
const PERMANENT_SPACES_DATA = [
    { 
      id: 'all_notes', 
      name: 'All Notes', 
      emoji: '📝', 
      collections: [
        { id: 'all_notes_all', name: 'All' },
        { id: 'all_notes_recent', name: 'Recent' },
        { id: 'all_notes_saved', name: 'Saved' },
      ]
    },
    { 
      id: 'chats', 
      name: 'Chats', 
      emoji: '💬', 
      collections: [
        { id: 'chats_all', name: 'All' },
        { id: 'chats_recent', name: 'Recent' },
        { id: 'chats_saved', name: 'Saved' },
      ]
    },
]

type OrganizationState = {
  spaces: Space[]
  collections: Collection[]
  notes: Note[]
  activeSpaceId: string | null
  activeCollectionId: string | null
  activeNoteId: string | null
  loading: boolean
  error: string | null
}

type OrganizationActions = {
  fetchInitialData: () => Promise<void>
  setActiveSpace: (spaceId: string) => void
  setActiveCollection: (collectionId: string, spaceId: string) => Promise<void>
  createSpace: (name: string, emoji: string) => Promise<void>
  createCollection: (name: string, spaceId: string) => Promise<void>
  createNote: (title: string, spaceId: string, collectionId: string) => Promise<void>
  updateNote: (noteId: string, data: Partial<Note>) => Promise<void>
}

type OrganizationStore = OrganizationState & OrganizationActions

const useOrganizationStore = create<OrganizationStore>((set, get) => ({
  spaces: [],
  collections: [],
  notes: [],
  activeSpaceId: null,
  activeCollectionId: null,
  activeNoteId: null,
  loading: false,
  error: null,

  fetchInitialData: async () => {
    set({ loading: true, error: null })
    try {
      const response = await fetch('/api/spaces')
      if (!response.ok) throw new Error('Failed to fetch spaces')
      const spaces: Space[] = await response.json()

      // The first space will be active by default
      const activeSpaceId = spaces[0]?.id || null
      let collections: Collection[] = []
      if (activeSpaceId) {
        // Collections are eager-loaded with spaces
        collections = spaces.find((s: Space) => s.id === activeSpaceId)?.collections || []
      }
      
      set({ spaces, collections, activeSpaceId, loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  setActiveSpace: (spaceId: string) => {
    const permanentSpace = PERMANENT_SPACES_DATA.find(s => s.id === spaceId);
    if (permanentSpace) {
        set({
            activeSpaceId: spaceId,
            collections: permanentSpace.collections as Collection[],
            notes: [],
            activeCollectionId: null,
        });
    } else {
        const space = get().spaces.find(s => s.id === spaceId);
        set({ 
            activeSpaceId: spaceId,
            collections: space?.collections || [],
            notes: [], // Reset notes when space changes
            activeCollectionId: null
        });
    }
  },

  setActiveCollection: async (collectionId: string, spaceId: string) => {
    set({ loading: true, error: null, activeCollectionId: collectionId })
    
    let url = '/api/notes'
    // Handle permanent spaces
    if (spaceId === 'all_notes') {
        if (collectionId === 'all_notes_saved') {
            url = '/api/notes?filter=all_starred'
        } else if (collectionId === 'all_notes_recent') {
            url = '/api/notes?filter=all_recent'
        } else { // 'all_notes_all'
            url = '/api/notes?filter=all'
        }
    } else if (spaceId === 'chats') {
        // Placeholder for chat fetching logic
        set({ notes: [], loading: false }); 
        return;
    }
    // Handle user-created spaces
    else {
        url = `/api/notes?spaceId=${spaceId}&collectionId=${collectionId}`
    }

    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch notes')
      const notes = await response.json()
      set({ notes, loading: false })
    } catch (error) {
        set({ error: (error as Error).message, loading: false })
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
        set(state => ({ spaces: [...state.spaces, newSpace] }))
    } catch (error) {
        set({ error: (error as Error).message })
    }
  },

  createCollection: async (name: string, spaceId: string) => {
    try {
        const response = await fetch('/api/collections', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, spaceId, type: 'manual' }),
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
    } catch (error) {
        set({ error: (error as Error).message })
    }
  },

  createNote: async (title: string, spaceId: string, collectionId: string) => {
    try {
        const response = await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, spaceId, collectionId }),
        })
        if (!response.ok) throw new Error('Failed to create note')
        const newNote = await response.json()
        set(state => ({ notes: [newNote, ...state.notes] }))
    } catch (error) {
        set({ error: (error as Error).message })
    }
  },

  updateNote: async (noteId: string, data: Partial<Note>) => {
    set(state => ({
        notes: state.notes.map(n => n.id === noteId ? { ...n, ...data } : n)
    }))
    try {
        await fetch(`/api/notes/${noteId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })
    } catch (error) {
        // Rollback optimistic update on failure
        console.error("Failed to update note, rolling back:", error)
        get().setActiveCollection(get().activeCollectionId!, get().activeSpaceId!);
    }
  }

}))

export default useOrganizationStore; 