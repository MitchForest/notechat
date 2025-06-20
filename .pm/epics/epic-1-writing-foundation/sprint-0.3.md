# Sprint Plan: Notion-like Editor Enhancement

## Overview
Transform the existing Novel editor into a Notion-like experience over 2 sprints (1 week total).

**Current State**: Basic Novel editor with spell check foundation  
**Target State**: Full Notion-like UI/UX with slash commands, block controls, and professional styling  
**Total Duration**: 2 sprints × 3 days each = 6 days

---

## Sprint 1: Core Notion UI/UX Foundation (Days 1-3)

### Day 1: Layout, Typography & Base Styling

#### 1.1 Project Setup & Dependencies
```bash
# Install required dependencies
bun add @tiptap/extension-bubble-menu @tiptap/extension-floating-menu
bun add @tiptap/extension-task-list @tiptap/extension-task-item
bun add @tiptap/extension-horizontal-rule @tiptap/suggestion
bun add react-moveable @dnd-kit/sortable @dnd-kit/core
bun add framer-motion cmdk vaul

# Install UI components from shadcn/ui
bunx shadcn-ui@latest add dropdown-menu
bunx shadcn-ui@latest add command
bunx shadcn-ui@latest add tooltip
bunx shadcn-ui@latest add separator
bunx shadcn-ui@latest add popover

# Font for code blocks
# Add to app/layout.tsx or _document.tsx
# <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&display=swap" rel="stylesheet">
```

#### 1.2 Create Notion-like Layout Structure
```typescript
// app/notes/[noteId]/page.tsx
export default function NotePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar - 48px height */}
      <NoteHeader />
      
      {/* Main Content Area */}
      <main className="mx-auto max-w-[900px] pb-40">
        {/* Cover Image Area (optional) */}
        <NoteCover />
        
        {/* Icon & Title Area */}
        <div className="px-24 pt-12">
          <NoteIcon />
          <NoteTitle />
        </div>
        
        {/* Editor Container */}
        <div className="relative px-24">
          <NovelEditor />
        </div>
      </main>
    </div>
  )
}
```

#### 1.3 Global Editor Styles
```css
/* app/globals.css - Add Notion-specific styles */

/* Notion-like spacing system */
:root {
  --notion-max-width: 900px;
  --notion-padding-desktop: 96px; /* 24 * 4 */
  --notion-padding-tablet: 48px;
  --notion-padding-mobile: 24px;
}

/* Editor specific styles */
.notion-editor {
  /* Remove default Novel padding */
  padding: 0 !important;
}

/* Block hover effects */
.notion-block {
  position: relative;
  transition: background-color 0.1s ease;
}

.notion-block:hover {
  background-color: rgba(55, 53, 47, 0.03);
}

.dark .notion-block:hover {
  background-color: rgba(255, 255, 255, 0.03);
}

/* Block controls container */
.block-controls {
  position: absolute;
  left: -80px;
  top: 0;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.notion-block:hover .block-controls {
  opacity: 1;
}

/* Typography scale matching Notion */
.prose h1 {
  font-size: 40px;
  font-weight: 700;
  line-height: 1.2;
  margin-top: 2rem;
  margin-bottom: 4px;
  letter-spacing: -0.02em;
}

.prose h2 {
  font-size: 32px;
  font-weight: 600;
  line-height: 1.3;
  margin-top: 1.5rem;
  margin-bottom: 4px;
  letter-spacing: -0.01em;
}

.prose h3 {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.3;
  margin-top: 1rem;
  margin-bottom: 4px;
}

.prose p {
  font-size: 16px;
  line-height: 1.8;
  margin-bottom: 4px;
  color: rgba(55, 53, 47, 0.9);
}

.dark .prose p {
  color: rgba(255, 255, 255, 0.9);
}

/* List styles */
.prose ul, .prose ol {
  margin: 4px 0;
  padding-left: 24px;
}

.prose li {
  margin: 2px 0;
  line-height: 1.8;
}

/* Task list Notion style */
.prose .task-list {
  list-style: none;
  padding-left: 0;
}

.prose .task-list-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 2px 0;
}

.prose .task-list-item input[type="checkbox"] {
  margin-top: 5px;
  width: 16px;
  height: 16px;
  cursor: pointer;
  border: 2px solid rgba(55, 53, 47, 0.3);
  border-radius: 3px;
  transition: all 0.2s ease;
}

.prose .task-list-item input[type="checkbox"]:checked {
  background-color: rgb(46, 170, 220);
  border-color: rgb(46, 170, 220);
}

/* Code blocks */
.prose pre {
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
  padding: 16px;
  border-radius: 4px;
  background: rgba(247, 246, 243, 1);
  overflow-x: auto;
  margin: 8px 0;
}

.dark .prose pre {
  background: rgba(47, 45, 42, 1);
}

/* Inline code */
.prose code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875em;
  background: rgba(135, 131, 120, 0.15);
  border-radius: 3px;
  padding: 2px 4px;
  color: #EB5757;
}

/* Blockquote */
.prose blockquote {
  border-left: 3px solid currentColor;
  padding-left: 14px;
  margin: 8px 0;
  color: rgba(55, 53, 47, 0.6);
}

/* Selection color */
.prose ::selection {
  background-color: rgba(46, 170, 220, 0.2);
}

/* Placeholder text */
.is-empty::before {
  color: rgba(55, 53, 47, 0.3);
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

.dark .is-empty::before {
  color: rgba(255, 255, 255, 0.3);
}
```

