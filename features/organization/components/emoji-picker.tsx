'use client'

import React from 'react'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

interface EmojiPickerProps {
  value?: string
  onChange: (emoji: string) => void
  children?: React.ReactNode
}

export function EmojiPicker({ value = '📁', onChange, children }: EmojiPickerProps) {
  const [open, setOpen] = React.useState(false)

  const handleEmojiSelect = (emoji: any) => {
    onChange(emoji.native)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="h-10 w-10 p-0 text-lg">
            {value}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Picker 
          data={data} 
          onEmojiSelect={handleEmojiSelect}
          theme="auto"
          previewPosition="none"
          skinTonePosition="none"
          maxFrequentRows={1}
          perLine={8}
        />
      </PopoverContent>
    </Popover>
  )
} 