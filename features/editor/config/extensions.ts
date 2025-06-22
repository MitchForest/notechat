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
import { BlockUi } from '../extensions/block-ui-plugin'
import { Extension } from '@tiptap/core'
import { InlineAI } from '@/features/ai/extensions/inline-ai';
import { GhostText } from '@/features/ai/extensions/ghost-text'
import { createBlockNodeView } from '../extensions/react-node-view'
import { BlockDragPlugin } from '../extensions/block-drag-plugin'
import Paragraph from '@tiptap/extension-paragraph'
import Heading from '@tiptap/extension-heading'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import Blockquote from '@tiptap/extension-blockquote'

const lowlight = createLowlight(common)

export const getEditorExtensions = (
  errorRegistry: ErrorRegistry, 
  container?: HTMLElement,
  dragHandlers?: {
    onDragStart?: (data: any) => void
    onDragEnd?: () => void
    onDrop?: (targetPos: number, position: 'before' | 'after') => void
    onUpdateDropTarget?: (targetId: string | null, position: 'before' | 'after' | null) => void
  }
) => {
  console.log('[Extensions] Loading editor extensions...')

  const extensions = [
    // Configure StarterKit without the nodes we're customizing
    StarterKit.configure({
      paragraph: false, // We'll add our own with node view
      heading: false, // We'll add our own with node view
      bulletList: false, // We'll add our own with node view
      orderedList: false, // We'll add our own with node view
      listItem: false, // We'll add our own with node view
      blockquote: false, // We'll add our own with node view
      codeBlock: false, // We'll use CodeBlockLowlight
      history: {},
    }),
    
    // Block nodes with React node views
    Paragraph.extend({
      addNodeView() {
        return createBlockNodeView('paragraph')
      }
    }),
    
    Heading.extend({
      addNodeView() {
        return createBlockNodeView('heading')
      }
    }),
    
    BulletList.extend({
      addNodeView() {
        return createBlockNodeView('bulletList')
      }
    }),
    
    OrderedList.extend({
      addNodeView() {
        return createBlockNodeView('orderedList')
      }
    }),
    
    ListItem.extend({
      addNodeView() {
        return createBlockNodeView('listItem')
      }
    }),
    
    Blockquote.extend({
      addNodeView() {
        return createBlockNodeView('blockquote')
      }
    }),
    
    CodeBlockLowlight.extend({
      addNodeView() {
        return createBlockNodeView('codeBlock')
      }
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
      addNodeView() {
        return createBlockNodeView('taskItem')
      }
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
    
    BlockUi.configure({
      container
    }),
    
    // Add BlockDragPlugin if drag handlers are provided
    ...(dragHandlers ? [BlockDragPlugin.configure(dragHandlers)] : [])
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