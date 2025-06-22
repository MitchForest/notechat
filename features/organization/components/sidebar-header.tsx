'use client'

import React from 'react'
import { PanelLeft, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface SidebarHeaderProps {
  collapsed: boolean
  onToggleCollapse: () => void
}

export function SidebarHeader({ collapsed, onToggleCollapse }: SidebarHeaderProps) {
  if (collapsed) {
    return (
      <div className="p-3 border-b flex-shrink-0">
        <div className="flex items-center justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                className="w-8 h-8 p-0"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Expand sidebar</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="text-center mt-2">
          <span className="text-xs font-bold text-primary">
            NC
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 border-b flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="font-bold text-primary-foreground">NC</span>
          </div>
          <span className="font-semibold text-lg">NoteChat</span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="w-8 h-8 p-0"
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Collapse sidebar</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
} 