'use client'

import React, { useMemo } from 'react'
import { ChevronDown, ChevronRight, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Note, Chat, Collection, Space } from '@/lib/db/schema'
import { getCollectionIcon } from '@/features/organization/lib/collection-icons'
import { DroppableCollection } from './droppable-collection'
import { DraggableNoteItem } from './draggable-note-item'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDragDrop } from '../hooks/use-drag-drop'
import { HoverActions } from './hover-actions'

interface SidebarCollectionItemProps {
  collection: Collection
  space: Space
  items: (Note | Chat)[]
  isExpanded: boolean
  isActive?: boolean
  onToggle: (collectionId: string) => void
  onCollectionClick?: (collectionId: string) => void
  onItemClick: (item: Note | Chat, type: 'note' | 'chat') => void
  onItemAction: (action: string, itemId: string) => void
  onCollectionAction?: (action: string, collectionId: string) => void
  getFilteredItems: (collection: Collection) => (Note | Chat)[]
  chats: Chat[]
}

export const SidebarCollectionItem = React.memo(({
  collection,
  space,
  items,
  isExpanded,
  isActive = false,
  onToggle,
  onCollectionClick,
  onItemClick,
  onItemAction,
  onCollectionAction,
  getFilteredItems,
  chats,
}: SidebarCollectionItemProps) => {
  const dragDropHook = useDragDrop()
  
  // Helper to determine if an item is a chat or note
  const getItemType = (item: Note | Chat): 'note' | 'chat' => {
    return chats.some(chat => chat.id === item.id) ? 'chat' : 'note'
  }
  
  const filteredItems = useMemo(
    () => getFilteredItems(collection),
    [getFilteredItems, collection]
  )
  const itemCount = filteredItems.length
  
  // Create drop data for this collection
  const dropData = dragDropHook.createDropData({
    id: collection.id,
    type: 'collection',
    spaceId: space.id,
    spaceType: space.type,
    collectionType: collection.type,
    acceptsType: 'both', // Collections can now accept both notes and chats
    name: collection.name,
  })

  const Icon = getCollectionIcon(collection.icon || 'folder') as LucideIcon

  return (
    <DroppableCollection 
      id={collection.id} 
      data={dropData}
      dropIndicator={dragDropHook.dropIndicator}
    >
      <div className="group relative flex items-center">
        <button
          className={cn(
            "flex-1 flex items-center justify-between rounded-md px-2 py-1.5 text-sm",
            "hover:bg-hover-1",
            isActive && "bg-hover-1"
          )}
          onClick={(event) => {
            event.stopPropagation()
            onToggle(collection.id)
            onCollectionClick?.(collection.id)
          }}
        >
          <div className="flex items-center gap-2 flex-1">
            <Icon className="h-3 w-3" />
            <span>{collection.name}</span>
            {itemCount > 0 && (
              <span className="text-xs text-muted-foreground">({itemCount})</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {itemCount > 0 && (
              isExpanded ? 
                <ChevronDown className="h-3 w-3" /> : 
                <ChevronRight className="h-3 w-3" />
            )}
          </div>
        </button>
        
        {/* Hover actions */}
        {onCollectionAction && (
          <HoverActions
            variant="collection"
            onRename={() => onCollectionAction('rename', collection.id)}
            onDelete={() => onCollectionAction('delete', collection.id)}
            onMove={() => onCollectionAction('moveToSpace', collection.id)}
            className="absolute right-7"
          />
        )}
      </div>
      
      {/* Items under collection */}
      {isExpanded && (
        <div className="mt-0.5 ml-5 space-y-0.5">
          {itemCount === 0 ? (
            <div className="text-xs text-muted-foreground px-2 py-1">
              No items in this collection
            </div>
          ) : (
            <SortableContext
              items={filteredItems.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {filteredItems.map((item) => {
                const itemType = getItemType(item)
                  
                const dragData = dragDropHook.createDragData({
                  id: item.id,
                  type: itemType,
                  title: item.title,
                  collectionId: item.collectionId,
                  isStarred: item.isStarred ?? false,
                })
                
                return (
                  <DraggableNoteItem
                    key={item.id}
                    item={item}
                    itemType={itemType}
                    dragData={dragData}
                    onItemClick={onItemClick}
                    onItemAction={onItemAction}
                  />
                )
              })}
            </SortableContext>
          )}
        </div>
      )}
    </DroppableCollection>
  )
})

SidebarCollectionItem.displayName = 'SidebarCollectionItem' 