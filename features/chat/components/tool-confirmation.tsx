'use client'

import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { FileText, AlertCircle, CheckCircle2 } from 'lucide-react'
import { NoteToolResult } from '../tools/note-tools'
import { cn } from '@/lib/utils'

interface ToolConfirmationProps {
  tool: string
  result: NoteToolResult
  onConfirm: () => void
  onReject: () => void
}

export function ToolConfirmation({ tool, result, onConfirm, onReject }: ToolConfirmationProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleConfirm = async () => {
    setIsProcessing(true)
    try {
      await onConfirm()
    } finally {
      setIsProcessing(false)
    }
  }

  if (result.confirmationType === 'preview' && result.action === 'create_note') {
    const { title, content, collectionId } = result.args || {}
    
    return (
      <Card className="my-4 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Create New Note</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Title</Label>
            <div className="font-medium">{title || 'Untitled Note'}</div>
          </div>
          
          <div>
            <Label className="text-xs text-muted-foreground">Content Preview</Label>
            <ScrollArea className="h-32 w-full rounded-md border bg-muted/30 p-3">
              <div 
                className="text-sm prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: content || '' }}
              />
            </ScrollArea>
          </div>
          
          {collectionId && (
            <div>
              <Label className="text-xs text-muted-foreground">Collection</Label>
              <Badge variant="secondary">{collectionId}</Badge>
            </div>
          )}
        </CardContent>
        <CardFooter className="gap-2 pt-3">
          <Button 
            size="sm" 
            onClick={handleConfirm}
            disabled={isProcessing}
            className="gap-2"
          >
            <CheckCircle2 className="w-3 h-3" />
            Create Note
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onReject}
            disabled={isProcessing}
          >
            Cancel
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (result.confirmationType === 'diff' && result.action === 'update_note') {
    const { noteId, updates } = result.args || {}
    const current = result.current || {}
    
    return (
      <Card className="my-4 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Update Note</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {updates?.title && updates.title !== current.title && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Title Change</Label>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">From:</span>
                  <span className="text-sm line-through opacity-60">{current.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">To:</span>
                  <span className="text-sm font-medium">{updates.title}</span>
                </div>
              </div>
            </div>
          )}
          
          {updates?.content && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Content Changes</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Current</div>
                  <ScrollArea className="h-32 w-full rounded-md border bg-muted/30 p-2">
                    <div 
                      className="text-xs prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: current.content || 'Empty' }}
                    />
                  </ScrollArea>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Updated</div>
                  <ScrollArea className="h-32 w-full rounded-md border bg-primary/10 p-2">
                    <div 
                      className="text-xs prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: updates.content || '' }}
                    />
                  </ScrollArea>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="gap-2 pt-3">
          <Button 
            size="sm" 
            onClick={handleConfirm}
            disabled={isProcessing}
            className="gap-2"
          >
            <CheckCircle2 className="w-3 h-3" />
            Update Note
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onReject}
            disabled={isProcessing}
          >
            Cancel
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // Fallback for unknown confirmation types
  return (
    <Card className="my-4 border-warning">
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">
          Unknown confirmation type for tool: {tool}
        </p>
      </CardContent>
      <CardFooter>
        <Button size="sm" variant="outline" onClick={onReject}>
          Dismiss
        </Button>
      </CardFooter>
    </Card>
  )
} 