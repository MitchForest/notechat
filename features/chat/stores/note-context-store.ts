/**
 * Store: Note Context Store
 * Purpose: Manage note context for AI chat integration
 * Features:
 * - Track current note being edited
 * - Maintain recent notes history
 * - Store referenced notes from @mentions
 * - Format context for AI prompts
 * 
 * Created: December 2024
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

interface NoteContextStore {
  // State
  currentNote: Note | null
  recentNotes: Note[] // Last 5 viewed notes
  referencedNotes: Note[] // Notes referenced via @mentions
  
  // Actions
  setCurrentNote: (note: Note | null) => void
  addRecentNote: (note: Note) => void
  addReferencedNote: (note: Note) => void
  removeReferencedNote: (noteId: string) => void
  getContextForChat: () => string
  clearReferences: () => void
  
  // Utility
  isNoteReferenced: (noteId: string) => boolean
  getRecentNoteIds: () => string[]
}

export const useNoteContextStore = create<NoteContextStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentNote: null,
      recentNotes: [],
      referencedNotes: [],
      
      // Set the current note and add to recent history
      setCurrentNote: (note) => {
        set({ currentNote: note })
        if (note) {
          get().addRecentNote(note)
        }
      },
      
      // Add a note to recent history (max 5, no duplicates)
      addRecentNote: (note) => {
        set((state) => {
          const filtered = state.recentNotes.filter(n => n.id !== note.id)
          const updated = [note, ...filtered].slice(0, 5)
          return { recentNotes: updated }
        })
      },
      
      // Add a referenced note (max 5, no duplicates)
      addReferencedNote: (note) => {
        set((state) => {
          if (state.referencedNotes.find(n => n.id === note.id)) {
            return state
          }
          const updated = [...state.referencedNotes, note].slice(-5)
          return { referencedNotes: updated }
        })
      },
      
      // Remove a referenced note
      removeReferencedNote: (noteId) => {
        set((state) => ({
          referencedNotes: state.referencedNotes.filter(n => n.id !== noteId)
        }))
      },
      
      // Format context for AI chat
      getContextForChat: () => {
        const { currentNote, referencedNotes } = get()
        let context = ''
        
        // Add current note context
        if (currentNote) {
          context += `=== Current Note ===\n`
          context += `Title: "${currentNote.title}"\n`
          if (currentNote.content) {
            // Limit content to prevent token overflow
            const maxLength = 1500
            const content = currentNote.content.slice(0, maxLength)
            const truncated = currentNote.content.length > maxLength
            context += `Content:\n${content}${truncated ? '\n[... truncated]' : ''}\n\n`
          }
        }
        
        // Add referenced notes
        if (referencedNotes.length > 0) {
          context += `=== Referenced Notes ===\n`
          referencedNotes.forEach((note, index) => {
            context += `\n${index + 1}. "${note.title}"\n`
            if (note.content) {
              const maxLength = 300
              const preview = note.content.slice(0, maxLength)
              const truncated = note.content.length > maxLength
              context += `${preview}${truncated ? '...' : ''}\n`
            }
          })
        }
        
        return context.trim()
      },
      
      // Clear all referenced notes
      clearReferences: () => {
        set({ referencedNotes: [] })
      },
      
      // Check if a note is referenced
      isNoteReferenced: (noteId) => {
        return get().referencedNotes.some(n => n.id === noteId)
      },
      
      // Get IDs of recent notes
      getRecentNoteIds: () => {
        return get().recentNotes.map(n => n.id)
      },
    }),
    {
      name: 'note-context',
      // Only persist recent notes, not current or referenced
      partialize: (state) => ({
        recentNotes: state.recentNotes,
      }),
    }
  )
)

// Helper hook to get formatted context
export const useNoteContext = () => {
  const { currentNote, referencedNotes, getContextForChat } = useNoteContextStore()
  
  return {
    currentNote,
    referencedNotes,
    hasContext: Boolean(currentNote || referencedNotes.length > 0),
    contextString: getContextForChat(),
  }
}

// Selector for getting all contextual notes
export const useContextualNotes = () => {
  const { currentNote, recentNotes, referencedNotes } = useNoteContextStore()
  
  // Combine and deduplicate notes
  const allNotes: Note[] = []
  const seenIds = new Set<string>()
  
  // Priority order: current > referenced > recent
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