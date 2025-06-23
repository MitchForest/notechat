import { useCallback } from 'react'
import { useContentStore } from '@/features/organization/stores'
import type { Note, Chat } from '@/lib/db/schema'

interface DragData {
  id: string
  type: 'note' | 'chat'
  title: string
  sourceCollectionId: string | null
}

interface DropData {
  id: string
  type: 'collection' | 'space'
  acceptsItems: boolean
}

export function useSidebarDragDrop() {
  const { moveItem } = useContentStore()
  
  const handleDragStart = useCallback((e: React.DragEvent, data: DragData) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('application/json', JSON.stringify(data))
  }, [])
  
  const handleDragOver = useCallback((e: React.DragEvent, dropData: DropData) => {
    if (!dropData.acceptsItems) {
      e.dataTransfer.dropEffect = 'none'
      return
    }
    
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])
  
  const handleDrop = useCallback(async (e: React.DragEvent, dropData: DropData) => {
    e.preventDefault()
    
    if (!dropData.acceptsItems) return
    
    try {
      const dragData: DragData = JSON.parse(e.dataTransfer.getData('application/json'))
      
      // Don't allow dropping on the same collection
      if (dropData.type === 'collection' && dragData.sourceCollectionId === dropData.id) {
        return
      }
      
      // Move the item
      await moveItem(dragData.id, dragData.type, dropData.id)
    } catch (error) {
      console.error('Drop failed:', error)
    }
  }, [moveItem])
  
  return {
    handleDragStart,
    handleDragOver,
    handleDrop
  }
} 