import { useState, useRef, useEffect } from 'react'
import {
  GripVertical,
  Plus,
  Copy,
  Trash2,
  ChevronDown,
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code
} from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Editor } from '@tiptap/core'

interface BlockHandleProps {
  editor: Editor
  blockPos: number
  blockNode: any
}

const BLOCK_TYPES = [
  { type: 'paragraph', icon: Type, label: 'Text' },
  { type: 'heading', level: 1, icon: Heading1, label: 'Heading 1' },
  { type: 'heading', level: 2, icon: Heading2, label: 'Heading 2' },
  { type: 'heading', level: 3, icon: Heading3, label: 'Heading 3' },
  { type: 'bulletList', icon: List, label: 'Bullet List' },
  { type: 'orderedList', icon: ListOrdered, label: 'Numbered List' },
  { type: 'blockquote', icon: Quote, label: 'Quote' },
  { type: 'codeBlock', icon: Code, label: 'Code' },
]

export function BlockHandle({ editor, blockPos, blockNode }: BlockHandleProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const isDraggingRef = useRef(false)
  const dragHandleRef = useRef<HTMLButtonElement>(null)

  const handleDragStart = (e: React.DragEvent) => {
    isDraggingRef.current = true;
    editor.view.dom.classList.add('is-dragging')
    const slice = editor.state.doc.slice(blockPos, blockPos + blockNode.nodeSize)
    e.dataTransfer.setData('application/vnd.tiptap-block', JSON.stringify({ 
      pos: blockPos, 
      content: slice.toJSON() 
    }))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    isDraggingRef.current = false;
    // Cleanup is handled by the plugin's dragend event
  }
  
  const handleAddBlock = () => {
    const endPos = blockPos + blockNode.nodeSize
    editor.chain().focus().insertContentAt(endPos, { type: 'paragraph' }).run()
    setMenuOpen(false)
  }

  const handleDuplicate = () => {
    const endPos = blockPos + blockNode.nodeSize
    const content = editor.state.doc.slice(blockPos, endPos)
    editor.chain().focus().insertContentAt(endPos, content.toJSON()).run()
    setMenuOpen(false)
  }

  const handleDelete = () => {
    editor.chain().focus().deleteRange({ from: blockPos, to: blockPos + blockNode.nodeSize }).run()
    setMenuOpen(false)
  }

  const handleConvertBlock = (type: string, attrs?: any) => {
    const { from } = { from: blockPos }
    
    if (type === 'bulletList' || type === 'orderedList') {
      editor.chain().focus().setNodeSelection(from).toggleList(type as any, 'listItem').run()
    } else {
      editor.chain().focus().setNodeSelection(from).setNode(type, attrs).run()
    }
    setMenuOpen(false)
  }

  const currentBlockType = blockNode.type.name
  const currentLevel = blockNode.attrs?.level

  // Prevents the menu from opening on drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      isDraggingRef.current = false;
    }
  };

  // If the mouse didn't move, it's a click, so open the menu.
  const handleClick = () => {
    if (!isDraggingRef.current) {
      setMenuOpen(true);
    }
  };

  return (
    <div className="block-handle" onMouseDown={handleMouseDown}>
      <DropdownMenu.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenu.Trigger asChild>
          <button
            ref={dragHandleRef}
            className="handle-button drag-handle"
            draggable="true"
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={handleClick}
            data-drag-handle
            title="Drag to move, click for options"
          >
            <GripVertical size={18} />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content 
            className="dropdown-content" 
            align="start" 
            sideOffset={10}
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <DropdownMenu.Item className="dropdown-item" onClick={handleAddBlock}>
              <Plus size={16} />
              <span>Add block below</span>
            </DropdownMenu.Item>

            <DropdownMenu.Item className="dropdown-item" onClick={handleDuplicate}>
              <Copy size={16} />
              <span>Duplicate</span>
            </DropdownMenu.Item>

            <DropdownMenu.Item 
              className="dropdown-item dropdown-item-danger" 
              onClick={handleDelete}
            >
              <Trash2 size={16} />
              <span>Delete</span>
            </DropdownMenu.Item>

            <DropdownMenu.Separator className="dropdown-separator" />

            <DropdownMenu.Label className="dropdown-label">
              Convert to
            </DropdownMenu.Label>

            {BLOCK_TYPES.map((blockType) => {
              const isActive = currentBlockType === blockType.type && 
                             (!blockType.level || currentLevel === blockType.level)
              
              return (
                <DropdownMenu.Item
                  key={`${blockType.type}-${blockType.level || ''}`}
                  className={`dropdown-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleConvertBlock(
                    blockType.type, 
                    blockType.level ? { level: blockType.level } : undefined
                  )}
                >
                  <blockType.icon size={16} />
                  <span>{blockType.label}</span>
                  {isActive && <ChevronDown size={16} className="ml-auto" />}
                </DropdownMenu.Item>
              )
            })}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}