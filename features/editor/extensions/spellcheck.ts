import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { Node as ProseMirrorNode } from "prosemirror-model";
import debounce from "lodash.debounce";
import { CheckManager } from "../services/check-manager";

interface SpellCheckOptions {
  enabled: boolean;
  debounceMs: number;
  language: string;
  checkManager: CheckManager;
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

const spellCheckPluginKey = new PluginKey("spellAndGrammarCheck");

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
      checkManager: null as any,
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
              paragraphHashes: new Map<string, string>(),
              tooltip: null,
            };
          },
          apply(tr, oldState: any) {
            const meta = tr.getMeta(spellCheckPluginKey);
            if (meta) {
              return { ...oldState, ...meta };
            }
            if (tr.docChanged) {
              return {
                ...oldState,
                decorations: oldState.decorations.map(tr.mapping, tr.doc),
                tooltip: null,
              };
            }
            return oldState;
          },
        },

        props: {
          decorations(state) {
            return spellCheckPluginKey.getState(state).decorations;
          },

          handleDOMEvents: {
            mouseover(view, event) {
              const target = event.target as HTMLElement;
              if (
                target &&
                (target.classList.contains("spell-error") ||
                  target.classList.contains("grammar-error"))
              ) {
                const pos = view.posAtDOM(target, 0);
                const { decorations } = spellCheckPluginKey.getState(view.state);
                const found = decorations.find(pos, pos);
                if (found.length) {
                  const deco = found[0];
                  const rect = target.getBoundingClientRect();
                  view.dispatch(
                    view.state.tr.setMeta(spellCheckPluginKey, {
                      tooltip: {
                        from: deco.from,
                        to: deco.to,
                        rect,
                        type: target.classList.contains("spell-error")
                          ? "spell"
                          : "grammar",
                      },
                    })
                  );
                }
              }
              return false;
            },
            mouseout(view, event) {
              const target = event.target as HTMLElement;
               if (
                target &&
                (target.classList.contains("spell-error") ||
                  target.classList.contains("grammar-error"))
              ) {
                view.dispatch(
                  view.state.tr.setMeta(spellCheckPluginKey, { tooltip: null })
                );
              }
              return false;
            },
          },
        },

        view(view) {
          const checkManager = extension.options.checkManager;
          if (!checkManager) return {};
          
          const checkDocument = debounce(async () => {
            const { paragraphHashes } = spellCheckPluginKey.getState(view.state);
            const updatedHashes = new Map(paragraphHashes);
            const decorationsToAdd: Decoration[] = [];
            const rangesToRemove: { from: number; to: number }[] = [];

            const paragraphs: { node: ProseMirrorNode; pos: number }[] = [];
            view.state.doc.descendants((node, pos) => {
              if (node.isTextblock) {
                paragraphs.push({ node, pos });
              }
            });

            const promises = paragraphs.map(async ({ node, pos }) => {
              const text = node.textContent;
              const paragraphId = `p-${pos}`;
              const from = pos + 1;
              const to = from + node.nodeSize;

              rangesToRemove.push({ from, to });

              if (text.trim().length === 0) {
                updatedHashes.delete(paragraphId);
                return;
              }

              const hash = simpleHash(text);
              const oldHash = paragraphHashes.get(paragraphId);
              if (hash === oldHash) {
                return; // Skip check if content is unchanged, but keep old decorations for now
              }

              updatedHashes.set(paragraphId, hash);
              const result = await checkManager.checkParagraph(
                paragraphId,
                text
              );

              const spellDecorations = result.spell.map((error: SpellError) =>
                Decoration.inline(
                  pos + error.start + 1,
                  pos + error.end + 1,
                  { class: "spell-error" },
                  { error }
                )
              );
              const grammarDecorations = result.grammar.map(
                (error: GrammarError) =>
                  Decoration.inline(
                    pos + error.start + 1,
                    pos + error.end + 1,
                    { class: "grammar-error" },
                    { error }
                  )
              );

              decorationsToAdd.push(...spellDecorations, ...grammarDecorations);
            });

            await Promise.all(promises);

            if (decorationsToAdd.length === 0 && rangesToRemove.length === 0)
              return;

            let { decorations } = spellCheckPluginKey.getState(view.state);

            rangesToRemove.forEach((range) => {
              const found = decorations.find(range.from, range.to);
              if (found.length) {
                decorations = decorations.remove(found);
              }
            });
            
            decorations = decorations.add(view.state.doc, decorationsToAdd);

            const tr = view.state.tr.setMeta(spellCheckPluginKey, {
              decorations: decorations,
              paragraphHashes: updatedHashes,
            });
            if (!tr.docChanged) {
              view.dispatch(tr);
            }
          }, extension.options.debounceMs);

          checkDocument();

          return {
            update(view, prevState) {
              if (!prevState.doc.eq(view.state.doc)) {
                checkDocument();
              }
            },
            destroy() {
              checkDocument.cancel();
            },
          };
        },
      }),
    ];
  },
}); 