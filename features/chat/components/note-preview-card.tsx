/**
 * Component: NotePreviewCard
 * Purpose: Inline preview card for creating notes from selected text
 * Features:
 * - Editable title with auto-generation
 * - Content preview with formatting
 * - Collection selection
 * - Smooth animations
 * - Auto-focus on title
 * 
 * Created: December 2024
 */

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { FileText, X, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCollectionStore } from '@/features/organization/stores'

interface NotePreviewCardProps {
  initialContent: string
  onSave: (title: string, content: string, collectionId: string | null) => Promise<void>
  onCancel: () => void
  isOpen: boolean
}

export function NotePreviewCard({
  initialContent,
  onSave,
  onCancel,
  isOpen,
}: NotePreviewCardProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState(initialContent)
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)
  
  const { collections } = useCollectionStore()

  // Auto-generate title from content
  useEffect(() => {
    if (!title && initialContent) {
      // Generate title from first line or first few words
      const lines = initialContent.split('\n')
      const firstLine = lines[0] || ''
      
      if (firstLine.length > 50) {
        // Truncate and find last complete word
        const truncated = firstLine.substring(0, 50)
        const lastSpace = truncated.lastIndexOf(' ')
        setTitle(lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...')
      } else {
        setTitle(firstLine || 'New Note')
      }
    }
  }, [initialContent, title])

  // Auto-focus title input when opened
  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      setTimeout(() => {
        titleInputRef.current?.focus()
        titleInputRef.current?.select()
      }, 100)
    }
  }, [isOpen])

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return
    
    setIsSaving(true)
    try {
      await onSave(
        title.trim(),
        content.trim(),
        selectedCollectionId || null
      )
    } catch (error) {
      console.error('Failed to save note:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSave()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="w-full max-w-2xl shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">Create Note from Selection</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onCancel}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    ref={titleInputRef}
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Note title..."
                    className="text-lg"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="collection">Collection (optional)</Label>
                  <Select value={selectedCollectionId} onValueChange={setSelectedCollectionId}>
                    <SelectTrigger id="collection">
                      <SelectValue placeholder="Select a collection" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No collection</SelectItem>
                      {collections.map((collection) => (
                        <SelectItem key={collection.id} value={collection.id}>
                          {collection.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Note content..."
                    className="min-h-[200px] font-mono text-sm"
                  />
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!title.trim() || !content.trim() || isSaving}
                  className="min-w-[140px]"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Create & Open
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 