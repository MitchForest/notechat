/**
 * Component: ChatDropZone
 * Purpose: Visual drop zone indicator for dragging notes into chat
 * Features:
 * - Shows when dragging notes
 * - Visual feedback on hover
 * - Smooth animations
 * - Accepts multiple notes
 * 
 * Created: December 2024
 */

import { cn } from '@/lib/utils'
import { FileText, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ChatDropZoneProps {
  isActive: boolean
  isDragOver: boolean
  onDragEnter: () => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
  className?: string
}

export function ChatDropZone({
  isActive,
  isDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  className,
}: ChatDropZoneProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className={cn("overflow-hidden", className)}
        >
          <div
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={handleDragOver}
            onDrop={onDrop}
            className={cn(
              "m-3 p-8 rounded-lg",
              "border-2 border-dashed transition-all duration-200",
              "flex flex-col items-center justify-center gap-2",
              isDragOver
                ? "border-primary bg-primary bg-opacity-10 scale-[1.02]"
                : "border-border bg-muted bg-opacity-30"
            )}
          >
            <div className={cn(
              "rounded-full p-3 transition-colors",
              isDragOver ? "bg-primary bg-opacity-20" : "bg-muted"
            )}>
              <Plus className={cn(
                "w-6 h-6 transition-colors",
                isDragOver ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            
            <div className="text-center">
              <p className={cn(
                "font-medium transition-colors",
                isDragOver ? "text-primary" : "text-foreground"
              )}>
                Drop notes here to add context
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                The AI will use these notes to provide better responses
              </p>
            </div>

            {isDragOver && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2 mt-2"
              >
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">
                  Release to add to context
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 