'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmojiPicker } from './emoji-picker'
import { toast } from 'sonner'

interface CreateSpaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateSpace: (name: string, emoji: string) => Promise<void>
}

export function CreateSpaceDialog({ 
  open, 
  onOpenChange, 
  onCreateSpace 
}: CreateSpaceDialogProps) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('📁')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!name.trim()) {
      setError('Space name is required')
      return
    }
    
    if (name.length > 50) {
      setError('Space name must be less than 50 characters')
      return
    }

    setLoading(true)
    setError('')

    try {
      await onCreateSpace(name.trim(), emoji)
      setName('')
      setEmoji('📁')
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to create space:', error)
      setError('Failed to create space. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset form when closing
      setName('')
      setEmoji('📁')
      setError('')
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Space</DialogTitle>
            <DialogDescription>
              Create a new space to organize your notes and chats.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="emoji" className="text-right">
                Icon
              </Label>
              <div className="col-span-3">
                <EmojiPicker value={emoji} onChange={setEmoji} />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <div className="col-span-3">
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setError('')
                  }}
                  placeholder="e.g. Personal, Work, Projects"
                  className={error ? 'border-destructive' : ''}
                  disabled={loading}
                  autoFocus
                />
                {error && (
                  <p className="text-sm text-destructive mt-1">{error}</p>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} variant="default">
              {loading ? 'Creating...' : 'Create Space'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 