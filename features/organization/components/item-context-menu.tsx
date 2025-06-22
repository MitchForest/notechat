'use client'

import React from 'react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { 
  ExternalLink, 
  Edit2, 
  Star, 
  StarOff,
  FolderOpen,
  Copy,
  Trash2 
} from 'lucide-react'
import { Note, Chat } from '@/lib/db/schema'

interface ItemContextMenuProps {
  item: Note | Chat
  itemType: 'note' | 'chat'
  onAction: (action: string, itemId: string) => void
  children: React.ReactNode
}

export function ItemContextMenu({
  item,
  itemType,
  onAction,
  children
}: ItemContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={() => onAction('open', item.id)}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Open {itemType === 'note' ? 'Note' : 'Chat'}
        </ContextMenuItem>
        
        <ContextMenuItem onClick={() => onAction('rename', item.id)}>
          <Edit2 className="mr-2 h-4 w-4" />
          Rename
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem onClick={() => onAction('star', item.id)}>
          {item.isStarred ? (
            <>
              <StarOff className="mr-2 h-4 w-4" />
              Unstar
            </>
          ) : (
            <>
              <Star className="mr-2 h-4 w-4" />
              Star
            </>
          )}
        </ContextMenuItem>
        
        <ContextMenuItem onClick={() => onAction('move', item.id)}>
          <FolderOpen className="mr-2 h-4 w-4" />
          Move to...
        </ContextMenuItem>
        
        <ContextMenuItem onClick={() => onAction('duplicate', item.id)}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem 
          onClick={() => onAction('delete', item.id)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete {itemType === 'note' ? 'Note' : 'Chat'}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
} 