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
import { ReactNodeViewRenderer } from '@tiptap/react'
import Paragraph from '@tiptap/extension-paragraph'
import Heading from '@tiptap/extension-heading'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import Blockquote from '@tiptap/extension-blockquote'
import { BlockId } from '../extensions/block-id'
import { createBlockDragDropPlugin } from '../plugins/block-drag-drop'

// Import our block components
import { ParagraphBlock } from '../blocks/paragraph-block'
import { HeadingBlock } from '../blocks/heading-block'
import { ListItemBlock } from '../blocks/list-item-block'
import { CodeBlock } from '../blocks/code-block'

const lowlight = createLowlight(common)

export const getEditorExtensions = (
  errorRegistry: ErrorRegistry, 
  container?: HTMLElement
) => {
  console.log('[Extensions] Loading editor extensions...', { container: !!container, containerClass: container?.className })

  const extensions = [
    // Configure StarterKit without the nodes we're customizing
    StarterKit.configure({
      paragraph: false,
      heading: false,
      bulletList: false,
      orderedList: false,
      listItem: false,
      blockquote: false,
      codeBlock: false,
      history: {},
    }),
    
    // Paragraph with React node view
    Paragraph.extend({
      addAttributes() {
        return {
          ...this.parent?.(),
          id: {
            default: null,
          },
        }
      },
      addNodeView() {
        return ReactNodeViewRenderer(ParagraphBlock)
      },
    }),
    
    // Heading with React node view
    Heading.extend({
      addAttributes() {
        return {
          ...this.parent?.(),
          id: {
            default: null,
          },
        }
      },
      addNodeView() {
        return ReactNodeViewRenderer(HeadingBlock)
      },
    }),
    
    // Lists - keep native rendering for the list containers
    BulletList.extend({
      renderHTML({ HTMLAttributes }) {
        return ['ul', { ...HTMLAttributes, 'data-block-type': 'bulletList' }, 0]
      },
    }),
    
    OrderedList.extend({
      renderHTML({ HTMLAttributes }) {
        return ['ol', { ...HTMLAttributes, 'data-block-type': 'orderedList' }, 0]
      },
    }),
    
    // List items with React node view
    ListItem.extend({
      addAttributes() {
        return {
          ...this.parent?.(),
          id: {
            default: null,
          },
        }
      },
      addNodeView() {
        return ReactNodeViewRenderer(ListItemBlock)
      },
    }),
    
    // Blockquote - keep native for now
    Blockquote.extend({
      addAttributes() {
        return {
          ...this.parent?.(),
          id: {
            default: null,
          },
        }
      },
      renderHTML({ HTMLAttributes }) {
        return ['blockquote', { ...HTMLAttributes, 'data-block-type': 'blockquote' }, 0]
      },
    }),
    
    // Code block with React node view
    CodeBlockLowlight.extend({
      addAttributes() {
        return {
          ...this.parent?.(),
          id: {
            default: null,
          },
          language: {
            default: 'plaintext',
          },
        }
      },
      addNodeView() {
        return ReactNodeViewRenderer(CodeBlock)
      },
    }).configure({
      lowlight,
      languageClassPrefix: 'language-',
      defaultLanguage: 'plaintext',
    }),
    
    // Other extensions
    InlineAI,
    SlashCommand,
    TrailingNode,
    GhostText,
    TextStyle,
    Color,
    Underline,
    TaskList,
    TaskItem.extend({
      renderHTML({ HTMLAttributes }) {
        return ['li', { ...HTMLAttributes, 'data-block-type': 'taskItem' }, 0]
      },
    }),
    
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
    
    // Add BlockId extension
    BlockId,
    
    // Add drag & drop plugin
    Extension.create({
      name: 'blockDragDrop',
      addProseMirrorPlugins() {
        return [createBlockDragDropPlugin()]
      },
    }),
  ]

  console.log('[Extensions] Loaded', extensions.length, 'extensions')

  if (container) {
    extensions.push(
      SpellCheckExtension.configure({
        registry: errorRegistry
      })
    )
  }

  return extensions
}