#### 1.4 Enhanced Novel Editor Component
```typescript
// features/editor/components/novel-editor-enhanced.tsx
"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import { SpellCheckExtension } from "../extensions/spellcheck"

export function NovelEditor({ content, onChange }: NovelEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Configure each node type with proper classes
        paragraph: {
          HTMLAttributes: {
            class: 'notion-block notion-paragraph',
          },
        },
        heading: {
          levels: [1, 2, 3],
          HTMLAttributes: {
            class: 'notion-block notion-heading',
          },
        },
        bulletList: {
          HTMLAttributes: {
            class: 'notion-list',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'notion-list',
          },
        },
        listItem: {
          HTMLAttributes: {
            class: 'notion-list-item',
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: 'notion-block notion-quote',
          },
        },
        codeBlock: {
          HTMLAttributes: {
            class: 'notion-block notion-code-block',
            spellcheck: 'false',
          },
        },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            const level = node.attrs.level
            return `Heading ${level}`
          }
          if (editor?.isEmpty) {
            return "Type '/' for commands"
          }
          return "Type '/' for commands, or just start writing..."
        },
        showOnlyWhenEditable: true,
        includeChildren: true,
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'task-list',
        },
      }),
      TaskItem.configure({
        HTMLAttributes: {
          class: 'task-list-item',
        },
        nested: true,
      }),
      SpellCheckExtension,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'notion-editor prose prose-neutral dark:prose-invert max-w-none focus:outline-none min-h-[calc(100vh-200px)]',
      },
    },
  })

  return (
    <div className="relative">
      <EditorContent editor={editor} />
    </div>
  )
}
```

### Day 2: Block Controls & Interactions

