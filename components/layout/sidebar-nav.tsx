/**
 * Component: SidebarNav
 * Purpose: Main navigation sidebar with spaces, collections, and drag & drop
 * Features:
 * - Hierarchical organization (spaces -> collections -> items)
 * - Permanent spaces (Notes, Chats) 
 * - User spaces with emoji support
 * - Drag & drop for items
 * - Search functionality
 * - Fast, responsive hover states
 * 
 * Modified: 2024-12-19 - Fixed hover states and removed active states
 */
"use client"

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { 
  ChevronDown, 
  ChevronRight, 
  Search, 
  MessageSquare, 
  FileText, 
  Settings, 
  User, 
  LogOut, 
  Moon, 
  Sun, 
  Menu, 
  PanelLeft, 
  Plus,
  Star,
  Clock,
  Inbox,
  Lock,
  Folder,
  Files,
  Archive,
  Briefcase,
  Home,
  Book,
  Lightbulb,
  List,
  Calendar,
  Tag,
  Filter,
  Send,
  Users,
  LucideIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTheme } from 'next-themes'
import { useAppShell } from '@/components/layout/app-shell-context'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { User as UserType, Note, Chat, Collection, Space, SmartCollection } from '@/lib/db/schema'
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
import Image from 'next/image'
import { CreateSpaceDialog } from '@/features/organization/components/create-space-dialog'
import { CreateCollectionDialog } from '@/features/organization/components/create-collection-dialog'
import { SpaceContextMenu } from '@/features/organization/components/space-context-menu'
import { CollectionContextMenu } from '@/features/organization/components/collection-context-menu'
import { ItemContextMenu } from '@/features/organization/components/item-context-menu'
import { RenameDialog } from '@/features/organization/components/rename-dialog'
import { ChangeEmojiDialog } from '@/features/organization/components/change-emoji-dialog'
import { SearchResults } from '@/features/organization/components/search-results'
import { DragPreview } from '@/features/organization/components/drag-overlay'
import { DraggableItem } from '@/features/organization/components/draggable-item'
import { DroppableCollection } from '@/features/organization/components/droppable-collection'
import { useDragDrop } from '@/features/organization/hooks/use-drag-drop'

