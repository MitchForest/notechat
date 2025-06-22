'use client'

import { useState, useRef, useEffect } from 'react'
import { MoreVertical, Trash2, Edit2, X, RotateCcw } from 'lucide-react'
import { CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface PanelHeaderProps {
  title: string
  type: 'chat' | 'note'
  onTitleChange: (title: string) => void
  onAction: (action: 'rename' | 'delete' | 'clear' | 'close') => void
  className?: string
}

export function PanelHeader({ 
  title, 
  type, 
  onTitleChange, 
  onAction,
  className 
}: PanelHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setEditValue(title)
  }, [title])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = () => {
    const trimmedValue = editValue.trim()
    if (trimmedValue && trimmedValue !== title) {
      onTitleChange(trimmedValue)
    } else {
      setEditValue(title) // Revert if empty
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(title)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  const handleRename = () => {
    setIsEditing(true)
    onAction('rename')
  }

  return (
    <CardHeader className={cn("flex flex-row items-center justify-between py-3 h-14", className)}>
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="h-8 font-medium"
            placeholder={type === 'chat' ? 'Chat title' : 'Note title'}
          />
        ) : (
          <h3 
            className="font-medium truncate cursor-text hover:bg-neutral-100 dark:hover:bg-neutral-800 px-2 py-1 -ml-2 rounded-md"
            onClick={() => setIsEditing(true)}
            title={title}
          >
            {title}
          </h3>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleRename}>
            <Edit2 className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
          
          {type === 'chat' && (
            <DropdownMenuItem onClick={() => onAction('clear')}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Clear History
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem 
            onClick={() => onAction('delete')}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => onAction('close')}>
            <X className="mr-2 h-4 w-4" />
            Close
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </CardHeader>
  )
} 