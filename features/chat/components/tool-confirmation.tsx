/**
 * Component: ToolConfirmation
 * Purpose: Display AI tool calls and allow user confirmation
 * Features:
 * - Show tool intent clearly
 * - Display parameters in readable format
 * - Allow/Deny actions
 * - Loading states
 * 
 * Created: December 2024
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Edit, 
  Search, 
  Loader2, 
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ToolCall {
  toolName: string
  args: Record<string, any>
}

interface ToolConfirmationProps {
  tool: ToolCall
  onConfirm: () => void
  onDeny: () => void
  isExecuting?: boolean
  result?: {
    success: boolean
    message?: string
    data?: any
  }
}

const toolIcons = {
  create_note: FileText,
  update_note: Edit,
  edit_selection: Edit,
  search_notes: Search,
}

const toolTitles = {
  create_note: 'Create New Note',
  update_note: 'Update Note',
  edit_selection: 'Edit Selection',
  search_notes: 'Search Notes',
}

export function ToolConfirmation({
  tool,
  onConfirm,
  onDeny,
  isExecuting = false,
  result,
}: ToolConfirmationProps) {
  const [showDetails, setShowDetails] = useState(false)
  
  const Icon = toolIcons[tool.toolName as keyof typeof toolIcons] || AlertCircle
  const title = toolTitles[tool.toolName as keyof typeof toolTitles] || tool.toolName

  // Format the arguments for display
  const formatArgs = (args: Record<string, any>) => {
    const formatted: React.ReactElement[] = []
    
    if (tool.toolName === 'create_note') {
      formatted.push(
        <div key="title" className="space-y-1">
          <span className="text-sm text-muted-foreground">Title:</span>
          <p className="font-medium">{args.title}</p>
        </div>
      )
      if (args.collection_id) {
        formatted.push(
          <div key="collection" className="space-y-1">
            <span className="text-sm text-muted-foreground">Collection:</span>
            <Badge variant="secondary">{args.collection_id}</Badge>
          </div>
        )
      }
      if (args.content) {
        formatted.push(
          <div key="content" className="space-y-1">
            <span className="text-sm text-muted-foreground">Preview:</span>
            <div className="bg-muted rounded-md p-3 max-h-32 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {args.content.slice(0, 200)}
                {args.content.length > 200 && '...'}
              </pre>
            </div>
          </div>
        )
      }
    } else if (tool.toolName === 'edit_selection') {
      formatted.push(
        <div key="original" className="space-y-1">
          <span className="text-sm text-muted-foreground">Original text:</span>
          <div className="bg-muted rounded-md p-3 max-h-24 overflow-y-auto">
            <pre className="text-sm whitespace-pre-wrap line-through opacity-70">
              {args.original_text}
            </pre>
          </div>
        </div>
      )
      formatted.push(
        <div key="new" className="space-y-1">
          <span className="text-sm text-muted-foreground">Will replace with:</span>
          <div className="bg-primary/10 rounded-md p-3 max-h-24 overflow-y-auto">
            <pre className="text-sm whitespace-pre-wrap">
              {args.new_text}
            </pre>
          </div>
        </div>
      )
    } else if (tool.toolName === 'search_notes') {
      formatted.push(
        <div key="query" className="space-y-1">
          <span className="text-sm text-muted-foreground">Search for:</span>
          <p className="font-medium">"{args.query}"</p>
        </div>
      )
      if (args.limit) {
        formatted.push(
          <div key="limit" className="space-y-1">
            <span className="text-sm text-muted-foreground">Max results:</span>
            <p>{args.limit}</p>
          </div>
        )
      }
    } else {
      // Generic display for other tools
      Object.entries(args).forEach(([key, value]) => {
        formatted.push(
          <div key={key} className="space-y-1">
            <span className="text-sm text-muted-foreground">{key}:</span>
            <p className="font-medium">{JSON.stringify(value, null, 2)}</p>
          </div>
        )
      })
    }
    
    return formatted
  }

  if (result) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="my-2"
      >
        <Card className={cn(
          "border",
          result.success ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20" : "border-destructive/50 bg-destructive/10"
        )}>
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="w-5 h-5 text-destructive" />
              )}
              <span className="text-sm font-medium">
                {result.message || (result.success ? 'Action completed successfully' : 'Action failed')}
              </span>
            </div>
            
            {/* Display search results if available */}
            {result.data && tool.toolName === 'search_notes' && result.data.length > 0 && (
              <div className="mt-3 space-y-2">
                {result.data.map((note: any) => (
                  <div 
                    key={note.id}
                    className="p-2 rounded-md bg-background border cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      // Open note in panel
                      const event = new CustomEvent('open-note', { detail: { noteId: note.id } })
                      window.dispatchEvent(event)
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{note.title}</h4>
                        {note.excerpt && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {note.excerpt}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {new Date(note.updatedAt).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="my-4"
      >
        <Card className="border-primary/20 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-base">AI wants to {title.toLowerCase()}</h3>
                <p className="text-sm text-muted-foreground">Review and confirm this action</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            {formatArgs(tool.args)}
            
            {tool.toolName === 'create_note' && tool.args.content?.length > 200 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="w-full"
              >
                {showDetails ? 'Show less' : 'Show full content'}
              </Button>
            )}
            
            {showDetails && tool.args.content && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-muted rounded-md p-3 max-h-64 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {tool.args.content}
                  </pre>
                </div>
              </motion.div>
            )}
          </CardContent>
          
          <CardFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={onDeny}
              disabled={isExecuting}
              className="flex-1"
            >
              Deny
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isExecuting}
              className="flex-1"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Allow'
              )}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
} 