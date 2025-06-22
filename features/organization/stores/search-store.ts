import { create } from 'zustand'
import { Note, Chat } from '@/lib/db/schema'
import { toast } from 'sonner'

interface SearchState {
  searchQuery: string
  searchResults: {
    notes: Note[]
    chats: Chat[]
  }
  isSearching: boolean
}

interface SearchActions {
  setSearchQuery: (query: string) => void
  performSearch: (query: string) => Promise<void>
  clearSearch: () => void
}

type SearchStore = SearchState & SearchActions

// Debounce helper
let searchTimeout: NodeJS.Timeout | null = null

export const useSearchStore = create<SearchStore>((set, get) => ({
  // Initial state
  searchQuery: '',
  searchResults: { notes: [], chats: [] },
  isSearching: false,
  
  // Set search query with debounced search
  setSearchQuery: (query) => {
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
  
  // Perform search
  performSearch: async (query) => {
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
  
  // Clear search
  clearSearch: () => {
    if (searchTimeout) clearTimeout(searchTimeout)
    set({ searchQuery: '', searchResults: { notes: [], chats: [] }, isSearching: false })
  },
})) 