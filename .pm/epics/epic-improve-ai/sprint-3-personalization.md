# Sprint 3: AI Command Personalization

**Status:** Not Started  
**Priority:** MEDIUM  
**Duration:** 6 hours  

## Overview

Implement a personalization system that allows users to customize their AI commands for the bubble menu. Users should be able to modify existing commands and create new ones.

## Goals

1. Create database schema for user preferences
2. Build settings modal for AI customization
3. Integrate custom commands with bubble menu
4. Allow users to create, edit, and delete AI commands

## Tasks

### Task 1: Database Schema & API ⏱️ 2 hours

**Problem:** No system for storing user preferences

**Solution:**
1. Create user preferences table
2. Add API endpoints for CRUD operations
3. Handle default commands

**Files to create/modify:**
- `lib/db/schema.ts` - Add preferences table
- `app/api/preferences/route.ts` - New API endpoint
- `drizzle/0005_add_user_preferences.sql` - Migration

**Implementation:**

```sql
-- 0005_add_user_preferences.sql
CREATE TABLE user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  preferences JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX user_preferences_user_id_idx ON user_preferences(user_id);
```

```typescript
// schema.ts - Add to schema
export const userPreferences = pgTable('user_preferences', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  preferences: jsonb('preferences').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}))

// Type for preferences
export interface AIPreferences {
  customCommands: {
    id: string
    label: string
    prompt: string
    icon?: string
    order?: number
  }[]
  hiddenDefaultCommands?: string[]
  commandOrder?: string[]
}
```

```typescript
// app/api/preferences/route.ts
import { auth } from '@/lib/auth/utils'
import { db } from '@/lib/db'
import { userPreferences } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const prefs = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, session.user.id)
  })

  return Response.json(prefs?.preferences || {})
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const updates = await req.json()

  await db
    .insert(userPreferences)
    .values({
      userId: session.user.id,
      preferences: updates
    })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: {
        preferences: updates,
        updatedAt: new Date()
      }
    })

  return Response.json({ success: true })
}
```

### Task 2: Preferences Store ⏱️ 1 hour

**Problem:** Need client-side state management for preferences

**Solution:**
1. Create zustand store for preferences
2. Handle loading and saving
3. Merge with default commands

**Files to create:**
- `features/ai/stores/preferences-store.ts`

**Implementation:**

