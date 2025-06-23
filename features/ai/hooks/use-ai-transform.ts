'use client'

import { Editor } from '@tiptap/core'
import { useCompletion } from 'ai/react'
import { useCallback, useState } from 'react'
import { AIOperation } from '../types'
import { handleAIError } from '../lib/ai-errors'
import { useFeedbackTracker } from './use-feedback-tracker'

export function useAITransform(editor: Editor) {
  const [isFinished, setIsFinished] = useState(false)
  const [startTime, setStartTime] = useState<number>(0)
  const [originalText, setOriginalText] = useState('')
  const [operation, setOperation] = useState<AIOperation>('improve')
  const { trackFeedback } = useFeedbackTracker()
  
  const { complete, completion, isLoading } = useCompletion({
    api: '/api/ai/transform',
    onFinish: (prompt, completion) => {
      if (!editor) return
      
      const { from, to } = editor.state.selection
      
      // Track as accepted (since it auto-replaces)
      trackFeedback({
        operation: 'transform',
        action: 'accepted',
        prompt: operation === 'custom' ? prompt : operation,
        input: originalText,
        output: completion,
        metadata: {
          duration: Date.now() - startTime,
          operation,
          from,
          to
        }
      })
      
      editor.chain()
        .focus()
        .deleteRange({ from, to })
        .insertContentAt(from, completion)
        .run()
      
      setIsFinished(true)
      setTimeout(() => setIsFinished(false), 100)
    },
    onError: error => {
      handleAIError(error)
      setIsFinished(true)
      setTimeout(() => setIsFinished(false), 100)
    }
  })

  const transform = useCallback(async (text: string, operation: AIOperation, customPrompt?: string) => {
    setStartTime(Date.now())
    setOriginalText(text)
    setOperation(operation)
    
    await complete(text, {
      body: { operation, customPrompt }
    })
  }, [complete])

  return { transform, isLoading, isFinished }
} 