import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Editor } from '@tiptap/react'
import { BlockHandle } from './block-handle'
import { Node } from 'prosemirror-model'
import { findBlock } from '../utils/find-block'

const DATA_TRANSFER_KEY = 'application/x-prosemirror-drag'

interface BlockHandleContainerProps {
  editor: Editor
}

export function BlockHandleContainer({ editor }: BlockHandleContainerProps) {
  const portalContainerRef = useRef<HTMLElement | null>(null)
  const blockHandleRef = useRef<HTMLDivElement>(null)

  const [activeBlock, setActiveBlock] = useState<{
    pos: number
    node: Node
    dom: HTMLElement
  } | null>(null)
  
  const [show, setShow] = useState(false)
  const hideTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    portalContainerRef.current = document.getElementById('block-handle-portal-root')
  }, [])

  const handleShow = (block: { pos: number; node: Node; dom: HTMLElement }) => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current)
    setShow(true)
    setActiveBlock(block)
  }

  const handleHide = () => {
    hideTimeout.current = setTimeout(() => setShow(false), 100)
  }
  
  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!editor.isEditable || !editor.view.dom.parentElement?.contains(event.target as globalThis.Node)) {
        return
      }
      
      const block = findBlock(editor, event)
      if (block) handleShow(block)
    },
    [editor],
  )
  
  useEffect(() => {
    const editorViewDom = editor.view.dom.parentElement
    if (!editorViewDom) return;

    editorViewDom.addEventListener('mousemove', handleMouseMove)
    return () => editorViewDom.removeEventListener('mousemove', handleMouseMove)
  }, [editor, handleMouseMove])

  let top = -1000
  let left = -1000

  if (show && activeBlock && blockHandleRef.current) {
    const editorRect = editor.view.dom.getBoundingClientRect();
    const blockRect = activeBlock.dom.getBoundingClientRect();
    const handleHeight = blockHandleRef.current.offsetHeight;
    
    top = blockRect.top - editorRect.top + (blockRect.height / 2) - (handleHeight / 2);
    left = 12;
  }

  const handleDragStart = (event: React.DragEvent) => {
    if (activeBlock) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData(DATA_TRANSFER_KEY, activeBlock.pos.toString())
      const dragImage = activeBlock.dom.cloneNode(true) as HTMLElement
      dragImage.style.cssText = 'position: absolute; top: -1000px; padding: 4px 8px; background: hsl(var(--background)); border: 1px solid hsl(var(--border)); border-radius: 4px; width: ${activeBlock.dom.clientWidth}px;'
      document.body.appendChild(dragImage)
      event.dataTransfer.setDragImage(dragImage, 0, 0)
      setTimeout(() => document.body.removeChild(dragImage), 0)
    }
  }

  const handleDuplicate = () => {
    if (activeBlock) {
      const { pos, node } = activeBlock
      const endPos = pos + node.nodeSize
      editor.chain().focus().insertContentAt(endPos, node.toJSON()).run()
    }
  }

  const handleDelete = () => {
    if (activeBlock) {
      const { pos, node } = activeBlock
      editor.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).run()
    }
  }

  const handleAddBlock = () => {
    if (activeBlock) {
      const { pos, node } = activeBlock
      const endPos = pos + node.nodeSize
      editor.chain().focus().insertContentAt(endPos, { type: 'paragraph' }).setTextSelection(endPos + 1).run()
    }
  }
  
  if (!portalContainerRef.current) return null

  return createPortal(
    <div
      ref={blockHandleRef}
      className="block-handle-wrapper"
      onMouseEnter={() => (hideTimeout.current ? clearTimeout(hideTimeout.current) : null)}
      onMouseLeave={handleHide}
      style={{
        position: 'absolute',
        top: `${top}px`,
        left: `${left}px`,
        opacity: show ? 1 : 0,
        pointerEvents: show ? 'auto' : 'none',
        transition: 'opacity 0.1s ease-in-out, top 0.1s ease-in-out',
        zIndex: 100
      }}
    >
      <BlockHandle
        onDragStart={handleDragStart}
        onAddBlock={handleAddBlock}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
      />
    </div>,
    portalContainerRef.current
  )
}
