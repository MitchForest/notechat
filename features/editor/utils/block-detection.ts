import { Editor } from '@tiptap/core'
import { getBlockPosition } from '../extensions/block-id'

export interface BlockInfo {
  id: string
  pos: number
  element: HTMLElement
  rect: DOMRect
  relativeTop: number
  type: string
}

/**
 * Find the block element at a given mouse position
 */
export function findBlockAtPosition(
  event: MouseEvent,
  container: HTMLElement,
  editor: Editor
): BlockInfo | null {
  // Get element at mouse position
  const element = document.elementFromPoint(event.clientX, event.clientY)
  if (!element) return null
  
  // Find nearest block element with data-block-id
  const blockEl = element.closest('[data-block-id]') as HTMLElement
  if (!blockEl || !container.contains(blockEl)) return null
  
  const blockId = blockEl.getAttribute('data-block-id')
  if (!blockId) return null
  
  // Get block position in document
  const pos = getBlockPosition(editor, blockId)
  if (pos === null) return null
  
  // Get block bounds
  const rect = blockEl.getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()
  
  // Get block type
  const blockType = blockEl.getAttribute('data-block-type') || 'unknown'
  
  return {
    id: blockId,
    pos,
    element: blockEl,
    rect,
    relativeTop: rect.top - containerRect.top,
    type: blockType
  }
}

/**
 * Check if a point is within the hover zone of a block
 */
export function isInBlockHoverZone(
  point: { x: number; y: number },
  blockRect: DOMRect,
  containerRect: DOMRect,
  hoverZoneWidth: number = 100
): boolean {
  // Extend the hover zone to the left of the block
  const extendedLeft = containerRect.left - hoverZoneWidth
  const extendedRight = blockRect.right
  
  return (
    point.x >= extendedLeft &&
    point.x <= extendedRight &&
    point.y >= blockRect.top &&
    point.y <= blockRect.bottom
  )
}

/**
 * Get the block type from a node
 */
export function getBlockType(editor: Editor, pos: number): string {
  try {
    const node = editor.state.doc.nodeAt(pos)
    return node?.type.name || 'unknown'
  } catch {
    return 'unknown'
  }
} 