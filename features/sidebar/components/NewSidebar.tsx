'use client'

import React, { useEffect, useCallback } from 'react'
import { Plus, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { User as UserType } from '@/lib/db/schema'
import { useSpaceStore, useContentStore, useCollectionStore } from '@/features/organization/stores'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { useSidebarStore } from '../stores/sidebar-store'
import { SpaceSection } from './SpaceSection'
import { useRealtimeContent } from '../hooks/useRealtimeContent'
import { useAppShell } from '@/components/layout/app-shell-context'
import { SidebarHeader } from '@/features/organization/components/sidebar-header'
import { SidebarActionButtons } from '@/features/organization/components/sidebar-action-buttons'
import { SidebarSearch } from '@/features/organization/components/sidebar-search'
import { SidebarUserMenu } from '@/features/organization/components/sidebar-user-menu'
import { SearchResults } from '@/features/organization/components/search-results'
import { SidebarSkeleton } from './SidebarSkeleton'

// Import sidebar styles
import '../styles/sidebar.css'

interface NewSidebarProps {
  className?: string
  user: UserType
}

export function NewSidebar({ className, user }: NewSidebarProps) {
  const { spaces, fetchSpaces } = useSpaceStore()
  const { notes, chats } = useContentStore()
  const collections = useCollectionStore((state) => state.collections)
  const { openChat, openNote, sidebarCollapsed, setSidebarCollapsed } = useAppShell()
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [searchResults, setSearchResults] = React.useState<{ notes: any[], chats: any[] }>({ notes: [], chats: [] })
  const [isSearching, setIsSearching] = React.useState(false)
  
  // Enable real-time updates
  useRealtimeContent()
  
  // Load spaces on mount
  useEffect(() => {
    fetchSpaces()
  }, [fetchSpaces])
  
  // Handle search
  useEffect(() => {
    if (!searchQuery) {
      setSearchResults({ notes: [], chats: [] })
      return
    }
    
    const query = searchQuery.toLowerCase()
    const filteredNotes = notes.filter(note => 
      note.title.toLowerCase().includes(query)
    )
    const filteredChats = chats.filter(chat => 
      chat.title.toLowerCase().includes(query)
    )
    
    setSearchResults({ notes: filteredNotes, chats: filteredChats })
  }, [searchQuery, notes, chats])
  
  // Load initial content
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true)
      try {
        // Collections are already loaded with spaces in fetchSpaces()
        
        // Fetch all notes
        const notesResponse = await fetch('/api/notes?filter=all')
        if (notesResponse.ok) {
          const notesData = await notesResponse.json()
          useContentStore.getState().setNotes(notesData)
        }
        
        // Fetch all chats
        const chatsResponse = await fetch('/api/chats?filter=all')
        if (chatsResponse.ok) {
          const chatsData = await chatsResponse.json()
          useContentStore.getState().setChats(chatsData)
        }
      } catch (error) {
        console.error('Failed to fetch initial data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchInitialData()
  }, [])
  
  const handleNewChat = useCallback(() => {
    const activeItem = useSidebarStore.getState().activeItem
    
    let spaceId = null
    let collectionId = null
    
    if (activeItem) {
      if (activeItem.type === 'space') {
        spaceId = activeItem.id
      } else if (activeItem.type === 'collection') {
        const collection = collections.find(c => c.id === activeItem.id)
        if (collection) {
          spaceId = collection.spaceId
          collectionId = collection.id
        }
      } else if (activeItem.type === 'smartCollection') {
        // Find the smart collection in any space
        for (const space of spaces) {
          const smartCollection = space.smartCollections?.find((sc: any) => sc.id === activeItem.id)
          if (smartCollection) {
            spaceId = smartCollection.spaceId
            break
          }
        }
      }
    }
    
    // Default to Inbox if no context
    if (!spaceId) {
      const inboxSpace = spaces.find(s => s.type === 'system' && s.name === 'Inbox')
      spaceId = inboxSpace?.id || null
    }
    
    openChat({ 
      id: `chat_${Date.now()}`, 
      type: 'chat', 
      title: 'New Chat',
      metadata: { spaceId, collectionId }
    })
  }, [openChat, spaces, collections])
  
  const handleNewNote = useCallback(() => {
    const activeItem = useSidebarStore.getState().activeItem
    
    let spaceId = null
    let collectionId = null
    
    if (activeItem) {
      if (activeItem.type === 'space') {
        spaceId = activeItem.id
      } else if (activeItem.type === 'collection') {
        const collection = collections.find(c => c.id === activeItem.id)
        if (collection) {
          spaceId = collection.spaceId
          collectionId = collection.id
        }
      } else if (activeItem.type === 'smartCollection') {
        // Find the smart collection in any space
        for (const space of spaces) {
          const smartCollection = space.smartCollections?.find((sc: any) => sc.id === activeItem.id)
          if (smartCollection) {
            spaceId = smartCollection.spaceId
            break
          }
        }
      }
    }
    
    // Default to Inbox if no context
    if (!spaceId) {
      const inboxSpace = spaces.find(s => s.type === 'system' && s.name === 'Inbox')
      spaceId = inboxSpace?.id || null
    }
    
    openNote({ 
      id: `note_${Date.now()}`, 
      type: 'note', 
      title: 'New Note',
      metadata: { spaceId, collectionId }
    })
  }, [openNote, spaces, collections])
  
  const handleItemClick = useCallback((item: any, type: 'note' | 'chat') => {
    if (type === 'note') {
      openNote({ 
        id: item.id, 
        type: 'note', 
        title: item.title 
      })
    } else {
      openChat({ 
        id: item.id, 
        type: 'chat', 
        title: item.title 
      })
    }
  }, [openNote, openChat])
  
  const handleSignOut = useCallback(async () => {
    await fetch('/api/auth/signout', { method: 'POST' })
    window.location.href = '/'
  }, [])
  
  return (
    <div className={cn(
      "flex h-full flex-col bg-sidebar border-r border-sidebar-border overflow-hidden",
      sidebarCollapsed ? "w-16" : "w-64",
      "transition-all duration-200 ease-linear",
      className
    )}>
      <SidebarHeader 
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <SidebarActionButtons 
        collapsed={sidebarCollapsed}
        onNewChat={handleNewChat}
        onNewNote={handleNewNote}
      />
      
      {/* Search - only show when not collapsed */}
      {!sidebarCollapsed && (
        <div className="px-2 pb-2">
          <SidebarSearch 
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>
      )}
      
      <ScrollArea className="flex-1 px-2 min-h-0">
        {searchQuery ? (
          <SearchResults 
            searchQuery={searchQuery}
            isSearching={isSearching}
            results={searchResults}
            onItemClick={handleItemClick}
            onClear={() => {
              setSearchQuery('')
            }}
          />
        ) : isLoading ? (
          <SidebarSkeleton className="py-2" />
        ) : sidebarCollapsed ? (
          // Collapsed view - just show space emojis
          <div className="space-y-2 py-2">
            {spaces.map((space) => (
              <button
                key={space.id}
                onClick={() => {
                  setSidebarCollapsed(false)
                  useSidebarStore.getState().setActiveItem(space.id, 'space')
                }}
                className="w-full flex items-center justify-center p-2 rounded-md hover:bg-hover-1 transition-colors"
                title={space.name}
              >
                <span className="text-xl">{space.emoji || '📁'}</span>
              </button>
            ))}
          </div>
        ) : (
          // Expanded view
          <div className="space-y-2 pb-4">
            {spaces.map((space) => {
              // Filter collections and smart collections for this space
              const spaceCollections = collections.filter(c => c.spaceId === space.id)
              const spaceSmartCollections = space.smartCollections || []
              const spaceItems = [...notes, ...chats].filter(item => 
                item.spaceId === space.id && !item.collectionId
              )
              
              return (
                <SpaceSection
                  key={space.id}
                  space={space}
                  collections={spaceCollections}
                  smartCollections={spaceSmartCollections}
                  items={spaceItems}
                  onSpaceClick={() => {
                    useSidebarStore.getState().setActiveItem(space.id, 'space')
                  }}
                  onSpaceAction={(action, spaceId) => {
                    console.log('Space action:', action, spaceId)
                    // TODO: Implement space actions
                  }}
                  onCollectionAction={(action, collectionId) => {
                    console.log('Collection action:', action, collectionId)
                    // TODO: Implement collection actions
                  }}
                  onSmartCollectionAction={(action, collectionId) => {
                    console.log('Smart collection action:', action, collectionId)
                    // TODO: Implement smart collection actions
                  }}
                  onItemClick={handleItemClick}
                  onItemAction={(action, itemId) => {
                    console.log('Item action:', action, itemId)
                    // TODO: Implement item actions
                  }}
                  onNewCollection={() => {
                    console.log('New collection in space:', space.id)
                    // TODO: Implement new collection
                  }}
                />
              )
            })}
            
            {!sidebarCollapsed && (
              <button
                className="sidebar-new-button w-full"
                onClick={() => {
                  console.log('New space')
                  // TODO: Implement new space
                }}
              >
                <Plus className="h-4 w-4" />
                <span>New Space</span>
              </button>
            )}
          </div>
        )}
      </ScrollArea>
      
      {/* Sticky footer */}
      <div className={cn(
        "mt-auto border-t border-sidebar-border bg-sidebar",
        sidebarCollapsed ? "p-2" : "p-3"
      )}>
        <SidebarUserMenu 
          user={user}
          collapsed={sidebarCollapsed}
          onSignOut={handleSignOut}
        />
      </div>
    </div>
  )
} 