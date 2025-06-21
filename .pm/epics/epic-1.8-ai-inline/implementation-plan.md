# Implementation Plan: Inline AI & Bubble Menu

## Overview

This document outlines the implementation plan for integrating AI-powered features into the editor, as detailed in `AI-addendum.md` and our planning discussion. The scope is strictly limited to two features:

1.  **Inline AI Assistant**: A node-based interface triggered by `/ai` for generating content.
2.  **Two-Tier Bubble Menu**: An extension of the existing bubble menu to include contextual AI text transformations.

The "Ghost Completions" (`++`) feature is explicitly deferred. All work will adhere to the project's existing architectural patterns and coding standards.

---

## Sprint 1: Core Infrastructure & Inline AI Node

**Goal**: Establish the backend APIs and create the foundational TipTap node for the Inline AI Assistant.

**User Story**: As a user, when I type `/ai`, the command prompt is replaced by an AI input interface.

### Tasks:

1.  **Create API Routes**:
    *   `app/api/ai/completion/route.ts`: Handles one-shot generation requests from the inline assistant. It will take a prompt and stream a response.
    *   `app/api/ai/transform/route.ts`: Handles text transformation requests from the bubble menu. It will take a selection of text and a command (e.g., 'shorter') and stream a response.

2.  **Create Shared AI Configuration**:
    *   `features/ai/lib/ai-config.ts`: Create a centralized file to hold `AI_MODELS`, `AI_TEMPERATURES`, `AI_MAX_TOKENS`, and `AI_SYSTEM_PROMPTS` as detailed in `AI.md`, to ensure consistency across all AI features.
    *   `features/ai/lib/ai-errors.ts`: Create a utility for handling common AI API errors and displaying user-friendly `toast` notifications.

3.  **Create TipTap Node for Inline AI**:
    *   `features/ai/extensions/inline-ai.ts`: Define a new TipTap node (`inline-ai`). This node will be responsible for rendering the React component that houses the AI interface.
    *   Use a `ReactNodeViewRenderer` to render `features/ai/components/ai-inline-interface.tsx`.

4.  **Create Inline AI Component (Structure Only)**:
    *   `features/ai/components/ai-inline-interface.tsx`: Create the basic functional component with placeholders for the UI elements described in `AI-addendum.md` (input, buttons, response area).

5.  **Integrate Slash Command**:
    *   Modify `features/editor/extensions/slash-command.tsx`: Add an "Ask AI" item to `getSuggestionItems`.
    *   The `command` function will delete the `/ai` trigger text and insert the new `inline-ai` node at the current position.

6.  **Register Extension**:
    *   Modify `features/editor/config/extensions.ts`: Register the new `inline-ai` extension with the editor.

---

## Sprint 2: Inline AI Functionality & UI

**Goal**: Build out the full functionality of the Inline AI Assistant.

**User Story**: As a user, I can type a prompt into the AI interface, receive a streamed response, and choose to accept, discard, or retry the suggestion.

### Tasks:

1.  **Develop AI Completion Hook**:
    *   `features/ai/hooks/use-ai-completion.ts`: Create a hook that uses `useCompletion` from the Vercel AI SDK. This hook will manage the API call to `/api/ai/completion`, handle `isLoading`, `error`, and `completion` states.

2.  **Implement Full Inline UI**:
    *   Flesh out `features/ai/components/ai-inline-interface.tsx` with the complete UI from the design specs, including the header, input field, and action buttons.
    *   Implement context-aware suggestions based on `features/ai/utils/suggestions.ts` from `AI-addendum.md`.

3.  **Connect Hook to Component**:
    *   Integrate `use-ai-completion` into the `ai-inline-interface.tsx` component.
    *   On prompt submission (e.g., pressing `Enter`), call the hook to fetch the AI response.
    *   Display a loading state while the response is being generated.
    *   Stream the response text into the designated response area.

