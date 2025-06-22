/**
 * Component: ConnectionStatus
 * Purpose: Show connection status with smooth animations
 * Features:
 * - Online/offline/reconnecting states
 * - Smooth transitions
 * - Auto-hide when online
 * 
 * Created: December 2024
 */

'use client'

import { useEffect, useState } from 'react'
import { WifiOff, Wifi, AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { offlineQueue } from '@/features/chat/services/offline-queue'
import { motion, AnimatePresence } from 'framer-motion'

interface ConnectionStatusProps {
  className?: string
  retryInfo?: {
    attempt: number
    maxAttempts: number
    nextRetryIn: number
  }
  onRetry?: () => void
}

export function ConnectionStatus({ className, retryInfo, onRetry }: ConnectionStatusProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [queuedCount, setQueuedCount] = useState(0)
  const [showStatus, setShowStatus] = useState(false)
  
  useEffect(() => {
    // Subscribe to connection changes
    const unsubscribe = offlineQueue.onConnectionChange((online) => {
      setIsOnline(online)
      // Show status for 3 seconds when connection changes
      setShowStatus(true)
      if (online) {
        setTimeout(() => setShowStatus(false), 3000)
      }
    })
    
    // Check queued messages periodically
    const checkQueue = async () => {
      const messages = await offlineQueue.getQueuedMessages()
      setQueuedCount(messages.length)
    }
    
    checkQueue()
    const interval = setInterval(checkQueue, 5000)
    
    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [])
  
  // Always show if offline or has queued messages or retry info
  const shouldShow = !isOnline || queuedCount > 0 || retryInfo || showStatus
  
  if (!shouldShow) return null
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md text-sm",
          isOnline ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" : 
                     "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
          className
        )}
      >
        {isOnline ? (
          <Wifi className="h-4 w-4" />
        ) : (
          <WifiOff className="h-4 w-4" />
        )}
        
        <span className="font-medium">
          {isOnline ? 'Connected' : 'Offline'}
        </span>
        
        {queuedCount > 0 && (
          <span className="text-xs opacity-75">
            ({queuedCount} message{queuedCount > 1 ? 's' : ''} queued)
          </span>
        )}
        
        {retryInfo && (
          <>
            <AlertCircle className="h-4 w-4 ml-2" />
            <span className="text-xs">
              Retry {retryInfo.attempt}/{retryInfo.maxAttempts} in {retryInfo.nextRetryIn}s
            </span>
            {onRetry && (
              <button
                onClick={onRetry}
                className="ml-2 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded"
                title="Retry now"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            )}
          </>
        )}
      </motion.div>
    </AnimatePresence>
  )
} 