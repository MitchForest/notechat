import { Extension } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'
import { NodeSelection } from '@tiptap/pm/state'
import { EditorView } from '@tiptap/pm/view'

export interface BlockDragHandleOptions {
  /**
   * The width of the drag handle
   */
  handleWidth?: number
  
  /**
   * The offset from the left edge of the editor
   */
  horizontalOffset?: number
  
  /**
   * Delay before hiding the handle (ms)
   */
  hideDelay?: number
  
  /**
   * Throttle mousemove events (ms)
   */
  throttleDelay?: number
}

export const BlockDragHandle = Extension.create<BlockDragHandleOptions>({
  name: 'blockDragHandle',

  addOptions() {
    return {
      handleWidth: 20,
      horizontalOffset: 30,
      hideDelay: 100,
      throttleDelay: 16, // ~60fps
    }
  },

  addProseMirrorPlugins() {
    const options = this.options
    
    return [
      new Plugin({
        view(editorView) {
          return new BlockDragHandleView(editorView, options)
        }
      })
    ]
  }
})

class BlockDragHandleView {
  private view: EditorView
  private options: BlockDragHandleOptions
  private handle: HTMLElement
  private dropIndicator: HTMLElement
  private hideTimeout: NodeJS.Timeout | null = null
  private moveThrottle: NodeJS.Timeout | null = null
  private currentBlockPos: number | null = null
  private draggedBlockPos: number | null = null
  private isOverHandle = false

  constructor(view: EditorView, options: BlockDragHandleOptions) {
    this.view = view
    this.options = options
    
    // Create drag handle element
    this.handle = this.createHandle()
    
    // Create drop indicator
    this.dropIndicator = this.createDropIndicator()
    
    // Append to body for fixed positioning
    document.body.appendChild(this.handle)
    document.body.appendChild(this.dropIndicator)
    
    // Bind event handlers
    this.handleMouseMove = this.handleMouseMove.bind(this)
    this.handleMouseLeave = this.handleMouseLeave.bind(this)
    this.handleDragStart = this.handleDragStart.bind(this)
    this.handleDragEnd = this.handleDragEnd.bind(this)
    this.handleDragOver = this.handleDragOver.bind(this)
    this.handleDrop = this.handleDrop.bind(this)
    
    // Add event listeners
    this.view.dom.addEventListener('mousemove', this.handleMouseMove)
    this.view.dom.addEventListener('mouseleave', this.handleMouseLeave)
    this.view.dom.addEventListener('dragover', this.handleDragOver)
    this.view.dom.addEventListener('drop', this.handleDrop)
    this.view.dom.addEventListener('dragleave', () => {
      this.dropIndicator.style.display = 'none'
    })
  }

