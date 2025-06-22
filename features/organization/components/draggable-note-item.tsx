'use client'

import React from 'react'
import { MessageSquare, FileText, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Note, Chat } from '@/lib/db/schema'
import { DraggableItem } from './draggable-item'
import { ItemContextMenu } from './item-context-menu'

interface DraggableNoteItemProps {
  item: Note | Chat
  itemType: 'note' | 'chat'
  dragData: any
  onItemClick: (item: Note | Chat, type: 'note' | 'chat') => void
  onItemAction: (action: string, itemId: string) => void
}

export function DraggableNoteItem({
  item,
  itemType,
  dragData,
  onItemClick,
  onItemAction
}: DraggableNoteItemProps) {
  return (
    <DraggableItem
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
            event.stopPropagation()
            onItemClick(item, itemType)
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
} 