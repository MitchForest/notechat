# Project Status: [PROJECT NAME]

## Overview
**Started**: [DATE]
**Current Status**: Epic [X], Sprint [Y]
**Production URL**: [URL if deployed]
**Repository**: [GitHub URL]

## Project Vision
[1-2 sentences about what we're building and why]

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **ORM**: Drizzle
- **Auth**: Better-Auth
- **Runtime**: Bun
- **UI Components**: shadcn/ui
- **AI**: Vercel AI SDK
- **Testing**: Playwright, Bun test
- **Deployment**: Vercel

## Epic Progress

### ✅ Epic 1: Foundation + Core
**Completed**: [DATE]
**Sprints**: 4 (Setup, Core Feature, Database, Auth)

**Delivered**:
- Beautiful design system and UI components
- [Core feature description]
- Persistent data with Supabase
- User authentication and sessions

**Key Decisions**:
- [Major technical decision and why]
- [Major product decision and why]

### 🏃 Epic 2: [Current Epic Name]
**Started**: [DATE]
**Progress**: Sprint [X] of [Y]
**Current Sprint**: [Name]

**Planned Delivery**:
- [Feature 1]
- [Feature 2]

### 📋 Epic 3: [Future Epic Name]
**Planned Features**:
- [Feature 1]
- [Feature 2]

## Architecture & Patterns

### File Organization
```
No /src, features/ for modules, components/ for shared UI
API routes in app/api/, Server Actions in features/*/actions/
```

### Key Patterns Established
1. **State Management**: [Approach]
   - Example: "Server-first with Server Actions for mutations"

2. **Error Handling**: [Approach]
   - Example: "Error boundaries at page level, toast for user actions"

3. **Data Fetching**: [Approach]
   - Example: "Server Components by default, SWR for client-side"

4. **Styling**: [Approach]
   - Example: "Tailwind utilities + CSS variables for design tokens"

### Design System
- **Established in**: Sprint 0
- **Key Decisions**:
  - [Color philosophy]
  - [Spacing system]
  - [Component architecture]

## Critical Learnings

### Technical Insights
1. **[Learning]**: [Why it matters]
   - Example: "Supabase RLS policies must be explicit - default is deny all"

2. **[Learning]**: [Why it matters]

### Product Insights
1. **[Learning]**: [How it changed our approach]

### What We Do Differently Now
- [Practice]: [Why we changed]
- Example: "Always build UI first with mock data - validates UX before complex backend"

## Performance Metrics
- **Build Time**: [X] seconds
- **Lighthouse Score**: [X]/100
- **First Contentful Paint**: [X]ms
- **Bundle Size**: [X]kb

## API Endpoints

### Core APIs Built
- `POST /api/auth/*` - Authentication flows
- `GET/POST /api/[resource]` - [Description]
- [Other key endpoints]

### Server Actions
- `create[Resource]` - [What it does]
- `update[Resource]` - [What it does]

## Testing Coverage
- **Unit Tests**: [X]% coverage
- **Integration Tests**: All API endpoints
- **E2E Tests**: [X] user flows
- **Latest Test Run**: [DATE] - All passing ✅

## Quick Reference

### Environment Variables
```env
# Required in .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
[Other required vars]
```

### Common Commands
```bash
bun dev              # Start development
bun test            # Run tests
bun run build       # Production build
bun run type-check  # TypeScript check
```

### Important Links
- Design System Reference: `app/globals.css`
- Component Library: `/components/ui/`
- Current Sprint: `.pm/epics/epic-[X]/sprints/sprint-[Y].md`

## For New AI Sessions

**Start Here**:
1. Read this project status (you are here)
2. Check current sprint: `.pm/epics/epic-[X]/sprints/sprint-[Y].md`
3. Review workflow: `.pm/process/ai-workflow.md`
4. Follow sprint brief: `.pm/process/sprint-brief.md`

**Key Context**:
- [Most important pattern/decision]
- [Critical technical gotcha]
- [Design principle to maintain]

---
*Last Updated: [DATE] - End of Sprint [X]-[Y]*