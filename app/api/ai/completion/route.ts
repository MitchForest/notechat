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
  const {
    prompt,
    context,
    mode = 'completion'
  }: { prompt?: string; context?: string; mode?: 'completion' | 'ghost-text' } = await req.json()

  const systemPrompt = AI_SYSTEM_PROMPTS[mode]
  const fullPrompt = context ? `${context}\n\n${prompt}` : prompt

  if (!fullPrompt) {
    return new Response('Prompt is required', { status: 400 })
  }

  try {
    const result = await streamText({
      model: openai(AI_MODELS[mode]),
      system: systemPrompt,
      prompt: fullPrompt,
      temperature: AI_TEMPERATURES[mode],
      maxTokens: AI_MAX_TOKENS[mode]
    })

    return result.toDataStreamResponse()
  } catch (error: unknown) {
    console.error('[AI COMPLETION] Error:', error)
    if (error instanceof Error && error.name === 'RateLimitError') {
      return new Response('Rate limit exceeded', { status: 429 })
    }
    return new Response('An unexpected error occurred', { status: 500 })
  }
} 