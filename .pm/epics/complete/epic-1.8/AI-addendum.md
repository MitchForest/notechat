# AI Implementation Addendum - Updated UI/UX Design

## Overview of Changes

Based on Notion's UI patterns and the need to differentiate from our future AI chat feature, we're updating the AI Assistant to use an inline interface instead of a floating panel. This addendum details all UI/UX changes and implementation updates.

## 1. AI Assistant - Inline Interface (Replaces Floating Panel)

### 1.1 Trigger Mechanisms

The AI Assistant can be triggered in two ways:

1. **Slash Command**: Type `/ai` and select from menu
2. **Space on Empty Line**: Press `Space` on a new empty line

Both triggers result in the same inline AI interface.

### 1.2 Inline AI Interface Design

#### Initial State (Input Mode)
```
┌─────────────────────────────────────────────────────┐
│ ✨ Ask AI anything...                        [@] [X] │
├─────────────────────────────────────────────────────┤
│ Suggested:                                           │
│ • Continue writing                                   │
│ • Add a summary                                      │
│ • Make a bullet list                                 │
│ • Improve writing style                              │
└─────────────────────────────────────────────────────┘
```

**Specifications:**
- **Width**: Full editor width minus padding
- **Position**: Replaces current empty line
- **Background**: Slightly different shade (`bg-muted/50`) to distinguish from regular text
- **Border**: 1px border with `border-border` color
- **Border Radius**: 6px
- **Padding**: 12px all sides
- **Animation**: Slide down with fade in (200ms)

#### Components:
1. **Header Row**:
   - Sparkle icon (✨) + "Ask AI anything..." placeholder
   - @ button for mentioning (future feature, disabled for now)
   - X button to close

2. **Suggested Actions**:
   - Context-aware suggestions based on document state
   - Clickable items that auto-fill the input
   - Hide when user starts typing

#### Response State
```
┌─────────────────────────────────────────────────────┐
│ ✨ Make this into a bullet list                 [X] │
├─────────────────────────────────────────────────────┤
│ Here's your content as a bullet list:                │
│                                                      │
│ • First point from your text                         │
│ • Second key insight mentioned                       │
│ • Final thought reorganized                          │
│                                                      │
├─────────────────────────────────────────────────────┤
│ [✓ Accept] [↓ Insert below] [× Discard] [↻ Try again] │
└─────────────────────────────────────────────────────┘
```

**Specifications:**
- **Response Area**:
  - Clear visual separation from input
  - Markdown rendering support
  - Max height: 400px with internal scroll
  - Code blocks with syntax highlighting
  - Same typography as editor

- **Action Buttons**:
  - **Accept**: Replaces current line with AI response
  - **Insert below**: Keeps current line, adds response below
  - **Discard**: Closes interface without changes
  - **Try again**: Regenerates response with same prompt
  - Button spacing: 8px gap
  - Button style: Secondary variant with hover states

### 1.3 Interaction Flow

1. **Opening**:
   ```typescript
   // User types /ai or presses Space on empty line
   → Current line transforms into AI interface
   → Cursor focus moves to input field
   → Suggested actions appear
   ```

2. **Typing**:
   ```typescript
   // As user types
   → Suggested actions fade out
   → Real-time character count (if over 280 chars)
   → Enter to submit, Shift+Enter for new line
   ```

3. **Submitting**:
   ```typescript
   // User presses Enter
   → Input field disabled
   → Loading state with pulsing dots
   → Response streams in progressively
   ```

4. **Response Actions**:
   ```typescript
   // Accept
   → Replace current line with response
   → Close interface
   → Cursor at end of inserted text
   
   // Insert below
   → Keep current line as-is
   → Insert response as new paragraph below
   → Close interface
   → Cursor at end of inserted text
   
   // Discard
   → Close interface
   → Restore original empty line
   → Cursor remains in place
   
   // Try again
   → Clear current response
   → Show loading state
   → Regenerate with same prompt
   ```

### 1.4 Keyboard Shortcuts

