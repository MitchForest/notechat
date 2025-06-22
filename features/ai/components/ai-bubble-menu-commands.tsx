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
  ArrowLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AIOperation } from '@/features/ai/types'
import { useAITransform } from '../hooks/use-ai-transform'

interface AIBubbleMenuCommandsProps {
  editor: Editor
  onBack: () => void
}

const COMMANDS = [
  { id: 'improve', label: 'Improve writing', icon: Edit2 },
  { id: 'shorter', label: 'Make shorter', icon: Minimize2 },
  { id: 'longer', label: 'Make longer', icon: Maximize2 },
  { id: 'fix', label: 'Fix grammar', icon: CheckCircle },
  { id: 'simplify', label: 'Simplify', icon: BookOpen },
  { id: 'formal', label: 'Make formal', icon: Briefcase },
  { id: 'casual', label: 'Make casual', icon: MessageCircle },
  { id: 'custom', label: 'Custom edit...', icon: Zap }
] as const

export function AIBubbleMenuCommands({ editor, onBack }: AIBubbleMenuCommandsProps) {
  const [view, setView] = useState<'commands' | 'custom'>('commands')
  const [customPrompt, setCustomPrompt] = useState('')
  const { transform, isLoading, isFinished } = useAITransform(editor)

  const handleCommand = (operation: AIOperation, prompt?: string) => {
    if (operation === 'custom' && view === 'commands') {
      setView('custom')
      return
    }
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to, ' ')
    transform(selectedText, operation, prompt)
  }

  useEffect(() => {
    if (isFinished) {
      onBack()
    }
  }, [isFinished, onBack])

  if (isLoading) {
    return (
      <div className="p-2 flex items-center gap-2 w-72">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">AI is thinking...</span>
      </div>
    )
  }

  if (view === 'custom') {
    return (
      <div className="p-2 w-72">
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
    <div className="p-1 w-72">
      <div className="flex items-center gap-2 mb-1 px-2">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-7 w-7">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">AI Commands</span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {COMMANDS.map(cmd => (
          <button
            key={cmd.id}
            onClick={() => handleCommand(cmd.id as AIOperation)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors text-left"
          >
            <cmd.icon className="h-4 w-4 shrink-0" />
            <span>{cmd.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
} 