import { create } from 'zustand'
import { Collection as DbCollection } from '@/lib/db/schema'
import { toast } from 'sonner'
import { useContentStore } from './content-store'
import { useUIStore } from './ui-store'

export type Collection = DbCollection

interface CollectionState {
  collections: Collection[]
  loading: boolean
}

interface CollectionActions {
  // Active collection (now uses UI store)
  setActiveCollection: (collectionId: string) => void
  
  // Collection management
  setCollections: (collections: Collection[]) => void
  
  // CRUD operations
  createCollection: (name: string, spaceId: string, icon?: string) => Promise<Collection>
  updateCollection: (collectionId: string, data: Partial<Collection>) => Promise<void>
  deleteCollection: (collectionId: string) => Promise<void>
}

type CollectionStore = CollectionState & CollectionActions

export const useCollectionStore = create<CollectionStore>((set, get) => ({
  // Initial state
  collections: [],
  loading: false,
  
  // Set active collection using UI store's unified context
  setActiveCollection: (collectionId) => {
    const collection = get().collections.find(c => c.id === collectionId)
    if (!collection) return
    
    // Use UI store's unified context
    useUIStore.getState().setActiveContext({
      type: 'collection',
      id: collectionId,
      spaceId: collection.spaceId,
      collectionId: collectionId
    })
    
    // Invalidate cache when switching collections
    useContentStore.getState().invalidateCache()
  },
  
  // Set collections
  setCollections: (collections) => {
    set({ collections })
  },
  
  // Create collection
  createCollection: async (name, spaceId, icon) => {
    // Generate temporary ID
    const tempId = `temp-${Date.now()}`
    
    // Create optimistic collection
    const optimisticCollection: Collection = {
      id: tempId,
      userId: 'current-user', // Will be replaced with real user ID from response
      spaceId,
      name,
      type: 'user',
      icon: icon || null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    // Optimistically add to store
    set(state => ({
      collections: [...state.collections, optimisticCollection]
    }))
    
    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, spaceId, icon }),
      })
      
      if (!response.ok) throw new Error('Failed to create collection')
      
      const newCollection = await response.json()
      
      // Replace temporary collection with real one
      set(state => ({
        collections: state.collections.map(c => 
          c.id === tempId ? newCollection : c
        )
      }))
      
      toast.success(`Created collection "${name}"`)
      
      return newCollection
    } catch (error) {
      // Rollback - remove the optimistic collection
      set(state => ({
        collections: state.collections.filter(c => c.id !== tempId)
      }))
      
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
    
    // Check if we're deleting the active collection
    const currentContext = useUIStore.getState().getActiveContext()
    const isDeletingActiveCollection = currentContext?.type === 'collection' && currentContext?.id === collectionId
    
    // Optimistic update
    set(state => ({
      collections: state.collections.filter(c => c.id !== collectionId)
    }))
    
    // If we're deleting the active collection, clear or switch context
    if (isDeletingActiveCollection) {
      // Find the space this collection belonged to
      const deletedCollection = originalCollections.find(c => c.id === collectionId)
      if (deletedCollection) {
        // Switch to the parent space
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