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
  Hash, 
  Menu, 
  PanelLeft, 
  Plus,
  Star,
  Clock,
  Inbox
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
import type { User as UserType, Note, Chat, Collection, Space } from '@/lib/db/schema'
import useOrganizationStore from '@/features/organization/store/organization-store'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import Image from 'next/image'

interface SidebarNavProps {
  className?: string
  user: UserType
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
const getCollectionIcon = (collectionName: string) => {
  switch (collectionName.toLowerCase()) {
    case 'all':
      return <Hash className="h-3 w-3" />
    case 'recent':
      return <Clock className="h-3 w-3" />
    case 'saved':
      return <Star className="h-3 w-3" />
    case 'uncategorized':
      return <Inbox className="h-3 w-3" />
    default:
      return <Hash className="h-3 w-3" />
  }
}

// Memoized collection component to prevent unnecessary re-renders
const CollectionItem = React.memo(({ 
  collection, 
  space,
  items,
  isExpanded,
  isActive,
  onToggle,
  onSelect,
  onItemClick,
  getFilteredItems,
  getCollectionIcon
}: {
  collection: Collection;
  space: Space;
  items: (Note | Chat)[];
  isExpanded: boolean;
  isActive: boolean;
  onToggle: (id: string) => void;
  onSelect: (collectionId: string, spaceId: string) => void;
  onItemClick: (item: Note | Chat, type: 'note' | 'chat') => void;
  getFilteredItems: (collection: Collection, spaceId: string, items: (Note | Chat)[]) => (Note | Chat)[];
  getCollectionIcon: (name: string) => React.ReactNode;
}) => {
  const filteredItems = useMemo(
    () => getFilteredItems(collection, space.id, items),
    [getFilteredItems, collection, space.id, items]
  );
  const itemCount = filteredItems.length;

  return (
    <div>
      <button
        className={cn(
          "w-full flex items-center justify-between rounded-md px-2 py-1.5 text-sm",
          "hover:bg-hover-1",
          isActive && "bg-hover-2"
        )}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(collection.id, space.id);
          if (itemCount > 0) {
            onToggle(collection.id);
          }
        }}
      >
        <div className="flex items-center gap-2">
          {getCollectionIcon(collection.name)}
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
      {isExpanded && itemCount > 0 && (
        <div className="mt-0.5 ml-5 space-y-0.5">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              className={cn(
                "w-full flex items-center gap-2 rounded-md px-2 py-1 text-sm text-left",
                "hover:bg-hover-1",
                "text-muted-foreground hover:text-foreground"
              )}
              onClick={(event) => {
                event.stopPropagation();
                onItemClick(item, space.id === 'permanent-chats' ? 'chat' : 'note');
              }}
            >
              {item.isStarred && <Star className="h-3 w-3 fill-current" />}
              <span className="truncate">{item.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
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
  const { 
    spaces, 
    notes, 
    chats, 
    fetchInitialData, 
    setActiveSpace,
    setActiveCollection,
    activeSpaceId,
    activeCollectionId,
    createSpace,
    createCollection,
    searchQuery,
    setSearchQuery
  } = useOrganizationStore()
  const { openChat, openNote } = useAppShell()
  const { theme, setTheme } = useTheme()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  // Track which spaces and collections are expanded
  const [spaceExpansion, setSpaceExpansion] = useState<Record<string, boolean>>({
    'permanent-notes': true,
    'permanent-chats': true
  })
  const [collectionExpansion, setCollectionExpansion] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])

  const toggleSpace = useCallback((spaceId: string) => {
    setSpaceExpansion(prev => ({ ...prev, [spaceId]: !prev[spaceId] }))
  }, [])

  const toggleCollection = useCallback((collectionId: string) => {
    setCollectionExpansion(prev => ({ ...prev, [collectionId]: !prev[collectionId] }))
  }, [])

  const handleCollectionClick = useCallback((collectionId: string, spaceId: string) => {
    setActiveSpace(spaceId)
    setActiveCollection(collectionId, spaceId)
  }, [setActiveSpace, setActiveCollection])

  // Helper function to filter items based on collection type
  const getFilteredItems = useCallback((collection: Collection, spaceId: string, items: (Note | Chat)[]) => {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    switch (collection.name) {
      case 'All':
        return items
      case 'Recent':
        return items.filter(item => new Date(item.updatedAt) > sevenDaysAgo)
      case 'Saved':
        return items.filter(item => item.isStarred)
      case 'Uncategorized':
        return items.filter(item => !item.collectionId)
      default:
        // Regular collection - filter by collection ID
        return items.filter(item => item.collectionId === collection.id)
    }
  }, [])

  // Helper function to get items for a specific space
  const getItemsForSpace = useCallback((spaceId: string): (Note | Chat)[] => {
    if (spaceId === 'permanent-notes') {
      return notes
    } else if (spaceId === 'permanent-chats') {
      return chats
    } else {
      // User spaces - for now, return notes
      // TODO: In the future, spaces might contain mixed content
      return notes
    }
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
    // TODO: Show emoji picker dialog
    const name = prompt('Space name:')
    if (name) {
      await createSpace(name, '📁')
    }
  }, [createSpace])

  const handleNewCollection = useCallback(async (spaceId: string) => {
    const name = prompt('Collection name:')
    if (name) {
      await createCollection(name, spaceId)
    }
  }, [createCollection])

  // Separate permanent and user spaces
  const permanentSpaces = spaces.filter(s => s.type === 'static')
  const userSpaces = spaces.filter(s => s.type !== 'static')

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

      {/* Main navigation - Scrollable */}
      <ScrollArea className="flex-1 scrollbar-minimal">
        <div className="px-2 pb-2">
          {/* Permanent Spaces */}
          {permanentSpaces.map((space) => {
            const spaceItems = getItemsForSpace(space.id)
            const isSpaceExpanded = spaceExpansion[space.id]
            
            return (
              <SpaceSection
                key={space.id}
                space={space}
                isExpanded={isSpaceExpanded}
                onToggle={() => toggleSpace(space.id)}
              >
                {space.collections && (
                  <div className="mt-1 ml-6 space-y-0.5">
                    {space.collections.map((collection) => {
                      const isExpanded = collectionExpansion[collection.id]
                      const isActive = activeCollectionId === collection.id
                      
                      return (
                        <CollectionItem
                          key={collection.id}
                          collection={collection}
                          space={space}
                          items={spaceItems}
                          isExpanded={isExpanded}
                          isActive={isActive}
                          onToggle={toggleCollection}
                          onSelect={handleCollectionClick}
                          onItemClick={handleItemClick}
                          getFilteredItems={getFilteredItems}
                          getCollectionIcon={getCollectionIcon}
                        />
                      )
                    })}
                  </div>
                )}
              </SpaceSection>
            )
          })}

          {userSpaces.length > 0 && <Separator className="my-3" />}

          {/* User Spaces */}
          {userSpaces.map((space) => {
            const spaceItems = getItemsForSpace(space.id)
            const isSpaceExpanded = spaceExpansion[space.id]
            
            return (
              <SpaceSection
                key={space.id}
                space={space}
                isExpanded={isSpaceExpanded}
                onToggle={() => toggleSpace(space.id)}
              >
                {space.collections && (
                  <div className="mt-1 ml-6 space-y-0.5">
                    {space.collections.map((collection) => {
                      const isExpanded = collectionExpansion[collection.id]
                      const isActive = activeCollectionId === collection.id
                      
                      return (
                        <CollectionItem
                          key={collection.id}
                          collection={collection}
                          space={space}
                          items={spaceItems}
                          isExpanded={isExpanded}
                          isActive={isActive}
                          onToggle={toggleCollection}
                          onSelect={handleCollectionClick}
                          onItemClick={handleItemClick}
                          getFilteredItems={getFilteredItems}
                          getCollectionIcon={getCollectionIcon}
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
    </div>
  )
} 