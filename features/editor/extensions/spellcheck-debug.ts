import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "prosemirror-state"

const spellCheckPluginKey = new PluginKey("spellCheckDebug")

export const SpellCheckExtensionDebug = Extension.create({
  name: "spellCheckDebug",
  
  addProseMirrorPlugins() {
    console.log("[SpellCheckDebug] addProseMirrorPlugins called")
    
    return [
      new Plugin({
        key: spellCheckPluginKey,
        
        view(editorView) {
          console.log("[SpellCheckDebug] view() called")
          
          return {
            update(view, prevState) {
              console.log("[SpellCheckDebug] update() called")
            },
            
            destroy() {
              console.log("[SpellCheckDebug] destroy() called")
            },
          }
        },
      }),
    ]
  },
}) 