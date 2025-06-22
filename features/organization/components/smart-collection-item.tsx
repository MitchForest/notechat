'use client'

import React from 'react'
import { Lock, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SmartCollection } from '@/lib/db/schema'
import { getCollectionIcon } from '@/features/organization/lib/collection-icons'

interface SmartCollectionItemProps {
  smartCollection: SmartCollection
  isActive: boolean
  onClick: () => void
  onContextMenu?: (e: React.MouseEvent) => void
}

export function SmartCollectionItem({ 
  smartCollection, 
  isActive, 
  onClick,
  onContextMenu
}: SmartCollectionItemProps) {
  const Icon = getCollectionIcon(smartCollection.icon) as LucideIcon
  
  return (
    <button
      className={cn(
        "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-hover-1",
        isActive && "bg-hover-2"
      )}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <Icon className="h-4 w-4" />
      <span>{smartCollection.name}</span>
      {smartCollection.isProtected && (
        <Lock className="h-3 w-3 ml-auto text-muted-foreground" />
      )}
    </button>
  )
} 