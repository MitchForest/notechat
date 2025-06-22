import { Extension, RawCommands } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'
import type { GhostTextStorage } from '../types/ghost-text'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    ghostText: {
      setGhostText: (text: string, position: number) => ReturnType
      clearGhostText: () => ReturnType
    }
  }
}

const ghostTextKey = new PluginKey('ghostText')

export const GhostText = Extension.create({
  name: 'ghostText',

  addStorage() {
    return {
      ghostText: '',
      isActive: false,
      position: null,
      triggerTimeout: undefined
    } as GhostTextStorage
  },

  addProseMirrorPlugins() {
    const extension = this

    return [
      new Plugin({
        key: ghostTextKey,

        state: {
          init: () => {
            return { decorations: DecorationSet.empty }
          },

          apply(tr, value, oldState, newState) {
            const storage = extension.storage as GhostTextStorage
            const meta = tr.getMeta('ghostTextUpdate')

            // Handle explicit updates
            if (meta === true) {
              if (storage.isActive && storage.ghostText && storage.position !== null) {
                try {
                  const decoration = Decoration.inline(
                    storage.position,
                    storage.position,
                    {
                      class: 'ghost-text',
                      'data-text': storage.ghostText,
                    },
                    { inclusiveStart: true, inclusiveEnd: false }
                  )
                  
                  const decorations = DecorationSet.create(newState.doc, [decoration])
                  return { decorations }
                } catch (e) {
                  return { decorations: DecorationSet.empty }
                }
              } else {
                return { decorations: DecorationSet.empty }
              }
            }
            
            // For document changes, check if we need to adjust/clear
            if (tr.docChanged) {
              // Map existing decorations through the change
              const mapped = value.decorations.map(tr.mapping, newState.doc)
              
              // If we have active ghost text, check if position is still valid
              if (storage.isActive && storage.position !== null) {
                const mappedPos = tr.mapping.map(storage.position)
                if (mappedPos !== storage.position) {
                  // Position changed, update storage and clear
                  storage.position = null
                  storage.isActive = false
                  ;(extension.editor as any).emit('ghostTextReject')
                  return { decorations: DecorationSet.empty }
                }
              }
              
              return { decorations: mapped }
            }
            
            // Check if cursor moved away
            if (storage.isActive && storage.position !== null) {
              const { from } = newState.selection
              if (from !== storage.position && from !== storage.position + 1) {
                ;(extension.editor as any).emit('ghostTextReject')
                return { decorations: DecorationSet.empty }
              }
            }
            
            // No changes, return existing decorations
            return value
          }
        },

        props: {
          decorations(state) {
            return ghostTextKey.getState(state)?.decorations || DecorationSet.empty
          },

          handleTextInput(view, from, to, text) {
            // Don't process if editor is read-only (e.g., during drag)
            if (!view.editable) return false
            
            const { state } = view
            const storage = extension.storage as GhostTextStorage

            if (storage.isActive) {
              ;(extension.editor as any).emit('ghostTextReject')
              return false
            }

            if (text === '+') {
              const before = state.doc.textBetween(Math.max(0, from - 1), from)

              if (before === '+') {
                // Clear any existing timeout
                if (storage.triggerTimeout) {
                  clearTimeout(storage.triggerTimeout)
                }
                
                const tr = state.tr.delete(from - 1, to)
                view.dispatch(tr)

                // Debounce the trigger
                storage.triggerTimeout = setTimeout(() => {
                  const contextStart = Math.max(0, from - 500)
                  const context = state.doc.textBetween(contextStart, from - 1)

                  ;(extension.editor as any).emit('ghostTextTrigger', {
                    position: from - 1,
                    context
                  })
                }, 100) // 100ms delay to prevent duplicate calls

                return true
              }
            }

            return false
          },

          handleKeyDown(view, event) {
            const storage = extension.storage as GhostTextStorage

            if (!storage.isActive) return false

            if (event.key === 'Tab') {
              event.preventDefault()
              ;(extension.editor as any).emit('ghostTextAccept', storage.ghostText)
              return true
            }

            if (event.key === 'Escape') {
              event.preventDefault()
              ;(extension.editor as any).emit('ghostTextReject')
              return true
            }

            if (event.ctrlKey || event.metaKey || event.altKey) {
              return false
            }

            if (event.key.startsWith('Arrow')) {
              return false
            }

            return false
          }
        }
      })
    ]
  },

  addCommands(): Partial<RawCommands> {
    return {
      setGhostText:
        (text: string, position: number) =>
        ({ editor, dispatch }) => {
          const storage = this.storage as GhostTextStorage
          storage.ghostText = text
          storage.position = position
          storage.isActive = true

          // Always dispatch the transaction
          if (dispatch) {
            const tr = editor.state.tr.setMeta('ghostTextUpdate', true)
            dispatch(tr)
          }

          return true
        },

      clearGhostText:
        () =>
        ({ editor, dispatch }) => {
          const storage = this.storage as GhostTextStorage
          const wasActive = storage.isActive
          
          storage.ghostText = ''
          storage.isActive = false
          storage.position = null

          // Clear any pending timeout
          if (storage.triggerTimeout) {
            clearTimeout(storage.triggerTimeout)
            storage.triggerTimeout = undefined
          }

          // Only dispatch if we were actually active
          if (dispatch && wasActive) {
            const tr = editor.state.tr.setMeta('ghostTextUpdate', true)
            dispatch(tr)
          }

          return true
        }
    }
  }
}) 