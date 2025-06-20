# Product Requirements Document: AI Notes

*This is the master feature roadmap. Technical details are in supporting documents.*

## 1. Vision & Context

### Problem Statement
Knowledge workers and students constantly switch between exploring ideas through AI chat interfaces and managing persistent notes. Current solutions force users into either ephemeral chat experiences that lose valuable insights or rigid note-taking apps with bolted-on AI features. This creates friction in the natural flow of thought, where exploration through conversation naturally evolves into structured knowledge. We need a fluid workspace where AI collaboration and note-taking are fundamentally integrated, not awkwardly connected.

### Target Users
- **Primary**: Knowledge Professionals - People actively learning and building expertise through online courses (coding bootcamps, Udemy AI courses), college students, and professionals developing new skills. They need a collaborative AI partner for understanding complex concepts, organizing learning materials, and building their personal knowledge base.
- **Secondary**: Creative Professionals - Writers, researchers, and consultants who need to develop ideas through AI collaboration, maintain project knowledge, and transform insights into deliverables

### Core Principles
1. **Fluid, Not Modal**: No switching between "chat mode" and "notes mode" - resizable panels adapt to what you're doing
2. **Ephemeral to Persistent**: Chats expire by default (reducing clutter), but valuable insights easily flow into permanent notes
3. **AI as Collaborator**: AI isn't a feature or tool - it's an active participant in thinking, writing, and organizing
4. **Invisible Intelligence**: Grammar checking, suggestions, and organization happen naturally without interrupting flow
5. **Knowledge Work, Not Just Notes**: This is a platform for collaborative knowledge development with AI, not a simple note-taking app

## 2. Feature Inventory

