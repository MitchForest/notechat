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

const lowlight = createLowlight(common)

export const getEditorExtensions = (errorRegistry: ErrorRegistry, container?: HTMLElement) => {
  console.log('[Extensions] Loading editor extensions...')

  const extensions = [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3]
      },
      bulletList: { keepMarks: true, keepAttributes: false },
      orderedList: { keepMarks: true, keepAttributes: false },
      history: {},
      codeBlock: false,
    }),
    InlineAI,
    SlashCommand,
    TrailingNode,
    GhostText,
    CodeBlockLowlight.configure({
      lowlight,
      languageClassPrefix: 'language-',
      defaultLanguage: 'plaintext',
    }),
    TextStyle,
    Color,
    Underline,
    TaskList,
    TaskItem,
    Placeholder.configure({
      placeholder: ({ node }) => {
        if (node.type.name === 'heading') {
          return `Heading ${node.attrs.level}`
        }
        return "Press '/' for commands"
      },
      showOnlyCurrent: true
    }),
    BlockUi.configure({
      container
    })
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