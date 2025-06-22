/**
 * AI Tool Definitions for Note Management
 * Purpose: Define tools that allow AI to create, update, and search notes
 * Features:
 * - Create new notes with confirmation
 * - Update existing notes with structured content
 * - Edit specific selections
 * - Search through notes
 * - Support for markdown and structured blocks
 * 
 * Created: December 2024
 * Updated: December 2024 - Added structured content support
 */

import { CoreTool } from 'ai'

export const noteTools: Record<string, CoreTool> = {
  create_note: {
    description: 'Create a new note with the given title and content. Supports markdown with code blocks, lists, and headings. Requires user confirmation.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'The title of the note',
        },
        content: {
          type: 'string',
          description: 'The content of the note in markdown format. Use ``` for code blocks with language specifier, - for lists, # for headings',
        },
        content_type: {
          type: 'string',
          enum: ['markdown', 'plain'],
          description: 'Format of the content',
          default: 'markdown',
        },
        collection_id: {
          type: 'string',
          description: 'Optional collection ID to add the note to',
        },
      },
      required: ['title', 'content'],
    },
  },

  update_note: {
    description: 'Update an existing note\'s title or content. Supports structured content. Requires user confirmation.',
    parameters: {
      type: 'object',
      properties: {
        note_id: {
          type: 'string',
          description: 'The ID of the note to update',
        },
        title: {
          type: 'string',
          description: 'New title for the note (optional)',
        },
        content: {
          type: 'string',
          description: 'New content for the note in markdown format (optional)',
        },
        content_type: {
          type: 'string',
          enum: ['markdown', 'plain'],
          description: 'Format of the content',
          default: 'markdown',
        },
        update_type: {
          type: 'string',
          enum: ['replace', 'append', 'prepend'],
          description: 'How to update the content: replace all, append to end, or prepend to beginning',
          default: 'replace',
        },
      },
      required: ['note_id'],
    },
  },

  edit_selection: {
    description: 'Edit a specific highlighted section in a note. Use when user asks to modify highlighted text. Can convert to different block types.',
    parameters: {
      type: 'object',
      properties: {
        note_id: {
          type: 'string',
          description: 'The ID of the note containing the selection',
        },
        original_text: {
          type: 'string',
          description: 'The exact original text to replace (must match exactly)',
        },
        new_text: {
          type: 'string',
          description: 'The new text to replace the selection with',
        },
        output_format: {
          type: 'string',
          enum: ['preserve', 'code', 'list', 'heading', 'quote'],
          description: 'Desired format for the replacement text',
          default: 'preserve',
        },
        code_language: {
          type: 'string',
          description: 'Programming language if output_format is code (e.g., javascript, python)',
        },
        edit_type: {
          type: 'string',
          enum: ['replace', 'append', 'prepend'],
          description: 'How to apply the edit: replace, append after, or prepend before',
          default: 'replace',
        },
      },
      required: ['note_id', 'original_text', 'new_text'],
    },
  },

  search_notes: {
    description: 'Search for notes by title or content to find relevant information.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query to find in note titles or content',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return',
          default: 5,
          minimum: 1,
          maximum: 20,
        },
        search_type: {
          type: 'string',
          enum: ['title', 'content', 'both'],
          description: 'Where to search: title only, content only, or both',
          default: 'both',
        },
      },
      required: ['query'],
    },
  },
}

// Tool result types for TypeScript
export interface CreateNoteResult {
  success: boolean
  noteId?: string
  error?: string
}

export interface UpdateNoteResult {
  success: boolean
  noteId?: string
  error?: string
}

export interface EditSelectionResult {
  success: boolean
  noteId?: string
  updatedText?: string
  error?: string
}

export interface SearchNotesResult {
  success: boolean
  results?: Array<{
    id: string
    title: string
    excerpt: string
    updatedAt: Date
  }>
  error?: string
} 