### Feature Map
| ID | Feature Name | User Value | Complexity | Dependencies | Epic | Sprint |
|----|-------------|------------|------------|--------------|------|--------|
| F01 | Rich Text Editor + Real-time Corrections | Write with confidence, catch errors instantly | L | None | 1 | 1 |
| F02 | AI Chat Interface | Explore ideas through conversation | L | None | 1 | 1 |
| F03 | Chat → Note Extraction | Never lose valuable insights from conversations | M | F01, F02 | 1 | 2 |
| F04 | Note Home Chat | Continue developing any note through AI discussion | M | F01, F02 | 1 | 2 |
| F05 | Ghost Text Completions | Write faster with AI-powered suggestions | L | F01 | 1 | 3 |
| F06 | Inline AI (//) | Natural language AI requests anywhere | S | F01, F02 | 1 | 3 |
| F07 | Spaces & Collections | Organize by life context (Work/School/Personal) | M | F01 | 1 | 3 |
| F08 | Universal Search | Find anything across notes and active chats | M | F01, F02 | 1 | 4 |
| F09 | User Authentication | Secure, persistent access to notes | M | None | 1 | 4 |
| F10 | Slash Commands | Transform text with simple commands | S | F01, F02 | 2 | 1 |
| F11 | Smart Collections | AI-powered automatic organization | L | F07 | 2 | 1 |
| F12 | Multi-Note Chat Context | Reference multiple notes in conversations | M | F02, F04 | 2 | 2 |
| F13 | Keyboard Shortcuts | Power user efficiency | S | F01, F02 | 2 | 2 |
| F14 | Dark/Light Mode | Comfortable in any environment | S | None | 2 | 3 |
| F15 | Note Versioning | Never lose work, track changes | M | F01 | 2 | 3 |
| F16 | Export Options | Take your knowledge anywhere | S | F01 | 2 | 3 |
| F17 | Stripe Integration | Monetization for sustainability | M | F09 | 3 | 1 |
| F18 | Advanced AI Tools | Study materials, summaries, flashcards | L | F02 | 3 | 1 |
| F19 | Collaborative Features | Share and work together | L | F09 | 3 | 2 |

### Feature Prioritization
- **🎯 MVP (Epic 1)**: F01-F09 - Core writing + AI chat loop with organization
- **🚀 Enhance (Epic 2)**: F10-F16 - Advanced AI features and polish  
- **📈 Scale (Epic 3)**: F17-F19 - Monetization and growth

### Dependency Graph
```
F01 (Editor) + F02 (Chat)
├── F03 (Extraction)
├── F04 (Home Chat)
├── F05 (Ghost Text)
└── F09 (Slash Commands)

F06 (Spaces)
├── F10 (Smart Collections)
└── F07 (Search)

F08 (Auth)
├── F16 (Payments)
└── F18 (Collaboration)
```

## 3. Feature Specifications

### F01: Rich Text Editor with Real-time Corrections
**Epic**: 1 | **Sprint**: 1 | **Complexity**: Large

#### User Story
As a knowledge professional, I want to write with automatic spelling and grammar correction so that I can focus on developing ideas without worrying about errors.

#### Acceptance Criteria
- [ ] Novel editor (TipTap-based) with rich text formatting
- [ ] Spelling errors show red underline in real-time using typo.js
- [ ] Grammar errors show blue underline using retext
- [ ] Hover shows correction suggestions
- [ ] Right-click to accept/ignore/add to dictionary
- [ ] Markdown shortcuts work (e.g., `**text**` → **text**)
- [ ] Code blocks with syntax highlighting (100+ languages)
- [ ] JetBrains Mono font for all content
- [ ] Auto-save every 30 seconds
- [ ] Works smoothly on mobile browsers

#### UI/UX Flow
```
1. User creates new note or opens existing
2. Starts typing → corrections appear as they type
3. Sees red underline → hovers → sees suggestion
4. Right-clicks → menu with options
5. Continues writing without interruption
```

#### Key Components
- `NoteEditor` - Novel editor wrapper with custom extensions
- `SpellCheckExtension` - typo.js integration
- `GrammarCheckExtension` - retext integration
- `CorrectionTooltip` - Suggestion UI

#### Business Rules
1. Corrections must not interrupt typing flow
2. Processing happens client-side for privacy
3. Custom dictionary persists per user
4. Max note size: 100,000 characters

---

### F02: AI Chat Interface
**Epic**: 1 | **Sprint**: 1 | **Complexity**: Large

#### User Story
As a knowledge professional, I want to have natural conversations with AI about complex topics so that I can understand concepts deeply and explore ideas collaboratively.

#### Acceptance Criteria
- [ ] Chat interface with message bubbles
- [ ] Real-time streaming responses using AI SDK
- [ ] Turquoise/pink gradient accent for AI messages
- [ ] Loading states with shimmer effect
- [ ] Ability to stop generation mid-stream
- [ ] Active chats show at top of sidebar globally
- [ ] Auto-expires after 7 days of inactivity
- [ ] Can star chat to prevent expiration
- [ ] Smooth scrolling to latest message
- [ ] Can reference multiple notes with drag & drop

#### UI/UX Flow
```
1. User clicks "New Chat" or opens existing
2. Types message in input field
3. Presses Enter → sees loading state
4. AI response streams in progressively
5. Can continue conversation naturally
```

#### Key Components
- `ChatInterface` - Main chat container
- `ChatMessage` - Individual message component
- `ChatInput` - Input with submit handling
- `useChatStream` - Hook using AI SDK's useChat

#### Business Rules
1. Chats expire 7 days after last activity
2. Starred chats never expire
3. Max 50 messages per chat for performance
4. Rate limiting: 100 messages/hour

---

### F03: Chat → Note Extraction
**Epic**: 1 | **Sprint**: 2 | **Complexity**: Medium

#### User Story
As a user, I want to extract valuable AI responses into permanent notes so that insights from conversations aren't lost when chats expire.

#### Acceptance Criteria
- [ ] Can select any portion of chat text
- [ ] Floating button appears: "Create Note"
- [ ] Can extract entire AI response with one click
- [ ] Extracted content becomes new note in current space
- [ ] Can also tell AI "save this as a note"
- [ ] Original formatting preserved
- [ ] Note auto-titles based on content
- [ ] Smooth animation from chat to note

#### UI/UX Flow
```
1. User has valuable exchange in chat
2. Selects text → sees "Create Note" button
3. Clicks → note slides into sidebar
4. Note opens in editor with content
5. User can immediately edit/enhance
```

#### Business Rules
1. Extracted content is copied, not moved
2. No link back to source chat (since ephemeral)
3. AI can suggest good extraction points
4. Max extraction: 50,000 characters

---

### F04: Note Home Chat with Resizable Panels
**Epic**: 1 | **Sprint**: 2 | **Complexity**: Medium

#### User Story
As a knowledge professional, I want each note to have its own AI chat so that I can develop ideas specific to that note's content with flexible layout options.

#### Acceptance Criteria
- [ ] Every note has dedicated chat in side panel
- [ ] Resizable panels using react-resizable-panels
- [ ] Can collapse/expand chat panel completely
- [ ] Chat has full context of current note
- [ ] Can reference other notes with @mentions
- [ ] Referenced notes show as cards in chat
- [ ] Chat persists unless manually cleared
- [ ] Clear option includes "summarize conversation"
- [ ] Layout preference saved per user

#### UI/UX Flow
```
1. User opens a note
2. Sees chat panel on right (or collapsed)
3. Asks question about note content
4. AI responds with note context
5. Conversation helps develop the note
```

#### Business Rules
1. Home chat always has current note in context
2. Can reference up to 5 other notes
3. Chat history unlimited (until cleared)
4. Clearing chat is non-reversible

---

### F05: Ghost Text Completions
**Epic**: 1 | **Sprint**: 3 | **Complexity**: Large

#### User Story
As a user, I want AI to suggest what I'm typing next based on context so that I can write faster and overcome writer's block.

#### Acceptance Criteria
- [ ] Ghost text appears after 1s pause in typing
- [ ] Shows as semi-transparent gray text
- [ ] Tab to accept, keep typing to dismiss
- [ ] Context-aware based on current paragraph
- [ ] Learns from user's writing style
- [ ] Can be disabled in settings
- [ ] Smooth fade in/out animations
- [ ] Works in all text areas

#### UI/UX Flow
```
1. User types and pauses
2. Ghost text fades in after cursor
3. If relevant → Tab to accept
4. If not → keep typing, it disappears
5. Accepted text becomes real
```

#### Key Components
- `GhostTextProvider` - Manages completion state
- `useGhostText` - Hook for completion logic
- `GhostTextOverlay` - Visual rendering

#### Business Rules
1. Max 20 tokens per suggestion
2. No suggestions in code blocks
3. Debounced to avoid API spam
4. User acceptance tracked for improvements

---

### F06: Inline AI (//)
**Epic**: 1 | **Sprint**: 3 | **Complexity**: Small

#### User Story
As a knowledge professional, I want to make natural language AI requests anywhere in my notes so that I can get help without switching contexts.

#### Acceptance Criteria
- [ ] Type "//" anywhere to trigger inline AI
- [ ] Natural language requests like "// make this more formal"
- [ ] AI response replaces the command
- [ ] Works with selection or cursor position
- [ ] Shows inline loading state
- [ ] Escape cancels request
- [ ] History of recent commands
- [ ] Smooth text replacement animation

#### UI/UX Flow
```
1. User types "// explain this concept simply"
2. Loading indicator appears inline
3. AI response streams in, replacing command
4. User continues writing
5. Can undo if needed
```

#### Business Rules
1. Max request length: 200 characters
2. Context includes surrounding paragraphs
3. Timeout after 30 seconds
4. Rate limited with AI quota

---

### F07: Spaces & Collections
**Epic**: 1 | **Sprint**: 3 | **Complexity**: Medium

#### User Story
As a professional, I want to organize notes by life context so that work and personal knowledge stay separate and organized.

#### Acceptance Criteria
- [ ] Default spaces: All Notes, Work, School, Personal
- [ ] Can create custom spaces
- [ ] Each space has Recent, Favorites collections
- [ ] Can create manual collections in each space
- [ ] Notes can exist in multiple collections
- [ ] Drag and drop organization
- [ ] Visual space switcher in sidebar
- [ ] Current space persists on reload

#### UI/UX Flow
```
1. User clicks space in sidebar
2. View switches to that space's content
3. Creates collection with "+" button
4. Drags notes into collections
5. Organization persists
```

#### Business Rules
1. Max 10 spaces per user
2. Max 50 collections per space
3. "All Notes" space is read-only
4. Notes can be in unlimited collections

---

### F07: Universal Search
**Epic**: 1 | **Sprint**: 4 | **Complexity**: Medium

#### User Story
As a user, I want to quickly find any note or active chat so that I can access information without browsing through folders.

#### Acceptance Criteria
- [ ] Global search with Cmd+K
- [ ] Searches notes and active chats
- [ ] Fuzzy matching for flexibility
- [ ] Real-time results as you type
- [ ] Shows preview of matches
- [ ] Keyboard navigation of results
- [ ] Recent searches saved
- [ ] Filter by space/collection

#### UI/UX Flow
```
1. User presses Cmd+K anywhere
2. Search overlay appears
3. Types query → instant results
4. Arrow keys to navigate
5. Enter to open selection
```

#### Business Rules
1. Full-text search using Postgres
2. Active chats included (not expired)
3. Results limited to 20 for performance
4. Search history last 10 queries

---

### F08: User Authentication
**Epic**: 1 | **Sprint**: 4 | **Complexity**: Medium

#### User Story
As a user, I want secure access to my notes from any device so that my knowledge is always available and protected.

#### Acceptance Criteria
- [ ] OAuth with GitHub and Google via Arctic.js
- [ ] Session management with cookies
- [ ] Secure API routes require auth
- [ ] Profile shows email and provider
- [ ] Logout clears all local data
- [ ] Remember me for 30 days
- [ ] Loading states during auth

#### UI/UX Flow
```
1. New user lands on homepage
2. Clicks "Sign in with Google/GitHub"
3. Redirected to OAuth provider
4. Returns authenticated
5. Sees their workspace
```

#### Business Rules
1. Email required from OAuth provider
2. One account per email
3. Sessions expire after 30 days
4. All data encrypted at rest

---

### F09: Slash Commands
**Epic**: 2 | **Sprint**: 1 | **Complexity**: Small

#### User Story
As a student, I want to quickly transform my text with commands so that I can reformat notes for different purposes.

#### Acceptance Criteria
- [ ] Type "/" to see command menu
- [ ] Commands: summarize, expand, bullets, rewrite, explain
- [ ] Works on selection or entire note
- [ ] Shows loading during processing
- [ ] Can undo transformation
- [ ] Smooth replacement animation
- [ ] Natural language commands with "//"

#### Business Rules
1. Commands process max 5000 characters
2. Original text saved for undo
3. Rate limited with user's AI quota

---

### F10: Smart Collections
**Epic**: 2 | **Sprint**: 1 | **Complexity**: Large

#### User Story
As a user, I want AI to automatically organize my notes so that I don't have to manually categorize everything.

#### Acceptance Criteria
- [ ] AI analyzes notes for patterns
- [ ] Suggests collection names and members
- [ ] Can accept/reject suggestions
- [ ] Rules: by topic, date, type, keywords
- [ ] Updates as new notes added
- [ ] Manual override always possible
- [ ] Visual indicator for AI collections

#### Business Rules
1. Runs daily or on-demand
2. Max 5 smart collections per space
3. User can convert to manual collection
4. Suggestions based on min 3 notes

---

## 4. Epic Roadmap

### Epic 1: Foundation + Core Value 🏗️
**Goal**: Users can write, chat, and organize with AI assistance  
**Duration**: 4 sprints

| Sprint | Features | Deliverable |
|--------|----------|-------------|
| 1 | F01, F02 | Novel editor with corrections + AI chat interface |
| 2 | F03, F04 | Chat extraction + Resizable panel home chat |
| 3 | F05, F06, F07 | Ghost text + Inline AI + Spaces |
| 4 | F08, F09 | Search + Authentication |

### Epic 2: Enhance & Expand 🚀
**Goal**: Power user features and polish  
**Duration**: 3 sprints

| Sprint | Features | Deliverable |
|--------|----------|-------------|
| 1 | F10, F11 | Slash commands + Smart collections |
| 2 | F12, F13 | Multi-note context + Shortcuts |
| 3 | F14, F15, F16 | Theme + Versions + Export |

### Epic 3: Intelligence & Scale 📈
**Goal**: Monetization and advanced AI  
**Duration**: 2 sprints

| Sprint | Features | Deliverable |
|--------|----------|-------------|
| 1 | F17, F18 | Payments + Study tools |
| 2 | F19 | Collaboration features |

## 5. Technical Overview

### Architecture
See `technical-architecture.md` for:
- Next.js app router structure
- Supabase + Drizzle data layer
- AI SDK integration patterns
- Vercel deployment strategy

### Data Model
See `data-architecture.md` for:
- Multi-tenant ready schema
- Note/Chat/Collection relationships
- Full-text search implementation
- Real-time sync approach

### API Design
See `api-design.md` for:
- Server Actions for mutations
- REST endpoints for queries
- WebSocket events for real-time
- AI streaming implementation

### UI/UX Design
See `ui-ux-design.md` for:
- Dark-first design system
- Component library specs
- Responsive breakpoints
- Accessibility standards

## 6. Risks & Assumptions

### Technical Risks
1. **AI Latency**: Ghost text might feel slow → Aggressive caching + edge functions
2. **Grammar Check Performance**: Client-side processing might lag → Web Workers
3. **Chat Context Limits**: LLMs have token limits → Smart context windowing

### Key Assumptions
1. **Users Want Ephemeral Chats**: Betting that auto-expiry reduces clutter
2. **AI-First Resonates**: Assuming users want AI deeply integrated
3. **Students Are Mobile-Heavy**: Assuming significant mobile usage

### Out of Scope
- ❌ Real-time collaboration: Focus on single-user excellence first
- ❌ Mobile native apps: PWA is sufficient for MVP
- ❌ File attachments: Text-first for simplicity
- ❌ Custom AI models: OpenAI/Anthropic only initially

## 7. Appendices

### Supporting Documents
- 📐 `technical-architecture.md` - System design and decisions
- 🗄️ `data-architecture.md` - Database schema and models
- 🔌 `api-design.md` - Detailed API specifications
- 🎨 `ui-ux-design.md` - Design system and patterns

### Revision History
| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2024-01-09 | 1.0 | Initial PRD | AI Notes Team |

---

## Quick Reference

**Current Status**: Epic 1, Sprint 0 (Setup)  
**Next Feature**: F01 - Rich Text Editor  
**Blocking Issues**: None  
**Key Decision Needed**: Confirm typo.js vs alternatives for spell check

*This document focuses on WHAT we're building and WHY. For HOW, see the supporting technical documents.*