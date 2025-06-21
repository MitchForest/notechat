import { streamText } from 'ai'
import {
  AI_MAX_TOKENS,
  AI_MODELS,
  AI_SYSTEM_PROMPTS,
  AI_TEMPERATURES
} from '@/features/ai/lib/ai-config'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { prompt: text } = await req.json()

    if (!text || typeof text !== 'string') {
      return new Response('Invalid request: text is required', { status: 400 })
    }

    const result = await streamText({
      model: AI_MODELS.fast,
      messages: [
        {
          role: 'system',
          content: AI_SYSTEM_PROMPTS.continue
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: AI_TEMPERATURES.continue,
      maxTokens: AI_MAX_TOKENS.continue
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error('Completion error:', error)

    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return new Response('Rate limit exceeded', { status: 429 })
      }
      if (error.message.includes('context length')) {
        return new Response('Text too long', { status: 400 })
      }
    }

    return new Response('Internal server error', { status: 500 })
  }
} 