'use client'

import React from 'react'
import { MessageSquare, FileText, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Note, Chat } from '@/lib/db/schema'
import { DraggableItem } from './draggable-item'
import { HoverActions } from './hover-actions'

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
      <div className="group relative flex items-center">
        <button
          className={cn(
            "flex-1 flex items-center gap-2 rounded-md px-2 py-1 text-sm text-left",
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
        
        <HoverActions
          variant="item"
          onOpen={() => onItemAction('open', item.id)}
          onRename={() => onItemAction('rename', item.id)}
          onStar={() => onItemAction('star', item.id)}
          onMove={() => onItemAction('move', item.id)}
          onDuplicate={() => onItemAction('duplicate', item.id)}
          onDelete={() => onItemAction('delete', item.id)}
          isStarred={item.isStarred || false}
          className="absolute right-1"
        />
      </div>
    </DraggableItem>
  )
} 