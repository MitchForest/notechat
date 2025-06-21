import { Editor, Extension, Range } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'
import Suggestion from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import tippy, { Instance, Props } from 'tippy.js'
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Text,
  Quote,
  Code,
  CheckSquare,
  Wand2
} from 'lucide-react'
import { CommandList, CommandListRef } from '../components/command-list'

export interface CommandItem {
  title: string
  description: string
  icon: any
  command: (props: { editor: Editor; range: Range }) => void
}

const getSuggestionItems = ({ query }: { query: string }): CommandItem[] => {
  return [
    {
      title: 'Ask AI',
      description: 'Open AI assistant to write or edit.',
      icon: Wand2,
      command: ({ editor, range }: { editor: Editor, range: Range }) => {
        editor.chain().focus().deleteRange(range).insertContent({ type: 'inlineAi' }).run()
      }
    },
    {
      title: 'Text',
      description: 'Just start typing with plain text.',
      icon: Text,
      command: ({ editor, range }: { editor: Editor, range: Range }) => {
        editor.chain().focus().deleteRange(range).setParagraph().run()
      },
    },
    {
      title: 'Heading 1',
      description: 'Big section heading.',
      icon: Heading1,
      command: ({ editor, range }: { editor: Editor, range: Range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run()
      },
    },
    {
      title: 'Heading 2',
      description: 'Medium section heading.',
      icon: Heading2,
      command: ({ editor, range }: { editor: Editor, range: Range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
      },
    },
    {
      title: 'Heading 3',
      description: 'Small section heading.',
      icon: Heading3,
      command: ({ editor, range }: { editor: Editor, range: Range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run()
      },
    },
    {
      title: 'Bullet List',
      description: 'Create a simple bullet list.',
      icon: List,
      command: ({ editor, range }: { editor: Editor, range: Range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run()
      },
    },
    {
      title: 'Numbered List',
      description: 'Create a list with numbering.',
      icon: ListOrdered,
      command: ({ editor, range }: { editor: Editor, range: Range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run()
      },
    },
    {
      title: 'Quote',
      description: 'Capture a quote.',
      icon: Quote,
      command: ({ editor, range }: { editor: Editor, range: Range }) => {
        editor.chain().focus().deleteRange(range).setBlockquote().run()
      },
    },
    {
      title: 'Code',
      description: 'Capture a code snippet.',
      icon: Code,
      command: ({ editor, range }: { editor: Editor, range: Range }) => {
        editor.chain().focus().deleteRange(range).setCodeBlock().run()
      },
    },
    {
      title: 'Task List',
      description: 'Track tasks with a to-do list.',
      icon: CheckSquare,
      command: ({ editor, range }: { editor: Editor, range: Range }) => {
        editor.chain().focus().deleteRange(range).toggleTaskList().run()
      },
    },
  ].filter(item => {
    if (item.title === 'Ask AI') {
      return 'ask ai'.includes(query.toLowerCase()) || 'ai'.includes(query.toLowerCase())
    }
    return item.title.toLowerCase().includes(query.toLowerCase())
  })
}

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }: { editor: Editor, range: Range, props: any }) => {
          props.command({ editor, range })
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: getSuggestionItems,
        render: () => {
          let component: ReactRenderer<CommandListRef>
          let popup: Instance<Props>[]
          const defaultRect = new DOMRect()

          return {
            onStart: (props) => {
              component = new ReactRenderer(CommandList, {
                props,
                editor: props.editor,
              })

              if (!props.clientRect) {
                return
              }

              popup = tippy('body', {
                getReferenceClientRect: () => props.clientRect?.() ?? defaultRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              })
            },
            onUpdate: (props) => {
              component.updateProps(props)

              if (!props.clientRect) {
                return
              }

              popup[0].setProps({
                getReferenceClientRect: () => props.clientRect?.() ?? defaultRect,
              })
            },
            onKeyDown: (props) => {
              if (props.event.key === 'Escape') {
                popup[0].hide()
                return true
              }

              return component.ref?.onKeyDown(props) ?? false
            },
            onExit: () => {
              popup[0].destroy()
              component.destroy()
            },
          }
        },
      }),
    ]
  },
}) 