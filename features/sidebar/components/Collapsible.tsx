'use client'

import React, { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useSidebarStore } from '../stores/sidebar-store'

interface CollapsibleProps {
  id: string
  header: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function Collapsible({ 
  id, 
  header, 
  children, 
  className
}: CollapsibleProps) {
  const isExpanded = useSidebarStore((state) => state.isExpanded(id))
  const toggleExpanded = useSidebarStore((state) => state.toggleExpanded)
  
  return (
    <div className={className}>
      <button
        onClick={() => toggleExpanded(id)}
        className="w-full text-left"
        aria-expanded={isExpanded}
        aria-controls={`${id}-content`}
      >
        {header}
      </button>
      
      <div
        id={`${id}-content`}
        className="collapsible-content"
        data-expanded={isExpanded}
        aria-hidden={!isExpanded}
      >
        <div className="collapsible-inner">
          {children}
        </div>
      </div>
    </div>
  )
} 