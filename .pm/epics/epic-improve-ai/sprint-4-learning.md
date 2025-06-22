# Sprint 4: AI Learning System

**Status:** Not Started  
**Priority:** LOW  
**Duration:** 4 hours  

## Overview

Implement a basic learning system that tracks user interactions with AI features to improve suggestions over time. Focus on implicit learning from ghost completion and slash command acceptances.

## Goals

1. Track ghost completion accept/reject rates
2. Track slash command usage and acceptance
3. Store interaction data in database
4. Use data to improve AI prompts

## Tasks

### Task 1: Database Schema for Interactions ⏱️ 1 hour

**Problem:** Need to store AI interaction history

**Solution:**
1. Create interactions table
2. Track context, prompt, response, and outcome

**Files to create/modify:**
- `lib/db/schema.ts` - Add interactions table
- `drizzle/0006_add_ai_interactions.sql` - Migration

**Implementation:**

```sql
-- 0006_add_ai_interactions.sql
CREATE TABLE ai_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL, -- 'ghost_completion', 'slash_command', 'bubble_menu'
  context TEXT,
  prompt TEXT,
  response TEXT,
  accepted BOOLEAN NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX ai_interactions_user_id_idx ON ai_interactions(user_id);
CREATE INDEX ai_interactions_type_idx ON ai_interactions(interaction_type);
CREATE INDEX ai_interactions_created_at_idx ON ai_interactions(created_at);
```

```typescript
// schema.ts - Add to schema
export const aiInteractions = pgTable('ai_interactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  interactionType: text('interaction_type').notNull(),
  context: text('context'),
  prompt: text('prompt'),
  response: text('response'),
  accepted: boolean('accepted').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const aiInteractionsRelations = relations(aiInteractions, ({ one }) => ({
  user: one(users, {
    fields: [aiInteractions.userId],
    references: [users.id],
  }),
}))
```

### Task 2: Interaction Tracking API ⏱️ 1 hour

**Problem:** Need endpoints to store interactions

**Solution:**
1. Create API endpoint for tracking
2. Batch interactions for performance
3. Add analytics endpoint

**Files to create:**
- `app/api/ai/interactions/route.ts`

**Implementation:**

```typescript
// app/api/ai/interactions/route.ts
import { auth } from '@/lib/auth/utils'
import { db } from '@/lib/db'
import { aiInteractions } from '@/lib/db/schema'
import { eq, and, gte } from 'drizzle-orm'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const interaction = await req.json()

  await db.insert(aiInteractions).values({
    userId: session.user.id,
    ...interaction
  })

  return Response.json({ success: true })
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const days = parseInt(searchParams.get('days') || '30')

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const conditions = [
    eq(aiInteractions.userId, session.user.id),
    gte(aiInteractions.createdAt, startDate)
  ]

  if (type) {
    conditions.push(eq(aiInteractions.interactionType, type))
  }

  const interactions = await db
    .select()
    .from(aiInteractions)
    .where(and(...conditions))
    .orderBy(aiInteractions.createdAt)

  // Calculate acceptance rates
  const stats = interactions.reduce((acc, interaction) => {
    const type = interaction.interactionType
    if (!acc[type]) {
      acc[type] = { total: 0, accepted: 0 }
    }
    acc[type].total++
    if (interaction.accepted) {
      acc[type].accepted++
    }
    return acc
  }, {} as Record<string, { total: number; accepted: number }>)

  return Response.json({ interactions, stats })
}
```

### Task 3: Track Ghost Completions ⏱️ 1 hour

**Problem:** Need to track ghost completion interactions

**Solution:**
1. Update ghost text hook to track interactions
2. Store context and outcomes

**Files to modify:**
- `features/ai/hooks/use-ghost-text.ts`

**Implementation:**

