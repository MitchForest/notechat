'use client'

/**
 * Component: ChatHeader
 * Purpose: Chat header with title and actions
 * Features:
 * - Chat title display
 * - Message count
 * - Clear chat action
 * - Settings/options menu
 * 
 * Created: December 2024
 */

import { MoreHorizontal, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ChatHeaderProps {
  chatId: string
  messageCount: number
  onClear: () => void
}

export function ChatHeader({ chatId, messageCount, onClear }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b">
      <div className="flex items-center gap-2">
        <h2 className="font-semibold">AI Chat</h2>
        {messageCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {messageCount} message{messageCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onClear}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear chat
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
} 