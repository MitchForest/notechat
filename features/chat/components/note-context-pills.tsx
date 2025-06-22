/**
 * Component: NoteContextPills
 * Purpose: Visual pills showing active notes in chat context
 * Features:
 * - Display multiple note pills
 * - Remove notes from context
 * - Highlight when AI references
 * - Overflow handling
 * - Smooth animations
 * 
 * Created: December 2024
 */

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { X, FileText, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface NoteContext {
  id: string
  title: string
  addedAt: Date
  isHighlighted?: boolean
}

interface NoteContextPillsProps {
  notes: NoteContext[]
  onRemove: (noteId: string) => void
  onNoteClick: (noteId: string) => void
  maxVisible?: number
  className?: string
}

interface NotePillProps {
  note: NoteContext
  isHighlighted?: boolean
  onRemove: () => void
  onClick: () => void
}

function NotePill({ note, isHighlighted, onRemove, onClick }: NotePillProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        backgroundColor: isHighlighted ? 'var(--primary)' : 'transparent'
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group relative inline-flex items-center gap-1.5",
        "px-3 py-1.5 rounded-full",
        "bg-secondary border border-border",
        "hover:bg-accent transition-colors",
        "cursor-pointer select-none",
        isHighlighted && "ring-2 ring-primary ring-offset-1"
      )}
      onClick={onClick}
    >
      <FileText className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="text-sm font-medium max-w-[150px] truncate">
        {note.title}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className={cn(
          "ml-1 -mr-1 p-0.5 rounded-full",
          "opacity-0 group-hover:opacity-100",
          "hover:bg-destructive hover:bg-opacity-20 transition-all",
          "focus:outline-none focus:ring-2 focus:ring-destructive"
        )}
        aria-label={`Remove ${note.title} from context`}
      >
        <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
      </button>
    </motion.div>
  )
}

export function NoteContextPills({
  notes,
  onRemove,
  onNoteClick,
  maxVisible = 5,
  className,
}: NoteContextPillsProps) {
  const [showAll, setShowAll] = useState(false)
  const visibleNotes = showAll ? notes : notes.slice(0, maxVisible)
  const hiddenCount = notes.length - maxVisible

  // Reset showAll when notes change significantly
  useEffect(() => {
    if (notes.length <= maxVisible) {
      setShowAll(false)
    }
  }, [notes.length, maxVisible])

  if (notes.length === 0) {
    return null
  }

  return (
    <TooltipProvider>
      <div className={cn(
        "flex items-center gap-2 p-3",
        "border-b border-border bg-muted bg-opacity-30",
        className
      )}>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <FileText className="w-4 h-4" />
          <span>Context:</span>
        </div>
        
        <div className="flex-1 flex items-center gap-2 flex-wrap">
          <AnimatePresence mode="popLayout">
            {visibleNotes.map((note) => (
              <NotePill
                key={note.id}
                note={note}
                isHighlighted={note.isHighlighted}
                onRemove={() => onRemove(note.id)}
                onClick={() => onNoteClick(note.id)}
              />
            ))}
          </AnimatePresence>
          
          {!showAll && hiddenCount > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAll(true)}
                    className="h-8 px-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    +{hiddenCount} more
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Show all {notes.length} notes</p>
                </TooltipContent>
              </Tooltip>
            </motion.div>
          )}
          
          {showAll && hiddenCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(false)}
              className="h-8 px-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Show less
            </Button>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
} 