'use client'

/**
 * Component: ChatMessage
 * Purpose: Individual message display with actions
 * Features:
 * - Markdown rendering
 * - Code syntax highlighting
 * - Copy/regenerate actions
 * - Smooth streaming animation
 * - Extract to note
 * 
 * Created: December 2024
 * Updated: December 2024 - Added extract to note
 */

import '../styles/animations.css'
import { Message } from 'ai'
import { useState, memo } from 'react'
import { cn } from '@/lib/utils'
import { 
  Copy, 
  RefreshCw, 
  Edit2, 
  Check,
  User,
  Bot,
  Loader2,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { ExtractToNoteDialog } from './extract-to-note-dialog'

interface ChatMessageProps {
  message: Message
  isStreaming?: boolean
  onRegenerate?: () => void
  onEdit?: (content: string) => void
}

export const ChatMessage = memo(function ChatMessage({
  message,
  isStreaming,
  onRegenerate,
  onEdit,
}: ChatMessageProps) {
  const [isCopied, setIsCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showExtractDialog, setShowExtractDialog] = useState(false)
  const isUser = message.role === 'user'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <>
      <div className={cn('message group relative flex gap-3', isUser && 'flex-row-reverse')}>
        <Avatar className="flex-shrink-0 w-8 h-8">
          <AvatarFallback className={cn(
            isUser ? 'bg-primary' : 'bg-muted',
          )}>
            {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
          </AvatarFallback>
        </Avatar>

        <div className={cn(
          'flex-1 space-y-2',
          isUser && 'flex flex-col items-end'
        )}>
          <div className={cn(
            'prose prose-sm dark:prose-invert max-w-none',
            'bg-muted/50 rounded-lg px-4 py-3',
            isUser && 'bg-primary text-primary-foreground prose-invert'
          )}>
            {isUser ? (
              <p className="whitespace-pre-wrap m-0">{message.content}</p>
            ) : (
              <ReactMarkdown
                components={{
                  code({ className, children, ...props }: any) {
                    const inline = props.inline
                    const match = /language-(\w+)/.exec(className || '')
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={oneDark}
                        language={match[1]}
                        PreTag="div"
                        {...props as any}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
            
            {isStreaming && (
              <div className="flex items-center gap-2 mt-2">
                <span className="streaming-indicator" />
                <span className="text-xs text-muted-foreground">Thinking...</span>
              </div>
            )}
          </div>

          {!isStreaming && (
            <div className="message-actions flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="interactive-button h-7 text-xs"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExtractDialog(true)}
                className="interactive-button h-7 text-xs"
              >
                <FileText className="w-3 h-3 mr-1" />
                Extract
              </Button>
              
              {!isUser && onRegenerate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRegenerate}
                  className="interactive-button h-7 text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Regenerate
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {showExtractDialog && (
        <ExtractToNoteDialog
          open={showExtractDialog}
          onOpenChange={setShowExtractDialog}
          extractOptions={{
            source: 'message',
            content: message,
          }}
        />
      )}
    </>
  )
}) 