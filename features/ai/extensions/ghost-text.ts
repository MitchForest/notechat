import { Extension, RawCommands } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    ghostText: {
      setGhostText: (text: string, position: number) => ReturnType
      clearGhostText: () => ReturnType
    }
  }
}

export interface GhostTextStorage {
  ghostText: string
  isActive: boolean
  position: number | null
}

const ghostTextKey = new PluginKey('ghostText')

export const GhostText = Extension.create({
  name: 'ghostText',

  addStorage() {
    return {
      ghostText: '',
      isActive: false,
      position: null
    } as GhostTextStorage
  },

  addProseMirrorPlugins() {
    const extension = this

    return [
      new Plugin({
        key: ghostTextKey,

        state: {
          init: () => {
            console.log('[GhostText] Plugin initialized')
            return { decorations: DecorationSet.empty }
          },

          apply(tr, value, oldState, newState) {
            const storage = extension.storage as GhostTextStorage
            const meta = tr.getMeta('ghostTextUpdate')

            if (meta) {
              console.log(
                '[GhostText] Apply with meta - isActive:',
                storage.isActive,
                'text:',
                storage.ghostText,
                'position:',
                storage.position
              )
            }

            if (meta) {
              if (storage.isActive && storage.ghostText && storage.position !== null) {
                const decoration = Decoration.inline(
                  storage.position,
                  storage.position,
                  {
                    class: 'ghost-text',
                    'data-text': storage.ghostText
                  },
                  { inclusiveStart: true, inclusiveEnd: false }
                )
                return {
                  decorations: DecorationSet.create(newState.doc, [decoration])
                }
              } else {
                return { decorations: DecorationSet.empty }
              }
            }

            const decorations = value.decorations.map(tr.mapping, newState.doc)

            if (storage.isActive && storage.position !== null) {
              const { from } = newState.selection
              if (from !== storage.position) {
                extension.editor.emit('ghostTextReject')
                return { decorations: DecorationSet.empty }
              }
            }

            return { decorations }
          }
        },

        props: {
          decorations(state) {
            return ghostTextKey.getState(state)?.decorations || DecorationSet.empty
          },

          handleTextInput(view, from, to, text) {
            console.log('[GhostText] handleTextInput:', text, 'from:', from, 'to:', to)

            const { state } = view
            const storage = extension.storage as GhostTextStorage

            if (storage.isActive) {
              extension.editor.emit('ghostTextReject')
              return false
            }

            if (text === '+') {
              const before = state.doc.textBetween(Math.max(0, from - 1), from)

              console.log('[GhostText] Checking for ++ trigger. Before text:', before)

              if (before === '+') {
                console.log('[GhostText] ++ DETECTED! Triggering...')

                const tr = state.tr.delete(from - 1, to)
                view.dispatch(tr)

                const contextStart = Math.max(0, from - 500)
                const context = state.doc.textBetween(contextStart, from - 1)

                console.log('[GhostText] Emitting trigger event with context length:', context.length)

                extension.editor.emit('ghostTextTrigger', {
                  position: from - 1,
                  context
                })

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
              extension.editor.emit('ghostTextAccept', storage.ghostText)
              return true
            }

            if (event.key === 'Escape') {
              event.preventDefault()
              extension.editor.emit('ghostTextReject')
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
          console.log('[GhostText] setGhostText command called. Text:', text, 'Position:', position)

          const storage = this.storage as GhostTextStorage
          storage.ghostText = text
          storage.position = position
          storage.isActive = true

          if (dispatch) {
            const tr = editor.state.tr.setMeta('ghostTextUpdate', true)
            dispatch(tr)
          }

          return true
        },

      clearGhostText:
        () =>
        ({ editor, dispatch }) => {
          console.log('[GhostText] clearGhostText command called')

          const storage = this.storage as GhostTextStorage
          storage.ghostText = ''
          storage.isActive = false
          storage.position = null

          if (dispatch) {
            const tr = editor.state.tr.setMeta('ghostTextUpdate', true)
            dispatch(tr)
          }

          return true
        }
    }
  }
}) 