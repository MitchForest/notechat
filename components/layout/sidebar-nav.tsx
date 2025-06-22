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

// Context Menus
import { SpaceContextMenu } from '@/features/organization/components/space-context-menu'
import { CollectionContextMenu } from '@/features/organization/components/collection-context-menu'

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

interface SidebarNavProps {
  className?: string
  user: UserType
}

interface SmartCollectionFilter {
  type?: string
  filterConfig?: Record<string, unknown>
}

export function SidebarNav({ className, user }: SidebarNavProps) {
  // Organizational state
  const { 
    spaces, 
    activeSpaceId, 
    setActiveSpace, 
    createSpace,
    fetchSpaces 
  } = useSpaceStore()
  
  const { 
    collections, 
    createCollection,
    setActiveCollection
  } = useCollectionStore()
  
  const {
    activeSmartCollectionId,
    setActiveSmartCollection,
    setSmartCollections
  } = useSmartCollectionStore()
  
  const { 
    notes, 
    chats, 
    updateNote, 
    updateChat,
    deleteNote,
    deleteChat,
    toggleNoteStar,
    toggleChatStar,
    fetchSmartCollectionContent
  } = useContentStore()
  
  // Search store
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
  } = useSearchStore()
  
  // UI store
  const {
    spaceExpansion,
    collectionExpansion,
    sidebarCollapsed,
    setSidebarCollapsed,
    toggleSpace,
    toggleCollection,
  } = useUIStore()
  
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
    itemType: 'space' | 'collection' | 'note' | 'chat'
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
  
  // Drag & drop state
  const dragDropHook = useDragDrop()

  useEffect(() => {
    fetchSpaces()
  }, [fetchSpaces])

  // Fetch initial notes and chats
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
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
      }
    }
    
    fetchInitialData()
  }, [])

  // When active space changes, update smart collections
  useEffect(() => {
    const activeSpace = spaces.find(s => s.id === activeSpaceId)
    if (activeSpace && activeSpace.smartCollections) {
      setSmartCollections(activeSpace.smartCollections)
    }
  }, [activeSpaceId, spaces, setSmartCollections])

  // Helper function to filter items based on collection type
  const getFilteredItems = useCallback((collection: Collection, spaceId: string, items: (Note | Chat)[]) => {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    let permanentCollection: SmartCollectionFilter | null = null;
    const systemSpace = spaces.find(s => s.type === 'system')
    if (systemSpace && systemSpace.smartCollections) {
      const foundCollection = systemSpace.smartCollections.find((c: SmartCollection) => c.id === collection.id);
      if (foundCollection) {
        permanentCollection = {
          type: foundCollection.name.toLowerCase().replace(' ', '-'),
          filterConfig: foundCollection.filterConfig as Record<string, unknown>
        };
      }
    }
      
    const collectionType = permanentCollection ? permanentCollection.type : 'user'

    let filteredItems: (Note | Chat)[] = []
    
    switch (collectionType) {
      case 'static-all':
        filteredItems = items
        break
      case 'static-recent':
        filteredItems = items.filter(item => new Date(item.updatedAt) > sevenDaysAgo)
        break
      case 'static-starred':
        filteredItems = items.filter(item => item.isStarred)
        break
      case 'static-uncategorized':
        filteredItems = items.filter(item => !item.collectionId)
        break
      case 'user':
      default:
        // Regular user collection - filter by collection ID
        filteredItems = items.filter(item => item.collectionId === collection.id)
        break
    }
    
    // Sort all items by updatedAt in descending order (most recent first)
    return filteredItems.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  }, [spaces])

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
    openChat({ 
      id: `chat-${Date.now()}`, 
      type: 'chat', 
      title: 'New Chat' 
    })
  }, [openChat])

  const handleNewNote = useCallback(() => {
    openNote({ 
      id: `note-${Date.now()}`, 
      type: 'note', 
      title: 'New Note' 
    })
  }, [openNote])

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

  const handleCreateCollection = useCallback(async (name: string) => {
    if (createCollectionSpaceId) {
      await createCollection(name, createCollectionSpaceId)
    }
  }, [createCollection, createCollectionSpaceId])

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
      case 'moveToSpace':
        // TODO: Implement move to space dialog
        console.log('Move collection to space:', collectionId)
        break
    }
  }, [collections])

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

  // Separate system and user spaces
  const systemSpaces = spaces.filter(s => s.type === 'system')
  const userSpaces = spaces.filter(s => s.type === 'user' || s.type === 'seeded')

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
                      variant={activeSpaceId === space.id ? "secondary" : "ghost"}
                      size="sm"
                      className="w-full h-8 p-0 text-base"
                      onClick={() => setActiveSpace(space.id)}
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
                      variant={activeSpaceId === space.id ? "secondary" : "ghost"}
                      size="sm"
                      className="w-full h-8 p-0 text-base"
                      onClick={() => setActiveSpace(space.id)}
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
                  <SpaceContextMenu
                    key={space.id}
                    space={space}
                    onAction={handleSpaceAction}
                  >
                    <SpaceSection
                      space={space}
                      isExpanded={isSpaceExpanded}
                      onToggle={() => toggleSpace(space.id)}
                    >
                      {(spaceSmartCollections.length > 0 || spaceCollections.length > 0) && (
                        <div className="mt-1 ml-6 space-y-0.5">
                          {/* Smart Collections */}
                          {spaceSmartCollections.map((smartCollection) => (
                            <SmartCollectionItem
                              key={smartCollection.id}
                              smartCollection={smartCollection}
                              isActive={activeSmartCollectionId === smartCollection.id}
                              onClick={() => {
                                setActiveSmartCollection(smartCollection.id)
                                // Clear regular collection when smart collection is selected
                                setActiveCollection(null)
                                fetchSmartCollectionContent(smartCollection)
                              }}
                              onContextMenu={(e) => {
                                e.preventDefault()
                                if (!smartCollection.isProtected) {
                                  // TODO: Handle smart collection context menu
                                  // For now, protected collections cannot be edited
                                }
                              }}
                            />
                          ))}
                          
                          {/* Regular Collections */}
                          {spaceCollections.map((collection) => {
                            const isExpanded = collectionExpansion[collection.id] ?? false
                            
                            return (
                              <CollectionContextMenu
                                key={collection.id}
                                collection={collection}
                                onAction={handleCollectionAction}
                              >
                                <SidebarCollectionItem
                                  collection={collection}
                                  space={space}
                                  items={spaceItems}
                                  isExpanded={isExpanded}
                                  onToggle={toggleCollection}
                                  onCollectionClick={(collectionId) => {
                                    setActiveCollection(collectionId)
                                    // Clear smart collection when regular collection is selected
                                    setActiveSmartCollection('')
                                  }}
                                  onItemClick={handleItemClick}
                                  onItemAction={handleItemAction}
                                  getFilteredItems={getFilteredItems}
                                  chats={chats}
                                />
                              </CollectionContextMenu>
                            )
                          })}
                        </div>
                      )}
                    </SpaceSection>
                  </SpaceContextMenu>
                )
              })}

              {/* User Spaces */}
              {userSpaces.map((space) => {
                const spaceItems = getItemsForSpace(space.id)
                const isSpaceExpanded = spaceExpansion[space.id]
                const spaceCollections: Collection[] = collections.filter(c => c.spaceId === space.id)
                const spaceSmartCollections = space.smartCollections || []
                
                return (
                  <SpaceContextMenu
                    key={space.id}
                    space={space}
                    onAction={handleSpaceAction}
                  >
                    <SpaceSection
                      space={space}
                      isExpanded={isSpaceExpanded}
                      onToggle={() => toggleSpace(space.id)}
                    >
                      {(spaceSmartCollections.length > 0 || spaceCollections.length > 0) && (
                        <div className="mt-1 ml-6 space-y-0.5">
                          {/* Smart Collections */}
                          {spaceSmartCollections.map((smartCollection) => (
                            <SmartCollectionItem
                              key={smartCollection.id}
                              smartCollection={smartCollection}
                              isActive={activeSmartCollectionId === smartCollection.id}
                              onClick={() => {
                                setActiveSmartCollection(smartCollection.id)
                                // Clear regular collection when smart collection is selected
                                setActiveCollection(null)
                                fetchSmartCollectionContent(smartCollection)
                              }}
                              onContextMenu={(e) => {
                                e.preventDefault()
                                if (!smartCollection.isProtected) {
                                  // TODO: Handle smart collection context menu
                                  // For now, protected collections cannot be edited
                                }
                              }}
                            />
                          ))}
                          
                          {/* Regular Collections */}
                          {spaceCollections.map((collection) => {
                            const isExpanded = collectionExpansion[collection.id] ?? false
                            
                            return (
                              <CollectionContextMenu
                                key={collection.id}
                                collection={collection}
                                onAction={handleCollectionAction}
                              >
                                <SidebarCollectionItem
                                  collection={collection}
                                  space={space}
                                  items={spaceItems}
                                  isExpanded={isExpanded}
                                  onToggle={toggleCollection}
                                  onCollectionClick={(collectionId) => {
                                    setActiveCollection(collectionId)
                                    // Clear smart collection when regular collection is selected
                                    setActiveSmartCollection('')
                                  }}
                                  onItemClick={handleItemClick}
                                  onItemAction={handleItemAction}
                                  getFilteredItems={getFilteredItems}
                                  chats={chats}
                                />
                              </CollectionContextMenu>
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
                  </SpaceContextMenu>
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
      </div>
      
      {/* Drag Preview */}
      <DragPreview item={dragDropHook.dragOverlay.item} />
    </DndContext>
  )
} 