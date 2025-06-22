import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { NextRequest } from 'next/server'
import {
  AI_MAX_TOKENS,
  AI_MODELS,
  AI_SYSTEM_PROMPTS,
  AI_TEMPERATURES
} from '@/features/ai/lib/ai-config'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  console.log('[API /ai/completion] Request received')

  try {
    const { prompt: text, mode } = await req.json()
    console.log('[API /ai/completion] Body:', { textLength: text?.length, mode })

    if (!text) {
      console.error('[API /ai/completion] No text provided')
      return new Response('No text provided', { status: 400 })
    }

    const isGhostText = mode === 'ghost-text'

    const result = await streamText({
      model: AI_MODELS.fast,
      messages: [
        {
          role: 'system',
          content: isGhostText
            ? 'You are a helpful writing assistant. Continue the text naturally. Keep it brief, around 50-100 characters.'
            : AI_SYSTEM_PROMPTS.continue
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: AI_TEMPERATURES.continue,
      maxTokens: isGhostText ? 50 : AI_MAX_TOKENS.continue
    })

    console.log('[API /ai/completion] Streaming response started')
    return result.toDataStreamResponse()
  } catch (error) {
    console.error('[API /ai/completion] Error:', error)
    return new Response('Internal error', { status: 500 })
  }
} 