import { Editor } from '@tiptap/core'
import { BubbleMenu } from '@tiptap/react'
import { useState, useEffect } from 'react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Sparkles
} from 'lucide-react'
import { Toggle } from '@/components/ui/toggle'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { AIBubbleMenuCommands } from '@/features/ai/components/ai-bubble-menu-commands'

interface CustomBubbleMenuProps {
  editor: Editor
}

export function CustomBubbleMenu({ editor }: CustomBubbleMenuProps) {
  const [showAI, setShowAI] = useState(false)
  
  // Reset to format view when selection changes
  useEffect(() => {
    if (!editor) return
    
    const updateHandler = () => {
      const { from, to } = editor.state.selection
      if (from === to) {
        setShowAI(false)
      }
    }
    
    editor.on('selectionUpdate', updateHandler)
    return () => {
      editor.off('selectionUpdate', updateHandler)
    }
  }, [editor])
  
  if (!editor) return null
  
  const formatItems = [
    { 
      name: 'bold', 
      icon: Bold, 
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: () => editor.isActive('bold')
    },
    { 
      name: 'italic', 
      icon: Italic, 
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: () => editor.isActive('italic')
    },
    { 
      name: 'underline', 
      icon: Underline, 
      action: () => editor.chain().focus().toggleUnderline().run(),
      isActive: () => editor.isActive('underline')
    },
    { 
      name: 'strike', 
      icon: Strikethrough, 
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: () => editor.isActive('strike')
    },
    { 
      name: 'code', 
      icon: Code, 
      action: () => editor.chain().focus().toggleCode().run(),
      isActive: () => editor.isActive('code')
    }
  ]
  
  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{
        duration: 100,
        placement: 'top-start',
      }}
      shouldShow={({ editor, from, to }) => {
        // Only show if there's a selection
        return from !== to
      }}
    >
      <div className="flex items-center gap-0.5 p-1 bg-popover rounded-lg border shadow-md">
        {showAI ? (
          <AIBubbleMenuCommands editor={editor} onBack={() => setShowAI(false)} />
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 h-8"
              onClick={() => setShowAI(true)}
            >
              <Sparkles className="h-4 w-4" />
              Use AI
            </Button>
            <Separator orientation="vertical" className="h-6 mx-1" />
            {formatItems.map(item => (
              <Toggle
                key={item.name}
                size="sm"
                pressed={item.isActive()}
                onPressedChange={item.action}
                title={item.name.charAt(0).toUpperCase() + item.name.slice(1)}
                className="h-8 w-8"
              >
                <item.icon className="h-4 w-4" />
              </Toggle>
            ))}
          </>
        )}
      </div>
    </BubbleMenu>
  )
} 