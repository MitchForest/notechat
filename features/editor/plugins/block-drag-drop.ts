import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'
import { TextSelection } from 'prosemirror-state'

const dragDropKey = new PluginKey('blockDragDrop')

interface DragDropState {
  draggedBlockId: string | null
  dropTargetPos: number | null
}

export const createBlockDragDropPlugin = () => {
  return new Plugin({
    key: dragDropKey,
    
    state: {
      init(): DragDropState {
        return {
          draggedBlockId: null,
          dropTargetPos: null
        }
      },
      
      apply(tr, value): DragDropState {
        const meta = tr.getMeta(dragDropKey)
        if (meta) {
          return { ...value, ...meta }
        }
        return value
      }
    },
    
    props: {
      decorations(state) {
        const { dropTargetPos } = dragDropKey.getState(state) as DragDropState
        if (!dropTargetPos) return DecorationSet.empty
        
        // Create drop indicator
        const dropIndicator = Decoration.widget(dropTargetPos, () => {
          const el = document.createElement('div')
          el.className = 'drop-indicator'
          return el
        }, { side: -1 })
        
        return DecorationSet.create(state.doc, [dropIndicator])
      },
      
      handleDOMEvents: {
        dragover(view, event) {
          event.preventDefault()
          event.dataTransfer!.dropEffect = 'move'
          
          // Calculate drop position
          const pos = view.posAtCoords({
            left: event.clientX,
            top: event.clientY
          })
          
          if (pos) {
            // Find the nearest block boundary
            const $pos = view.state.doc.resolve(pos.pos)
            let blockPos = pos.pos
            
            // Walk up to find block node
            for (let d = $pos.depth; d > 0; d--) {
              if ($pos.node(d).isBlock) {
                blockPos = $pos.before(d)
                break
              }
            }
            
            view.dispatch(
              view.state.tr.setMeta(dragDropKey, { dropTargetPos: blockPos })
            )
          }
          
          return true
        },
        
        drop(view, event) {
          event.preventDefault()
          
          const data = event.dataTransfer?.getData('application/x-tiptap-block')
          if (!data) return false
          
          const { blockId, blockPos, nodeSize } = JSON.parse(data)
          const dropPos = view.posAtCoords({
            left: event.clientX,
            top: event.clientY
          })
          
          if (!dropPos) return false
          
          // Find target position
          const $pos = view.state.doc.resolve(dropPos.pos)
          let targetPos = dropPos.pos
          
          // Walk up to find block boundary
          for (let d = $pos.depth; d > 0; d--) {
            if ($pos.node(d).isBlock) {
              targetPos = $pos.before(d)
              break
            }
          }
          
          // Don't move to same position
          if (blockPos === targetPos || (blockPos < targetPos && targetPos < blockPos + nodeSize)) {
            view.dispatch(
              view.state.tr.setMeta(dragDropKey, { dropTargetPos: null })
            )
            return true
          }
          
          // Get the node to move
          const node = view.state.doc.nodeAt(blockPos)
          if (!node) return false
          
          // Perform the move
          const tr = view.state.tr
          
          // Delete from source
          tr.delete(blockPos, blockPos + nodeSize)
          
          // Adjust target position if needed
          const mappedPos = tr.mapping.map(targetPos)
          
          // Insert at target
          tr.insert(mappedPos, node)
          
          // Clear drop indicator
          tr.setMeta(dragDropKey, { dropTargetPos: null })
          
          view.dispatch(tr)
          
          // Focus the moved block
          setTimeout(() => {
            view.focus()
            const newPos = mappedPos + 1
            view.dispatch(view.state.tr.setSelection(
              TextSelection.near(view.state.doc.resolve(newPos))
            ))
          }, 50)
          
          return true
        },
        
        dragleave(view) {
          view.dispatch(
            view.state.tr.setMeta(dragDropKey, { dropTargetPos: null })
          )
          return false
        },
        
        dragend(view) {
          view.dispatch(
            view.state.tr.setMeta(dragDropKey, { dropTargetPos: null })
          )
          return false
        }
      }
    }
  })
} 