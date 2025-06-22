import { useEffect, useRef, useCallback } from 'react'
import { Editor } from '@tiptap/core'
import { useCompletion } from 'ai/react'
import { toast } from 'sonner'
import { handleAIError } from '../lib/ai-errors'
import { debounce } from 'lodash'

export function useGhostText(editor: Editor | null) {
  const positionRef = useRef<number | null>(null)
  const lastCompletionRef = useRef<string>('')

  console.log('[useGhostText] Hook initialized. Editor exists:', !!editor)

  const { complete, completion, isLoading, stop } = useCompletion({
    api: '/api/ai/completion',
    onResponse: response => {
      console.log('[useGhostText] AI Response received:', response)
    },
    onFinish: (prompt, completion) => {
      console.log('[useGhostText] AI Finished. Prompt:', prompt, 'Completion:', completion)
    },
    onError: error => {
      console.error('[useGhostText] AI Error:', error)
      handleAIError(error)
      if (editor) {
        editor.commands.clearGhostText()
      }
    }
  })

  useEffect(() => {
    if (completion) {
      console.log('[useGhostText] Completion updated:', completion)
    }
  }, [completion])

  const updateGhostText = useCallback(
    debounce((text: string, position: number) => {
      if (editor && text !== lastCompletionRef.current) {
        console.log('[useGhostText] Setting ghost text in editor:', text)
        lastCompletionRef.current = text
        editor.commands.setGhostText(text, position)
      }
    }, 50),
    [editor]
  )

  useEffect(() => {
    if (completion && positionRef.current !== null) {
      updateGhostText(completion, positionRef.current)
    }
  }, [completion, updateGhostText])

  useEffect(() => {
    if (!editor) {
      console.log('[useGhostText] No editor, skipping event setup')
      return
    }

    console.log('[useGhostText] Setting up event listeners')

    const handleTrigger = ({ position, context }: { position: number; context: string }) => {
      console.log('[useGhostText] Trigger event received! Position:', position, 'Context length:', context.length)
      positionRef.current = position

      editor.commands.clearGhostText()

      console.log('[useGhostText] Calling complete() with context')
      complete(context, { body: { mode: 'ghost-text' } })
    }

    const handleAccept = (text: string) => {
      console.log('[useGhostText] Accept event received:', text)
      if (positionRef.current !== null) {
        editor.chain().focus().insertContentAt(positionRef.current, text).run()
      }

      editor.commands.clearGhostText()
      positionRef.current = null
      stop()
    }

    const handleReject = () => {
      console.log('[useGhostText] Reject event received')
      editor.commands.clearGhostText()
      positionRef.current = null
      stop()
    }

    editor.on('ghostTextTrigger', handleTrigger)
    editor.on('ghostTextAccept', handleAccept)
    editor.on('ghostTextReject', handleReject)

    console.log('[useGhostText] Event listeners registered')

    return () => {
      console.log('[useGhostText] Cleaning up event listeners')
      editor.off('ghostTextTrigger', handleTrigger)
      editor.off('ghostTextAccept', handleAccept)
      editor.off('ghostTextReject', handleReject)
    }
  }, [editor, complete, stop])

  return {
    isLoading,
    ghostText: completion
  }
} 