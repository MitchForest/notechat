import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { sql } from '@/lib/db/edge-sql' // Use edge-compatible SQL client

export const runtime = 'edge' // Enable Edge Runtime!

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { messages, noteContext } = await req.json()

    // Validate chat exists and belongs to user
    const chatId = req.headers.get('x-chat-id')
    if (chatId) {
      const chats = await sql`
        SELECT * FROM chats 
        WHERE id = ${chatId} 
        LIMIT 1
      `
      const chat = chats[0]

      if (!chat || chat.userId !== user.id) {
        return new Response('Chat not found', { status: 404 })
      }
    }

    // Build system prompt
    let systemPrompt = `You are a helpful AI assistant integrated into a note-taking application. 
    You help users organize thoughts, develop ideas, and create meaningful notes.
    Be concise but thorough. Use markdown formatting for clarity.`

    if (noteContext) {
      systemPrompt += `\n\nThe user is currently viewing a note. 
      Here is the note content for context:\n\n${noteContext.content}\n\n
      When answering questions, reference specific parts of this note when relevant.`
    }

    // Stream the response
    const result = await streamText({
      model: openai('gpt-4-turbo'),
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      maxTokens: 2000,
    })

    // Return streaming response
    return result.toDataStreamResponse({
      headers: {
        'X-Chat-Id': chatId || '',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return new Response('Rate limit exceeded. Please try again later.', { status: 429 })
      }
      if (error.message.includes('context length')) {
        return new Response('Message too long. Please shorten your input.', { status: 400 })
      }
    }

    return new Response('An error occurred during the conversation.', { status: 500 })
  }
} 