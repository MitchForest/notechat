import { toast } from 'sonner'
import { AIError } from '@/features/ai/types'

export function handleAIError(error: unknown): AIError {
  console.error('AI Error:', error)

  // Check if it's an API error from OpenAI
  if (error instanceof Error) {
    // Rate limit error
    if (error.message.includes('rate limit') || error.message.includes('429')) {
      toast.error('AI rate limit reached. Please try again in a few moments.')
      return {
        code: 'rate_limit',
        message: 'Too many requests. Please wait a moment.'
      }
    }

    // Invalid request (like context too long)
    if (error.message.includes('context length') || error.message.includes('400')) {
      toast.error('Selected text is too long. Please select less text.')
      return {
        code: 'invalid_request',
        message: 'Text too long for AI processing.'
      }
    }

    // Generic API error
    toast.error('AI service error. Please try again.')
    return {
      code: 'api_error',
      message: error.message
    }
  }

  // Unknown error
  toast.error('An unexpected error occurred.')
  return {
    code: 'api_error',
    message: 'Unknown error occurred'
  }
} 