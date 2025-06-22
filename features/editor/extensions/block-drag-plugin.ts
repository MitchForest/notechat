import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { Node as ProseMirrorNode } from 'prosemirror-model'

export interface BlockDragPluginOptions {
  onDragStart?: (data: { blockId: string; blockNode: ProseMirrorNode; blockPos: number }) => void
  onDragEnd?: () => void
  onDrop?: (targetPos: number, position: 'before' | 'after') => void
  onUpdateDropTarget?: (targetId: string | null, position: 'before' | 'after' | null) => void
}

export const BlockDragPlugin = Extension.create<BlockDragPluginOptions>({
  name: 'blockDragPlugin',

  addOptions() {
    return {
      onDragStart: undefined,
      onDragEnd: undefined,
      onDrop: undefined,
      onUpdateDropTarget: undefined,
    }
  },

  addProseMirrorPlugins() {
    const options = this.options

    return [
      new Plugin({
        key: new PluginKey('blockDragPlugin'),
        props: {
          handleDOMEvents: {
            // Track mouse movement during drag
            mousemove(view: EditorView, event: MouseEvent) {
              if (!view.dom.classList.contains('is-dragging')) return false

              const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })
              if (!pos) return false

              // Find the block at this position
              const $pos = view.state.doc.resolve(pos.pos)
              let blockNode = null
              let blockPos = 0

              // Walk up to find the nearest block node
              for (let depth = $pos.depth; depth > 0; depth--) {
                const node = $pos.node(depth)
                if (node.type.isBlock && !node.type.isTextblock) {
                  blockNode = node
                  blockPos = $pos.before(depth)
                  break
                }
                if (node.type.name === 'paragraph' || 
                    node.type.name === 'heading' || 
                    node.type.name === 'codeBlock' ||
                    node.type.name === 'blockquote' ||
                    node.type.name === 'bulletList' ||
                    node.type.name === 'orderedList') {
                  blockNode = node
                  blockPos = $pos.before(depth)
                  break
                }
              }

              if (blockNode && options.onUpdateDropTarget) {
                // Determine if we're in the top or bottom half
                const domNode = view.nodeDOM(blockPos) as HTMLElement | null
                if (domNode) {
                  const rect = domNode.getBoundingClientRect()
                  const midpoint = rect.top + rect.height / 2
                  const position = event.clientY < midpoint ? 'before' : 'after'
                  const blockId = `block-${blockPos}`
                  options.onUpdateDropTarget(blockId, position)
                }
              }

              return false
            },

            // Handle drop
            drop(view: EditorView, event: DragEvent) {
              if (!view.dom.classList.contains('is-dragging')) return false

              event.preventDefault()

              const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })
              if (!pos) return false

              // Find the block at this position
              const $pos = view.state.doc.resolve(pos.pos)
              let blockPos = 0

              // Walk up to find the nearest block position
              for (let depth = $pos.depth; depth > 0; depth--) {
                const node = $pos.node(depth)
                if (node.type.isBlock) {
                  blockPos = $pos.before(depth)
                  break
                }
              }

              if (options.onDrop) {
                // Determine drop position
                const domNode = view.nodeDOM(blockPos) as HTMLElement | null
                if (domNode) {
                  const rect = domNode.getBoundingClientRect()
                  const midpoint = rect.top + rect.height / 2
                  const position = event.clientY < midpoint ? 'before' : 'after'
                  options.onDrop(blockPos, position)
                }
              }

              return true
            },

            // Clean up on drag leave
            dragleave(view: EditorView) {
              if (view.dom.classList.contains('is-dragging') && options.onUpdateDropTarget) {
                // Check if we're actually leaving the editor
                setTimeout(() => {
                  const isStillHovering = view.dom.matches(':hover')
                  if (!isStillHovering && options.onUpdateDropTarget) {
                    options.onUpdateDropTarget(null, null)
                  }
                }, 10)
              }
              return false
            }
          }
        }
      })
    ]
  }
}) 