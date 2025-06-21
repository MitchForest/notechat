import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Underline from '@tiptap/extension-underline'
import { SlashCommand } from '../extensions/slash-command'
import { BubbleMenu } from '@tiptap/extension-bubble-menu'
import { SpellCheckExtension } from '../services/SpellCheckExtension'
import { ErrorRegistry } from '../services/ErrorRegistry'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { createLowlight } from 'lowlight'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import css from 'highlight.js/lib/languages/css'
import html from 'highlight.js/lib/languages/xml' // for HTML
import { TrailingNode } from '../extensions/trailing-node'
import ListItem from '@tiptap/extension-list-item'

const lowlight = createLowlight()
lowlight.register('javascript', javascript)
lowlight.register('typescript', typescript)
lowlight.register('css', css)
lowlight.register('html', html)

export const getEditorExtensions = (registry: ErrorRegistry) => [
  StarterKit.configure({
    codeBlock: false,
  }),
  ListItem.extend({
    priority: 1001,
    addKeyboardShortcuts() {
      return {
        Enter: () => this.editor.commands.splitListItem('listItem'),
        'Tab': () => this.editor.commands.sinkListItem('listItem'),
        'Shift-Tab': () => this.editor.commands.liftListItem('listItem'),
      }
    },
  }),
  CodeBlockLowlight.configure({
    lowlight,
    HTMLAttributes: {
      class: 'bg-muted',
    },
    exitOnArrowDown: true,
    exitOnTripleEnter: true,
  }),
  Underline,
  TaskList.configure({
    HTMLAttributes: {
      class: 'list-none',
    },
  }),
  TaskItem.configure({
    nested: true,
    HTMLAttributes: {
      class: 'flex items-start',
    },
  }),
  Placeholder.configure({
    placeholder: ({ node }) => {
      if (node.type.name === 'heading') {
        return `Heading ${node.attrs.level}`
      }
      return "Type '/' for commands..."
    },
    showOnlyWhenEditable: true,
    showOnlyCurrent: true,
  }),
  SlashCommand,
  BubbleMenu.configure({
    pluginKey: 'bubbleMenu',
  }),
  SpellCheckExtension.configure({
    registry: registry,
  }),
  TrailingNode,
] 