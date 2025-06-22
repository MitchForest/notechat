'use client'

import { useEffect, useRef, useState } from 'react'
import { X, ChevronUp, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ChatSearchProps {
  isOpen: boolean
  onClose: () => void
  messages: Array<{ id: string; content: string; role: string }>
  onResultSelect: (messageId: string, matchIndex: number) => void
}

export interface SearchMatch {
  messageId: string
  matches: Array<{
    index: number
    start: number
    end: number
    text: string
  }>
}

export function ChatSearch({ isOpen, onClose, messages, onResultSelect }: ChatSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  const [searchMatches, setSearchMatches] = useState<SearchMatch[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Calculate total matches
  const totalMatches = searchMatches.reduce((sum, match) => sum + match.matches.length, 0)
  
  // Get current match position
  let currentPosition = 0
  let currentMessageId = ''
  let currentMatchInMessage = 0
  
  if (totalMatches > 0) {
    let count = 0
    for (const searchMatch of searchMatches) {
      for (let i = 0; i < searchMatch.matches.length; i++) {
        if (count === currentMatchIndex) {
          currentPosition = count + 1
          currentMessageId = searchMatch.messageId
          currentMatchInMessage = i
          break
        }
        count++
      }
      if (currentMessageId) break
    }
  }
  
  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])
  
  // Perform search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchMatches([])
      setCurrentMatchIndex(0)
      return
    }
    
    const query = searchQuery.toLowerCase()
    const matches: SearchMatch[] = []
    
    messages.forEach(message => {
      const content = message.content.toLowerCase()
      const messageMatches: SearchMatch['matches'] = []
      
      let startIndex = 0
      let matchIndex = content.indexOf(query, startIndex)
      
      while (matchIndex !== -1) {
        messageMatches.push({
          index: messageMatches.length,
          start: matchIndex,
          end: matchIndex + query.length,
          text: message.content.substring(matchIndex, matchIndex + query.length)
        })
        
        startIndex = matchIndex + 1
        matchIndex = content.indexOf(query, startIndex)
      }
      
      if (messageMatches.length > 0) {
        matches.push({
          messageId: message.id,
          matches: messageMatches
        })
      }
    })
    
    setSearchMatches(matches)
    setCurrentMatchIndex(0)
    
    // Navigate to first match
    if (matches.length > 0 && matches[0].matches.length > 0) {
      onResultSelect(matches[0].messageId, 0)
    }
  }, [searchQuery, messages, onResultSelect])
  
  // Navigate to current match
  useEffect(() => {
    if (currentMessageId) {
      onResultSelect(currentMessageId, currentMatchInMessage)
    }
  }, [currentMatchIndex, currentMessageId, currentMatchInMessage, onResultSelect])
  
  const handlePrevious = () => {
    if (totalMatches === 0) return
    setCurrentMatchIndex((prev) => (prev - 1 + totalMatches) % totalMatches)
  }
  
  const handleNext = () => {
    if (totalMatches === 0) return
    setCurrentMatchIndex((prev) => (prev + 1) % totalMatches)
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        handlePrevious()
      } else {
        handleNext()
      }
      e.preventDefault()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }
  
  if (!isOpen) return null
  
  return (
    <div className="absolute top-0 left-0 right-0 z-20 bg-background border-b p-2 shadow-sm">
      <div className="flex items-center gap-2 max-w-2xl mx-auto">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        
        <div className="flex items-center gap-1 text-sm text-muted-foreground min-w-[100px] justify-center">
          {totalMatches > 0 ? (
            <span>{currentPosition} of {totalMatches}</span>
          ) : searchQuery ? (
            <span>No results</span>
          ) : null}
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={handlePrevious}
            disabled={totalMatches === 0}
            className="h-8 w-8"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          
          <Button
            size="icon"
            variant="ghost"
            onClick={handleNext}
            disabled={totalMatches === 0}
            className="h-8 w-8"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Export function to highlight search results in message content
export function highlightSearchResults(
  content: string,
  searchQuery: string,
  isCurrentMatch: boolean = false
): React.ReactNode {
  if (!searchQuery) return content
  
  const regex = new RegExp(`(${searchQuery})`, 'gi')
  const parts = content.split(regex)
  
  return parts.map((part, index) => {
    if (regex.test(part)) {
      return (
        <mark
          key={index}
          className={cn(
            "px-0.5 rounded",
            isCurrentMatch 
              ? "bg-orange-300 text-orange-900 dark:bg-orange-500 dark:text-orange-100" 
              : "bg-yellow-200 text-yellow-900 dark:bg-yellow-500 dark:text-yellow-100"
          )}
        >
          {part}
        </mark>
      )
    }
    return part
  })
} 