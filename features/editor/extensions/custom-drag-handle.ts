import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { EditorView } from '@tiptap/pm/view'
import { NodeSelection } from '@tiptap/pm/state'

export interface DragHandleOptions {
  dragHandleWidth: number
}

const dragHandlePluginKey = new PluginKey('customDragHandle')

export const CustomDragHandle = Extension.create<DragHandleOptions>({
  name: 'customDragHandle',

  addOptions() {
    return {
      dragHandleWidth: 24,
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: dragHandlePluginKey,
        view: (view) => new DragHandleView(view, this.options),
      }),
    ]
  },
})

class DragHandleView {
  private view: EditorView
  private dragHandleElement: HTMLElement
  private options: DragHandleOptions
  private hideTimeout: NodeJS.Timeout | null = null
  private isDragging = false

  constructor(view: EditorView, options: DragHandleOptions) {
    this.view = view
    this.options = options
    
    // Create drag handle element
    this.dragHandleElement = this.createDragHandle()
    
    // Add to editor
    const container = view.dom.parentElement
    if (container) {
      container.style.position = 'relative'
      container.appendChild(this.dragHandleElement)
    }
    
    // Bind event handlers
    this.handleMouseMove = this.handleMouseMove.bind(this)
    this.handleMouseLeave = this.handleMouseLeave.bind(this)
    this.handleDragStart = this.handleDragStart.bind(this)
    this.handleDragEnd = this.handleDragEnd.bind(this)
    
    // Add event listeners
    view.dom.addEventListener('mousemove', this.handleMouseMove)
    view.dom.addEventListener('mouseleave', this.handleMouseLeave)
    this.dragHandleElement.addEventListener('dragstart', this.handleDragStart)
    this.dragHandleElement.addEventListener('dragend', this.handleDragEnd)
  }

  private createDragHandle(): HTMLElement {
    const handle = document.createElement('div')
    handle.className = 'custom-drag-handle'
    handle.draggable = true
    handle.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <circle cx="4" cy="4" r="1.5"/>
        <circle cx="4" cy="8" r="1.5"/>
        <circle cx="4" cy="12" r="1.5"/>
        <circle cx="12" cy="4" r="1.5"/>
        <circle cx="12" cy="8" r="1.5"/>
        <circle cx="12" cy="12" r="1.5"/>
      </svg>
    `
    handle.style.position = 'absolute'
    handle.style.display = 'none'
    handle.style.cursor = 'grab'
    return handle
  }

  private handleMouseMove(event: MouseEvent) {
    if (this.isDragging) return
    
    // Clear any pending hide
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout)
      this.hideTimeout = null
    }
    
    const { clientX, clientY } = event
    const pos = this.view.posAtCoords({ left: clientX, top: clientY })
    
    if (!pos) {
      this.hideDragHandle()
      return
    }
    
    const $pos = this.view.state.doc.resolve(pos.pos)
    const node = this.findBlockNode($pos)
    
    if (node) {
      this.showDragHandleAt(node.pos)
    } else {
      this.hideDragHandle()
    }
  }

  private handleMouseLeave() {
    if (!this.isDragging) {
      this.hideTimeout = setTimeout(() => {
        this.hideDragHandle()
      }, 300)
    }
  }

  private handleDragStart(event: DragEvent) {
    this.isDragging = true
    this.dragHandleElement.style.cursor = 'grabbing'
    
    const pos = parseInt(this.dragHandleElement.dataset.nodePos || '-1')
    if (pos < 0) return
    
    const node = this.view.state.doc.nodeAt(pos)
    if (!node) return
    
    const nodeSize = node.nodeSize
    const selection = NodeSelection.create(this.view.state.doc, pos)
    
    this.view.dispatch(
      this.view.state.tr.setSelection(selection)
    )
    
    // Store drag data
    event.dataTransfer!.effectAllowed = 'move'
    event.dataTransfer!.setData('text/html', '')
    
    // Store the position for drop handling
    this.view.dragging = {
      slice: selection.content(),
      move: true,
    }
  }

  private handleDragEnd() {
    this.isDragging = false
    this.dragHandleElement.style.cursor = 'grab'
  }

  private findBlockNode($pos: any): { pos: number; node: any } | null {
    // Walk up the tree to find a block node
    for (let depth = $pos.depth; depth > 0; depth--) {
      const node = $pos.node(depth)
      if (node.type.isBlock && !node.type.isTextblock) continue
      
      if (node.type.isBlock) {
        const pos = $pos.before(depth)
        return { pos, node }
      }
    }
    
    // Check the node at the position itself
    const node = this.view.state.doc.nodeAt($pos.pos)
    if (node && node.type.isBlock) {
      return { pos: $pos.pos, node }
    }
    
    return null
  }

  private showDragHandleAt(pos: number) {
    const coords = this.view.coordsAtPos(pos)
    const editorRect = this.view.dom.getBoundingClientRect()
    
    // Calculate position relative to editor
    const top = coords.top - editorRect.top
    const left = -this.options.dragHandleWidth - 8 // 8px gap
    
    this.dragHandleElement.style.top = `${top}px`
    this.dragHandleElement.style.left = `${left}px`
    this.dragHandleElement.style.display = 'flex'
    this.dragHandleElement.dataset.nodePos = pos.toString()
  }

  private hideDragHandle() {
    this.dragHandleElement.style.display = 'none'
  }

  destroy() {
    this.view.dom.removeEventListener('mousemove', this.handleMouseMove)
    this.view.dom.removeEventListener('mouseleave', this.handleMouseLeave)
    this.dragHandleElement.removeEventListener('dragstart', this.handleDragStart)
    this.dragHandleElement.removeEventListener('dragend', this.handleDragEnd)
    
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout)
    }
    
    this.dragHandleElement.remove()
  }
} 