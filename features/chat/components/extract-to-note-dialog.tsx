'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, FileText, Edit, Eye, X } from 'lucide-react'
import { useExtractToNote, ExtractOptions, ExtractedNote } from '../hooks/use-extract-to-note'
import { useContentStore, useCollectionStore, useSpaceStore } from '@/features/organization/stores'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ExtractToNoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  extractOptions: ExtractOptions
}

export function ExtractToNoteDialog({ 
  open, 
  onOpenChange, 
  extractOptions 
}: ExtractToNoteDialogProps) {
  const router = useRouter()
  const { extract, isExtracting, error } = useExtractToNote()
  const { collections } = useCollectionStore()
  const { createNote } = useContentStore()
  const [extracted, setExtracted] = useState<ExtractedNote | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('')
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    if (open && !extracted && !isExtracting) {
      handleExtract()
    }
  }, [open])

  useEffect(() => {
    // Reset state when dialog closes
    if (!open) {
      setExtracted(null)
      setIsEditing(false)
      setSelectedCollectionId('')
      setTags([])
      setNewTag('')
    }
  }, [open])

  const handleExtract = async () => {
    try {
      const result = await extract(extractOptions)
      setExtracted(result)
      setTags(result.tags)
      if (result.suggestedCollection) {
        setSelectedCollectionId(result.suggestedCollection)
      }
    } catch (err) {
      // Error is already set in the hook
      console.error('Extract failed:', err)
    }
  }

  const handleSave = async () => {
    if (!extracted) return

    setIsSaving(true)
    try {
      const noteId = `note-${Date.now()}`
      const { activeSpaceId } = useSpaceStore.getState()
      
      // Don't use permanent space IDs - they're virtual
      const spaceId = activeSpaceId?.startsWith('permanent-') ? null : activeSpaceId
      
      const createdNote = await createNote(
        extracted.title,
        spaceId,
        selectedCollectionId || null,
        noteId
      )

      if (createdNote) {
        // Save content
        const response = await fetch(`/api/notes/${noteId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: extracted.content,
            // tags: tags, // TODO: Add tags support to schema
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to save note content')
        }

        toast.success('Note created successfully')
        onOpenChange(false)
        
        // Navigate to the new note
        router.push(`/?note=${noteId}`)
      }
    } catch (err) {
      console.error('Save failed:', err)
      toast.error('Failed to create note')
    } finally {
      setIsSaving(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Extract to Note
          </DialogTitle>
        </DialogHeader>

        {isExtracting ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Analyzing content...</span>
          </div>
        ) : extracted ? (
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={extracted.title}
                onChange={(e) => setExtracted({ ...extracted, title: e.target.value })}
                placeholder="Note title"
              />
            </div>

            {/* Collection */}
            <div className="space-y-2">
              <Label htmlFor="collection">Collection</Label>
              <Select value={selectedCollectionId} onValueChange={setSelectedCollectionId}>
                <SelectTrigger id="collection">
                  <SelectValue placeholder="Select a collection (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Uncategorized</SelectItem>
                  {collections.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-destructive"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>
            </div>

            {/* Content Type Badge */}
            <div className="flex items-center gap-2">
              <Label>Content Type</Label>
              <Badge variant="outline">
                {extracted.contentType === 'qa' ? 'Q&A' : 
                 extracted.contentType.charAt(0).toUpperCase() + extracted.contentType.slice(1)}
              </Badge>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Content</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? (
                    <>
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </>
                  )}
                </Button>
              </div>
              
              {isEditing ? (
                <Textarea
                  value={extracted.content}
                  onChange={(e) => setExtracted({ ...extracted, content: e.target.value })}
                  className="min-h-[300px] font-mono text-sm"
                />
              ) : (
                <div 
                  className="min-h-[300px] max-h-[400px] overflow-y-auto border rounded-md p-4 prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: extracted.content }}
                />
              )}
            </div>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={handleExtract}>Try Again</Button>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!extracted || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Note'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 