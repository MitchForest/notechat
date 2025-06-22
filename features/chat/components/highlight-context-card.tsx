/**
 * Component: HighlightContextCard
 * Purpose: Display highlighted text from editor in chat
 * Features:
 * - Show selected text with note context
 * - Clear button to remove highlight
 * - Smooth animations
 * - Compact design
 * 
 * Created: December 2024
 */

import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, X, Edit3 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface HighlightContextCardProps {
  highlightedText: string
  noteTitle: string
  noteId: string
  onClear: () => void
  className?: string
}

export function HighlightContextCard({
  highlightedText,
  noteTitle,
  noteId,
  onClear,
  className,
}: HighlightContextCardProps) {
  // Truncate text if too long
  const displayText = highlightedText.length > 150 
    ? highlightedText.slice(0, 150) + '...' 
    : highlightedText

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
        className={cn("overflow-hidden", className)}
      >
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-md">
                <Edit3 className="w-4 h-4 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium truncate">
                    Editing: {noteTitle}
                  </span>
                </div>
                
                <div className="bg-background/60 rounded-md p-2 mb-2">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    "{displayText}"
                  </p>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Ask AI to edit, explain, or transform this text
                </p>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={onClear}
                className="h-8 w-8 -mr-1 -mt-1"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear selection</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
} 