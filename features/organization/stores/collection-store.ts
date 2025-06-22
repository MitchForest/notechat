import { create } from 'zustand'
import { Collection } from '@/lib/db/schema'
import { toast } from 'sonner'
import { PERMANENT_SPACES_DATA } from '../lib/permanent-space-config'
import { useContentStore } from './content-store'

interface CollectionState {
  collections: Collection[]
  activeCollectionId: string | null
  loading: boolean
}

interface CollectionActions {
  // Active collection
  setActiveCollection: (collectionId: string, spaceId: string) => Promise<void>
  
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
  
  // Set active collection and fetch its items
  setActiveCollection: async (collectionId, spaceId) => {
    set({ loading: true, activeCollectionId: collectionId })
    
    let url = ''
    let isChatsApi = false
    
    // Find the collection in permanent data first
    let collectionToFetch: any = null
    for (const space of PERMANENT_SPACES_DATA) {
      const foundCollection = space.collections.find(c => c.id === collectionId)
      if (foundCollection) {
        collectionToFetch = foundCollection
        break
      }
    }
    
    if (collectionToFetch && collectionToFetch.fetchConfig) {
      const { api, filter } = collectionToFetch.fetchConfig
      url = `/api/${api}?filter=${filter}`
      isChatsApi = api === 'chats'
    } else {
      // Regular user collection
      const collection = get().collections.find(c => c.id === collectionId)
      if (collection) {
        // For now, all user collections are assumed to be notes
        url = `/api/notes?collectionId=${collectionId}`
        isChatsApi = false
      } else {
        console.warn(`Collection with id ${collectionId} not found.`)
        url = '/api/notes?filter=all'
        isChatsApi = false
      }
    }
    
    try {
      const response = await fetch(url)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || 'Failed to fetch items')
      }
      
      const data = await response.json()
      
      // Update content store with fetched data
      const contentStore = useContentStore.getState()
      if (isChatsApi) {
        contentStore.setChats(data)
        contentStore.setNotes([])
      } else {
        contentStore.setNotes(data)
        contentStore.setChats([])
      }
      contentStore.setCacheValid(collectionId)
      
      set({ loading: false })
    } catch (error) {
      console.error('Failed to fetch collection items:', error)
      set({ loading: false })
      toast.error('Failed to load collection items')
      throw error
    }
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