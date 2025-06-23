/**
 * Component: GhostTextHandler
 * Purpose: Manages AI ghost text state independently from editor rendering
 * Features:
 * - Displays loading indicator during AI processing
 * - Isolates re-renders from editor component
 * - Handles ghost text lifecycle
 * 
 * Created: 2024-12-20
 */

import { useEffect, useState, memo } from 'react'
import { Editor } from '@tiptap/core'
import { useGhostText } from '../hooks/use-ghost-text'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface GhostTextHandlerProps {
  editor: Editor
}

export const GhostTextHandler = memo(function GhostTextHandler({ editor }: GhostTextHandlerProps) {
  const { isLoading, ghostText } = useGhostText(editor)
  const [isVisible, setIsVisible] = useState(false)

  // Handle visibility based on loading state OR ghost text presence
  useEffect(() => {
    if (isLoading || ghostText) {
      setIsVisible(true)
    } else {
      // Delay hiding to allow fade out animation
      const timeout = setTimeout(() => {
        setIsVisible(false)
      }, 200)
      return () => clearTimeout(timeout)
    }
  }, [isLoading, ghostText])

  // Don't render anything if not needed
  if (!isVisible) return null

  return (
    <div
      className={cn(
        'fixed bottom-8 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-2 px-3 py-2',
        'bg-background border rounded-md shadow-sm',
        'transition-all duration-200',
        (isLoading || ghostText) ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      )}
    >
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      <span className="text-sm text-muted-foreground">
        {ghostText ? `Ghost text: "${ghostText}"` : 'AI is thinking...'}
      </span>
    </div>
  )
}) 