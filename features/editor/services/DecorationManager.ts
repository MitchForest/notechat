import { Editor } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

const decorationManagerKey = new PluginKey('decorationManager');

export class DecorationManager {
  private editor: Editor;

  constructor(editor: Editor) {
    this.editor = editor;
    this.installPlugin();
  }

  private installPlugin() {
    const plugin = new Plugin({
      key: decorationManagerKey,
      state: {
        init: () => DecorationSet.empty,
        apply: (tr, oldSet) => {
          // Get decorations from the meta field
          const newDecorations = tr.getMeta(decorationManagerKey);
          if (newDecorations) {
            return newDecorations;
          }
          // Otherwise, map the existing decorations through the transaction
          return oldSet.map(tr.mapping, tr.doc);
        }
      },
      props: {
        // This function provides the decorations to the editor view
        decorations(state) {
          return this.getState(state);
        }
      }
    });

    // We need to manually add this plugin to the editor's state
    // This is a bit advanced, but necessary when a plugin is managed by a service.
    const newState = this.editor.state.reconfigure({
      plugins: [...this.editor.state.plugins, plugin]
    });
    this.editor.view.updateState(newState);
  }

  public updateDecorations(errors: any[]) {
    console.log(`[DecorationManager] Updating decorations with ${errors.length} errors:`, errors);
    
    const decorations = errors.map(error => {
      console.log(`[DecorationManager] Creating decoration for:`, { 
        start: error.start, 
        end: error.end, 
        message: error.message 
      });
      
      // Create an inline decoration for each error
      return Decoration.inline(error.start, error.end, {
        class: 'grammar-error', // We'll use this class to style the underline
        'data-suggestion': error.suggestions?.join(','),
        'data-message': error.message,
        'data-error': JSON.stringify(error),
        'data-rule': error.rule,
        'data-source': error.source,
        title: `${error.message}${error.suggestions?.length ? ` → Suggestions: ${error.suggestions.join(', ')}` : ''}`, // Browser tooltip as fallback
      });
    });

    const decorationSet = DecorationSet.create(this.editor.state.doc, decorations);
    console.log(`[DecorationManager] Created decoration set with ${decorations.length} decorations`);

    // Dispatch a transaction to update the plugin's state with the new decorations
    const tr = this.editor.state.tr.setMeta(decorationManagerKey, decorationSet);
    this.editor.view.dispatch(tr);
    console.log(`[DecorationManager] Dispatched transaction with decorations`);
  }
} 