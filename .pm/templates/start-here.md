# New Project Process with AI

## Overview
This document outlines the complete process for starting and managing a new project using AI-assisted development. The process emphasizes iterative development, continuous learning, and maintaining high code quality while moving fast.

## Core Philosophy
- Build core value first, infrastructure second
- One complete feature at a time
- Beautiful UI from the start sets the tone
- Test everything before handoff
- Document decisions and learnings
- Trust the process but adapt when needed

## Process Steps

### 1. Initial Project Planning (30-45 mins)

#### Define the Vision
- What problem are we solving?
- Who is the target user?
- What's the core value proposition?
- What would make someone stop and use this?

#### Create Project Documentation
Start with the PRD and supporting documents:

**1. Main PRD** (`prd.md`)
- Vision and success metrics
- Feature inventory with dependencies
- Feature specifications (user stories, acceptance criteria)
- Epic/sprint roadmap
- References to technical docs

**2. Technical Architecture** (`technical-architecture.md`)
```markdown
# Technical Architecture

## System Overview
[Architecture diagrams]

## Tech Stack
- Frontend: Next.js 15, React 19, Tailwind CSS v4
- Backend: Server Actions, API Routes
- Database: Supabase (PostgreSQL)
- [All decisions with rationale]

## Client/Server Architecture
[What runs where and why]

## Performance Strategy
[Caching, optimization, targets]

## Security Architecture
[Auth flow, data protection]

## Deployment
[Environments, CI/CD]
```

**3. Data Architecture** (`data-architecture.md`)
```markdown
# Data Architecture

## Entity Relationship Diagram
[Full ERD]

## Schema Definitions
[Complete SQL with indexes]

## Access Patterns
[Who can access what]

## Migration Strategy
[How schema evolves]
```

**4. API Design** (`api-design.md`)
```markdown
# API Design

## Server Actions
[Detailed specifications for each action]

## REST Endpoints
[When needed, full documentation]

## Real-time Subscriptions
[WebSocket/Supabase subscriptions]

## External Integrations
[Third-party APIs]
```

**5. UI/UX Design** (`ui-ux-design.md`)
```markdown
# UI/UX Design

## Design System
[Tokens, spacing, typography]

## Component Library
[Shared components and patterns]

## User Flows
[Detailed interaction flows]

## Responsive Strategy
[Breakpoints and adaptations]
```

Apply 10+ iterations focusing on:
- Can we ship fewer features but better?
- Is each feature truly independent?
- What's the simplest technical approach?
- Are we over-engineering anything?

#### Tech Stack Confirmation
- Default: Next.js, Tailwind CSS v4, Supabase, Drizzle, Better-Auth, Bun, AI-SDK, shadcn/ui
- Document any deviations and why
- List key dependencies

### 2. Feature Mapping & Epic Planning

Before setting up the project, map all features to epics and sprints:

#### Feature Inventory
List every feature with its complexity and dependencies:
```
1. User Authentication (Medium) - No deps
2. Task Management (Large) - Depends on Auth
3. Team Collaboration (Large) - Depends on Auth, Tasks
4. Notifications (Small) - Depends on all above
5. Analytics Dashboard (Medium) - Depends on Tasks
```

#### Epic Organization
Group features into logical epics:
```
Epic 1: Foundation + Core Value
├── Feature: Beautiful UI System (Sprint 0)
├── Feature: Task Management Basic (Sprint 1)
├── Feature: Task Persistence (Sprint 2)
└── Feature: User Authentication (Sprint 3)

Epic 2: Collaboration
├── Feature: Team Workspaces (Sprint 1)
├── Feature: Real-time Updates (Sprint 2)
└── Feature: Comments & Activity (Sprint 3)

Epic 3: Intelligence
├── Feature: Analytics Dashboard (Sprint 1)
├── Feature: AI Suggestions (Sprint 2)
└── Feature: Automation Rules (Sprint 3)
```

#### Feature Prioritization Matrix
| Feature | User Value | Technical Complexity | Dependencies | Sprint |
|---------|------------|---------------------|--------------|--------|
| Task CRUD | High | Low | None | 1-1 |
| Auth | High | Medium | None | 1-3 |
| Real-time | Medium | High | Auth, Tasks | 2-2 |

### 3. Project Setup

