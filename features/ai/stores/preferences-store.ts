'use client'

import { create } from 'zustand'
import { AIPreferences } from '@/lib/db/schema'
import { toast } from 'sonner'

const DEFAULT_COMMANDS = [
  { id: 'improve', label: 'Improve writing', icon: 'Edit2', prompt: 'Improve the writing style and clarity' },
  { id: 'shorter', label: 'Make shorter', icon: 'Minimize2', prompt: 'Make this text shorter while keeping the meaning' },
  { id: 'longer', label: 'Make longer', icon: 'Maximize2', prompt: 'Expand this text with more detail' },
  { id: 'fix', label: 'Fix grammar', icon: 'CheckCircle', prompt: 'Fix grammar and spelling errors' },
  { id: 'simplify', label: 'Simplify', icon: 'BookOpen', prompt: 'Simplify this text for easier understanding' },
  { id: 'formal', label: 'Make formal', icon: 'Briefcase', prompt: 'Make this text more formal and professional' },
  { id: 'casual', label: 'Make casual', icon: 'MessageCircle', prompt: 'Make this text more casual and conversational' }
]

export interface Command {
  id: string
  label: string
  icon: string
  prompt: string
  isCustom: boolean
  isHidden?: boolean
}

interface PreferencesStore {
  preferences: AIPreferences | null
  isLoading: boolean
  hasLoaded: boolean
  
  loadPreferences: () => Promise<void>
  savePreferences: (updates: Partial<AIPreferences>) => Promise<void>
  
  getCommands: () => Command[]
  
  addCommand: (command: { label: string; prompt: string; icon?: string }) => Promise<void>
  updateCommand: (id: string, updates: { label?: string; prompt?: string; icon?: string }) => Promise<void>
  deleteCommand: (id: string) => Promise<void>
  toggleDefaultCommand: (id: string) => Promise<void>
  reorderCommands: (commandIds: string[]) => Promise<void>
}

export const usePreferencesStore = create<PreferencesStore>((set, get) => ({
  preferences: null,
  isLoading: false,
  hasLoaded: false,

  loadPreferences: async () => {
    // Only load once per session
    if (get().hasLoaded) return
    
    set({ isLoading: true })
    try {
      const res = await fetch('/api/preferences')
      if (!res.ok) throw new Error('Failed to load preferences')
      
      const data = await res.json()
      set({ preferences: data, isLoading: false, hasLoaded: true })
    } catch (error) {
      console.error('Failed to load preferences:', error)
      set({ isLoading: false, hasLoaded: true })
      // Don't show error toast on initial load - user might not be logged in
    }
  },

  savePreferences: async (updates) => {
    const current = get().preferences || {}
    const updated = { ...current, ...updates }
    
    // Optimistic update
    set({ preferences: updated })
    
    try {
      const res = await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      })
      
      if (!res.ok) throw new Error('Failed to save preferences')
    } catch (error) {
      console.error('Failed to save preferences:', error)
      // Revert on error
      set({ preferences: current })
      toast.error('Failed to save preferences')
    }
  },

  getCommands: () => {
    const { preferences } = get()
    const hiddenIds = preferences?.hiddenDefaultCommands || []
    const commandOrder = preferences?.commandOrder || []
    
    // Filter and merge commands
    const defaultCommands = DEFAULT_COMMANDS
      .filter(cmd => !hiddenIds.includes(cmd.id))
      .map(cmd => ({ ...cmd, isCustom: false, isHidden: false }))
    
    const customCommands = (preferences?.customCommands || [])
      .map(cmd => ({ 
        ...cmd, 
        isCustom: true, 
        isHidden: false,
        icon: cmd.icon || 'Wand2' 
      }))
    
    const allCommands = [...defaultCommands, ...customCommands]
    
    // Sort by order if specified
    if (commandOrder.length > 0) {
      return allCommands.sort((a, b) => {
        const aIndex = commandOrder.indexOf(a.id)
        const bIndex = commandOrder.indexOf(b.id)
        if (aIndex === -1) return 1
        if (bIndex === -1) return -1
        return aIndex - bIndex
      })
    }
    
    return allCommands
  },

  addCommand: async (command) => {
    const { preferences, savePreferences } = get()
    const newCommand = {
      ...command,
      id: `custom_${Date.now()}`,
      order: (preferences?.customCommands?.length || 0) + 1
    }
    
    await savePreferences({
      customCommands: [...(preferences?.customCommands || []), newCommand]
    })
    
    toast.success('Command added')
  },

  updateCommand: async (id, updates) => {
    const { preferences, savePreferences } = get()
    const customCommands = preferences?.customCommands || []
    
    await savePreferences({
      customCommands: customCommands.map(cmd =>
        cmd.id === id ? { ...cmd, ...updates } : cmd
      )
    })
    
    toast.success('Command updated')
  },

  deleteCommand: async (id) => {
    const { preferences, savePreferences } = get()
    
    await savePreferences({
      customCommands: (preferences?.customCommands || []).filter(cmd => cmd.id !== id)
    })
    
    toast.success('Command deleted')
  },

  toggleDefaultCommand: async (id) => {
    const { preferences, savePreferences } = get()
    const hidden = preferences?.hiddenDefaultCommands || []
    
    await savePreferences({
      hiddenDefaultCommands: hidden.includes(id)
        ? hidden.filter(h => h !== id)
        : [...hidden, id]
    })
  },

  reorderCommands: async (commandIds) => {
    const { savePreferences } = get()
    await savePreferences({ commandOrder: commandIds })
  }
})) 