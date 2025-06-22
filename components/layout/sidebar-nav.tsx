/**
 * Component: SidebarNav
 * Purpose: Main navigation sidebar with spaces, collections, and drag & drop
 * Features:
 * - Hierarchical organization (spaces -> collections)
 * - Drag & drop reordering
 * - Search functionality
 * - Active chats display
 * - New item creation
 * 
 * Modified: 2024-07-31 - Integrated with Zustand store
 */
"use client"

import React, { useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, Search, MessageSquare, FileText, Settings, User, LogOut, Moon, Sun, Hash, Menu, PanelLeft, Plus } from 'lucide-react'
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
import type { User as UserType } from '@/lib/db/schema'
import useOrganizationStore, { Space } from '@/features/organization/store/organization-store'
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

const PERMANENT_SPACES = [
    { 
      id: 'all_notes', 
      name: 'All Notes', 
      emoji: '📝', 
      collections: [
        { id: 'all_notes_all', name: 'All' },
        { id: 'all_notes_recent', name: 'Recent' },
        { id: 'all_notes_saved', name: 'Saved' },
      ]
    },
    { 
      id: 'chats', 
      name: 'Chats', 
      emoji: '💬', 
      collections: [
        { id: 'chats_all', name: 'All' },
        { id: 'chats_recent', name: 'Recent' },
        { id: 'chats_saved', name: 'Saved' },
      ]
    },
]

