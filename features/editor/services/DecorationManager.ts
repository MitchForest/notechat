import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view'
import { TextError } from '../workers/grammar.worker'
import { ErrorRegistry } from './ErrorRegistry'

const decorationManagerKey = new PluginKey('spellCheckExtension');

interface SpellCheckExtensionOptions {
  registry: ErrorRegistry | null;
}

// All the methods that were in `extensionState` will now be part of the extension itself,
// or passed via props, making them more contained and predictable.

export const SpellCheckExtension = Extension.create<SpellCheckExtensionOptions>({
    name: 'spellCheckExtension',

    addOptions() {
      return {
        registry: null,
      };
    },

    addStorage() {
        console.log('[DEBUG] SpellCheckExtension: addStorage hook called. Registry available in options:', !!this.options.registry);
        return {
          // The registry is now managed per-editor instance
          registry: this.options.registry,
          tooltipElement: null as HTMLDivElement | null,
        }
    },

    // Re-introducing the helper methods within the extension definition
    // so they can access `this.storage` correctly.
    
    // Method to show a tooltip
    showTooltip(error: TextError, element: HTMLElement) {
        if (!this.storage.tooltipElement) {
            this.storage.tooltipElement = document.createElement('div');
            this.storage.tooltipElement.className = 'error-tooltip';
            document.body.appendChild(this.storage.tooltipElement);
        }
        this.storage.tooltipElement.innerHTML = `
            <div class="error-message">${error.message}</div>
            <div class="error-type">${error.source}</div>
        `;
        const rect = element.getBoundingClientRect();
        this.storage.tooltipElement.style.position = 'absolute';
        this.storage.tooltipElement.style.left = `${rect.left}px`;
        this.storage.tooltipElement.style.top = `${rect.bottom + 5}px`;
        this.storage.tooltipElement.style.display = 'block';
    },

    // Method to hide the tooltip
    hideTooltip() {
        if (this.storage.tooltipElement) {
            this.storage.tooltipElement.style.display = 'none';
        }
    },
    
    // Method to apply a suggestion
    applySuggestion(error: any, suggestion: string, view: EditorView) {
        // paragraphStartPos is added when the decoration is created
        const basePos = error.paragraphStartPos ?? 0;
        const from = basePos + error.start + 1;
        const to = basePos + error.end + 1;

        let tr = view.state.tr;
        if (suggestion === "") {
            tr = tr.delete(from, to);
        } else {
            tr = tr.replaceWith(from, to, view.state.schema.text(suggestion));
        }
        view.dispatch(tr);
    },

    // Method to ignore an error
    ignoreError(error: TextError, view: EditorView) {
        if (this.storage.registry) {
          // This will require updating the registry to support removing a single error
          // For now, we just re-render.
          console.log("Ignoring error, will re-render decorations on next update.", error);
        }
        // Dispatch a transaction to force the decorations to re-render
        const tr = view.state.tr.setMeta('updated_errors', true);
        view.dispatch(tr);
    },

    // Method to hide the suggestion menu
    hideSuggestionMenu(menu: HTMLElement) {
        if (menu && menu.parentNode) {
            menu.parentNode.removeChild(menu);
        }
    },

    // Method to show the suggestion menu
    showSuggestionMenu(error: TextError, element: HTMLElement, view: EditorView) {
        const existingMenu = document.querySelector('.suggestion-menu');
        if (existingMenu) existingMenu.remove();

        const menu = document.createElement('div');
        menu.className = 'suggestion-menu';
        document.body.appendChild(menu);
    
        if (error.suggestions && error.suggestions.length > 0) {
            error.suggestions.forEach(suggestion => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.textContent = suggestion === "" ? 'Remove' : suggestion;
                item.onclick = (e) => {
                    e.stopPropagation();
                    this.applySuggestion(error, suggestion, view);
                    this.hideSuggestionMenu(menu);
                };
                menu.appendChild(item);
            });
        }

        const ignoreItem = document.createElement('div');
        ignoreItem.className = 'suggestion-item ignore';
        ignoreItem.textContent = 'Ignore';
        ignoreItem.onclick = (e) => {
            e.stopPropagation();
            this.ignoreError(error, view);
            this.hideSuggestionMenu(menu);
        };
        menu.appendChild(ignoreItem);

        const rect = element.getBoundingClientRect();
        menu.style.position = 'absolute';
        menu.style.left = `${rect.left}px`;
        menu.style.top = `${rect.bottom + 5}px`;

        setTimeout(() => {
            document.addEventListener('click', (e) => {
                if (!menu.contains(e.target as Node)) {
                    this.hideSuggestionMenu(menu);
                }
            }, { once: true });
        }, 0);
    },

    addProseMirrorPlugins() {
        const extension = this;

        // --- Helper functions defined in the correct scope ---

        const showTooltip = (error: TextError, element: HTMLElement) => {
            if (!extension.storage.tooltipElement) {
                extension.storage.tooltipElement = document.createElement('div');
                extension.storage.tooltipElement.className = 'error-tooltip';
                document.body.appendChild(extension.storage.tooltipElement);
            }
            const tooltip = extension.storage.tooltipElement;
            tooltip.innerHTML = `
                <div class="error-message">${error.message}</div>
                <div class="error-type">${error.source}</div>
            `;
            const rect = element.getBoundingClientRect();
            tooltip.style.position = 'absolute';
            tooltip.style.left = `${rect.left}px`;
            tooltip.style.top = `${rect.bottom + 5}px`;
            tooltip.style.display = 'block';
        };
    
        const hideTooltip = () => {
            if (extension.storage.tooltipElement) {
                extension.storage.tooltipElement.style.display = 'none';
            }
        };

        const applySuggestion = (error: TextError, suggestion: string, view: EditorView) => {
            const from = error.start + 1;
            const to = error.end + 1;
            let tr = view.state.tr;
            if (suggestion === "") {
                tr = tr.delete(from, to);
            } else {
                tr = tr.replaceWith(from, to, view.state.schema.text(suggestion));
            }
            view.dispatch(tr);
        };

        const ignoreError = (error: TextError, view: EditorView) => {
            if (extension.storage.registry) {
              console.log("Ignoring error, will re-render decorations on next update.", error);
            }
            const tr = view.state.tr.setMeta('updated_errors', true);
            view.dispatch(tr);
        };
        
        const hideSuggestionMenu = (menu: HTMLElement) => {
            if (menu && menu.parentNode) {
                menu.parentNode.removeChild(menu);
            }
        };

        const showSuggestionMenu = (error: TextError, element: HTMLElement, view: EditorView) => {
            const existingMenu = document.querySelector('.suggestion-menu');
            if (existingMenu) existingMenu.remove();
    
            const menu = document.createElement('div');
            menu.className = 'suggestion-menu';
            document.body.appendChild(menu);
        
            if (error.suggestions && error.suggestions.length > 0) {
                error.suggestions.forEach(suggestion => {
                    const item = document.createElement('div');
                    item.className = 'suggestion-item';
                    item.textContent = suggestion === "" ? 'Remove' : suggestion;
                    item.onclick = (e) => {
                        e.stopPropagation();
                        applySuggestion(error, suggestion, view);
                        hideSuggestionMenu(menu);
                    };
                    menu.appendChild(item);
                });
            }
    
            const ignoreItem = document.createElement('div');
            ignoreItem.className = 'suggestion-item ignore';
            ignoreItem.textContent = 'Ignore';
            ignoreItem.onclick = (e) => {
                e.stopPropagation();
                ignoreError(error, view);
                hideSuggestionMenu(menu);
            };
            menu.appendChild(ignoreItem);
    
            const rect = element.getBoundingClientRect();
            menu.style.position = 'absolute';
            menu.style.left = `${rect.left}px`;
            menu.style.top = `${rect.bottom + 5}px`;
    
            setTimeout(() => {
                document.addEventListener('click', (e) => {
                    if (!menu.contains(e.target as Node)) {
                        hideSuggestionMenu(menu);
                    }
                }, { once: true });
            }, 0);
        };

        return [
            new Plugin({
                key: decorationManagerKey,
                state: {
                    init: () => DecorationSet.empty,
                    apply: (tr, oldSet, oldState, newState) => {
                        if (!extension.storage.registry) return DecorationSet.empty;
                        
                        const decorations: Decoration[] = [];
                        const registry = extension.storage.registry;

                        newState.doc.descendants((node, pos) => {
                            if (node.isTextblock && node.textContent.length > 0) {
                                const paragraphId = `p-${pos}`;
                                const errors = registry.getErrorsForParagraph(paragraphId);

                                if (errors.length > 0) {
                                    errors.forEach((error: any) => {
                                        const from = error.start + 1;
                                        const to = error.end + 1;
                                        if (from < 1 || to > newState.doc.content.size || from >= to) return;

                                        const isTentative = error.status === 'tentative';
                                        
                                        // Add paragraph's starting position to the error object for accurate transactions
                                        const errorForDataset = { ...error, paragraphStartPos: pos };
                                        
                                        decorations.push(Decoration.inline(from, to, {
                                            class: `error-wrapper ${isTentative ? 'error-wrapper--tentative' : ''}`,
                                            'data-error': JSON.stringify(errorForDataset)
                                        }));
                                    });
                                }
                            }
                        });

                        return DecorationSet.create(newState.doc, decorations);
                    }
                },
                props: {
                    decorations(state) {
                        return this.getState(state);
                    },
                    handleDOMEvents: {
                        click: (view, event) => {
                            const target = event.target as HTMLElement;
                            const errorWrapper = target.closest('[data-error]');
                            if (errorWrapper instanceof HTMLElement && errorWrapper.dataset.error) {
                                const error = JSON.parse(errorWrapper.dataset.error) as TextError;
                                showSuggestionMenu(error, errorWrapper, view);
                                return true;
                            }
                            return false;
                        },
                        mouseover: (view, event) => {
                            const target = event.target as HTMLElement;
                            const errorWrapper = target.closest('[data-error]');
                            if (errorWrapper instanceof HTMLElement && errorWrapper.dataset.error) {
                               const error = JSON.parse(errorWrapper.dataset.error) as TextError;
                               showTooltip(error, errorWrapper);
                            }
                        },
                        mouseout: () => {
                            hideTooltip();
                        }
                    }
                }
            })
        ];
    }
}); 