```typescript
// preferences-store.ts
import { create } from 'zustand'
import { AIPreferences } from '@/lib/db/schema'

const DEFAULT_COMMANDS = [
  { id: 'improve', label: 'Improve writing', icon: 'Edit2', prompt: 'Improve the writing style and clarity' },
  { id: 'shorter', label: 'Make shorter', icon: 'Minimize2', prompt: 'Make this text shorter while keeping the meaning' },
  { id: 'longer', label: 'Make longer', icon: 'Maximize2', prompt: 'Expand this text with more detail' },
  { id: 'fix', label: 'Fix grammar', icon: 'CheckCircle', prompt: 'Fix grammar and spelling errors' },
  { id: 'simplify', label: 'Simplify', icon: 'BookOpen', prompt: 'Simplify this text for easier understanding' },
  { id: 'formal', label: 'Make formal', icon: 'Briefcase', prompt: 'Make this text more formal and professional' },
  { id: 'casual', label: 'Make casual', icon: 'MessageCircle', prompt: 'Make this text more casual and conversational' }
]

interface PreferencesStore {
  preferences: AIPreferences | null
  isLoading: boolean
  
  loadPreferences: () => Promise<void>
  savePreferences: (updates: Partial<AIPreferences>) => Promise<void>
  
  getCommands: () => Array<{
    id: string
    label: string
    icon: string
    prompt: string
    isCustom: boolean
  }>
  
  addCommand: (command: Omit<AIPreferences['customCommands'][0], 'id'>) => Promise<void>
  updateCommand: (id: string, updates: Partial<AIPreferences['customCommands'][0]>) => Promise<void>
  deleteCommand: (id: string) => Promise<void>
  toggleDefaultCommand: (id: string) => Promise<void>
}

export const usePreferencesStore = create<PreferencesStore>((set, get) => ({
  preferences: null,
  isLoading: false,

  loadPreferences: async () => {
    set({ isLoading: true })
    try {
      const res = await fetch('/api/preferences')
      const data = await res.json()
      set({ preferences: data, isLoading: false })
    } catch (error) {
      console.error('Failed to load preferences:', error)
      set({ isLoading: false })
    }
  },

  savePreferences: async (updates) => {
    const current = get().preferences || {}
    const updated = { ...current, ...updates }
    
    set({ preferences: updated })
    
    try {
      await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      })
    } catch (error) {
      console.error('Failed to save preferences:', error)
    }
  },

  getCommands: () => {
    const { preferences } = get()
    const hiddenIds = preferences?.hiddenDefaultCommands || []
    
    // Filter and merge commands
    const defaultCommands = DEFAULT_COMMANDS
      .filter(cmd => !hiddenIds.includes(cmd.id))
      .map(cmd => ({ ...cmd, isCustom: false }))
    
    const customCommands = (preferences?.customCommands || [])
      .map(cmd => ({ ...cmd, isCustom: true }))
    
    return [...defaultCommands, ...customCommands]
  },

  addCommand: async (command) => {
    const { preferences, savePreferences } = get()
    const newCommand = {
      ...command,
      id: `custom_${Date.now()}`
    }
    
    await savePreferences({
      customCommands: [...(preferences?.customCommands || []), newCommand]
    })
  },

  updateCommand: async (id, updates) => {
    const { preferences, savePreferences } = get()
    const customCommands = preferences?.customCommands || []
    
    await savePreferences({
      customCommands: customCommands.map(cmd =>
        cmd.id === id ? { ...cmd, ...updates } : cmd
      )
    })
  },

  deleteCommand: async (id) => {
    const { preferences, savePreferences } = get()
    
    await savePreferences({
      customCommands: (preferences?.customCommands || []).filter(cmd => cmd.id !== id)
    })
  },

  toggleDefaultCommand: async (id) => {
    const { preferences, savePreferences } = get()
    const hidden = preferences?.hiddenDefaultCommands || []
    
    await savePreferences({
      hiddenDefaultCommands: hidden.includes(id)
        ? hidden.filter(h => h !== id)
        : [...hidden, id]
    })
  }
}))
```

### Task 3: Settings Modal UI ⏱️ 2 hours

**Problem:** Need UI for managing AI commands

**Solution:**
1. Create settings modal component
2. Add command list with edit/delete
3. Add new command form

**Files to create:**
- `features/ai/components/ai-settings-dialog.tsx`
- Update `features/organization/components/sidebar-user-menu.tsx`

**Implementation:**

