import { create } from 'zustand'
import { Space as DbSpace, Collection, SmartCollection } from '@/lib/db/schema'
import { toast } from 'sonner'
import { useCollectionStore } from './collection-store'
import { useUIStore } from './ui-store'

export type Space = DbSpace & { 
  collections: Collection[]
  smartCollections?: SmartCollection[]
}

interface SpaceState {
  spaces: Space[]
  loading: boolean
  error: string | null
}

interface SpaceActions {
  // Fetching
  fetchSpaces: () => Promise<void>
  
  // Active space (now uses UI store)
  setActiveSpace: (spaceId: string) => void
  
  // CRUD operations
  createSpace: (name: string, emoji: string) => Promise<void>
  updateSpace: (spaceId: string, data: Partial<DbSpace>) => Promise<void>
  deleteSpace: (spaceId: string) => Promise<void>
  
  // Helper to get collections for a space
  getSpaceCollections: (spaceId: string) => Collection[]
}

type SpaceStore = SpaceState & SpaceActions

export const useSpaceStore = create<SpaceStore>((set, get) => ({
  // Initial state
  spaces: [],
  loading: false,
  error: null,
  
  // Fetch spaces
  fetchSpaces: async () => {
    set({ loading: true, error: null })
    
    try {
      const response = await fetch('/api/spaces')
      if (!response.ok) throw new Error('Failed to fetch spaces')
      
      const spaces: Space[] = await response.json()
      
      // Extract all collections from spaces and update collection store
      const allCollections = spaces.flatMap(space => space.collections || [])
      useCollectionStore.getState().setCollections(allCollections)
      
      // Check if we need to set a default active context
      const currentContext = useUIStore.getState().getActiveContext()
      if (!currentContext && spaces.length > 0) {
        // Find inbox or first available space
        const inboxSpace = spaces.find(s => s.type === 'system' && s.name === 'Inbox')
        const defaultSpace = inboxSpace || spaces[0]
        
        if (defaultSpace) {
          useUIStore.getState().setActiveContext({
            type: 'space',
            id: defaultSpace.id,
            spaceId: defaultSpace.id
          })
        }
      }
      
      set({ spaces, loading: false })
    } catch (error) {
      console.error('Failed to fetch spaces:', error)
      set({ error: (error as Error).message, loading: false })
      toast.error('Failed to load spaces')
    }
  },
  
  // Set active space using UI store's unified context
  setActiveSpace: (spaceId) => {
    const space = get().spaces.find(s => s.id === spaceId)
    if (space) {
      // Use UI store's unified context
      useUIStore.getState().setActiveContext({
        type: 'space',
        id: spaceId,
        spaceId: spaceId
      })
      
      // Update collection store with this space's collections
      const spaceCollections = space.collections || []
      useCollectionStore.getState().setCollections(spaceCollections)
    }
  },
  
  // Create space
  createSpace: async (name, emoji) => {
    // Generate temporary ID
    const tempId = `temp-${Date.now()}`
    
    // Get current user ID (we'll need to handle this properly)
    const userId = 'current-user' // This will be replaced with real user ID from the response
    
    // Create optimistic space with default smart collections
    const optimisticSpace: Space = {
      id: tempId,
      userId,
      name,
      emoji,
      type: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
      collections: [],
      smartCollections: [] // Will be populated by the server
    }
    
    // Optimistically add to store
    set(state => ({
      spaces: [...state.spaces, optimisticSpace]
    }))
    
    try {
      const response = await fetch('/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, emoji }),
      })
      
      if (!response.ok) throw new Error('Failed to create space')
      
      const newSpace = await response.json()
      
      // Replace temporary space with real one
      set(state => ({ 
        spaces: state.spaces.map(s => 
          s.id === tempId ? newSpace : s
        )
      }))
      
      // Update collection store with new collections
      if (newSpace.collections) {
        const collectionStore = useCollectionStore.getState()
        const currentCollections = collectionStore.collections
        const newCollections = [...currentCollections, ...newSpace.collections]
        collectionStore.setCollections(newCollections)
      }
      
      toast.success(`Created space "${name}"`)
      return newSpace
    } catch (error) {
      // Rollback - remove the optimistic space
      set(state => ({
        spaces: state.spaces.filter(s => s.id !== tempId)
      }))
      
      console.error('Failed to create space:', error)
      toast.error('Failed to create space')
      throw error
    }
  },
  
  // Update space
  updateSpace: async (spaceId, data) => {
    const originalSpace = get().spaces.find(s => s.id === spaceId)
    if (!originalSpace) return
    
    // Optimistic update
    set(state => ({
      spaces: state.spaces.map(s => 
        s.id === spaceId ? { ...s, ...data } : s
      )
    }))
    
    try {
      const response = await fetch(`/api/spaces/${spaceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) throw new Error('Failed to update space')
      
      toast.success('Space updated')
    } catch (error) {
      // Rollback
      set(state => ({
        spaces: state.spaces.map(s => 
          s.id === spaceId ? originalSpace : s
        )
      }))
      console.error('Failed to update space:', error)
      toast.error('Failed to update space')
      throw error
    }
  },
  
  // Delete space
  deleteSpace: async (spaceId) => {
    const originalSpaces = get().spaces
    const remainingSpaces = originalSpaces.filter(s => s.id !== spaceId)
    
    // Check if we're deleting the active space
    const currentContext = useUIStore.getState().getActiveContext()
    const isDeletingActiveSpace = currentContext?.spaceId === spaceId
    
    // Optimistic update
    set(state => ({
      spaces: state.spaces.filter(s => s.id !== spaceId)
    }))
    
    // If we're deleting the active space, switch to Inbox or first available
    if (isDeletingActiveSpace) {
      const inboxSpace = remainingSpaces.find(s => s.type === 'system' && s.name === 'Inbox')
      const firstSpace = remainingSpaces[0]
      const newActiveSpace = inboxSpace || firstSpace
      
      if (newActiveSpace) {
        useUIStore.getState().setActiveContext({
          type: 'space',
          id: newActiveSpace.id,
          spaceId: newActiveSpace.id
        })
      } else {
        useUIStore.getState().clearActiveContext()
      }
    }
    
    try {
      const response = await fetch(`/api/spaces/${spaceId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('Failed to delete space')
      
      toast.success('Space deleted')
    } catch (error) {
      // Rollback
      set({ spaces: originalSpaces })
      console.error('Failed to delete space:', error)
      toast.error('Failed to delete space')
      throw error
    }
  },
  
  // Get collections for a space
  getSpaceCollections: (spaceId) => {
    const space = get().spaces.find(s => s.id === spaceId)
    return space?.collections || []
  },
})) 