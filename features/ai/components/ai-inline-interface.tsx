'use client'

import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import { useState, useCallback, FormEvent, useEffect, useMemo } from 'react'
import { Wand2, X, CornerDownLeft, RefreshCw, ArrowDown, Check, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAICompletion } from '../hooks/use-ai-completion'

const SUGGESTIONS = [
  'Write a JavaScript function',
  'Create a Python class',
  'Make a todo list',
  'Write a React component',
  'Create a smart contract',
  'Add a summary',
  'Improve writing style'
]

interface AIBlock {
  type: 'paragraph' | 'heading' | 'codeBlock' | 'bulletList' | 'orderedList' | 'taskList' | 'blockquote'
  content: string
  attrs?: Record<string, any>
  items?: string[] // For lists
}

interface AIResponse {
  blocks: AIBlock[]
}

export function AIInlineInterface({ editor, node, getPos }: NodeViewProps) {
  const [input, setInput] = useState('')
  const [originalPrompt, setOriginalPrompt] = useState('')
  const [isEditing, setIsEditing] = useState(false)
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
      setOriginalPrompt(input)
      triggerCompletion(input)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setInput(originalPrompt)
  }

  const handleEditSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      setOriginalPrompt(input)
      setIsEditing(false)
      triggerCompletion(input)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    setShowSuggestions(false)
    setOriginalPrompt(suggestion)
    triggerCompletion(suggestion)
  }

  const handleClose = useCallback(() => {
    editor.chain().focus().deleteRange({ from: position, to: position + node.nodeSize }).run()
  }, [editor, position, node.nodeSize])

  const insertBlocks = useCallback((blocks: AIBlock[]) => {
    blocks.forEach((block, index) => {
      // Add a new paragraph between blocks if not the first one
      if (index > 0) {
        editor.chain().focus().insertContent({ type: 'paragraph' }).run()
      }

      switch (block.type) {
        case 'codeBlock':
          editor.chain()
            .focus()
            .insertContent({
              type: 'codeBlock',
              attrs: { language: block.attrs?.language || 'plaintext' },
              content: [{ type: 'text', text: block.content }]
            })
            .run()
          break
          
        case 'heading':
          editor.chain()
            .focus()
            .insertContent({
              type: 'heading',
              attrs: { level: block.attrs?.level || 2 },
              content: [{ type: 'text', text: block.content }]
            })
            .run()
          break

        case 'bulletList':
        case 'orderedList':
          const listItems = block.items || [block.content]
          editor.chain()
            .focus()
            .insertContent({
              type: block.type,
              content: listItems.map(item => ({
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: item }] }]
              }))
            })
            .run()
          break

        case 'taskList':
          const taskItems = block.items || [block.content]
          editor.chain()
            .focus()
            .insertContent({
              type: 'taskList',
              content: taskItems.map(item => ({
                type: 'taskItem',
                attrs: { checked: false },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: item }] }]
              }))
            })
            .run()
          break

        case 'blockquote':
          editor.chain()
            .focus()
            .insertContent({
              type: 'blockquote',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: block.content }] }]
            })
            .run()
          break
          
        case 'paragraph':
        default:
          editor.chain()
            .focus()
            .insertContent({
              type: 'paragraph',
              content: [{ type: 'text', text: block.content }]
            })
            .run()
          break
      }
    })
  }, [editor])

  const handleAccept = useCallback(() => {
    // Delete the inline AI node first
    editor.chain().focus().deleteRange({ from: position, to: position + node.nodeSize }).run()
    
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(completion) as AIResponse
      
      if (parsed.blocks && Array.isArray(parsed.blocks)) {
        insertBlocks(parsed.blocks)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (e) {
      // Fallback: treat as plain text in a paragraph
      editor.chain().focus().insertContent({
        type: 'paragraph',
        content: [{ type: 'text', text: completion }]
      }).run()
    }
  }, [editor, position, node.nodeSize, completion, insertBlocks])

  const handleInsertBelow = useCallback(() => {
    const endPos = position + node.nodeSize
    
    // Delete the inline AI node
    editor.chain().focus().deleteRange({ from: position, to: position + node.nodeSize }).run()
    
    // Move cursor to end position and create new paragraph
    editor.chain()
      .focus()
      .insertContentAt(endPos, { type: 'paragraph' })
      .setTextSelection(endPos + 1)
      .run()
    
    try {
      const parsed = JSON.parse(completion) as AIResponse
      if (parsed.blocks && Array.isArray(parsed.blocks)) {
        insertBlocks(parsed.blocks)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (e) {
      editor.chain().focus().insertContent({
        type: 'paragraph',
        content: [{ type: 'text', text: completion }]
      }).run()
    }
  }, [editor, position, node.nodeSize, completion, insertBlocks])

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
        className="relative rounded-lg border border-border bg-muted/50 p-4 shadow-sm max-w-full overflow-hidden"
        style={{ maxHeight: '400px' }}
        draggable="true"
        data-drag-handle
      >
        <div className="flex items-center justify-between mb-3 sticky top-0 bg-muted/50 z-10">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Wand2 className="h-4 w-4" />
            <span>Ask AI to write anything...</span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: '280px' }}>
          {completion || isLoading ? (
            <div className="response-area min-h-[100px]">
              {isEditing ? (
                <form onSubmit={handleEditSubmit} className="mb-3">
                  <Textarea
                    value={input}
                    onChange={handleInputChange}
                    className="w-full bg-background resize-none"
                    rows={2}
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" type="submit">Update</Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                  </div>
                </form>
              ) : (
                <>
                  {originalPrompt && (
                    <div className="text-sm text-muted-foreground mb-2">
                      <span className="font-medium">Prompt:</span> {originalPrompt}
                    </div>
                  )}
                  <div className="prose prose-sm dark:prose-invert max-w-full whitespace-pre-wrap font-mono text-sm bg-background p-3 rounded-md">
                    {completion}
                  </div>
                </>
              )}
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
        </div>

        <div className="flex items-center justify-end gap-2 mt-3 sticky bottom-0 bg-muted/50 pt-2 border-t">
          {isLoading ? (
            <Button variant="ghost" onClick={stop}>
              Cancel
            </Button>
          ) : completion && !isEditing ? (
            <>
              <Button variant="ghost" size="sm" onClick={handleEdit}>
                <Edit2 className="h-4 w-4 mr-1.5" /> Edit Prompt
              </Button>
              <Button variant="ghost" size="sm" onClick={handleInsertBelow}>
                <ArrowDown className="h-4 w-4 mr-1.5" /> Insert Below
              </Button>
              <Button variant="ghost" size="sm" onClick={() => triggerCompletion(originalPrompt)}>
                <RefreshCw className="h-4 w-4 mr-1.5" /> Try Again
              </Button>
              <Button variant="default" size="sm" onClick={handleAccept}>
                <Check className="h-4 w-4 mr-1.5" /> Accept
              </Button>
            </>
          ) : !isEditing ? (
            <Button variant="default" size="sm" type="submit" onClick={handleSubmit} disabled={!input.trim()}>
              <CornerDownLeft className="h-4 w-4 mr-1.5" />
              Generate
            </Button>
          ) : null}
        </div>
      </div>
    </NodeViewWrapper>
  )
} 