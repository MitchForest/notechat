import { useState } from 'react'
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
  Code,
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

  const handleAddBlock = () => {
    const endPos = blockPos + blockNode.nodeSize
    editor.chain().focus().insertContentAt(endPos, { type: 'paragraph' }).run()
  }

  const handleDuplicate = () => {
    const endPos = blockPos + blockNode.nodeSize
    const content = editor.state.doc.slice(blockPos, endPos)
    editor.chain().focus().insertContentAt(endPos, content.toJSON()).run()
    setMenuOpen(false)
  }

  const handleDelete = () => {
    editor
      .chain()
      .focus()
      .deleteRange({ from: blockPos, to: blockPos + blockNode.nodeSize })
      .run()
    setMenuOpen(false)
  }

  const handleConvertBlock = (type: string, attrs?: any) => {
    if (type === 'bulletList' || type === 'orderedList') {
      editor.chain().focus().toggleList(type as 'bulletList' | 'orderedList', 'listItem').run()
    } else {
      editor.chain().focus().setNodeSelection(blockPos).setNode(type as any, attrs).run()
    }
    setMenuOpen(false)
  }

  const currentBlockType = blockNode.type.name
  const currentLevel = blockNode.attrs?.level

  return (
    <div className="block-handle" draggable={false}>
      <button
        className="handle-button add-button"
        onClick={handleAddBlock}
        title="Add block below"
      >
        <Plus size={18} />
      </button>

      {/* The drag handle is a separate, underlying element */}
      <div
        className="handle-button drag-handle"
        draggable
        data-drag-handle
      >
        <GripVertical size={18} />
      </div>

      {/* The menu trigger sits on top of the drag handle */}
      <DropdownMenu.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenu.Trigger asChild>
          <button
            className="handle-button menu-trigger"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setMenuOpen(true)
            }}
          >
            <GripVertical size={18} />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="dropdown-content"
            align="start"
            sideOffset={10}
            style={{ zIndex: 100 }}
          >
            {/* Action Items */}
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

            {/* Convert To Section */}
            <DropdownMenu.Label className="dropdown-label">
              Convert to
            </DropdownMenu.Label>

            {BLOCK_TYPES.map((blockType) => {
              const isActive =
                currentBlockType === blockType.type &&
                (!blockType.level || currentLevel === blockType.level)

              return (
                <DropdownMenu.Item
                  key={`${blockType.type}-${blockType.level || ''}`}
                  className={`dropdown-item ${isActive ? 'active' : ''}`}
                  onClick={() =>
                    handleConvertBlock(
                      blockType.type,
                      blockType.level ? { level: blockType.level } : undefined
                    )
                  }
                >
                  <blockType.icon size={16} />
                  <span>{blockType.label}</span>
                  {isActive && <ChevronDown size={16} />}
                </DropdownMenu.Item>
              )
            })}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}