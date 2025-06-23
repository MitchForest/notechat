import { create } from 'zustand'
import { persist, createJSONStorage, subscribeWithSelector } from 'zustand/middleware'

type ItemType = 'space' | 'collection' | 'smartCollection' | 'note' | 'chat'

interface SidebarStore {
  // State
  expandedItems: Set<string>
  activeItem: { id: string; type: ItemType } | null
  searchQuery: string
  
  // Actions
  toggleExpanded: (id: string) => void
  expandItem: (id: string) => void
  collapseItem: (id: string) => void
  setActiveItem: (id: string, type: ItemType) => void
  clearActiveItem: () => void
  setSearchQuery: (query: string) => void
  
  // Computed
  isExpanded: (id: string) => boolean
  isActive: (id: string) => boolean
}

export const useSidebarStore = create<SidebarStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        expandedItems: new Set<string>(),
        activeItem: null,
        searchQuery: '',
        
        toggleExpanded: (id) => {
          const expanded = new Set(get().expandedItems)
          if (expanded.has(id)) {
            expanded.delete(id)
          } else {
            expanded.add(id)
          }
          set({ expandedItems: expanded })
        },
        
        expandItem: (id) => {
          const expanded = new Set(get().expandedItems)
          expanded.add(id)
          set({ expandedItems: expanded })
        },
        
        collapseItem: (id) => {
          const expanded = new Set(get().expandedItems)
          expanded.delete(id)
          set({ expandedItems: expanded })
        },
        
        setActiveItem: (id, type) => {
          set({ activeItem: { id, type } })
        },
        
        clearActiveItem: () => {
          set({ activeItem: null })
        },
        
        setSearchQuery: (query) => {
          set({ searchQuery: query })
        },
        
        isExpanded: (id) => {
          return get().expandedItems.has(id)
        },
        
        isActive: (id) => {
          return get().activeItem?.id === id
        }
      }),
      {
        name: 'sidebar-state',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          expandedItems: Array.from(state.expandedItems),
          activeItem: state.activeItem
        }),
        onRehydrateStorage: () => (state) => {
          if (state && Array.isArray(state.expandedItems)) {
            state.expandedItems = new Set(state.expandedItems)
          }
        }
      }
    )
  )
) 