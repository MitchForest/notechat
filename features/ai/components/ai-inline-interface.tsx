'use client'

import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import { useState, useCallback, FormEvent, useEffect } from 'react'
import { Wand2, X, CornerDownLeft, RefreshCw, ArrowDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAICompletion } from '../hooks/use-ai-completion'

const SUGGESTIONS = [
  'Continue writing',
  'Add a summary',
  'Make a bullet list',
  'Improve writing style'
]

export function AIInlineInterface({ editor, node, getPos }: NodeViewProps) {
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(true)

  const { completion, triggerCompletion, isLoading, stop } = useAICompletion()

  const position = typeof getPos === 'function' ? getPos() : 0

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value)
    if (event.target.value.length > 0 && showSuggestions) {
      setShowSuggestions(false)
    } else if (event.target.value.length === 0 && !showSuggestions) {
      setShowSuggestions(true)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      triggerCompletion(input)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    setShowSuggestions(false)
    triggerCompletion(suggestion)
  }

  const handleClose = useCallback(() => {
    editor.chain().focus().deleteRange({ from: position, to: position + node.nodeSize }).run()
  }, [editor, position, node.nodeSize])

  const handleAccept = useCallback(() => {
    editor.chain().focus().deleteRange({ from: position, to: position + node.nodeSize }).insertContent(completion).run()
  }, [editor, position, node.nodeSize, completion])

  const handleInsertBelow = useCallback(() => {
    const endPos = position + node.nodeSize
    editor.chain().focus().deleteRange({ from: position, to: position + node.nodeSize }).insertContentAt(endPos, completion).run()
  }, [editor, position, node.nodeSize, completion])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleClose])

  return (
    <NodeViewWrapper>
      <div
        className="relative rounded-lg border border-border bg-muted/50 p-4 shadow-sm"
        draggable="true"
        data-drag-handle
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Wand2 className="h-4 w-4" />
            <span>Ask AI anything...</span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {completion || isLoading ? (
          <div className="response-area min-h-[100px]">
            <div className="prose prose-sm dark:prose-invert max-w-full">{completion}</div>
            {isLoading && !completion && <div className="text-muted-foreground">AI is thinking...</div>}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <Textarea
              value={input}
              onChange={handleInputChange}
              placeholder="e.g., 'Create a poem about coding'"
              className="w-full bg-background resize-none"
              rows={2}
            />
            {showSuggestions && (
              <div className="mt-2 text-sm text-muted-foreground">
                <strong>Suggested:</strong>
                <div className="flex flex-wrap gap-2 mt-1">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      type="button"
                      className="px-2 py-1 rounded-md bg-background hover:bg-accent border"
                      onClick={() => handleSuggestionClick(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        )}

        <div className="flex items-center justify-end gap-2 mt-3">
          {isLoading ? (
            <Button variant="ghost" onClick={stop}>
              Cancel
            </Button>
          ) : completion ? (
            <>
              <Button variant="ghost" size="sm" onClick={handleInsertBelow}>
                <ArrowDown className="h-4 w-4 mr-1.5" /> Insert Below
              </Button>
              <Button variant="ghost" size="sm" onClick={() => triggerCompletion(input)}>
                <RefreshCw className="h-4 w-4 mr-1.5" /> Try Again
              </Button>
              <Button size="sm" onClick={handleAccept}>
                <Check className="h-4 w-4 mr-1.5" /> Accept
              </Button>
            </>
          ) : (
            <Button size="sm" type="submit" onClick={handleSubmit} disabled={!input.trim()}>
              <CornerDownLeft className="h-4 w-4 mr-1.5" />
              Generate
            </Button>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  )
} 