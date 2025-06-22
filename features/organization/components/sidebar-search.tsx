'use client'

import React from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface SidebarSearchProps {
  searchQuery: string
  onSearchChange: (value: string) => void
}

export function SidebarSearch({ searchQuery, onSearchChange }: SidebarSearchProps) {
  return (
    <div className="px-3 pb-2 flex-shrink-0">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  )
} 