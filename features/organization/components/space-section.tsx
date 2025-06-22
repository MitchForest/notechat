'use client'

import React from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Space } from '@/lib/db/schema'

interface SpaceSectionProps {
  space: Space
  isExpanded: boolean
  onToggle: () => void
  children: React.ReactNode
}

export const SpaceSection = React.memo(({ 
  space,
  isExpanded,
  onToggle,
  children
}: SpaceSectionProps) => {
  return (
    <div className="mb-2">
      <button
        className={cn(
          "w-full flex items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium",
          "hover:bg-hover-2"
        )}
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{space.emoji}</span>
          <span>{space.name}</span>
        </div>
        {isExpanded ? 
          <ChevronDown className="h-4 w-4" /> : 
          <ChevronRight className="h-4 w-4" />
        }
      </button>
      
      {isExpanded && children}
    </div>
  )
}, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.space.id === nextProps.space.id &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.space.name === nextProps.space.name &&
    prevProps.space.emoji === nextProps.space.emoji
  )
})

SpaceSection.displayName = 'SpaceSection' 