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

import React, { useEffect, useState } from 'react'
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
import type { User as UserType, Note, Chat } from '@/lib/db/schema'
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

export function SidebarNav({ className, user }: SidebarNavProps) {
  const { theme, setTheme } = useTheme()
  const { sidebarCollapsed, setSidebarCollapsed, openChat, openNote } = useAppShell()
  const { 
    spaces, 
    activeSpaceId,
    activeCollectionId,
    notes,
    chats,
    fetchInitialData, 
    setActiveSpace,
    setActiveCollection,
    createSpace,
    createCollection,
    searchQuery,
    setSearchQuery
  } = useOrganizationStore()
  
  const [spaceExpansion, setSpaceExpansion] = useState<Record<string, boolean>>({
    'permanent-notes': true,
    'permanent-chats': true
  })
  const [collectionExpansion, setCollectionExpansion] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])
  
  const toggleSpace = (spaceId: string) => {
    setSpaceExpansion(prev => ({ ...prev, [spaceId]: !prev[spaceId] }))
  }

  const toggleCollection = (collectionId: string) => {
    setCollectionExpansion(prev => ({ ...prev, [collectionId]: !prev[collectionId] }))
  }

  const handleCollectionClick = (collectionId: string, spaceId: string) => {
    setActiveCollection(collectionId, spaceId)
    // Auto-expand collection when selected
    setCollectionExpansion(prev => ({ ...prev, [collectionId]: true }))
  }

  const handleNewChat = () => {
    openChat({ 
      id: `chat-${Date.now()}`, 
      type: 'chat', 
      title: 'New Chat' 
    })
  }

  const handleNewNote = () => {
    openNote({ 
      id: `note-${Date.now()}`, 
      type: 'note', 
      title: 'New Note' 
    })
  }

  const handleItemClick = (item: Note | Chat, type: 'note' | 'chat') => {
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
  }

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' })
    window.location.href = '/'
  }

  const handleNewSpace = async () => {
    // TODO: Show emoji picker dialog
    const name = prompt('Space name:')
    if (name) {
      await createSpace(name, '📁')
    }
  }

  const handleNewCollection = async (spaceId: string) => {
    const name = prompt('Collection name:')
    if (name) {
      await createCollection(name, spaceId)
    }
  }

  // Separate permanent and user spaces
  const permanentSpaces = spaces.filter(s => s.type === 'static')
  const userSpaces = spaces.filter(s => s.type !== 'static')

  // Get items for the current collection
  const currentItems = activeSpaceId?.includes('chat') ? chats : notes

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
          {permanentSpaces.map((space) => (
            <div key={space.id} className="mb-2">
              <button
                className={cn(
                  "w-full flex items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium",
                  "hover:bg-hover-2"
                )}
                onClick={() => toggleSpace(space.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{space.emoji}</span>
                  <span>{space.name}</span>
                </div>
                {spaceExpansion[space.id] ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </button>
              
              {spaceExpansion[space.id] && space.collections && (
                <div className="mt-1 ml-6 space-y-0.5">
                  {space.collections.map((collection) => {
                    const itemCount = currentItems.length // TODO: Filter by collection
                    const isExpanded = collectionExpansion[collection.id]
                    
                    return (
                      <div key={collection.id}>
                        <button
                          className={cn(
                            "w-full flex items-center justify-between rounded-md px-2 py-1.5 text-sm",
                            "hover:bg-hover-1"
                          )}
                          onClick={() => {
                            handleCollectionClick(collection.id, space.id)
                            toggleCollection(collection.id)
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
                        {isExpanded && activeCollectionId === collection.id && currentItems.length > 0 && (
                          <div className="mt-0.5 ml-5 space-y-0.5">
                            {currentItems.map((item) => (
                              <button
                                key={item.id}
                                className={cn(
                                  "w-full flex items-center gap-2 rounded-md px-2 py-1 text-sm text-left",
                                  "hover:bg-hover-1",
                                  "text-muted-foreground hover:text-foreground"
                                )}
                                onClick={() => handleItemClick(item, space.id.includes('chat') ? 'chat' : 'note')}
                              >
                                {item.isStarred && <Star className="h-3 w-3 fill-current" />}
                                <span className="truncate">{item.title}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}

          {userSpaces.length > 0 && <Separator className="my-3" />}

          {/* User Spaces */}
          {userSpaces.map((space) => (
            <div key={space.id} className="mb-2">
              <button
                className={cn(
                  "w-full flex items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium",
                  "hover:bg-hover-2"
                )}
                onClick={() => toggleSpace(space.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{space.emoji}</span>
                  <span>{space.name}</span>
                </div>
                {spaceExpansion[space.id] ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </button>
              
              {spaceExpansion[space.id] && space.collections && (
                <div className="mt-1 ml-6 space-y-0.5">
                  {space.collections.map((collection) => {
                    const itemCount = currentItems.length // TODO: Filter by collection
                    const isExpanded = collectionExpansion[collection.id]
                    
                    return (
                      <div key={collection.id}>
                        <button
                          className={cn(
                            "w-full flex items-center justify-between rounded-md px-2 py-1.5 text-sm",
                            "hover:bg-hover-1"
                          )}
                          onClick={() => {
                            handleCollectionClick(collection.id, space.id)
                            toggleCollection(collection.id)
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
                        {isExpanded && activeCollectionId === collection.id && currentItems.length > 0 && (
                          <div className="mt-0.5 ml-5 space-y-0.5">
                            {currentItems.map((item) => (
                              <button
                                key={item.id}
                                className={cn(
                                  "w-full flex items-center gap-2 rounded-md px-2 py-1 text-sm text-left",
                                  "hover:bg-hover-1",
                                  "text-muted-foreground hover:text-foreground"
                                )}
                                onClick={() => handleItemClick(item, 'note')}
                              >
                                {item.isStarred && <Star className="h-3 w-3 fill-current" />}
                                <span className="truncate">{item.title}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  
                  {/* Add new collection button */}
                  <button
                    className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-hover-1 hover:text-foreground"
                    onClick={() => handleNewCollection(space.id)}
                  >
                    <Plus className="h-3 w-3" />
                    <span>New Collection</span>
                  </button>
                </div>
              )}
            </div>
          ))}

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