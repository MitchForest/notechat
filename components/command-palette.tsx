/**
 * Component: CommandPalette
 * Purpose: Quick action and navigation interface (Cmd+K)
 * Features:
 * - Keyboard shortcut activation (Cmd+K)
 * - Action commands (New Note, New Chat, etc.)
 * - Search functionality
 * - Glass morphism design
 * 
 * Modified: 2024-12-19 - Initial implementation
 */
"use client"

import { useEffect, useState } from "react"
import { FileText, MessageSquare, FolderPlus, Hash, Star, Clock, Settings } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

export function CommandPalette() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleSelect = (callback: () => void) => {
    setOpen(false)
    callback()
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search or type a command..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => handleSelect(() => console.log("New Note"))}>
            <FileText className="mr-2 h-4 w-4" />
            <span>New Note</span>
            <span className="ml-auto text-xs text-muted-foreground">Ctrl+N</span>
          </CommandItem>
          
          <CommandItem onSelect={() => handleSelect(() => console.log("New Chat"))}>
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>New Chat</span>
            <span className="ml-auto text-xs text-muted-foreground">Ctrl+Shift+C</span>
          </CommandItem>
          
          <CommandItem onSelect={() => handleSelect(() => console.log("New Collection"))}>
            <Hash className="mr-2 h-4 w-4" />
            <span>New Collection</span>
          </CommandItem>
          
          <CommandItem onSelect={() => handleSelect(() => console.log("New Space"))}>
            <FolderPlus className="mr-2 h-4 w-4" />
            <span>New Space</span>
          </CommandItem>
        </CommandGroup>
        
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => handleSelect(() => console.log("All Notes"))}>
            <span className="mr-2">🌐</span>
            <span>All Notes</span>
          </CommandItem>
          
          <CommandItem onSelect={() => handleSelect(() => console.log("Recent"))}>
            <Clock className="mr-2 h-4 w-4" />
            <span>Recent</span>
          </CommandItem>
          
          <CommandItem onSelect={() => handleSelect(() => console.log("Favorites"))}>
            <Star className="mr-2 h-4 w-4" />
            <span>Favorites</span>
          </CommandItem>
          
          <CommandItem onSelect={() => handleSelect(() => console.log("Work"))}>
            <span className="mr-2">💼</span>
            <span>Work</span>
          </CommandItem>
          
          <CommandItem onSelect={() => handleSelect(() => console.log("School"))}>
            <span className="mr-2">🎓</span>
            <span>School</span>
          </CommandItem>
          
          <CommandItem onSelect={() => handleSelect(() => console.log("Personal"))}>
            <span className="mr-2">🏠</span>
            <span>Personal</span>
          </CommandItem>
        </CommandGroup>
        
        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => handleSelect(() => console.log("Settings"))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
            <span className="ml-auto text-xs text-muted-foreground">Ctrl+,</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
} 