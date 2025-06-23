# Sprint 2: AI Interface Improvements

## Sprint Goal
Enhance AI interface features and improve output formatting for better user experience.

## Context
Following Sprint 1's fixes to ghost completions and bubble menu, we need to improve how users interact with AI-generated content and ensure proper formatting.

## Tasks

### Phase 1: Add Edit Prompt Feature ✅
- [x] Add "Edit Prompt" button to inline AI interface
- [x] Store original prompt for editing
- [x] Allow users to modify and re-run prompts
- [x] Add edit mode UI state

**Implementation Details:**
- Added `originalPrompt` and `isEditing` state to track prompts
- Added Edit2 icon button that shows after generation
- Created edit mode with textarea and Update/Cancel buttons
- "Try Again" now uses the original prompt, not the edited one
- Improved UI layout with sticky header/footer and scrollable content area

### Phase 2: Fix AI Output Formatting 🚧
- [x] Update system prompts to use editor-native blocks
- [x] Create JSON response format for AI
- [x] Parse AI responses as structured blocks
- [x] Insert blocks using editor's native API
- [ ] Test with various prompt types

**Implementation Details:**
- Created `EDITOR_BLOCK_INSTRUCTIONS` system prompt
- AI now outputs JSON with block types matching editor
- Added `insertBlocks` function to handle all block types
- Supports: paragraph, heading, codeBlock, lists, blockquote
- Falls back to plain text if JSON parsing fails

### Phase 3: Improve UI Layout
- [ ] Fix scrolling issues in AI interface
- [ ] Improve response area styling
- [ ] Add loading states and animations
- [ ] Ensure proper overflow handling

## Technical Approach

### Editor-Native Block System
Instead of using markdown parsing, we're having the AI output structured JSON:
```json
{
  "blocks": [
    {
      "type": "codeBlock",
      "attrs": { "language": "javascript" },
      "content": "console.log('Hello')"
    }
  ]
}
```

This allows direct insertion using Tiptap's API without conversion.

## Success Criteria
- [ ] Users can edit and re-submit prompts
- [ ] Code requests generate proper code blocks
- [ ] Lists and headings format correctly
- [ ] No markdown artifacts in output

## Dependencies
- Tiptap editor extensions
- AI completion API

## Session Summary

**Date:** 2024-12-29

**Completed:**
- Implemented Edit Prompt feature with full UI
- Updated AI system prompts to output JSON blocks
- Modified completion API to handle 'inline-ai' mode
- Created block insertion logic for all editor types
- Fixed build error by removing unused file

**Files Changed:**
- `modified: features/ai/components/ai-inline-interface.tsx`
- `modified: features/ai/lib/ai-config.ts`
- `modified: features/ai/hooks/use-ai-completion.ts`
- `modified: app/api/ai/completion/route.ts`
- `deleted: features/organization/components/change-icon-dialog.tsx`

**Remaining:**
- Test various prompt types to ensure formatting works
- Improve UI layout if needed
- Move to Phase 3 tasks

**Next Steps:**
1. Test the new JSON output with various prompts
2. Ensure all block types render correctly
3. Fix any UI issues that arise
4. Consider adding more block types if needed 