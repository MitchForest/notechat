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
const GHOST_TEXT_META_KEY = 'ghostTextUpdate'

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
            return { 
              decorations: DecorationSet.empty,
              isVisible: false,
              ghostText: '',
              position: null as number | null
            }
          },

          apply(tr, value, oldState, newState) {
            const storage = extension.storage as GhostTextStorage
            const meta = tr.getMeta(GHOST_TEXT_META_KEY)
            
            // Only log when there's an actual change
            if (meta || tr.docChanged) {
              console.log('[GhostText Plugin] apply:', {
                meta: !!meta,
                docChanged: tr.docChanged
              })
            }

            // Handle explicit updates
            if (meta === true) {
              if (storage.isActive && storage.ghostText && storage.position !== null) {
                try {
                  // Validate position
                  if (storage.position < 0 || storage.position > newState.doc.content.size) {
                    console.error('[GhostText] Invalid position:', storage.position, 'doc size:', newState.doc.content.size)
                    return { 
                      decorations: DecorationSet.empty,
                      isVisible: false,
                      ghostText: '',
                      position: null
                    }
                  }
                  
                  // Use widget decoration instead of inline
                  const decoration = Decoration.widget(
                    storage.position,
                    () => {
                      const span = document.createElement('span')
                      span.className = 'ghost-text-widget'
                      span.textContent = storage.ghostText
                      span.setAttribute('data-ghost-text', 'true')
                      span.setAttribute('data-ghost-text-content', storage.ghostText)
                      // Add debug styling
                      span.style.cssText = 'color: rgba(156, 163, 175, 0.8) !important; background: rgba(156, 163, 175, 0.1) !important; padding: 0 4px !important; border-radius: 3px !important; display: inline-block !important;'
                      return span
                    },
                    { 
                      side: 1, // Place after cursor
                      marks: [], // Don't inherit marks
                      key: 'ghost-text-widget'
                    }
                  )
                  
                  const decorations = DecorationSet.create(newState.doc, [decoration])
                  
                  // Remove force update - it's causing performance issues
                  
                  return { 
                    decorations,
                    isVisible: true,
                    ghostText: storage.ghostText,
                    position: storage.position
                  }
                } catch (e) {
                  console.error('[GhostText] Error creating decoration:', e)
                  return { 
                    decorations: DecorationSet.empty,
                    isVisible: false,
                    ghostText: '',
                    position: null
                  }
                }
              } else {
                return { 
                  decorations: DecorationSet.empty,
                  isVisible: false,
                  ghostText: '',
                  position: null
                }
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
                  return { 
                    decorations: DecorationSet.empty,
                    isVisible: false,
                    ghostText: '',
                    position: null
                  }
                }
              }
              
              return { 
                ...value,
                decorations: mapped 
              }
            }
            
            // Check if cursor moved away
            if (storage.isActive && storage.position !== null) {
              const { from } = newState.selection
              if (from !== storage.position && from !== storage.position + 1) {
                ;(extension.editor as any).emit('ghostTextReject')
                return { 
                  decorations: DecorationSet.empty,
                  isVisible: false,
                  ghostText: '',
                  position: null
                }
              }
            }
            
            // No changes, return existing state
            return value
          }
        },

        props: {
          decorations(state) {
            const pluginState = ghostTextKey.getState(state)
            // Remove logging here - it's called too frequently
            return pluginState?.decorations || DecorationSet.empty
          },

          handleTextInput(view, from, to, text) {
            // Don't process if editor is read-only (e.g., during drag)
            if (!view.editable) return false
            
            const { state } = view
            const storage = extension.storage as GhostTextStorage

            // If ghost text is active and user types any character, reject it
            if (storage.isActive) {
              ;(extension.editor as any).emit('ghostTextReject')
              return false // Let the character be typed
            }

            if (text === '+') {
              const before = state.doc.textBetween(Math.max(0, from - 1), from)

              if (before === '+') {
                console.log('[GhostText] ++ trigger detected')
                
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
              ;(extension.editor as any).emit('ghostTextAccept', storage.ghostText)
              return true
            }

            // Escape or Enter rejects
            if (event.key === 'Escape' || event.key === 'Enter') {
              event.preventDefault()
              ;(extension.editor as any).emit('ghostTextReject')
              return true
            }

            // Any other character input rejects (except modifiers and special keys)
            if (!event.ctrlKey && !event.metaKey && !event.altKey && 
                event.key.length === 1 && !event.key.startsWith('Arrow')) {
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
        ({ editor, tr, dispatch }) => {
          const storage = this.storage as GhostTextStorage
          
          // Only log significant changes
          if (storage.ghostText !== text) {
            console.log('[GhostText] setGhostText:', { text: text.substring(0, 20) + '...', position })
          }
          
          storage.ghostText = text
          storage.position = position
          storage.isActive = true

          // Set meta on the existing transaction if available, otherwise create new one
          if (tr) {
            tr.setMeta(GHOST_TEXT_META_KEY, true)
          } else if (dispatch) {
            const newTr = editor.state.tr.setMeta(GHOST_TEXT_META_KEY, true)
            dispatch(newTr)
          }

          return true
        },

      clearGhostText:
        () =>
        ({ editor, tr, dispatch }) => {
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
          if (wasActive) {
            if (tr) {
              tr.setMeta(GHOST_TEXT_META_KEY, true)
            } else if (dispatch) {
              const newTr = editor.state.tr.setMeta(GHOST_TEXT_META_KEY, true)
              dispatch(newTr)
            }
          }

          return true
        }
    }
  }
}) 