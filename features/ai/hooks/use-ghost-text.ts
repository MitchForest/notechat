import { useEffect, useRef, useCallback } from 'react'
import { Editor } from '@tiptap/core'
import { useCompletion } from 'ai/react'
import { handleAIError } from '../lib/ai-errors'

export function useGhostText(editor: Editor | null) {
  const positionRef = useRef<number | null>(null)
  const isMountedRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const { complete, completion, isLoading, stop } = useCompletion({
    api: '/api/ai/completion',
    onError: error => {
      if (isMountedRef.current) {
        handleAIError(error)
        if (editor) {
          editor.commands.clearGhostText()
        }
      }
    }
  })

  // Update ghost text when completion changes
  useEffect(() => {
    if (completion && positionRef.current !== null && editor && isMountedRef.current) {
      editor.commands.setGhostText(completion, positionRef.current)
    }
  }, [completion, editor])

  useEffect(() => {
    if (!editor) return

    const handleTrigger = (props: { position: number; context: string }) => {
      positionRef.current = props.position

      // Clear any existing ghost text
      editor.commands.clearGhostText()

      // Only trigger if we have enough context
      if (props.context.length >= 10) {
        complete(props.context, { body: { mode: 'ghost-text' } })
      }
    }

    const handleAccept = (text: string) => {
      if (positionRef.current !== null) {
        editor.chain().focus().insertContentAt(positionRef.current, text).run()
      }

      editor.commands.clearGhostText()
      positionRef.current = null
      stop()
    }

    const handleReject = () => {
      editor.commands.clearGhostText()
      positionRef.current = null
      stop()
    }

    ;(editor as any).on('ghostTextTrigger', handleTrigger)
    ;(editor as any).on('ghostTextAccept', handleAccept)
    ;(editor as any).on('ghostTextReject', handleReject)

    return () => {
      ;(editor as any).off('ghostTextTrigger', handleTrigger)
      ;(editor as any).off('ghostTextAccept', handleAccept)
      ;(editor as any).off('ghostTextReject', handleReject)
      
      // Clean up any pending operations
      if (positionRef.current !== null) {
        stop()
        positionRef.current = null
      }
    }
  }, [editor, complete, stop])

  return {
    isLoading,
    ghostText: completion
  }
} 