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

import { useRef, useState, useCallback, useEffect } from 'react';
import { Editor } from '@tiptap/core';
import { Node as ProseMirrorNode } from 'prosemirror-model';
import { cn } from '@/lib/utils';
import { blockDebugger } from '../utils/block-debug';
import { useDragContext } from '../contexts/drag-context';

interface BlockWrapperProps {
  editor: Editor;
  node: ProseMirrorNode;
  getPos: () => number;
  className?: string;
  children: React.ReactNode;
}

export const BlockWrapper: React.FC<BlockWrapperProps> = ({
  editor,
  node,
  getPos,
  className,
  children
}) => {
  const { dragState, onDragStart } = useDragContext();
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const blockPos = typeof getPos === 'function' ? getPos() : 0;
  const blockId = `block-${blockPos}`;
  const blockType = node.type.name;
  
  // Check if this block is a drop target
  const isDropTarget = dragState?.dropTargetId === blockId;
  const dropPosition = isDropTarget ? dragState?.dropPosition : null;
  
  // Handle hover with a small delay to prevent flickering
  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      if (!isDragging) {
        blockDebugger.logHoverEnter(blockId);
        setIsHovered(true);
      }
    }, 50); // 50ms delay to prevent flickering
  }, [blockId, isDragging]);
  
  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (!isMenuOpen) {
      hoverTimeoutRef.current = setTimeout(() => {
        blockDebugger.logHoverLeave(blockId);
        setIsHovered(false);
      }, 100); // 100ms delay to allow moving to handle
    }
  }, [blockId, isMenuOpen]);
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);
  
  // Handle drag events
  const handleDragStart = useCallback((e: React.DragEvent) => {
    setIsDragging(true);
    setIsHovered(false);
    
    // Call the parent drag handler if provided
    if (onDragStart) {
      onDragStart({
        blockId,
        blockNode: node,
        blockPos
      });
    }
    
    blockDebugger.logDragStart(blockId, blockPos);
  }, [node, blockPos, blockId, onDragStart]);
  
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    editor.view.dom.classList.remove('is-dragging');
  }, [editor]);
  
  // Dynamic import BlockHandle to avoid circular dependencies
  const [BlockHandle, setBlockHandle] = useState<any>(null);
  
  useEffect(() => {
    import('./block-handle').then(module => {
      setBlockHandle(() => module.BlockHandle);
    });
  }, []);
  
  return (
    <div 
      ref={wrapperRef}
      className={cn(
        "block-wrapper group relative",
        isDragging && "is-dragging opacity-50",
        dragState?.isDragging && !isDragging && "drag-active",
        className
      )}
      data-block-id={blockId}
      data-block-type={blockType}
      data-block-pos={blockPos}
    >
      {/* Drop zone indicator - before */}
      {dropPosition === 'before' && (
        <div className="drop-zone drop-zone-before" />
      )}
      {/* Invisible hover target - extends beyond content for easy hovering */}
      <div
        className="hover-target absolute inset-0"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          // Extend the hover area beyond the content
          left: '-3rem',
          right: '-3rem',
          zIndex: 1,
          // Debug visualization - uncomment to see hover areas
          // background: 'rgba(255, 0, 0, 0.1)',
          // border: '1px dashed red',
        }}
      />
      
      {/* Block handle - only render when loaded and hovered */}
      {BlockHandle && (isHovered || isMenuOpen) && !isDragging && (
        <div className="block-handle-container absolute left-0 top-0" style={{ 
          transform: 'translateX(-2.5rem)',
          zIndex: 10 
        }}>
          <BlockHandle
            editor={editor}
            blockPos={blockPos}
            blockNode={node}
            onMenuToggle={setIsMenuOpen}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        </div>
      )}
      
      {/* Block content */}
      <div className="block-content relative z-0">
        {children}
      </div>
      
      {/* Drop zone indicator - after */}
      {dropPosition === 'after' && (
        <div className="drop-zone drop-zone-after" />
      )}
    </div>
  );
}; 