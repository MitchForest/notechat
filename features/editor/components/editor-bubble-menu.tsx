import { BubbleMenu, Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  MessageSquarePlus,
  Wand2
} from 'lucide-react'
import { Toggle } from '@/components/ui/toggle'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'

interface EditorBubbleMenuProps {
  editor: Editor
}

export function EditorBubbleMenu({ editor }: EditorBubbleMenuProps) {
  const menuItems = [
    { name: 'bold', icon: Bold, action: () => editor.chain().focus().toggleBold().run() },
    { name: 'italic', icon: Italic, action: () => editor.chain().focus().toggleItalic().run() },
    { name: 'underline', icon: Underline, action: () => editor.chain().focus().toggleUnderline().run() },
    { name: 'strike', icon: Strikethrough, action: () => editor.chain().focus().toggleStrike().run() },
    { name: 'code', icon: Code, action: () => editor.chain().focus().toggleCode().run() }
  ]

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{
        duration: 100,
        placement: 'top-start'
      }}
      className="flex items-center gap-1 rounded-md border bg-background p-1 shadow-md"
    >
      <Button variant="ghost" size="sm" className="gap-1.5" disabled>
        <Wand2 className="h-4 w-4" />
        Ask AI
      </Button>
      <Button variant="ghost" size="sm" className="gap-1.5" disabled>
        <MessageSquarePlus className="h-4 w-4" />
        Comment
      </Button>
      <Separator orientation="vertical" className="h-6" />
      {menuItems.map(item => (
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
    </BubbleMenu>
  )
} 