import { useState, useCallback, useEffect } from 'react'
import { Message } from 'ai'

export interface UseMessageSearchOptions {
  messages: Message[]
  scrollToMessage?: (messageId: string) => void
}

export function useMessageSearch({ messages, scrollToMessage }: UseMessageSearchOptions) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentMatch, setCurrentMatch] = useState<{
    messageId: string
    matchIndex: number
  } | null>(null)
  
  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + F to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        setIsSearchOpen(true)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  const openSearch = useCallback(() => {
    setIsSearchOpen(true)
  }, [])
  
  const closeSearch = useCallback(() => {
    setIsSearchOpen(false)
    setSearchQuery('')
    setCurrentMatch(null)
  }, [])
  
  const handleResultSelect = useCallback((messageId: string, matchIndex: number) => {
    setCurrentMatch({ messageId, matchIndex })
    
    // Scroll to the message
    if (scrollToMessage) {
      scrollToMessage(messageId)
    } else {
      // Fallback: try to find and scroll to element
      const element = document.querySelector(`[data-message-id="${messageId}"]`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [scrollToMessage])
  
  return {
    isSearchOpen,
    searchQuery,
    currentMatch,
    openSearch,
    closeSearch,
    handleResultSelect,
    setSearchQuery
  }
} 