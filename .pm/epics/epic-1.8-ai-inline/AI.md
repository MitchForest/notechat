# Complete AI Implementation Epic - Editor AI Features

## Epic Overview

**Goal**: Implement three AI-powered features in the editor: Ghost Completions, Bubble Menu AI Commands, and AI Assistant Panel.

**Duration**: 5-7 days  
**Team**: 1-2 developers  
**Priority**: High  

## Table of Contents
1. [Prerequisites & Setup](#prerequisites--setup)
2. [Architecture Overview](#architecture-overview)
3. [Sprint 1: Core AI Infrastructure (Day 1)](#sprint-1-core-ai-infrastructure-day-1)
4. [Sprint 2: Ghost Completions (Day 2-3)](#sprint-2-ghost-completions-day-2-3)
5. [Sprint 3: Bubble Menu AI (Day 4)](#sprint-3-bubble-menu-ai-day-4)
6. [Sprint 4: AI Assistant Panel (Day 5)](#sprint-4-ai-assistant-panel-day-5)
7. [Sprint 5: Integration & Testing (Day 6-7)](#sprint-5-integration--testing-day-6-7)
8. [Testing Checklist](#testing-checklist)
9. [Common Issues & Solutions](#common-issues--solutions)

## Prerequisites & Setup

### Required Knowledge
- React and TypeScript basics
- TipTap editor fundamentals
- Next.js App Router
- Basic understanding of streaming responses

### Dependencies to Install
```bash
npm install ai @ai-sdk/openai
```

### Environment Variables
Add to `.env.local`:
```env
OPENAI_API_KEY=sk-...your-key-here
```

### Understanding the ai-sdk

The `ai` package (Vercel AI SDK) provides:
1. **Streaming UI hooks**: `useChat`, `useCompletion` for React components
2. **Server utilities**: `streamText`, `generateText` for API routes
3. **Built-in error handling**: Automatic retry and rate limit handling
4. **Type safety**: Full TypeScript support

Key concepts:
- **Streaming**: AI responses come in chunks, not all at once
- **Hooks**: React hooks that manage AI state and streaming
- **Edge Runtime**: API routes run on Vercel Edge for better performance

## Architecture Overview

### System Design
```
┌─────────────────────────────────────────────────────┐
│                   Editor UI                          │
├──────────────┬──────────────┬──────────────────────┤
│   Ghost      │   Bubble     │    AI Assistant      │
│ Completions  │   Menu AI    │     Panel            │
└──────┬───────┴──────┬───────┴───────┬──────────────┘
       │              │               │
       ▼              ▼               ▼
┌─────────────────────────────────────────────────────┐
│                 AI Service Layer                     │
│              (features/ai/hooks/)                   │
└─────────────────────────┬───────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                API Routes (app/api/ai/)             │
│        (Edge Functions with Streaming)              │
└─────────────────────────┬───────────────────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │   OpenAI     │
                   │  GPT-4-mini  │
                   └──────────────┘
```

### Data Flow
1. User triggers AI feature (types `++`, clicks AI button, types `/ai`)
2. React component uses ai-sdk hook (`useCompletion` or `useChat`)
3. Hook makes request to API route
4. API route uses `streamText` to get AI response
5. Response streams back to UI in real-time
6. UI updates as chunks arrive

## Sprint 1: Core AI Infrastructure (Day 1)

### 1.1 Create AI Type Definitions

Create `features/ai/types.ts`:

```typescript
// AI operation types - what the AI can do
export type AIOperation = 
  | 'continue'      // Ghost completion
  | 'improve'       // Make writing better
  | 'shorter'       // Make more concise
  | 'longer'        // Add more detail
  | 'fix'           // Fix grammar/spelling
  | 'simplify'      // Simpler language
  | 'formal'        // Professional tone
  | 'casual'        // Conversational tone
  | 'custom';       // User-defined instruction

// Context for AI operations
export interface AIContext {
  text: string;           // The text to work with
  operation: AIOperation; // What to do
  customPrompt?: string;  // For custom operations
}

// Error types for better error handling
export interface AIError {
  message: string;
  code: 'rate_limit' | 'invalid_request' | 'api_error';
  details?: any;
}
```

### 1.2 Create Shared AI Configuration

Create `lib/ai/config.ts`:

```typescript
import { openai } from '@ai-sdk/openai';

// Model configuration
export const AI_MODELS = {
  fast: openai('gpt-4o-mini'),     // For quick operations
  accurate: openai('gpt-4o-mini'), // Same for now, can upgrade later
} as const;

// Temperature settings (0 = deterministic, 1 = creative)
export const AI_TEMPERATURES = {
  continue: 0.7,    // More creative for completions
  transform: 0.3,   // More consistent for edits
  assistant: 0.5,   // Balanced for chat
} as const;

// Token limits to prevent runaway costs
export const AI_MAX_TOKENS = {
  continue: 100,    // Short completions
  transform: 1000,  // Longer for rewrites
  assistant: 1500,  // Longest for chat
} as const;

// System prompts - instructions for the AI
export const AI_SYSTEM_PROMPTS = {
  continue: 'You are a helpful writing assistant. Continue the text naturally, maintaining the same style and tone. Respond with only the continuation, no explanations.',
  
  improve: 'Improve the clarity, flow, and style of this text while preserving its meaning and tone. Respond with only the improved text.',
  
  shorter: 'Make this text more concise without losing important information. Remove unnecessary words and simplify where possible. Respond with only the shortened text.',
  
  longer: 'Expand this text with more detail, examples, or explanation while maintaining the same tone. Respond with only the expanded text.',
  
  fix: 'Fix all grammar, spelling, and punctuation errors in this text. Maintain the original style and meaning. Respond with only the corrected text.',
  
  simplify: 'Rewrite this text using simpler, more accessible language. Avoid jargon and complex sentences. Respond with only the simplified text.',
  
  formal: 'Rewrite this text in a more formal, professional tone. Respond with only the formal text.',
  
  casual: 'Rewrite this text in a more casual, conversational tone. Respond with only the casual text.',
  
  custom: (instruction: string) => `Follow this instruction: "${instruction}". Respond with only the transformed text, no explanations.`,
} as const;
```

### 1.3 Create Error Handler Utility

Create `lib/ai/errors.ts`:

```typescript
import { toast } from 'sonner';
import { AIError } from '@/features/ai/types';

export function handleAIError(error: unknown): AIError {
  console.error('AI Error:', error);
  
  // Check if it's an API error from OpenAI
  if (error instanceof Error) {
    // Rate limit error
    if (error.message.includes('rate limit') || error.message.includes('429')) {
      toast.error('AI rate limit reached. Please try again in a few moments.');
      return {
        code: 'rate_limit',
        message: 'Too many requests. Please wait a moment.',
      };
    }
    
    // Invalid request (like context too long)
    if (error.message.includes('context length') || error.message.includes('400')) {
      toast.error('Selected text is too long. Please select less text.');
      return {
        code: 'invalid_request',
        message: 'Text too long for AI processing.',
      };
    }
    
    // Generic API error
    toast.error('AI service error. Please try again.');
    return {
      code: 'api_error',
      message: error.message,
    };
  }
  
  // Unknown error
  toast.error('An unexpected error occurred.');
  return {
    code: 'api_error',
    message: 'Unknown error occurred',
  };
}
```

### 1.4 Create Database Schema for Usage Tracking

Create `lib/db/schema/ai-usage.ts`:

```typescript
import { pgTable, text, integer, timestamp, uuid } from 'drizzle-orm/pg-core';

export const aiUsage = pgTable('ai_usage', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(), // From Supabase auth
  operation: text('operation').notNull(),
  tokensUsed: integer('tokens_used').notNull(),
  cost: integer('cost'), // In cents
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Helper to log usage
export async function logAIUsage(
  userId: string,
  operation: string,
  tokensUsed: number
) {
  // Implementation will be added in integration phase
  console.log('AI Usage:', { userId, operation, tokensUsed });
}
```

## Sprint 2: Ghost Completions (Day 2-3)

### 2.1 Understanding Ghost Completions

Ghost completions show AI-suggested text when user types `++`. The text appears in gray and can be accepted with Tab.

### 2.2 Create Ghost Completion Extension

Create `features/ai/extensions/ghost-completion.ts`:

```typescript
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

// Define what our extension accepts as options
export interface GhostCompletionOptions {
  // Called when ++ is typed
  onTrigger: (context: { position: number; textBefore: string }) => void;
  // Called when Tab is pressed to accept
  onAccept: (text: string) => void;
  // Called when Escape is pressed to reject
  onReject: () => void;
  // The ghost text to display
  ghostText: string;
}

// Create a key for our plugin's state
const pluginKey = new PluginKey('ghostCompletion');

// Define the plugin's state structure
interface GhostState {
  active: boolean;
  position: number | null;
  decorations: DecorationSet;
}

export const GhostCompletion = Extension.create<GhostCompletionOptions>({
  name: 'ghostCompletion',

  // Default options
  addOptions() {
    return {
      onTrigger: () => {},
      onAccept: () => {},
      onReject: () => {},
      ghostText: '',
    };
  },

  // Add ProseMirror plugins
  addProseMirrorPlugins() {
    const extension = this;

    return [
      new Plugin<GhostState>({
        key: pluginKey,
        
        // Initialize state
        state: {
          init(_, state) {
            return {
              active: false,
              position: null,
              decorations: DecorationSet.empty,
            };
          },
          
          // Handle state changes
          apply(transaction, oldState, _, newState) {
            // Check if we have metadata about ghost text
            const meta = transaction.getMeta(pluginKey);
            
            if (meta?.action === 'show') {
              // Create decoration for ghost text
              const decoration = Decoration.inline(
                meta.position,
                meta.position,
                {
                  class: 'ghost-text',
                  'data-text': extension.options.ghostText,
                },
                { inclusiveStart: true, inclusiveEnd: false }
              );
              
              return {
                active: true,
                position: meta.position,
                decorations: DecorationSet.create(newState.doc, [decoration]),
              };
            }
            
            if (meta?.action === 'hide' || transaction.docChanged) {
              // Clear ghost text on any doc change or explicit hide
              return {
                active: false,
                position: null,
                decorations: DecorationSet.empty,
              };
            }
            
            // Map decorations through the transaction
            return {
              ...oldState,
              decorations: oldState.decorations.map(transaction.mapping, newState.doc),
            };
          },
        },
        
        // Props for rendering and interaction
        props: {
          // Render decorations
          decorations(state) {
            return pluginKey.getState(state)?.decorations || DecorationSet.empty;
          },
          
          // Handle text input
          handleTextInput(view, from, to, text) {
            const { state } = view;
            const textBefore = state.doc.textBetween(
              Math.max(0, from - 1),
              from
            );
            
            // Check if user typed second + to make ++
            if (text === '+' && textBefore === '+') {
              // Delete the ++ 
              const tr = state.tr.delete(from - 1, to);
              view.dispatch(tr);
              
              // Get context (last 500 chars)
              const contextStart = Math.max(0, from - 500);
              const context = state.doc.textBetween(contextStart, from - 1);
              
              // Trigger completion
              extension.options.onTrigger({
                position: from - 1,
                textBefore: context,
              });
              
              return true; // We handled it
            }
            
            return false; // Let TipTap handle it
          },
          
          // Handle keyboard shortcuts
          handleKeyDown(view, event) {
            const state = pluginKey.getState(view.state);
            
            if (!state?.active) return false;
            
            if (event.key === 'Tab') {
              event.preventDefault();
              extension.options.onAccept(extension.options.ghostText);
              return true;
            }
            
            if (event.key === 'Escape') {
              event.preventDefault();
              extension.options.onReject();
              return true;
            }
            
            // Any other key dismisses ghost text
            extension.options.onReject();
            return false;
          },
        },
      }),
    ];
  },

  // Add commands to control ghost text
  addCommands() {
    return {
      showGhostText: (position: number) => ({ tr, dispatch }) => {
        if (dispatch) {
          tr.setMeta(pluginKey, { action: 'show', position });
          dispatch(tr);
        }
        return true;
      },
      
      hideGhostText: () => ({ tr, dispatch }) => {
        if (dispatch) {
          tr.setMeta(pluginKey, { action: 'hide' });
          dispatch(tr);
        }
        return true;
      },
    };
  },
});
```

### 2.3 Create Ghost Completion Hook

Create `features/ai/hooks/use-ghost-completion.ts`:

```typescript
import { useCompletion } from 'ai/react';
import { useCallback, useRef } from 'react';
import { Editor } from '@tiptap/core';
import { toast } from 'sonner';
import { handleAIError } from '@/lib/ai/errors';

export function useGhostCompletion(editor: Editor | null) {
  // Keep track of where we're completing
  const positionRef = useRef<number | null>(null);
  
  // Use the ai-sdk's completion hook
  const {
    completion,      // The AI's response
    complete,        // Function to trigger completion
    isLoading,       // Loading state
    stop,           // Function to stop/cancel
    error,          // Error state
  } = useCompletion({
    api: '/api/ai/complete',
    onFinish: (prompt, completion) => {
      // Log for debugging
      console.log('Ghost completion finished:', { prompt, completion });
    },
    onError: (error) => {
      handleAIError(error);
    },
  });

  // Trigger completion when ++ is typed
  const triggerCompletion = useCallback(async (context: {
    position: number;
    textBefore: string;
  }) => {
    if (!editor) return;
    
    // Save position for later
    positionRef.current = context.position;
    
    // Show ghost text placeholder while loading
    editor.commands.showGhostText(context.position);
    
    // Call AI
    try {
      await complete(context.textBefore);
    } catch (error) {
      handleAIError(error);
      editor.commands.hideGhostText();
    }
  }, [editor, complete]);

  // Accept the completion
  const acceptCompletion = useCallback((text: string) => {
    if (!editor || positionRef.current === null) return;
    
    // Insert the completed text
    editor
      .chain()
      .focus()
      .insertContentAt(positionRef.current, text)
      .run();
    
    // Clean up
    editor.commands.hideGhostText();
    positionRef.current = null;
    stop(); // Stop the completion stream
  }, [editor, stop]);

  // Reject the completion
  const rejectCompletion = useCallback(() => {
    if (!editor) return;
    
    editor.commands.hideGhostText();
    positionRef.current = null;
    stop(); // Stop the completion stream
  }, [editor, stop]);

  return {
    ghostText: completion,
    isLoading,
    triggerCompletion,
    acceptCompletion,
    rejectCompletion,
  };
}
```

### 2.4 Add CSS for Ghost Text

Add to `features/editor/styles/editor.css`:

```css
/* Ghost text styling */
.ghost-text::after {
  content: attr(data-text);
  color: rgb(156 163 175); /* gray-400 */
  opacity: 0.7;
  font-style: italic;
  pointer-events: none;
  /* Fade in animation */
  animation: fadeIn 200ms ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 0.7;
  }
}

/* Optional: hint that appears */
.ghost-text-hint {
  position: fixed;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  z-index: 50;
  animation: slideUp 200ms ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(0.5rem);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
```

### 2.5 Create Completion API Route

Create `app/api/ai/complete/route.ts`:

```typescript
import { streamText } from 'ai';
import { AI_MODELS, AI_TEMPERATURES, AI_MAX_TOKENS, AI_SYSTEM_PROMPTS } from '@/lib/ai/config';
import { NextRequest } from 'next/server';

// Use Edge Runtime for better performance
export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    // Get the text context from request
    const { text } = await req.json();
    
    if (!text || typeof text !== 'string') {
      return new Response('Invalid request: text is required', { status: 400 });
    }
    
    // Call AI with streaming
    const result = await streamText({
      model: AI_MODELS.fast,
      messages: [
        {
          role: 'system',
          content: AI_SYSTEM_PROMPTS.continue,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: AI_TEMPERATURES.continue,
      maxTokens: AI_MAX_TOKENS.continue,
    });
    
    // Return the stream
    return result.toDataStreamResponse();
    
  } catch (error) {
    console.error('Completion error:', error);
    
    // Check for specific errors
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return new Response('Rate limit exceeded', { status: 429 });
      }
      if (error.message.includes('context length')) {
        return new Response('Text too long', { status: 400 });
      }
    }
    
    return new Response('Internal server error', { status: 500 });
  }
}
```

## Sprint 3: Bubble Menu AI (Day 4)

### 3.1 Update Bubble Menu Component

Update `features/editor/components/bubble-menu.tsx`:

```typescript
import { BubbleMenu } from '@tiptap/react';
import { Editor } from '@tiptap/core';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Sparkles,
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { useState } from 'react';
import { AICommandPanel } from '@/features/ai/components/ai-command-panel';

interface EditorBubbleMenuProps {
  editor: Editor;
}

export function EditorBubbleMenu({ editor }: EditorBubbleMenuProps) {
  const [showAI, setShowAI] = useState(false);
  
  // Existing format buttons
  const formatItems = [
    { name: 'bold', icon: Bold, action: () => editor.chain().focus().toggleBold().run() },
    { name: 'italic', icon: Italic, action: () => editor.chain().focus().toggleItalic().run() },
    { name: 'underline', icon: Underline, action: () => editor.chain().focus().toggleUnderline().run() },
    { name: 'strike', icon: Strikethrough, action: () => editor.chain().focus().toggleStrike().run() },
    { name: 'code', icon: Code, action: () => editor.chain().focus().toggleCode().run() },
  ];

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{
        duration: 100,
        placement: 'top',
      }}
      className="flex items-center rounded-md border bg-background shadow-md overflow-hidden"
    >
      {showAI ? (
        <AICommandPanel 
          editor={editor} 
          onClose={() => setShowAI(false)}
        />
      ) : (
        <>
          {/* Format buttons */}
          <div className="flex items-center gap-1 p-1">
            {formatItems.map((item) => (
              <Toggle
                key={item.name}
                size="sm"
                pressed={editor.isActive(item.name)}
                onPressedChange={item.action}
              >
                <item.icon className="h-4 w-4" />
              </Toggle>
            ))}
          </div>
          
          {/* Divider */}
          <div className="h-6 w-px bg-border" />
          
          {/* AI button */}
          <div className="p-1">
            <Toggle
              size="sm"
              pressed={false}
              onPressedChange={() => setShowAI(true)}
              className="gap-1"
            >
              <Sparkles className="h-4 w-4" />
              <span className="text-xs">AI</span>
            </Toggle>
          </div>
        </>
      )}
    </BubbleMenu>
  );
}
```

### 3.2 Create AI Command Panel

Create `features/ai/components/ai-command-panel.tsx`:

```typescript
import { Editor } from '@tiptap/core';
import { useState } from 'react';
import { 
  Edit2,        // Improve
  Minimize2,    // Shorter
  Maximize2,    // Longer
  CheckCircle,  // Fix grammar
  BookOpen,     // Simplify
  Briefcase,    // Formal
  MessageCircle,// Casual
  Zap,          // Custom
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAITransform } from '@/features/ai/hooks/use-ai-transform';
import { AIOperation } from '@/features/ai/types';

interface AICommandPanelProps {
  editor: Editor;
  onClose: () => void;
}

export function AICommandPanel({ editor, onClose }: AICommandPanelProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  
  // Get selected text
  const { from, to } = editor.state.selection;
  const selectedText = editor.state.doc.textBetween(from, to, ' ');
  
  // Use our AI transform hook
  const { transform, isLoading } = useAITransform(editor);
  
  // AI command options
  const commands = [
    { id: 'improve', label: 'Improve writing', icon: Edit2 },
    { id: 'shorter', label: 'Make shorter', icon: Minimize2 },
    { id: 'longer', label: 'Make longer', icon: Maximize2 },
    { id: 'fix', label: 'Fix grammar', icon: CheckCircle },
    { id: 'simplify', label: 'Simplify', icon: BookOpen },
    { id: 'formal', label: 'Make formal', icon: Briefcase },
    { id: 'casual', label: 'Make casual', icon: MessageCircle },
    { id: 'custom', label: 'Custom edit...', icon: Zap },
  ] as const;
  
  // Handle command execution
  const handleCommand = async (operation: AIOperation) => {
    if (operation === 'custom' && !showCustom) {
      setShowCustom(true);
      return;
    }
    
    // Transform the text
    await transform(selectedText, operation, customPrompt);
    onClose();
  };
  
  // Show custom input
  if (showCustom) {
    return (
      <div className="p-3 w-72">
        <div className="flex items-center gap-2 mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCustom(false)}
            className="h-6 w-6 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">Custom Edit</span>
        </div>
        
        <Input
          placeholder="e.g., 'make it sound more excited'"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && customPrompt.trim()) {
              handleCommand('custom');
            }
          }}
          autoFocus
          className="text-sm"
        />
        
        <p className="text-xs text-muted-foreground mt-2">
          Describe how you want to change the text
        </p>
        
        <Button
          size="sm"
          onClick={() => handleCommand('custom')}
          disabled={!customPrompt.trim() || isLoading}
          className="w-full mt-3"
        >
          Apply
        </Button>
      </div>
    );
  }
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="p-4 flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">AI is thinking...</span>
      </div>
    );
  }
  
  // Show command grid
  return (
    <div className="p-1 grid grid-cols-2 gap-1 w-72">
      {commands.map((cmd) => (
        <button
          key={cmd.id}
          onClick={() => handleCommand(cmd.id as AIOperation)}
          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors text-left"
        >
          <cmd.icon className="h-4 w-4 shrink-0" />
          <span>{cmd.label}</span>
        </button>
      ))}
    </div>
  );
}
```

### 3.3 Create AI Transform Hook

Create `features/ai/hooks/use-ai-transform.ts`:

```typescript
import { useCompletion } from 'ai/react';
import { useCallback } from 'react';
import { Editor } from '@tiptap/core';
import { toast } from 'sonner';
import { AIOperation } from '../types';
import { handleAIError } from '@/lib/ai/errors';

export function useAITransform(editor: Editor | null) {
  const {
    complete,
    completion,
    isLoading,
    error,
  } = useCompletion({
    api: '/api/ai/transform',
    onFinish: (prompt, completion) => {
      if (!editor) return;
      
      // Replace selected text with AI result
      const { from, to } = editor.state.selection;
      editor
        .chain()
        .focus()
        .deleteRange({ from, to })
        .insertContent(completion)
        .run();
      
      toast.success('Text transformed!');
    },
    onError: (error) => {
      handleAIError(error);
    },
  });

  const transform = useCallback(async (
    text: string,
    operation: AIOperation,
    customPrompt?: string
  ) => {
    if (!text.trim()) {
      toast.error('Please select some text first');
      return;
    }
    
    // Check text length
    if (text.length > 2000) {
      toast.error('Selected text is too long. Please select less text.');
      return;
    }
    
    try {
      await complete(text, {
        body: {
          operation,
          customPrompt,
        },
      });
    } catch (error) {
      handleAIError(error);
    }
  }, [complete]);

  return {
    transform,
    isLoading,
    result: completion,
  };
}
```

### 3.4 Create Transform API Route

Create `app/api/ai/transform/route.ts`:

```typescript
import { streamText } from 'ai';
import { AI_MODELS, AI_TEMPERATURES, AI_MAX_TOKENS, AI_SYSTEM_PROMPTS } from '@/lib/ai/config';
import { NextRequest } from 'next/server';
import { AIOperation } from '@/features/ai/types';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    // Get request data
    const { prompt: text, operation, customPrompt } = await req.json();
    
    // Validate inputs
    if (!text || typeof text !== 'string') {
      return new Response('Invalid request: text is required', { status: 400 });
    }
    
    if (!operation || typeof operation !== 'string') {
      return new Response('Invalid request: operation is required', { status: 400 });
    }
    
    // Get system prompt based on operation
    let systemPrompt: string;
    if (operation === 'custom' && customPrompt) {
      systemPrompt = AI_SYSTEM_PROMPTS.custom(customPrompt);
    } else if (operation in AI_SYSTEM_PROMPTS) {
      systemPrompt = AI_SYSTEM_PROMPTS[operation as keyof typeof AI_SYSTEM_PROMPTS] as string;
    } else {
      return new Response('Invalid operation', { status: 400 });
    }
    
    // Call AI
    const result = await streamText({
      model: AI_MODELS.fast,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: AI_TEMPERATURES.transform,
      maxTokens: AI_MAX_TOKENS.transform,
    });
    
    return result.toDataStreamResponse();
    
  } catch (error) {
    console.error('Transform error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return new Response('Rate limit exceeded', { status: 429 });
      }
      if (error.message.includes('context length')) {
        return new Response('Text too long', { status: 400 });
      }
    }
    
    return new Response('Internal server error', { status: 500 });
  }
}
```

## Sprint 4: AI Assistant Panel (Day 5)

### 4.1 Add AI Assistant to Slash Commands

Update `features/editor/extensions/slash-command.ts`:

```typescript
import { Sparkles } from 'lucide-react';

// Add to your existing suggestion items
export const suggestionItems = [
  // ... existing items ...
  {
    title: 'AI Assistant',
    description: 'Ask AI to help with your document',
    searchTerms: ['ai', 'assistant', 'help', 'chat'],
    icon: Sparkles,
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
      // Delete the /ai text
      editor.chain().focus().deleteRange(range).run();
      
      // Emit custom event to open AI assistant
      editor.emit('openAIAssistant', { position: range.from });
    },
  },
];
```

### 4.2 Create AI Assistant Panel

Create `features/ai/components/ai-assistant-panel.tsx`:

```typescript
import { useState, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/core';
import { X, Send, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAIAssistant } from '@/features/ai/hooks/use-ai-assistant';
import { cn } from '@/lib/utils';

interface AIAssistantPanelProps {
  editor: Editor;
  isOpen: boolean;
  position?: { from: number };
  onClose: () => void;
}

export function AIAssistantPanel({ 
  editor, 
  isOpen, 
  position,
  onClose 
}: AIAssistantPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [panelPosition, setPanelPosition] = useState({ top: 0, left: 0 });
  
  // Use AI assistant hook
  const {
    messages,
    input,
    setInput,
    sendMessage,
    isLoading,
    applyEdit,
  } = useAIAssistant(editor);
  
  // Calculate panel position
  useEffect(() => {
    if (!isOpen || !position || !editor.view) return;
    
    // Get cursor coordinates
    const coords = editor.view.coordsAtPos(position.from);
    const editorRect = editor.view.dom.getBoundingClientRect();
    
    // Calculate position (with bounds checking)
    let top = coords.top - editorRect.top + 30;
    let left = coords.left - editorRect.left;
    
    // Ensure panel stays within viewport
    const panelWidth = 400;
    const panelHeight = 500;
    
    if (left + panelWidth > window.innerWidth - 20) {
      left = window.innerWidth - panelWidth - 20;
    }
    
    if (top + panelHeight > window.innerHeight - 20) {
      top = coords.top - editorRect.top - panelHeight - 10;
    }
    
    setPanelPosition({ top, left });
    
    // Focus input when opened
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [isOpen, position, editor.view]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    await sendMessage(input);
    setInput('');
  };
  
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div
      ref={panelRef}
      className="fixed z-50 w-[400px] bg-background border rounded-lg shadow-xl animate-in fade-in slide-in-from-bottom-2"
      style={{
        top: `${panelPosition.top}px`,
        left: `${panelPosition.left}px`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">AI Assistant</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Messages */}
      <ScrollArea className="h-[300px] p-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-sm">How can I help with your document?</p>
            <p className="text-xs mt-2">
              Try: "Make the intro more engaging" or "Add a conclusion"
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex",
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Show apply button for assistant messages with edits */}
                  {message.role === 'assistant' && message.suggestedEdit && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => applyEdit(message.suggestedEdit!)}
                      className="mt-2 h-7 text-xs"
                    >
                      Apply Edit
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
      
      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about your document..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
```

### 4.3 Create AI Assistant Hook

Create `features/ai/hooks/use-ai-assistant.ts`:

```typescript
import { useChat } from 'ai/react';
import { useCallback, useEffect } from 'react';
import { Editor } from '@tiptap/core';
import { toast } from 'sonner';
import { handleAIError } from '@/lib/ai/errors';

interface SuggestedEdit {
  from: number;
  to: number;
  text: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  suggestedEdit?: SuggestedEdit;
}

export function useAIAssistant(editor: Editor | null) {
  const {
    messages: chatMessages,
    input,
    setInput,
    append,
    isLoading,
    error,
  } = useChat({
    api: '/api/ai/assistant',
    body: {
      // Include document context
      documentContent: editor?.getText() || '',
    },
    onError: (error) => {
      handleAIError(error);
    },
  });
  
  // Convert chat messages to our format
  const messages: Message[] = chatMessages.map(msg => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
    // Parse suggested edits from assistant messages
    suggestedEdit: msg.role === 'assistant' ? parseEdit(msg.content) : undefined,
  }));
  
  // Send a message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    try {
      await append({
        role: 'user',
        content,
      });
    } catch (error) {
      handleAIError(error);
    }
  }, [append]);
  
  // Apply a suggested edit
  const applyEdit = useCallback((edit: SuggestedEdit) => {
    if (!editor) return;
    
    try {
      editor
        .chain()
        .focus()
        .deleteRange({ from: edit.from, to: edit.to })
        .insertContent(edit.text)
        .run();
      
      toast.success('Edit applied!');
    } catch (error) {
      toast.error('Failed to apply edit');
    }
  }, [editor]);
  
  return {
    messages,
    input,
    setInput,
    sendMessage,
    isLoading,
    applyEdit,
  };
}

// Helper to parse edit suggestions from AI response
function parseEdit(content: string): SuggestedEdit | undefined {
  // Look for edit markers in the response
  // Format: [EDIT_START]text[EDIT_END]
  const editMatch = content.match(/\[EDIT_START\](.*?)\[EDIT_END\]/s);
  
  if (editMatch) {
    // For now, just return the text
    // In a real implementation, you'd also parse position info
    return {
      from: 0,
      to: 0,
      text: editMatch[1],
    };
  }
  
  return undefined;
}
```

### 4.4 Create Assistant API Route

Create `app/api/ai/assistant/route.ts`:

```typescript
import { streamText } from 'ai';
import { AI_MODELS, AI_TEMPERATURES, AI_MAX_TOKENS } from '@/lib/ai/config';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    // Get request data
    const { messages, documentContent } = await req.json();
    
    // Build AI messages with context
    const aiMessages = [
      {
        role: 'system' as const,
        content: `You are an AI writing assistant helping to edit a document. 
          The current document content is:
          
          """
          ${documentContent}
          """
          
          When suggesting edits, be specific about what to change and where.
          If suggesting replacement text, wrap it in [EDIT_START] and [EDIT_END] tags.
          Be helpful, concise, and focused on improving the document.`,
      },
      ...messages,
    ];
    
    // Call AI
    const result = await streamText({
      model: AI_MODELS.accurate,
      messages: aiMessages,
      temperature: AI_TEMPERATURES.assistant,
      maxTokens: AI_MAX_TOKENS.assistant,
    });
    
    return result.toDataStreamResponse();
    
  } catch (error) {
    console.error('Assistant error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return new Response('Rate limit exceeded', { status: 429 });
      }
    }
    
    return new Response('Internal server error', { status: 500 });
  }
}
```

## Sprint 5: Integration & Testing (Day 6-7)

### 5.1 Update Main Editor Component

Update `features/editor/components/editor.tsx`:

```typescript
"use client";

import "../styles/editor.css";
import { EditorContent } from "@tiptap/react";
import { useEffect, useState, useRef, useCallback } from "react";
import { EditorService } from "../services/EditorService";
import { type Editor as TiptapEditor } from "@tiptap/core";
import { EditorBubbleMenu } from "./bubble-menu";
import dynamic from "next/dynamic";
import { BlockHandleContainer } from "./block-handle-container";
import { DebugOverlay } from './debug-overlay';
import { AIProvider } from "@/features/ai/providers/ai-provider";
import { GhostCompletion } from "@/features/ai/extensions/ghost-completion";
import { useGhostCompletion } from "@/features/ai/hooks/use-ghost-completion";
import { AIAssistantPanel } from "@/features/ai/components/ai-assistant-panel";

const NovelEditorContentDynamic = dynamic(() => Promise.resolve(EditorContent), {
  ssr: false,
  loading: () => <div className="min-h-[500px] animate-pulse bg-muted rounded-lg" />
});

interface EditorProps {
  content?: string;
  onChange?: (content: string) => void;
}

export function Editor({ content = "", onChange }: EditorProps) {
  const editorService = useRef<EditorService | null>(null);
  const [editor, setEditor] = useState<TiptapEditor | null>(null);
  const [showAssistant, setShowAssistant] = useState(false);
  const [assistantPosition, setAssistantPosition] = useState<{ from: number } | undefined>();
  
  // Ghost completion hook
  const {
    ghostText,
    isLoading: ghostLoading,
    triggerCompletion,
    acceptCompletion,
    rejectCompletion,
  } = useGhostCompletion(editor);

  // Create editor with AI extensions
  useEffect(() => {
    if (!editorService.current) {
      const service = new EditorService();
      
      // Add ghost completion extension
      const ghostExtension = GhostCompletion.configure({
        onTrigger: triggerCompletion,
        onAccept: acceptCompletion,
        onReject: rejectCompletion,
        ghostText,
      });
      
      // Add extension to editor
      service.editor.registerPlugin(ghostExtension);
      
      editorService.current = service;
      setEditor(service.editor);
    }

    return () => {
      if (editorService.current) {
        editorService.current.destroy();
        editorService.current = null;
      }
    };
  }, []);

  // Handle content updates
  useEffect(() => {
    if (!editor || !onChange) return;

    const handleUpdate = () => {
      onChange(editor.getHTML());
    };

    editor.on('update', handleUpdate);

    const editorContent = editor.getHTML();
    if (content !== editorContent) {
      editor.commands.setContent(content, false);
    }
    
    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor, content, onChange]);

  // Listen for AI assistant trigger
  useEffect(() => {
    if (!editor) return;
    
    const handleOpenAssistant = ({ position }: { position: { from: number } }) => {
      setAssistantPosition(position);
      setShowAssistant(true);
    };
    
    editor.on('openAIAssistant', handleOpenAssistant);
    
    return () => {
      editor.off('openAIAssistant', handleOpenAssistant);
    };
  }, [editor]);

  if (!editor) {
    return <div className="min-h-[500px] animate-pulse bg-muted rounded-lg" />;
  }

  return (
    <AIProvider>
      <div className="relative w-full">
        {editor && <DebugOverlay editor={editor} />}
        {editor && <BlockHandleContainer editor={editor} />}
        
        {/* Updated bubble menu with AI */}
        <EditorBubbleMenu editor={editor} />
        
        {/* Editor content */}
        <NovelEditorContentDynamic 
          editor={editor} 
          className="relative pl-12"
        />
        
        {/* Ghost text hint */}
        {ghostLoading && (
          <div className="ghost-text-hint">
            AI is thinking...
          </div>
        )}
        
        {/* AI Assistant Panel */}
        <AIAssistantPanel
          editor={editor}
          isOpen={showAssistant}
          position={assistantPosition}
          onClose={() => {
            setShowAssistant(false);
            setAssistantPosition(undefined);
          }}
        />
      </div>
    </AIProvider>
  );
}

export const EditorClient = dynamic(
  () => Promise.resolve(Editor),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-[500px] animate-pulse bg-muted rounded-lg">
        <div className="p-8">
          <div className="h-4 bg-muted-foreground/20 rounded w-3/4 mb-4" />
          <div className="h-4 bg-muted-foreground/20 rounded w-1/2 mb-4" />
          <div className="h-4 bg-muted-foreground/20 rounded w-5/6" />
        </div>
      </div>
    )
  }
);
```

### 5.2 Add Environment Variable Check

Create `lib/ai/check-env.ts`:

```typescript
export function checkAIEnvironment() {
  if (!process.env.OPENAI_API_KEY) {
    console.warn(
      '⚠️  OpenAI API key not found. AI features will not work.\n' +
      'Add OPENAI_API_KEY to your .env.local file.'
    );
    return false;
  }
  
  // Validate API key format
  if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
    console.warn('⚠️  Invalid OpenAI API key format.');
    return false;
  }
  
  return true;
}
```

### 5.3 Add Usage Tracking

Update `lib/db/schema/ai-usage.ts`:

```typescript
import { db } from '@/lib/db';
import { aiUsage } from './schema';

export async function trackAIUsage(
  userId: string,
  operation: string,
  tokensUsed: number
) {
  try {
    await db.insert(aiUsage).values({
      userId,
      operation,
      tokensUsed,
      cost: Math.ceil(tokensUsed * 0.002), // Rough cost estimate
    });
  } catch (error) {
    console.error('Failed to track AI usage:', error);
    // Don't throw - we don't want to break the AI feature
  }
}
```

## Testing Checklist

### Ghost Completions
- [ ] Type `++` in the middle of a sentence
- [ ] Ghost text appears in gray italic
- [ ] Tab accepts the completion
- [ ] Escape dismisses it
- [ ] Continue typing dismisses it
- [ ] Works at document start/end
- [ ] Loading indicator shows while waiting
- [ ] Error toast appears on API failure

### Bubble Menu AI
- [ ] Select text and bubble menu appears
- [ ] AI button is visible with sparkle icon
- [ ] Clicking AI shows command grid
- [ ] All 8 operations work correctly
- [ ] Custom command shows input field
- [ ] Loading state replaces menu content
- [ ] Selected text is replaced with result
- [ ] Toast shows on success
- [ ] Error handling for long text

### AI Assistant
- [ ] Type `/ai` and see it in slash menu
- [ ] Selecting it opens panel at cursor
- [ ] Panel is positioned correctly
- [ ] Can type and send messages
- [ ] AI responds with relevant suggestions
- [ ] Escape or X closes panel
- [ ] Panel clears on close
- [ ] Loading indicator shows while thinking
- [ ] Error handling works

### Performance
- [ ] No lag when typing normally
- [ ] Ghost completions debounced properly
- [ ] Streaming responses feel smooth
- [ ] No memory leaks on component unmount

### Edge Cases
- [ ] Works with empty documents
- [ ] Handles very long selections gracefully
- [ ] Rate limit errors show proper message
- [ ] Works without OpenAI key (features disabled)
- [ ] Undo/redo works with AI edits

## Common Issues & Solutions

### Issue: Ghost text not appearing
**Solution**: Check that the CSS is loaded and the ghost-completion extension is registered properly.

### Issue: API routes returning 500
**Solution**: Verify OPENAI_API_KEY is set in .env.local and the key is valid.

### Issue: Streaming not working
**Solution**: Ensure you're using Edge Runtime (`export const runtime = 'edge'`) in API routes.

### Issue: Rate limit errors
**Solution**: The ai-sdk handles retries automatically. Show user-friendly message and ask them to wait.

### Issue: AI Assistant panel off-screen
**Solution**: The positioning logic includes bounds checking. Verify the calculations in useEffect.

## Next Steps

After completing this implementation:

1. **Monitoring**: Set up logging to track feature usage
2. **Optimization**: Add response caching for common operations
3. **Enhancement**: Add more AI operations based on user feedback
4. **Multi-note chat**: Build on this foundation for the chat feature

## Resources

- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs)
- [TipTap Extensions Guide](https://tiptap.dev/guide/custom-extensions)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [ProseMirror Guide](https://prosemirror.net/docs/guide/)

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify all environment variables are set
3. Check network tab for API responses
4. Review the error handling sections above