import {
  DndContext,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

interface SidebarNavProps {
  className?: string
  user: UserType
}

interface SmartCollectionFilter {
  type?: string
  filterConfig?: Record<string, unknown>
}

const getInitials = (name: string | null | undefined, email: string) => {
  if (name) {
    const names = name.split(' ')
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }
  return email.substring(0, 2).toUpperCase()
}

// Collection icon mapping
const getCollectionIcon = (iconName: string): LucideIcon => {
  const icons: Record<string, LucideIcon> = {
    'folder': Folder,
    'files': Files,
    'file-text': FileText,
    'message-square': MessageSquare,
    'star': Star,
    'clock': Clock,
    'archive': Archive,
    'briefcase': Briefcase,
    'home': Home,
    'book': Book,
    'lightbulb': Lightbulb,
    'list': List,
    'calendar': Calendar,
    'tag': Tag,
    'search': Search,
    'filter': Filter,
    'inbox': Inbox,
    'send': Send,
    'users': Users,
    'lock': Lock
  }
  
  return icons[iconName] || Folder
}

// Memoized collection component to prevent unnecessary re-renders
const CollectionItem = React.memo(({
  collection,
  space,
  items,
  isExpanded,
  onToggle,
  onItemClick,
  onItemAction,
  getFilteredItems,
  dragDropHook,
  chats,
}: {
  collection: Collection;
  space: Space;
  items: (Note | Chat)[];
  isExpanded: boolean;
  onToggle: (collectionId: string) => void;
  onItemClick: (item: Note | Chat, type: 'note' | 'chat') => void;
  onItemAction: (action: string, itemId: string) => void;
  getFilteredItems: (collection: Collection, spaceId: string, items: (Note | Chat)[]) => (Note | Chat)[];
  dragDropHook: ReturnType<typeof useDragDrop>;
  chats: Chat[];
}) => {
  // Helper to determine if an item is a chat or note
  const getItemType = (item: Note | Chat): 'note' | 'chat' => {
    return chats.some(chat => chat.id === item.id) ? 'chat' : 'note'
  }
  
  const filteredItems = useMemo(
    () => getFilteredItems(collection, space.id, items),
    [getFilteredItems, collection, space.id, items]
  );
  const itemCount = filteredItems.length;
  
  // Create drop data for this collection
  const dropData = dragDropHook.createDropData({
    id: collection.id,
    type: 'collection',
    spaceId: space.id,
    spaceType: space.type,
    collectionType: collection.type,
    acceptsType: 'both', // Collections can now accept both notes and chats
    name: collection.name,
  });

  const Icon = getCollectionIcon(collection.icon || 'folder')

  return (
    <DroppableCollection 
      id={collection.id} 
      data={dropData}
      dropIndicator={dragDropHook.dropIndicator}
    >
      <button
        className={cn(
          "w-full flex items-center justify-between rounded-md px-2 py-1.5 text-sm",
          "hover:bg-hover-1"
        )}
        onClick={(event) => {
          event.stopPropagation();
          onToggle(collection.id);
        }}
      >
        <div className="flex items-center gap-2">
          <Icon className="h-3 w-3" />
          <span>{collection.name}</span>
          {itemCount > 0 && (
            <span className="text-xs text-muted-foreground">({itemCount})</span>
          )}
        </div>
        {itemCount > 0 && (
          isExpanded ? 
            <ChevronDown className="h-3 w-3" /> : 
            <ChevronRight className="h-3 w-3" />
        )}
      </button>
      
      {/* Items under collection */}
      {isExpanded && (
        <div className="mt-0.5 ml-5 space-y-0.5">
          {itemCount === 0 ? (
            <div className="text-xs text-muted-foreground px-2 py-1">
              No items in this collection
            </div>
          ) : (
            <SortableContext
              items={filteredItems.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {filteredItems.map((item) => {
                // Determine item type by checking if it has chat-specific properties
                // In the future, we might add a 'type' field to the schema
                const itemType = getItemType(item)
                  
                const dragData = dragDropHook.createDragData({
                  id: item.id,
                  type: itemType,
                  title: item.title,
                  collectionId: item.collectionId,
                  isStarred: item.isStarred ?? false,
                });
                
                return (
                  <DraggableItem
                    key={item.id}
                    id={item.id}
                    data={dragData}
                  >
                    <ItemContextMenu
                      item={item}
                      itemType={itemType}
                      onAction={onItemAction}
                    >
                      <button
                        className={cn(
                          "w-full flex items-center gap-2 rounded-md px-2 py-1 text-sm text-left",
                          "hover:bg-hover-1",
                          "text-muted-foreground hover:text-foreground"
                        )}
                        onClick={(event) => {
                          event.stopPropagation();
                          onItemClick(item, itemType);
                        }}
                      >
                        {itemType === 'chat' ? (
                          <MessageSquare className="h-3 w-3 flex-shrink-0" />
                        ) : (
                          <FileText className="h-3 w-3 flex-shrink-0" />
                        )}
                        {item.isStarred && <Star className="h-3 w-3 fill-current flex-shrink-0" />}
                        <span className="truncate">{item.title}</span>
                      </button>
                    </ItemContextMenu>
                  </DraggableItem>
                )
              })}
            </SortableContext>
          )}
        </div>
      )}
    </DroppableCollection>
  );
});

CollectionItem.displayName = 'CollectionItem';

// Memoized Space Section to prevent re-renders
const SpaceSection = React.memo(({ 
  space,
  isExpanded,
  onToggle,
  children
}: {
  space: Space;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) => {
  return (
    <div className="mb-2">
      <button
        className={cn(
          "w-full flex items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium",
          "hover:bg-hover-2"
        )}
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{space.emoji}</span>
          <span>{space.name}</span>
        </div>
        {isExpanded ? 
          <ChevronDown className="h-4 w-4" /> : 
          <ChevronRight className="h-4 w-4" />
        }
      </button>
      
      {isExpanded && children}
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.space.id === nextProps.space.id &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.space.name === nextProps.space.name &&
    prevProps.space.emoji === nextProps.space.emoji
  );
});

SpaceSection.displayName = 'SpaceSection';

export function SidebarNav({ className, user }: SidebarNavProps) {
  const { theme, setTheme } = useTheme()
  
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
    createCollection
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

  // Separate permanent and user spaces
  const permanentSpaces = spaces.filter(s => s.type === 'system')
  const userSpaces = spaces.filter(s => s.type === 'user')

  // Memoize permanent collections to prevent recreation on every render
  const permanentInboxCollections = useMemo(() => {
    const space = spaces.find((s: Space) => s.type === 'system' && s.name === 'Inbox')
    if (!space) return []
    return space.collections || []
  }, [spaces])

  if (sidebarCollapsed) {
    // Collapsed sidebar - icon only view
    return (
      <TooltipProvider>
        <div className={cn("h-full bg-card border-r flex flex-col overflow-hidden", className)}>
          {/* Header - Fixed */}
          <div className="p-3 border-b flex-shrink-0">
            <div className="flex items-center justify-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarCollapsed(false)}
                    className="w-8 h-8 p-0"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Expand sidebar</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="text-center mt-2">
              <span className="text-xs font-bold text-primary">
                NC
              </span>
            </div>
          </div>

          {/* Action Buttons - Fixed */}
          <div className="p-2 space-y-2 flex-shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNewChat}
                  className="w-full h-8 p-0"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>New Chat</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNewNote}
                  className="w-full h-8 p-0"
                >
                  <FileText className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>New Note</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-8 p-0"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Search</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Spaces Icons - Scrollable */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {/* Permanent spaces */}
              {permanentSpaces.map((space) => (
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full p-0">
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={user.name || user.email}
                      width={24}
                      height={24}
                      className="h-6 w-6 rounded-full"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                      {getInitials(user.name, user.email)}
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                  {theme === 'dark' ? (
                    <>
                      <Sun className="mr-2 h-4 w-4" />
                      Light Mode
                    </>
                  ) : (
                    <>
                      <Moon className="mr-2 h-4 w-4" />
                      Dark Mode
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
        {/* Header - Fixed */}
        <div className="p-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="font-bold text-primary-foreground">NC</span>
              </div>
              <span className="font-semibold text-lg">NoteChat</span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarCollapsed(true)}
                  className="w-8 h-8 p-0"
                >
                  <PanelLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Collapse sidebar</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Action Buttons - Fixed */}
        <div className="p-3 space-y-2 flex-shrink-0">
          <Button
            onClick={handleNewChat}
            className="w-full justify-start hover:bg-hover-2"
            variant="secondary"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            New Chat
          </Button>
          <Button
            onClick={handleNewNote}
            className="w-full justify-start hover:bg-hover-2"
            variant="secondary"
          >
            <FileText className="mr-2 h-4 w-4" />
            New Note
          </Button>
        </div>
        
        {/* Search - Fixed */}
        <div className="px-3 pb-2 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

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
              {/* Permanent Spaces */}
              {permanentSpaces.map((space) => {
                const spaceItems = getItemsForSpace(space.id)
                const isSpaceExpanded = spaceExpansion[space.id]
                
                // Use pre-memoized collections for permanent spaces
                const spaceCollections: Collection[] = 
                  space.id === 'permanent-inbox' ? permanentInboxCollections :
                  collections.filter(c => c.spaceId === space.id)
                
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
                          {spaceSmartCollections.map((smartCollection) => {
                            const Icon = getCollectionIcon(smartCollection.icon)
                            
                            return (
                              <button
                                key={smartCollection.id}
                                className={cn(
                                  "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-hover-1",
                                  activeSmartCollectionId === smartCollection.id && "bg-hover-2"
                                )}
                                onClick={() => {
                                  setActiveSmartCollection(smartCollection.id)
                                  fetchSmartCollectionContent(smartCollection)
                                }}
                                onContextMenu={(e) => {
                                  e.preventDefault()
                                  // Smart collections in permanent spaces are always protected
                                }}
                              >
                                <Icon className="h-4 w-4" />
                                <span>{smartCollection.name}</span>
                                {smartCollection.isProtected && (
                                  <Lock className="h-3 w-3 ml-auto text-muted-foreground" />
                                )}
                              </button>
                            )
                          })}
                          
                          {/* Regular Collections */}
                          {spaceCollections.map((collection) => {
                            const isExpanded = collectionExpansion[collection.id] ?? false
                            
                            return (
                              <CollectionContextMenu
                                key={collection.id}
                                collection={collection}
                                onAction={handleCollectionAction}
                              >
                                <CollectionItem
                                  collection={collection}
                                  space={space}
                                  items={spaceItems}
                                  isExpanded={isExpanded}
                                  onToggle={toggleCollection}
                                  onItemClick={handleItemClick}
                                  onItemAction={handleItemAction}
                                  getFilteredItems={getFilteredItems}
                                  dragDropHook={dragDropHook}
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
                          {spaceSmartCollections.map((smartCollection) => {
                            const Icon = getCollectionIcon(smartCollection.icon)
                            
                            return (
                              <button
                                key={smartCollection.id}
                                className={cn(
                                  "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-hover-1",
                                  activeSmartCollectionId === smartCollection.id && "bg-hover-2"
                                )}
                                onClick={() => {
                                  setActiveSmartCollection(smartCollection.id)
                                  fetchSmartCollectionContent(smartCollection)
                                }}
                                onContextMenu={(e) => {
                                  e.preventDefault()
                                  if (!smartCollection.isProtected) {
                                    // Handle smart collection context menu
                                  }
                                }}
                              >
                                <Icon className="h-4 w-4" />
                                <span>{smartCollection.name}</span>
                                {smartCollection.isProtected && (
                                  <Lock className="h-3 w-3 ml-auto text-muted-foreground" />
                                )}
                              </button>
                            )
                          })}
                          
                          {/* Regular Collections */}
                          {spaceCollections.map((collection) => {
                            const isExpanded = collectionExpansion[collection.id] ?? false
                            
                            return (
                              <CollectionContextMenu
                                key={collection.id}
                                collection={collection}
                                onAction={handleCollectionAction}
                              >
                                <CollectionItem
                                  collection={collection}
                                  space={space}
                                  items={spaceItems}
                                  isExpanded={isExpanded}
                                  onToggle={toggleCollection}
                                  onItemClick={handleItemClick}
                                  onItemAction={handleItemAction}
                                  getFilteredItems={getFilteredItems}
                                  dragDropHook={dragDropHook}
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start text-left">
                <div className="flex items-center">
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={user.name || user.email}
                      width={24}
                      height={24}
                      className="h-6 w-6 rounded-full mr-2"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center mr-2 text-xs font-bold">
                      {getInitials(user.name, user.email)}
                    </div>
                  )}
                  <div className="flex flex-col truncate">
                    <span className="text-sm font-medium truncate">
                      {user.name || user.email}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </span>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? (
                  <>
                    <Sun className="mr-2 h-4 w-4" />
                    Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="mr-2 h-4 w-4" />
                    Dark Mode
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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