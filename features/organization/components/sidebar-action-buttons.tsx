'use client'

import React from 'react'
import { MessageSquare, FileText, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface SidebarActionButtonsProps {
  collapsed: boolean
  onNewChat: () => void
  onNewNote: () => void
}

export function SidebarActionButtons({ collapsed, onNewChat, onNewNote }: SidebarActionButtonsProps) {
  if (collapsed) {
    return (
      <div className="p-2 space-y-2 flex-shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onNewChat}
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
              onClick={onNewNote}
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
    )
  }

  return (
    <div className="p-3 space-y-2 flex-shrink-0">
      <Button
        onClick={onNewChat}
        className="w-full justify-start hover:bg-hover-2"
        variant="secondary"
      >
        <MessageSquare className="mr-2 h-4 w-4" />
        New Chat
      </Button>
      <Button
        onClick={onNewNote}
        className="w-full justify-start hover:bg-hover-2"
        variant="secondary"
      >
        <FileText className="mr-2 h-4 w-4" />
        New Note
      </Button>
    </div>
  )
} 