#### 2.1 Block Menu Component (Plus Button)
```typescript
// features/editor/components/block-menu.tsx
"use client"

import { Editor } from "@tiptap/core"
import { useState, useEffect, useRef } from "react"
import { Plus, GripVertical, Type, Heading1, Heading2, Heading3, List, ListOrdered, CheckSquare, Quote, Code, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface BlockMenuProps {
  editor: Editor
}

export function BlockMenu({ editor }: BlockMenuProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: -50 })
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updatePosition = () => {
      const { selection } = editor.state
      const { $anchor } = selection
      
      // Get the DOM node for current position
      const node = editor.view.nodeDOM($anchor.pos) as HTMLElement
      if (!node) return

      // Only show for empty paragraphs or at the start of blocks
      const isEmpty = node.textContent?.trim() === ''
      const isAtStart = selection.$anchor.parentOffset === 0
      
      setShowMenu(isEmpty || isAtStart)

      if (isEmpty || isAtStart) {
        const rect = node.getBoundingClientRect()
        const editorRect = editor.view.dom.getBoundingClientRect()
        
        setPosition({
          top: rect.top - editorRect.top,
          left: -50,
        })
      }
    }

    editor.on('selectionUpdate', updatePosition)
    editor.on('update', updatePosition)

    return () => {
      editor.off('selectionUpdate', updatePosition)
      editor.off('update', updatePosition)
    }
  }, [editor])

  const insertBlock = (command: () => void) => {
    command()
    editor.chain().focus().run()
  }

  const blockTypes = [
    {
      title: 'Text',
      icon: Type,
      command: () => editor.chain().setParagraph().run(),
    },
    {
      title: 'Heading 1',
      icon: Heading1,
      command: () => editor.chain().setHeading({ level: 1 }).run(),
    },
    {
      title: 'Heading 2',
      icon: Heading2,
      command: () => editor.chain().setHeading({ level: 2 }).run(),
    },
    {
      title: 'Heading 3',
      icon: Heading3,
      command: () => editor.chain().setHeading({ level: 3 }).run(),
    },
    {
      title: 'Bullet List',
      icon: List,
      command: () => editor.chain().toggleBulletList().run(),
    },
    {
      title: 'Numbered List',
      icon: ListOrdered,
      command: () => editor.chain().toggleOrderedList().run(),
    },
    {
      title: 'To-do List',
      icon: CheckSquare,
      command: () => editor.chain().toggleTaskList().run(),
    },
    {
      title: 'Quote',
      icon: Quote,
      command: () => editor.chain().toggleBlockquote().run(),
    },
    {
      title: 'Code',
      icon: Code,
      command: () => editor.chain().toggleCodeBlock().run(),
    },
    {
      title: 'Divider',
      icon: Minus,
      command: () => editor.chain().setHorizontalRule().run(),
    },
  ]

  if (!showMenu) return null

  return (
    <div
      ref={menuRef}
      className="absolute flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity duration-200"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-accent"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <div className="p-2">
            <p className="text-xs text-muted-foreground mb-2">BASIC BLOCKS</p>
          </div>
          {blockTypes.map((block, index) => (
            <DropdownMenuItem
              key={block.title}
              onClick={() => insertBlock(block.command)}
              className="flex items-center gap-3 p-2"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded border bg-background">
                <block.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">{block.title}</div>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 hover:bg-accent cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => {
          // Implement drag functionality in Day 3
          e.preventDefault()
        }}
      >
        <GripVertical className="h-4 w-4" />
      </Button>
    </div>
  )
}
```

#### 2.2 Inline Toolbar (Bubble Menu)
```typescript
// features/editor/components/inline-toolbar.tsx
"use client"

import { BubbleMenu, Editor } from "@tiptap/react"
import { Bold, Italic, Strikethrough, Code, Link2, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface InlineToolbarProps {
  editor: Editor
}

export function InlineToolbar({ editor }: InlineToolbarProps) {
  const setLink = () => {
    const url = window.prompt('Enter URL:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{
        duration: 200,
        animation: 'shift-toward-subtle',
        moveTransition: 'transform 0.2s ease',
      }}
      className="flex items-center gap-0.5 rounded-lg border bg-background p-1 shadow-lg"
    >
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => editor.chain().focus().toggleBold().run()}
              data-active={editor.isActive('bold')}
            >
              <Bold className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs">Bold</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              data-active={editor.isActive('italic')}
            >
              <Italic className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs">Italic</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              data-active={editor.isActive('strike')}
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs">Strikethrough</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => editor.chain().focus().toggleCode().run()}
              data-active={editor.isActive('code')}
            >
              <Code className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs">Code</p>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={setLink}
              data-active={editor.isActive('link')}
            >
              <Link2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs">Link</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => {
                // Add comment functionality
                console.log('Add comment')
              }}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs">Comment</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </BubbleMenu>
  )
}

// CSS for active states
// Add to globals.css
/*
button[data-active="true"] {
  background-color: rgba(0, 0, 0, 0.05);
}

.dark button[data-active="true"] {
  background-color: rgba(255, 255, 255, 0.1);
}
*/
```

