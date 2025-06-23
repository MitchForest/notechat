'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { Space } from '@/lib/db/schema'

interface MoveToSpaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemType: 'collection' | 'note' | 'chat'
  itemName: string
  currentSpaceId: string
  spaces: Space[]
  onMove: (targetSpaceId: string) => void
}

export function MoveToSpaceDialog({
  open,
  onOpenChange,
  itemType,
  itemName,
  currentSpaceId,
  spaces,
  onMove,
}: MoveToSpaceDialogProps) {
  const [selectedSpaceId, setSelectedSpaceId] = React.useState(currentSpaceId)
  
  const handleMove = () => {
    if (selectedSpaceId && selectedSpaceId !== currentSpaceId) {
      onMove(selectedSpaceId)
      onOpenChange(false)
    }
  }
  
  // Filter out system spaces and current space
  const availableSpaces = spaces.filter(
    space => space.type !== 'system' && space.id !== currentSpaceId
  )
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Move {itemName}</DialogTitle>
          <DialogDescription>
            Select a space to move this {itemType} to
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <RadioGroup value={selectedSpaceId} onValueChange={setSelectedSpaceId}>
            {availableSpaces.map((space) => (
              <div key={space.id} className="flex items-center space-x-2 py-2">
                <RadioGroupItem value={space.id} id={space.id} />
                <Label 
                  htmlFor={space.id} 
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <span className="text-lg">{space.emoji}</span>
                  <span>{space.name}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
          
          {availableSpaces.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No other spaces available. Create a new space first.
            </p>
          )}
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleMove}
            disabled={selectedSpaceId === currentSpaceId || availableSpaces.length === 0}
          >
            Move {itemType}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 