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
  FolderOpen
} from 'lucide-react'
import { Collection } from '@/lib/db/schema'

interface CollectionContextMenuProps {
  collection: Collection
  onAction: (action: string, collectionId: string) => void
  children: React.ReactNode
}

export function CollectionContextMenu({
  collection,
  onAction,
  children
}: CollectionContextMenuProps) {
  const isSystemCollection = collection.type === 'static'
  
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {!isSystemCollection && (
          <>
            <ContextMenuItem onClick={() => onAction('rename', collection.id)}>
              <Edit2 className="mr-2 h-4 w-4" />
              Rename Collection
            </ContextMenuItem>
            
            <ContextMenuItem onClick={() => onAction('moveToSpace', collection.id)}>
              <FolderOpen className="mr-2 h-4 w-4" />
              Move to Space...
            </ContextMenuItem>
            
            <ContextMenuSeparator />
            
            <ContextMenuItem 
              onClick={() => onAction('delete', collection.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Collection
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
} 