#### Folder Structure
```
project-root/
├── .pm/
│   ├── prd.md                      # Master feature roadmap
│   ├── technical-architecture.md   # System design
│   ├── data-architecture.md        # Database schema
│   ├── api-design.md              # API specifications  
│   ├── ui-ux-design.md            # Design system
│   ├── project-status.md          # Living status
│   ├── process/
│   │   ├── ai-workflow.md
│   │   ├── sprint-brief.md
│   │   ├── epic-brief.md
│   │   ├── prd-iteration.md
│   │   └── code-standards.md
│   ├── epics/
│   │   └── epic-001-core/
│   │       └── sprints/
│   │           ├── sprint-000-setup.md
│   │           ├── sprint-001-[feature].md
│   │           ├── sprint-002-[feature].md
│   │           └── sprint-003-[feature].md
│   └── reference-docs/
│       ├── decisions/
│       │   └── adr-001-[decision].md
│       └── lessons-learned.md
├── app/
├── components/
├── features/
└── [project code...]
```

#### Git Strategy
- `main` branch: Production-ready code
- `dev` branch: Active epic development
- Commit at end of each sprint
- Merge `dev` → `main` at epic completion
- Start fresh `dev` branch for next epic

### 4. Epic 1: Foundation + Core Value

This first epic establishes patterns for everything that follows.

**Epic Planning**: At the start of each epic, you'll plan ALL features for that epic. Each sprint delivers one complete feature. The last sprint is always refactoring.

#### Sprint 0: Project Setup & Design System
**Feature**: Beautiful UI Foundation
**Deliverables**:
- Complete design system in globals.css
- Base component library (Button, Card, Form, etc.)
- Layout components (AppShell, Navigation)
- Error/Loading/Empty states
- Responsive grid system

#### Sprint 1: [Core Feature Name]
**Feature**: [e.g., Task Management]
**Technical Scope**:
- Components: TaskList, TaskItem, TaskForm
- Mock Server Actions: createTask, updateTask, deleteTask
- Local state management
- Full UI with all interactions
- No backend yet

#### Sprint 2: Database & Persistence
**Feature**: Data Layer for [Core Feature]
**Technical Scope**:
- Implement all Server Actions from Sprint 1
- Database schema for core feature
- Replace mock data with real queries
- Add optimistic updates
- Error handling

#### Sprint 3: User Authentication  
**Feature**: Secure User Accounts
**Technical Scope**:
- Components: AuthModal, UserMenu, ProfileForm
- Server Actions: signUp, signIn, signOut
- Database: users, sessions tables
- Protected routes
- Session management

#### Sprint 4: Refactoring & Polish
**Feature**: Production Readiness
**Technical Scope**:
- Extract shared code from features
- Optimize performance
- Complete test coverage
- Documentation
- Ensure all features work together

### 4. Development Process

#### Epic Flow
1. **Start Epic**: Attach `epic-brief.md`
   - Reality check against PRD
   - Plan sprint breakdown
   - Set epic goals

2. **Run Sprints**: For each sprint:
   - Attach `sprint-brief.md` + `ai-workflow.md`
   - Follow workflow strictly
   - Update sprint status continuously
   - Commit at sprint end

3. **End Epic**: Attach `epic-brief.md`
   - Comprehensive testing
   - Update all documentation
   - Merge dev → main
   - Plan next epic

#### Testing Levels

**Level 1 (Default)**:
- Lint, type-check, build
- Unit tests for utilities
- Integration tests for APIs
- Manual testing checklist

**Level 2 (Critical features/epic end)**:
- Everything from Level 1
- Full Playwright E2E suite
- Visual regression tests
- Performance testing
- Accessibility audit

### 5. File Organization Rules

```
project-root/
├── app/                    # App router, no /src
│   ├── (auth)/            # Route groups
│   ├── api/               # All API routes
│   │   └── [resource]/
│   ├── globals.css
│   └── layout.tsx
├── components/            # Shared UI components
│   └── ui/               # shadcn components
├── features/             # Feature modules
│   └── [feature]/
│       ├── actions/      # Server actions
│       ├── components/   # Feature components
│       ├── hooks/
│       ├── utils/
│       ├── validations/
│       └── types.ts
├── lib/                  # Shared utilities
├── hooks/                # Shared hooks
├── types/                # Shared types
├── validations/          # Shared schemas
└── services/             # External services
```

**Naming Conventions**:
- Components: PascalCase
- Files: kebab-case
- Actions: verb-noun
- API routes: RESTful

### 6. Quality Standards

#### Code Quality
- Senior architect-level solutions
- No hacks or quick fixes
- Well-documented with JSX comments
- Consistent patterns throughout
- Performance considered

#### UI/UX Quality
- Beautiful, polished interface
- Consistent design system usage
- All states handled (loading, error, empty)
- Responsive and accessible
- Delightful interactions

### 7. Success Metrics
- Features work end-to-end first time
- Minimal debugging between AI sessions
- Consistent UI/UX throughout
- Clean, maintainable codebase
- Steady velocity across sprints

## Remember
The first epic sets the tone for the entire project. Take time to get the design system and core feature absolutely right - everything builds on this foundation.