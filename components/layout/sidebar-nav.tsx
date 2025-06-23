/**
 * Component: SidebarNav
 * Purpose: Main navigation sidebar orchestrator
 * Refactored to use smaller, focused components
 */
"use client"

import React, { useEffect, useState, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { User as UserType, Note, Chat, Collection, SmartCollection } from '@/lib/db/schema'
import { 
  useSpaceStore, 
  useCollectionStore, 
  useContentStore, 
  useSearchStore, 
  useUIStore,
  useSmartCollectionStore 
} from '@/features/organization/stores'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// Dialogs
import { CreateSpaceDialog } from '@/features/organization/components/create-space-dialog'
import { CreateCollectionDialog } from '@/features/organization/components/create-collection-dialog'
import { RenameDialog } from '@/features/organization/components/rename-dialog'
import { ChangeEmojiDialog } from '@/features/organization/components/change-emoji-dialog'
import { ChangeIconDialog } from '@/features/organization/components/change-icon-dialog'
import { MoveToSpaceDialog } from '@/features/organization/components/move-to-space-dialog'

// Removed context menu imports - using hover actions instead

// Sidebar Components
import { SidebarHeader } from '@/features/organization/components/sidebar-header'
import { SidebarActionButtons } from '@/features/organization/components/sidebar-action-buttons'
import { SidebarSearch } from '@/features/organization/components/sidebar-search'
import { SpaceSection } from '@/features/organization/components/space-section'
import { SmartCollectionItem } from '@/features/organization/components/smart-collection-item'
import { SidebarCollectionItem } from '@/features/organization/components/sidebar-collection-item'
import { SidebarUserMenu } from '@/features/organization/components/sidebar-user-menu'
import { SearchResults } from '@/features/organization/components/search-results'
import { DragPreview } from '@/features/organization/components/drag-overlay'

// Drag & Drop
import { DndContext } from '@dnd-kit/core'
import { useDragDrop } from '@/features/organization/hooks/use-drag-drop'
import { useAppShell } from '@/components/layout/app-shell-context'

import { isNoteId, isChatId, generateId } from '@/lib/utils/id-generator'

interface SidebarNavProps {
  className?: string
  user: UserType
}

interface SmartCollectionFilter {
  type?: string
  filterConfig?: Record<string, unknown>
}

interface FilterConfig {
  type?: 'all' | 'note' | 'chat'
  timeRange?: {
    unit: 'days' | 'weeks' | 'months'
    value: number
  }
  isStarred?: boolean
  orderBy?: 'updatedAt' | 'createdAt' | 'title'
  orderDirection?: 'asc' | 'desc'
}

export function SidebarNav({ className, user }: SidebarNavProps) {
  // UI Store
  const { 
    spaceExpansion, 
    collectionExpansion,
    smartCollectionExpansion,
    smartCollectionLoading,
    sidebarCollapsed,
    toggleSpace, 
    toggleCollection,
    toggleSmartCollection,
    setSmartCollectionLoading,
    setSidebarCollapsed,
    setActiveContext,
    isContextActive
  } = useUIStore()
  
  // Organization stores
  const { spaces, fetchSpaces, createSpace } = useSpaceStore()
  const { collections, createCollection } = useCollectionStore()
  const { smartCollections, setSmartCollections } = useSmartCollectionStore()
  const { 
    notes, 
    chats, 
    fetchSmartCollectionContent,
    updateNote,
    updateChat,
    deleteNote,
    deleteChat,
    toggleNoteStar,
    toggleChatStar
  } = useContentStore()
  
  // Search
  const [searchQuery, setSearchQuery] = useState('')
  const { searchResults, isSearching } = useSearchStore()
  
  // App shell
  const { openChat, openNote } = useAppShell()
  
  // Dialog states
  const [createSpaceOpen, setCreateSpaceOpen] = useState(false)
  const [createCollectionOpen, setCreateCollectionOpen] = useState(false)
  const [createCollectionSpaceId, setCreateCollectionSpaceId] = useState<string>('')
  const [createCollectionSpaceName, setCreateCollectionSpaceName] = useState<string>('')
  
  // Rename dialog state
  const [renameDialog, setRenameDialog] = useState<{
    open: boolean
    itemId: string
    itemType: 'space' | 'collection' | 'smart-collection' | 'note' | 'chat'
    currentName: string
  }>({
    open: false,
    itemId: '',
    itemType: 'note',
    currentName: ''
  })
  
  // Change emoji dialog state
  const [changeEmojiDialog, setChangeEmojiDialog] = useState<{
    open: boolean
    spaceId: string
    spaceName: string
    currentEmoji: string
  }>({
    open: false,
    spaceId: '',
    spaceName: '',
    currentEmoji: ''
  })
  
  // Change icon dialog state
  const [changeIconDialog, setChangeIconDialog] = useState<{
    open: boolean
    itemId: string
    itemType: 'collection' | 'smart-collection'
    itemName: string
    currentIcon: string
  }>({
    open: false,
    itemId: '',
    itemType: 'collection',
    itemName: '',
    currentIcon: 'folder'
  })
  
  // Move to space dialog state
  const [moveToSpaceDialog, setMoveToSpaceDialog] = useState<{
    open: boolean
    itemId: string
    itemType: 'collection' | 'note' | 'chat'
    itemName: string
    currentSpaceId: string
  }>({
    open: false,
    itemId: '',
    itemType: 'collection',
    itemName: '',
    currentSpaceId: ''
  })
  
  // Drag & drop state
  const dragDropHook = useDragDrop()

  // Load data on mount
  useEffect(() => {
    fetchSpaces()
    // Smart collections are loaded per space, not globally
  }, [fetchSpaces])

  // Fetch initial notes and chats
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch all notes
        const notesResponse = await fetch('/api/notes?filter=all')
        if (notesResponse.ok) {
          const notesData = await notesResponse.json()
          console.log('Initial notes fetched:', notesData)
          console.log('Note spaceIds:', notesData.map((n: Note) => ({ id: n.id, spaceId: n.spaceId, title: n.title })))
          useContentStore.getState().setNotes(notesData)
        }
        
        // Fetch all chats
        const chatsResponse = await fetch('/api/chats?filter=all')
        if (chatsResponse.ok) {
          const chatsData = await chatsResponse.json()
          console.log('Initial chats fetched:', chatsData)
          useContentStore.getState().setChats(chatsData)
        }
      } catch (error) {
        console.error('Failed to fetch initial data:', error)
      }
    }
    
    fetchInitialData()
  }, [])

  // When active context changes, update smart collections
  useEffect(() => {
    const activeContext = useUIStore.getState().getActiveContext()
    if (activeContext?.type === 'space') {
      const activeSpace = spaces.find(s => s.id === activeContext.id)
      if (activeSpace && activeSpace.smartCollections) {
        setSmartCollections(activeSpace.smartCollections)
      }
    }
  }, [spaces, setSmartCollections])

  // Helper function to filter items based on collection type
  const getFilteredItems = useCallback((collection: Collection) => {
    // Check if this is actually a smart collection
    const allSmartCollections = spaces.flatMap(s => s.smartCollections || [])
    const smartCollection = allSmartCollections.find(sc => sc.id === collection.id)
    
    if (smartCollection) {
      // This is a smart collection - filter ALL items in the space
      const spaceItems = [...notes, ...chats].filter(item => item.spaceId === smartCollection.spaceId)
      let filteredItems: (Note | Chat)[] = []
      
      const filterConfig = smartCollection.filterConfig as FilterConfig
      
      // Apply filters based on filterConfig
      if (filterConfig.type === 'all' || !filterConfig.type) {
        filteredItems = spaceItems
      } else if (filterConfig.type === 'note') {
        filteredItems = spaceItems.filter(item => !('messages' in item))
      } else if (filterConfig.type === 'chat') {
        filteredItems = spaceItems.filter(item => 'messages' in item || item.id.startsWith('chat-'))
      }
      
      // Apply time range filter
      if (filterConfig.timeRange) {
        const cutoffDate = new Date()
        const { unit, value } = filterConfig.timeRange
        
        switch (unit) {
          case 'days':
            cutoffDate.setDate(cutoffDate.getDate() - value)
            break
          case 'weeks':
            cutoffDate.setDate(cutoffDate.getDate() - (value * 7))
            break
          case 'months':
            cutoffDate.setMonth(cutoffDate.getMonth() - value)
            break
        }
        
        filteredItems = filteredItems.filter(item => new Date(item.updatedAt) > cutoffDate)
      }
      
      // Apply starred filter
      if (filterConfig.isStarred) {
        filteredItems = filteredItems.filter(item => item.isStarred)
      }
      
      // Sort
      const orderBy = filterConfig.orderBy || 'updatedAt'
      const orderDirection = filterConfig.orderDirection || 'desc'
      
      return filteredItems.sort((a, b) => {
        let aValue: string | number
        let bValue: string | number
        
        if (orderBy === 'title') {
          aValue = a.title
          bValue = b.title
        } else if (orderBy === 'createdAt') {
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
        } else {
          aValue = new Date(a.updatedAt).getTime()
          bValue = new Date(b.updatedAt).getTime()
        }
        
        if (orderDirection === 'asc') {
          return aValue > bValue ? 1 : -1
        } else {
          return aValue < bValue ? 1 : -1
        }
      })
    }
    
    // Regular collection - only show items with matching collectionId
    const filteredItems = [...notes, ...chats].filter(item => item.collectionId === collection.id)
    
    // Sort all items by updatedAt in descending order (most recent first)
    return filteredItems.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  }, [spaces, notes, chats])

  // Helper function to get items for a specific space
  const getItemsForSpace = useCallback((spaceId: string): (Note | Chat)[] => {
    // Simply filter by spaceId - much cleaner!
    const spaceNotes = notes.filter(note => note.spaceId === spaceId)
    const spaceChats = chats.filter(chat => chat.spaceId === spaceId)
    const allItems = [...spaceNotes, ...spaceChats]
    
    // Sort by updatedAt in descending order (most recent first)
    return allItems.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  }, [notes, chats])

  const handleNewChat = useCallback(() => {
    const context = useUIStore.getState().getActiveContext()
    
    let spaceId = context?.spaceId || null
    let collectionId = null
    
    // Only set collectionId for regular collections (not smart collections)
    if (context?.type === 'collection') {
      collectionId = context.id
    }
    // Smart collections are just filters, items go to the space
    
    // If no context, default to Inbox
    if (!spaceId) {
      const inboxSpace = spaces.find(s => s.type === 'system' && s.name === 'Inbox')
      spaceId = inboxSpace?.id || null
    }
    
    openChat({ 
      id: `chat-${Date.now()}`, 
      type: 'chat', 
      title: 'New Chat',
      metadata: { spaceId, collectionId }
    })
  }, [openChat, spaces])

  const handleNewNote = useCallback(() => {
    const context = useUIStore.getState().getActiveContext()
    
    let spaceId = context?.spaceId || null
    let collectionId = null
    
    // Only set collectionId for regular collections (not smart collections)
    if (context?.type === 'collection') {
      collectionId = context.id
    }
    // Smart collections are just filters, items go to the space
    
    // If no context, default to Inbox
    if (!spaceId) {
      const inboxSpace = spaces.find(s => s.type === 'system' && s.name === 'Inbox')
      spaceId = inboxSpace?.id || null
    }
    
    openNote({ 
      id: `note-${Date.now()}`, 
      type: 'note', 
      title: 'New Note',
      metadata: { spaceId, collectionId }
    })
  }, [openNote, spaces])

  const handleItemClick = useCallback((item: Note | Chat, type: 'note' | 'chat') => {
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

  const handleNewSpace = useCallback(async () => {
    setCreateSpaceOpen(true)
  }, [])

  const handleNewCollection = useCallback(async (spaceId: string) => {
    const space = spaces.find(s => s.id === spaceId)
    if (space) {
      setCreateCollectionSpaceId(spaceId)
      setCreateCollectionSpaceName(space.name)
      setCreateCollectionOpen(true)
    }
  }, [spaces])

  const handleCreateSpace = useCallback(async (name: string, emoji: string) => {
    await createSpace(name, emoji)
  }, [createSpace])

  const handleCreateCollection = useCallback(async (data: {
    name: string
    icon: string
    type: 'regular' | 'smart'
    filterConfig?: SmartCollectionFilter
  }) => {
    if (createCollectionSpaceId) {
      if (data.type === 'regular') {
        // Create regular collection
        await createCollection(data.name, createCollectionSpaceId, data.icon)
      } else {
        // Create smart collection
        const { createSmartCollection } = useSmartCollectionStore.getState()
        await createSmartCollection({
          id: generateId('smartCollection'),
          name: data.name,
          icon: data.icon,
          spaceId: createCollectionSpaceId,
          userId: user.id,
          filterConfig: data.filterConfig || {}
        })
      }
    }
  }, [createCollection, createCollectionSpaceId, user.id])

  // Context menu action handlers
  const handleSpaceAction = useCallback((action: string, spaceId: string) => {
    const space = spaces.find(s => s.id === spaceId)
    if (!space) return

    switch (action) {
      case 'rename':
        setRenameDialog({
          open: true,
          itemId: spaceId,
          itemType: 'space',
          currentName: space.name
        })
        break
      case 'delete':
        if (confirm(`Delete space "${space.name}"? All collections and items will be moved to Inbox.`)) {
          useSpaceStore.getState().deleteSpace(spaceId)
        }
        break
      case 'changeEmoji':
        setChangeEmojiDialog({
          open: true,
          spaceId: spaceId,
          spaceName: space.name,
          currentEmoji: space.emoji || '📁'
        })
        break
    }
  }, [spaces])

  const handleCollectionAction = useCallback((action: string, collectionId: string) => {
    const collection = collections.find(c => c.id === collectionId)
    if (!collection) return

    switch (action) {
      case 'rename':
        setRenameDialog({
          open: true,
          itemId: collectionId,
          itemType: 'collection',
          currentName: collection.name
        })
        break
      case 'delete':
        if (confirm(`Delete collection "${collection.name}"? All items will be moved to the space root.`)) {
          useCollectionStore.getState().deleteCollection(collectionId)
        }
        break
      case 'changeIcon':
        setChangeIconDialog({
          open: true,
          itemId: collectionId,
          itemType: 'collection',
          itemName: collection.name,
          currentIcon: collection.icon || 'folder'
        })
        break
      case 'moveToSpace':
        setMoveToSpaceDialog({
          open: true,
          itemId: collectionId,
          itemType: 'collection',
          itemName: collection.name,
          currentSpaceId: collection.spaceId
        })
        break
    }
  }, [collections])

  const handleSmartCollectionAction = useCallback((action: string, smartCollectionId: string) => {
    const smartCollection = smartCollections.find(sc => sc.id === smartCollectionId)
    if (!smartCollection) return

    switch (action) {
      case 'rename':
        setRenameDialog({
          open: true,
          itemId: smartCollectionId,
          itemType: 'smart-collection',
          currentName: smartCollection.name
        })
        break
      case 'delete':
        if (confirm(`Delete smart collection "${smartCollection.name}"?`)) {
          useSmartCollectionStore.getState().deleteSmartCollection(smartCollectionId)
        }
        break
      case 'changeIcon':
        setChangeIconDialog({
          open: true,
          itemId: smartCollectionId,
          itemType: 'smart-collection',
          itemName: smartCollection.name,
          currentIcon: smartCollection.icon || 'filter'
        })
        break
    }
  }, [smartCollections])

  const handleItemAction = useCallback((action: string, itemId: string) => {
    const item = [...notes, ...chats].find(i => i.id === itemId)
    if (!item) return

    const isNote = notes.some(n => n.id === itemId)

    switch (action) {
      case 'open':
        handleItemClick(item, isNote ? 'note' : 'chat')
        break
      case 'rename':
        setRenameDialog({
          open: true,
          itemId: itemId,
          itemType: isNote ? 'note' : 'chat',
          currentName: item.title
        })
        break
      case 'star':
        if (isNote) {
          toggleNoteStar(itemId)
        } else {
          toggleChatStar(itemId)
        }
        break
      case 'delete':
        if (confirm(`Delete "${item.title}"?`)) {
          if (isNote) {
            deleteNote(itemId)
          } else {
            deleteChat(itemId)
          }
        }
        break
      case 'move':
        // TODO: Implement move to collection dialog
        console.log('Move item:', itemId)
        break
    }
  }, [notes, chats, handleItemClick, toggleNoteStar, toggleChatStar, deleteNote, deleteChat])

  // Fetch smart collection items when expanded
  const handleSmartCollectionToggle = async (smartCollection: SmartCollection) => {
    // Just toggle - no loading, no API calls
    // The items are already calculated by getSmartCollectionItems
    toggleSmartCollection(smartCollection.id)
  }

  // Separate system and user spaces
  const systemSpaces = spaces.filter(s => s.type === 'system')
  const userSpaces = spaces.filter(s => s.type === 'user' || s.type === 'seeded')

  // Helper function to get smart collection items from existing data
  const getSmartCollectionItems = useCallback((smartCollection: SmartCollection): (Note | Chat)[] => {
    // If we have cached items and the collection is expanded, use those
    if (smartCollectionItems[smartCollection.id] && smartCollectionExpansion[smartCollection.id]) {
      return smartCollectionItems[smartCollection.id]
    }
    
    // Otherwise, calculate from existing notes/chats
    const spaceItems = [...notes, ...chats].filter(item => item.spaceId === smartCollection.spaceId)
    const filterConfig = smartCollection.filterConfig as FilterConfig
    let filteredItems: (Note | Chat)[] = []
    
    // Apply filters based on filterConfig
    if (filterConfig.type === 'all' || !filterConfig.type) {
      filteredItems = spaceItems
    } else if (filterConfig.type === 'note') {
      filteredItems = spaceItems.filter(item => isNoteId(item.id))
    } else if (filterConfig.type === 'chat') {
      filteredItems = spaceItems.filter(item => isChatId(item.id))
    }
    
    // Apply time range filter
    if (filterConfig.timeRange) {
      const cutoffDate = new Date()
      const { unit, value } = filterConfig.timeRange
      
      switch (unit) {
        case 'days':
          cutoffDate.setDate(cutoffDate.getDate() - value)
          break
        case 'weeks':
          cutoffDate.setDate(cutoffDate.getDate() - (value * 7))
          break
        case 'months':
          cutoffDate.setMonth(cutoffDate.getMonth() - value)
          break
      }
      
      filteredItems = filteredItems.filter(item => new Date(item.updatedAt) > cutoffDate)
    }
    
    // Apply starred filter
    if (filterConfig.isStarred) {
      filteredItems = filteredItems.filter(item => item.isStarred)
    }
    
    // Sort
    const orderBy = filterConfig.orderBy || 'updatedAt'
    const orderDirection = filterConfig.orderDirection || 'desc'
    
    return filteredItems.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number
      
      if (orderBy === 'title') {
        aValue = a.title
        bValue = b.title
      } else if (orderBy === 'createdAt') {
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
      } else {
        aValue = new Date(a.updatedAt).getTime()
        bValue = new Date(b.updatedAt).getTime()
      }
      
      if (orderDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
  }, [notes, chats, smartCollectionItems, smartCollectionExpansion])

  if (sidebarCollapsed) {
    // Collapsed sidebar - icon only view
    return (
      <TooltipProvider>
        <div className={cn("h-full bg-card border-r flex flex-col overflow-hidden", className)}>
          <SidebarHeader collapsed={true} onToggleCollapse={() => setSidebarCollapsed(false)} />
          <SidebarActionButtons collapsed={true} onNewChat={handleNewChat} onNewNote={handleNewNote} />

          {/* Spaces Icons - Scrollable */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {/* System spaces */}
              {systemSpaces.map((space) => (
                <Tooltip key={space.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isContextActive('space', space.id) ? "secondary" : "ghost"}
                      size="sm"
                      className="w-full h-8 p-0 text-base"
                      onClick={() => setActiveContext({
                        type: 'space',
                        id: space.id,
                        spaceId: space.id
                      })}
                    >
                      {space.emoji}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{space.name}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
              
              {userSpaces.length > 0 && <Separator />}
              
              {/* User spaces */}
              {userSpaces.map((space) => (
                <Tooltip key={space.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isContextActive('space', space.id) ? "secondary" : "ghost"}
                      size="sm"
                      className="w-full h-8 p-0 text-base"
                      onClick={() => setActiveContext({
                        type: 'space',
                        id: space.id,
                        spaceId: space.id
                      })}
                    >
                      {space.emoji}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{space.name}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </ScrollArea>

          {/* User Menu - Fixed */}
          <div className="p-3 border-t flex-shrink-0">
            <SidebarUserMenu user={user} collapsed={true} onSignOut={handleSignOut} />
          </div>
        </div>
      </TooltipProvider>
    )
  }

  // Expanded sidebar - full view
  return (
    <DndContext
      sensors={dragDropHook.sensors}
      collisionDetection={dragDropHook.collisionDetection}
      onDragStart={dragDropHook.onDragStart}
      onDragOver={dragDropHook.onDragOver}
      onDragEnd={dragDropHook.onDragEnd}
      onDragCancel={dragDropHook.onDragCancel}
    >
      <div className={cn("h-full bg-card border-r flex flex-col overflow-hidden", className)}>
        <SidebarHeader collapsed={false} onToggleCollapse={() => setSidebarCollapsed(true)} />
        <SidebarActionButtons collapsed={false} onNewChat={handleNewChat} onNewNote={handleNewNote} />
        <SidebarSearch searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        {/* Main content area - this needs to be relative for search overlay */}
        <div className="flex-1 relative overflow-hidden">
          {/* Search Results Overlay - absolute within the content area */}
          {searchQuery && (
            <SearchResults
              searchQuery={searchQuery}
              isSearching={isSearching}
              results={searchResults}
              onItemClick={(item, type) => {
                handleItemClick(item, type)
                setSearchQuery('')
              }}
              onClear={() => setSearchQuery('')}
            />
          )}

          {/* Main navigation - Scrollable */}
          <ScrollArea className="h-full">
            <div className="px-2 pb-2">
              {/* System spaces */}
              {systemSpaces.map((space) => {
                const spaceItems = getItemsForSpace(space.id)
                const isSpaceExpanded = spaceExpansion[space.id]
                const spaceCollections: Collection[] = collections.filter(c => c.spaceId === space.id)
                const spaceSmartCollections = space.smartCollections || []
                
                return (
                  <SpaceSection
                    key={space.id}
                    space={space}
                    isExpanded={isSpaceExpanded}
                    isActive={isContextActive('space', space.id)}
                    onToggle={() => toggleSpace(space.id)}
                    onClick={() => setActiveContext({
                      type: 'space',
                      id: space.id,
                      spaceId: space.id
                    })}
                    onAction={handleSpaceAction}
                  >
                    {(spaceSmartCollections.length > 0 || spaceCollections.length > 0) && (
                      <div className="mt-1 ml-6 space-y-0.5">
                        {/* Smart Collections */}
                        {spaceSmartCollections.map((smartCollection) => {
                          const isExpanded = smartCollectionExpansion[smartCollection.id] ?? false
                          const isLoading = smartCollectionLoading[smartCollection.id] ?? false
                          const filteredItems = getSmartCollectionItems(smartCollection)
                          console.log('Rendering smart collection:', smartCollection.name, 'with items:', filteredItems)
                          
                          return (
                            <SmartCollectionItem
                              key={smartCollection.id}
                              smartCollection={smartCollection}
                              isActive={isContextActive('smart-collection', smartCollection.id)}
                              isExpanded={isExpanded}
                              isLoading={isLoading}
                              items={filteredItems}
                              onToggle={() => handleSmartCollectionToggle(smartCollection)}
                              onClick={() => {
                                setActiveContext({
                                  type: 'smart-collection',
                                  id: smartCollection.id,
                                  spaceId: space.id
                                })
                              }}
                              onAction={handleSmartCollectionAction}
                              onItemClick={handleItemClick}
                              onItemAction={handleItemAction}
                            />
                          )
                        })}
                        
                        {/* Regular Collections */}
                        {spaceCollections.map((collection) => {
                          const isExpanded = collectionExpansion[collection.id] ?? false
                          
                          return (
                            <SidebarCollectionItem
                              key={collection.id}
                              collection={collection}
                              space={space}
                              items={spaceItems}
                              isExpanded={isExpanded}
                              isActive={isContextActive('collection', collection.id)}
                              onToggle={toggleCollection}
                              onCollectionClick={(collectionId) => {
                                setActiveContext({
                                  type: 'collection',
                                  id: collectionId,
                                  spaceId: space.id,
                                  collectionId: collectionId
                                })
                              }}
                              onItemClick={handleItemClick}
                              onItemAction={handleItemAction}
                              onCollectionAction={handleCollectionAction}
                              getFilteredItems={getFilteredItems}
                              chats={chats}
                            />
                          )
                        })}
                      </div>
                    )}
                  </SpaceSection>
                )
              })}

              {/* User Spaces */}
              {userSpaces.map((space) => {
                const spaceItems = getItemsForSpace(space.id)
                const isSpaceExpanded = spaceExpansion[space.id]
                const spaceCollections: Collection[] = collections.filter(c => c.spaceId === space.id)
                const spaceSmartCollections = space.smartCollections || []
                
                return (
                  <SpaceSection
                    key={space.id}
                    space={space}
                    isExpanded={isSpaceExpanded}
                    isActive={isContextActive('space', space.id)}
                    onToggle={() => toggleSpace(space.id)}
                    onClick={() => setActiveContext({
                      type: 'space',
                      id: space.id,
                      spaceId: space.id
                    })}
                    onAction={handleSpaceAction}
                  >
                    {(spaceSmartCollections.length > 0 || spaceCollections.length > 0) && (
                      <div className="mt-1 ml-6 space-y-0.5">
                        {/* Smart Collections */}
                        {spaceSmartCollections.map((smartCollection) => (
                          <SmartCollectionItem
                            key={smartCollection.id}
                            smartCollection={smartCollection}
                            isActive={isContextActive('smart-collection', smartCollection.id)}
                            isExpanded={smartCollectionExpansion[smartCollection.id] ?? false}
                            isLoading={smartCollectionLoading[smartCollection.id] ?? false}
                            items={getSmartCollectionItems(smartCollection)}
                            onToggle={() => handleSmartCollectionToggle(smartCollection)}
                            onClick={() => {
                              setActiveContext({
                                type: 'smart-collection',
                                id: smartCollection.id,
                                spaceId: space.id
                              })
                            }}
                            onAction={handleSmartCollectionAction}
                            onItemClick={handleItemClick}
                            onItemAction={handleItemAction}
                          />
                        ))}
                        
                        {/* Regular Collections */}
                        {spaceCollections.map((collection) => {
                          const isExpanded = collectionExpansion[collection.id] ?? false
                          
                          return (
                            <SidebarCollectionItem
                              key={collection.id}
                              collection={collection}
                              space={space}
                              items={spaceItems}
                              isExpanded={isExpanded}
                              isActive={isContextActive('collection', collection.id)}
                              onToggle={toggleCollection}
                              onCollectionClick={(collectionId) => {
                                setActiveContext({
                                  type: 'collection',
                                  id: collectionId,
                                  spaceId: space.id,
                                  collectionId: collectionId
                                })
                              }}
                              onItemClick={handleItemClick}
                              onItemAction={handleItemAction}
                              onCollectionAction={handleCollectionAction}
                              getFilteredItems={getFilteredItems}
                              chats={chats}
                            />
                          )
                        })}
                        
                        {/* Add new collection button */}
                        <button
                          className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-hover-1 hover:text-foreground"
                          onClick={(event) => {
                            event.stopPropagation()
                            handleNewCollection(space.id)
                          }}
                        >
                          <Plus className="h-3 w-3" />
                          <span>New Collection</span>
                        </button>
                      </div>
                    )}
                  </SpaceSection>
                )
              })}

              {/* New Space Button */}
              <button
                onClick={handleNewSpace}
                className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-hover-2 hover:text-foreground mt-2"
              >
                <Plus className="h-4 w-4" />
                <span>New Space</span>
              </button>
            </div>
          </ScrollArea>
        </div>

        {/* User Menu - Fixed */}
        <div className="p-3 border-t flex-shrink-0">
          <SidebarUserMenu user={user} collapsed={false} onSignOut={handleSignOut} />
        </div>

        {/* Dialogs */}
        <CreateSpaceDialog
          open={createSpaceOpen}
          onOpenChange={setCreateSpaceOpen}
          onCreateSpace={handleCreateSpace}
        />
        
        <CreateCollectionDialog
          open={createCollectionOpen}
          onOpenChange={setCreateCollectionOpen}
          spaceName={createCollectionSpaceName}
          spaceId={createCollectionSpaceId}
          onCreateCollection={handleCreateCollection}
        />
        
        <RenameDialog
          open={renameDialog.open}
          onOpenChange={(open) => setRenameDialog(prev => ({ ...prev, open }))}
          currentName={renameDialog.currentName}
          itemType={renameDialog.itemType}
          onRename={async (newName) => {
            const { itemId, itemType } = renameDialog
            
            switch (itemType) {
              case 'space':
                await useSpaceStore.getState().updateSpace(itemId, { name: newName })
                break
              case 'collection':
                await useCollectionStore.getState().updateCollection(itemId, { name: newName })
                break
              case 'note':
                await updateNote(itemId, { title: newName })
                break
              case 'chat':
                await updateChat(itemId, { title: newName })
                break
              case 'smart-collection':
                await useSmartCollectionStore.getState().updateSmartCollection(itemId, { name: newName })
                break
            }
          }}
        />
        
        <ChangeEmojiDialog
          open={changeEmojiDialog.open}
          onOpenChange={(open) => setChangeEmojiDialog(prev => ({ ...prev, open }))}
          currentEmoji={changeEmojiDialog.currentEmoji}
          spaceName={changeEmojiDialog.spaceName}
          onChangeEmoji={async (newEmoji) => {
            await useSpaceStore.getState().updateSpace(changeEmojiDialog.spaceId, { emoji: newEmoji })
          }}
        />
        
        <ChangeIconDialog
          open={changeIconDialog.open}
          onOpenChange={(open: boolean) => setChangeIconDialog(prev => ({ ...prev, open }))}
          currentIcon={changeIconDialog.currentIcon}
          itemName={changeIconDialog.itemName}
          itemType={changeIconDialog.itemType}
          onChangeIcon={async (newIcon: string) => {
            if (changeIconDialog.itemType === 'collection') {
              await useCollectionStore.getState().updateCollection(
                changeIconDialog.itemId,
                { icon: newIcon }
              )
            } else {
              await useSmartCollectionStore.getState().updateSmartCollection(
                changeIconDialog.itemId,
                { icon: newIcon }
              )
            }
          }}
        />

        <MoveToSpaceDialog
          open={moveToSpaceDialog.open}
          onOpenChange={(open: boolean) => setMoveToSpaceDialog(prev => ({ ...prev, open }))}
          itemType={moveToSpaceDialog.itemType}
          itemName={moveToSpaceDialog.itemName}
          currentSpaceId={moveToSpaceDialog.currentSpaceId}
          spaces={spaces}
          onMove={async (targetSpaceId: string) => {
            if (moveToSpaceDialog.itemType === 'collection') {
              await useCollectionStore.getState().updateCollection(
                moveToSpaceDialog.itemId,
                { spaceId: targetSpaceId }
              )
            } else {
              // For notes/chats, use content store
              await useContentStore.getState().moveItem(
                moveToSpaceDialog.itemId,
                moveToSpaceDialog.itemType,
                null // Moving to space root, not a collection
              )
            }
          }}
        />
      </div>
      
      {/* Drag Preview */}
      <DragPreview item={dragDropHook.dragOverlay.item} />
    </DndContext>
  )
} 