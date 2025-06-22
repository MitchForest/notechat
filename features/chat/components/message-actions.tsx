/**
 * Component: MessageActions
 * Purpose: Advanced actions for chat messages
 * Features:
 * - Copy in different formats
 * - Create note from message
 * - Continue conversation from point
 * - Branch conversation
 * 
 * Created: December 2024
 */

'use client'

import { useState } from 'react'
import { Message } from 'ai'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  MoreHorizontal,
  Copy,
  FileText,
  GitBranch,
  MessageSquare,
  Code,
  Trash2,
  Edit,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface MessageActionsProps {
  message: Message
  onExtractToNote: () => void
  onBranch?: () => void
  onContinueFrom?: () => void
  onEdit?: () => void
  onDelete?: () => void
  className?: string
}

export function MessageActions({
  message,
  onExtractToNote,
  onBranch,
  onContinueFrom,
  onEdit,
  onDelete,
  className
}: MessageActionsProps) {
  const [isOpen, setIsOpen] = useState(false)

  const copyAsMarkdown = () => {
    const markdown = `**${message.role === 'user' ? 'User' : 'Assistant'}**: ${message.content}`
    navigator.clipboard.writeText(markdown)
    toast.success('Copied as Markdown')
    setIsOpen(false)
  }

  const copyAsPlainText = () => {
    navigator.clipboard.writeText(message.content)
    toast.success('Copied as plain text')
    setIsOpen(false)
  }

  const copyAsCode = () => {
    const codeBlocks = message.content.match(/```[\s\S]*?```/g) || []
    const code = codeBlocks.map(block => 
      block.replace(/```\w*\n?/, '').replace(/```$/, '')
    ).join('\n\n')
    
    if (code) {
      navigator.clipboard.writeText(code)
      toast.success('Copied code blocks')
    } else {
      toast.error('No code blocks found')
    }
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn(
            "h-7 w-7 opacity-0 group-hover:opacity-100 transition-all duration-200",
            "hover:scale-110 active:scale-95",
            className
          )}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 animate-in fade-in-0 zoom-in-95 duration-200"
      >
        <DropdownMenuItem 
          onClick={copyAsPlainText}
          className="cursor-pointer"
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy text
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={copyAsMarkdown}
          className="cursor-pointer"
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy as Markdown
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={copyAsCode}
          className="cursor-pointer"
        >
          <Code className="mr-2 h-4 w-4" />
          Copy code blocks
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => {
            onExtractToNote()
            setIsOpen(false)
          }}
          className="cursor-pointer"
        >
          <FileText className="mr-2 h-4 w-4" />
          Create note
        </DropdownMenuItem>
        
        {onContinueFrom && (
          <DropdownMenuItem 
            onClick={() => {
              onContinueFrom()
              setIsOpen(false)
            }}
            className="cursor-pointer"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Continue from here
          </DropdownMenuItem>
        )}
        
        {onBranch && (
          <DropdownMenuItem 
            onClick={() => {
              onBranch()
              setIsOpen(false)
            }}
            className="cursor-pointer"
          >
            <GitBranch className="mr-2 h-4 w-4" />
            Branch conversation
          </DropdownMenuItem>
        )}
        
        {(onEdit || onDelete) && <DropdownMenuSeparator />}
        
        {onEdit && message.role === 'user' && (
          <DropdownMenuItem 
            onClick={() => {
              onEdit()
              setIsOpen(false)
            }}
            className="cursor-pointer"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit message
          </DropdownMenuItem>
        )}
        
        {onDelete && (
          <DropdownMenuItem 
            onClick={() => {
              onDelete()
              setIsOpen(false)
            }}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete message
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 