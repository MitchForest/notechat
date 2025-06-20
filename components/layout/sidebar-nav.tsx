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
 * Modified: 2024-12-19 - Initial implementation
 */
"use client"

import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Search, MessageSquare, FileText, Settings, User, LogOut, Moon, Sun, Hash, Menu, PanelLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTheme } from 'next-themes'
import { useAppShell } from '@/lib/app-shell-context'
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

interface SidebarNavProps {
  className?: string
}

export function SidebarNav({ className }: SidebarNavProps) {
  const { theme, setTheme } = useTheme()
  const { sidebarCollapsed, setSidebarCollapsed, openChat, openNote } = useAppShell()
  const [activeChatsExpanded, setActiveChatsExpanded] = useState(true)
  const [allNotesExpanded, setAllNotesExpanded] = useState(true)

  // Mock data
  const activeChats = [
    { id: '1', title: 'Project Planning Discussion' },
    { id: '2', title: 'Code Review Chat' },
    { id: '3', title: 'Feature Implementation' },
  ]

  const spaces = [
    { 
      id: '1', 
      name: 'Work Projects', 
      emoji: '💼',
      expanded: true,
      collections: [
        { id: 'recent-work', name: 'Recent', count: 5 },
        { id: 'saved-work', name: 'Saved', count: 3 },
        { id: 'meetings', name: 'Meetings', count: 12 },
        { id: 'projects', name: 'Active Projects', count: 8 },
      ]
    },
    { 
      id: '2', 
      name: 'Personal', 
      emoji: '🏠',
      expanded: false,
      collections: [
        { id: 'recent-personal', name: 'Recent', count: 2 },
        { id: 'saved-personal', name: 'Saved', count: 1 },
        { id: 'journal', name: 'Journal', count: 24 },
        { id: 'ideas', name: 'Ideas', count: 11 },
      ]
    },
    { 
      id: '3', 
      name: 'Research', 
      emoji: '🔬',
      expanded: false,
      collections: [
        { id: 'recent-research', name: 'Recent', count: 7 },
        { id: 'saved-research', name: 'Saved', count: 4 },
        { id: 'papers', name: 'Papers', count: 15 },
        { id: 'experiments', name: 'Experiments', count: 6 },
      ]
    },
  ]

  const [spacesState, setSpacesState] = useState(spaces)

  const toggleSpace = (spaceId: string) => {
    setSpacesState(prev => prev.map(space => 
      space.id === spaceId ? { ...space, expanded: !space.expanded } : space
    ))
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

  const handleChatClick = (chat: { id: string; title: string }) => {
    openChat({ 
      id: chat.id, 
      type: 'chat', 
      title: chat.title 
    })
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
            {spacesState.map((space) => (
              <Tooltip key={space.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-8 p-0 text-base"
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
          <div className="p-2 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full h-8 p-0">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-3 w-3 text-primary-foreground" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="w-56">
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
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
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
            <span className="font-semibold text-lg">NoteChat.AI</span>
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
          className="w-full justify-start"
          variant="secondary"
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          New Chat
        </Button>
        <Button
          onClick={handleNewNote}
          className="w-full justify-start"
          variant="secondary"
        >
          <FileText className="mr-2 h-4 w-4" />
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
              {activeChats.map((chat) => (
                <Button
                  key={chat.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleChatClick(chat)}
                  className="w-full justify-start truncate"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {chat.title}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* All Notes */}
        <div>
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
              {spacesState.map((space) => (
                <div key={space.id}>
                  <Button
                    onClick={() => toggleSpace(space.id)}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                  >
                    {space.expanded ? (
                      <ChevronDown className="mr-1 h-4 w-4" />
                    ) : (
                      <ChevronRight className="mr-1 h-4 w-4" />
                    )}
                    <span className="mr-2">{space.emoji}</span>
                    {space.name}
                  </Button>
                  {space.expanded && (
                    <div className="pl-6 space-y-1 mt-1">
                      {space.collections.map((collection) => (
                        <Button
                          key={collection.id}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-muted-foreground"
                        >
                          <Hash className="mr-2 h-4 w-4" />
                          {collection.name}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-2 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start">
              <div className="flex items-center gap-2 w-full">
                <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-sm">Mitchell</p>
                  <p className="text-xs text-muted-foreground">mitchell@cursor.sh</p>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-56">
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
            <DropdownMenuItem>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
} 