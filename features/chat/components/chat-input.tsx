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
 * 
 * Created: December 2024
 * Updated: December 2024 - Added @mention support
 */

import { useRef, useEffect, KeyboardEvent, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Send, Square } from 'lucide-react'
import { NoteMentionDropdown } from './note-mention-dropdown'
import { Note } from '@/lib/db/schema'
import { useNoteContextStore } from '@/features/chat/stores/note-context-store'

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
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`
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
    const textBeforeMention = input.substring(0, mentionStartIndex)
    
    // Create a temporary element to measure text dimensions
    const measureEl = document.createElement('div')
    measureEl.style.cssText = window.getComputedStyle(textarea).cssText
    measureEl.style.position = 'absolute'
    measureEl.style.visibility = 'hidden'
    measureEl.style.whiteSpace = 'pre-wrap'
    measureEl.style.width = `${textarea.clientWidth}px`
    measureEl.textContent = textBeforeMention
    document.body.appendChild(measureEl)
    
    const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight)
    const rect = textarea.getBoundingClientRect()
    const textHeight = measureEl.offsetHeight
    
    document.body.removeChild(measureEl)
    
    // Position dropdown above or below based on space
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    
    if (spaceBelow > 300 || spaceBelow > spaceAbove) {
      // Show below
      setMentionPosition({
        top: rect.top + textHeight + lineHeight + 5,
        left: rect.left + 16 // Account for padding
      })
    } else {
      // Show above
      setMentionPosition({
        top: rect.top - 300,
        left: rect.left + 16
      })
    }
  }, [input, mentionStartIndex])

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

  return (
    <>
      <div className="border-t bg-background">
        <form onSubmit={onSubmit} className="relative max-w-3xl mx-auto">
          <div className="flex items-end gap-2 p-4">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={isLoading}
                maxLength={maxLength}
                rows={1}
                className={cn(
                  'w-full resize-none rounded-lg border bg-background px-4 py-3',
                  'placeholder:text-muted-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-ring',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  'min-h-[52px] max-h-[200px]',
                  'pr-12' // Space for character count
                )}
              />
              
              {input.length > maxLength * 0.8 && (
                <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                  {input.length}/{maxLength}
                </div>
              )}
            </div>
            
            <Button
              type={isLoading ? 'button' : 'submit'}
              size="icon"
              disabled={!input.trim() && !isLoading}
              onClick={isLoading ? onStop : undefined}
              className="h-[52px] w-[52px]"
            >
              {isLoading ? (
                <Square className="h-4 w-4" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <div className="px-4 pb-2 text-xs text-muted-foreground">
            {isLoading ? 'Stop generation' : 'Enter to send, Shift + Enter for new line, @ to mention notes'}
          </div>
        </form>
      </div>

      {showMentionDropdown && (
        <NoteMentionDropdown
          search={mentionSearch}
          position={mentionPosition}
          onSelect={handleNoteSelect}
          onClose={() => setShowMentionDropdown(false)}
        />
      )}
    </>
  )
} 