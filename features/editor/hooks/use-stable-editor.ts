import { useEffect, useRef, useState, useLayoutEffect } from 'react'
import { EditorService } from '../services/EditorService'
import { blockDebugger } from '../utils/block-debug'

export interface UseStableEditorProps {
  elementRef: React.RefObject<HTMLDivElement>
  dragManager?: any
  onEditorReady?: (editorService: EditorService) => void
  dragHandlers?: {
    onDragStart?: (data: any) => void
    onDragEnd?: () => void
    onDrop?: (targetPos: number, position: 'before' | 'after') => void
    onUpdateDropTarget?: (targetId: string | null, position: 'before' | 'after' | null) => void
  }
}

export const useStableEditor = ({
  elementRef,
  dragManager,
  onEditorReady,
  dragHandlers
}: UseStableEditorProps) => {
  const editorServiceRef = useRef<EditorService | null>(null)
  const [, forceUpdate] = useState({})
  const isInitializedRef = useRef(false)
  
  // Store callbacks in refs to avoid dependency issues
  const onEditorReadyRef = useRef(onEditorReady)
  const dragHandlersRef = useRef(dragHandlers)
  
  // Update refs when props change
  useEffect(() => {
    onEditorReadyRef.current = onEditorReady
    dragHandlersRef.current = dragHandlers
  }, [onEditorReady, dragHandlers])

  // Use useLayoutEffect to ensure DOM is ready before creating editor
  useLayoutEffect(() => {
    // Only initialize once
    if (elementRef.current && !editorServiceRef.current && !isInitializedRef.current) {
      isInitializedRef.current = true
      
      try {
        // Validate container before creating editor
        blockDebugger.validateContainer(elementRef.current)
        
        // Create editor service with validated container and drag handlers
        editorServiceRef.current = new EditorService(
          elementRef.current, 
          [], 
          dragHandlersRef.current
        )
        
        // Notify that editor is ready
        onEditorReadyRef.current?.(editorServiceRef.current)
        
        // Force re-render to make editor available
        forceUpdate({})
      } catch (error) {
        console.error('Failed to initialize EditorService:', error)
        isInitializedRef.current = false // Allow retry on error
        throw error // Let error boundary catch it
      }
    }

    return () => {
      if (editorServiceRef.current) {
        editorServiceRef.current.destroy()
        editorServiceRef.current = null
        isInitializedRef.current = false
      }
    }
  }, [elementRef]) // Only depend on elementRef

  return editorServiceRef.current
} 