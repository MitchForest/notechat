'use client'

/**
 * Component: ChatInput
 * Purpose: Advanced chat input with auto-resize and shortcuts
 * Features:
 * - Auto-expanding textarea
 * - Keyboard shortcuts (Enter to send, Shift+Enter for newline)
 * - Character count for long messages
 * - Stop generation button
 * 
 * Created: December 2024
 */

import { useRef, useEffect, KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Send, Square } from 'lucide-react'

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

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`
    }
  }, [input])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !isLoading) {
        onSubmit(e as any)
      }
    }
  }

  return (
    <div className="border-t bg-background">
      <form onSubmit={onSubmit} className="relative max-w-3xl mx-auto">
        <div className="flex items-end gap-2 p-4">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={onChange}
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
          {isLoading ? 'Stop generation' : 'Enter to send, Shift + Enter for new line'}
        </div>
      </form>
    </div>
  )
} 