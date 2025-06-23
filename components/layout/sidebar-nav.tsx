/**
 * Component: SidebarNav
 * Purpose: Main navigation sidebar - migrated to new architecture
 */
"use client"

import { User as UserType } from '@/lib/db/schema'
import { NewSidebar } from '@/features/sidebar/components/NewSidebar'

interface SidebarNavProps {
  className?: string
  user: UserType
}

export function SidebarNav({ className, user }: SidebarNavProps) {
  return <NewSidebar className={className} user={user} />
} 