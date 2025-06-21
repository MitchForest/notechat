'use client'

import { useCompletion } from 'ai/react'
import { useCallback } from 'react'
import { toast } from 'sonner'
import { handleAIError } from '@/features/ai/lib/ai-errors'

export function useAICompletion() {
  const { completion, complete, isLoading, error, stop } = useCompletion({
    api: '/api/ai/completion',
    onFinish: (prompt, completion) => {
      console.log('AI completion finished:', { prompt, completion })
    },
    onError: error => {
      handleAIError(error)
    }
  })

  const triggerCompletion = useCallback(
    async (prompt: string) => {
      if (!prompt) {
        toast.error('Please enter a prompt.')
        return
      }

      try {
        await complete(prompt)
      } catch (e) {
        handleAIError(e)
      }
    },
    [complete]
  )

  return {
    completion,
    triggerCompletion,
    isLoading,
    error,
    stop
  }
} 