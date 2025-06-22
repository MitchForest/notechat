import { useEffect, useRef, useState, useLayoutEffect } from 'react'
import { EditorService } from '../services/EditorService'

export interface UseStableEditorProps {
  elementRef: React.RefObject<HTMLDivElement>
  onEditorReady?: (editorService: EditorService) => void
}

export const useStableEditor = ({
  elementRef,
  onEditorReady
}: UseStableEditorProps) => {
  const editorServiceRef = useRef<EditorService | null>(null)
  const [, forceUpdate] = useState({})
  const isInitializedRef = useRef(false)
  const initializationInProgressRef = useRef(false)
  
  // Store callbacks in refs to avoid dependency issues
  const onEditorReadyRef = useRef(onEditorReady)
  
  // Update refs when props change
  useEffect(() => {
    onEditorReadyRef.current = onEditorReady
  }, [onEditorReady])

  // Use useLayoutEffect to ensure DOM is ready before creating editor
  useLayoutEffect(() => {
    // Prevent double initialization
    if (initializationInProgressRef.current || isInitializedRef.current) {
      return
    }
    
    // Only initialize once
    if (elementRef.current && !editorServiceRef.current) {
      initializationInProgressRef.current = true
      
      try {
        // Create editor service with container
        editorServiceRef.current = new EditorService(
          elementRef.current, 
          []
        )
        
        // Mark as initialized
        isInitializedRef.current = true
        
        // Notify that editor is ready
        onEditorReadyRef.current?.(editorServiceRef.current)
        
        // Force re-render to make editor available
        forceUpdate({})
      } catch (error) {
        console.error('Failed to initialize EditorService:', error)
        isInitializedRef.current = false // Allow retry on error
        initializationInProgressRef.current = false
        throw error // Let error boundary catch it
      } finally {
        initializationInProgressRef.current = false
      }
    }

    return () => {
      // Only destroy if we're unmounting for real (not StrictMode re-render)
      if (editorServiceRef.current && !elementRef.current) {
        editorServiceRef.current.destroy()
        editorServiceRef.current = null
        isInitializedRef.current = false
      }
    }
  }, [elementRef]) // Only depend on elementRef

  return editorServiceRef.current
} 