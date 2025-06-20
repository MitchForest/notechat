/**
 * Layout: Canvas - App Shell
 * Purpose: Main application shell with proper layout management
 * Features:
 * - Collapsible sidebar that doesn't break layout
 * - Flexible main content area
 * - Proper state management for different view modes
 * 
 * Modified: 2024-12-19 - Complete rewrite as app shell
 */
'use client'

import React from 'react'
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { CommandPalette } from "@/components/command-palette"
import { AppShellProvider, useAppShell } from "@/lib/app-shell-context"

function AppShellLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useAppShell()

      return (
      <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar - Fixed width, doesn't affect main content */}
      <div className={`h-full flex-shrink-0 transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        <SidebarNav />
      </div>
      
      {/* Main Content Area - Takes remaining space */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
      
      <CommandPalette />
    </div>
  )
}

export default function CanvasLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppShellProvider>
      <AppShellLayout>
        {children}
      </AppShellLayout>
    </AppShellProvider>
  )
} 