'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { EmojiPicker } from './emoji-picker'

interface ChangeEmojiDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentEmoji: string
  spaceName: string
  onChangeEmoji: (emoji: string) => void
}

export function ChangeEmojiDialog({
  open,
  onOpenChange,
  currentEmoji,
  spaceName,
  onChangeEmoji
}: ChangeEmojiDialogProps) {
  const [emoji, setEmoji] = useState(currentEmoji)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onChangeEmoji(emoji)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Change Emoji</DialogTitle>
            <DialogDescription>
              Choose a new emoji for "{spaceName}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 flex justify-center">
            <EmojiPicker value={emoji} onChange={setEmoji} />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 