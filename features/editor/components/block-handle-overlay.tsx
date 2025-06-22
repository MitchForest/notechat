import { useEffect, useState, useRef, useCallback } from 'react'
import { Editor } from '@tiptap/core'
import { createPortal } from 'react-dom'
import { BlockHandle } from './block-handle'
import { findBlockAtPosition, BlockInfo } from '../utils/block-detection'
import { throttle } from '@/lib/utils'

interface BlockHandleOverlayProps {
  editor: Editor
  container: HTMLElement | null
}

/**
 * BlockHandleOverlay Component
 * 
 * Overlays block handles on native Tiptap blocks without wrapping them in React.
 * Uses mouse position tracking to show handles when hovering over blocks.
 */
export function BlockHandleOverlay({ editor, container }: BlockHandleOverlayProps) {
  const [activeBlock, setActiveBlock] = useState<BlockInfo | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null)
  const [handlePosition, setHandlePosition] = useState({ top: 0, left: 0 })
  
  // Create portal container inside the editor container
  useEffect(() => {
    if (!container) return
    
    const portal = document.createElement('div')
    portal.className = 'block-handle-portal'
    portal.style.position = 'absolute'
    portal.style.top = '0'
    portal.style.left = '0'
    portal.style.width = '0'
    portal.style.height = '0'
    portal.style.pointerEvents = 'none'
    portal.style.zIndex = '10'
    
    // Append to the container, not document.body
    container.appendChild(portal)
    setPortalContainer(portal)
    
    return () => {
      if (container.contains(portal)) {
        container.removeChild(portal)
      }
    }
  }, [container])
  
  // Update handle position when active block changes
  useEffect(() => {
    if (!activeBlock || !container) return
    
    const blockElement = activeBlock.element
    const containerRect = container.getBoundingClientRect()
    const blockRect = blockElement.getBoundingClientRect()
    
    // Position the handle to the left of the block, aligned with its top
    const top = blockRect.top - containerRect.top
    const left = 8 // Position in the left gutter
    
    setHandlePosition({ top, left })
  }, [activeBlock, container])
  
  // Track mouse position to show handles
  useEffect(() => {
    if (!container) return
    
    const handleMouseMove = throttle((e: MouseEvent) => {
      if (isDragging || isMenuOpen) return
      
      // Find block at mouse position
      const block = findBlockAtPosition(e, container, editor)
      setActiveBlock(block)
    }, 50)
    
    const handleMouseLeave = () => {
      if (!isDragging && !isMenuOpen) {
        setActiveBlock(null)
      }
    }
    
    // Add event listeners
    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseleave', handleMouseLeave)
    
    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseleave', handleMouseLeave)
      handleMouseMove.cancel?.()
    }
  }, [container, editor, isDragging, isMenuOpen])
  
  const handleDragStart = useCallback(() => {
    setIsDragging(true)
    // Add dragging class to editor
    editor.view.dom.classList.add('is-dragging')
  }, [editor])
  
  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
    setActiveBlock(null)
    // Remove dragging class from editor
    editor.view.dom.classList.remove('is-dragging')
  }, [editor])
  
  const handleMenuToggle = useCallback((isOpen: boolean) => {
    setIsMenuOpen(isOpen)
  }, [])
  
  // Don't render if no active block or dragging
  if (!activeBlock || isDragging || !portalContainer) {
    return null
  }
  
  // Get the node at the block position
  const blockNode = editor.state.doc.nodeAt(activeBlock.pos)
  if (!blockNode) return null
  
  // Update portal position
  if (portalContainer) {
    portalContainer.style.display = 'block'
    portalContainer.style.transform = `translate(${handlePosition.left}px, ${handlePosition.top}px)`
  }
  
  return createPortal(
    <BlockHandle
      key={activeBlock.id}
      editor={editor}
      blockPos={activeBlock.pos}
      blockNode={blockNode}
      onMenuToggle={handleMenuToggle}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    />,
    portalContainer
  )
} 