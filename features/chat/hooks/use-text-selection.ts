/**
 * Hook: useTextSelection
 * Purpose: Track text selection in chat and manage selection menu
 * Features:
 * - Track selection state and position
 * - Calculate menu position
 * - Handle cross-message selection
 * - Mobile support with long press
 * 
 * Created: December 2024
 */

import { useState, useEffect, useCallback, useRef } from 'react'

interface SelectionState {
  text: string
  range: Range | null
  position: { x: number; y: number } | null
  isSelecting: boolean
}

interface UseTextSelectionReturn {
  selection: SelectionState
  showMenu: boolean
  menuPosition: { x: number; y: number } | null
  clearSelection: () => void
  handleTextSelection: () => void
}

export function useTextSelection(): UseTextSelectionReturn {
  const [selection, setSelection] = useState<SelectionState>({
    text: '',
    range: null,
    position: null,
    isSelecting: false,
  })
  const [showMenu, setShowMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null)
  
  // Refs for touch handling
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  // Calculate menu position based on selection
  const calculateMenuPosition = useCallback((range: Range) => {
    const rect = range.getBoundingClientRect()
    
    // Calculate position
    let x = rect.left + rect.width / 2
    let y = rect.top - 8 // 8px above selection
    
    // Get menu dimensions (approximate)
    const menuWidth = 200
    const menuHeight = 120
    
    // Adjust for viewport boundaries
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // Horizontal adjustment
    if (x - menuWidth / 2 < 8) {
      x = menuWidth / 2 + 8
    } else if (x + menuWidth / 2 > viewportWidth - 8) {
      x = viewportWidth - menuWidth / 2 - 8
    }
    
    // Vertical adjustment (flip to below if not enough space above)
    if (y - menuHeight < 8) {
      y = rect.bottom + 8
    }
    
    return { x, y }
  }, [])

  // Handle text selection
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection()
    
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setShowMenu(false)
      setSelection({
        text: '',
        range: null,
        position: null,
        isSelecting: false,
      })
      return
    }
    
    const text = selection.toString().trim()
    const range = selection.getRangeAt(0)
    
    // Check if selection is within chat messages
    const container = range.commonAncestorContainer
    const chatContainer = container.nodeType === Node.TEXT_NODE
      ? container.parentElement?.closest('.chat-messages-container')
      : (container as Element).closest('.chat-messages-container')
    
    if (!chatContainer) {
      return
    }
    
    const position = calculateMenuPosition(range)
    
    setSelection({
      text,
      range,
      position,
      isSelecting: true,
    })
    
    setMenuPosition(position)
    setShowMenu(true)
  }, [calculateMenuPosition])

  // Clear selection
  const clearSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges()
    setShowMenu(false)
    setSelection({
      text: '',
      range: null,
      position: null,
      isSelecting: false,
    })
    setMenuPosition(null)
  }, [])

  // Handle mouse up (desktop selection)
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      // Small delay to ensure selection is complete
      setTimeout(() => {
        handleTextSelection()
      }, 10)
    }
    
    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [handleTextSelection])

  // Handle touch events (mobile long press)
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      touchStartRef.current = { x: touch.clientX, y: touch.clientY }
      
      // Start long press timer
      touchTimerRef.current = setTimeout(() => {
        // Trigger selection mode
        handleTextSelection()
      }, 500) // 500ms for long press
    }
    
    const handleTouchMove = (e: TouchEvent) => {
      // Cancel long press if user moves finger
      if (touchStartRef.current && touchTimerRef.current) {
        const touch = e.touches[0]
        const deltaX = Math.abs(touch.clientX - touchStartRef.current.x)
        const deltaY = Math.abs(touch.clientY - touchStartRef.current.y)
        
        if (deltaX > 10 || deltaY > 10) {
          clearTimeout(touchTimerRef.current)
          touchTimerRef.current = null
        }
      }
    }
    
    const handleTouchEnd = () => {
      if (touchTimerRef.current) {
        clearTimeout(touchTimerRef.current)
        touchTimerRef.current = null
      }
      touchStartRef.current = null
    }
    
    document.addEventListener('touchstart', handleTouchStart)
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleTouchEnd)
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
      if (touchTimerRef.current) {
        clearTimeout(touchTimerRef.current)
      }
    }
  }, [handleTextSelection])

  // Handle selection change
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed) {
        // Only clear if menu is showing and no text is selected
        if (showMenu && !selection?.toString().trim()) {
          setTimeout(() => {
            setShowMenu(false)
          }, 200) // Small delay to allow for menu clicks
        }
      }
    }
    
    document.addEventListener('selectionchange', handleSelectionChange)
    return () => document.removeEventListener('selectionchange', handleSelectionChange)
  }, [showMenu])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showMenu) {
        clearSelection()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showMenu, clearSelection])

  return {
    selection,
    showMenu,
    menuPosition,
    clearSelection,
    handleTextSelection,
  }
} 