- `Escape`: Close interface (same as Discard)
- `Cmd/Ctrl + Enter`: Accept response
- `Cmd/Ctrl + Shift + Enter`: Insert below
- `Tab`: Cycle through action buttons
- `Arrow Up/Down`: Navigate suggested actions

### 1.5 Edge Cases

1. **Document Changes During AI Response**:
   - If document changes while waiting, show warning
   - Option to continue or cancel

2. **Long Responses**:
   - Max height with internal scroll
   - "Show more" button if response > 1000 chars

3. **Multiple Paragraphs**:
   - If response has multiple paragraphs, preserve formatting
   - Each paragraph becomes separate block in editor

## 2. Bubble Menu - Two-Tier System

### 2.1 Tier 1: Formatting + AI Entry

When text is selected, show standard formatting options plus AI entry:

```
┌──────────────────────────────────────────────┐
│ [B] [I] [U] [S] [</>] [Link] │ [✨ Use AI]  │
└──────────────────────────────────────────────┘
```

**Specifications:**
- **Divider**: Vertical line separating formatting from AI
- **AI Button**: 
  - Icon: Sparkle (✨)
  - Text: "Use AI"
  - Style: Accent background on hover
  - Min width: 80px

### 2.2 Tier 2: AI Commands

When "Use AI" is clicked, menu transforms:

```
┌────────────────────────────────────────────────────┐
│ [←] AI Commands                                    │
├────────────────────────────────────────────────────┤
│ [✏️ Improve writing]  [📏 Make shorter]            │
│ [📝 Fix grammar]      [➕ Make longer]             │
│ [🎯 Simplify]         [🎓 Make formal]             │
│ [💬 Make casual]      [⚡ Custom...]               │
└────────────────────────────────────────────────────┘
```

**Specifications:**
- **Back Button**: Returns to Tier 1
- **Grid Layout**: 2 columns, 4 rows
- **Button Size**: Equal width, 36px height
- **Icons**: 16x16px with 8px gap to text
- **Hover**: Accent background with 100ms transition
- **Active Command**: Shows loading spinner in place

### 2.3 Custom Command Input

When "Custom..." is selected:

```
┌────────────────────────────────────────────────────┐
│ [←] Custom AI Edit                                 │
├────────────────────────────────────────────────────┤
│ [Describe what you want...              ] [Apply] │
│ Examples: "make it rhyme", "add humor"            │
└────────────────────────────────────────────────────┘
```

### 2.4 Loading State

During AI processing:

```
┌────────────────────────────────────────────────────┐
│ [Spinner] AI is thinking...                        │
└────────────────────────────────────────────────────┘
```

## 3. Implementation Updates

### 3.1 Component Changes

#### Remove:
- `ai-assistant-panel.tsx` (floating panel)
- Panel positioning logic
- Panel drag handling

#### Add:
- `ai-inline-interface.tsx` (new inline component)
- `bubble-menu-tier-system.tsx` (two-tier menu)
- `ai-suggestions.ts` (context-aware suggestions)

### 3.2 New Inline AI Component

Create `features/ai/components/ai-inline-interface.tsx`:

```typescript
interface AIInlineInterfaceProps {
  editor: Editor;
  position: number; // Document position where triggered
  onClose: () => void;
  trigger: 'slash' | 'space'; // How it was triggered
}

export function AIInlineInterface({ 
  editor, 
  position, 
  onClose,
  trigger 
}: AIInlineInterfaceProps) {
  const [mode, setMode] = useState<'input' | 'response'>('input');
  const [showSuggestions, setShowSuggestions] = useState(true);
  
  // Get context-aware suggestions
  const suggestions = useAISuggestions(editor, position);
  
  // ... rest of implementation
}
```

### 3.3 Space Trigger Detection

Update `features/editor/extensions/ai-triggers.ts`:

```typescript
export const AITriggers = Extension.create({
  name: 'aiTriggers',
  
  addKeyboardShortcuts() {
    return {
      'Space': ({ editor }) => {
        const { $from } = editor.state.selection;
        const isEmptyLine = $from.parent.textContent === '';
        const isStartOfLine = $from.parentOffset === 0;
        
        if (isEmptyLine && isStartOfLine) {
          // Transform line into AI interface
          editor.commands.openInlineAI('space');
          return true;
        }
        
        return false; // Let normal space handling continue
      }
    };
  }
});
```

