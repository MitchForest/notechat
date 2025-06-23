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
                  console.log('[GhostText] Creating widget decoration at position:', storage.position, 'with text:', storage.ghostText)
                  
                  // Use widget decoration instead of inline
                  const decoration = Decoration.widget(
                    storage.position,
                    () => {
                      const span = document.createElement('span')
                      span.className = 'ghost-text-widget'
                      span.textContent = storage.ghostText
                      span.setAttribute('data-ghost-text', 'true')
                      span.style.color = 'var(--muted-foreground)'
                      span.style.opacity = '0.6'
                      span.style.fontStyle = 'italic'
                      span.style.pointerEvents = 'none'
                      span.style.marginLeft = '1px'
                      return span
                    },
                    { side: 1 } // Place after cursor
                  )
                  
                  const decorations = DecorationSet.create(newState.doc, [decoration])
                  console.log('[GhostText] Decorations created:', decorations)
                  return { decorations }
                } catch (e) {
                  console.error('[GhostText] Error creating decoration:', e)
                  return { decorations: DecorationSet.empty }
                }
              } else {
                console.log('[GhostText] Clearing decorations - isActive:', storage.isActive, 'ghostText:', storage.ghostText, 'position:', storage.position)
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

            // If ghost text is active and user types any character, reject it
            if (storage.isActive) {
              console.log('[GhostText] User typed while ghost text active, rejecting')
              ;(extension.editor as any).emit('ghostTextReject')
              return false // Let the character be typed
            }

            if (text === '+') {
              const before = state.doc.textBetween(Math.max(0, from - 1), from)

              if (before === '+') {
                console.log('[GhostText] Detected ++ trigger at position:', from)
                
                // Clear any existing timeout
                if (storage.triggerTimeout) {
                  clearTimeout(storage.triggerTimeout)
                }
                
                const tr = state.tr.delete(from - 1, to)
                view.dispatch(tr)

                // Debounce the trigger
                storage.triggerTimeout = setTimeout(() => {
                  // Get the current paragraph's text only
                  const $pos = state.doc.resolve(from - 1)
                  const paragraph = $pos.parent
                  const paragraphStart = $pos.start()
                  const positionInParagraph = from - 1 - paragraphStart
                  
                  // Get context from current paragraph only (up to the trigger position)
                  const context = paragraph.textBetween(0, Math.min(positionInParagraph, paragraph.content.size))
                  
                  console.log('[GhostText] Triggering with paragraph context:', context)
                  console.log('[GhostText] Paragraph start:', paragraphStart, 'Position in paragraph:', positionInParagraph)
                  
                  ;(extension.editor as any).emit('ghostTextTrigger', {
                    position: from - 1,
                    context: context.trim()
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

            // Tab accepts
            if (event.key === 'Tab') {
              event.preventDefault()
              console.log('[GhostText] Tab pressed, accepting')
              ;(extension.editor as any).emit('ghostTextAccept', storage.ghostText)
              return true
            }

            // Escape or Enter rejects
            if (event.key === 'Escape' || event.key === 'Enter') {
              event.preventDefault()
              console.log('[GhostText] Escape/Enter pressed, rejecting')
              ;(extension.editor as any).emit('ghostTextReject')
              return true
            }

            // Any other character input rejects (except modifiers and special keys)
            if (!event.ctrlKey && !event.metaKey && !event.altKey && 
                event.key.length === 1 && !event.key.startsWith('Arrow')) {
              console.log('[GhostText] Character key pressed, rejecting')
              ;(extension.editor as any).emit('ghostTextReject')
              return false // Let the character be typed
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

          console.log('[GhostText] Setting ghost text:', text, 'at position:', position)

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

          console.log('[GhostText] Clearing ghost text')

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