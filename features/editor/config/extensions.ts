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

// Import official Tiptap drag handle and bubble menu
import { DragHandle } from '@tiptap/extension-drag-handle'
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
    
    // Add drag handle - using official Tiptap extension
    DragHandle.configure({
      render: () => {
        const handle = document.createElement('div')
        handle.className = 'tiptap-drag-handle'
        handle.draggable = true
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
        return handle
      },
      tippyOptions: {
        duration: 0,
        placement: 'left-start',  // Position at top-left of block
        offset: [-45, 0],  // Adjust to be in the left padding area
        hideOnClick: false,
        animation: 'shift-away',
        interactive: true,  // Allow mouse to move to the handle
        interactiveBorder: 30, // Invisible border to help transition
        appendTo: () => document.body, // Ensures proper z-index stacking
        theme: 'drag-handle', // Apply our custom theme
        getReferenceClientRect: null, // Let Tippy figure out the reference
        popperOptions: {
          modifiers: [
            {
              name: 'flip',
              enabled: false, // Disable flipping to keep handle on left
            },
          ],
        },
        onShow: (instance: any) => {
          console.log('[DragHandle] Tippy onShow:', instance)
          // Debug: Log the actual position
          const reference = instance.reference.getBoundingClientRect()
          const popper = instance.popper.getBoundingClientRect()
          console.log('[DragHandle] Positions:', {
            reference: { left: reference.left, top: reference.top },
            popper: { left: popper.left, top: popper.top },
            offset: { x: popper.left - reference.left, y: popper.top - reference.top }
          })
          
          // Check if the drag handle element is actually in the popper
          const dragHandle = instance.popper.querySelector('.tiptap-drag-handle')
          console.log('[DragHandle] Drag handle in popper:', !!dragHandle)
          if (dragHandle) {
            console.log('[DragHandle] Drag handle styles:', window.getComputedStyle(dragHandle))
          }
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

  console.log('[Extensions] Total extensions:', extensions.length)
  return extensions
}