'use client'

import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export function SidebarSkeleton() {
  return (
    <div className="space-y-2 p-2">
      {/* System space skeleton */}
      <div className="space-y-1">
        <Skeleton className="h-8 w-full rounded-md" />
        {/* Collections under space */}
        <div className="ml-5 space-y-1">
          <Skeleton className="h-7 w-4/5 rounded-md" />
          <Skeleton className="h-7 w-3/5 rounded-md" />
        </div>
      </div>
      
      {/* User space skeleton */}
      <div className="space-y-1">
        <Skeleton className="h-8 w-full rounded-md" />
        <div className="ml-5 space-y-1">
          <Skeleton className="h-7 w-3/4 rounded-md" />
          <Skeleton className="h-7 w-1/2 rounded-md" />
        </div>
      </div>
      
      {/* Another user space */}
      <div className="space-y-1">
        <Skeleton className="h-8 w-4/5 rounded-md" />
      </div>
    </div>
  )
} 