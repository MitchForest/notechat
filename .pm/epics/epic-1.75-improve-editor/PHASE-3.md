# AI Integration Epic: Editor AI Assistant

## Epic Overview
**Goal**: Integrate AI capabilities into the editor using Vercel AI SDK with a reusable architecture that supports both inline editor AI and future chat functionality.

**Duration**: 5-7 days  
**Priority**: High  
**Dependencies**: 
- OpenAI API key
- Vercel AI SDK
- Optional: Vercel KV for rate limiting

## Architecture Overview

### Core Principles
1. **Separation of Concerns**: AI logic separate from UI components
2. **Reusability**: Same AI service for editor and future chat
3. **Extensibility**: Easy to add new AI providers or features
4. **Type Safety**: Full TypeScript support
5. **Error Handling**: Graceful degradation if AI unavailable

### System Design
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Editor UI     │────▶│   AI Service    │────▶│  API Routes     │
│  (Extension)    │     │   (Abstract)    │     │  (/api/ai/*)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │   Future Chat   │
                        │      UI         │
                        └─────────────────┘
```

## Sprint 1: Core AI Infrastructure (Days 1-2)

### 1.1 Install Dependencies
```bash
npm install ai @ai-sdk/openai
npm install @upstash/ratelimit @vercel/kv # Optional for rate limiting
npm install ts-pattern # For pattern matching like Novel
```

### 1.2 Create AI Service Interface
```typescript
// lib/ai/types.ts
export type AIOperation = 
  | 'continue'
  | 'improve'
  | 'shorter'
  | 'longer'
  | 'fix'
  | 'zap';

export interface AIRequest {
  prompt: string;
  operation: AIOperation;
  command?: string; // For 'zap' operation
  context?: {
    beforeText?: string;
    afterText?: string;
    selectedText?: string;
  };
}

export interface AIResponse {
  text: string;
  tokensUsed?: number;
}

export interface AIStreamResponse {
  stream: ReadableStream;
  controller: AbortController;
}

export interface AIService {
  complete(request: AIRequest): Promise<AIResponse>;
  stream(request: AIRequest): Promise<AIStreamResponse>;
  isAvailable(): boolean;
}
```

### 1.3 Create AI Service Implementation
```typescript
// lib/ai/ai-service.ts
import { AIService, AIRequest, AIResponse, AIStreamResponse } from './types';

export class OpenAIService implements AIService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = '/api/ai') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async complete(request: AIRequest): Promise<AIResponse> {
    const response = await fetch(`${this.baseUrl}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`AI request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async stream(request: AIRequest): Promise<AIStreamResponse> {
    const controller = new AbortController();
    
    const response = await fetch(`${this.baseUrl}/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`AI stream failed: ${response.statusText}`);
    }

    return {
      stream: response.body!,
      controller,
    };
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }
}
```

### 1.4 Create AI Context Provider
```typescript
// lib/ai/ai-context.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { AIService } from './types';
import { OpenAIService } from './ai-service';

interface AIContextValue {
  aiService: AIService | null;
}

const AIContext = createContext<AIContextValue>({ aiService: null });

export function AIProvider({ children }: { children: ReactNode }) {
  const aiService = new OpenAIService(
    process.env.NEXT_PUBLIC_OPENAI_API_KEY || ''
  );

  return (
    <AIContext.Provider value={{ aiService }}>
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within AIProvider');
  }
  return context;
}
```

## Sprint 2: API Routes (Day 3)

### 2.1 Create Streaming API Route
```typescript
// app/api/ai/stream/route.ts
import { openai } from "@ai-sdk/openai";
import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";
import { streamText } from "ai";
import { match } from "ts-pattern";
import { AIOperation } from "@/lib/ai/types";

export const runtime = "edge";

export async function POST(req: Request): Promise<Response> {
  // Rate limiting (optional)
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const ip = req.headers.get("x-forwarded-for");
    const ratelimit = new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(50, "1 d"),
    });

    const { success, limit, reset, remaining } = await ratelimit.limit(
      `ai_ratelimit_${ip}`
    );

    if (!success) {
      return new Response("Rate limit exceeded", {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        },
      });
    }
  }

  const { prompt, operation, command, context } = await req.json();

  const messages = buildMessages(operation, prompt, command, context);

  const result = await streamText({
    model: openai("gpt-4o-mini"),
    messages,
    temperature: 0.7,
    maxTokens: operation === 'continue' ? 200 : 1000,
  });

  return result.toDataStreamResponse();
}

function buildMessages(
  operation: AIOperation,
  prompt: string,
  command?: string,
  context?: any
) {
  return match(operation)
    .with("continue", () => [
      {
        role: "system",
        content:
          "You are an AI writing assistant that continues existing text based on context. " +
          "Give more weight to the end of the text. " +
          "Limit your response to 200 characters. " +
          "Complete any incomplete sentences.",
      },
      {
        role: "user",
        content: context?.beforeText ? 
          `Continue this text: ${context.beforeText}` : 
          prompt,
      },
    ])
    .with("improve", () => [
      {
        role: "system",
        content:
          "You are an AI writing assistant that improves existing text. " +
          "Make it clearer, more concise, and better structured. " +
          "Maintain the original meaning and tone.",
      },
      {
        role: "user",
        content: `Improve this text: ${prompt}`,
      },
    ])
    // ... other operations
    .run() as any;
}
```

### 2.2 Create Non-Streaming API Route (Optional)
```typescript
// app/api/ai/complete/route.ts
export async function POST(req: Request): Promise<Response> {
  // Similar to stream but using generateText instead
  const result = await generateText({
    model: openai("gpt-4o-mini"),
    messages,
  });

  return Response.json({
    text: result.text,
    tokensUsed: result.usage?.totalTokens,
  });
}
```

## Sprint 3: Editor AI Extension (Days 4-5)

### 3.1 Create AI Trigger Detection
```typescript
// features/editor/extensions/ai-inline.ts
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

export interface AIInlineOptions {
  onTrigger: (context: {
    from: number;
    to: number;
    text: string;
    type: 'continuation' | 'command';
  }) => void;
}

const aiInlineKey = new PluginKey('aiInline');

export const AIInline = Extension.create<AIInlineOptions>({
  name: 'aiInline',

  addOptions() {
    return {
      onTrigger: () => {},
    };
  },

  addInputRules() {
    return [
      {
        // Detect ++ for continuation
        find: /\+\+$/,
        handler: ({ state, range, match }) => {
          const from = range.from;
          const to = range.to;
          
          // Get context (previous ~500 chars)
          const contextStart = Math.max(0, from - 500);
          const beforeText = state.doc.textBetween(contextStart, from - 2);
          
          this.options.onTrigger({
            from,
            to,
            text: beforeText,
            type: 'continuation',
          });
        },
      },
    ];
  },

  addKeyboardShortcuts() {
    return {
      'Mod-j': () => {
        const { state } = this.editor;
        const { from, to } = state.selection;
        
        // Get selected text or current paragraph
        const text = state.doc.textBetween(
          from,
          to,
          ' '
        ) || this.editor.state.doc.textBetween(
          state.selection.$from.start(),
          state.selection.$from.end(),
          ' '
        );
        
        this.options.onTrigger({
          from,
          to,
          text,
          type: 'command',
        });
        
        return true;
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: aiInlineKey,
        state: {
          init: () => ({ active: false, decorations: DecorationSet.empty }),
          apply: (tr, value, oldState, newState) => {
            const aiMeta = tr.getMeta('ai');
            
            if (aiMeta?.type === 'preview') {
              // Show AI preview as ghost text
              const decoration = Decoration.inline(
                aiMeta.from,
                aiMeta.from,
                {
                  class: 'ai-preview',
                  'data-text': aiMeta.text,
                },
                { inclusiveStart: true, inclusiveEnd: true }
              );
              
              return {
                active: true,
                decorations: DecorationSet.create(newState.doc, [decoration]),
              };
            }
            
            if (aiMeta?.type === 'accept' || aiMeta?.type === 'reject') {
              return { active: false, decorations: DecorationSet.empty };
            }
            
            return value;
          },
        },
        props: {
          decorations(state) {
            return this.getState(state).decorations;
          },
          
          handleKeyDown(view, event) {
            const aiState = this.getState(view.state);
            
            if (aiState.active) {
              if (event.key === 'Tab') {
                // Accept AI suggestion
                event.preventDefault();
                view.dispatch(
                  view.state.tr.setMeta('ai', { type: 'accept' })
                );
                return true;
              } else if (event.key === 'Escape') {
                // Reject AI suggestion
                event.preventDefault();
                view.dispatch(
                  view.state.tr.setMeta('ai', { type: 'reject' })
                );
                return true;
              }
            }
            
            return false;
          },
        },
      }),
    ];
  },
});
```

### 3.2 Create AI Command Menu
```typescript
// features/editor/components/ai-command-menu.tsx
import { useState } from 'react';
import { Command } from 'cmdk';
import { 
  Sparkles, 
  Edit, 
  Minimize, 
  Maximize, 
  CheckCircle, 
  Zap 
} from 'lucide-react';
import { AIOperation } from '@/lib/ai/types';

interface AICommandMenuProps {
  open: boolean;
  onClose: () => void;
  onSelect: (operation: AIOperation, command?: string) => void;
  position: { top: number; left: number };
}

export function AICommandMenu({ 
  open, 
  onClose, 
  onSelect, 
  position 
}: AICommandMenuProps) {
  const [search, setSearch] = useState('');

  const commands = [
    { 
      id: 'improve', 
      label: 'Improve writing', 
      icon: Edit,
      description: 'Enhance clarity and style'
    },
    { 
      id: 'fix', 
      label: 'Fix grammar', 
      icon: CheckCircle,
      description: 'Correct grammar and spelling'
    },
    { 
      id: 'shorter', 
      label: 'Make shorter', 
      icon: Minimize,
      description: 'Condense the text'
    },
    { 
      id: 'longer', 
      label: 'Make longer', 
      icon: Maximize,
      description: 'Expand with more detail'
    },
    { 
      id: 'zap', 
      label: 'Custom edit...', 
      icon: Zap,
      description: 'Apply custom instructions'
    },
  ];

  if (!open) return null;

  return (
    <div 
      className="fixed z-50"
      style={{ top: position.top, left: position.left }}
    >
      <Command className="rounded-lg border shadow-md bg-background">
        <Command.Input
          value={search}
          onValueChange={setSearch}
          placeholder="Search AI commands..."
          className="border-b px-3 py-2"
        />
        <Command.List className="max-h-64 overflow-y-auto p-1">
          {commands.map((cmd) => (
            <Command.Item
              key={cmd.id}
              onSelect={() => {
                if (cmd.id === 'zap') {
                  // Show custom input
                  const customCommand = prompt('Enter your instruction:');
                  if (customCommand) {
                    onSelect('zap', customCommand);
                  }
                } else {
                  onSelect(cmd.id as AIOperation);
                }
                onClose();
              }}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer"
            >
              <cmd.icon className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="font-medium">{cmd.label}</div>
                <div className="text-xs text-muted-foreground">
                  {cmd.description}
                </div>
              </div>
            </Command.Item>
          ))}
        </Command.List>
      </Command>
    </div>
  );
}
```

### 3.3 Create AI Integration Hook
```typescript
// features/editor/hooks/use-editor-ai.ts
import { useCallback, useState } from 'react';
import { Editor } from '@tiptap/core';
import { useAI } from '@/lib/ai/ai-context';
import { AIOperation } from '@/lib/ai/types';
import { useCompletion } from 'ai/react';

export function useEditorAI(editor: Editor | null) {
  const { aiService } = useAI();
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  
  const {
    completion,
    complete,
    isLoading,
    stop,
  } = useCompletion({
    api: '/api/ai/stream',
  });

  const handleAITrigger = useCallback(async (context: {
    from: number;
    to: number;
    text: string;
    type: 'continuation' | 'command';
  }) => {
    if (!editor || !aiService) return;

    if (context.type === 'continuation') {
      // Handle ++ trigger
      complete(context.text, {
        body: {
          operation: 'continue',
          context: { beforeText: context.text },
        },
      });
      
      // Show preview in editor
      editor.commands.setMeta('ai', {
        type: 'preview',
        from: context.from,
        text: completion,
      });
    } else {
      // Show command menu
      const coords = editor.view.coordsAtPos(context.from);
      setMenuPosition({
        top: coords.top + 20,
        left: coords.left,
      });
      setShowCommandMenu(true);
    }
  }, [editor, aiService, complete, completion]);

  const executeAIOperation = useCallback(async (
    operation: AIOperation,
    command?: string
  ) => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');

    const response = await complete(selectedText, {
      body: {
        operation,
        command,
      },
    });

    // Replace selected text with AI response
    editor.chain()
      .focus()
      .deleteRange({ from, to })
      .insertContent(response)
      .run();
  }, [editor, complete]);

  return {
    handleAITrigger,
    executeAIOperation,
    showCommandMenu,
    setShowCommandMenu,
    menuPosition,
    isLoading,
    stop,
  };
}
```

## Sprint 4: Integration & Polish (Days 6-7)

### 4.1 Update Editor Component
```typescript
// features/editor/components/advanced-editor.tsx
import { AIInline } from '../extensions/ai-inline';
import { useEditorAI } from '../hooks/use-editor-ai';
import { AICommandMenu } from './ai-command-menu';

export function AdvancedEditor({ content, onChange }) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const {
    handleAITrigger,
    executeAIOperation,
    showCommandMenu,
    setShowCommandMenu,
    menuPosition,
  } = useEditorAI(editor);

  const extensions = [
    // ... other extensions
    AIInline.configure({
      onTrigger: handleAITrigger,
    }),
  ];

  return (
    <div className="relative">
      <EditorContent editor={editor} />
      
      <AICommandMenu
        open={showCommandMenu}
        onClose={() => setShowCommandMenu(false)}
        onSelect={executeAIOperation}
        position={menuPosition}
      />
      
      {/* AI Loading Indicator */}
      {isLoading && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-background border rounded-lg px-3 py-2 shadow-lg">
          <Sparkles className="h-4 w-4 animate-pulse text-primary" />
          <span className="text-sm">AI is thinking...</span>
        </div>
      )}
    </div>
  );
}
```

### 4.2 Add AI Styles
```css
/* features/editor/styles/ai.css */

