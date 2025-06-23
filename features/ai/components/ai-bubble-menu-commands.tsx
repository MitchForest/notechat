'use client'

import { Editor } from '@tiptap/core'
import { useState, useEffect } from 'react'
import {
  Edit2,
  Minimize2,
  Maximize2,
  CheckCircle,
  BookOpen,
  Briefcase,
  MessageCircle,
  Zap,
  Loader2,
  ArrowLeft,
  Wand2
} from 'lucide-react'
import * as Icons from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AIOperation } from '@/features/ai/types'
import { useAITransform } from '../hooks/use-ai-transform'
import { usePreferencesStore, type Command } from '@/features/ai/stores/preferences-store'

interface AIBubbleMenuCommandsProps {
  editor: Editor
  onBack: () => void
}

export function AIBubbleMenuCommands({ editor, onBack }: AIBubbleMenuCommandsProps) {
  const [view, setView] = useState<'commands' | 'custom'>('commands')
  const [customPrompt, setCustomPrompt] = useState('')
  const { transform, isLoading, isFinished } = useAITransform(editor)
  const { loadPreferences, getCommands } = usePreferencesStore()

  useEffect(() => {
    loadPreferences()
  }, [loadPreferences])

  const commands = getCommands()

  const handleCommand = (command: Command | 'custom', prompt?: string) => {
    if (command === 'custom' && view === 'commands') {
      setView('custom')
      return
    }
    
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to, ' ')
    
    if (command === 'custom') {
      transform(selectedText, 'custom', prompt)
    } else if (command.isCustom) {
      // Use the custom prompt directly
      transform(selectedText, 'custom', command.prompt)
    } else {
      // Use built-in operation
      transform(selectedText, command.id as AIOperation)
    }
  }

  useEffect(() => {
    if (isFinished) {
      onBack()
    }
  }, [isFinished, onBack])

  // Get icon component
  const getIcon = (iconName: string) => {
    const IconComponent = Icons[iconName as keyof typeof Icons] as any
    return IconComponent || Wand2
  }

  if (isLoading) {
    return (
      <div className="p-2 flex items-center gap-2 min-w-[200px]">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">AI is thinking...</span>
      </div>
    )
  }

  if (view === 'custom') {
    return (
      <div className="p-2 min-w-[280px] max-w-[320px]">
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="icon" onClick={() => setView('commands')} className="h-7 w-7">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">Custom Edit</span>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="e.g., 'make it sound more exciting'"
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && customPrompt.trim()) {
                handleCommand('custom', customPrompt)
              }
            }}
            autoFocus
            className="text-sm h-8"
          />
          <Button
            size="sm"
            onClick={() => handleCommand('custom', customPrompt)}
            disabled={!customPrompt.trim()}
            className="h-8"
          >
            Apply
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-1 min-w-[280px] max-w-[400px]">
      <div className="flex items-center gap-2 mb-1 px-2">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-7 w-7">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">AI Commands</span>
      </div>
      <div className="max-h-[240px] overflow-y-auto">
        <div className="grid grid-cols-2 gap-1">
          {commands.map(cmd => {
            const Icon = getIcon(cmd.icon)
            return (
              <button
                key={cmd.id}
                onClick={() => handleCommand(cmd)}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors text-left"
                title={cmd.prompt}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{cmd.label}</span>
              </button>
            )
          })}
          {/* Always show custom option at the end */}
          <button
            onClick={() => handleCommand('custom')}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors text-left"
          >
            <Zap className="h-4 w-4 shrink-0" />
            <span>Custom edit...</span>
          </button>
        </div>
      </div>
    </div>
  )
} 