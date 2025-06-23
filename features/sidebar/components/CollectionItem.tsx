'use client'

import React from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Collection, Note, Chat } from '@/lib/db/schema'
import { SidebarItem } from './SidebarItem'
import { useSidebarStore } from '../stores/sidebar-store'
import { HoverActions } from '@/features/organization/components/hover-actions'
import { getCollectionIcon } from '@/features/organization/lib/collection-icons'
import { useCollectionItems } from '../hooks/useCollectionItems'
import { isChatId } from '@/lib/utils/id-generator'

interface CollectionItemProps {
  collection: Collection
  onCollectionClick: () => void
  onAction?: (action: string, collectionId: string) => void
  onItemClick: (item: Note | Chat, type: 'note' | 'chat') => void
  onItemAction: (action: string, itemId: string) => void
}

export function CollectionItem({
  collection,
  onCollectionClick,
  onAction,
  onItemClick,
  onItemAction
}: CollectionItemProps) {
  const isActive = useSidebarStore((state) => state.isActive(collection.id))
  const isExpanded = useSidebarStore((state) => state.isExpanded(collection.id))
  const toggleExpanded = useSidebarStore((state) => state.toggleExpanded)
  const items = useCollectionItems(collection.id)
  
  const Icon = getCollectionIcon(collection.icon || 'folder')
  
  return (
    <div className="group">
      {/* Header with hover actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => {
            onCollectionClick()
            toggleExpanded(collection.id)
          }}
          className={cn(
            "flex-1 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
            "transition-colors duration-150",
            isActive && "sidebar-item-active-accent",
            !isActive && "hover:bg-hover-1"
          )}
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
          )}
          <Icon className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
          <span className="truncate">{collection.name}</span>
          {items.length > 0 && (
            <span className="text-xs text-muted-foreground">({items.length})</span>
          )}
        </button>
        
        {/* Hover actions */}
              {onAction && (
        <div 
          className="absolute right-2 top-1/2 -translate-y-1/2 transition-opacity duration-200 hover-actions"
          onClick={(e) => e.stopPropagation()} // Prevent parent click
          onMouseDown={(e) => e.stopPropagation()} // Prevent mousedown bubbling
          style={{ opacity: 1 }} // Force visible for debugging
        >
          <HoverActions
            variant="collection"
            onRename={() => onAction('rename', collection.id)}
            onDelete={() => onAction('delete', collection.id)}
            onChangeIcon={() => onAction('changeIcon', collection.id)}
            onMove={() => onAction('moveToSpace', collection.id)}
          />
        </div>
      )}
      </div>
      
      {/* Collapsible content */}
      <div
        className="collapsible-content"
        data-expanded={isExpanded}
        aria-hidden={!isExpanded}
      >
        <div className="collapsible-inner">
          <div className="ml-6 space-y-0.5">
            {items.length === 0 ? (
              <div className="sidebar-empty-state">
                No items in this collection
              </div>
            ) : (
              items.map((item: Note | Chat) => {
                const itemType = isChatId(item.id) ? 'chat' : 'note'
                return (
                  <SidebarItem
                    key={item.id}
                    id={item.id}
                    type={itemType}
                    title={item.title}
                    isStarred={item.isStarred ?? false}
                    onClick={() => onItemClick(item, itemType)}
                    onAction={onItemAction}
                    indent={1}
                  />
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 