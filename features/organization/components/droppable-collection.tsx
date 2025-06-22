'use client'

import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { useDropZone } from '../hooks/use-drag-drop'
import { DropIndicator } from '../types/drag-drop'

interface DroppableCollectionProps {
  id: string
  data: Record<string, unknown>
  children: React.ReactNode
  className?: string
  dropIndicator: DropIndicator
}

export function DroppableCollection({ 
  id, 
  data, 
  children, 
  className,
  dropIndicator 
}: DroppableCollectionProps) {
  const { setNodeRef } = useDroppable({
    id,
    data,
  })
  
  const { isOver, canDrop, dropZoneProps } = useDropZone(id, dropIndicator)

  return (
    <div
      ref={setNodeRef}
      className={cn(
        className,
        'transition-colors duration-200',
        isOver && canDrop && 'bg-primary/10 ring-2 ring-primary/50',
        isOver && !canDrop && 'bg-destructive/10 ring-2 ring-destructive/50'
      )}
      {...dropZoneProps}
    >
      {children}
    </div>
  )
} 