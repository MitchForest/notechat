import { Color } from '@tiptap/extension-color'
import TextStyle from '@tiptap/extension-text-style'
import { StarterKit } from '@tiptap/starter-kit'
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import Placeholder from '@tiptap/extension-placeholder'
import { TrailingNode } from '../extensions/trailing-node'
import { SlashCommand } from '../extensions/slash-command'
import { SpellCheckExtension } from '../services/SpellCheckExtension'
import { ErrorRegistry } from '../services/ErrorRegistry'
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Extension } from '@tiptap/core'
import { InlineAI } from '@/features/ai/extensions/inline-ai';
import { GhostText } from '@/features/ai/extensions/ghost-text'
import { BlockId } from '../extensions/block-id'

// Import our custom block drag handle instead of Tiptap's
import { BlockDragHandle } from '../extensions/block-drag-handle'
import { Dropcursor } from '@tiptap/extension-dropcursor'
import { BubbleMenu } from '@tiptap/extension-bubble-menu'

const lowlight = createLowlight(common)

export const getEditorExtensions = (
  errorRegistry: ErrorRegistry, 
  container?: HTMLElement
) => {
  console.log('[Extensions] Getting editor extensions, container:', !!container)
  
  const extensions = [
    // Configure StarterKit with all default nodes enabled
    StarterKit.configure({
      history: {},
      dropcursor: false, // Disable because we add our own
      codeBlock: false, // Disable because we use CodeBlockLowlight
      heading: {
        levels: [1, 2, 3],
      },
    }),
    
    // Code block with syntax highlighting
    CodeBlockLowlight.configure({
      lowlight,
      languageClassPrefix: 'language-',
      defaultLanguage: 'plaintext',
    }),
    
    // Text formatting
    TextStyle,
    Color,
    Underline,
    
    // Lists
    TaskList.configure({
      HTMLAttributes: {
        class: 'task-list',
      },
    }),
    TaskItem.configure({
      nested: true,
      HTMLAttributes: {
        class: 'task-item',
      },
    }),
    
    // AI extensions
    InlineAI,
    GhostText,
    
    // Commands and utilities
    SlashCommand,
    BlockId,
    TrailingNode,
    
    // Enhanced placeholder with support for all block types
    Placeholder.configure({
      placeholder: ({ node, pos, editor }) => {
        // Get the parent node to check if we're in a list
        const $pos = editor.state.doc.resolve(pos)
        const parent = $pos.parent
        
        if (node.type.name === 'heading') {
          const level = node.attrs.level
          return `Heading ${level}`
        }
        
        if (node.type.name === 'paragraph') {
          // Check if we're the first node in a list item
          if (parent && parent.type.name === 'listItem') {
            const grandParent = $pos.node(-2)
            if (grandParent && grandParent.type.name === 'bulletList') {
              return 'List item'
            }
            if (grandParent && grandParent.type.name === 'orderedList') {
              return 'List item'
            }
          }
          return "Press '/' for commands"
        }
        
        if (node.type.name === 'codeBlock') {
          return 'Write some code...'
        }
        
        if (node.type.name === 'blockquote') {
          return 'Quote...'
        }
        
        // Default placeholder
        return "Press '/' for commands"
      },
      showOnlyCurrent: true,
      includeChildren: true, // Show in nested structures like lists
    }),
    
    // Add BubbleMenu BEFORE DragHandle to ensure proper initialization
    BubbleMenu.configure({
      element: null, // We'll attach this later via custom component
      pluginKey: 'bubbleMenu',
      tippyOptions: {
        duration: 100,
        placement: 'top',
        zIndex: 99,
      },
      shouldShow: ({ editor, view, state, from, to }) => {
        console.log('[BubbleMenu] shouldShow check:', { from, to, hasSelection: from !== to })
        // Only show when there's a text selection
        const hasSelection = from !== to
        // Don't show if we're in a code block
        const isCodeBlock = editor.isActive('codeBlock')
        return hasSelection && !isCodeBlock
      },
    }),
    
    // Dropcursor for drag and drop
    Dropcursor.configure({
      color: 'hsl(var(--primary))',
      width: 2,
    }),
    
    // Add our custom block drag handle
    BlockDragHandle.configure({
      handleWidth: 20,
      horizontalOffset: 30,
      hideDelay: 100,
      throttleDelay: 16,
    }),
  ]

  // Add spell check only if container exists
  if (container) {
    extensions.push(
      SpellCheckExtension.configure({
        registry: errorRegistry
      })
    )
  }

  console.log('[Extensions] Total extensions:', extensions.length)
  return extensions
}