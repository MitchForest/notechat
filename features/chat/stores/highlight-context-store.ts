/**
 * Store: Highlight Context Store
 * Purpose: Share highlighted text between editor and chat
 * Features:
 * - Track highlighted text from editor
 * - Store note context
 * - Provide formatted context for AI
 * - Clear highlight when done
 * 
 * Created: December 2024
 */

import { create } from 'zustand'

interface HighlightData {
  text: string
  noteId: string
  noteTitle: string
  selectionRange?: {
    start: number
    end: number
  }
}

interface HighlightContextStore {
  // State
  highlightedText: string | null
  noteId: string | null
  noteTitle: string | null
  selectionRange: { start: number; end: number } | null
  
  // Actions
  setHighlight: (data: HighlightData) => void
  clearHighlight: () => void
  
  // Utilities
  hasHighlight: () => boolean
  getContextForChat: () => string
}

export const useHighlightContext = create<HighlightContextStore>((set, get) => ({
  // Initial state
  highlightedText: null,
  noteId: null,
  noteTitle: null,
  selectionRange: null,
  
  // Set highlight from editor
  setHighlight: (data) => {
    set({
      highlightedText: data.text,
      noteId: data.noteId,
      noteTitle: data.noteTitle,
      selectionRange: data.selectionRange || null,
    })
  },
  
  // Clear highlight
  clearHighlight: () => {
    set({
      highlightedText: null,
      noteId: null,
      noteTitle: null,
      selectionRange: null,
    })
  },
  
  // Check if there's an active highlight
  hasHighlight: () => {
    return get().highlightedText !== null
  },
  
  // Get formatted context for AI
  getContextForChat: () => {
    const { highlightedText, noteTitle, noteId } = get()
    
    if (!highlightedText) {
      return ''
    }
    
    return `=== Highlighted Text Context ===
Note: "${noteTitle}" (ID: ${noteId})
Selected text:
"""
${highlightedText}
"""

The user has highlighted this text in their editor. Pay attention to any requests about "this", "the highlighted text", or "the selection" - they are referring to the text above.`
  },
})) 