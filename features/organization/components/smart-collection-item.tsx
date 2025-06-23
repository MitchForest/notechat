'use client'

import React from 'react'
import { ChevronDown, ChevronRight, Lock, LucideIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SmartCollection, Note, Chat } from '@/lib/db/schema'
import { getCollectionIcon } from '@/features/organization/lib/collection-icons'
import { HoverActions } from './hover-actions'
import { DraggableNoteItem } from './draggable-note-item'

interface SmartCollectionItemProps {
  smartCollection: SmartCollection
  isActive: boolean
  isExpanded: boolean
  isLoading?: boolean
  items: (Note | Chat)[]
  onToggle: () => void
  onClick: () => void
  onAction?: (action: string, collectionId: string) => void
  onItemClick: (item: Note | Chat, type: 'note' | 'chat') => void
  onItemAction: (action: string, itemId: string) => void
}

export function SmartCollectionItem({ 
  smartCollection, 
  isActive, 
  isExpanded,
  isLoading = false,
  items,
  onToggle,
  onClick,
  onAction,
  onItemClick,
  onItemAction
}: SmartCollectionItemProps) {
  const Icon = getCollectionIcon(smartCollection.icon) as LucideIcon
  
  // Helper to determine if an item is a chat or note
  const getItemType = (item: Note | Chat): 'note' | 'chat' => {
    return 'messages' in item || item.id.startsWith('chat-') ? 'chat' : 'note'
  }
  
  return (
    <div className={cn(
      "group relative",
      isActive && "sidebar-item-active-accent"
    )}>
      <div className="flex items-center">
        <button
          className={cn(
            "flex-1 flex items-center justify-between rounded-md px-2 py-1.5 text-sm",
            "transition-colors duration-150",
            !isActive && "hover:bg-hover-1"
          )}
          onClick={(e) => {
            e.stopPropagation()
            onClick()
            onToggle()
          }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1 text-left truncate">{smartCollection.name}</span>
            <span className="text-xs text-muted-foreground">
              ({items.length})
            </span>
            {smartCollection.isProtected && (
              <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-1 ml-2">
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </div>
        </button>
        
        {/* Hover actions for non-protected smart collections */}
        {!smartCollection.isProtected && onAction && (
          <HoverActions
            variant="smart-collection"
            onRename={() => onAction('rename', smartCollection.id)}
            onDelete={() => onAction('delete', smartCollection.id)}
            onChangeIcon={() => onAction('changeIcon', smartCollection.id)}
            className="absolute right-1"
          />
        )}
      </div>
      
      {/* Expanded content */}
      {isExpanded && !isLoading && (
        <div className="mt-0.5 ml-5 space-y-0.5">
          {items.length === 0 ? (
            <div className="text-xs text-muted-foreground px-2 py-1">
              No items match this filter
            </div>
          ) : (
            items.map((item) => {
              const itemType = getItemType(item)
              
              return (
                <DraggableNoteItem
                  key={item.id}
                  item={item}
                  itemType={itemType}
                  dragData={{
                    id: item.id,
                    type: itemType,
                    title: item.title,
                    collectionId: item.collectionId,
                    isStarred: item.isStarred ?? false,
                  }}
                  onItemClick={onItemClick}
                  onItemAction={onItemAction}
                />
              )
            })
          )}
        </div>
      )}
    </div>
  )
} 