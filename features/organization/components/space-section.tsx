'use client'

import React from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Space } from '@/lib/db/schema'
import { HoverActions } from './hover-actions'
import { AnimatedCollapse } from './animated-collapse'

interface SpaceSectionProps {
  space: Space
  isExpanded: boolean
  isActive?: boolean
  onToggle: () => void
  onClick?: () => void
  onAction?: (action: string, spaceId: string) => void
  children: React.ReactNode
}

export const SpaceSection = React.memo(({ 
  space,
  isExpanded,
  isActive = false,
  onToggle,
  onClick,
  onAction,
  children
}: SpaceSectionProps) => {
  const isSystemSpace = space.type === 'system'
  
  return (
    <div className={cn(
      "mb-2 group",
      isActive && "sidebar-item-active-accent"
    )}>
      <div className="flex items-center gap-1">
        <button
          className={cn(
            "flex-1 flex items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium",
            "transition-colors duration-150",
            !isActive && "hover:bg-hover-1"
          )}
          onClick={(e) => {
            e.stopPropagation()
            onClick?.()
            onToggle()
          }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-base">{space.emoji}</span>
            <span className="truncate">{space.name}</span>
          </div>
          {isExpanded ? 
            <ChevronDown className="h-4 w-4 flex-shrink-0 ml-2" /> : 
            <ChevronRight className="h-4 w-4 flex-shrink-0 ml-2" />
          }
        </button>
        
        {/* Hover actions for non-system spaces - outside button */}
        {!isSystemSpace && onAction && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <HoverActions
              variant="space"
              onRename={() => onAction('rename', space.id)}
              onChangeEmoji={() => onAction('changeEmoji', space.id)}
              onDelete={() => onAction('delete', space.id)}
            />
          </div>
        )}
      </div>
      
      {/* Animated expand/collapse for children */}
      <AnimatedCollapse isOpen={isExpanded}>
        {children}
      </AnimatedCollapse>
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