/* Ghost text preview */
.ai-preview::after {
  content: attr(data-text);
  color: hsl(var(--muted-foreground));
  opacity: 0.5;
  font-style: italic;
}

/* AI command menu */
.ai-command-menu {
  animation: fadeIn 0.1s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* AI loading state */
.ai-loading {
  background: linear-gradient(
    90deg,
    hsl(var(--muted)),
    hsl(var(--muted-foreground) / 0.1),
    hsl(var(--muted))
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
```

### 4.3 Environment Setup
```env
# .env.local
OPENAI_API_KEY=sk-...

# Optional for rate limiting
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
```

## Testing & QA Checklist

### Functional Tests
- [ ] `++` trigger shows AI completion
- [ ] Tab accepts completion, Escape rejects
- [ ] Cmd+J opens AI command menu
- [ ] All AI operations work (improve, shorten, etc.)
- [ ] Custom "zap" command accepts user input
- [ ] AI responses stream in real-time
- [ ] Proper error handling when AI unavailable

### Performance Tests
- [ ] No lag when typing normally
- [ ] AI preview appears quickly (<500ms)
- [ ] Streaming is smooth
- [ ] Can abort long operations

### Edge Cases
- [ ] Works at document boundaries
- [ ] Handles empty selections
- [ ] Works with formatted text
- [ ] Maintains undo/redo history

## Future Enhancements

1. **Context Awareness**
   - Include document title
   - Previous paragraphs for better context
   - User writing style learning

2. **Advanced Features**
   - Voice input → AI transcription
   - Multi-language support
   - Custom AI models (Claude, Gemini)
   - Offline mode with local LLM

3. **Chat Integration**
   - Reuse AIService for chat panel
   - Shared context between editor and chat
   - Drag AI responses from chat to editor

4. **Analytics**
   - Track AI usage
   - Most used operations
   - User satisfaction metrics

This architecture ensures clean separation between AI logic and UI, making it easy to add chat functionality later while maintaining a consistent AI experience across your application.