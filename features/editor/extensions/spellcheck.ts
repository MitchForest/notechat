import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { Node as ProseMirrorNode } from "prosemirror-model";
import debounce from "lodash/debounce";
import { CheckManager } from "../services/check-manager";

interface SpellCheckOptions {
  enabled: boolean;
  debounceMs: number;
  language: string;
  checkManager?: CheckManager;
  onTooltipEvent?: (data: any) => void;
}

export interface SpellError {
  word: string;
  start: number;
  end: number;
  suggestions?: string[];
}

export interface GrammarError {
  message: string;
  start: number;
  end: number;
  severity: "error" | "warning" | "info";
  suggestions?: string[];
  rule: string;
}

const spellCheckPluginKey = new PluginKey("spellCheck");

// Simple hash function for paragraph caching
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

export const SpellCheckExtension = Extension.create<SpellCheckOptions>({
  name: "spellCheck",

  addOptions() {
    return {
      enabled: true,
      debounceMs: 300,
      language: "en_US",
      onTooltipEvent: undefined,
      checkManager: undefined,
    };
  },

  addProseMirrorPlugins() {
    const extension = this;

    return [
      new Plugin({
        key: spellCheckPluginKey,
        state: {
          init() {
            return {
              decorations: DecorationSet.empty,
              errors: new Map(),
            };
          },
          apply(tr, state) {
            // Apply decoration updates
            const meta = tr.getMeta(spellCheckPluginKey);
            if (meta?.decorations) {
              return { ...state, decorations: meta.decorations };
            }
            
            // Map decorations through the transaction
            return {
              ...state,
              decorations: state.decorations.map(tr.mapping, tr.doc),
            };
          },
        },

        props: {
          decorations(state) {
            const pluginState = this.getState(state);
            return pluginState ? pluginState.decorations : null;
          },
          
          // CRITICAL: Use handleDOMEvents instead of decorations for events
          handleDOMEvents: {
            mouseover: (view, event) => {
              const target = event.target as HTMLElement;
              
              // Check if we're hovering over a spell error or grammar error
              if (target.classList.contains('spell-error') || target.classList.contains('grammar-error')) {
                const pos = view.posAtDOM(target, 0);
                if (pos === null || pos === undefined) return false;

                const decorations = spellCheckPluginKey.getState(view.state).decorations;
                const found = decorations.find(pos, pos + 1);
                if (!found.length) return false;
                
                let errorData: any = null;
                found.forEach((deco: any) => {
                  if (deco.spec?.error) {
                    errorData = deco.spec.error;
                  }
                });
                
                if (errorData && extension.options.onTooltipEvent) {
                  const rect = target.getBoundingClientRect();
                  const editorRect = view.dom.getBoundingClientRect();
                  const word = target.textContent;
                  
                  console.log("[SpellCheck] Showing tooltip for:", { word, error: errorData })
                  extension.options.onTooltipEvent({
                    type: 'show',
                    x: rect.left - editorRect.left,
                    y: rect.bottom - editorRect.top + 5,
                    word: word,
                    error: errorData,
                  });
                }
                return true;
              }
              
              return false;
            },
            
            mouseout: (view, event) => {
              const target = event.target as HTMLElement;
              const relatedTarget = event.relatedTarget as HTMLElement;
              
              // Check if we're leaving a spell error or grammar error and not entering the tooltip
              if ((target.classList.contains('spell-error') || target.classList.contains('grammar-error')) && 
                  !relatedTarget?.closest('.spell-check-tooltip')) {
                
                setTimeout(() => {
                  const tooltip = document.querySelector('.spell-check-tooltip:hover');
                  if (!tooltip) {
                    console.log("[SpellCheck] Hiding tooltip.")
                    extension.options.onTooltipEvent?.({ type: 'hide' });
                  }
                }, 100);
                
                return true;
              }
              
              return false;
            }
          }
        },

        view(view) {
          const checkDocument = debounce(async () => {
            const checkManager = extension.options.checkManager;
            if (!checkManager || view.isDestroyed) return

            const { doc } = view.state
            const paragraphs: { text: string, pos: number, id: string }[] = []

            doc.descendants((node, pos) => {
              if (node.isTextblock && node.textContent.trim().length > 0) {
                paragraphs.push({ text: node.textContent, pos, id: `p-${pos}` });
              }
            })
            
            if (paragraphs.length === 0) {
              if (view.isDestroyed) return
              const tr = view.state.tr.setMeta(spellCheckPluginKey, { decorations: DecorationSet.empty })
              view.dispatch(tr.setMeta('addToHistory', false))
              return
            }

            try {
              const results = await Promise.all(
                paragraphs.map(p => checkManager.checkParagraph(p.id, p.text))
              )
              console.log('[SpellCheck Extension] All checks complete. Results:', results);

              const decorations: Decoration[] = []
              results.forEach((result, i) => {
                const p = paragraphs[i]
                
                result.forEach((error: any) => {
                  const errorClass = error.source === 'retext-spell' ? 'spell-error' : 'grammar-error';
                  decorations.push(
                    Decoration.inline(p.pos + error.start, p.pos + error.end, {
                      class: errorClass,
                      nodeName: 'span',
                    }, {
                      error: JSON.stringify(error)
                    })
                  )
                })
              })

              if (view.isDestroyed) return;
              const tr = view.state.tr.setMeta(spellCheckPluginKey, { decorations: DecorationSet.create(doc, decorations) })
              tr.setMeta('addToHistory', false)
              tr.setMeta('preventScroll', true)
              view.dispatch(tr)

            } catch (error) {
              console.error(`[SpellCheck Extension] Error checking paragraph:`, error);
              if (view.isDestroyed) return;
              const tr = view.state.tr.setMeta(spellCheckPluginKey, { decorations: DecorationSet.empty })
              view.dispatch(tr.setMeta('addToHistory', false))
            }

          }, extension.options.debounceMs)
          
          checkDocument()

          return {
            update(view, prevState) {
              if (!prevState || !prevState.doc.eq(view.state.doc)) {
                checkDocument()
              }
            },
            destroy() {
              checkDocument.cancel()
            }
          }
        },
      }),
    ]
  },
}) 