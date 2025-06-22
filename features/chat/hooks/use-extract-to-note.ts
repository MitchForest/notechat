'use client'

import { useState, useCallback } from 'react'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { Message } from 'ai'
import { formatNoteContent } from '../utils/note-formatter'
import { useCollectionStore } from '@/features/organization/stores'

export interface ExtractOptions {
  source: 'highlight' | 'chat' | 'message' | 'selection'
  content: string | Message | Message[]
  context?: string
}

export interface ExtractedNote {
  title: string
  content: string
  contentType: 'code' | 'qa' | 'brainstorm' | 'tutorial' | 'general'
  suggestedCollection?: string
  tags: string[]
}

const extractionSchema = z.object({
  title: z.string().describe('A clear, descriptive title for the note'),
  summary: z.string().describe('Brief summary of the content'),
  contentType: z.enum(['code', 'qa', 'brainstorm', 'tutorial', 'general']).describe('Type of content'),
  mainPoints: z.array(z.string()).describe('Key points or ideas'),
  codeSnippets: z.array(z.object({
    language: z.string(),
    code: z.string(),
    explanation: z.string().optional(),
  })).optional(),
  questions: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).optional(),
  actionItems: z.array(z.string()).optional(),
  tags: z.array(z.string()).describe('Relevant tags for the note'),
  suggestedCollection: z.string().optional().describe('Suggested collection name'),
})

export function useExtractToNote() {
  const [isExtracting, setIsExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { collections } = useCollectionStore()

  const buildExtractionPrompt = useCallback((options: ExtractOptions) => {
    let prompt = `Extract and organize the following content into a well-structured note.\n\n`

    if (options.source === 'highlight') {
      prompt += `The user highlighted this text:\n${options.content}\n\n`
      if (options.context) {
        prompt += `Context: This was highlighted from a note titled "${options.context}"\n\n`
      }
    } else if (options.source === 'message' && typeof options.content === 'object' && 'role' in options.content) {
      const message = options.content as Message
      prompt += `Extract this ${message.role} message:\n${message.content}\n\n`
    } else if (options.source === 'selection' && Array.isArray(options.content)) {
      prompt += `Extract this conversation:\n`
      options.content.forEach((msg) => {
        prompt += `${msg.role}: ${msg.content}\n\n`
      })
    } else if (options.source === 'chat') {
      prompt += `The user wants to extract this chat content:\n${options.content}\n\n`
    }

    prompt += `Analyze the content and:
1. Determine the type of content (code, Q&A, brainstorming, tutorial, or general)
2. Extract key points and organize them logically
3. Suggest a clear, descriptive title
4. Add relevant tags
5. If it contains code, identify the language and provide explanations
6. If it's a Q&A, structure questions and answers clearly
7. If it's brainstorming, organize ideas and action items
8. Suggest an appropriate collection based on the content`

    return prompt
  }, [])

  const extract = useCallback(async (options: ExtractOptions): Promise<ExtractedNote> => {
    setIsExtracting(true)
    setError(null)

    try {
      const { object } = await generateObject({
        model: openai('gpt-4-turbo'),
        schema: extractionSchema,
        prompt: buildExtractionPrompt(options),
      })

      // Find matching collection
      let suggestedCollectionId: string | undefined
      if (object.suggestedCollection) {
        const matchingCollection = collections.find(
          c => c.name.toLowerCase().includes(object.suggestedCollection!.toLowerCase())
        )
        suggestedCollectionId = matchingCollection?.id
      }

      // Format the content based on type
      const formattedContent = formatNoteContent(object, options)

      return {
        title: object.title,
        content: formattedContent,
        contentType: object.contentType,
        suggestedCollection: suggestedCollectionId,
        tags: object.tags,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to extract content'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsExtracting(false)
    }
  }, [collections, buildExtractionPrompt])

  return {
    extract,
    isExtracting,
    error,
  }
} 