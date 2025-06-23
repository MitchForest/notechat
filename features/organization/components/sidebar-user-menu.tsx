'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { User, Settings, LogOut, Sun, Moon, Sparkles } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { User as UserType } from '@/lib/db/schema'
import { getInitials } from '@/features/organization/utils/sidebar-helpers'
import { AISettingsDialog } from '@/features/ai/components/ai-settings-dialog'

interface SidebarUserMenuProps {
  user: UserType
  collapsed?: boolean
  onSignOut: () => void
}

export function SidebarUserMenu({ user, collapsed = false, onSignOut }: SidebarUserMenuProps) {
  const { theme, setTheme } = useTheme()
  const [showAISettings, setShowAISettings] = useState(false)

  const trigger = (
    <Button variant="ghost" size={collapsed ? "sm" : "default"} className={collapsed ? "w-full p-0" : "w-full justify-start text-left"}>
      {collapsed ? (
        user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt={user.name || user.email}
            width={24}
            height={24}
            className="h-6 w-6 rounded-full"
          />
        ) : (
          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
            {getInitials(user.name, user.email)}
          </div>
        )
      ) : (
        <div className="flex items-center">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.name || user.email}
              width={24}
              height={24}
              className="h-6 w-6 rounded-full mr-2"
            />
          ) : (
            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center mr-2 text-xs font-bold">
              {getInitials(user.name, user.email)}
            </div>
          )}
          <div className="flex flex-col truncate">
            <span className="text-sm font-medium truncate">
              {user.name || user.email}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {user.email}
            </span>
          </div>
        </div>
      )}
    </Button>
  )

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {trigger}
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowAISettings(true)}>
            <Sparkles className="mr-2 h-4 w-4" />
            AI Commands
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? (
              <>
                <Sun className="mr-2 h-4 w-4" />
                Light Mode
              </>
            ) : (
              <>
                <Moon className="mr-2 h-4 w-4" />
                Dark Mode
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <AISettingsDialog open={showAISettings} onOpenChange={setShowAISettings} />
    </>
  )
} 