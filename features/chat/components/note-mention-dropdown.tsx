'use client'

import { useState, useEffect, useCallback } from 'react'
import { Command, CommandInput, CommandList, CommandItem, CommandGroup, CommandSeparator } from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { useNoteContextStore } from '@/features/chat/stores/note-context-store'
import { useContentStore } from '@/features/organization/stores'
import { Note } from '@/lib/db/schema'
import { FileText, Clock, Star } from 'lucide-react'

interface NoteMentionDropdownProps {
  search: string
  position: { top: number; left: number }
  onSelect: (note: Note) => void
  onClose: () => void
}

interface FilteredNote {
  note: Note
  priority: number
  badge?: string
  icon?: React.ReactNode
}

export function NoteMentionDropdown({ 
  search, 
  position, 
  onSelect, 
  onClose 
}: NoteMentionDropdownProps) {
  const { currentNote, recentNotes } = useNoteContextStore()
  const { notes } = useContentStore()
  const [showAll, setShowAll] = useState(false)

  // Progressive search implementation
  const getFilteredNotes = useCallback((): FilteredNote[] => {
    const searchLower = search.toLowerCase()
    const results: FilteredNote[] = []
    const addedIds = new Set<string>()

    // Helper to add note if not already added
    const addNote = (note: Note, priority: number, badge?: string, icon?: React.ReactNode) => {
      if (!addedIds.has(note.id)) {
        results.push({ note, priority, badge, icon })
        addedIds.add(note.id)
      }
    }

    // 1. Current note (highest priority)
    if (currentNote && currentNote.title.toLowerCase().includes(searchLower)) {
      addNote(currentNote as Note, 0, 'Current', <FileText className="w-3 h-3" />)
    }

    // 2. Recent notes
    recentNotes.forEach((note) => {
      if (note.title.toLowerCase().includes(searchLower)) {
        addNote(note as Note, 1, 'Recent', <Clock className="w-3 h-3" />)
      }
    })

    // 3. Starred notes
    notes
      .filter(n => n.isStarred && n.title.toLowerCase().includes(searchLower))
      .forEach((note) => {
        addNote(note, 2, 'Starred', <Star className="w-3 h-3 fill-current" />)
      })

    // 4. All other notes (if showing all or few results)
    if (showAll || results.length < 5) {
      notes
        .filter(n => n.title.toLowerCase().includes(searchLower))
        .forEach((note) => {
          addNote(note, 3)
        })
    }

    // Sort by priority and limit
    return results
      .sort((a, b) => a.priority - b.priority)
      .slice(0, showAll ? 50 : 10)
  }, [search, currentNote, recentNotes, notes, showAll])

  const filteredNotes = getFilteredNotes()

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div 
      className="absolute z-50 w-80 bg-popover border rounded-lg shadow-lg overflow-hidden"
      style={{ top: position.top, left: position.left }}
    >
      <Command className="max-h-96">
        <CommandInput 
          placeholder="Search notes..." 
          value={search}
          className="border-0 focus:ring-0"
          readOnly
        />
        <CommandList className="max-h-80">
          {filteredNotes.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              No notes found
            </div>
          ) : (
            <>
              {/* Group by badge type for better organization */}
              {['Current', 'Recent', 'Starred', undefined].map((badgeType) => {
                const groupNotes = filteredNotes.filter(fn => fn.badge === badgeType)
                if (groupNotes.length === 0) return null

                return (
                  <CommandGroup key={badgeType || 'other'} heading={badgeType || 'All Notes'}>
                    {groupNotes.map(({ note, badge, icon }) => (
                      <CommandItem
                        key={note.id}
                        onSelect={() => onSelect(note)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        {icon && (
                          <span className="text-muted-foreground">
                            {icon}
                          </span>
                        )}
                        <span className="flex-1 truncate">{note.title}</span>
                        {badge && (
                          <Badge variant="secondary" className="text-xs ml-auto">
                            {badge}
                          </Badge>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )
              })}
              
              {!showAll && notes.length > 10 && filteredNotes.length >= 10 && (
                <>
                  <CommandSeparator />
                  <CommandItem
                    onSelect={() => setShowAll(true)}
                    className="text-center text-muted-foreground cursor-pointer"
                  >
                    Show all notes...
                  </CommandItem>
                </>
              )}
            </>
          )}
        </CommandList>
      </Command>
    </div>
  )
} 