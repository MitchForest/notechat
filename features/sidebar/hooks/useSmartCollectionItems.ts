import { useContentStore } from '@/features/organization/stores'
import type { Note, Chat, SmartCollection } from '@/lib/db/schema'

interface FilterConfig {
  type?: 'all' | 'note' | 'chat'
  timeRange?: {
    unit: 'days' | 'weeks' | 'months'
    value: number
  }
  isStarred?: boolean
  orderBy?: 'updatedAt' | 'createdAt' | 'title'
  orderDirection?: 'asc' | 'desc'
}

export function useSmartCollectionItems(smartCollection: SmartCollection): (Note | Chat)[] {
  const notes = useContentStore((state) => state.notes)
  const chats = useContentStore((state) => state.chats)
  
  // Get all items in the space
  const spaceItems = [...notes, ...chats].filter(item => item.spaceId === smartCollection.spaceId)
  
  const filterConfig = smartCollection.filterConfig as FilterConfig
  let filteredItems: (Note | Chat)[] = []
  
  // Apply type filter
  if (filterConfig.type === 'all' || !filterConfig.type) {
    filteredItems = spaceItems
  } else if (filterConfig.type === 'note') {
    filteredItems = spaceItems.filter(item => !item.id.startsWith('chat-'))
  } else if (filterConfig.type === 'chat') {
    filteredItems = spaceItems.filter(item => item.id.startsWith('chat-'))
  }
  
  // Apply time range filter
  if (filterConfig.timeRange) {
    const cutoffDate = new Date()
    const { unit, value } = filterConfig.timeRange
    
    switch (unit) {
      case 'days':
        cutoffDate.setDate(cutoffDate.getDate() - value)
        break
      case 'weeks':
        cutoffDate.setDate(cutoffDate.getDate() - (value * 7))
        break
      case 'months':
        cutoffDate.setMonth(cutoffDate.getMonth() - value)
        break
    }
    
    filteredItems = filteredItems.filter(item => new Date(item.updatedAt) > cutoffDate)
  }
  
  // Apply starred filter
  if (filterConfig.isStarred) {
    filteredItems = filteredItems.filter(item => item.isStarred)
  }
  
  // Sort
  const orderBy = filterConfig.orderBy || 'updatedAt'
  const orderDirection = filterConfig.orderDirection || 'desc'
  
  return filteredItems.sort((a, b) => {
    let aValue: string | number
    let bValue: string | number
    
    if (orderBy === 'title') {
      aValue = a.title
      bValue = b.title
    } else if (orderBy === 'createdAt') {
      aValue = new Date(a.createdAt).getTime()
      bValue = new Date(b.createdAt).getTime()
    } else {
      aValue = new Date(a.updatedAt).getTime()
      bValue = new Date(b.updatedAt).getTime()
    }
    
    if (orderDirection === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })
} 