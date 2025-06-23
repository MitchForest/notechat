'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export function SidebarSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {/* Space skeleton */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-1">
          {/* Space header */}
          <div className="flex items-center gap-2 p-2">
            <div className="w-3 h-3 sidebar-skeleton rounded" />
            <div className="w-6 h-6 sidebar-skeleton rounded" />
            <div className="h-4 flex-1 sidebar-skeleton rounded" />
          </div>
          
          {/* Collections under space */}
          <div className="ml-4 space-y-1">
            {[1, 2].map((j) => (
              <div key={j} className="flex items-center gap-2 p-2">
                <div className="w-3 h-3 sidebar-skeleton rounded" />
                <div className="w-3.5 h-3.5 sidebar-skeleton rounded" />
                <div className="h-3 flex-1 sidebar-skeleton rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function SidebarItemSkeleton() {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5">
      <div className="w-3.5 h-3.5 sidebar-skeleton rounded" />
      <div className="h-3 flex-1 sidebar-skeleton rounded" />
    </div>
  )
} 