import { useEffect, useMemo } from 'react'
import { useCollectionStore } from '@/features/organization/stores'
import type { Collection } from '@/lib/db/schema'

export function useRealtimeCollections(spaceId: string): Collection[] {
  const collections = useCollectionStore((state) => state.collections)
  
  // Filter collections for this space
  const spaceCollections = useMemo(() => {
    return collections.filter(c => c.spaceId === spaceId)
  }, [collections, spaceId])
  
  // Subscribe to collection changes
  useEffect(() => {
    const unsubscribe = useCollectionStore.subscribe(
      (state) => state.collections
    )
    
    return unsubscribe
  }, [])
  
  return spaceCollections
} 