  private createHandle(): HTMLElement {
    const handle = document.createElement('div')
    handle.className = 'block-drag-handle'
    handle.draggable = true
    
    // Drag handle icon (6 dots)
    handle.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <circle cx="5" cy="4" r="1.5"/>
        <circle cx="5" cy="8" r="1.5"/>
        <circle cx="5" cy="12" r="1.5"/>
        <circle cx="11" cy="4" r="1.5"/>
        <circle cx="11" cy="8" r="1.5"/>
        <circle cx="11" cy="12" r="1.5"/>
      </svg>
    `
    
    // Initial styles
    handle.style.cssText = `
      position: fixed;
      width: ${this.options.handleWidth}px;
      height: ${this.options.handleWidth}px;
      display: none;
      z-index: 1000;
      cursor: grab;
      user-select: none;
      padding: 4px;
      margin: -4px;
    `
    
    // Handle events
    handle.addEventListener('mouseenter', () => {
      this.isOverHandle = true
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout)
        this.hideTimeout = null
      }
    })
    
    handle.addEventListener('mouseleave', () => {
      this.isOverHandle = false
      this.scheduleHide()
    })
    
    handle.addEventListener('dragstart', this.handleDragStart)
    handle.addEventListener('dragend', this.handleDragEnd)
    
    return handle
  }

  private createDropIndicator(): HTMLElement {
    const indicator = document.createElement('div')
    indicator.className = 'block-drop-indicator'
    indicator.style.cssText = `
      position: fixed;
      height: 2px;
      background: rgb(59, 130, 246);
      display: none;
      pointer-events: none;
      z-index: 999;
      left: 0;
      right: 0;
    `
    return indicator
  }

  private handleMouseMove(event: MouseEvent) {
    // Throttle mousemove events
    if (this.moveThrottle) return
    
    this.moveThrottle = setTimeout(() => {
      this.moveThrottle = null
      this.updateHandlePosition(event)
    }, this.options.throttleDelay)
  }

  private updateHandlePosition(event: MouseEvent) {
    const pos = this.view.posAtCoords({
      left: event.clientX,
      top: event.clientY
    })
    
    if (!pos) {
      this.hideHandle()
      return
    }
    
    const $pos = this.view.state.doc.resolve(pos.pos)
    const blockInfo = this.findBlockNode($pos)
    
    if (!blockInfo) {
      this.hideHandle()
      return
    }
    
    // Cancel any pending hide
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout)
      this.hideTimeout = null
    }
    
    this.currentBlockPos = blockInfo.pos
    this.showHandleAt(blockInfo.pos)
  }

  private findBlockNode($pos: any): { pos: number; node: any } | null {
    // Walk up the tree to find a block node
    for (let depth = $pos.depth; depth > 0; depth--) {
      const node = $pos.node(depth)
      if (node.type.isBlock && node.type.name !== 'doc') {
        return {
          pos: $pos.before(depth),
          node
        }
      }
    }
    
    // Check if we're in a top-level block
    const node = $pos.parent
    if (node.type.isBlock && node.type.name !== 'doc') {
      return {
        pos: $pos.before($pos.depth),
        node
      }
    }
    
    return null
  }

  private showHandleAt(pos: number) {
    const coords = this.view.coordsAtPos(pos)
    const editorRect = this.view.dom.getBoundingClientRect()
    
    // Get the actual block DOM node to find its content area
    const blockNode = this.view.nodeDOM(pos)
    if (blockNode instanceof HTMLElement) {
      const blockRect = blockNode.getBoundingClientRect()
      
      // Position handle just to the left of the block content
      // The block has padding-left: 120px, so we position at blockRect.left + some offset
      this.handle.style.left = `${blockRect.left + 60}px` // Position in the margin area
      this.handle.style.top = `${coords.top}px`
      this.handle.style.display = 'flex'
      this.handle.classList.add('visible')
    } else {
      // Fallback to editor-relative positioning
      this.handle.style.left = `${editorRect.left + 60}px`
      this.handle.style.top = `${coords.top}px`
      this.handle.style.display = 'flex'
      this.handle.classList.add('visible')
    }
  }

  private hideHandle() {
    this.handle.style.display = 'none'
    this.handle.classList.remove('visible')
    this.currentBlockPos = null
  }

  private scheduleHide() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout)
    }
    
    this.hideTimeout = setTimeout(() => {
      if (!this.isOverHandle) {
        this.hideHandle()
      }
    }, this.options.hideDelay)
  }

  private handleMouseLeave() {
    this.scheduleHide()
  }

  private handleDragStart(event: DragEvent) {
    if (this.currentBlockPos === null) return
    
    this.draggedBlockPos = this.currentBlockPos
    
    // Select the block being dragged
    const nodeSelection = NodeSelection.create(
      this.view.state.doc,
      this.currentBlockPos
    )
    
    this.view.dispatch(
      this.view.state.tr.setSelection(nodeSelection)
    )
    
    // Set drag data
    event.dataTransfer!.effectAllowed = 'move'
    event.dataTransfer!.setData('text/plain', '')
    
    // Update handle appearance
    this.handle.style.cursor = 'grabbing'
    this.handle.classList.add('dragging')
    this.view.dom.classList.add('dragging')
  }

  private handleDragEnd() {
    this.draggedBlockPos = null
    this.handle.style.cursor = 'grab'
    this.handle.classList.remove('dragging')
    this.view.dom.classList.remove('dragging')
    this.dropIndicator.style.display = 'none'
  }

  private handleDragOver(event: DragEvent) {
    if (this.draggedBlockPos === null) return
    
    event.preventDefault()
    event.dataTransfer!.dropEffect = 'move'
    
    const pos = this.view.posAtCoords({
      left: event.clientX,
      top: event.clientY
    })
    
    if (!pos) {
      this.dropIndicator.style.display = 'none'
      return
    }
    
    const $pos = this.view.state.doc.resolve(pos.pos)
    const dropInfo = this.findDropPosition($pos)
    
    if (dropInfo) {
      this.showDropIndicator(dropInfo.pos)
    }
  }

  private findDropPosition($pos: any): { pos: number } | null {
    // Find the nearest block boundary for dropping
    const blockInfo = this.findBlockNode($pos)
    if (!blockInfo) return null
    
    // Determine if we should drop before or after the block
    const coords = this.view.coordsAtPos(blockInfo.pos)
    const nodeDom = this.view.nodeDOM(blockInfo.pos)
    const blockHeight = nodeDom instanceof HTMLElement ? nodeDom.getBoundingClientRect().height : 0
    
    // If we're in the bottom half of the block, drop after
    const dropAfter = $pos.pos > blockInfo.pos + blockInfo.node.nodeSize / 2
    
    return {
      pos: dropAfter ? blockInfo.pos + blockInfo.node.nodeSize : blockInfo.pos
    }
  }

  private showDropIndicator(pos: number) {
    const coords = this.view.coordsAtPos(pos)
    const editorRect = this.view.dom.getBoundingClientRect()
    
    // Try to get the nearest block to align the indicator properly
    const $pos = this.view.state.doc.resolve(Math.max(0, pos - 1))
    const blockInfo = this.findBlockNode($pos)
    
    if (blockInfo) {
      const blockNode = this.view.nodeDOM(blockInfo.pos)
      if (blockNode instanceof HTMLElement) {
        const blockRect = blockNode.getBoundingClientRect()
        // Align with the content area (accounting for 120px left padding)
        this.dropIndicator.style.left = `${blockRect.left + 120}px`
        this.dropIndicator.style.width = `${blockRect.width - 240}px` // Subtract padding from both sides
      } else {
        // Fallback
        this.dropIndicator.style.left = `${editorRect.left + 120}px`
        this.dropIndicator.style.width = `${editorRect.width - 240}px`
      }
    } else {
      // Fallback
      this.dropIndicator.style.left = `${editorRect.left + 120}px`
      this.dropIndicator.style.width = `${editorRect.width - 240}px`
    }
    
    this.dropIndicator.style.top = `${coords.top - 1}px`
    this.dropIndicator.style.display = 'block'
  }

  private handleDrop(event: DragEvent) {
    if (this.draggedBlockPos === null) return
    
    event.preventDefault()
    
    const dropPos = this.view.posAtCoords({
      left: event.clientX,
      top: event.clientY
    })
    
    if (!dropPos) return
    
    const $dropPos = this.view.state.doc.resolve(dropPos.pos)
    const dropInfo = this.findDropPosition($dropPos)
    
    if (!dropInfo) return
    
    // Get the dragged node
    const draggedNode = this.view.state.doc.nodeAt(this.draggedBlockPos)
    if (!draggedNode) return
    
    // Calculate the size of the dragged content
    const draggedSize = draggedNode.nodeSize
    
    // Perform the move
    const tr = this.view.state.tr
    
    // Delete from original position
    tr.delete(this.draggedBlockPos, this.draggedBlockPos + draggedSize)
    
    // Adjust target position if it's after the deleted content
    let targetPos = dropInfo.pos
    if (targetPos > this.draggedBlockPos) {
      targetPos -= draggedSize
    }
    
    // Insert at new position
    tr.insert(targetPos, draggedNode)
    
    this.view.dispatch(tr)
    
    // Clean up
    this.handleDragEnd()
  }

  destroy() {
    // Remove event listeners
    this.view.dom.removeEventListener('mousemove', this.handleMouseMove)
    this.view.dom.removeEventListener('mouseleave', this.handleMouseLeave)
    this.view.dom.removeEventListener('dragover', this.handleDragOver)
    this.view.dom.removeEventListener('drop', this.handleDrop)
    
    // Clear timeouts
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout)
    }
    if (this.moveThrottle) {
      clearTimeout(this.moveThrottle)
    }
    
    // Remove elements
    this.handle.remove()
    this.dropIndicator.remove()
  }
} 