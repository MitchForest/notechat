/**
 * Drag & Drop Hook
 * Purpose: Manage drag and drop operations for notes and chats
 * Features:
 * - Handle drag start/end events
 * - Validate drop targets
 * - Integrate with organization store
 * - Provide visual feedback helpers
 * 
 * Created: 2024-12-19
 */

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragOverlay as DndDragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
} from '@dnd-kit/core'
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { useContentStore, useSpaceStore } from '../stores'
import {
  DragItem,
  DropTarget,
  DragOverlay,
  DropIndicator,
  isDragItem,
  isDropTarget,
  canAcceptDrop,
} from '../types/drag-drop'

export function useDragDrop() {
  const { moveItem } = useContentStore()
  
  // Drag state
  const [dragOverlay, setDragOverlay] = useState<DragOverlay>({
    item: null,
    isDragging: false,
  })
  
  // Drop indicator state
  const [dropIndicator, setDropIndicator] = useState<DropIndicator>({
    targetId: null,
    isOver: false,
    canDrop: false,
  })
  
  // Configure sensors for better UX
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px drag threshold
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    const dragData = active.data.current
    
    if (isDragItem(dragData)) {
      setDragOverlay({
        item: dragData,
        isDragging: true,
      })
    }
  }, [])
  
  // Handle drag over
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event
    
    if (!over) {
      setDropIndicator({
        targetId: null,
        isOver: false,
        canDrop: false,
      })
      return
    }
    
    const dragData = active.data.current
    const dropData = over.data.current
    
    if (isDragItem(dragData) && isDropTarget(dropData)) {
      const canDrop = canAcceptDrop(dropData, dragData)
      
      setDropIndicator({
        targetId: over.id as string,
        isOver: true,
        canDrop,
      })
    }
  }, [])
  
  // Handle drag end
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    
    // Reset drag state
    setDragOverlay({
      item: null,
      isDragging: false,
    })
    
    setDropIndicator({
      targetId: null,
      isOver: false,
      canDrop: false,
    })
    
    // No drop target or dropped on itself
    if (!over || active.id === over.id) {
      return
    }
    
    const dragData = active.data.current
    const dropData = over.data.current
    
    // Validate drag and drop data
    if (!isDragItem(dragData) || !isDropTarget(dropData)) {
      return
    }
    
    // Check if drop is allowed
    if (!canAcceptDrop(dropData, dragData)) {
      return
    }
    
    // Perform the move
    await moveItem(dragData.id, dragData.type, dropData.id)
  }, [moveItem])
  
  // Handle drag cancel
  const handleDragCancel = useCallback(() => {
    setDragOverlay({
      item: null,
      isDragging: false,
    })
    
    setDropIndicator({
      targetId: null,
      isOver: false,
      canDrop: false,
    })
  }, [])
  
  // Create drag data for an item
  const createDragData = useCallback((item: DragItem): Record<string, unknown> => {
    return {
      id: item.id,
      type: item.type,
      title: item.title,
      collectionId: item.collectionId,
      isStarred: item.isStarred,
    }
  }, [])
  
  // Create drop data for a collection
  const createDropData = useCallback((target: DropTarget): Record<string, unknown> => {
    return {
      id: target.id,
      type: target.type,
      spaceId: target.spaceId,
      spaceType: target.spaceType,
      collectionType: target.collectionType,
      acceptsType: target.acceptsType,
      name: target.name,
    }
  }, [])
  
  return {
    // DndContext props
    sensors,
    collisionDetection: closestCenter,
    onDragStart: handleDragStart,
    onDragOver: handleDragOver,
    onDragEnd: handleDragEnd,
    onDragCancel: handleDragCancel,
    
    // State
    dragOverlay,
    dropIndicator,
    
    // Utilities
    createDragData,
    createDropData,
    
    // Components
    DndContext,
    DragOverlay: DndDragOverlay,
  }
}

// Helper hook for drop zone styling
export function useDropZone(collectionId: string, dropIndicator: DropIndicator) {
  const isOver = dropIndicator.targetId === collectionId && dropIndicator.isOver
  const canDrop = dropIndicator.targetId === collectionId && dropIndicator.canDrop
  
  return {
    isOver,
    canDrop,
    dropZoneProps: {
      'data-drop-zone': true,
      'data-can-drop': canDrop,
      'data-is-over': isOver,
    },
  }
}

// Get visual styles for drag over states
export function getDragOverStyles(isOver: boolean, canDrop: boolean) {
  if (!isOver) return {}
  
  if (canDrop) {
    return {
      backgroundColor: 'oklch(var(--primary) / 0.1)',
      borderColor: 'oklch(var(--primary))',
      borderStyle: 'dashed' as const,
      borderWidth: '2px',
      transition: 'all 150ms ease-out',
    }
  } else {
    return {
      backgroundColor: 'oklch(var(--destructive) / 0.1)',
      cursor: 'not-allowed',
      transition: 'all 150ms ease-out',
    }
  }
} 