import { BubbleMenu } from '@tiptap/react'
import { Editor } from '@tiptap/core'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
} from 'lucide-react'
import { Toggle } from '@/components/ui/toggle'

interface EditorBubbleMenuProps {
  editor: Editor
}

export function EditorBubbleMenu({ editor }: EditorBubbleMenuProps) {
  const menuItems = [
    { name: 'bold', icon: Bold, action: () => editor.chain().focus().toggleBold().run() },
    { name: 'italic', icon: Italic, action: () => editor.chain().focus().toggleItalic().run() },
    { name: 'underline', icon: Underline, action: () => editor.chain().focus().toggleUnderline().run() },
    { name: 'strike', icon: Strikethrough, action: () => editor.chain().focus().toggleStrike().run() },
    { name: 'code', icon: Code, action: () => editor.chain().focus().toggleCode().run() },
  ]

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{
        duration: 100,
        placement: 'top',
      }}
      className="flex items-center gap-1 rounded-md border bg-background p-1 shadow-md"
    >
      {menuItems.map((item) => (
        <Toggle
          key={item.name}
          size="sm"
          pressed={editor.isActive(item.name)}
          onPressedChange={item.action}
        >
          <item.icon className="h-4 w-4" />
        </Toggle>
      ))}
    </BubbleMenu>
  )
} 