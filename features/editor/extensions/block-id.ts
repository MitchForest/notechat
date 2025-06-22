import { Extension } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'

/**
 * Generates a unique block ID
 */
export function generateBlockId(): string {
  return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * BlockId Extension
 * 
 * Adds unique IDs to all block-level nodes for reliable identification
 * and tracking across operations like drag-and-drop.
 */
export const BlockId = Extension.create({
  name: 'blockId',
  
  addGlobalAttributes() {
    return [
      {
        // Apply to all block types
        types: [
          'paragraph',
          'heading', 
          'codeBlock',
          'blockquote',
          'listItem',
          'taskItem'
        ],
        attributes: {
          blockId: {
            default: null,
            parseHTML: element => element.getAttribute('data-block-id'),
            renderHTML: attributes => {
              if (!attributes.blockId) {
                attributes.blockId = generateBlockId()
              }
              return { 'data-block-id': attributes.blockId }
            }
          }
        }
      }
    ]
  },
  
  addProseMirrorPlugins() {
    return [
      new Plugin({
        appendTransaction(transactions, oldState, newState) {
          // Check if any transaction added new content
          const docChanged = transactions.some(tr => tr.docChanged)
          if (!docChanged) return null
          
          let modified = false
          const tr = newState.tr
          
          // Walk through all nodes and ensure they have block IDs
          newState.doc.descendants((node, pos) => {
            if (node.isBlock && !node.isLeaf) {
              const types = [
                'paragraph',
                'heading',
                'codeBlock', 
                'blockquote',
                'listItem',
                'taskItem'
              ]
              
              if (types.includes(node.type.name) && !node.attrs.blockId) {
                tr.setNodeMarkup(pos, null, {
                  ...node.attrs,
                  blockId: generateBlockId()
                })
                modified = true
              }
            }
          })
          
          return modified ? tr : null
        }
      })
    ]
  }
})

/**
 * Helper function to find a block by its ID
 */
export function findBlockById(doc: any, blockId: string): { node: any; pos: number } | null {
  let result: { node: any; pos: number } | null = null
  
  doc.descendants((node: any, pos: number) => {
    if (node.attrs?.blockId === blockId) {
      result = { node, pos }
      return false // Stop searching
    }
  })
  
  return result
}

/**
 * Helper function to get block position by ID
 */
export function getBlockPosition(editor: any, blockId: string): number | null {
  const result = findBlockById(editor.state.doc, blockId)
  return result ? result.pos : null
} 