#### 2.3 Update Main Editor Component
```typescript
// features/editor/components/novel-editor-enhanced.tsx (updated)
import { BlockMenu } from "./block-menu"
import { InlineToolbar } from "./inline-toolbar"

export function NovelEditor({ content, onChange }: NovelEditorProps) {
  const editor = useEditor({
    // ... previous configuration
  })

  if (!editor) return null

  return (
    <div className="relative">
      <BlockMenu editor={editor} />
      <InlineToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
```

### Day 3: Slash Commands Implementation

#### 3.1 Slash Command Extension
```typescript
// features/editor/extensions/slash-command.ts
import { Extension } from "@tiptap/core"
import Suggestion from "@tiptap/suggestion"

export const SlashCommand = Extension.create({
  name: "slashCommand",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        startOfLine: false,
        command: ({ editor, range, props }) => {
          props.command({ editor, range })
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})
```

#### 3.2 Slash Command Menu Component
```typescript
// features/editor/components/slash-command-menu.tsx
"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { Editor, Range } from "@tiptap/core"
import { 
  Type, Heading1, Heading2, Heading3, List, ListOrdered, 
  CheckSquare, Quote, Code, Minus, Image, Table, 
  ToggleLeft, FileText, Sparkles, Hash
} from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

export interface SlashCommandItem {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  command: (props: { editor: Editor; range: Range }) => void
  aliases?: string[]
}

const commands: SlashCommandItem[] = [
  {
    title: "Text",
    description: "Just start writing with plain text.",
    icon: Type,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setParagraph().run()
    },
    aliases: ["p", "paragraph"],
  },
  {
    title: "Heading 1",
    description: "Big section heading.",
    icon: Heading1,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run()
    },
    aliases: ["h1", "heading1", "title"],
  },
  {
    title: "Heading 2",
    description: "Medium section heading.",
    icon: Heading2,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run()
    },
    aliases: ["h2", "heading2", "subtitle"],
  },
  {
    title: "Heading 3",
    description: "Small section heading.",
    icon: Heading3,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run()
    },
    aliases: ["h3", "heading3", "subheading"],
  },
  {
    title: "Bullet List",
    description: "Create a simple bullet list.",
    icon: List,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run()
    },
    aliases: ["ul", "bullet", "unordered"],
  },
  {
    title: "Numbered List",
    description: "Create a list with numbering.",
    icon: ListOrdered,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run()
    },
    aliases: ["ol", "ordered", "numbered"],
  },
  {
    title: "To-do List",
    description: "Track tasks with a to-do list.",
    icon: CheckSquare,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run()
    },
    aliases: ["todo", "task", "checkbox", "[]"],
  },
  {
    title: "Quote",
    description: "Add a quote or citation.",
    icon: Quote,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run()
    },
    aliases: ["blockquote", "cite", ">"],
  },
  {
    title: "Code",
    description: "Add a code block with syntax highlighting.",
    icon: Code,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
    },
    aliases: ["codeblock", "```"],
  },
  {
    title: "Divider",
    description: "Visually divide blocks.",
    icon: Minus,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run()
    },
    aliases: ["hr", "horizontal", "line", "---"],
  },
  {
    title: "Ask AI",
    description: "Let AI help you write.",
    icon: Sparkles,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertContent("// ").run()
    },
    aliases: ["ai", "gpt", "write", "//"],
  },
]

interface SlashCommandMenuProps {
  editor: Editor
  range: Range
  props: any
}

