'use client'

import React from 'react'
import { FileText, MessageSquare, Star, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Note, Chat } from '@/lib/db/schema'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface SearchResultsProps {
  searchQuery: string
  isSearching: boolean
  results: {
    notes: Note[]
    chats: Chat[]
  }
  onItemClick: (item: Note | Chat, type: 'note' | 'chat') => void
  onClear: () => void
}

export function SearchResults({
  searchQuery,
  isSearching,
  results,
  onItemClick,
  onClear
}: SearchResultsProps) {
  const totalResults = results.notes.length + results.chats.length

  // Highlight matching text
  const highlightMatch = (text: string) => {
    if (!searchQuery) return text
    
    const regex = new RegExp(`(${searchQuery})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-900 text-inherit rounded-sm px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  return (
    <div className="absolute inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {isSearching ? (
              'Searching...'
            ) : (
              <>
                {totalResults} result{totalResults !== 1 ? 's' : ''} for "{searchQuery}"
              </>
            )}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Results */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {!isSearching && totalResults === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No results found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try searching with different keywords
              </p>
            </div>
          )}

          {/* Notes Section */}
          {results.notes.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-1">
                Notes ({results.notes.length})
              </h3>
              <div className="space-y-1">
                {results.notes.map((note) => (
                  <button
                    key={note.id}
                    className={cn(
                      "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left",
                      "hover:bg-hover-1 transition-colors"
                    )}
                    onClick={() => onItemClick(note, 'note')}
                  >
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    {note.isStarred && <Star className="h-3 w-3 fill-current text-yellow-500 flex-shrink-0" />}
                    <span className="truncate flex-1">
                      {highlightMatch(note.title)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chats Section */}
          {results.chats.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-1">
                Chats ({results.chats.length})
              </h3>
              <div className="space-y-1">
                {results.chats.map((chat) => (
                  <button
                    key={chat.id}
                    className={cn(
                      "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left",
                      "hover:bg-hover-1 transition-colors"
                    )}
                    onClick={() => onItemClick(chat, 'chat')}
                  >
                    <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    {chat.isStarred && <Star className="h-3 w-3 fill-current text-yellow-500 flex-shrink-0" />}
                    <span className="truncate flex-1">
                      {highlightMatch(chat.title)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer with shortcuts */}
      <div className="p-2 border-t">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Press ESC to clear</span>
          <span>↑↓ to navigate</span>
        </div>
      </div>
    </div>
  )
} 