### 3.4 Updated AI Suggestions

Create `features/ai/utils/suggestions.ts`:

```typescript
export function getAISuggestions(
  editor: Editor, 
  position: number
): AISuggestion[] {
  const doc = editor.state.doc;
  const { $from } = editor.state.selection;
  
  // Context analysis
  const isEndOfParagraph = $from.parent.lastChild === $from.node;
  const hasContent = doc.textContent.length > 100;
  const lastParagraph = $from.parent.textContent;
  
  const suggestions: AISuggestion[] = [];
  
  // Continue writing (if at end of paragraph with content)
  if (isEndOfParagraph && lastParagraph.length > 20) {
    suggestions.push({
      icon: '✏️',
      label: 'Continue writing',
      prompt: 'Continue this thought...',
    });
  }
  
  // Add summary (if document has substantial content)
  if (hasContent && doc.textContent.length > 500) {
    suggestions.push({
      icon: '📝',
      label: 'Add a summary',
      prompt: 'Summarize the key points above',
    });
  }
  
  // Make list (if previous paragraph looks like it could be a list)
  if (lastParagraph.includes(',') || lastParagraph.includes(';')) {
    suggestions.push({
      icon: '📋',
      label: 'Make a bullet list',
      prompt: 'Turn the above into a bullet list',
    });
  }
  
  // Always available
  suggestions.push({
    icon: '✨',
    label: 'Write anything...',
    prompt: '', // Empty prompt for freeform
  });
  
  return suggestions.slice(0, 4); // Max 4 suggestions
}
```

### 3.5 Animation Specifications

```css
/* Inline AI interface animations */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ai-inline-enter {
  animation: slideDown 200ms ease-out;
}

.ai-inline-exit {
  animation: slideDown 150ms ease-in reverse;
}

/* Bubble menu transition */
.bubble-menu-tier {
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.bubble-menu-tier-enter {
  transform: translateX(0);
}

.bubble-menu-tier-exit {
  transform: translateX(-100%);
}
```

## 4. Updated User Flows

### 4.1 Quick AI Edit Flow
1. User selects text
2. Bubble menu appears with format options + "Use AI"
3. User clicks "Use AI"
4. Menu slides to show AI commands
5. User selects command (e.g., "Make shorter")
6. Loading state in bubble menu
7. Selected text is replaced with AI result
8. Success toast appears

### 4.2 AI Assistant Flow
1. User presses Space on empty line (or types /ai)
2. Line transforms into inline AI interface
3. User sees suggestions or types custom prompt
4. Presses Enter to submit
5. Response streams in below input
6. User chooses: Accept, Insert below, Discard, or Try again
7. Interface closes, content is inserted/updated

### 4.3 Back Navigation Flow
- In bubble menu: Click ← to return to formatting options
- In AI interface: Click X or press Escape to close
- Custom command: Click ← to return to AI commands

## 5. Benefits of This Approach

1. **Consistency**: Inline interface matches note-taking flow
2. **Discoverability**: Space trigger is intuitive
3. **Separation**: AI chat (future) vs AI editing (current) are distinct
4. **Clean UI**: Two-tier bubble menu prevents clutter
5. **Context**: Suggestions help users understand capabilities
6. **Speed**: Inline is faster than opening/positioning panels

## 6. Migration Notes

For developers implementing these changes:

1. **State Management**: 
   - Remove floating panel state
   - Add inline interface state to editor
   - Track which tier of bubble menu is active

2. **Event Handling**:
   - Update Space key handler
   - Add bubble menu tier transitions
   - Handle Escape consistently

3. **Testing**:
   - Test Space trigger doesn't interfere with normal typing
   - Verify animations are smooth
   - Ensure bubble menu tiers transition correctly
   - Test keyboard navigation through suggestions

This updated design provides a more integrated, Notion-like experience while maintaining clear separation between quick AI edits and the future AI chat feature.