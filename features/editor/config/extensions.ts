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

// Import Novel extensions
import GlobalDragHandle from 'tiptap-extension-global-drag-handle'
import AutoJoiner from 'tiptap-extension-auto-joiner'

const lowlight = createLowlight(common)

export const getEditorExtensions = (
  errorRegistry: ErrorRegistry, 
  container?: HTMLElement
) => {
  console.log('[Extensions] Loading editor extensions...', { container: !!container, containerClass: container?.className })

  const extensions = [
    // Configure StarterKit with all default nodes enabled
    StarterKit.configure({
      history: {},
      dropcursor: {
        color: 'oklch(var(--primary))',
        width: 2,
      },
    }),
    
    // Code block with syntax highlighting
    CodeBlockLowlight.configure({
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
    TaskItem,
    
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
    
    // ALWAYS add Novel drag handle - no conditions
    GlobalDragHandle.configure({
      dragHandleWidth: 20,
      scrollTreshold: 100, // Note: typo in the library, should be "threshold"
      // Let the extension handle all blocks by default
      excludedTags: [],
      // Remove customNodes - let the extension auto-detect
    }),
    
    // Add auto-joiner for lists
    AutoJoiner.configure({
      elementsToJoin: ['bulletList', 'orderedList'],
    }),
  ]

  console.log('[Extensions] Loaded', extensions.length, 'extensions')

  // Add spell check only if container exists
  if (container) {
    extensions.push(
      SpellCheckExtension.configure({
        registry: errorRegistry
      })
    )
  }

  return extensions
}