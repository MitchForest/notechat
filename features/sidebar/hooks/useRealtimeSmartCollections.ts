import { useEffect, useMemo } from 'react'
import { useSmartCollectionStore } from '@/features/organization/stores'
import type { SmartCollection } from '@/lib/db/schema'

export function useRealtimeSmartCollections(spaceId: string): SmartCollection[] {
  const smartCollections = useSmartCollectionStore((state) => state.smartCollections)
  
  // Filter smart collections for this space
  const spaceSmartCollections = useMemo(() => {
    return smartCollections.filter(sc => sc.spaceId === spaceId)
  }, [smartCollections, spaceId])
  
  // Subscribe to smart collection changes
  useEffect(() => {
    const unsubscribe = useSmartCollectionStore.subscribe(
      (state) => state.smartCollections
    )
    
    return unsubscribe
  }, [])
  
  return spaceSmartCollections
} 