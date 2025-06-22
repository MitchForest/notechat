import { create } from 'zustand'
import { Collection as DbCollection } from '@/lib/db/schema'
import { toast } from 'sonner'
import { useContentStore } from './content-store'

export type Collection = DbCollection

interface CollectionState {
  collections: Collection[]
  activeCollectionId: string | null
  loading: boolean
}

interface CollectionActions {
  // Active collection
  setActiveCollection: (collectionId: string) => void
  
  // Collection management
  setCollections: (collections: Collection[]) => void
  
  // CRUD operations
  createCollection: (name: string, spaceId: string) => Promise<void>
  updateCollection: (collectionId: string, data: Partial<Collection>) => Promise<void>
  deleteCollection: (collectionId: string) => Promise<void>
}

type CollectionStore = CollectionState & CollectionActions

export const useCollectionStore = create<CollectionStore>((set, get) => ({
  // Initial state
  collections: [],
  activeCollectionId: null,
  loading: false,
  
  // Set active collection
  setActiveCollection: (collectionId) => {
    const collection = get().collections.find(c => c.id === collectionId)
    if (!collection) return
    
    set({ activeCollectionId: collectionId })
    
    // Invalidate cache when switching collections
    useContentStore.getState().invalidateCache()
  },
  
  // Set collections
  setCollections: (collections) => {
    set({ collections })
  },
  
  // Create collection
  createCollection: async (name, spaceId) => {
    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, spaceId }),
      })
      
      if (!response.ok) throw new Error('Failed to create collection')
      
      const newCollection = await response.json()
      
      // Add to local state
      set(state => ({
        collections: [...state.collections, newCollection]
      }))
      
      toast.success(`Created collection "${name}"`)
      
      return newCollection
    } catch (error) {
      console.error('Failed to create collection:', error)
      toast.error('Failed to create collection')
      throw error
    }
  },
  
  // Update collection
  updateCollection: async (collectionId, data) => {
    const originalCollection = get().collections.find(c => c.id === collectionId)
    if (!originalCollection) return
    
    // Optimistic update
    set(state => ({
      collections: state.collections.map(c => 
        c.id === collectionId ? { ...c, ...data } : c
      )
    }))
    
    try {
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) throw new Error('Failed to update collection')
      
      toast.success('Collection updated')
    } catch (error) {
      // Rollback
      set(state => ({
        collections: state.collections.map(c => 
          c.id === collectionId ? originalCollection : c
        )
      }))
      console.error('Failed to update collection:', error)
      toast.error('Failed to update collection')
      throw error
    }
  },
  
  // Delete collection
  deleteCollection: async (collectionId) => {
    const originalCollections = get().collections
    
    // Optimistic update
    set(state => ({
      collections: state.collections.filter(c => c.id !== collectionId),
      // Clear active collection if it's being deleted
      activeCollectionId: state.activeCollectionId === collectionId ? null : state.activeCollectionId
    }))
    
    try {
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('Failed to delete collection')
      
      toast.success('Collection deleted')
    } catch (error) {
      // Rollback
      set({ collections: originalCollections })
      console.error('Failed to delete collection:', error)
      toast.error('Failed to delete collection')
      throw error
    }
  },
})) 