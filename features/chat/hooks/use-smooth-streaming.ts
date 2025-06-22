/**
 * Hook: useSmoothStreaming
 * Purpose: Butter-smooth token rendering at 60fps
 * Features:
 * - Smart token buffering (16-32ms)
 * - Progressive word/line rendering
 * - Performance monitoring
 * - Adaptive quality
 * 
 * Created: December 2024
 */

'use client'

import { useRef, useCallback, useEffect } from 'react'

interface StreamConfig {
  onTokensReady: (tokens: string) => void
  adaptiveBuffering?: boolean
  targetFPS?: number
}

interface StreamMetrics {
  tokensPerSecond: number
  bufferTime: number
}

export function useSmoothStreaming({ 
  onTokensReady, 
  adaptiveBuffering = true,
  targetFPS = 60 
}: StreamConfig) {
  const bufferRef = useRef('')
  const frameRef = useRef<number | undefined>(undefined)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const metricsRef = useRef({
    tokensPerSecond: 0,
    lastFlush: Date.now(),
    tokenCount: 0,
  })
  
  // Adaptive buffer timing based on performance
  const bufferTimeRef = useRef(16) // Start with 1 frame (16ms at 60fps)

  const flush = useCallback(() => {
    if (bufferRef.current) {
      const now = Date.now()
      const timeDelta = now - metricsRef.current.lastFlush
      
      // Calculate performance metrics
      if (timeDelta > 0) {
        const tps = (metricsRef.current.tokenCount / timeDelta) * 1000
        metricsRef.current.tokensPerSecond = tps
        
        // Adapt buffer time based on stream speed
        if (adaptiveBuffering) {
          if (tps > 50) {
            // Fast streams: buffer for 2 frames to prevent jank
            bufferTimeRef.current = 32
          } else if (tps < 20) {
            // Slow streams: flush more frequently for responsiveness
            bufferTimeRef.current = 8
          } else {
            // Normal speed: 1 frame
            bufferTimeRef.current = 16
          }
        }
      }
      
      // Send buffered tokens
      onTokensReady(bufferRef.current)
      
      // Reset buffer and metrics
      bufferRef.current = ''
      metricsRef.current.lastFlush = now
      metricsRef.current.tokenCount = 0
    }
  }, [onTokensReady, adaptiveBuffering])

  const addToken = useCallback((token: string) => {
    bufferRef.current += token
    metricsRef.current.tokenCount++
    
    // Cancel any pending flush
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current)
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Schedule flush with adaptive timing
    const scheduleFlush = () => {
      frameRef.current = requestAnimationFrame(() => {
        flush()
      })
    }
    
    // Use setTimeout for precise timing control
    timeoutRef.current = setTimeout(scheduleFlush, bufferTimeRef.current)
  }, [flush])

  // Force flush on unmount or when streaming ends
  const forceFlush = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current)
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    flush()
  }, [flush])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      forceFlush()
    }
  }, [forceFlush])

  return {
    addToken,
    flush: forceFlush,
    metrics: {
      tokensPerSecond: metricsRef.current.tokensPerSecond,
      bufferTime: bufferTimeRef.current,
    } as StreamMetrics
  }
} 