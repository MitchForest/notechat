import { Extension } from '@tiptap/core'
import { Plugin } from 'prosemirror-state'

export const TrailingNode = Extension.create({
  name: 'trailingNode',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        appendTransaction: (transactions, oldState, newState) => {
          const { doc, tr } = newState
          const shouldInsertNode = transactions.some(transaction => transaction.docChanged)
          const lastNode = doc.lastChild

          if (!shouldInsertNode || !lastNode) {
            return
          }

          // If the last node is already an empty paragraph, do nothing
          if (lastNode.type.name === 'paragraph' && lastNode.content.size === 0) {
            return
          }

          // If the last node is not a paragraph or is a paragraph with content,
          // add a new empty paragraph at the end
          if (lastNode.type.name !== 'paragraph' || lastNode.content.size > 0) {
            const endPosition = doc.content.size
            tr.insert(endPosition, newState.schema.nodes.paragraph.create())
            return tr
          }
        },
      }),
    ]
  },
})