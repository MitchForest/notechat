import { useEffect } from 'react'
import { useContentStore } from '@/features/organization/stores'

export function useRealtimeContent() {
  // Subscribe to content changes
  useEffect(() => {
    const unsubscribe = useContentStore.subscribe(
      (state) => ({ notes: state.notes, chats: state.chats })
    )
    
    return unsubscribe
  }, [])
  
  // The actual data is accessed directly from the store in components
  // This hook just ensures subscriptions are set up
} 