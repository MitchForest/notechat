'use client'

import React from 'react'
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { CommandPalette } from "@/components/command-palette"
import { AppShellProvider, useAppShell } from "@/lib/app-shell-context"
import { UserMenu } from "@/components/auth/user-menu"
import type { User } from '@/lib/db/schema'

function AppShellClientLayout({ children, user }: { children: React.ReactNode, user: User }) {
  const { sidebarCollapsed } = useAppShell()

      return (
      <div className="flex h-screen bg-background text-foreground overflow-hidden">
        <div className={`h-full flex-shrink-0 transition-all duration-300 ${
            sidebarCollapsed ? 'w-16' : 'w-64'
        }`}>
            <SidebarNav />
        </div>
      
        <div className="flex-1 flex flex-col overflow-hidden">
            <header className="flex h-14 items-center justify-end border-b px-4 flex-shrink-0">
                <UserMenu user={user} />
            </header>
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
      
      <CommandPalette />
    </div>
  )
}

export default function CanvasShell({ children, user }: { children: React.ReactNode, user: User }) {
    return (
        <AppShellProvider>
            <AppShellClientLayout user={user}>
                {children}
            </AppShellClientLayout>
        </AppShellProvider>
    )
} 