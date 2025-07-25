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
import { AnimatedCollapse } from './animated-collapse'
import { isChatId } from '@/lib/utils/id-generator'

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
    return isChatId(item.id) ? 'chat' : 'note'
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
      <div className={cn(
        "group flex items-center gap-1",
        isActive && "sidebar-item-active-accent"
      )}>
        <button
          className={cn(
            "flex-1 flex items-center justify-between rounded-md px-2 py-1.5 text-sm",
            "transition-colors duration-150",
            !isActive && "hover:bg-hover-1"
          )}
          onClick={(event) => {
            event.stopPropagation()
            onCollectionClick?.(collection.id)
            onToggle(collection.id)
          }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Icon className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{collection.name}</span>
            {itemCount > 0 && (
              <span className="text-xs text-muted-foreground">({itemCount})</span>
            )}
          </div>
          {isExpanded ? 
            <ChevronDown className="h-3 w-3 flex-shrink-0 ml-2" /> : 
            <ChevronRight className="h-3 w-3 flex-shrink-0 ml-2" />
          }
        </button>
        
        {/* Hover actions - outside button to avoid nesting */}
        {onCollectionAction && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <HoverActions
              variant="collection"
              onRename={() => onCollectionAction('rename', collection.id)}
              onDelete={() => onCollectionAction('delete', collection.id)}
              onChangeIcon={() => onCollectionAction('changeIcon', collection.id)}
              onMove={() => onCollectionAction('moveToSpace', collection.id)}
            />
          </div>
        )}
      </div>
      
      {/* Items under collection - animated */}
      <AnimatedCollapse isOpen={isExpanded} className="mt-0.5 ml-4">
        <div className="space-y-0.5">
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
      </AnimatedCollapse>
    </DroppableCollection>
  )
})

SidebarCollectionItem.displayName = 'SidebarCollectionItem' 