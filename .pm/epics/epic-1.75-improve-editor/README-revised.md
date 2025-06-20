# Revised Sprint Plan: Notion-like Editor Enhancement
_Adapted for the Existing Service-Oriented Architecture_

## Overview
This document revises the original "Notion-like Editor" sprint plan to align with the project's existing high-performance, service-oriented architecture. The user-facing goals remain identical, but the implementation strategy is adapted to ensure architectural integrity, maintainability, and stability.

**Key Architectural Principles for This Epic:**
1.  **Preserve the Service Layer:** All new editor extensions and Tiptap configuration will be integrated directly into `features/editor/services/EditorService.ts`. We will **not** create a new editor component with the `useEditor` hook.
2.  **Integrate with Canvas UI:** All UI changes will be made within the existing `app/(canvas)/page.tsx` and its `NoteComponent`. We will **not** create a new, separate note page. The Notion-like "page" feel will be achieved by conditionally altering the styling of `NoteComponent`.
3.  **Adapt to Existing Theme:** All CSS from the original plan will be adapted to use the established theme variables (`--background`, `--foreground`, `oklch`, etc.) from `app/globals.css`.
4.  **Leverage Libraries for Complexity:** We will use `tiptap-extension-dnd` for drag-and-drop functionality to reduce technical risk and development time.

---

## Sprint 1: Core Notion Foundation (Adapted)

### Day 1: Dependencies, Core Styling & Service Integration

#### 1.1 Install Dependencies
First, we will install all required and missing dependencies.

```bash
# Install missing tiptap extensions, UI libraries, and DnD extension
bun add @tiptap/extension-bubble-menu @tiptap/suggestion framer-motion vaul tiptap-extension-dnd
```
*Note: `cmdk`, `@tiptap/extension-task-list`, `@tiptap/extension-task-item`, and `@tiptap/extension-horizontal-rule` are already installed.*

#### 1.2 Adapt `EditorService.ts` with New Extensions
We will modify `features/editor/services/EditorService.ts` to include the foundational extensions for a Notion-like experience.

```typescript
// features/editor/services/EditorService.ts

// ... imports
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import HorizontalRule from '@tiptap/extension-horizontal-rule';

// ... inside EditorService constructor
this._editor = new Editor({
  extensions: [
    StarterKit.configure({
      // Add Notion-style classes to each node type
      paragraph: {
        HTMLAttributes: {
          class: 'notion-block',
        },
      },
      heading: {
        levels: [1, 2, 3],
        HTMLAttributes: {
          class: 'notion-block',
        },
      },
      // ... configure other nodes like lists, blockquotes, etc.
    }),
    HorizontalRule,
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    Placeholder.configure({
      placeholder: ({ node }) => {
        if (node.type.name === 'heading') {
          return `Heading ${node.attrs.level}`;
        }
        return "Type '/' for commands, or just start writing...";
      },
    }),
    // The existing SpellCheckExtension remains here
    SpellCheckExtension.configure({
      registry: this.errorRegistry,
    }),
  ],
  // ... rest of the existing configuration
});
```

#### 1.3 Adapt and Integrate Global Styles
The styles from the sprint plan will be added to `app/globals.css`, but adapted to use our `oklch` theme variables.

```css
/* app/globals.css */

/* ... after existing @layer base */
@layer base {
  /* ... existing base styles */

  /* Notion Typography & Block Styles */
  .prose h1 {
    font-size: 40px;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.02em;
  }
  
  .prose p {
    line-height: 1.8;
  }
  
  /* ... other typography styles from plan, adapted to fit project */

  .notion-block:hover {
    background-color: oklch(from var(--card) l c h / 0.03);
  }

  .dark .notion-block:hover {
    background-color: oklch(from var(--card) l c h / 0.05);
  }

  /* Placeholder text style */
  .prose .is-empty::before {
    content: attr(data-placeholder);
    float: left;
    color: oklch(var(--muted-foreground));
    opacity: 0.6;
    pointer-events: none;
    height: 0;
  }

  /* ... etc, for all other styles */
}
```

#### 1.4 Modify Canvas Layout for "Page" View
We will update `app/(canvas)/page.tsx` and its `NoteComponent` to conditionally remove the `Card` styling, allowing the editor to feel like a full page.