```typescript
// use-ghost-text.ts - Add tracking
export function useGhostText(editor: Editor | null) {
  const positionRef = useRef<number | null>(null)
  const contextRef = useRef<string>('')
  const completionRef = useRef<string>('')
  const isMountedRef = useRef(false)

  const trackInteraction = async (accepted: boolean) => {
    if (!contextRef.current || !completionRef.current) return

    try {
      await fetch('/api/ai/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interactionType: 'ghost_completion',
          context: contextRef.current,
          response: completionRef.current,
          accepted,
          metadata: {
            position: positionRef.current,
            timestamp: new Date().toISOString()
          }
        })
      })
    } catch (error) {
      console.error('Failed to track interaction:', error)
    }
  }

  const { complete, completion, isLoading, stop } = useCompletion({
    api: '/api/ai/completion',
    onError: error => {
      if (isMountedRef.current) {
        handleAIError(error)
        if (editor) {
          editor.commands.clearGhostText()
        }
      }
    },
    onFinish: (_prompt, completion) => {
      completionRef.current = completion
    }
  })

  // Update ghost text when completion changes
  useEffect(() => {
    if (completion && positionRef.current !== null && editor && isMountedRef.current) {
      editor.commands.setGhostText(completion, positionRef.current)
      completionRef.current = completion
    }
  }, [completion, editor])

  useEffect(() => {
    if (!editor) return

    const handleTrigger = (props: { position: number; context: string }) => {
      positionRef.current = props.position
      contextRef.current = props.context

      // Clear any existing ghost text
      editor.commands.clearGhostText()

      // Only trigger if we have enough context
      if (props.context.length >= 10) {
        complete(props.context, { body: { mode: 'ghost-text' } })
      }
    }

    const handleAccept = (text: string) => {
      if (positionRef.current !== null) {
        editor.chain().focus().insertContentAt(positionRef.current, text).run()
      }

      // Track acceptance
      trackInteraction(true)

      editor.commands.clearGhostText()
      positionRef.current = null
      contextRef.current = ''
      completionRef.current = ''
      stop()
    }

    const handleReject = () => {
      // Track rejection
      if (completionRef.current) {
        trackInteraction(false)
      }

      editor.commands.clearGhostText()
      positionRef.current = null
      contextRef.current = ''
      completionRef.current = ''
      stop()
    }

    // ... rest of the implementation
  }, [editor, complete, stop])

  return {
    isLoading,
    ghostText: completion
  }
}
```

### Task 4: Enhanced AI Prompts ⏱️ 1 hour

**Problem:** Use learning data to improve prompts

**Solution:**
1. Fetch user stats on mount
2. Enhance system prompts with user preferences
3. Add context about acceptance patterns

**Files to modify:**
- `features/ai/lib/ai-config.ts`
- `app/api/ai/completion/route.ts`

**Implementation:**

```typescript
// ai-config.ts - Add user context builder
export async function getUserContext(userId: string): Promise<string> {
  try {
    const res = await fetch(`/api/ai/interactions?days=30`)
    const { stats } = await res.json()

    if (!stats || Object.keys(stats).length === 0) {
      return ''
    }

    // Build context based on user patterns
    const contexts: string[] = []

    if (stats.ghost_completion) {
      const rate = (stats.ghost_completion.accepted / stats.ghost_completion.total * 100).toFixed(0)
      contexts.push(`User accepts ${rate}% of ghost completions.`)
    }

    if (stats.slash_command) {
      const rate = (stats.slash_command.accepted / stats.slash_command.total * 100).toFixed(0)
      contexts.push(`User accepts ${rate}% of slash command outputs.`)
    }

    return contexts.length > 0 
      ? `\n\nUser preferences based on past interactions:\n${contexts.join('\n')}`
      : ''
  } catch (error) {
    console.error('Failed to get user context:', error)
    return ''
  }
}
```

```typescript
// completion/route.ts - Use user context
import { getUserContext } from '@/features/ai/lib/ai-config'
import { auth } from '@/lib/auth/utils'

export async function POST(req: NextRequest) {
  const session = await auth()
  const {
    prompt,
    context,
    mode = 'completion'
  }: { prompt?: string; context?: string; mode?: 'completion' | 'ghost-text' } = await req.json()

  const systemPrompt = AI_SYSTEM_PROMPTS[mode]
  const fullPrompt = context ? `${context}\n\n${prompt}` : prompt

  if (!fullPrompt) {
    return new Response('Prompt is required', { status: 400 })
  }

  try {
    // Get user-specific context
    let enhancedSystemPrompt = systemPrompt
    if (session?.user) {
      const userContext = await getUserContext(session.user.id)
      enhancedSystemPrompt = systemPrompt + userContext
    }

    const result = await streamText({
      model: openai(AI_MODELS[mode]),
      system: enhancedSystemPrompt,
      prompt: fullPrompt,
      temperature: AI_TEMPERATURES[mode],
      maxTokens: AI_MAX_TOKENS[mode]
    })

    return result.toDataStreamResponse()
  } catch (error: unknown) {
    console.error('[AI COMPLETION] Error:', error)
    if (error instanceof Error && error.name === 'RateLimitError') {
      return new Response('Rate limit exceeded', { status: 429 })
    }
    return new Response('An unexpected error occurred', { status: 500 })
  }
}
```

## Testing Checklist

- [ ] Ghost completion interactions tracked
- [ ] Slash command interactions tracked
- [ ] Accept/reject rates calculated correctly
- [ ] User context enhances prompts
- [ ] No performance impact on UI
- [ ] Data persists in database
- [ ] Analytics endpoint returns stats

## Definition of Done

- Interaction tracking implemented
- Database migrations complete
- Ghost completions track accept/reject
- User patterns influence AI behavior
- No negative performance impact

## Session Summary

**Completed:**
- TBD

**Files Changed:**
- TBD

**Remaining:**
- TBD 