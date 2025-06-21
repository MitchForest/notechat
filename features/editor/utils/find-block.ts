import { Editor } from '@tiptap/core'
import { Node } from 'prosemirror-model'

export function findBlock(
  editor: Editor,
  event: MouseEvent
): { pos: number; node: Node; dom: HTMLElement } | null {
  const { clientX, clientY } = event
  const { view } = editor

  // Get position from coordinates
  const viewPos = view.posAtCoords({ left: clientX, top: clientY })
  if (!viewPos) return null

  const { pos } = viewPos
  const $pos = view.state.doc.resolve(pos)

  // Find the closest block node
  for (let depth = $pos.depth; depth > 0; depth--) {
    const node = $pos.node(depth)
    
    if (node.type.isBlock && node.type.name !== 'doc') {
      // Get the position before this node
      const nodePos = $pos.before(depth)
      
      // Get the DOM element for this node
      const dom = view.nodeDOM(nodePos) as HTMLElement
      if (!dom) continue

      // Verify the mouse is actually over this block
      const rect = dom.getBoundingClientRect()
      if (
        clientX >= rect.left - 60 && // Include handle area
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        return { pos: nodePos, node, dom }
      }
    }
  }

  return null
} 