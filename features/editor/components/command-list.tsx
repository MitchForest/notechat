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

  useEffect(() => setSelectedIndex(0), [props.items])

  return (
    <div className="z-50 min-w-[18rem] overflow-hidden rounded-md border bg-background p-1 shadow-md">
      {props.items.length ? (
        props.items.map((item, index) => (
          <button
            className={`flex w-full items-center space-x-2 rounded-sm px-2 py-1.5 text-sm text-left hover:bg-accent ${
              index === selectedIndex ? 'bg-accent' : ''
            }`}
            key={index}
            onClick={() => selectItem(index)}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-background">
              <item.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
          </button>
        ))
      ) : (
        <div className="text-center text-sm text-muted-foreground">No results</div>
      )}
    </div>
  )
})

CommandList.displayName = 'CommandList' 