```typescript
// app/(canvas)/page.tsx -> inside NoteComponent

// ... imports
import { cn } from '@/lib/utils'; // Make sure you have this utility

function NoteComponent({ note, onClose, content, onContentChange, isPrimaryView }) {
  const containerClasses = cn(
    "h-full flex flex-col",
    {
      "card": !isPrimaryView, // Apply card styles only when not primary
      "p-0": isPrimaryView // Remove padding for page view
    }
  );

  return (
    <div className={containerClasses}>
      {/* Header remains, but could be styled differently for page view */}
      <CardHeader>...</CardHeader>
      
      <CardContent className={cn("flex-1 overflow-y-auto", { "p-0": isPrimaryView })}>
        <div className={cn({ "mx-auto max-w-[900px] px-24 pt-12": isPrimaryView })}>
          <NovelEditor 
            onChange={onContentChange}
            content={content}
          />
        </div>
      </CardContent>
    </div>
  );
}

// app/(canvas)/page.tsx -> inside CanvasPage

// ... inside single view logic
if (viewConfig.primary === 'note' && activeNote) {
  return (
    <div className="h-full">
      <NoteComponent 
        note={activeNote} 
        onClose={closeNote}
        content={content}
        onContentChange={handleUpdate}
        isPrimaryView={true} // Pass prop to indicate it's the main view
      />
    </div>
  );
}

// ... inside split view logic
// Primary Panel
<ResizablePanel ...>
  <NoteComponent note={activeNote} isPrimaryView={false} ... />
</ResizablePanel>
```

### Day 2: Block Controls & Inline Toolbar

The goal is to add the floating bubble menu for text formatting and a hover menu for block-level actions.

#### 2.1 Integrate Bubble Menu
We'll add the `BubbleMenuPlugin` to `EditorService` and create the `InlineToolbar` component inside `novel-editor.tsx`.

```typescript
// features/editor/services/EditorService.ts
import { BubbleMenuPlugin } from '@tiptap/extension-bubble-menu';

// ... in constructor
this._editor = new Editor({
  extensions: [
    // ... all other extensions
  ],
  editorProps: {
    // ... existing editorProps
    // The BubbleMenu component will be rendered from novel-editor.tsx
  }
});
```

```typescript
// features/editor/components/novel-editor.tsx

import { BubbleMenu } from '@tiptap/react';
// Assume InlineToolbar component is created as per original plan
import { InlineToolbar } from './inline-toolbar'; 

export function NovelEditor({ ... }) {
  // ... existing logic

  if (!editor) {
    return <div ... />;
  }

  return (
    <div className="relative w-full">
      <NovelEditorContentDynamic editor={editor} ... />
      <BubbleMenu editor={editor}>
        <InlineToolbar editor={editor} />
      </BubbleMenu>
      {/* BlockMenu will be added here too */}
    </div>
  );
}
```

#### 2.2 Implement Block Controls
The "plus" button and drag handle will be implemented as a separate component (`BlockMenu`) and rendered within `novel-editor.tsx`. This will be a pure UI component that appears on hover, managed by React state within the editor component.

### Day 3: Slash Commands

We will implement the slash command menu for quickly creating different block types.

#### 3.1 Integrate Slash Command Extension
The `suggestion` utility will be configured within `EditorService.ts`.

```typescript
// features/editor/services/EditorService.ts
import { SlashCommand } from '../extensions/slash-command'; // To be created
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import { SlashCommandMenu } from '../components/slash-command-menu'; // To be created

// ... in constructor
this._editor = new Editor({
  extensions: [
    // ... other extensions
    SlashCommand.configure({
      suggestion: {
        // The render logic from the original plan goes here.
        // It uses tippy.js and a ReactRenderer to show the SlashCommandMenu.
      },
    }),
  ],
  // ...
});
```
The `slash-command.ts` extension and `slash-command-menu.tsx` component will be created as outlined in the original plan, as they are architecturally sound.

---

## Sprint 2: Advanced Features & Polish (Adapted)

### Day 4: Drag & Drop

#### 4.1 Use a Library-based Approach
Instead of a complex manual implementation, we will use `tiptap-extension-dnd`.

```typescript
// features/editor/services/EditorService.ts
import { Dnd } from 'tiptap-extension-dnd';

// ... in constructor
this._editor = new Editor({
  extensions: [
    new Dnd(),
    // ... other extensions
  ],
  // ...
});

// We must also modify the node configurations to include a drag handle.
StarterKit.configure({
  paragraph: {
    HTMLAttributes: {
      class: 'notion-block',
      'data-type': 'draggable-item', // Required for DnD
    },
  },
  // ... and for all other block-level nodes
})
```

We will then add a drag handle element to our `BlockMenu` component, with the `data-drag-handle` attribute. This is a much cleaner and more robust solution.

### Day 5: AI Integration & Inline Commands

This part of the plan remains largely the same, as it involves creating a new extension and a UI component. The key is that the `AICommand` extension will be added to the extensions array in `EditorService.ts`.

### Day 6: Final Polish & Performance

#### 6.1 Keyboard Shortcuts
The `KeyboardShortcuts` extension will be created as planned and integrated into `EditorService.ts`.

#### 6.2 Performance
Our architecture is already designed for performance. We will ensure that any new `onUpdate` logic within `EditorService.ts` leverages our existing `ChangeDetector` and `debounce` mechanisms to prevent performance degradation, rather than adding new, separate performance utilities.

---
This revised plan ensures we achieve the desired Notion-like editor functionality while adhering to the high-quality architectural standards already in place. 