export function SlashCommandMenu({ editor, range, props }: SlashCommandMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [search, setSearch] = useState("")
  
  const filteredCommands = commands.filter((command) => {
    const searchLower = search.toLowerCase()
    return (
      command.title.toLowerCase().includes(searchLower) ||
      command.description.toLowerCase().includes(searchLower) ||
      command.aliases?.some((alias) => alias.toLowerCase().includes(searchLower))
    )
  })

  const selectItem = useCallback(
    (index: number) => {
      const command = filteredCommands[index]
      if (command) {
        props.command({ editor, range })
        command.command({ editor, range })
      }
    },
    [filteredCommands, editor, range, props]
  )

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => 
          prev === 0 ? filteredCommands.length - 1 : prev - 1
        )
        return true
      }

      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => 
          prev === filteredCommands.length - 1 ? 0 : prev + 1
        )
        return true
      }

      if (e.key === "Enter") {
        e.preventDefault()
        selectItem(selectedIndex)
        return true
      }

      return false
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [filteredCommands, selectedIndex, selectItem])

  useLayoutEffect(() => {
    const { $from } = editor.state.selection
    const node = editor.view.nodeDOM($from.pos) as HTMLElement
    if (!node || !menuRef.current) return

    const rect = node.getBoundingClientRect()
    const menuRect = menuRef.current.getBoundingClientRect()
    
    menuRef.current.style.position = "fixed"
    menuRef.current.style.left = `${rect.left}px`
    menuRef.current.style.top = `${rect.bottom + 8}px`
    
    // Adjust if menu goes off screen
    if (rect.bottom + menuRect.height > window.innerHeight) {
      menuRef.current.style.top = `${rect.top - menuRect.height - 8}px`
    }
  })

  return (
    <div
      ref={menuRef}
      className="z-50 w-80 rounded-lg border bg-background shadow-lg animate-in fade-in-0 zoom-in-95"
    >
      <Command>
        <CommandInput
          value={search}
          onValueChange={setSearch}
          placeholder="Search for a block type..."
          className="h-10 border-b"
        />
        <CommandList className="max-h-[300px]">
          {filteredCommands.length === 0 ? (
            <CommandEmpty>No results found.</CommandEmpty>
          ) : (
            <CommandGroup>
              {filteredCommands.map((command, index) => {
                const Icon = command.icon
                return (
                  <CommandItem
                    key={command.title}
                    onSelect={() => selectItem(index)}
                    className={`flex items-center gap-3 p-3 cursor-pointer ${
                      index === selectedIndex ? "bg-accent" : ""
                    }`}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded border">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{command.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {command.description}
                      </div>
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </div>
  )
}
```

#### 3.3 Integrate Slash Commands with Editor
```typescript
// features/editor/components/novel-editor-enhanced.tsx (final Day 3 version)
import { useEditor, EditorContent, ReactRenderer } from "@tiptap/react"
import { SlashCommand } from "../extensions/slash-command"
import { SlashCommandMenu } from "./slash-command-menu"
import tippy from "tippy.js"

export function NovelEditor({ content, onChange }: NovelEditorProps) {
  const editor = useEditor({
    extensions: [
      // ... previous extensions
      SlashCommand.configure({
        suggestion: {
          items: ({ query }) => {
            // This is handled in the component
            return []
          },
          render: () => {
            let component: ReactRenderer
            let popup: any

            return {
              onStart: (props: any) => {
                component = new ReactRenderer(SlashCommandMenu, {
                  props,
                  editor: props.editor,
                })

                popup = tippy("body", {
                  getReferenceClientRect: props.clientRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: "manual",
                  placement: "bottom-start",
                })
              },

              onUpdate(props: any) {
                component.updateProps(props)

                popup[0].setProps({
                  getReferenceClientRect: props.clientRect,
                })
              },

              onKeyDown(props: any) {
                if (props.event.key === "Escape") {
                  popup[0].hide()
                  return true
                }

                return component.ref?.onKeyDown(props.event)
              },

              onExit() {
                popup[0].destroy()
                component.destroy()
              },
            }
          },
        },
      }),
    ],
    // ... rest of configuration
  })

  // ... rest of component
}
```

---

## Sprint 2: Advanced Features & Polish (Days 4-6)

### Day 4: Drag & Drop + Block Reordering

#### 4.1 Install DnD Dependencies
```bash
bun add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

#### 4.2 Draggable Block Wrapper
```typescript
// features/editor/components/draggable-block.tsx
"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import { useState } from "react"

interface DraggableBlockProps {
  id: string
  children: React.ReactNode
}

export function DraggableBlock({ id, children }: DraggableBlockProps) {
  const [isDragging, setIsDragging] = useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative"
      onMouseEnter={() => setIsDragging(false)}
    >
      <div
        className="absolute -left-12 top-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      {children}
    </div>
  )
}
```

#### 4.3 Block Management System
```typescript
// features/editor/hooks/use-blocks.ts
import { Editor } from "@tiptap/core"
import { useCallback, useEffect, useState } from "react"

interface Block {
  id: string
  type: string
  content: any
  position: number
}

export function useBlocks(editor: Editor | null) {
  const [blocks, setBlocks] = useState<Block[]>([])

  const updateBlocks = useCallback(() => {
    if (!editor) return

    const newBlocks: Block[] = []
    let position = 0

    editor.state.doc.forEach((node, offset) => {
      if (node.type.name !== "text") {
        newBlocks.push({
          id: `block-${offset}`,
          type: node.type.name,
          content: node.content,
          position: position++,
        })
      }
    })

    setBlocks(newBlocks)
  }, [editor])

  useEffect(() => {
    if (!editor) return

    updateBlocks()
    editor.on("update", updateBlocks)

    return () => {
      editor.off("update", updateBlocks)
    }
  }, [editor, updateBlocks])

  const moveBlock = useCallback((fromIndex: number, toIndex: number) => {
    if (!editor) return

    editor.chain().focus().command(({ tr, state }) => {
      // Complex logic to move blocks in ProseMirror
      // This would involve getting the node, removing it, and inserting at new position
      return true
    }).run()
  }, [editor])

  return { blocks, moveBlock }
}
```

### Day 5: AI Integration & Inline Commands

#### 5.1 AI Command Extension
```typescript
// features/editor/extensions/ai-command.ts
import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "prosemirror-state"

export const AICommand = Extension.create({
  name: "aiCommand",

  addOptions() {
    return {
      trigger: "//",
      onTrigger: () => {},
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("aiCommand"),
        props: {
          handleTextInput(view, from, to, text) {
            const { state } = view
            const $from = state.selection.$from
            const textBefore = state.doc.textBetween(
              Math.max(0, $from.pos - 2),
              $from.pos
            )

            if (textBefore + text === "//") {
              // Trigger AI command mode
              return false
            }

            return false
          },
        },
      }),
    ]
  },
})
```

#### 5.2 AI Command Interface
```typescript
// features/editor/components/ai-command-interface.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { Editor } from "@tiptap/core"
import { Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface AICommandInterfaceProps {
  editor: Editor
  position: { top: number; left: number }
  onClose: () => void
}

export function AICommandInterface({ 
  editor, 
  position, 
  onClose 
}: AICommandInterfaceProps) {
  const [command, setCommand] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleSubmit = async () => {
    if (!command.trim()) return

    setIsLoading(true)

    try {
      // Call your AI API here
      const response = await fetch("/api/ai/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: command,
          context: editor.getText(),
        }),
      })

      const { text } = await response.json()
      
      // Insert AI response
      editor.chain().focus().insertContent(text).run()
      onClose()
    } catch (error) {
      console.error("AI command failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="absolute z-50 w-96 rounded-lg border bg-background p-4 shadow-lg"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-5 w-5 text-purple-500" />
        <span className="font-medium">AI Command</span>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto h-6 w-6 p-0"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <Textarea
        ref={textareaRef}
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        placeholder="Ask AI to write, edit, or transform..."
        className="min-h-[80px] resize-none"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
          }
          if (e.key === "Escape") {
            onClose()
          }
        }}
      />
      
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          size="sm" 
          onClick={handleSubmit}
          disabled={!command.trim() || isLoading}
        >
          {isLoading ? "Thinking..." : "Generate"}
        </Button>
      </div>
    </div>
  )
}
```

### Day 6: Final Polish & Performance

#### 6.1 Keyboard Shortcuts
```typescript
// features/editor/extensions/keyboard-shortcuts.ts
import { Extension } from "@tiptap/core"

export const KeyboardShortcuts = Extension.create({
  name: "keyboardShortcuts",

  addKeyboardShortcuts() {
    return {
      // Formatting
      "Mod-b": () => this.editor.chain().focus().toggleBold().run(),
      "Mod-i": () => this.editor.chain().focus().toggleItalic().run(),
      "Mod-u": () => this.editor.chain().focus().toggleUnderline().run(),
      "Mod-Shift-s": () => this.editor.chain().focus().toggleStrike().run(),
      "Mod-e": () => this.editor.chain().focus().toggleCode().run(),
      
      // Blocks
      "Mod-Alt-1": () => this.editor.chain().focus().toggleHeading({ level: 1 }).run(),
      "Mod-Alt-2": () => this.editor.chain().focus().toggleHeading({ level: 2 }).run(),
      "Mod-Alt-3": () => this.editor.chain().focus().toggleHeading({ level: 3 }).run(),
      "Mod-Shift-7": () => this.editor.chain().focus().toggleOrderedList().run(),
      "Mod-Shift-8": () => this.editor.chain().focus().toggleBulletList().run(),
      "Mod-Shift-9": () => this.editor.chain().focus().toggleTaskList().run(),
      
      // Special
      "Mod-Enter": () => {
        // Create new block below
        return this.editor.chain().focus().splitBlock().run()
      },
      "Shift-Enter": () => {
        // Soft line break
        return this.editor.chain().focus().setHardBreak().run()
      },
      
      // Navigation
      "Mod-a": () => this.editor.chain().focus().selectAll().run(),
      "Escape": () => {
        // Clear selection
        return this.editor.chain().focus().blur().run()
      },
    }
  },
})
```

#### 6.2 Performance Optimizations
```typescript
// features/editor/components/novel-editor-optimized.tsx
"use client"

import { memo, useMemo, useCallback } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import debounce from "lodash/debounce"

const NovelEditorOptimized = memo(function NovelEditor({ 
  content, 
  onChange,
  debounceMs = 500 
}: NovelEditorProps) {
  // Debounce onChange to prevent excessive updates
  const debouncedOnChange = useMemo(
    () => debounce((content: string) => {
      onChange?.(content)
    }, debounceMs),
    [onChange, debounceMs]
  )

  const editor = useEditor({
    extensions: [
      // ... all extensions
    ],
    content,
    onUpdate: ({ editor }) => {
      debouncedOnChange(editor.getHTML())
    },
    // Performance options
    editable: true,
    parseOptions: {
      preserveWhitespace: "full",
    },
    editorProps: {
      attributes: {
        class: "notion-editor",
        spellcheck: "false", // We handle this with our extension
      },
      // Optimize for large documents
      transformPasted: (slice) => slice,
    },
  })

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedOnChange.cancel()
    }
  }, [debouncedOnChange])

  return (
    <div className="relative min-h-screen">
      {/* All UI components */}
      <EditorContent editor={editor} />
    </div>
  )
})

export { NovelEditorOptimized as NovelEditor }
```

#### 6.3 Final Testing Checklist
```markdown
## Testing Checklist

### Visual & UX
- [ ] Notion-like spacing and typography
- [ ] Smooth hover effects on blocks
- [ ] Block controls appear on hover
- [ ] Slash menu appears and filters correctly
- [ ] Bubble menu shows on text selection
- [ ] Dark mode works properly

### Functionality
- [ ] All block types can be created
- [ ] Slash commands work with all aliases
- [ ] Keyboard shortcuts function correctly
- [ ] Spell check shows red underlines
- [ ] AI commands trigger with //
- [ ] Drag and drop reorders blocks
- [ ] Copy/paste preserves formatting

### Performance
- [ ] No lag when typing
- [ ] Large documents (10k+ words) remain responsive
- [ ] Spell check doesn't block typing
- [ ] Smooth animations
- [ ] Memory usage reasonable

### Edge Cases
- [ ] Empty editor shows placeholder
- [ ] Paste from Word/Google Docs works
- [ ] Mobile responsive
- [ ] Works offline (except AI features)
- [ ] Undo/redo maintains state
```

---

## Deployment Notes

### Environment Variables
```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
OPENAI_API_KEY=your_key_here
```

### API Routes Needed
```typescript
// app/api/ai/complete/route.ts
export async function POST(request: Request) {
  const { prompt, context } = await request.json()
  
  // Implement OpenAI/Anthropic integration
  // Return: { text: "AI generated content" }
}
```

### Bundle Size Optimization
```javascript
// next.config.js
module.exports = {
  experimental: {
    optimizePackageImports: ['@tiptap/core', '@tiptap/react'],
  },
}
```

This comprehensive sprint plan provides everything needed to transform your Novel editor into a Notion-like experience with all the modern features users expect.