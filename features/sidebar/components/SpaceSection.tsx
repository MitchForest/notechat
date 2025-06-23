'use client'

import React from 'react'
import { ChevronRight, ChevronDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Space, Collection, SmartCollection, Note, Chat } from '@/lib/db/schema'
import { SidebarItem } from './SidebarItem'
import { CollectionItem } from './CollectionItem'
import { SmartCollectionItem } from './SmartCollectionItem'
import { useSidebarStore } from '../stores/sidebar-store'
import { HoverActions } from '@/features/organization/components/hover-actions'

interface SpaceSectionProps {
  space: Space
  collections: Collection[]
  smartCollections: SmartCollection[]
  items: (Note | Chat)[]
  onSpaceClick: () => void
  onSpaceAction?: (action: string, spaceId: string) => void
  onCollectionAction?: (action: string, collectionId: string) => void
  onSmartCollectionAction?: (action: string, collectionId: string) => void
  onItemClick: (item: Note | Chat, type: 'note' | 'chat') => void
  onItemAction: (action: string, itemId: string) => void
  onNewCollection?: () => void
}

export function SpaceSection({
  space,
  collections,
  smartCollections,
  items,
  onSpaceClick,
  onSpaceAction,
  onCollectionAction,
  onSmartCollectionAction,
  onItemClick,
  onItemAction,
  onNewCollection
}: SpaceSectionProps) {
  const isActive = useSidebarStore((state) => state.isActive(space.id))
  const isExpanded = useSidebarStore((state) => state.isExpanded(space.id))
  const toggleExpanded = useSidebarStore((state) => state.toggleExpanded)
  
  return (
    <div className="space-y-1">
      {/* Space header */}
      <div className="group relative flex items-center gap-1">
        <button
          onClick={() => {
            onSpaceClick()
            toggleExpanded(space.id)
          }}
          className={cn(
            "flex-1 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium",
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
          <span className="text-lg">{space.emoji || '📁'}</span>
          <span className="truncate">{space.name}</span>
        </button>
        
        {/* Hover actions for non-system spaces */}
        {space.type !== 'system' && onSpaceAction && (
          <div 
            className="absolute right-2 top-1/2 -translate-y-1/2 transition-opacity duration-200 hover-actions"
            onClick={(e) => e.stopPropagation()} // Prevent parent click
            onMouseDown={(e) => e.stopPropagation()} // Prevent mousedown bubbling
            style={{ opacity: 1 }} // Force visible for debugging
          >
            <HoverActions
              variant="space"
              onRename={() => onSpaceAction('rename', space.id)}
              onDelete={() => onSpaceAction('delete', space.id)}
              onChangeEmoji={() => onSpaceAction('changeEmoji', space.id)}
            />
          </div>
        )}
      </div>
      
      {/* Collapsible content using CSS Grid */}
      <div
        className="collapsible-content"
        data-expanded={isExpanded}
        aria-hidden={!isExpanded}
      >
        <div className="collapsible-inner">
          <div className="ml-6 space-y-0.5">
            {/* Smart Collections */}
            {smartCollections.map((smartCollection) => (
              <SmartCollectionItem
                key={smartCollection.id}
                smartCollection={smartCollection}
                onSmartCollectionClick={() => {
                  useSidebarStore.getState().setActiveItem(smartCollection.id, 'smartCollection')
                }}
                onAction={onSmartCollectionAction}
                onItemClick={onItemClick}
                onItemAction={onItemAction}
              />
            ))}
            
            {/* Regular Collections */}
            {collections.map((collection) => (
              <CollectionItem
                key={collection.id}
                collection={collection}
                onCollectionClick={() => {
                  useSidebarStore.getState().setActiveItem(collection.id, 'collection')
                }}
                onAction={onCollectionAction}
                onItemClick={onItemClick}
                onItemAction={onItemAction}
              />
            ))}
            
            {/* New Collection Button */}
            {onNewCollection && (
              <button
                onClick={onNewCollection}
                className="sidebar-new-button"
              >
                <Plus className="h-3 w-3" />
                <span>New Collection</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 