/**
 * Component: BlockWrapper
 * Purpose: Wraps each editor block with consistent structure for hover detection and drag handles
 * Features:
 * - Invisible hover target that extends full editor width
 * - Integrated block handle positioning
 * - Preserves all Tiptap functionality
 * 
 * Created: 2024-01-01
 */

import React, { useState, useEffect, useCallback } from 'react'
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import { Node } from '@tiptap/pm/model'
import { Editor } from '@tiptap/core'
import { BlockHandle } from './block-handle'
import { generateBlockId } from '../utils/block-id'
import { cn } from '@/lib/utils'
import { blockDebugger } from '../utils/block-debug'
import { useDragContext } from '../contexts/drag-context'

interface BlockWrapperProps {
  node: Node
  updateAttributes: (attrs: Record<string, any>) => void
  deleteNode: () => void
  selected: boolean
  editor: Editor
  getPos: () => number
  children?: React.ReactNode
  className?: string
}

export const BlockWrapper = React.memo(({ 
  node, 
  updateAttributes, 
  deleteNode,
  selected,
  editor, 
  getPos,
  children,
  className = ''
}: BlockWrapperProps) => {
  const { dragState, onDragStart } = useDragContext()
  const [isHovering, setIsHovering] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const blockId = node.attrs.id || generateBlockId()

  // Ensure block has ID
  useEffect(() => {
    if (!node.attrs.id) {
      updateAttributes({ id: blockId })
    }
  }, [])

  // Check if this block is a drop target
  const isDropTarget = dragState?.dropTargetId === blockId
  const dropPosition = isDropTarget ? dragState?.dropPosition : null

  // Drag handlers with focus management
  const handleDragStart = useCallback((e: React.DragEvent) => {
    setIsDragging(true)
    
    // Critical: Clear selection and blur to hide placeholders
    editor.commands.blur()
    editor.view.dom.classList.add('is-dragging')
    
    // Set drag data
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('application/x-tiptap-block', JSON.stringify({
      blockId: blockId,
      blockPos: getPos(),
      nodeSize: node.nodeSize
    }))
    
    // Custom drag preview
    const preview = document.createElement('div')
    preview.className = 'drag-preview'
    preview.textContent = node.textContent?.substring(0, 50) || 'Block'
    if (node.textContent && node.textContent.length > 50) {
      preview.textContent += '...'
    }
    document.body.appendChild(preview)
    e.dataTransfer.setDragImage(preview, 0, 0)
    setTimeout(() => preview.remove(), 0)
  }, [blockId, getPos, node, editor])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
    editor.view.dom.classList.remove('is-dragging')
  }, [editor])

  return (
    <NodeViewWrapper 
      className={cn(
        'block-wrapper',
        className,
        selected && 'is-selected',
        isDragging && 'is-dragging'
      )}
      data-block-id={blockId}
      data-block-type={node.type.name}
    >
      {/* Drop zone indicator - before */}
      {dropPosition === 'before' && (
        <div className="drop-zone drop-zone-before" />
      )}
      {/* Invisible hover target extending into margins */}
      <div 
        className="hover-target"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      />
      
      {/* Block handle - only visible on hover */}
      <BlockHandle
        visible={isHovering && !isDragging}
        editor={editor}
        node={node}
        pos={getPos()}
        onDelete={deleteNode}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      />
      
      {/* Block content */}
      <div className="block-content">
        {children || <NodeViewContent />}
      </div>
      
      {/* Drop zone indicator - after */}
      {dropPosition === 'after' && (
        <div className="drop-zone drop-zone-after" />
      )}
    </NodeViewWrapper>
  )
}, (prevProps, nextProps) => {
  // Optimize re-renders
  return prevProps.node.eq(nextProps.node) && 
         prevProps.selected === nextProps.selected
})

BlockWrapper.displayName = 'BlockWrapper' 