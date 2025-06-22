import { useState, useCallback, useRef, useEffect } from 'react'
import { Editor } from '@tiptap/core'
import { Node as ProseMirrorNode } from 'prosemirror-model'

interface DragState {
  isDragging: boolean
  draggedBlockId: string | null
  draggedNode: ProseMirrorNode | null
  draggedPos: number
  dropTargetId: string | null
  dropPosition: 'before' | 'after' | null
  ghostPosition: { x: number; y: number }
  originalSelection: number
}

interface UseBlockDragDropProps {
  editor: Editor | null
  enabled?: boolean
}

interface DragStartData {
  blockId: string
  blockNode: ProseMirrorNode
  blockPos: number
}

export function useBlockDragDrop({ editor, enabled = true }: UseBlockDragDropProps) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedBlockId: null,
    draggedNode: null,
    draggedPos: 0,
    dropTargetId: null,
    dropPosition: null,
    ghostPosition: { x: 0, y: 0 },
    originalSelection: 0
  })

  const rafRef = useRef<number | null>(null)
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup empty blocks before drag
  const cleanupEmptyBlocks = useCallback(() => {
    if (!editor) return

    const { doc } = editor.state
    const tr = editor.state.tr
    const nodesToDelete: { pos: number; size: number }[] = []

    doc.descendants((node, pos) => {
      // Skip if it's the only block
      if (doc.content.size <= 2) return

      // Check for empty paragraphs (except first one)
      if (
        node.type.name === 'paragraph' &&
        node.content.size === 0 &&
        pos > 0
      ) {
        nodesToDelete.push({ pos, size: node.nodeSize })
      }
    })

    // Delete in reverse order
    if (nodesToDelete.length > 0) {
      nodesToDelete.reverse().forEach(({ pos, size }) => {
        tr.delete(pos, pos + size)
      })
      editor.view.dispatch(tr)
    }
  }, [editor])

  // Start dragging
  const startDrag = useCallback((data: DragStartData) => {
    if (!editor || !enabled) return

    // Save current selection position
    const originalSelection = editor.state.selection.from

    // Exit editing mode
    editor.view.dom.blur()
    
    // Clear selection by focusing at position 0
    editor.commands.setTextSelection({ from: 0, to: 0 })
    
    // Clean up empty blocks
    cleanupEmptyBlocks()

    // Disable editing during drag
    editor.setOptions({ editable: false })
    
    // Add dragging class
    editor.view.dom.classList.add('is-dragging')

    setDragState({
      isDragging: true,
      draggedBlockId: data.blockId,
      draggedNode: data.blockNode,
      draggedPos: data.blockPos,
      dropTargetId: null,
      dropPosition: null,
      ghostPosition: { x: 0, y: 0 },
      originalSelection
    })
  }, [editor, enabled, cleanupEmptyBlocks])

  // Update ghost position (throttled with RAF)
  const updateGhostPosition = useCallback((x: number, y: number) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }

    rafRef.current = requestAnimationFrame(() => {
      setDragState(prev => ({
        ...prev,
        ghostPosition: { x, y }
      }))
    })
  }, [])

  // Update drop target
  const updateDropTarget = useCallback((targetId: string | null, position: 'before' | 'after' | null) => {
    setDragState(prev => ({
      ...prev,
      dropTargetId: targetId,
      dropPosition: position
    }))
  }, [])

  // Complete the drop
  const completeDrop = useCallback((targetPos: number, position: 'before' | 'after') => {
    if (!editor || !dragState.isDragging) return

    const { draggedNode, draggedPos } = dragState

    if (!draggedNode) return

    // Calculate final position
    let finalPos = position === 'before' ? targetPos : targetPos + 1
    
    // Adjust if dragging to position after original
    if (finalPos > draggedPos) {
      finalPos -= draggedNode.nodeSize
    }

    // Don't move if dropping in same position
    if (finalPos === draggedPos) {
      cancelDrag()
      return
    }

    // Perform the move
    editor.chain()
      .deleteRange({ from: draggedPos, to: draggedPos + draggedNode.nodeSize })
      .insertContentAt(finalPos, draggedNode.toJSON())
      .run()

    // Re-enable editing
    editor.setOptions({ editable: true })

    // Focus the moved block after a short delay
    cleanupTimeoutRef.current = setTimeout(() => {
      // Find the new position of the moved block
      const movedBlockStart = finalPos < draggedPos ? finalPos : finalPos - draggedNode.nodeSize
      
      // Focus at the end of the moved block's content
      const focusPos = movedBlockStart + draggedNode.content.size + 1
      editor.commands.focus(focusPos, { scrollIntoView: true })
    }, 50)

    // Clean up
    cleanup()
  }, [editor, dragState])

  // Cancel drag
  const cancelDrag = useCallback(() => {
    if (!editor) return

    // Re-enable editing
    editor.setOptions({ editable: true })

    // Restore original focus
    if (dragState.originalSelection > 0) {
      editor.commands.focus(dragState.originalSelection)
    }

    cleanup()
  }, [editor, dragState.originalSelection])

  // Cleanup function
  const cleanup = useCallback(() => {
    if (editor) {
      editor.view.dom.classList.remove('is-dragging')
    }

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }

    setDragState({
      isDragging: false,
      draggedBlockId: null,
      draggedNode: null,
      draggedPos: 0,
      dropTargetId: null,
      dropPosition: null,
      ghostPosition: { x: 0, y: 0 },
      originalSelection: 0
    })
  }, [editor])

  // Handle escape key
  useEffect(() => {
    if (!dragState.isDragging) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancelDrag()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [dragState.isDragging, cancelDrag])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current)
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  return {
    dragState,
    startDrag,
    updateGhostPosition,
    updateDropTarget,
    completeDrop,
    cancelDrag,
    isDragging: dragState.isDragging
  }
} 