4.  **Implement Action Button Logic**:
    *   **Accept**: The action will replace the `inline-ai` node with the generated content, parsed as TipTap nodes.
    *   **Discard**: The action will remove the `inline-ai` node and replace it with an empty paragraph.
    *   **Try Again**: The action will re-submit the same prompt to the AI.
    *   **Insert Below**: The action will insert the content below the current block and remove the `inline-ai` node.

5.  **Add Animations**:
    *   Implement the `slideDown` and `fadeIn` animations as specified in the addendum.

---

## Sprint 3: Bubble Menu UI Refactor

**Goal**: Rearchitect the bubble menu to support the two-tier system.

**User Story**: As a user, when I select text, I see a "Use AI" button in the bubble menu. Clicking it transitions to a new panel with AI commands.

### Tasks:

1.  **Refactor `EditorBubbleMenu`**:
    *   Modify `features/editor/components/editor-bubble-menu.tsx` to be stateful.
    *   Use `useState` to track the active tier (`'format'` or `'ai'`).
    *   Tier 1 (default): Display the existing format buttons and replace the disabled "Ask AI" button with an active "Use AI" button (`<Wand2 />` icon).
    *   Clicking "Use AI" will switch the state to `'ai'`.

2.  **Create AI Command Panel UI**:
    *   `features/ai/components/ai-bubble-menu-commands.tsx`: Create a new component to render the Tier 2 UI.
    *   This component will display the grid of AI commands ("Improve writing," "Make shorter," etc.) as specified in the addendum.
    *   Include the "Back" button to switch the state back to `'format'`.
    *   Include the "Custom..." button and its corresponding input view.

3.  **Implement Menu Transition**:
    *   Conditionally render the standard format controls or the `ai-bubble-menu-commands.tsx` component based on the active state.
    *   Apply the specified slide transition animations for entering and exiting tiers.

---

## Sprint 4: Bubble Menu Functionality

**Goal**: Wire up the Bubble Menu AI commands to perform text transformations.

**User Story**: As a user, I can select an AI command from the bubble menu to transform my selected text.

### Tasks:

1.  **Develop AI Transform Hook**:
    *   `features/ai/hooks/use-ai-transform.ts`: Create a hook that uses `useCompletion`. It will call the `/api/ai/transform` endpoint, passing the selected text, the chosen operation, and an optional custom prompt.

2.  **Connect Hook to Command Panel**:
    *   Integrate `use-ai-transform` into `ai-bubble-menu-commands.tsx`.
    *   When a user clicks a command button, get the selected text from the editor (`editor.state.selection`) and call the `transform` function from the hook.

3.  **Implement Text Replacement**:
    *   On successful completion, the hook should use the editor instance to delete the user's current selection and insert the streamed AI response in its place.
    *   The editor selection should automatically encompass the newly inserted text.

4.  **Implement Loading State**:
    *   While the AI response is streaming, the bubble menu should display a loading indicator ("AI is thinking...") as specified in the design.

---

## Sprint 5: Testing, Polishing & Edge Cases

**Goal**: Ensure both features are robust, performant, and handle all edge cases gracefully.

### Tasks:

1.  **Comprehensive Manual Testing**:
    *   **Inline AI**: Test trigger, prompt submission, all action buttons, and keyboard shortcuts (`Escape`).
    *   **Bubble Menu**: Test on various text selections (single word, multiple paragraphs), all AI commands, custom prompt flow, and back navigation.

2.  **Edge Case Handling**:
    *   **No Selection**: The "Use AI" button in the bubble menu should be disabled if no text is selected.
    *   **API Errors**: Ensure `handleAIError` correctly catches errors and displays user-friendly toasts for rate limits, long context, etc.
    *   **Undo/Redo**: Verify that all AI actions (insertions, transformations) can be correctly undone and redone using `Ctrl/Cmd+Z` and `Ctrl/Cmd+Y`.

3.  **Final Polish**:
    *   Review and refine all animations and transitions to ensure they are smooth.
    *   Ensure all icons, text, and spacing match the `AI-addendum.md` spec.
    *   Perform a final code review for clarity, consistency, and adherence to standards. 