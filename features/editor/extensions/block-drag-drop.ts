import { Extension } from '@tiptap/core'
import { Plugin, PluginKey, Transaction } from 'prosemirror-state'
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view'

export const DATA_TRANSFER_KEY = 'prosemirror-node-pos'
const DRAG_HANDLE_WIDTH = 48

const dragDropKey = new PluginKey<{
  dragging: boolean
  dropPos: number | null
}>('blockDragDrop')

function findDropTarget(view: EditorView, event: DragEvent): number | null {
  const editorRect = (view.dom as HTMLElement).getBoundingClientRect()

  // Check if cursor is within the valid drop area (editor + handle space)
  if (
    event.clientX >= editorRect.left - DRAG_HANDLE_WIDTH &&
    event.clientX <= editorRect.right &&
    event.clientY >= editorRect.top &&
    event.clientY <= editorRect.bottom
  ) {
    const posAtCoords = view.posAtCoords({ left: event.clientX, top: event.clientY })
    if (!posAtCoords) return null

    const { pos } = posAtCoords
    const resolvedPos = view.state.doc.resolve(pos)

    for (let i = resolvedPos.depth; i > 0; i--) {
      const node = resolvedPos.node(i)
      if (node.type.isBlock) {
        const nodeDom = view.nodeDOM(resolvedPos.before(i)) as HTMLElement | null
        if (nodeDom) {
          const nodeRect = nodeDom.getBoundingClientRect()
          const isAfter = event.clientY > nodeRect.top + nodeRect.height / 2
          return isAfter ? resolvedPos.after(i) : resolvedPos.before(i)
        }
      }
    }
    return pos
  }
  return null
}

export const BlockDragDrop = Extension.create({
  name: 'blockDragDrop',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: dragDropKey,
        state: {
          init: () => ({ dropPos: null, dragging: false }),
          apply: (tr, value) => {
            const meta = tr.getMeta(dragDropKey)
            if (meta) {
              return { ...value, ...meta }
            }
            if (tr.docChanged && value.dropPos !== null) {
              return { dropPos: null, dragging: false }
            }
            return value
          },
        },
        props: {
          decorations(state) {
            const pluginState = dragDropKey.getState(state)
            if (pluginState?.dropPos === null || !pluginState?.dragging) return null

            const decoration = Decoration.widget(pluginState.dropPos, () => {
              const indicator = document.createElement('div')
              indicator.className = 'drop-indicator'
              return indicator
            })

            return DecorationSet.create(state.doc, [decoration])
          },
          handleDOMEvents: {
            dragstart: (view, event) => {
              const dragData = event.dataTransfer?.getData(DATA_TRANSFER_KEY)
              if (!dragData) return false
              
              view.dom.classList.add('dragging')
              view.dispatch(view.state.tr.setMeta(dragDropKey, { dragging: true }))
              return true
            },
            dragover: (view, event) => {
              event.preventDefault()
              const dragData = event.dataTransfer?.getData(DATA_TRANSFER_KEY)
              if (!dragData) return false

              const dropPos = findDropTarget(view, event)
              const currentState = dragDropKey.getState(view.state)

              if (currentState?.dropPos !== dropPos) {
                view.dispatch(view.state.tr.setMeta(dragDropKey, { dropPos }))
              }
              return true
            },
            dragleave: (view, event) => {
              if (event.target === view.dom && !view.dom.contains(event.relatedTarget as Node)) {
                view.dispatch(view.state.tr.setMeta(dragDropKey, { dropPos: null }))
              }
            },
            dragend: (view, _event) => {
              view.dom.classList.remove('dragging')
              view.dispatch(view.state.tr.setMeta(dragDropKey, { dragging: false, dropPos: null }))
            },
            drop: (view, event) => {
              event.preventDefault()
              view.dom.classList.remove('dragging')
              const pluginState = dragDropKey.getState(view.state)
              if (!pluginState) return false

              const { dropPos } = pluginState
              const dragData = event.dataTransfer?.getData(DATA_TRANSFER_KEY)

              if (dropPos === null || !dragData) return false

              const draggedPos = parseInt(dragData, 10)
              if (isNaN(draggedPos)) return false

              const { tr } = view.state
              const draggedNode = view.state.doc.nodeAt(draggedPos)
              if (!draggedNode) return false

              const content = view.state.doc.slice(draggedPos, draggedPos + draggedNode.nodeSize)
              tr.delete(draggedPos, draggedPos + draggedNode.nodeSize)

              const insertPos = tr.mapping.map(dropPos)
              tr.insert(insertPos, content.content)
              tr.setMeta(dragDropKey, { dragging: false, dropPos: null })

              view.dispatch(tr)

              return true
            },
          },
        },
      }),
    ]
  },
}) 