export function SidebarNav({ className, user }: SidebarNavProps) {
  const { theme, setTheme } = useTheme()
  const { sidebarCollapsed, setSidebarCollapsed, openChat, openNote } = useAppShell()
  const { 
    spaces, 
    activeSpaceId,
    collections,
    activeCollectionId,
    notes,
    fetchInitialData, 
    setActiveSpace,
    setActiveCollection
  } = useOrganizationStore()
  
  const [activeChatsExpanded, setActiveChatsExpanded] = useState(true)
  const [allNotesExpanded, setAllNotesExpanded] = useState(true)
  const [spaceExpansion, setSpaceExpansion] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])
  
  const toggleSpace = (spaceId: string) => {
    if (activeSpaceId !== spaceId) {
        setActiveSpace(spaceId)
    }
    setSpaceExpansion(prev => ({ ...prev, [spaceId]: !prev[spaceId] }))
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

  const handleNoteClick = (note: { id: string; title: string }) => {
    openNote({ 
      id: note.id, 
      type: 'note', 
      title: note.title 
    })
  }

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' })
    window.location.href = '/'
  }

  if (sidebarCollapsed) {
    // Collapsed sidebar - icon only
    return (
      <TooltipProvider>
        <div className={cn("h-full bg-card border-r flex flex-col", className)}>
          {/* Header */}
          <div className="p-3 border-b">
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

          {/* Action Buttons */}
          <div className="p-2 space-y-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNewChat}
                  className="w-full h-8 p-0 hover:bg-accent"
                >
                  <MessageSquare className="h-4 w-4 text-primary" />
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
                  className="w-full h-8 p-0 hover:bg-accent"
                >
                  <FileText className="h-4 w-4 text-primary" />
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

          {/* Spaces Icons */}
          <div className="flex-1 p-2 space-y-2">
            {PERMANENT_SPACES.map((space) => (
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
            <Separator />
            {spaces.map((space) => (
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

          {/* User Avatar */}
          <div className="p-3 border-t">
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
      </TooltipProvider>
    )
  }

  // Expanded sidebar - full view
  return (
    <div className={cn("h-full bg-card border-r flex flex-col", className)}>
      {/* Header */}
      <div className="p-4 border-b">
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

      {/* Action Buttons */}
      <div className="p-3 space-y-2">
        <Button
          onClick={handleNewChat}
          className="w-full justify-start bg-secondary text-secondary-foreground hover:bg-secondary/80 group"
        >
          <MessageSquare className="mr-2 h-4 w-4 text-secondary-foreground group-hover:text-white" />
          New Chat
        </Button>
        <Button
          onClick={handleNewNote}
          className="w-full justify-start bg-secondary text-secondary-foreground hover:bg-secondary/80 group"
        >
          <FileText className="mr-2 h-4 w-4 text-secondary-foreground group-hover:text-white" />
          New Note
        </Button>
      </div>
      
      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Main navigation */}
      <div className="flex-1 overflow-y-auto px-2">
        {/* Active Chats */}
        <div className="mb-4">
          <Button
            onClick={() => setActiveChatsExpanded(!activeChatsExpanded)}
            variant="ghost"
            className="w-full justify-start text-sm font-semibold text-muted-foreground"
          >
            {activeChatsExpanded ? (
              <ChevronDown className="mr-1 h-4 w-4" />
            ) : (
              <ChevronRight className="mr-1 h-4 w-4" />
            )}
            Active Chats
          </Button>
          {activeChatsExpanded && (
            <div className="pl-2 space-y-1 mt-1">
              {spaces.map((space) => (
                <Button
                  key={space.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveSpace(space.id)}
                  className="w-full justify-start truncate"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {space.name}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* All Notes */}
        <div className="mb-4">
          <Button
            onClick={() => setAllNotesExpanded(!allNotesExpanded)}
            variant="ghost"
            className="w-full justify-start text-sm font-semibold text-muted-foreground"
          >
            {allNotesExpanded ? (
              <ChevronDown className="mr-1 h-4 w-4" />
            ) : (
              <ChevronRight className="mr-1 h-4 w-4" />
            )}
            All Notes
          </Button>
          {allNotesExpanded && (
            <div className="pl-2 space-y-1 mt-1">
              {spaces.map((space) => (
                <Button
                  key={space.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveSpace(space.id)}
                  className="w-full justify-start truncate"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {space.name}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Spaces */}
        <ScrollArea className="flex-1">
          <div className="px-2">
            {/* Permanent Spaces */}
            {PERMANENT_SPACES.map((space) => (
                 <div key={space.id} className="mt-2">
                 <div 
                     className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium cursor-pointer hover:bg-accent"
                     onClick={() => toggleSpace(space.id)}
                 >
                     <div className="flex items-center">
                         <span className='text-base'>{space.emoji}</span>
                         <span className="ml-2">{space.name}</span>
                     </div>
                     {spaceExpansion[space.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                 </div>
                 {spaceExpansion[space.id] && (
                     <div className="pl-4 mt-1 space-y-1">
                         {space.collections.map((collection) => (
                             <div 
                                 key={collection.id} 
                                 className={cn(
                                     "flex items-center justify-between rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-accent",
                                     activeCollectionId === collection.id && "bg-accent"
                                 )}
                                 onClick={() => setActiveCollection(collection.id, space.id)}
                             >
                                 <div className='flex items-center'>
                                     <Hash className="mr-2 h-3 w-3" />
                                     <span>{collection.name}</span>
                                 </div>
                             </div>
                         ))}
                     </div>
                 )}
             </div>
              ))}

              <Separator className="my-4" />

                {/* User Spaces */}
                {spaces.map((space: Space) => (
                    <div key={space.id} className="mt-2">
                        <div 
                            className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium cursor-pointer hover:bg-accent"
                            onClick={() => toggleSpace(space.id)}
                        >
                            <div className="flex items-center">
                                <span className='text-base'>{space.emoji}</span>
                                <span className="ml-2">{space.name}</span>
                            </div>
                            <div className='flex items-center'>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant='ghost' size='sm' className='h-6 w-6 p-0'>
                                            <Plus className='h-3 w-3' />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">
                                        <p>New collection</p>
                                    </TooltipContent>
                                </Tooltip>
                                {spaceExpansion[space.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </div>
                        </div>
                        {spaceExpansion[space.id] && (
                            <div className="pl-4 mt-1 space-y-1">
                                {space.collections.map((collection) => (
                                    <div 
                                        key={collection.id} 
                                        className={cn(
                                            "flex items-center justify-between rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-accent",
                                            activeCollectionId === collection.id && "bg-accent"
                                        )}
                                        onClick={() => setActiveCollection(collection.id, space.id)}
                                    >
                                        <div className='flex items-center'>
                                            <Hash className="mr-2 h-3 w-3" />
                                            <span>{collection.name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
          </div>
          
          {/* Notes List */}
          {activeCollectionId && (
            <div className='mt-4 px-2'>
              <h3 className='text-xs font-semibold text-muted-foreground mb-2 px-2'>
                {collections.find(c => c.id === activeCollectionId)?.name} Notes
              </h3>
              <div className='space-y-1'>
                {notes.map(note => (
                  <div 
                    key={note.id}
                    className='flex items-center rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-accent'
                    onClick={() => handleNoteClick(note)}
                  >
                    <FileText className="mr-2 h-3 w-3" />
                    <span className='truncate'>{note.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Footer */}
      <div className="p-3 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start text-left">
              <div className="flex items-center">
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.name || user.email}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full mr-2"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mr-2 text-sm font-bold">
                    {getInitials(user.name, user.email)}
                  </div>
                )}
                <div className="flex flex-col truncate">
                  <span className="text-sm font-medium truncate">
                    {user.name || user.email}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    Free Plan
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
              {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
              Toggle Theme
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
} 