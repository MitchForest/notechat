import { BubbleMenu, Editor } from '@tiptap/react'
import { useState } from 'react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Wand2
} from 'lucide-react'
import { Toggle } from '@/components/ui/toggle'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { AIBubbleMenuCommands } from '@/features/ai/components/ai-bubble-menu-commands'

interface EditorBubbleMenuProps {
  editor: Editor
}

export function EditorBubbleMenu({ editor }: EditorBubbleMenuProps) {
  const [view, setView] = useState<'format' | 'ai'>('format')

  const formatItems = [
    { name: 'bold', icon: Bold, action: () => editor.chain().focus().toggleBold().run() },
    { name: 'italic', icon: Italic, action: () => editor.chain().focus().toggleItalic().run() },
    { name: 'underline', icon: Underline, action: () => editor.chain().focus().toggleUnderline().run() },
    { name: 'strike', icon: Strikethrough, action: () => editor.chain().focus().toggleStrike().run() },
    { name: 'code', icon: Code, action: () => editor.chain().focus().toggleCode().run() }
  ]

  const handleAiClick = () => {
    setView('ai')
  }

  const handleBack = () => {
    setView('format')
  }

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{
        duration: 100,
        placement: 'top-start',
        onHidden: () => setView('format')
      }}
      className="flex items-center rounded-md border bg-background p-1 shadow-md"
    >
      {view === 'format' ? (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={handleAiClick}
            disabled={editor.state.selection.empty}
          >
            <Wand2 className="h-4 w-4" />
            Use AI
          </Button>
          <Separator orientation="vertical" className="h-6" />
          {formatItems.map(item => (
            <Toggle
              key={item.name}
              size="sm"
              pressed={editor.isActive(item.name)}
              onPressedChange={item.action}
              title={item.name.charAt(0).toUpperCase() + item.name.slice(1)}
              className="flex items-center justify-center"
            >
              <item.icon className="h-4 w-4" />
            </Toggle>
          ))}
        </>
      ) : (
        <AIBubbleMenuCommands editor={editor} onBack={handleBack} />
      )}
    </BubbleMenu>
  )
} 