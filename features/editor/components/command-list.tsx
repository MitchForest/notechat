import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { CommandItem } from '../extensions/slash-command'

export interface CommandListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

interface CommandListProps {
  items: CommandItem[]
  command: (item: CommandItem) => void
}

export const CommandList = forwardRef<CommandListRef, CommandListProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = (index: number) => {
    const item = props.items[index]
    if (item) {
      props.command(item)
    }
  }

  useEffect(() => setSelectedIndex(0), [props.items])

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length)
        return true
      }

      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % props.items.length)
        return true
      }

      if (event.key === 'Enter') {
        selectItem(selectedIndex)
        return true
      }

      return false
    },
  }))

  return (
    <div className="z-50 max-h-80 min-w-[18rem] overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
      {props.items.length ? (
        props.items.map((item, index) => (
          <button
            className={`flex w-full items-center gap-3 rounded-sm px-2 py-1.5 text-left text-sm outline-none transition-colors
              ${index === selectedIndex ? 'bg-muted text-popover-foreground' : 'hover:bg-muted/50'}
            `}
            key={index}
            onClick={() => selectItem(index)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-background">
              <item.icon className="h-5 w-5" />
            </div>
            <div className="flex-grow">
              <p className="font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
          </button>
        ))
      ) : (
        <div className="p-2 text-center text-sm text-muted-foreground">No results found.</div>
      )}
    </div>
  )
})

CommandList.displayName = 'CommandList' 