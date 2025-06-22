'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'

interface DraggableItemProps {
  id: string
  data: Record<string, unknown>
  children: React.ReactNode
  className?: string
}

export function DraggableItem({ id, data, children, className }: DraggableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(className, isDragging && 'cursor-grabbing')}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  )
} 