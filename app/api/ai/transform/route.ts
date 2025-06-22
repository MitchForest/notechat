import { streamText } from 'ai'
import { AI_MAX_TOKENS, AI_MODELS, AI_SYSTEM_PROMPTS, AI_TEMPERATURES } from '@/features/ai/lib/ai-config'
import { NextRequest } from 'next/server'
import { openai } from '@ai-sdk/openai'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { prompt: text, operation, customPrompt } = await req.json()

    if (!text || typeof text !== 'string') {
      return new Response('Invalid request: text is required', { status: 400 })
    }

    if (!operation || typeof operation !== 'string') {
      return new Response('Invalid request: operation is required', { status: 400 })
    }

    let systemPrompt: string
    if (operation === 'custom' && customPrompt) {
      systemPrompt = AI_SYSTEM_PROMPTS.custom(customPrompt)
    } else if (operation in AI_SYSTEM_PROMPTS) {
      systemPrompt = AI_SYSTEM_PROMPTS[operation as keyof typeof AI_SYSTEM_PROMPTS] as string
    } else {
      return new Response('Invalid operation', { status: 400 })
    }

    const result = await streamText({
      model: openai(AI_MODELS.fast),
      system: systemPrompt,
      prompt: text,
      temperature: AI_TEMPERATURES.transform,
      maxTokens: AI_MAX_TOKENS.transform
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error('Transform error:', error)

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