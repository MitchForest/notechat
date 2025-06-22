'use client'

import React, { createContext, useContext, useState } from 'react'

// More explicit view configuration
export interface ViewConfig {
  primary: 'chat' | 'note' | 'empty'
  secondary?: 'chat' | 'note' | null
  primarySize?: number // percentage for resizable panels
}

export interface OpenItem {
  id: string
  type: 'chat' | 'note'
  title?: string
}

export interface AppShellContextType {
  // View configuration
  viewConfig: ViewConfig
  setViewConfig: (config: ViewConfig) => void
  
  // What's currently open
  activeChat: OpenItem | null
  activeNote: OpenItem | null
  setActiveChat: (chat: OpenItem | null) => void
  setActiveNote: (note: OpenItem | null) => void
  
  // UI state
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  secondaryPanelCollapsed: boolean
  setSecondaryPanelCollapsed: (collapsed: boolean) => void
  
  // Helper methods
  openChat: (chat: OpenItem) => void
  openNote: (note: OpenItem) => void
  closeSecondary: () => void
  closeChat: () => void
  closeNote: () => void
  closePrimary: () => void
}

export const AppShellContext = createContext<AppShellContextType | null>(null)

// Custom hook for easier usage
export function useAppShell() {
  const context = useContext(AppShellContext)
  if (!context) {
    throw new Error('useAppShell must be used within AppShellProvider')
  }
  return context
}

// Provider implementation
export function AppShellProvider({ children }: { children: React.ReactNode }) {
  const [viewConfig, setViewConfig] = useState<ViewConfig>({ primary: 'empty' })
  const [activeChat, setActiveChat] = useState<OpenItem | null>(null)
  const [activeNote, setActiveNote] = useState<OpenItem | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [secondaryPanelCollapsed, setSecondaryPanelCollapsed] = useState(false)
  
  // Helper: Open chat (determines primary/secondary based on current state)
  const openChat = (chat: OpenItem) => {
    if (viewConfig.primary === 'empty' || viewConfig.primary === 'chat') {
      setViewConfig({ primary: 'chat' })
      setActiveChat(chat)
    } else {
      setViewConfig({ ...viewConfig, secondary: 'chat' })
      setActiveChat(chat)
    }
  }
  
  // Helper: Open note (determines primary/secondary based on current state)
  const openNote = (note: OpenItem) => {
    if (viewConfig.primary === 'empty' || viewConfig.primary === 'note') {
      setViewConfig({ primary: 'note' })
      setActiveNote(note)
    } else {
      setViewConfig({ ...viewConfig, secondary: 'note' })
      setActiveNote(note)
    }
  }
  
  const closeSecondary = () => {
    setViewConfig({ ...viewConfig, secondary: null })
  }
  
  // Helper: Close chat
  const closeChat = () => {
    if (viewConfig.primary === 'chat') {
      // If chat is primary and there's a secondary, promote secondary to primary
      if (viewConfig.secondary) {
        setViewConfig({ primary: viewConfig.secondary })
      } else {
        // No secondary, go to empty
        setViewConfig({ primary: 'empty' })
      }
    } else if (viewConfig.secondary === 'chat') {
      // Chat is secondary, just remove it
      setViewConfig({ ...viewConfig, secondary: null })
    }
    setActiveChat(null)
  }
  
  // Helper: Close note
  const closeNote = () => {
    if (viewConfig.primary === 'note') {
      // If note is primary and there's a secondary, promote secondary to primary
      if (viewConfig.secondary) {
        setViewConfig({ primary: viewConfig.secondary })
      } else {
        // No secondary, go to empty
        setViewConfig({ primary: 'empty' })
      }
    } else if (viewConfig.secondary === 'note') {
      // Note is secondary, just remove it
      setViewConfig({ ...viewConfig, secondary: null })
    }
    setActiveNote(null)
  }
  
  // Helper: Close primary panel (whatever it is)
  const closePrimary = () => {
    if (viewConfig.secondary) {
      // Promote secondary to primary
      setViewConfig({ primary: viewConfig.secondary })
    } else {
      // No secondary, go to empty
      setViewConfig({ primary: 'empty' })
    }
    
    // Clear the appropriate active item
    if (viewConfig.primary === 'chat') {
      setActiveChat(null)
    } else if (viewConfig.primary === 'note') {
      setActiveNote(null)
    }
  }
  
  return (
    <AppShellContext.Provider 
      value={{
        viewConfig,
        setViewConfig,
        activeChat,
        activeNote,
        setActiveChat,
        setActiveNote,
        sidebarCollapsed,
        setSidebarCollapsed,
        secondaryPanelCollapsed,
        setSecondaryPanelCollapsed,
        openChat,
        openNote,
        closeSecondary,
        closeChat,
        closeNote,
        closePrimary,
      }}
    >
      {children}
    </AppShellContext.Provider>
  )
} 