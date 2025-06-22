'use client'

import React from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Space } from '@/lib/db/schema'
import { HoverActions } from './hover-actions'

interface SpaceSectionProps {
  space: Space
  isExpanded: boolean
  isActive?: boolean
  onToggle: () => void
  onAction?: (action: string, spaceId: string) => void
  children: React.ReactNode
}

export const SpaceSection = React.memo(({ 
  space,
  isExpanded,
  isActive = false,
  onToggle,
  onAction,
  children
}: SpaceSectionProps) => {
  const isSystemSpace = space.type === 'system'
  
  return (
    <div className="mb-2 group">
      <div className="relative flex items-center">
        <button
          className={cn(
            "flex-1 flex items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium",
            "hover:bg-hover-2",
            isActive && "bg-hover-1"
          )}
          onClick={onToggle}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">{space.emoji}</span>
            <span>{space.name}</span>
          </div>
          <div className="flex items-center gap-1">
            {isExpanded ? 
              <ChevronDown className="h-4 w-4" /> : 
              <ChevronRight className="h-4 w-4" />
            }
          </div>
        </button>
        
        {/* Hover actions for non-system spaces */}
        {!isSystemSpace && onAction && (
          <HoverActions
            variant="space"
            onRename={() => onAction('rename', space.id)}
            onChangeEmoji={() => onAction('changeEmoji', space.id)}
            onDelete={() => onAction('delete', space.id)}
            className="absolute right-8"
          />
        )}
      </div>
      
      {isExpanded && children}
    </div>
  )
}, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.space.id === nextProps.space.id &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.space.name === nextProps.space.name &&
    prevProps.space.emoji === nextProps.space.emoji
  )
})

SpaceSection.displayName = 'SpaceSection' 