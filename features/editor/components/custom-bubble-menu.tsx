import { Editor } from '@tiptap/core'
import { useEffect, useRef, useState } from 'react'
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

interface CustomBubbleMenuProps {
  editor: Editor
}

export function CustomBubbleMenu({ editor }: CustomBubbleMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<'format' | 'ai'>('format')
  const [isAttached, setIsAttached] = useState(false)
  
  useEffect(() => {
    if (!editor || !menuRef.current) return
    
    console.log('[CustomBubbleMenu] Attempting to attach to BubbleMenu extension')
    
    // Get the BubbleMenu extension
    const bubbleMenuExtension = editor.extensionManager.extensions.find(
      ext => ext.name === 'bubbleMenu'
    )
    
    if (bubbleMenuExtension && !isAttached) {
      console.log('[CustomBubbleMenu] Found BubbleMenu extension, attaching element')
      // Set the element after the editor is ready
      bubbleMenuExtension.options.element = menuRef.current
      setIsAttached(true)
      
      // Force update to make the menu work
      editor.view.dispatch(editor.state.tr)
    }
  }, [editor, isAttached])
  
  // Reset view when menu is hidden
  useEffect(() => {
    if (!editor) return
    
    const updateHandler = () => {
      const { from, to } = editor.state.selection
      if (from === to) {
        setView('format')
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
  
  const handleAiClick = () => {
    setView('ai')
  }
  
  const handleBack = () => {
    setView('format')
  }
  
  return (
    <div 
      ref={menuRef} 
      className="flex items-center rounded-md border bg-background p-1 shadow-md"
      style={{ display: 'none' }} // Initially hidden, BubbleMenu extension will control visibility
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
          <Separator orientation="vertical" className="h-6" />
          {formatItems.map(item => (
            <Toggle
              key={item.name}
              size="sm"
              pressed={item.isActive()}
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
    </div>
  )
} 