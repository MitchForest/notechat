Recommended Approach

Use the debug version I provided - It adds extensive logging at every step to identify exactly where the chain breaks
Test without the workers first - The simplified test editor eliminates the worker complexity to isolate whether the issue is in the ProseMirror plugin or the worker system
Check for these specific issues:

Is update() being called at all?
Is the plugin being recreated multiple times?
Are decorations being applied but not rendered?


Alternative approach: Use a React hook (useSpellCheck) to manage the checking outside of ProseMirror's plugin system. This sidesteps any plugin lifecycle issues.

The debug version will tell us within seconds where the problem is. Once we see the logs, we'll know if:

The plugin is never initialized
The update method is never called
The decorations are created but not rendered
The checkManager is null or undefined

This is a much more systematic approach than guessing about React lifecycle issues.


// STEP 1: Add comprehensive logging to identify where the chain breaks

// features/editor/extensions/spellcheck-debug.ts
import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "prosemirror-state"
import { Decoration, DecorationSet } from "prosemirror-view"
import debounce from "lodash/debounce"

const spellCheckPluginKey = new PluginKey("spellCheck")

// Add a global counter to track plugin lifecycle
let pluginInstanceCount = 0
let updateCallCount = 0

export const SpellCheckExtension = Extension.create<SpellCheckOptions>({
  name: "spellCheck",
  
  addOptions() {
    return {
      enabled: true,
      debounceMs: 300,
      checkManager: null,
    }
  },
  
  onCreate() {
    console.log(`[SpellCheck] Extension onCreate called`)
  },
  
  onDestroy() {
    console.log(`[SpellCheck] Extension onDestroy called`)
  },
  
  addProseMirrorPlugins() {
    const extension = this
    const instanceId = ++pluginInstanceCount
    
    console.log(`[SpellCheck] Creating plugin instance #${instanceId}`)
    
    return [
      new Plugin({
        key: spellCheckPluginKey,
        
        state: {
          init() {
            console.log(`[SpellCheck #${instanceId}] Plugin state init`)
            return {
              decorations: DecorationSet.empty,
              checkManager: extension.options.checkManager,
            }
          },
          
          apply(tr, state) {
            console.log(`[SpellCheck #${instanceId}] Plugin state apply, docChanged: ${tr.docChanged}`)
            
            // If decorations are provided in transaction meta, use them
            const meta = tr.getMeta(spellCheckPluginKey)
            if (meta?.decorations) {
              return { ...state, decorations: meta.decorations }
            }
            
            // Otherwise, map existing decorations
            return {
              ...state,
              decorations: state.decorations.map(tr.mapping, tr.doc),
            }
          },
        },
        
        props: {
          decorations(state) {
            const pluginState = this.getState(state)
            console.log(`[SpellCheck #${instanceId}] Getting decorations, count: ${pluginState.decorations.find().length}`)
            return pluginState.decorations
          },
        },
        
        view(editorView) {
          console.log(`[SpellCheck #${instanceId}] Plugin view() called`)
          
          const checkManager = extension.options.checkManager
          if (!checkManager) {
            console.error(`[SpellCheck #${instanceId}] No checkManager provided!`)
            return {}
          }
          
          let checkTimeoutId: NodeJS.Timeout | null = null
          
          const checkDocument = () => {
            const callId = ++updateCallCount
            console.log(`[SpellCheck #${instanceId}] checkDocument() called, update #${callId}`)
            
            // Clear any pending check
            if (checkTimeoutId) {
              clearTimeout(checkTimeoutId)
            }
            
            checkTimeoutId = setTimeout(async () => {
              console.log(`[SpellCheck #${instanceId}] Actually checking document, update #${callId}`)
              
              const { doc } = editorView.state
              const errors: Array<{ start: number; end: number; message: string }> = []
              
              // Check each paragraph
              doc.descendants((node, pos) => {
                if (node.type.name === "paragraph" && node.textContent) {
                  console.log(`[SpellCheck #${instanceId}] Checking paragraph at pos ${pos}: "${node.textContent.substring(0, 50)}..."`)
                  
                  // For debugging: Create a fake error on any paragraph containing "test"
                  if (node.textContent.includes("test")) {
                    const index = node.textContent.indexOf("test")
                    errors.push({
                      start: pos + index + 1,
                      end: pos + index + 5,
                      message: "Debug: Found 'test'"
                    })
                  }
                }
              })
              
              console.log(`[SpellCheck #${instanceId}] Found ${errors.length} errors`)
              
              // Create decorations
              const decorations = errors.map(error => 
                Decoration.inline(error.start, error.end, {
                  class: "spell-error",
                  title: error.message,
                })
              )
              
              // Apply decorations
              const tr = editorView.state.tr
              tr.setMeta(spellCheckPluginKey, {
                decorations: DecorationSet.create(doc, decorations),
              })
              
              console.log(`[SpellCheck #${instanceId}] Dispatching transaction with decorations`)
              editorView.dispatch(tr)
              
            }, extension.options.debounceMs)
          }
          
          // Initial check
          console.log(`[SpellCheck #${instanceId}] Scheduling initial check`)
          checkDocument()
          
          return {
            update(view, prevState) {
              console.log(`[SpellCheck #${instanceId}] Plugin update() called`)
              console.log(`[SpellCheck #${instanceId}] - Doc changed: ${!view.state.doc.eq(prevState.doc)}`)
              console.log(`[SpellCheck #${instanceId}] - Selection changed: ${!view.state.selection.eq(prevState.selection)}`)
              
              if (!view.state.doc.eq(prevState.doc)) {
                checkDocument()
              }
            },
            
            destroy() {
              console.log(`[SpellCheck #${instanceId}] Plugin destroy() called`)
              if (checkTimeoutId) {
                clearTimeout(checkTimeoutId)
              }
            },
          }
        },
      }),
    ]
  },
})

