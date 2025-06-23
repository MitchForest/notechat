import { useContentStore } from '@/features/organization/stores'
import type { Note, Chat } from '@/lib/db/schema'

export function useCollectionItems(collectionId: string): (Note | Chat)[] {
  const notes = useContentStore((state) => state.notes)
  const chats = useContentStore((state) => state.chats)
  
  // Filter items by collectionId
  const collectionNotes = notes.filter(note => note.collectionId === collectionId)
  const collectionChats = chats.filter(chat => chat.collectionId === collectionId)
  
  // Combine and sort by updatedAt
  const allItems = [...collectionNotes, ...collectionChats]
  return allItems.sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
} 