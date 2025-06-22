/**
 * Drag & Drop Type Definitions
 * Purpose: Define types for drag and drop operations in the organization system
 * Features:
 * - Type-safe drag items (notes and chats)
 * - Type-safe drop targets (collections)
 * - Support for different collection types
 * 
 * Created: 2024-12-19
 */

export interface DragItem {
  id: string
  type: 'note' | 'chat'
  title: string
  collectionId: string | null
  isStarred?: boolean
}

export interface DropTarget {
  id: string
  type: 'collection'
  spaceId: string
  spaceType: 'static' | 'seeded' | 'user' | 'system'
  collectionType: 'static' | 'seeded' | 'user' | 'system'
  acceptsType: 'note' | 'chat' | 'both'
  name: string
}

export interface DragOverlay {
  item: DragItem | null
  isDragging: boolean
}

export interface DropIndicator {
  targetId: string | null
  isOver: boolean
  canDrop: boolean
}

// Helper type guards
export function isDragItem(data: unknown): data is DragItem {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'type' in data &&
    (data.type === 'note' || data.type === 'chat')
  )
}

export function isDropTarget(data: unknown): data is DropTarget {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'type' in data &&
    data.type === 'collection'
  )
}

// Determine if a collection can accept a specific item type
export function canAcceptDrop(target: DropTarget, item: DragItem): boolean {
  // Static collections in permanent spaces cannot accept drops
  if (target.collectionType === 'static') {
    // Exception: "All" collections in permanent spaces can accept items
    if (target.id === 'notes-all' || target.id === 'chats-all') {
      return target.acceptsType === item.type || target.acceptsType === 'both'
    }
    return false
  }
  
  // Check if the collection accepts this item type
  return target.acceptsType === item.type || target.acceptsType === 'both'
} 