# Sprint 2: AI Interface Improvements

**Status:** Not Started  
**Priority:** HIGH  
**Duration:** 4 hours  

## Overview

Improve the AI inline interface to support prompt editing and ensure proper code block formatting. Also fix the "Insert Below" button cutoff issue.

## Goals

1. Add "Edit Prompt" functionality to AI inline interface
2. Fix code block detection and formatting
3. Fix UI cutoff issues when panels are open
4. Simplify code detection logic

## Tasks

### Task 1: Add Edit Prompt Feature ⏱️ 2 hours

**Problem:** Users can't edit prompts after submission

**Solution:**
1. Add edit mode to AI inline interface
2. Show original prompt with edit capability
3. Allow re-submission with modified prompt

**Files to modify:**
- `features/ai/components/ai-inline-interface.tsx`

**Implementation:**

```typescript
// ai-inline-interface.tsx - Add edit mode
export function AIInlineInterface({ editor, node, getPos }: NodeViewProps) {
  const [input, setInput] = useState('')
  const [originalPrompt, setOriginalPrompt] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      setOriginalPrompt(input)
      triggerCompletion(input)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setInput(originalPrompt)
  }

  const handleEditSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      setOriginalPrompt(input)
      setIsEditing(false)
      triggerCompletion(input)
    }
  }

  // In the render:
  {completion || isLoading ? (
    <div className="response-area min-h-[100px]">
      {isEditing ? (
        <form onSubmit={handleEditSubmit} className="mb-3">
          <Textarea
            value={input}
            onChange={handleInputChange}
            className="w-full bg-background resize-none"
            rows={2}
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <Button size="sm" type="submit">Update</Button>
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
          </div>
        </form>
      ) : (
        <>
          <div className="text-sm text-muted-foreground mb-2">
            Prompt: {originalPrompt}
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-full whitespace-pre-wrap font-mono text-sm bg-background p-3 rounded-md">
            {completion}
          </div>
        </>
      )}
    </div>
  ) : (
    // Original input form
  )}

  // Update buttons:
  {completion && !isLoading && !isEditing ? (
    <>
      <Button variant="ghost" size="sm" onClick={handleEdit}>
        <Edit2 className="h-4 w-4 mr-1.5" /> Edit Prompt
      </Button>
      <Button variant="ghost" size="sm" onClick={handleInsertBelow}>
        <ArrowDown className="h-4 w-4 mr-1.5" /> Insert Below
      </Button>
      <Button variant="ghost" size="sm" onClick={() => triggerCompletion(originalPrompt)}>
        <RefreshCw className="h-4 w-4 mr-1.5" /> Try Again
      </Button>
      <Button variant="default" size="sm" onClick={handleAccept}>
        <Check className="h-4 w-4 mr-1.5" /> Accept
      </Button>
    </>
  ) : (
    // Other states
  )}
```

### Task 2: Fix Code Block Detection ⏱️ 1.5 hours

**Problem:** Code requests don't always generate code blocks

**Solution:**
1. Improve intent detection for code requests
2. Force code block formatting for code-related prompts
3. Add simple heuristics

**Files to modify:**
- `features/ai/utils/content-parser.ts`
- `features/ai/utils/smart-insert.ts`

**Implementation:**

```typescript
// content-parser.ts - Improve code detection
export function detectIntent(prompt: string): ContentIntent {
  const lowerPrompt = prompt.toLowerCase()
  
  // Expanded code detection
  const codeKeywords = [
    'write', 'create', 'code', 'function', 'class', 'component',
    'script', 'program', 'implement', 'smart contract', 'algorithm',
    'method', 'variable', 'const', 'let', 'var', 'def', 'define',
    'javascript', 'typescript', 'python', 'java', 'c++', 'go',
    'html', 'css', 'sql', 'bash', 'shell'
  ]
  
  // Also check for common code patterns in prompt
  const hasCodePattern = /\b(function|class|const|let|var|def|import|export|return)\b/i.test(prompt)
  
  const wantsCode = codeKeywords.some(keyword => lowerPrompt.includes(keyword)) || hasCodePattern
  
  // ... rest of detection logic
}

// smart-insert.ts - Force code blocks for code content
async insertContent(content: string, context: InsertContext) {
  const intent = detectIntent(context.userPrompt)
  
  // If user wants code but response isn't in code block, wrap it
  if (intent.wantsCode && !this.hasCodeBlock(content)) {
    // Check if content looks like code
    if (this.looksLikeCode(content)) {
      const language = detectLanguage(content, context.userPrompt)
      const wrappedContent = `\`\`\`${language}\n${content.trim()}\n\`\`\``
      await this.insertCodeBlock(wrappedContent, context)
      return
    }
  }
  
  // Continue with normal parsing...
}

private looksLikeCode(content: string): boolean {
  // Simple heuristics for code detection
  const codePatterns = [
    /function\s+\w+\s*\(/,
    /const\s+\w+\s*=/,
    /let\s+\w+\s*=/,
    /class\s+\w+/,
    /def\s+\w+\s*\(/,
    /import\s+.+from/,
    /\{[\s\S]*\}/,
    /\([\s\S]*\)/,
    /;$/m
  ]
  
  return codePatterns.some(pattern => pattern.test(content))
}
```

### Task 3: Fix UI Layout Issues ⏱️ 0.5 hours

**Problem:** Insert Below button is cut off with multiple panels

**Solution:**
1. Add max height and scrolling to AI interface
2. Adjust positioning for constrained spaces

**Implementation:**

```typescript
// ai-inline-interface.tsx - Add responsive sizing
<NodeViewWrapper>
  <div
    className="relative rounded-lg border border-border bg-muted/50 p-4 shadow-sm max-w-full overflow-hidden"
    style={{ maxHeight: '400px' }}
    draggable="true"
    data-drag-handle
  >
    {/* Header stays fixed */}
    <div className="flex items-center justify-between mb-3 sticky top-0 bg-muted/50 z-10">
      {/* ... header content ... */}
    </div>

    {/* Scrollable content area */}
    <div className="overflow-y-auto" style={{ maxHeight: '280px' }}>
      {/* ... main content ... */}
    </div>

    {/* Action buttons stay at bottom */}
    <div className="flex items-center justify-end gap-2 mt-3 sticky bottom-0 bg-muted/50 pt-2 border-t">
      {/* ... buttons ... */}
    </div>
  </div>
</NodeViewWrapper>
```

## Testing Checklist

- [ ] Edit prompt button appears after generation
- [ ] Can modify and resubmit prompts
- [ ] Code requests generate proper code blocks
- [ ] JavaScript function requests work correctly
- [ ] Mixed content (text + code) handled properly
- [ ] UI doesn't get cut off with panels open
- [ ] Scrolling works for long content
- [ ] All buttons remain accessible

## Definition of Done

- Edit prompt feature fully functional
- Code blocks generated reliably for code requests
- No UI elements cut off in any layout
- Simple prompts like "write a javascript function" work
- All tests pass

## Session Summary

**Completed:**
- TBD

**Files Changed:**
- TBD

**Remaining:**
- TBD 