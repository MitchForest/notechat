// In your DecorationManager.ts, update the decoration creation section:

// Find this section in your updateDecorations method (around line 144):
const decoration = Decoration.inline(from, to, {
    class: errorClass,
    'contentEditable': 'false',  // ADD THIS LINE - This is the key!
    'data-suggestion': error.suggestions?.join(',') || '',
    'data-message': error.message,
    'data-error': JSON.stringify(error),
    'data-rule': error.rule,
    'data-source': error.source,
    'data-start': from.toString(),
    'data-end': to.toString(),
    style: 'cursor: pointer; position: relative;',
});

// That's literally the only change needed to your TypeScript code!

/* Keep most of your existing CSS, but add these additions/modifications: */

/* Ensure the non-editable wrappers don't interfere with text flow */
.ProseMirror span[contenteditable="false"] {
    display: inline !important;
    user-select: none; /* Prevent selection issues */
    pointer-events: auto; /* Ensure clicks work */
}

/* Make sure the text inside remains selectable */
.ProseMirror span[contenteditable="false"] * {
    user-select: text;
}

/* Your existing styles still work, but now they're more reliable */
.ProseMirror span.spell-error,
.ProseMirror span.grammar-error {
    text-decoration: none !important; 
    border-bottom: 2px solid hsl(var(--destructive, #F43F5E)) !important;
    background-color: hsl(var(--destructive, #F43F5E) / 0.1) !important;
    /* Add position relative for better control */
    position: relative !important;
    display: inline !important;
}

/* Alternative: Use pseudo-element for even more control (optional) */
.ProseMirror span.spell-error::after,
.ProseMirror span.grammar-error::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: -2px;
    height: 2px;
    background: hsl(var(--destructive, #F43F5E));
    pointer-events: none;
}

/* Keep all your other CSS as-is - tooltips, animations, etc. */

-----------------

# Migration Guide: Implementing Notion-Style Spell Check

## Step 1: Update DecorationManager.ts
Replace your current `DecorationManager.ts` with the new version that uses `contentEditable="false"` wrappers.

## Step 2: Update CSS
Replace your `spellcheck.css` with the new CSS that uses pseudo-elements for underlines.

## Step 3: Update EditorService.ts
Keep your existing initialization but ensure you're using the new DecorationManager:

```typescript
// EditorService.ts
import { DecorationManager } from './DecorationManager';

export class EditorService {
    private decorationManager: DecorationManager;
    
    constructor() {
        this.decorationManager = new DecorationManager();
        
        this.editor = new Editor({
            extensions: [
                // ... your other extensions
            ],
            editorProps: {
                attributes: {
                    spellcheck: 'false',
                    autocorrect: 'off',
                    autocapitalize: 'off',
                    'data-gramm': 'false'
                },
                plugins: [this.decorationManager]
            }
        });
    }
    
    // When you receive errors from the worker:
    onErrorsReceived(errors: TextError[]) {
        this.decorationManager.setErrors(errors);
    }
}
```

## Step 4: Ensure Proper DOM Structure
The key to this approach is that ProseMirror will create this DOM structure:

```html
<!-- Before -->
<p>This is txet with errors</p>

<!-- After (what ProseMirror creates) -->
<p>This is <span contenteditable="false" class="spell-error-wrapper" data-error="{...}">txet</span> with errors</p>
```

The browser cannot apply native spellcheck to non-editable elements, solving your core problem.

## Step 5: Test the Implementation

1. Type text with errors
2. You should see:
   - Red wavy lines under spelling errors
   - Blue wavy lines under grammar errors
   - Tooltips on hover
   - Click to see suggestions menu

## Why This Will Work

1. **Browser can't interfere**: `contentEditable="false"` prevents native spellcheck
2. **Clean separation**: Error styling is completely controlled by your CSS
3. **Reliable rendering**: Pseudo-elements are more reliable than text-decoration
4. **Better UX**: Click handling is cleaner with wrapper elements

## Debugging Tips

If you still don't see underlines:
1. Uncomment the debug CSS to see wrapper boundaries
2. Check DevTools to ensure spans are being created
3. Verify `contentEditable="false"` is set on wrappers
4. Check that error positions are correct

## Alternative If This Doesn't Work

If for some reason the Notion approach fails, the next best option is the **Shadow DOM approach** I showed earlier. It's more complex but guaranteed to work because it completely isolates your rendering from the browser's native behavior.


---------

// DecorationManager.ts - Updated with Notion-style approach
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { TextError } from './grammar.worker';

export class DecorationManager extends Plugin {
    private errors: TextError[] = [];
    private tooltipElement: HTMLDivElement | null = null;

    constructor() {
        super({
            key: new PluginKey('spellcheck-decorations'),
            state: {
                init: () => DecorationSet.empty,
                apply: (tr, old) => {
                    // Recalculate decorations if document changed
                    if (tr.docChanged) {
                        return this.createDecorations(tr.doc);
                    }
                    return old.map(tr.mapping, tr.doc);
                }
            },
            props: {
                decorations: (state) => this.getDecorations(state),
                
                // Force spellcheck off at the plugin level
                attributes: {
                    spellcheck: 'false',
                    autocorrect: 'off',
                    autocapitalize: 'off',
                    'data-gramm': 'false'
                },
                
                handleDOMEvents: {
                    // Handle clicks on error elements
                    click: (view, event) => {
                        const target = event.target as HTMLElement;
                        const errorWrapper = target.closest('.spell-error-wrapper, .grammar-error-wrapper');
                        
                        if (errorWrapper && errorWrapper instanceof HTMLElement) {
                            const errorData = errorWrapper.dataset.error;
                            if (errorData) {
                                const error = JSON.parse(errorData) as TextError;
                                this.showSuggestionMenu(error, errorWrapper, view);
                                return true;
                            }
                        }
                        return false;
                    },
                    
                    // Show tooltip on hover
                    mouseover: (view, event) => {
                        const target = event.target as HTMLElement;
                        const errorWrapper = target.closest('.spell-error-wrapper, .grammar-error-wrapper');
                        
                        if (errorWrapper && errorWrapper instanceof HTMLElement) {
                            const errorData = errorWrapper.dataset.error;
                            if (errorData) {
                                const error = JSON.parse(errorData) as TextError;
                                this.showTooltip(error, errorWrapper);
                            }
                        }
                    },
                    
                    mouseout: (view, event) => {
                        const target = event.target as HTMLElement;
                        if (!target.closest('.spell-error-wrapper, .grammar-error-wrapper')) {
                            this.hideTooltip();
                        }
                    }
                }
            }
        });
    }

    setErrors(errors: TextError[]) {
        this.errors = errors;
        // Force decoration update
        this.view?.dispatch(this.view.state.tr);
    }

    private createDecorations(doc: Node): DecorationSet {
        const decorations: Decoration[] = [];
        
        this.errors.forEach(error => {
            // Validate positions
            if (error.start >= 0 && error.end <= doc.content.size && error.start < error.end) {
                const decoration = Decoration.inline(
                    error.start,
                    error.end,
                    {
                        nodeName: 'span',
                        class: error.type === 'spelling' ? 'spell-error-wrapper' : 'grammar-error-wrapper',
                        // Critical: This prevents browser spellcheck on this span
                        'contentEditable': 'false',
                        'data-error': JSON.stringify(error),
                        // Ensure the wrapper is interactive
                        style: 'cursor: pointer; position: relative;'
                    },
                    {
                        // This makes ProseMirror wrap the content properly
                        inclusiveStart: true,
                        inclusiveEnd: true
                    }
                );
                decorations.push(decoration);
            }
        });
        
        return DecorationSet.create(doc, decorations);
    }

    private getDecorations(state: EditorState): DecorationSet {
        return this.createDecorations(state.doc);
    }

    private showTooltip(error: TextError, element: HTMLElement) {
        if (!this.tooltipElement) {
            this.tooltipElement = document.createElement('div');
            this.tooltipElement.className = 'error-tooltip';
            document.body.appendChild(this.tooltipElement);
        }
        
        this.tooltipElement.innerHTML = `
            <div class="error-message">${error.message}</div>
            <div class="error-type">${error.type}</div>
        `;
        
        const rect = element.getBoundingClientRect();
        this.tooltipElement.style.position = 'absolute';
        this.tooltipElement.style.left = `${rect.left}px`;
        this.tooltipElement.style.top = `${rect.bottom + 5}px`;
        this.tooltipElement.style.display = 'block';
    }

    private hideTooltip() {
        if (this.tooltipElement) {
            this.tooltipElement.style.display = 'none';
        }
    }

    private showSuggestionMenu(error: TextError, element: HTMLElement, view: EditorView) {
        // Create suggestion menu
        const menu = document.createElement('div');
        menu.className = 'suggestion-menu';
        menu.style.position = 'absolute';
        
        error.suggestions.forEach(suggestion => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.textContent = suggestion;
            item.onclick = () => {
                this.applySuggestion(error, suggestion, view);
                document.body.removeChild(menu);
            };
            menu.appendChild(item);
        });
        
        // Add ignore option
        const ignoreItem = document.createElement('div');
        ignoreItem.className = 'suggestion-item ignore';
        ignoreItem.textContent = 'Ignore';
        ignoreItem.onclick = () => {
            this.ignoreError(error);
            document.body.removeChild(menu);
        };
        menu.appendChild(ignoreItem);
        
        // Position and show menu
        const rect = element.getBoundingClientRect();
        menu.style.left = `${rect.left}px`;
        menu.style.top = `${rect.bottom + 5}px`;
        document.body.appendChild(menu);
        
        // Close menu on outside click
        setTimeout(() => {
            const closeMenu = (e: MouseEvent) => {
                if (!menu.contains(e.target as Node)) {
                    document.body.removeChild(menu);
                    document.removeEventListener('click', closeMenu);
                }
            };
            document.addEventListener('click', closeMenu);
        }, 0);
    }

    private applySuggestion(error: TextError, suggestion: string, view: EditorView) {
        const { state, dispatch } = view;
        
        // Create transaction to replace the error text
        const tr = state.tr.replaceRangeWith(
            error.start,
            error.end,
            state.schema.text(suggestion)
        );
        
        dispatch(tr);
        
        // Remove this error from the list
        this.errors = this.errors.filter(e => e !== error);
    }

    private ignoreError(error: TextError) {
        this.errors = this.errors.filter(e => e !== error);
        this.view?.dispatch(this.view.state.tr);
    }
}





-------

/* spellcheck.css - Notion-style approach */

/* Reset any native spell check styling */
.ProseMirror {
    /* Disable native spellcheck visuals */
    -webkit-text-fill-color: inherit !important;
    -webkit-text-decoration-skip: none !important;
}

.ProseMirror [spellcheck] {
    text-decoration: none !important;
}

/* Error wrapper styling - these are non-editable containers */
.spell-error-wrapper,
.grammar-error-wrapper {
    /* Position relative for absolute positioned children */
    position: relative;
    /* Ensure inline display */
    display: inline;
    /* Remove any native decorations */
    text-decoration: none !important;
    /* Make it clear these are interactive */
    cursor: pointer;
}

/* The actual error styling using pseudo-elements */
.spell-error-wrapper::after,
.grammar-error-wrapper::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: -2px;
    height: 2px;
    pointer-events: none; /* Don't interfere with text selection */
}

/* Spell errors - red wavy underline */
.spell-error-wrapper::after {
    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 6 3" width="6" height="3"><path d="M0 3 L2 0 L4 3 L6 0" stroke="%23ef4444" fill="none" stroke-width="0.5"/></svg>') repeat-x;
    background-size: 6px 3px;
    background-position: bottom;
}

/* Grammar errors - blue wavy underline */
.grammar-error-wrapper::after {
    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 6 3" width="6" height="3"><path d="M0 3 L2 0 L4 3 L6 0" stroke="%233b82f6" fill="none" stroke-width="0.5"/></svg>') repeat-x;
    background-size: 6px 3px;
    background-position: bottom;
}

/* Inner editable content styling */
.spell-error-wrapper > *,
.grammar-error-wrapper > * {
    /* Ensure the inner content is editable */
    contenteditable: true;
    /* Inherit text styling */
    font: inherit;
    color: inherit;
    /* Remove focus outline since the wrapper handles visual feedback */
    outline: none;
}

/* Hover state */
.spell-error-wrapper:hover::after {
    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 6 3" width="6" height="3"><path d="M0 3 L2 0 L4 3 L6 0" stroke="%23dc2626" fill="none" stroke-width="0.7"/></svg>') repeat-x;
    background-size: 6px 3px;
}

.grammar-error-wrapper:hover::after {
    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 6 3" width="6" height="3"><path d="M0 3 L2 0 L4 3 L6 0" stroke="%232563eb" fill="none" stroke-width="0.7"/></svg>') repeat-x;
    background-size: 6px 3px;
}

/* Tooltip styling */
.error-tooltip {
    background: #1a1a1a;
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 14px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    z-index: 1000;
    max-width: 300px;
}

.error-tooltip .error-message {
    margin-bottom: 4px;
}

.error-tooltip .error-type {
    font-size: 12px;
    opacity: 0.7;
    text-transform: capitalize;
}

/* Suggestion menu */
.suggestion-menu {
    background: white;
    border: 1px solid #e5e5e5;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    padding: 4px;
    z-index: 1001;
    min-width: 150px;
}

.suggestion-item {
    padding: 8px 12px;
    cursor: pointer;
    border-radius: 4px;
    font-size: 14px;
}

.suggestion-item:hover {
    background: #f5f5f5;
}

.suggestion-item.ignore {
    border-top: 1px solid #e5e5e5;
    margin-top: 4px;
    padding-top: 8px;
    color: #666;
}

/* Debug mode - uncomment to see wrapper boundaries */
/*
.spell-error-wrapper,
.grammar-error-wrapper {
    outline: 1px solid red;
    background: rgba(255,0,0,0.1);
}
*/