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
      console.error('[useGhostText] AI completion error:', error)
      if (isMountedRef.current) {
        handleAIError(error)
        if (editor) {
          editor.commands.clearGhostText()
        }
      }
    },
    onFinish: (prompt, completion) => {
      console.log('[useGhostText] Completion finished:', { prompt, completion })
    },
    onResponse: (response) => {
      console.log('[useGhostText] Got response:', response.status)
    }
  })

  // Update ghost text when completion changes
  useEffect(() => {
    console.log('[useGhostText] Completion changed:', { 
      completion, 
      position: positionRef.current, 
      hasEditor: !!editor, 
      isMounted: isMountedRef.current 
    })
    
    if (completion && positionRef.current !== null && editor && isMountedRef.current) {
      console.log('[useGhostText] Setting ghost text in editor')
      editor.commands.setGhostText(completion, positionRef.current)
    }
  }, [completion, editor])

  useEffect(() => {
    if (!editor) return

    const handleTrigger = (props: { position: number; context: string }) => {
      console.log('[useGhostText] Ghost text triggered:', props)
      positionRef.current = props.position

      // Don't clear ghost text here - let the completion handle it
      // editor.commands.clearGhostText()

      // Only trigger if we have enough context
      if (props.context.length >= 10) {
        console.log('[useGhostText] Context is long enough, calling complete')
        complete(props.context, { body: { mode: 'ghost-text' } })
      } else {
        console.log('[useGhostText] Context too short:', props.context.length, 'chars')
      }
    }

    const handleAccept = (text: string) => {
      console.log('[useGhostText] Accepting ghost text:', text)
      if (positionRef.current !== null) {
        editor.chain().focus().insertContentAt(positionRef.current, text).run()
      }

      editor.commands.clearGhostText()
      positionRef.current = null
      stop()
    }

    const handleReject = () => {
      console.log('[useGhostText] Rejecting ghost text')
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