'use client'

import React from 'react'
import { ChevronDown, ChevronRight, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SmartCollection, Note, Chat } from '@/lib/db/schema'
import { getCollectionIcon } from '@/features/organization/lib/collection-icons'
import { HoverActions } from './hover-actions'
import { DraggableNoteItem } from './draggable-note-item'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { AnimatedCollapse } from './animated-collapse'
import { isChatId } from '@/lib/utils/id-generator'

interface SmartCollectionItemProps {
  smartCollection: SmartCollection
  isActive: boolean
  isExpanded: boolean
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
  items,
  onToggle,
  onClick,
  onAction,
  onItemClick,
  onItemAction
}: SmartCollectionItemProps) {
  const Icon = getCollectionIcon(smartCollection.icon) as LucideIcon
  const [isDragOver, setIsDragOver] = React.useState(false)
  
  // Helper to determine if an item is a chat or note
  const getItemType = (item: Note | Chat): 'note' | 'chat' => {
    return isChatId(item.id) ? 'chat' : 'note'
  }
  
  const content = (
    <div 
      className={cn(
        "group relative",
        isActive && "sidebar-item-active-accent"
      )}
      onDragEnter={() => setIsDragOver(true)}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={() => setIsDragOver(false)}
    >
      <div className="flex items-center gap-1">
        <button
          className={cn(
            "flex-1 flex items-center justify-between rounded-md px-2 py-1.5 text-sm",
            "transition-colors duration-150",
            !isActive && "hover:bg-hover-1",
            isDragOver && "bg-destructive/10 cursor-not-allowed"
          )}
          onClick={(e) => {
            e.stopPropagation()
            onClick()
            onToggle()
          }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Icon className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="flex-1 text-left truncate">
              {smartCollection.name} <span className="text-xs text-muted-foreground">({items.length})</span>
            </span>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 flex-shrink-0 ml-2" />
          ) : (
            <ChevronRight className="h-3 w-3 flex-shrink-0 ml-2" />
          )}
        </button>
        
        {/* Hover actions for non-protected smart collections - outside button */}
        {!smartCollection.isProtected && onAction && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <HoverActions
              variant="smart-collection"
              onRename={() => onAction('rename', smartCollection.id)}
              onDelete={() => onAction('delete', smartCollection.id)}
              onChangeIcon={() => onAction('changeIcon', smartCollection.id)}
            />
          </div>
        )}
      </div>
      
      {/* Expanded content - animated */}
      <AnimatedCollapse isOpen={isExpanded} className="mt-0.5 ml-4">
        <div className="space-y-0.5">
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
      </AnimatedCollapse>
    </div>
  )
  
  if (isDragOver) {
    return (
      <TooltipProvider>
        <Tooltip open={true}>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Smart collections are filters and cannot accept items</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
  
  return content
} 