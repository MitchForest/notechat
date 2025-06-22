import { create } from 'zustand'
import { Space as DbSpace } from '@/lib/db/schema'
import { toast } from 'sonner'

export type Space = DbSpace & { collections: any[] }

interface SpaceState {
  spaces: Space[]
  activeSpaceId: string | null
  loading: boolean
  error: string | null
}

interface SpaceActions {
  // Fetching
  fetchSpaces: () => Promise<void>
  
  // Active space
  setActiveSpace: (spaceId: string) => void
  
  // CRUD operations
  createSpace: (name: string, emoji: string) => Promise<void>
  updateSpace: (spaceId: string, data: Partial<DbSpace>) => Promise<void>
  deleteSpace: (spaceId: string) => Promise<void>
}

type SpaceStore = SpaceState & SpaceActions

export const useSpaceStore = create<SpaceStore>((set, get) => ({
  // Initial state
  spaces: [],
  activeSpaceId: null,
  loading: false,
  error: null,
  
  // Fetch spaces
  fetchSpaces: async () => {
    set({ loading: true, error: null })
    
    try {
      const response = await fetch('/api/spaces')
      if (!response.ok) throw new Error('Failed to fetch spaces')
      
      const spaces: Space[] = await response.json()
      
      // Set permanent-notes as the default active space if none is set
      const currentActiveId = get().activeSpaceId
      const activeSpaceId = currentActiveId || 'permanent-notes'
      
      set({ spaces, activeSpaceId, loading: false })
    } catch (error) {
      console.error('Failed to fetch spaces:', error)
      set({ error: (error as Error).message, loading: false })
      toast.error('Failed to load spaces')
    }
  },
  
  // Set active space
  setActiveSpace: (spaceId) => {
    const space = get().spaces.find(s => s.id === spaceId)
    if (space) {
      set({ activeSpaceId: spaceId })
    }
  },
  
  // Create space
  createSpace: async (name, emoji) => {
    try {
      const response = await fetch('/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, emoji }),
      })
      
      if (!response.ok) throw new Error('Failed to create space')
      
      const newSpace = await response.json()
      
      // Add the new space to the list
      set(state => ({ 
        spaces: [
          ...state.spaces.filter(s => s.type === 'static'),
          newSpace,
          ...state.spaces.filter(s => s.type !== 'static' && s.id !== newSpace.id)
        ]
      }))
      
      toast.success(`Created space "${name}"`)
    } catch (error) {
      console.error('Failed to create space:', error)
      set({ error: (error as Error).message })
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
    
    // Optimistic update
    set(state => ({
      spaces: state.spaces.filter(s => s.id !== spaceId),
      // If we're deleting the active space, switch to permanent-notes
      activeSpaceId: state.activeSpaceId === spaceId ? 'permanent-notes' : state.activeSpaceId
    }))
    
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
})) 