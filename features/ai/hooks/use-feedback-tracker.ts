'use client'

import { useCallback } from 'react'

interface FeedbackData {
  operation: 'transform' | 'completion' | 'ghost-text'
  action: 'accepted' | 'ignored' | 'edited'
  prompt?: string
  input?: string
  output?: string
  finalText?: string
  metadata?: Record<string, any>
}

export function useFeedbackTracker() {
  const trackFeedback = useCallback(async (data: FeedbackData) => {
    try {
      // Fire and forget - don't wait for response
      fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
    } catch (error) {
      // Silently fail - don't interrupt user experience
      console.error('Failed to track feedback:', error)
    }
  }, [])

  return { trackFeedback }
} 