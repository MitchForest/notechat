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
import { WifiOff, Wifi, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

type ConnectionState = 'online' | 'offline' | 'reconnecting'

interface ConnectionStatusProps {
  className?: string
}

export function ConnectionStatus({ className }: ConnectionStatusProps) {
  const [status, setStatus] = useState<ConnectionState>('online')
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setStatus('online')
      // Hide after 2 seconds when back online
      setTimeout(() => {
        if (navigator.onLine) {
          setIsVisible(false)
        }
      }, 2000)
    }

    const handleOffline = () => {
      setStatus('offline')
      setIsVisible(true)
    }

    // Check initial state
    if (!navigator.onLine) {
      handleOffline()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Simulate reconnecting state
  useEffect(() => {
    if (status === 'offline') {
      const timer = setTimeout(() => {
        setStatus('reconnecting')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [status])

  const getStatusConfig = () => {
    switch (status) {
      case 'online':
        return {
          icon: Wifi,
          text: 'Back online',
          className: 'bg-green-500/10 text-green-600 border-green-500/20',
          iconClassName: 'text-green-600'
        }
      case 'offline':
        return {
          icon: WifiOff,
          text: 'No connection',
          className: 'bg-destructive/10 text-destructive border-destructive/20',
          iconClassName: 'text-destructive'
        }
      case 'reconnecting':
        return {
          icon: RefreshCw,
          text: 'Reconnecting...',
          className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
          iconClassName: 'text-yellow-600 animate-spin'
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <div
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-50",
        "transition-all duration-500 ease-in-out",
        isVisible 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 -translate-y-full pointer-events-none",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full",
          "border shadow-lg backdrop-blur-sm",
          "animate-in fade-in-0 slide-in-from-top-2",
          config.className
        )}
      >
        <Icon className={cn("h-4 w-4", config.iconClassName)} />
        <span className="text-sm font-medium">{config.text}</span>
      </div>
    </div>
  )
} 