```typescript
// ai-settings-dialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { usePreferencesStore } from '../stores/preferences-store'
import { useState, useEffect } from 'react'
import { Trash2, Edit2, Plus, GripVertical } from 'lucide-react'

export function AISettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { loadPreferences, getCommands, addCommand, updateCommand, deleteCommand, toggleDefaultCommand } = usePreferencesStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newCommand, setNewCommand] = useState({ label: '', prompt: '' })

  useEffect(() => {
    if (open) {
      loadPreferences()
    }
  }, [open])

  const commands = getCommands()

  const handleSaveEdit = (id: string, updates: { label: string; prompt: string }) => {
    updateCommand(id, updates)
    setEditingId(null)
  }

  const handleAddCommand = () => {
    if (newCommand.label && newCommand.prompt) {
      addCommand(newCommand)
      setNewCommand({ label: '', prompt: '' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Command Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Default Commands */}
          <div>
            <h3 className="text-sm font-medium mb-3">Default Commands</h3>
            <div className="space-y-2">
              {commands.filter(cmd => !cmd.isCustom).map(cmd => (
                <div key={cmd.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1">
                    <div className="font-medium">{cmd.label}</div>
                    <div className="text-sm text-muted-foreground">{cmd.prompt}</div>
                  </div>
                  <Switch
                    checked={!cmd.isHidden}
                    onCheckedChange={() => toggleDefaultCommand(cmd.id)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Custom Commands */}
          <div>
            <h3 className="text-sm font-medium mb-3">Custom Commands</h3>
            <div className="space-y-2">
              {commands.filter(cmd => cmd.isCustom).map(cmd => (
                <div key={cmd.id} className="p-3 rounded-lg border">
                  {editingId === cmd.id ? (
                    <div className="space-y-3">
                      <Input
                        defaultValue={cmd.label}
                        placeholder="Command name"
                        id={`label-${cmd.id}`}
                      />
                      <Textarea
                        defaultValue={cmd.prompt}
                        placeholder="AI prompt"
                        id={`prompt-${cmd.id}`}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            const label = (document.getElementById(`label-${cmd.id}`) as HTMLInputElement).value
                            const prompt = (document.getElementById(`prompt-${cmd.id}`) as HTMLTextAreaElement).value
                            handleSaveEdit(cmd.id, { label, prompt })
                          }}
                        >
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{cmd.label}</div>
                        <div className="text-sm text-muted-foreground">{cmd.prompt}</div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingId(cmd.id)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteCommand(cmd.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add New Command */}
              <div className="p-3 rounded-lg border border-dashed">
                <div className="space-y-3">
                  <Input
                    value={newCommand.label}
                    onChange={(e) => setNewCommand({ ...newCommand, label: e.target.value })}
                    placeholder="Command name"
                  />
                  <Textarea
                    value={newCommand.prompt}
                    onChange={(e) => setNewCommand({ ...newCommand, prompt: e.target.value })}
                    placeholder="AI prompt (e.g., 'Make this text sound more exciting')"
                  />
                  <Button onClick={handleAddCommand} disabled={!newCommand.label || !newCommand.prompt}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Command
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### Task 4: Integrate with Bubble Menu ⏱️ 1 hour

**Problem:** Bubble menu needs to use custom commands

**Solution:**
1. Load preferences in bubble menu
2. Display custom commands
3. Handle custom prompts

**Files to modify:**
- `features/ai/components/ai-bubble-menu-commands.tsx`

**Implementation:**

```typescript
// ai-bubble-menu-commands.tsx - Update to use preferences
import { usePreferencesStore } from '../stores/preferences-store'
import * as Icons from 'lucide-react'

export function AIBubbleMenuCommands({ editor, onBack }: AIBubbleMenuCommandsProps) {
  const { loadPreferences, getCommands } = usePreferencesStore()
  const [view, setView] = useState<'commands' | 'custom'>('commands')
  const [customPrompt, setCustomPrompt] = useState('')
  const { transform, isLoading, isFinished } = useAITransform(editor)

  useEffect(() => {
    loadPreferences()
  }, [])

  const commands = getCommands()

  const handleCommand = (command: any) => {
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to, ' ')
    
    if (command.isCustom) {
      // Use the custom prompt directly
      transform(selectedText, 'custom', command.prompt)
    } else {
      // Use built-in operation
      transform(selectedText, command.id as AIOperation)
    }
  }

  // Get icon component
  const getIcon = (iconName: string) => {
    const IconComponent = Icons[iconName as keyof typeof Icons] as any
    return IconComponent || Icons.Wand2
  }

  return (
    <div className="p-1 w-72">
      <div className="flex items-center gap-2 mb-1 px-2">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-7 w-7">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">AI Commands</span>
      </div>
      <div className="grid grid-cols-2 gap-1 max-h-[300px] overflow-y-auto">
        {commands.map(cmd => {
          const Icon = getIcon(cmd.icon)
          return (
            <button
              key={cmd.id}
              onClick={() => handleCommand(cmd)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors text-left"
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{cmd.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

## Testing Checklist

- [ ] Settings modal opens from user menu
- [ ] Can toggle default commands on/off
- [ ] Can add new custom commands
- [ ] Can edit custom commands
- [ ] Can delete custom commands
- [ ] Custom commands appear in bubble menu
- [ ] Custom commands execute with correct prompts
- [ ] Preferences persist across sessions
- [ ] Works in both themes

## Definition of Done

- User preferences table created and migrated
- Settings modal fully functional
- Custom commands integrated with bubble menu
- All CRUD operations working
- Preferences persist and sync

## Session Summary

**Completed:**
- TBD

**Files Changed:**
- TBD

**Remaining:**
- TBD 