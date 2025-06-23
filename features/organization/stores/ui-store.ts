import { create } from 'zustand'

interface ActiveContext {
  type: 'space' | 'collection' | 'smart-collection'
  id: string
  spaceId: string
  collectionId?: string // Only for items in regular collections
}

interface UIState {
  // Expansion states
  spaceExpansion: Record<string, boolean>
  collectionExpansion: Record<string, boolean>
  smartCollectionExpansion: Record<string, boolean>
  
  // Active context - single source of truth
  activeContext: ActiveContext | null
  
  // Sidebar state
  sidebarCollapsed: boolean
  
  // Loading states
  globalLoading: boolean
  globalError: string | null
}

interface UIActions {
  // Expansion management
  toggleSpace: (spaceId: string) => void
  toggleCollection: (collectionId: string) => void
  toggleSmartCollection: (collectionId: string) => void
  setSpaceExpanded: (spaceId: string, expanded: boolean) => void
  setCollectionExpanded: (collectionId: string, expanded: boolean) => void
  setSmartCollectionExpanded: (collectionId: string, expanded: boolean) => void
  
  // Active context management
  setActiveContext: (context: ActiveContext | null) => void
  getActiveContext: () => ActiveContext | null
  clearActiveContext: () => void
  isContextActive: (type: string, id: string) => boolean
  
  // Sidebar
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
  
  // Global states
  setGlobalLoading: (loading: boolean) => void
  setGlobalError: (error: string | null) => void
}

type UIStore = UIState & UIActions

export const useUIStore = create<UIStore>((set, get) => ({
  // Initial state
  spaceExpansion: {},
  collectionExpansion: {},
  smartCollectionExpansion: {},
  activeContext: null,
  sidebarCollapsed: false,
  globalLoading: false,
  globalError: null,
  
  // Toggle space expansion
  toggleSpace: (spaceId) => {
    set(state => ({
      spaceExpansion: {
        ...state.spaceExpansion,
        [spaceId]: !state.spaceExpansion[spaceId]
      }
    }))
  },
  
  // Toggle collection expansion
  toggleCollection: (collectionId) => {
    const currentState = get().collectionExpansion[collectionId]
    set(state => ({
      collectionExpansion: {
        ...state.collectionExpansion,
        [collectionId]: currentState === undefined ? false : !currentState
      }
    }))
  },
  
  // Toggle smart collection expansion
  toggleSmartCollection: (collectionId) => {
    const currentState = get().smartCollectionExpansion[collectionId]
    set(state => ({
      smartCollectionExpansion: {
        ...state.smartCollectionExpansion,
        [collectionId]: currentState === undefined ? false : !currentState
      }
    }))
  },
  
  // Set space expansion
  setSpaceExpanded: (spaceId, expanded) => {
    set(state => ({
      spaceExpansion: {
        ...state.spaceExpansion,
        [spaceId]: expanded
      }
    }))
  },
  
  // Set collection expansion
  setCollectionExpanded: (collectionId, expanded) => {
    set(state => ({
      collectionExpansion: {
        ...state.collectionExpansion,
        [collectionId]: expanded
      }
    }))
  },
  
  // Set smart collection expansion
  setSmartCollectionExpanded: (collectionId, expanded) => {
    set(state => ({
      smartCollectionExpansion: {
        ...state.smartCollectionExpansion,
        [collectionId]: expanded
      }
    }))
  },
  
  // Set active context - this is the main method for setting what's active
  setActiveContext: (context) => {
    set({ activeContext: context })
    
    // Log for debugging
    if (context) {
      console.log(`Active context set to ${context.type}: ${context.id}`)
    } else {
      console.log('Active context cleared')
    }
  },
  
  // Get active context
  getActiveContext: () => {
    return get().activeContext
  },
  
  // Clear active context
  clearActiveContext: () => {
    set({ activeContext: null })
  },
  
  // Check if a specific item is active
  isContextActive: (type, id) => {
    const context = get().activeContext
    return context?.type === type && context?.id === id
  },
  
  // Set sidebar collapsed
  setSidebarCollapsed: (collapsed) => {
    set({ sidebarCollapsed: collapsed })
  },
  
  // Toggle sidebar
  toggleSidebar: () => {
    set(state => ({ sidebarCollapsed: !state.sidebarCollapsed }))
  },
  
  // Set global loading
  setGlobalLoading: (loading) => {
    set({ globalLoading: loading })
  },
  
  // Set global error
  setGlobalError: (error) => {
    set({ globalError: error })
  },
})) 