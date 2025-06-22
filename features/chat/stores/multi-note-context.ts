/**
 * Store: Multi-Note Context
 * Purpose: Manage multiple note contexts for AI chat
 * Features:
 * - Support multiple active notes
 * - Drag & drop integration
 * - Visual highlighting
 * - Context formatting for AI
 * 
 * Created: December 2024
 */

import { create } from 'zustand'

export interface NoteForContext {
  id: string
  title: string
  content?: string | null
  collectionId?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface NoteContext extends NoteForContext {
  addedAt: Date
  isHighlighted?: boolean
}

interface MultiNoteContextStore {
  // State
  contextNotes: Map<string, NoteContext>
  highlightedNoteId: string | null
  maxNotes: number
  
  // Actions
  addNote: (note: NoteForContext) => void
  addNotes: (notes: NoteForContext[]) => void
  removeNote: (noteId: string) => void
  clearAllNotes: () => void
  
  // Utilities
  hasNote: (noteId: string) => boolean
  getNoteCount: () => number
  getNotesArray: () => NoteContext[]
  
  // AI Integration
  getContextString: () => string
  
  // UI Actions
  highlightNote: (noteId: string | null) => void
  highlightNoteTemporarily: (noteId: string, duration?: number) => void
}

export const useMultiNoteContext = create<MultiNoteContextStore>((set, get) => ({
  // Initial state
  contextNotes: new Map(),
  highlightedNoteId: null,
  maxNotes: 10,
  
  // Add a single note
  addNote: (note) => {
    set((state) => {
      const newMap = new Map(state.contextNotes)
      
      // Check if already exists
      if (newMap.has(note.id)) {
        return state
      }
      
      // Check max limit
      if (newMap.size >= state.maxNotes) {
        // Remove oldest
        const oldest = Array.from(newMap.entries())
          .sort((a, b) => a[1].addedAt.getTime() - b[1].addedAt.getTime())[0]
        if (oldest) {
          newMap.delete(oldest[0])
        }
      }
      
      // Add new note
      newMap.set(note.id, {
        ...note,
        addedAt: new Date(),
        isHighlighted: false,
      })
      
      return { contextNotes: newMap }
    })
  },
  
  // Add multiple notes
  addNotes: (notes) => {
    notes.forEach(note => get().addNote(note))
  },
  
  // Remove a note
  removeNote: (noteId) => {
    set((state) => {
      const newMap = new Map(state.contextNotes)
      newMap.delete(noteId)
      return {
        contextNotes: newMap,
        highlightedNoteId: state.highlightedNoteId === noteId ? null : state.highlightedNoteId,
      }
    })
  },
  
  // Clear all notes
  clearAllNotes: () => {
    set({
      contextNotes: new Map(),
      highlightedNoteId: null,
    })
  },
  
  // Check if note exists
  hasNote: (noteId) => {
    return get().contextNotes.has(noteId)
  },
  
  // Get note count
  getNoteCount: () => {
    return get().contextNotes.size
  },
  
  // Get notes as array
  getNotesArray: () => {
    return Array.from(get().contextNotes.values())
      .sort((a, b) => a.addedAt.getTime() - b.addedAt.getTime())
  },
  
  // Get context string for AI
  getContextString: () => {
    const notes = get().getNotesArray()
    
    if (notes.length === 0) {
      return ''
    }
    
    let context = '=== Active Note Context ===\n\n'
    
    notes.forEach((note, index) => {
      context += `--- Note ${index + 1}: "${note.title}" ---\n`
      
      if (note.content) {
        const maxLength = Math.floor(2000 / notes.length)
        const content = note.content.slice(0, maxLength)
        const truncated = note.content.length > maxLength
        context += `${content}${truncated ? '\n[... truncated]' : ''}\n\n`
      } else {
        context += '[No content]\n\n'
      }
    })
    
    return context.trim()
  },
  
  // Highlight a note
  highlightNote: (noteId) => {
    set({ highlightedNoteId: noteId })
    
    // Update the note's highlight status
    if (noteId) {
      set((state) => {
        const newMap = new Map(state.contextNotes)
        const note = newMap.get(noteId)
        if (note) {
          newMap.set(noteId, { ...note, isHighlighted: true })
        }
        return { contextNotes: newMap }
      })
    } else {
      // Clear all highlights
      set((state) => {
        const newMap = new Map(state.contextNotes)
        newMap.forEach((note, id) => {
          if (note.isHighlighted) {
            newMap.set(id, { ...note, isHighlighted: false })
          }
        })
        return { contextNotes: newMap }
      })
    }
  },
  
  // Highlight temporarily
  highlightNoteTemporarily: (noteId, duration = 2000) => {
    const { highlightNote } = get()
    
    highlightNote(noteId)
    
    setTimeout(() => {
      set((state) => {
        if (state.highlightedNoteId === noteId) {
          highlightNote(null)
        }
        return state
      })
    }, duration)
  },
})) 