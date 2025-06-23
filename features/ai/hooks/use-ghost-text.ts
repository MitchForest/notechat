'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { Editor } from '@tiptap/core'
import { useCompletion } from 'ai/react'
import { handleAIError } from '../lib/ai-errors'
import { useFeedbackTracker } from './use-feedback-tracker'
import { debounce } from 'lodash'

export function useGhostText(editor: Editor | null) {
  const [ghostText, setGhostText] = useState('')
  const [position, setPosition] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [startTime, setStartTime] = useState<number>(0)
  const [lastInput, setLastInput] = useState('')
  const positionRef = useRef<number | null>(null)
  const isMountedRef = useRef(false)
  const completeRef = useRef<any>(null)
  const stopRef = useRef<any>(null)
  const lastCompletionRef = useRef<string>('')
  const { trackFeedback } = useFeedbackTracker()

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const { complete, completion, isLoading: aiLoading, stop, setCompletion } = useCompletion({
    api: '/api/ai/completion',
    onError: error => {
      console.error('[useGhostText] AI completion error:', error)
      if (isMountedRef.current) {
        handleAIError(error)
        if (editor) {
          editor.commands.clearGhostText()
        }
      }
    },
    onFinish: (prompt, completion) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[useGhostText] Completion finished')
      }
    },
    onResponse: (response) => {
    }
  })

  // Store the latest functions in refs to avoid effect re-runs
  useEffect(() => {
    completeRef.current = complete
    stopRef.current = stop
  }, [complete, stop])

  // Debounced function to update ghost text in editor
  const debouncedSetGhostText = useRef(
    debounce((editor: Editor, text: string, pos: number) => {
      if (!editor || !isMountedRef.current) return
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[useGhostText] Debounced update')
      }
      
      editor.commands.setGhostText(text, pos)
    }, 100) // Increase to 100ms for better performance
  ).current

  // Update ghost text when completion changes
  useEffect(() => {
    if (!editor || !completion || positionRef.current === null || !isMountedRef.current) {
      return
    }

    // Skip if this is the same completion we just processed
    if (completion === lastCompletionRef.current) {
      return
    }
    
    // Update local state immediately
    setGhostText(completion)
    setPosition(positionRef.current)
    lastCompletionRef.current = completion
    
    // Update editor with debounce
    debouncedSetGhostText(editor, completion, positionRef.current)
  }, [completion, editor, debouncedSetGhostText])

  // Set up event handlers only once per editor instance
  useEffect(() => {
    if (!editor) return

    const handleTrigger = (props: { position: number; context: string }) => {
      console.log('[useGhostText] Ghost text triggered at position:', props.position)
      positionRef.current = props.position

      // Only trigger if we have enough context
      if (props.context.length >= 10) {
        if (completeRef.current) {
          completeRef.current(props.context, { body: { mode: 'ghost-text' } })
        }
      }
    }

    const handleAccept = (text: string) => {
      if (positionRef.current !== null) {
        // Add a space before the ghost text
        editor.chain().focus().insertContentAt(positionRef.current, ' ' + text).run()
      }

      editor.commands.clearGhostText()
      positionRef.current = null
      setCompletion('') // Clear the completion state
      if (stopRef.current) {
        stopRef.current()
      }
    }

    const handleReject = () => {
      editor.commands.clearGhostText()
      positionRef.current = null
      setCompletion('') // Clear the completion state
      if (stopRef.current) {
        stopRef.current()
      }
    }

    ;(editor as any).on('ghostTextTrigger', handleTrigger)
    ;(editor as any).on('ghostTextAccept', handleAccept)
    ;(editor as any).on('ghostTextReject', handleReject)

    return () => {
      ;(editor as any).off('ghostTextTrigger', handleTrigger)
      ;(editor as any).off('ghostTextAccept', handleAccept)
      ;(editor as any).off('ghostTextReject', handleReject)
    }
  }, [editor]) // Only depend on editor, not on complete/stop

  const clearGhostText = useCallback(() => {
    // Track as ignored if there was ghost text
    if (ghostText && position !== null) {
      trackFeedback({
        operation: 'ghost-text',
        action: 'ignored',
        input: lastInput,
        output: ghostText,
        metadata: {
          duration: Date.now() - startTime,
          position
        }
      })
    }
    
    setGhostText('')
    setPosition(null)
    positionRef.current = null
    setCompletion('')
    
    if (editor) {
      const tr = editor.state.tr
      tr.setMeta('ghostText', { text: '', position: null })
      editor.view.dispatch(tr)
    }
  }, [editor, ghostText, position, lastInput, startTime, trackFeedback, setCompletion])

  const acceptGhostText = useCallback(() => {
    if (!editor || !ghostText || position === null) return
    
    // Track as accepted
    trackFeedback({
      operation: 'ghost-text',
      action: 'accepted',
      input: lastInput,
      output: ghostText,
      metadata: {
        duration: Date.now() - startTime,
        position
      }
    })
    
    editor.chain()
      .focus()
      .insertContentAt(position, ' ' + ghostText)
      .run()
    
    clearGhostText()
  }, [editor, ghostText, position, clearGhostText, lastInput, startTime, trackFeedback])

  const triggerGhostText = useCallback(async (text: string, pos: number) => {
    if (!editor || isLoading) return
    
    setIsLoading(true)
    setStartTime(Date.now())
    setLastInput(text)
    
    // ... rest of the function remains the same ...
  }, [editor, isLoading])

  return {
    triggerGhostText,
    clearGhostText,
    acceptGhostText,
    isLoading,
    ghostText: completion
  }
} 