/**
 * Store: Note Context Store
 * Purpose: Manage multiple note contexts for AI chat integration
 * Features:
 * - Track multiple active notes in chat
 * - Visual highlighting when AI references notes
 * - Drag & drop support
 * - Format combined context for AI prompts
 * 
 * Created: December 2024
 * Updated: December 2024 - Multi-note context support
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Note as DBNote } from '@/lib/db/schema'

// Simplified Note type for context store
interface Note {
  id: string
  title: string
  content?: string | null
  collectionId?: string | null
  isStarred?: boolean | null
  createdAt: Date
  updatedAt: Date
}

interface NoteContext extends Note {
  addedAt: Date
  isHighlighted?: boolean
}

interface ContextMetadata {
  noteId: string
  title: string
  snippet: string
}

interface NoteContextStore {
  // State - Now using Map for multiple notes
  contextNotes: Map<string, NoteContext>
  highlightedNoteId: string | null
  maxContextNotes: number
  
  // Legacy support (will phase out)
  currentNote: Note | null
  recentNotes: Note[]
  referencedNotes: Note[]
  
  // Actions - Multi-note support
  addNote: (note: Note) => void
  addNotes: (notes: Note[]) => void
  removeNote: (noteId: string) => void
  clearContext: () => void
  hasNote: (noteId: string) => boolean
  getNoteCount: () => number
  
  // AI integration
  getContextString: () => string
  getContextMetadata: () => ContextMetadata[]
  
  // UI state
  setHighlightedNote: (noteId: string | null) => void
  highlightNoteTemporarily: (noteId: string, duration?: number) => void
  
  // Legacy actions (keep for compatibility)
  setCurrentNote: (note: Note | null) => void
  addRecentNote: (note: Note) => void
  addReferencedNote: (note: Note) => void
  removeReferencedNote: (noteId: string) => void
  getContextForChat: () => string
  clearReferences: () => void
  isNoteReferenced: (noteId: string) => boolean
  getRecentNoteIds: () => string[]
}

export const useNoteContextStore = create<NoteContextStore>()(
  persist(
    (set, get) => ({
      // Initial state
      contextNotes: new Map(),
      highlightedNoteId: null,
      maxContextNotes: 10,
      
      // Legacy state
      currentNote: null,
      recentNotes: [],
      referencedNotes: [],
      
      // Add a single note to context
      addNote: (note) => {
        set((state) => {
          const newMap = new Map(state.contextNotes)
          
          // Check max limit
          if (newMap.size >= state.maxContextNotes && !newMap.has(note.id)) {
            // Remove oldest note
            const oldestKey = Array.from(newMap.entries())
              .sort((a, b) => a[1].addedAt.getTime() - b[1].addedAt.getTime())[0]?.[0]
            if (oldestKey) {
              newMap.delete(oldestKey)
            }
          }
          
          // Add or update note
          newMap.set(note.id, {
            ...note,
            addedAt: new Date(),
            isHighlighted: false,
          })
          
          return { contextNotes: newMap }
        })
      },
      
      // Add multiple notes at once
      addNotes: (notes) => {
        notes.forEach(note => get().addNote(note))
      },
      
      // Remove a note from context
      removeNote: (noteId) => {
        set((state) => {
          const newMap = new Map(state.contextNotes)
          newMap.delete(noteId)
          return { 
            contextNotes: newMap,
            highlightedNoteId: state.highlightedNoteId === noteId ? null : state.highlightedNoteId
          }
        })
      },
      
      // Clear all context
      clearContext: () => {
        set({ 
          contextNotes: new Map(),
          highlightedNoteId: null
        })
      },
      
      // Check if note is in context
      hasNote: (noteId) => {
        return get().contextNotes.has(noteId)
      },
      
      // Get number of notes in context
      getNoteCount: () => {
        return get().contextNotes.size
      },
      
      // Get formatted context string for AI
      getContextString: () => {
        const { contextNotes } = get()
        
        if (contextNotes.size === 0) {
          return ''
        }
        
        let context = '=== Active Note Context ===\n\n'
        
        // Sort by added time
        const sortedNotes = Array.from(contextNotes.values())
          .sort((a, b) => a.addedAt.getTime() - b.addedAt.getTime())
        
        sortedNotes.forEach((note, index) => {
          context += `--- Note ${index + 1}: "${note.title}" ---\n`
          
          if (note.content) {
            const maxLength = Math.floor(2000 / contextNotes.size) // Dynamic length based on note count
            const content = note.content.slice(0, maxLength)
            const truncated = note.content.length > maxLength
            context += `${content}${truncated ? '\n[... truncated]' : ''}\n\n`
          } else {
            context += '[No content]\n\n'
          }
        })
        
        return context.trim()
      },
      
      // Get metadata for all context notes
      getContextMetadata: () => {
        const { contextNotes } = get()
        
        return Array.from(contextNotes.values()).map(note => ({
          noteId: note.id,
          title: note.title,
          snippet: note.content ? note.content.slice(0, 100) + '...' : 'No content',
        }))
      },
      
      // UI state management
      setHighlightedNote: (noteId) => {
        set({ highlightedNoteId: noteId })
      },
      
      // Highlight a note temporarily (for AI references)
      highlightNoteTemporarily: (noteId, duration = 2000) => {
        const { contextNotes } = get()
        if (!contextNotes.has(noteId)) return
        
        set({ highlightedNoteId: noteId })
        
        setTimeout(() => {
          set((state) => ({
            highlightedNoteId: state.highlightedNoteId === noteId ? null : state.highlightedNoteId
          }))
        }, duration)
      },
      
      // Legacy methods for compatibility
      setCurrentNote: (note) => {
        set({ currentNote: note })
        if (note) {
          get().addRecentNote(note)
          get().addNote(note) // Also add to new context
        }
      },
      
      addRecentNote: (note) => {
        set((state) => {
          const filtered = state.recentNotes.filter(n => n.id !== note.id)
          const updated = [note, ...filtered].slice(0, 5)
          return { recentNotes: updated }
        })
      },
      
      addReferencedNote: (note) => {
        set((state) => {
          if (state.referencedNotes.find(n => n.id === note.id)) {
            return state
          }
          const updated = [...state.referencedNotes, note].slice(-5)
          return { referencedNotes: updated }
        })
        get().addNote(note) // Also add to new context
      },
      
      removeReferencedNote: (noteId) => {
        set((state) => ({
          referencedNotes: state.referencedNotes.filter(n => n.id !== noteId)
        }))
        get().removeNote(noteId) // Also remove from new context
      },
      
      getContextForChat: () => {
        // Use new method
        return get().getContextString()
      },
      
      clearReferences: () => {
        set({ referencedNotes: [] })
        get().clearContext() // Also clear new context
      },
      
      isNoteReferenced: (noteId) => {
        return get().referencedNotes.some(n => n.id === noteId) || get().hasNote(noteId)
      },
      
      getRecentNoteIds: () => {
        return get().recentNotes.map(n => n.id)
      },
    }),
    {
      name: 'note-context',
      // Only persist recent notes
      partialize: (state) => ({
        recentNotes: state.recentNotes,
      }),
    }
  )
)

// Helper hook to get formatted context
export const useNoteContext = () => {
  const store = useNoteContextStore()
  const { contextNotes, currentNote, referencedNotes } = store
  
  // Use new context if available, fallback to legacy
  const hasNewContext = contextNotes.size > 0
  const hasLegacyContext = Boolean(currentNote || referencedNotes.length > 0)
  
  return {
    currentNote,
    referencedNotes,
    contextNotes: Array.from(contextNotes.values()),
    hasContext: hasNewContext || hasLegacyContext,
    contextString: store.getContextString() || store.getContextForChat(),
    noteCount: contextNotes.size,
  }
}

// Hook for multi-note context
export const useMultiNoteContext = () => {
  const store = useNoteContextStore()
  const { contextNotes, highlightedNoteId } = store
  
  return {
    notes: Array.from(contextNotes.values()),
    noteCount: contextNotes.size,
    highlightedNoteId,
    addNote: store.addNote,
    addNotes: store.addNotes,
    removeNote: store.removeNote,
    clearContext: store.clearContext,
    hasNote: store.hasNote,
    highlightNote: store.highlightNoteTemporarily,
  }
}

// Selector for getting all contextual notes
export const useContextualNotes = () => {
  const { currentNote, recentNotes, referencedNotes, contextNotes } = useNoteContextStore()
  
  // Combine and deduplicate notes
  const allNotes: Note[] = []
  const seenIds = new Set<string>()
  
  // Priority: context notes > current > referenced > recent
  Array.from(contextNotes.values()).forEach(note => {
    if (!seenIds.has(note.id)) {
      allNotes.push(note)
      seenIds.add(note.id)
    }
  })
  
  if (currentNote && !seenIds.has(currentNote.id)) {
    allNotes.push(currentNote)
    seenIds.add(currentNote.id)
  }
  
  referencedNotes.forEach(note => {
    if (!seenIds.has(note.id)) {
      allNotes.push(note)
      seenIds.add(note.id)
    }
  })
  
  recentNotes.forEach(note => {
    if (!seenIds.has(note.id)) {
      allNotes.push(note)
      seenIds.add(note.id)
    }
  })
  
  return allNotes
} 