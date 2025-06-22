'use client'

import { useCompletion } from 'ai/react'
import { useCallback, useMemo, useRef } from 'react'
import { Editor } from '@tiptap/core'
import { toast } from 'sonner'
import { AIOperation } from '../types'
import { handleAIError } from '@/features/ai/lib/ai-errors'
import { SmartInsert } from '../utils/smart-insert'

export function useAITransform(editor: Editor | null) {
  const smartInsert = useMemo(() => 
    editor ? new SmartInsert(editor) : null, 
    [editor]
  )
  
  // Store the current operation and prompt for use in onFinish
  const contextRef = useRef<{ operation: AIOperation; customPrompt?: string } | undefined>(undefined)

  const { complete, completion, isLoading, error } = useCompletion({
    api: '/api/ai/transform',
    onFinish: async (_prompt, completion) => {
      if (!editor || !smartInsert) return

      const { from, to } = editor.state.selection
      editor.chain().focus().deleteRange({ from, to }).run()
      
      // Use smart insert for intelligent block creation
      const context = contextRef.current
      await smartInsert.insertContent(completion, {
        userPrompt: context?.customPrompt || context?.operation || _prompt,
        operation: context?.operation,
        selection: { from, to }
      })

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

      // Store context for use in onFinish
      contextRef.current = { operation, customPrompt }

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