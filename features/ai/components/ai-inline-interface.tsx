'use client'

import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import { useState, useCallback, FormEvent, useEffect, useMemo } from 'react'
import { Wand2, X, CornerDownLeft, RefreshCw, ArrowDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAICompletion } from '../hooks/use-ai-completion'
import { SmartInsert } from '../utils/smart-insert'

const SUGGESTIONS = [
  'Write a JavaScript function',
  'Create a Python class',
  'Make a todo list',
  'Write a React component',
  'Create a smart contract',
  'Add a summary',
  'Improve writing style'
]

export function AIInlineInterface({ editor, node, getPos }: NodeViewProps) {
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(true)

  const { completion, triggerCompletion, isLoading, stop } = useAICompletion()
  
  // Create SmartInsert instance
  const smartInsert = useMemo(() => new SmartInsert(editor), [editor])

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

  const handleAccept = useCallback(async () => {
    // Delete the inline AI node first
    editor.chain().focus().deleteRange({ from: position, to: position + node.nodeSize }).run()
    
    // Use SmartInsert to intelligently insert the content
    await smartInsert.insertContent(completion, {
      userPrompt: input,
      operation: 'generate'
    })
  }, [editor, position, node.nodeSize, completion, smartInsert, input])

  const handleInsertBelow = useCallback(async () => {
    const endPos = position + node.nodeSize
    
    // Delete the inline AI node
    editor.chain().focus().deleteRange({ from: position, to: position + node.nodeSize }).run()
    
    // Move cursor to end position and create new paragraph
    editor.chain()
      .focus()
      .insertContentAt(endPos, '<p></p>')
      .setTextSelection(endPos + 1)
      .run()
    
    // Use SmartInsert to intelligently insert the content
    await smartInsert.insertContent(completion, {
      userPrompt: input,
      operation: 'generate'
    })
  }, [editor, position, node.nodeSize, completion, smartInsert, input])

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
            <span>Ask AI to write anything...</span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {completion || isLoading ? (
          <div className="response-area min-h-[100px]">
            <div className="prose prose-sm dark:prose-invert max-w-full whitespace-pre-wrap font-mono text-sm bg-background p-3 rounded-md">
              {completion}
            </div>
            {isLoading && !completion && <div className="text-muted-foreground">AI is thinking...</div>}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <Textarea
              value={input}
              onChange={handleInputChange}
              placeholder="e.g., 'Write a JavaScript function to sort an array' or 'Create a todo list'"
              className="w-full bg-background resize-none"
              rows={2}
              autoFocus
            />
            {showSuggestions && (
              <div className="mt-2 text-sm text-muted-foreground">
                <strong>Try these:</strong>
                <div className="flex flex-wrap gap-2 mt-1">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      type="button"
                      className="px-2 py-1 rounded-md bg-background hover:bg-neutral-100 dark:hover:bg-neutral-800 border text-xs"
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
              <Button variant="default" size="sm" onClick={handleAccept}>
                <Check className="h-4 w-4 mr-1.5" /> Accept
              </Button>
            </>
          ) : (
            <Button variant="default" size="sm" type="submit" onClick={handleSubmit} disabled={!input.trim()}>
              <CornerDownLeft className="h-4 w-4 mr-1.5" />
              Generate
            </Button>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  )
} 