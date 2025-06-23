import { streamText, convertToCoreMessages } from 'ai'
import { openai } from '@ai-sdk/openai'
import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { chats } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { noteTools } from '@/features/chat/tools/note-tools'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { messages, noteContext } = body
    
    console.log('[CHAT API] Request received:', {
      messageCount: messages?.length,
      hasNoteContext: !!noteContext,
      userId: user.id
    })

    // Validate chat exists and belongs to user
    const chatId = req.headers.get('x-chat-id')
    if (chatId) {
      // Check if this is a temporary chat (starts with 'chat-')
      const isTemporaryChat = chatId.startsWith('chat-')
      
      // Only validate if it's not a temporary chat
      if (!isTemporaryChat) {
        const [chat] = await db
          .select()
          .from(chats)
          .where(eq(chats.id, chatId))
          .limit(1)

        if (!chat || chat.userId !== user.id) {
          return new Response('Chat not found', { status: 404 })
        }
      }
      // For temporary chats, we allow them through without validation
      // They will be created when the first message is saved
    }

    // Build system prompt
    let systemPrompt = `You are a helpful AI assistant integrated into a note-taking application. 
    You help users organize thoughts, develop ideas, and create meaningful notes.
    Be concise but thorough. Use markdown formatting for clarity.
    
    You have access to tools that allow you to:
    - Search through the user's notes
    - Read specific notes in full
    - Create new notes (with user confirmation)
    - Update existing notes (with user confirmation)
    
    When the user asks you to search for information, create notes, or update content, use the appropriate tools.`

    // Handle note context - can be either a string (from our store) or an object (legacy)
    if (noteContext) {
      if (typeof noteContext === 'string') {
        // New format from note context store
        systemPrompt += `\n\n${noteContext}\n\n`
        systemPrompt += `When answering questions, reference specific parts of the notes above when relevant. 
        If the user asks about "this note" or "the note", they're referring to the current note mentioned above.`
      } else if (noteContext.content) {
        // Legacy format for backward compatibility
        systemPrompt += `\n\nThe user is currently viewing a note titled "${noteContext.title || 'Untitled'}". 
        Here is the note content for context:\n\n${noteContext.content}\n\n
        When answering questions, reference specific parts of this note when relevant.`
      }
    }

    // Convert messages to core messages format
    const coreMessages = convertToCoreMessages(messages)
    
    console.log('[CHAT API] Streaming with model:', 'gpt-4o-mini')

    // Stream the response with tools
    const result = await streamText({
      model: openai('gpt-4o-mini'), // Use gpt-4o-mini instead of gpt-4-turbo
      messages: [
        { role: 'system', content: systemPrompt },
        ...coreMessages,
      ],
      tools: noteTools,
      toolChoice: 'auto',
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
    console.error('[CHAT API] Error:', error)
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error('[CHAT API] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      
      if (error.message.includes('rate limit')) {
        return new Response('Rate limit exceeded. Please try again later.', { status: 429 })
      }
      if (error.message.includes('context length')) {
        return new Response('Message too long. Please shorten your input.', { status: 400 })
      }
      if (error.message.includes('API key')) {
        return new Response('AI service configuration error. Please contact support.', { status: 500 })
      }
    }

    return new Response('An error occurred during the conversation.', { status: 500 })
  }
} 