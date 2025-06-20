import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view'
import { TextError } from '../workers/grammar.worker'

const decorationManagerKey = new PluginKey('spellCheckExtension');

// This object will hold the state and methods that need to be accessed
// from both the extension and the plugin.
const extensionState = {
    errors: [] as TextError[],
    tooltipElement: null as HTMLDivElement | null,
    
    // Method to show a tooltip
    showTooltip(error: TextError, element: HTMLElement) {
        if (!this.tooltipElement) {
            this.tooltipElement = document.createElement('div');
            this.tooltipElement.className = 'error-tooltip';
            document.body.appendChild(this.tooltipElement);
        }
        this.tooltipElement.innerHTML = `
            <div class="error-message">${error.message}</div>
            <div class="error-type">${error.source}</div>
        `;
        const rect = element.getBoundingClientRect();
        this.tooltipElement.style.position = 'absolute';
        this.tooltipElement.style.left = `${rect.left}px`;
        this.tooltipElement.style.top = `${rect.bottom + 5}px`;
        this.tooltipElement.style.display = 'block';
    },

    // Method to hide the tooltip
    hideTooltip() {
        if (this.tooltipElement) {
            this.tooltipElement.style.display = 'none';
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

    // Method to hide the suggestion menu
    hideSuggestionMenu(menu: HTMLElement) {
        if (menu && menu.parentNode) {
            menu.parentNode.removeChild(menu);
        }
    },

    // Method to apply a suggestion
    applySuggestion(error: TextError, suggestion: string, view: EditorView) {
        const from = error.start + 1;
        const to = error.end + 1;

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
        this.errors = this.errors.filter(e => e.start !== error.start || e.end !== error.end);
        // Dispatch a transaction to force the decorations to re-render
        const tr = view.state.tr.setMeta('updated_errors', true);
        view.dispatch(tr);
    }
};

export const SpellCheckExtension = Extension.create({
    name: 'spellCheckExtension',

    // The `storage` property is the correct way to hold state in a Tiptap extension
    addStorage() {
        return extensionState;
    },

    // `addProseMirrorPlugins` is the correct hook for adding ProseMirror plugins
    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: decorationManagerKey,
                state: {
                    init: () => DecorationSet.empty,
                    apply: (tr, oldSet, oldState, newState) => {
                        const errors = this.storage.errors;
                        if (!errors || errors.length === 0) {
                            return DecorationSet.empty;
                        }

                        const decorations = errors.map((error: TextError) => {
                            const from = error.start + 1;
                            const to = error.end + 1;
                            if (from < 1 || to > newState.doc.content.size || from >= to) return null;

                            const errorType = error.source === 'simple-spell' ? 'spell' : 'grammar';
                            return Decoration.inline(from, to, {
                                class: `${errorType}-error-wrapper`,
                                'contentEditable': 'false',
                                'data-error': JSON.stringify(error)
                            });
                        }).filter((d: Decoration | null) => d !== null);

                        return DecorationSet.create(newState.doc, decorations as Decoration[]);
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
                                this.storage.showSuggestionMenu(error, errorWrapper, view);
                                return true;
                            }
                            return false;
                        },
                        mouseover: (view, event) => {
                            const target = event.target as HTMLElement;
                            const errorWrapper = target.closest('[data-error]');
                            if (errorWrapper instanceof HTMLElement && errorWrapper.dataset.error) {
                                const error = JSON.parse(errorWrapper.dataset.error) as TextError;
                                this.storage.showTooltip(error, errorWrapper);
                            }
                        },
                        mouseout: () => {
                            this.storage.hideTooltip();
                        }
                    }
                }
            })
        ];
    }
}); 