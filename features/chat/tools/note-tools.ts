import { z } from 'zod'
import { CoreTool } from 'ai'

export interface NoteToolResult {
  requiresConfirmation?: boolean
  confirmationType?: 'preview' | 'diff'
  action?: string
  args?: any
  current?: any
  result?: any
}

export const noteTools: Record<string, CoreTool> = {
  search_notes: {
    description: 'Search through user notes by title or content',
    parameters: z.object({
      query: z.string().describe('Search query'),
      limit: z.number().optional().default(5).describe('Maximum results to return'),
    }),
    execute: async ({ query, limit }) => {
      try {
        const response = await fetch(`/api/notes?search=${encodeURIComponent(query)}&limit=${limit}`)
        if (!response.ok) throw new Error('Failed to search notes')
        
        const notes = await response.json()
        return {
          result: {
            notes: notes.map((n: any) => ({
              id: n.id,
              title: n.title,
              preview: n.content ? String(n.content).substring(0, 200) + '...' : 'No content',
              updatedAt: n.updatedAt,
            }))
          }
        }
      } catch (error) {
        console.error('Error searching notes:', error)
        return {
          result: { error: 'Failed to search notes', notes: [] }
        }
      }
    },
  },
  
  read_note: {
    description: 'Read the full content of a specific note',
    parameters: z.object({
      noteId: z.string().describe('ID of the note to read'),
    }),
    execute: async ({ noteId }) => {
      try {
        const response = await fetch(`/api/notes/${noteId}`)
        if (!response.ok) throw new Error('Note not found')
        
        const note = await response.json()
        return {
          result: {
            id: note.id,
            title: note.title,
            content: note.content || '',
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
            isStarred: note.isStarred,
          }
        }
      } catch (error) {
        console.error('Error reading note:', error)
        return {
          result: { error: 'Failed to read note' }
        }
      }
    },
  },
  
  create_note: {
    description: 'Create a new note with specified content',
    parameters: z.object({
      title: z.string().describe('Title of the note'),
      content: z.string().describe('Content of the note in HTML format'),
      collectionId: z.string().optional().describe('Collection to add the note to'),
    }),
    execute: async ({ title, content, collectionId }) => {
      // This will be intercepted by the client for confirmation
      return {
        requiresConfirmation: true,
        confirmationType: 'preview',
        action: 'create_note',
        args: { title, content, collectionId }
      }
    },
  },
  
  update_note: {
    description: 'Update an existing note',
    parameters: z.object({
      noteId: z.string().describe('ID of the note to update'),
      updates: z.object({
        title: z.string().optional().describe('New title'),
        content: z.string().optional().describe('New content in HTML format'),
      }).describe('Fields to update'),
    }),
    execute: async ({ noteId, updates }) => {
      try {
        // Fetch current note for diff
        const response = await fetch(`/api/notes/${noteId}`)
        if (!response.ok) throw new Error('Note not found')
        
        const currentNote = await response.json()
        
        return {
          requiresConfirmation: true,
          confirmationType: 'diff',
          action: 'update_note',
          args: { noteId, updates },
          current: currentNote
        }
      } catch (error) {
        console.error('Error fetching note for update:', error)
        return {
          result: { error: 'Failed to fetch note for update' }
        }
      }
    },
  },
} 