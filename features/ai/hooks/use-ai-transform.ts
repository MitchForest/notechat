'use client'

import { useCompletion } from 'ai/react'
import { useCallback } from 'react'
import { Editor } from '@tiptap/core'
import { toast } from 'sonner'
import { AIOperation } from '../types'
import { handleAIError } from '@/features/ai/lib/ai-errors'

export function useAITransform(editor: Editor | null) {
  const { complete, completion, isLoading, error } = useCompletion({
    api: '/api/ai/transform',
    onFinish: (_prompt, completion) => {
      if (!editor) return

      const { from, to } = editor.state.selection
      editor.chain().focus().deleteRange({ from, to }).insertContent(completion).run()

      toast.success('Text transformed!')
    },
    onError: error => {
      handleAIError(error)
    }
  })

  const transform = useCallback(
    async (text: string, operation: AIOperation, customPrompt?: string) => {
      if (!text.trim()) {
        toast.error('Please select some text first')
        return
      }

      if (text.length > 4000) {
        toast.error('Selected text is too long. Please select less text.')
        return
      }

      try {
        await complete(text, {
          body: {
            operation,
            customPrompt
          }
        })
      } catch (e) {
        handleAIError(e)
      }
    },
    [complete]
  )

  return {
    transform,
    isLoading,
    isFinished: !isLoading && completion !== '',
    result: completion
  }
} 