// STEP 2: Simplified test without workers to isolate the issue

// features/editor/components/test-editor.tsx
"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { SpellCheckExtension } from "../extensions/spellcheck-debug"

export function TestEditor() {
  // Create a mock check manager
  const mockCheckManager = {
    checkParagraph: async (id: string, text: string) => {
      console.log(`[MockCheckManager] Checking: "${text}"`)
      
      // Return fake errors for testing
      const errors = []
      if (text.includes("test")) {
        errors.push({
          word: "test",
          start: text.indexOf("test"),
          end: text.indexOf("test") + 4,
          message: "Test word found",
          suggestions: ["TEST", "text"],
        })
      }
      
      return { spell: errors, grammar: [] }
    }
  }
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      SpellCheckExtension.configure({
        enabled: true,
        debounceMs: 500,
        checkManager: mockCheckManager,
      }),
    ],
    content: "<p>Type the word test to see if checking works</p>",
    onUpdate: ({ editor }) => {
      console.log("[TestEditor] Editor updated, content length:", editor.getText().length)
    },
    onCreate: ({ editor }) => {
      console.log("[TestEditor] Editor created")
    },
    onDestroy: () => {
      console.log("[TestEditor] Editor destroyed")
    },
  })
  
  // Log editor state for debugging
  if (editor) {
    console.log("[TestEditor] Editor exists, isEditable:", editor.isEditable)
    console.log("[TestEditor] Active plugins:", editor.extensionManager.extensions.map(e => e.name))
  }
  
  return (
    <div className="border rounded p-4">
      <h3 className="font-bold mb-2">Debug Editor</h3>
      <EditorContent editor={editor} className="prose" />
      <div className="mt-4 text-sm text-gray-600">
        <p>Type something and check the console for debug logs.</p>
        <p>The word "test" should get a red underline.</p>
      </div>
    </div>
  )
}

// STEP 3: Add CSS to ensure decorations are visible
/* 
Add to your global CSS:

.spell-error {
  text-decoration: underline wavy red !important;
  text-decoration-thickness: 2px !important;
  cursor: pointer;
}

.spell-error:hover {
  background-color: rgba(255, 0, 0, 0.1);
}
*/

// STEP 4: Alternative approach - use Tiptap's built-in transaction system

// features/editor/hooks/use-spell-check.ts
import { Editor } from "@tiptap/core"
import { useEffect, useRef } from "react"
import { Decoration, DecorationSet } from "prosemirror-view"

export function useSpellCheck(editor: Editor | null, checkManager: any) {
  const checkTimeoutRef = useRef<NodeJS.Timeout>()
  
  useEffect(() => {
    if (!editor || !checkManager) return
    
    console.log("[useSpellCheck] Setting up spell check")
    
    const checkContent = async () => {
      console.log("[useSpellCheck] Checking content")
      
      const { doc } = editor.state
      const decorations: Decoration[] = []
      
      // Simple test: mark "test" with decorations
      doc.descendants((node, pos) => {
        if (node.type.name === "text" && node.text?.includes("test")) {
          const index = node.text.indexOf("test")
          decorations.push(
            Decoration.inline(pos + index, pos + index + 4, {
              class: "spell-error",
            })
          )
        }
      })
      
      // Apply decorations using Tiptap commands
      editor.commands.command(({ tr }) => {
        // Store decorations in plugin state or document meta
        tr.setMeta("addDecorations", decorations)
        return true
      })
    }
    
    // Listen to editor updates
    const handleUpdate = () => {
      console.log("[useSpellCheck] Editor updated")
      
      // Debounce the check
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current)
      }
      
      checkTimeoutRef.current = setTimeout(checkContent, 500)
    }
    
    editor.on("update", handleUpdate)
    
    // Initial check
    checkContent()
    
    return () => {
      editor.off("update", handleUpdate)
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current)
      }
    }
  }, [editor, checkManager])
}