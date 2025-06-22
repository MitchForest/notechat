'use client'

import React from 'react'
import { DragOverlay } from '@dnd-kit/core'
import { FileText, MessageSquare, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DragPreviewProps {
  item: {
    id: string
    title: string
    type: 'note' | 'chat'
    isStarred?: boolean
  } | null
}

export function DragPreview({ item }: DragPreviewProps) {
  if (!item) return null

  const Icon = item.type === 'note' ? FileText : MessageSquare

  return (
    <DragOverlay>
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md",
        "bg-background border shadow-lg",
        "opacity-90 cursor-grabbing"
      )}>
        <Icon className="h-4 w-4 text-muted-foreground" />
        {item.isStarred && <Star className="h-3 w-3 fill-current text-yellow-500" />}
        <span className="text-sm truncate max-w-[200px]">{item.title}</span>
      </div>
    </DragOverlay>
  )
} 