'use client'

import React from 'react'
import { Lock, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SmartCollection } from '@/lib/db/schema'
import { getCollectionIcon } from '@/features/organization/lib/collection-icons'
import { HoverActions } from './hover-actions'

interface SmartCollectionItemProps {
  smartCollection: SmartCollection
  isActive: boolean
  onClick: () => void
  onAction?: (action: string, collectionId: string) => void
}

export function SmartCollectionItem({ 
  smartCollection, 
  isActive, 
  onClick,
  onAction
}: SmartCollectionItemProps) {
  const Icon = getCollectionIcon(smartCollection.icon) as LucideIcon
  
  return (
    <div className="group relative flex items-center">
      <button
        className={cn(
          "flex-1 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-hover-1",
          isActive && "bg-hover-2"
        )}
        onClick={onClick}
      >
        <Icon className="h-4 w-4" />
        <span className="flex-1 text-left">{smartCollection.name}</span>
        {smartCollection.isProtected && (
          <Lock className="h-3 w-3 text-muted-foreground" />
        )}
      </button>
      
      {/* Hover actions for non-protected smart collections */}
      {!smartCollection.isProtected && onAction && (
        <HoverActions
          variant="collection"
          onRename={() => onAction('rename', smartCollection.id)}
          onDelete={() => onAction('delete', smartCollection.id)}
          className="absolute right-1"
        />
      )}
    </div>
  )
} 