import { BubbleMenu, Editor } from '@tiptap/react'
import { useState } from 'react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Wand2,
  MessageSquare
} from 'lucide-react'
import { Toggle } from '@/components/ui/toggle'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { AIBubbleMenuCommands } from '@/features/ai/components/ai-bubble-menu-commands'
import { useHighlightContext } from '@/features/chat/stores/highlight-context-store'
import { useAppShell } from '@/components/layout/app-shell-context'
import { toast } from 'sonner'

interface EditorBubbleMenuProps {
  editor: Editor
  noteId?: string
  noteTitle?: string
}

export function EditorBubbleMenu({ editor, noteId, noteTitle }: EditorBubbleMenuProps) {
  const [view, setView] = useState<'format' | 'ai'>('format')
  const { setHighlight } = useHighlightContext()
  const { openChat } = useAppShell()

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

  const handleChatClick = () => {
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to)
    
    if (selectedText && noteId && noteTitle) {
      // Set highlight context
      setHighlight({
        text: selectedText,
        noteId,
        noteTitle,
        selectionRange: { start: from, end: to }
      })
      
      // Open new chat
      openChat({
        id: `chat_${Date.now()}`,
        type: 'chat',
        title: 'AI Chat'
      })
      
      toast.info('Selected text added to chat context')
    }
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
        onHidden: () => setView('format'),
        zIndex: 99
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
          >
            <Wand2 className="h-4 w-4" />
            Use AI
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={handleChatClick}
          >
            <MessageSquare className="h-4 w-4" />
            Chat
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