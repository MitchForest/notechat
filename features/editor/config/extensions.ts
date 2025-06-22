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

// Import official Tiptap drag handle
import { DragHandle } from '@tiptap/extension-drag-handle'

const lowlight = createLowlight(common)

export const getEditorExtensions = (
  errorRegistry: ErrorRegistry, 
  container?: HTMLElement
) => {
  const extensions = [
    // Configure StarterKit with all default nodes enabled
    StarterKit.configure({
      history: {},
      dropcursor: {
        color: 'oklch(var(--primary))',
        width: 2,
      },
      codeBlock: false, // Disable because we use CodeBlockLowlight
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
    
    // Add drag handle - using official Tiptap extension
    DragHandle.configure({
      render: () => {
        console.log('[DragHandle] render() called')
        const handle = document.createElement('div')
        handle.className = 'tiptap-drag-handle'
        handle.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="4" cy="4" r="1.5"/>
            <circle cx="4" cy="8" r="1.5"/>
            <circle cx="4" cy="12" r="1.5"/>
            <circle cx="12" cy="4" r="1.5"/>
            <circle cx="12" cy="8" r="1.5"/>
            <circle cx="12" cy="12" r="1.5"/>
          </svg>
        `
        console.log('[DragHandle] Created element:', handle)
        return handle
      },
      tippyOptions: {
        duration: 0,
        placement: 'left',
        offset: [0, 0],
        hideOnClick: false,
        animation: false,
        appendTo: () => document.getElementById('tiptap-editor-wrapper') || document.body,
        onShow: (instance: any) => {
          console.log('[DragHandle] Tippy onShow:', instance)
        },
        onHide: (instance: any) => {
          console.log('[DragHandle] Tippy onHide')
        },
        onMount: (instance: any) => {
          console.log('[DragHandle] Tippy onMount:', instance)
        },
        onDestroy: (instance: any) => {
          console.log('[DragHandle] Tippy onDestroy - THIS SHOULD NOT HAPPEN!')
          console.trace('[DragHandle] Tippy destroy stack trace')
        },
      },
      onNodeChange: (data: any) => {
        console.log('[DragHandle] onNodeChange:', {
          node: data.node?.type?.name,
          editor: !!data.editor,
          hasPos: 'pos' in data,
          data,
        })
      },
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

  return extensions
}