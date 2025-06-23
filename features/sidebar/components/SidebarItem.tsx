'use client'

import React, { useCallback } from 'react'
import { FileText, MessageSquare, Folder, Filter, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebarStore } from '../stores/sidebar-store'
import { HoverActions } from '@/features/organization/components/hover-actions'
import type { Note, Chat } from '@/lib/db/schema'

type ItemType = 'note' | 'chat' | 'collection' | 'smartCollection'

interface SidebarItemProps {
  id: string
  type: ItemType
  title: string
  icon?: string
  isStarred?: boolean
  onClick?: () => void
  onAction?: (action: string, itemId: string) => void
  className?: string
  indent?: number
}

const getItemIcon = (type: ItemType, icon?: string) => {
  switch (type) {
    case 'note':
      return FileText
    case 'chat':
      return MessageSquare
    case 'collection':
      return Folder
    case 'smartCollection':
      return Filter
    default:
      return FileText
  }
}

export function SidebarItem({
  id,
  type,
  title,
  icon,
  isStarred = false,
  onClick,
  onAction,
  className,
  indent = 0
}: SidebarItemProps) {
  const isActive = useSidebarStore((state) => state.isActive(id))
  const setActiveItem = useSidebarStore((state) => state.setActiveItem)
  
  const handleClick = useCallback(() => {
    setActiveItem(id, type as any)
    onClick?.()
  }, [id, type, setActiveItem, onClick])
  
  const Icon = getItemIcon(type, icon)
  
  return (
    <div className="group relative flex items-center">
      <button
        onClick={handleClick}
        className={cn(
          "flex-1 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
          "transition-all duration-200",
          isActive && "sidebar-item-active",
          !isActive && "hover:bg-hover-1",
          className
        )}
        style={{ paddingLeft: `${8 + indent * 16}px` }}
        data-active={isActive}
      >
        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="flex-1 truncate text-left">{title}</span>
        {isStarred && (
          <Star className="h-3 w-3 flex-shrink-0 fill-current text-yellow-500" />
        )}
      </button>
      
      {/* Hover actions for notes and chats */}
      {(type === 'note' || type === 'chat') && onAction && (
        <div 
          className="absolute right-2 top-1/2 -translate-y-1/2 transition-opacity duration-200 hover-actions"
          onClick={(e) => e.stopPropagation()} // Prevent parent click
          onMouseDown={(e) => e.stopPropagation()} // Prevent mousedown bubbling
          style={{ opacity: 1 }} // Force visible for debugging
        >
          <HoverActions
            variant="item"
            onOpen={() => onAction('open', id)}
            onRename={() => onAction('rename', id)}
            onStar={() => onAction('star', id)}
            onMove={() => onAction('move', id)}
            onDuplicate={() => onAction('duplicate', id)}
            onDelete={() => onAction('delete', id)}
            isStarred={isStarred}
          />
        </div>
      )}
    </div>
  )
} 