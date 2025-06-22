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
  Edit2, 
  Trash2, 
  Palette
} from 'lucide-react'
import { Space } from '@/lib/db/schema'

interface SpaceContextMenuProps {
  space: Space
  onAction: (action: string, spaceId: string) => void
  children: React.ReactNode
}

export function SpaceContextMenu({
  space,
  onAction,
  children
}: SpaceContextMenuProps) {
  const isSystemSpace = space.type === 'system'
  
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {!isSystemSpace && (
          <>
            <ContextMenuItem onClick={() => onAction('rename', space.id)}>
              <Edit2 className="mr-2 h-4 w-4" />
              Rename Space
            </ContextMenuItem>
            
            <ContextMenuItem onClick={() => onAction('changeEmoji', space.id)}>
              <Palette className="mr-2 h-4 w-4" />
              Change Emoji
            </ContextMenuItem>
            
            <ContextMenuSeparator />
            
            <ContextMenuItem 
              onClick={() => onAction('delete', space.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Space
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
} 