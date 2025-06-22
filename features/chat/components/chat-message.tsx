'use client'

/**
 * Component: ChatMessage
 * Purpose: Individual message display with actions
 * Features:
 * - Markdown rendering
 * - Code syntax highlighting
 * - Copy/regenerate actions
 * - Smooth streaming animation
 * - Claude-like message design
 * - Tool invocation display
 * - Mobile long-press support
 * 
 * Created: December 2024
 * Updated: December 2024 - Added mobile support
 */

import '../styles/animations.css'
import '../styles/chat.css'
import { Message } from 'ai'
import { useState, memo, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { 
  Copy, 
  RefreshCw, 
  Check,
  Loader2,
  FileText,
  Wrench,
  CheckCircle,
  XCircle
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { ExtractToNoteDialog } from './extract-to-note-dialog'
import { MessageAvatar } from './message-avatar'
import { highlightSearchResults } from './chat-search'

interface ChatMessageProps {
  message: Message
  isStreaming?: boolean
  onRegenerate?: () => void
  onEdit?: (content: string) => void
  userName?: string
  userImage?: string
  searchQuery?: string
  isCurrentSearchMatch?: boolean
}

export const ChatMessage = memo(function ChatMessage({
  message,
  isStreaming,
  onRegenerate,
  onEdit,
  userName,
  userImage,
  searchQuery,
  isCurrentSearchMatch,
}: ChatMessageProps) {
  const [isCopied, setIsCopied] = useState(false)
  const [showExtractDialog, setShowExtractDialog] = useState(false)
  const [showMobileActions, setShowMobileActions] = useState(false)
  const isUser = message.role === 'user'
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const messageRef = useRef<HTMLDivElement>(null)

  // Handle long press for mobile
  useEffect(() => {
    const element = messageRef.current
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      // Don't interfere with scrolling
      const touch = e.touches[0]
      const startY = touch.clientY

      longPressTimerRef.current = setTimeout(() => {
        // Vibrate if available
        if (navigator.vibrate) {
          navigator.vibrate(10)
        }
        setShowMobileActions(true)
      }, 500) // 500ms long press

      const handleTouchMove = (e: TouchEvent) => {
        const touch = e.touches[0]
        const deltaY = Math.abs(touch.clientY - startY)
        
        // Cancel long press if user scrolls
        if (deltaY > 10 && longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current)
          longPressTimerRef.current = null
        }
      }

      const handleTouchEnd = () => {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current)
          longPressTimerRef.current = null
        }
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
      }

      document.addEventListener('touchmove', handleTouchMove)
      document.addEventListener('touchend', handleTouchEnd)
    }

    element.addEventListener('touchstart', handleTouchStart)

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [])

  // Close mobile actions when clicking outside
  useEffect(() => {
    if (!showMobileActions) return

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (messageRef.current && !messageRef.current.contains(e.target as Node)) {
        setShowMobileActions(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)

    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [showMobileActions])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setIsCopied(true)
    setShowMobileActions(false)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleCreateNote = () => {
    setShowExtractDialog(true)
    setShowMobileActions(false)
  }

  const handleRegenerate = () => {
    onRegenerate?.()
    setShowMobileActions(false)
  }

  // Function to render tool invocations
  const renderToolInvocations = () => {
    if (!message.toolInvocations || message.toolInvocations.length === 0) return null

    return (
      <div className="mt-3 space-y-2">
        {message.toolInvocations.map((invocation, index) => (
          <div
            key={index}
            className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border/50"
          >
            <Wrench className="w-4 h-4 mt-0.5 text-muted-foreground" />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {invocation.toolName === 'create_note' && 'Creating note'}
                  {invocation.toolName === 'update_note' && 'Updating note'}
                  {invocation.toolName === 'edit_selection' && 'Editing selection'}
                  {invocation.toolName === 'search_notes' && 'Searching notes'}
                </span>
                {invocation.state === 'result' && (
                  invocation.result?.success ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-destructive" />
                  )
                )}
              </div>
              
              {invocation.state === 'call' && (
                <div className="text-xs text-muted-foreground">
                  {invocation.toolName === 'create_note' && invocation.args && (
                    <>Creating "{invocation.args.title}"</>
                  )}
                  {invocation.toolName === 'update_note' && invocation.args && (
                    <>Updating note {invocation.args.note_id}</>
                  )}
                  {invocation.toolName === 'search_notes' && invocation.args && (
                    <>Searching for "{invocation.args.query}"</>
                  )}
                </div>
              )}
              
              {invocation.state === 'result' && invocation.result && (
                <div className="text-xs text-muted-foreground">
                  {invocation.result.message || 'Action completed'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <div 
        ref={messageRef}
        className={cn(
          'chat-message-wrapper message-enter',
          isUser ? 'user' : 'assistant',
          showMobileActions && 'show-mobile-actions'
        )}
        data-message-id={message.id}
      >
        <MessageAvatar 
          role={message.role} 
          userName={userName}
          userImage={userImage}
        />

        <div className={cn(
          'chat-message-bubble',
          isUser ? 'user' : 'assistant'
        )}>
          <div className="chat-message-content">
            {isUser ? (
              <p className="whitespace-pre-wrap">
                {searchQuery 
                  ? highlightSearchResults(message.content, searchQuery, isCurrentSearchMatch)
                  : message.content
                }
              </p>
            ) : (
              <>
                {searchQuery ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {highlightSearchResults(message.content, searchQuery, isCurrentSearchMatch)}
                  </div>
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
                
                {/* Render tool invocations */}
                {renderToolInvocations()}
              </>
            )}
            
            {isStreaming && (
              <div className="flex items-center gap-2 mt-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-xs text-muted-foreground">Thinking...</span>
              </div>
            )}
          </div>

          {/* Hover Actions (Desktop) / Touch Actions (Mobile) */}
          {!isStreaming && (
            <div className={cn(
              "chat-message-actions",
              showMobileActions && "show-mobile"
            )}>
              <button
                onClick={handleCopy}
                className="chat-action-button"
                title="Copy message"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
              
              <button
                onClick={handleCreateNote}
                className="chat-action-button"
                title="Create note from message"
              >
                <FileText className="w-3 h-3" />
                <span>Note</span>
              </button>
              
              {!isUser && onRegenerate && (
                <button
                  onClick={handleRegenerate}
                  className="chat-action-button"
                  title="Regenerate response"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
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