import { create } from 'zustand'
import { SmartCollection, NewSmartCollection } from '@/lib/db/schema'
import { toast } from 'sonner'
import { useUIStore } from './ui-store'

interface SmartCollectionState {
  smartCollections: SmartCollection[]
  loading: boolean
  error: string | null
}

interface SmartCollectionActions {
  // Fetching
  fetchSmartCollections: (spaceId: string) => Promise<void>
  setSmartCollections: (collections: SmartCollection[]) => void
  
  // Active collection (now uses UI store)
  setActiveSmartCollection: (collectionId: string) => void
  
  // CRUD operations
  createSmartCollection: (data: NewSmartCollection) => Promise<SmartCollection>
  updateSmartCollection: (id: string, data: Partial<SmartCollection>) => Promise<void>
  deleteSmartCollection: (id: string) => Promise<void>
  
  // Helper to get active smart collection
  getActiveSmartCollection: () => SmartCollection | null
}

type SmartCollectionStore = SmartCollectionState & SmartCollectionActions

export const useSmartCollectionStore = create<SmartCollectionStore>((set, get) => ({
  // Initial state
  smartCollections: [],
  loading: false,
  error: null,
  
  // Fetch smart collections for a space
  fetchSmartCollections: async (spaceId) => {
    set({ loading: true, error: null })
    
    try {
      const response = await fetch(`/api/smart-collections?spaceId=${spaceId}`)
      if (!response.ok) throw new Error('Failed to fetch smart collections')
      
      const collections: SmartCollection[] = await response.json()
      set({ smartCollections: collections, loading: false })
    } catch (error) {
      console.error('Failed to fetch smart collections:', error)
      set({ error: (error as Error).message, loading: false })
      toast.error('Failed to load smart collections')
    }
  },
  
  // Set smart collections (used when loading from space data)
  setSmartCollections: (collections) => {
    set({ smartCollections: collections })
  },
  
  // Set active smart collection using UI store's unified context
  setActiveSmartCollection: (collectionId) => {
    const collection = get().smartCollections.find(c => c.id === collectionId)
    if (collection) {
      // Use UI store's unified context
      useUIStore.getState().setActiveContext({
        type: 'smart-collection',
        id: collectionId,
        spaceId: collection.spaceId
        // Note: no collectionId for smart collections as they're filters
      })
    }
  },
  
  // Create smart collection
  createSmartCollection: async (data) => {
    // Generate temporary ID
    const tempId = `temp-${Date.now()}`
    
    // Create optimistic smart collection
    const optimisticCollection: SmartCollection = {
      id: tempId,
      userId: 'current-user', // Will be replaced with real user ID from response
      spaceId: data.spaceId,
      name: data.name,
      icon: data.icon || 'filter',
      filterConfig: data.filterConfig,
      isProtected: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    // Optimistically add to store
    set(state => ({
      smartCollections: [...state.smartCollections, optimisticCollection]
    }))
    
    try {
      const response = await fetch('/api/smart-collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) throw new Error('Failed to create smart collection')
      
      const newCollection: SmartCollection = await response.json()
      
      // Replace temporary collection with real one
      set(state => ({
        smartCollections: state.smartCollections.map(c =>
          c.id === tempId ? newCollection : c
        )
      }))
      
      toast.success(`Created smart collection "${newCollection.name}"`)
      return newCollection
    } catch (error) {
      // Rollback - remove the optimistic collection
      set(state => ({
        smartCollections: state.smartCollections.filter(c => c.id !== tempId)
      }))
      
      console.error('Failed to create smart collection:', error)
      toast.error('Failed to create smart collection')
      throw error
    }
  },
  
  // Update smart collection
  updateSmartCollection: async (id, data) => {
    const originalCollection = get().smartCollections.find(c => c.id === id)
    if (!originalCollection) return
    
    // Optimistic update
    set(state => ({
      smartCollections: state.smartCollections.map(c =>
        c.id === id ? { ...c, ...data } : c
      )
    }))
    
    try {
      const response = await fetch(`/api/smart-collections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) throw new Error('Failed to update smart collection')
      
      toast.success('Smart collection updated')
    } catch (error) {
      // Rollback
      set(state => ({
        smartCollections: state.smartCollections.map(c =>
          c.id === id ? originalCollection : c
        )
      }))
      console.error('Failed to update smart collection:', error)
      toast.error('Failed to update smart collection')
      throw error
    }
  },
  
  // Delete smart collection
  deleteSmartCollection: async (id) => {
    const originalCollections = get().smartCollections
    
    // Check if we're deleting the active smart collection
    const currentContext = useUIStore.getState().getActiveContext()
    const isDeletingActiveCollection = currentContext?.type === 'smart-collection' && currentContext?.id === id
    
    // Optimistic update
    set(state => ({
      smartCollections: state.smartCollections.filter(c => c.id !== id)
    }))
    
    // If we're deleting the active smart collection, switch to parent space
    if (isDeletingActiveCollection) {
      const deletedCollection = originalCollections.find(c => c.id === id)
      if (deletedCollection) {
        useUIStore.getState().setActiveContext({
          type: 'space',
          id: deletedCollection.spaceId,
          spaceId: deletedCollection.spaceId
        })
      } else {
        useUIStore.getState().clearActiveContext()
      }
    }
    
    try {
      const response = await fetch(`/api/smart-collections/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('Failed to delete smart collection')
      
      toast.success('Smart collection deleted')
    } catch (error) {
      // Rollback
      set({ smartCollections: originalCollections })
      console.error('Failed to delete smart collection:', error)
      toast.error('Failed to delete smart collection')
      throw error
    }
  },
  
  // Get active smart collection
  getActiveSmartCollection: () => {
    const context = useUIStore.getState().getActiveContext()
    if (context?.type !== 'smart-collection') return null
    
    return get().smartCollections.find(c => c.id === context.id) || null
  },
})) 