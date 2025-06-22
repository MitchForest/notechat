/**
 * Component: SelectionMenu
 * Purpose: Floating context menu for text selection actions
 * Features:
 * - Copy selected text
 * - Create note from selection
 * - Ask AI about selection
 * - Keyboard shortcuts
 * - Smooth animations
 * 
 * Created: December 2024
 */

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Copy, FileText, MessageSquare, Command } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SelectionMenuProps {
  position: { x: number; y: number } | null
  selectedText: string
  onCopy: () => void
  onCreateNote: () => void
  onAskAI: () => void
  onClose: () => void
  isOpen: boolean
}

export function SelectionMenu({
  position,
  selectedText,
  onCopy,
  onCreateNote,
  onAskAI,
  onClose,
  isOpen,
}: SelectionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for meta key (Cmd on Mac, Ctrl on Windows/Linux)
      const metaKey = e.metaKey || e.ctrlKey

      if (metaKey) {
        switch (e.key.toLowerCase()) {
          case 'c':
            // Default copy behavior, but we can enhance it
            onCopy()
            break
          case 'n':
            e.preventDefault()
            onCreateNote()
            break
          case '/':
            e.preventDefault()
            onAskAI()
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCopy, onCreateNote, onAskAI])

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        // Small delay to allow for text selection adjustments
        setTimeout(() => {
          const selection = window.getSelection()
          if (!selection || !selection.toString().trim()) {
            onClose()
          }
        }, 100)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  if (!position) return null

  const menuItems = [
    {
      icon: Copy,
      label: 'Copy',
      shortcut: '⌘C',
      onClick: onCopy,
      className: '',
    },
    {
      icon: FileText,
      label: 'Create Note',
      shortcut: '⌘N',
      onClick: onCreateNote,
      className: 'border-t border-border',
    },
    {
      icon: MessageSquare,
      label: 'Ask AI',
      shortcut: '⌘/',
      onClick: onAskAI,
      className: '',
    },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className={cn(
            'fixed z-50 min-w-[180px] rounded-lg',
            'bg-popover border border-border shadow-lg',
            'py-1 overflow-hidden'
          )}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: 'translateX(-50%)',
          }}
        >
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <button
                key={item.label}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  item.onClick()
                }}
                className={cn(
                  'w-full px-3 py-2 text-sm',
                  'flex items-center justify-between gap-3',
                  'hover:bg-accent hover:text-accent-foreground',
                  'transition-colors duration-150',
                  'focus:outline-none focus:bg-accent',
                  item.className
                )}
              >
                <span className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                  {item.shortcut.includes('⌘') ? (
                    <>
                      <Command className="w-3 h-3" />
                      <span>{item.shortcut.replace('⌘', '')}</span>
                    </>
                  ) : (
                    item.shortcut
                  )}
                </span>
              </button>
            )
          })}
        </motion.div>
      )}
    </AnimatePresence>
  )
} 