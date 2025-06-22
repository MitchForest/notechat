import { create } from 'zustand'

interface UIState {
  // Expansion states
  spaceExpansion: Record<string, boolean>
  collectionExpansion: Record<string, boolean>
  
  // Active items
  activeNoteId: string | null
  activeChatId: string | null
  
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
  setSpaceExpanded: (spaceId: string, expanded: boolean) => void
  setCollectionExpanded: (collectionId: string, expanded: boolean) => void
  
  // Active items
  setActiveNote: (noteId: string | null) => void
  setActiveChat: (chatId: string | null) => void
  
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
  spaceExpansion: {
    'permanent-notes': true,
    'permanent-chats': true,
  },
  collectionExpansion: {},
  activeNoteId: null,
  activeChatId: null,
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
    console.log('Toggling collection:', collectionId, 'Current state:', get().collectionExpansion[collectionId])
    set(state => ({
      collectionExpansion: {
        ...state.collectionExpansion,
        [collectionId]: !state.collectionExpansion[collectionId]
      }
    }))
    console.log('New state:', get().collectionExpansion[collectionId])
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
  
  // Set active note
  setActiveNote: (noteId) => {
    set({ activeNoteId: noteId, activeChatId: null })
  },
  
  // Set active chat
  setActiveChat: (chatId) => {
    set({ activeChatId: chatId, activeNoteId: null })
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