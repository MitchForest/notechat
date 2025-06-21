import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { AIInlineInterface } from '../components/ai-inline-interface'

export const InlineAI = Node.create({
  name: 'inlineAi',

  group: 'block',

  atom: true,

  parseHTML() {
    return [
      {
        tag: 'div[data-type="inline-ai"]'
      }
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'inline-ai' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(AIInlineInterface)
  }
}) 