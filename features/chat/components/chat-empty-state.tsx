'use client'

/**
 * Component: ChatEmptyState
 * Purpose: Engaging empty state with suggestions
 * Features:
 * - Context-aware suggestions
 * - Quick action buttons
 * - Beautiful illustrations
 * 
 * Created: December 2024
 */

import { Button } from '@/components/ui/button'
import { Sparkles, FileText, Lightbulb, HelpCircle } from 'lucide-react'

interface ChatEmptyStateProps {
  onSuggestionClick: (suggestion: string) => void
  hasNoteContext?: boolean
}

export function ChatEmptyState({ onSuggestionClick, hasNoteContext }: ChatEmptyStateProps) {
  const suggestions = hasNoteContext
    ? [
        { icon: FileText, text: 'Summarize this note', prompt: 'Can you summarize the main points of this note?' },
        { icon: Lightbulb, text: 'Suggest improvements', prompt: 'How can I improve this note?' },
        { icon: HelpCircle, text: 'Explain concepts', prompt: 'Can you explain the key concepts in this note?' },
      ]
    : [
        { icon: Lightbulb, text: 'Brainstorm ideas', prompt: 'Help me brainstorm ideas for a new project' },
        { icon: FileText, text: 'Write content', prompt: 'Help me write an introduction for my blog post' },
        { icon: HelpCircle, text: 'Answer questions', prompt: 'What are best practices for note-taking?' },
      ]

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center mb-6">
        <Sparkles className="w-8 h-8 text-white" />
      </div>
      
      <h2 className="text-2xl font-semibold mb-2">Start a conversation</h2>
      <p className="text-muted-foreground text-center mb-8 max-w-md">
        {hasNoteContext
          ? "I can help you understand, improve, or expand on your note."
          : "Ask me anything or try one of these suggestions to get started."}
      </p>
      
      <div className="grid gap-3 w-full max-w-md">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            className="justify-start h-auto py-3 px-4"
            onClick={() => onSuggestionClick(suggestion.prompt)}
          >
            <suggestion.icon className="mr-3 h-5 w-5 text-muted-foreground" />
            <span className="text-left">{suggestion.text}</span>
          </Button>
        ))}
      </div>
    </div>
  )
} 