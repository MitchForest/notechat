# Spellcheck System Diagnostic Guide

## 1. Verify Decoration DOM Structure

Add this diagnostic code to `DecorationManager.ts` to inspect what's actually being rendered:

```typescript
// In the decorations method, after creating decorations:
decorations(state: EditorState) {
    const decorations = this.errors.map(error => {
        // ... existing decoration creation code ...
    });
    
    // DIAGNOSTIC: Log decoration info
    console.log('Created decorations:', decorations.length);
    
    // DIAGNOSTIC: After a short delay, inspect DOM
    setTimeout(() => {
        const errorSpans = document.querySelectorAll('span.grammar-error, span.spelling-error');
        console.log('Found error spans in DOM:', errorSpans.length);
        errorSpans.forEach((span, i) => {
            const computed = window.getComputedStyle(span);
            console.log(`Span ${i}:`, {
                text: span.textContent,
                className: span.className,
                borderBottom: computed.borderBottom,
                textDecoration: computed.textDecoration,
                color: computed.color
            });
        });
    }, 100);
    
    return DecorationSet.create(state.doc, decorations);
}
```

## 2. Test Native Spellcheck Interference

Create a minimal test to isolate native spellcheck:

```typescript
// Add to EditorService constructor or initialization:
const editorElement = this.editor.view.dom;

// Force disable all spellcheck variations
editorElement.setAttribute('spellcheck', 'false');
editorElement.setAttribute('data-gramm', 'false'); // Grammarly
editorElement.setAttribute('data-gramm_editor', 'false');
editorElement.setAttribute('data-enable-grammarly', 'false');

// For contenteditable elements inside
const contentEditable = editorElement.querySelector('[contenteditable]');
if (contentEditable) {
    contentEditable.setAttribute('spellcheck', 'false');
}

// Also try CSS approach
editorElement.style.setProperty('--webkit-text-decoration-skip', 'none');
```

## 3. Position Calculation Verification

Add extensive logging to track position mismatches:

```typescript
// In grammar.worker.ts, when creating an error:
const error = {
    start: match.index!,
    end: match.index! + match[0].length,
    message: `...`,
    suggestions: [...],
    // ADD: Debug info
    debug: {
        matchedText: match[0],
        textBefore: text.substring(Math.max(0, match.index! - 10), match.index!),
        textAfter: text.substring(match.index! + match[0].length, match.index! + match[0].length + 10)
    }
};

// In DecorationManager, when applying a fix:
private applySuggestion(error: TextError, suggestion: string) {
    const { state, dispatch } = this.view;
    
    // DIAGNOSTIC: Log the exact operation
    const textToReplace = state.doc.textBetween(error.start, error.end);
    console.log('Fix operation:', {
        errorRange: `[${error.start}, ${error.end}]`,
        textToReplace: JSON.stringify(textToReplace),
        suggestion: JSON.stringify(suggestion),
        docLength: state.doc.content.size
    });
    
    // Verify positions are valid
    if (error.start < 0 || error.end > state.doc.content.size) {
        console.error('Invalid positions!', { start: error.start, end: error.end, docSize: state.doc.content.size });
        return;
    }
    
    const tr = state.tr.replaceRangeWith(
        error.start,
        error.end,
        state.schema.text(suggestion)
    );
    
    dispatch(tr);
}
```

## 4. Test CSS Specificity

Try using extremely specific CSS with `!important`:

```css
/* In spellcheck.css */
.ProseMirror span.grammar-error,
.ProseMirror span.spelling-error {
    /* Remove all text decorations first */
    text-decoration: none !important;
    text-decoration-line: none !important;
    text-decoration-style: initial !important;
    text-decoration-color: initial !important;
    
    /* Apply border instead */
    border-bottom: 3px solid red !important;
    padding-bottom: 2px !important;
    
    /* Make it obvious for testing */
    background-color: rgba(255, 0, 0, 0.1) !important;
}

/* Disable native spell check styling */
.ProseMirror [spellcheck] {
    text-decoration: none !important;
}
```

## 5. Isolated Test Case

Create a minimal reproduction to isolate the issue:

```typescript
// Create a simple test without the worker
const testError = {
    start: 5,
    end: 10,
    message: "Test error",
    suggestions: ["test"]
};

// Manually add this error to DecorationManager
this.decorationManager.setErrors([testError]);

// Check if this simple case works
```

## 6. ProseMirror Document Model Check

Verify that text positions align with ProseMirror's model:

```typescript
// Add to CheckOrchestrator or EditorService
debugPositions(text: string, errors: TextError[]) {
    const doc = this.editor.state.doc;
    
    console.log('Document comparison:');
    console.log('Raw text:', JSON.stringify(text));
    console.log('Doc text:', JSON.stringify(doc.textContent));
    console.log('Text length:', text.length);
    console.log('Doc size:', doc.content.size);
    
    errors.forEach((error, i) => {
        const docText = doc.textBetween(error.start, error.end);
        const rawText = text.substring(error.start, error.end);
        
        console.log(`Error ${i}:`, {
            positions: `[${error.start}, ${error.end}]`,
            docText: JSON.stringify(docText),
            rawText: JSON.stringify(rawText),
            match: docText === rawText
        });
    });
}
```

## 7. Transaction Timing Test

Test if the issue is related to asynchronous updates:

```typescript
// In DecorationManager
private applySuggestionWithDelay(error: TextError, suggestion: string) {
    // Wait for any pending updates
    requestAnimationFrame(() => {
        const { state, dispatch } = this.view;
        
        // Re-calculate positions based on current state
        const currentText = state.doc.textContent;
        const errorText = currentText.substring(error.start, error.end);
        
        console.log('Delayed fix:', {
            originalError: error,
            currentText: errorText,
            suggestion: suggestion
        });
        
        // Apply the fix
        const tr = state.tr.replaceRangeWith(
            error.start,
            error.end,
            state.schema.text(suggestion)
        );
        
        dispatch(tr);
    });
}
```

## Expected Diagnostic Output

After implementing these diagnostics, you should see:

1. **For decoration visibility**: Whether spans are in the DOM and what styles are actually applied
2. **For native spellcheck**: If the browser is still interfering despite attempts to disable it
3. **For position issues**: Exact mismatches between worker calculations and ProseMirror positions
4. **For CSS**: Whether your styles are being applied but overridden

## Next Steps Based on Findings

### If decorations are in DOM but invisible:
- The issue is purely CSS-related
- Focus on specificity and !important rules
- Consider inline styles as a test

### If decorations aren't in DOM:
- ProseMirror isn't creating them properly
- Check decoration plugin registration
- Verify decoration positions are within document bounds

### If positions don't match:
- Text encoding differences (e.g., emoji, special characters)
- ProseMirror's internal position model differs from string positions
- Need to use ProseMirror's position mapping utilities

### If native spellcheck persists:
- May need to disable at a deeper level
- Consider using a custom contenteditable implementation
- Explore ProseMirror's spellcheck handling options