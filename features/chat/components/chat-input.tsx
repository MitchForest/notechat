'use client'

/**
 * Component: ChatInput
 * Purpose: Advanced chat input with auto-resize and shortcuts
 * Features:
 * - Auto-expanding textarea
 * - Keyboard shortcuts (Enter to send, Shift+Enter for newline)
 * - Character count for long messages
 * - Stop generation button
 * - @mention support for notes
 * - Claude-like integrated send button
 * 
 * Created: December 2024
 * Updated: December 2024 - Redesigned to match Claude.ai style
 */

import { useRef, useEffect, KeyboardEvent, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Send, Square } from 'lucide-react'
import { NoteMentionDropdown } from './note-mention-dropdown'
import { Note } from '@/lib/db/schema'
import { useNoteContextStore } from '@/features/chat/stores/note-context-store'
import '../styles/animations.css'
import '../styles/chat.css'

interface ChatInputProps {
  input: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
  onStop: () => void
  placeholder?: string
  maxLength?: number
}

export function ChatInput({
  input,
  onChange,
  onSubmit,
  isLoading,
  onStop,
  placeholder = 'Send a message...',
  maxLength = 4000,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showMentionDropdown, setShowMentionDropdown] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 })
  const [mentionStartIndex, setMentionStartIndex] = useState(-1)
  const { addReferencedNote } = useNoteContextStore()

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = `${Math.min(scrollHeight, 300)}px`
    }
  }, [input])

  // Detect @ mentions
  const detectMention = useCallback((text: string, cursorPosition: number) => {
    // Find the last @ before cursor
    const beforeCursor = text.slice(0, cursorPosition)
    const lastAtIndex = beforeCursor.lastIndexOf('@')
    
    if (lastAtIndex !== -1) {
      const afterAt = beforeCursor.slice(lastAtIndex + 1)
      // Check if it's a valid mention context (not part of email, etc.)
      // Allow letters, numbers, spaces, but stop at special characters
      const match = afterAt.match(/^[a-zA-Z0-9\s]*$/)
      if (match) {
        return {
          isValid: true,
          search: afterAt,
          startIndex: lastAtIndex
        }
      }
    }
    
    return { isValid: false, search: '', startIndex: -1 }
  }, [])

  // Calculate dropdown position
  const calculateDropdownPosition = useCallback(() => {
    if (!textareaRef.current || mentionStartIndex === -1) return

    const textarea = textareaRef.current
    const rect = textarea.getBoundingClientRect()
    
    // Calculate position relative to viewport
    const dropdownHeight = 384 // max height from the dropdown component
    const dropdownWidth = 320 // w-80 = 20rem = 320px
    const padding = 16
    
    // Calculate vertical position
    let top = rect.bottom + 8
    const spaceBelow = window.innerHeight - rect.bottom - padding
    const spaceAbove = rect.top - padding
    
    // If not enough space below, show above
    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      top = rect.top - dropdownHeight - 8
    }
    
    // Calculate horizontal position
    let left = rect.left
    const spaceRight = window.innerWidth - rect.left - padding
    
    // If dropdown would go off right edge, align it to the right edge of textarea
    if (spaceRight < dropdownWidth) {
      left = rect.right - dropdownWidth
    }
    
    // Ensure it doesn't go off left edge
    if (left < padding) {
      left = padding
    }
    
    setMentionPosition({
      top: Math.max(padding, Math.min(top, window.innerHeight - dropdownHeight - padding)),
      left: Math.max(padding, Math.min(left, window.innerWidth - dropdownWidth - padding))
    })
  }, [mentionStartIndex])

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    const cursorPosition = e.target.selectionStart || 0
    
    // Detect @ mentions
    const mention = detectMention(value, cursorPosition)
    
    if (mention.isValid) {
      setMentionSearch(mention.search)
      setMentionStartIndex(mention.startIndex)
      setShowMentionDropdown(true)
      
      // Update dropdown position on next tick
      setTimeout(calculateDropdownPosition, 0)
    } else {
      setShowMentionDropdown(false)
    }
    
    onChange(e)
  }

  // Handle note selection from dropdown
  const handleNoteSelect = (note: Note) => {
    if (textareaRef.current && mentionStartIndex !== -1) {
      const value = input
      const beforeMention = value.slice(0, mentionStartIndex)
      const afterCursor = value.slice(textareaRef.current.selectionStart || 0)
      
      // Insert the note reference
      const noteReference = `@[${note.title}](note:${note.id}) `
      const newValue = beforeMention + noteReference + afterCursor
      
      // Update input through the AI SDK handler
      const syntheticEvent = {
        target: { value: newValue }
      } as React.ChangeEvent<HTMLTextAreaElement>
      
      onChange(syntheticEvent)
      
      // Add to referenced notes - convert DB note to context note format
      addReferencedNote({
        id: note.id,
        title: note.title,
        content: typeof note.content === 'string' ? note.content : undefined,
        collectionId: note.collectionId,
        isStarred: note.isStarred,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      })
      
      // Close dropdown
      setShowMentionDropdown(false)
      
      // Restore focus and cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = beforeMention.length + noteReference.length
          textareaRef.current.focus()
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
        }
      }, 0)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle arrow keys when dropdown is open
    if (showMentionDropdown && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault()
      // Let the Command component handle navigation
      return
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !isLoading && !showMentionDropdown) {
        onSubmit(e as any)
      }
    }
  }

  const hasInput = input.trim().length > 0

  return (
    <div className="chat-input-container">
      <form onSubmit={onSubmit} className="chat-input-wrapper">
        <div className="relative w-full">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            maxLength={maxLength}
            rows={3}
            className={cn(
              'w-full resize-none rounded-2xl border bg-background',
              'px-5 py-4 pr-16',
              'placeholder:text-muted-foreground/70',
              'focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-transparent',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'min-h-[96px] max-h-[300px]',
              'text-[15px] leading-relaxed',
              'transition-all duration-200',
              'selection:bg-primary/20',
              'shadow-sm hover:shadow-md focus:shadow-md'
            )}
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--border) transparent'
            }}
          />
          
          {/* Character count - positioned inside textarea */}
          {input.length > maxLength * 0.8 && (
            <div className="absolute bottom-4 left-5 text-xs text-muted-foreground pointer-events-none">
              {input.length}/{maxLength}
            </div>
          )}
          
          {/* Send button - positioned inside textarea */}
          <Button
            type={isLoading ? 'button' : 'submit'}
            size="icon"
            disabled={!hasInput && !isLoading}
            onClick={isLoading ? onStop : undefined}
            className={cn(
              'absolute bottom-3 right-3',
              'h-10 w-10 rounded-lg',
              'transition-all duration-200',
              'chat-send-button-integrated',
              hasInput || isLoading ? 'opacity-100' : 'opacity-40'
            )}
            data-has-input={hasInput}
          >
            {isLoading ? (
              <Square className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>

      {showMentionDropdown && (
        <NoteMentionDropdown
          search={mentionSearch}
          position={mentionPosition}
          onSelect={handleNoteSelect}
          onClose={() => setShowMentionDropdown(false)}
        />
      )}
    </div>
  )
} 