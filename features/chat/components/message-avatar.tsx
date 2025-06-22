/**
 * Component: MessageAvatar
 * Purpose: Display user or AI avatar in chat messages
 * Features:
 * - User avatar with initial or image
 * - Elegant AI icon
 * - Consistent 32px size
 * - Smooth animations
 * 
 * Created: December 2024
 */

import { cn } from '@/lib/utils'
import { User, Sparkles } from 'lucide-react'

interface MessageAvatarProps {
  role: 'user' | 'assistant' | 'system' | 'data'
  userName?: string
  userImage?: string
  className?: string
}

export function MessageAvatar({ 
  role, 
  userName, 
  userImage, 
  className 
}: MessageAvatarProps) {
  if (role === 'user') {
    if (userImage) {
      return (
        <div className={cn('chat-avatar user', className)}>
          <img 
            src={userImage} 
            alt={userName || 'User'} 
            className="w-full h-full rounded-full object-cover"
          />
        </div>
      )
    }
    
    const initial = userName ? userName.charAt(0).toUpperCase() : 'U'
    
    return (
      <div className={cn('chat-avatar user', className)}>
        {initial}
      </div>
    )
  }
  
  // AI Avatar with elegant icon (for assistant, system, or data roles)
  return (
    <div className={cn('chat-avatar assistant', className)}>
      <Sparkles className="w-4 h-4" />
    </div>
  )
} 