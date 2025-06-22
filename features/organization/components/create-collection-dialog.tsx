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
import { toast } from 'sonner'

interface CreateCollectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  spaceName: string
  onCreateCollection: (name: string) => Promise<void>
}

export function CreateCollectionDialog({ 
  open, 
  onOpenChange, 
  spaceName,
  onCreateCollection 
}: CreateCollectionDialogProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!name.trim()) {
      setError('Collection name is required')
      return
    }
    
    if (name.length > 50) {
      setError('Collection name must be less than 50 characters')
      return
    }

    // Check for reserved names
    const reservedNames = ['All', 'Recent', 'Saved', 'Uncategorized']
    if (reservedNames.includes(name.trim())) {
      setError('This name is reserved for system collections')
      return
    }

    setLoading(true)
    setError('')

    try {
      await onCreateCollection(name.trim())
      toast.success(`Created collection "${name}"`)
      
      // Reset form
      setName('')
      onOpenChange(false)
    } catch (error) {
      setError('Failed to create collection. Please try again.')
      toast.error('Failed to create collection')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset form when closing
      setName('')
      setError('')
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Collection</DialogTitle>
            <DialogDescription>
              Create a new collection in {spaceName} to organize your items.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
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
                  placeholder="e.g. Ideas, Archive, Important"
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
              {loading ? 'Creating...' : 'Create Collection'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 