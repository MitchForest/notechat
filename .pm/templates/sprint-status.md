# Sprint [EPIC#]-[SPRINT#]: Feature [ID] - [FEATURE NAME]

## Feature Overview
**Feature ID**: F[XX] from PRD
**User Story**: As a [user type], I want to [action] so that [value]
**Dependencies**: [List feature IDs this depends on]

## Sprint Goal
**Deliver**: [One clear sentence describing the feature]
**Success Criteria**: 
- [ ] [Specific user-facing capability]
- [ ] [Specific user-facing capability]
- [ ] [Measurable outcome]

## Status
- **Current Phase**: [Planning | Building | Testing | Complete]
- **Started**: [DATE]
- **Testing Level**: [1-Standard | 2-Comprehensive]
- **Blockers**: [None | Description]

## Feature Implementation Plan

### Acceptance Criteria (from PRD)
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

### Technical Scope

**Components to Build**:
```typescript
// Server Components
FeatureLayout.tsx         // Page structure
FeatureList.tsx          // Data display

// Client Components
FeatureInteraction.tsx   // User interactions
FeatureForm.tsx          // Input handling
```

**Server Actions Required**:
```typescript
// features/[feature]/actions/
createFeature(data: Input): Promise<Result<Feature>>
updateFeature(id: string, data: Update): Promise<Result<Feature>>
getFeatures(filters?: Filters): Promise<Result<Feature[]>>
```

**Database Requirements**:
```sql
-- New tables
features (
  id UUID PRIMARY KEY,
  [columns]
)

-- Modifications to existing
ALTER TABLE related_table ADD COLUMN feature_id UUID;
```

**API Routes** (if needed):
```
POST /api/features/bulk
GET /api/features/export
```

### UI/UX Implementation

**User Flow**:
1. [Entry point] → [Initial state]
2. [User action] → [System response]
3. [Success state] → [Next action]

**Design Specifications**:
- Layout: [Grid/List/Custom]
- Mobile: [Responsive approach]
- Animations: [Transitions needed]
- Empty state: [What to show]
- Error handling: [How to display]

### Architecture Overview

#### Architecture Overview
- **Rendering Strategy**: [Server/Client/Hybrid]
- **State Management**: [Server state/Client state needs]
- **Data Flow**: [How data moves through the system]

#### Frontend Components
```
components/
└── features/[feature]/
    ├── FeatureComponent.tsx    # Server/Client component
    ├── FeatureForm.tsx         # Client component with RHF
    └── FeatureList.tsx         # Server component
```
- **Component Breakdown**: [List each with props]
- **Client vs Server**: [Reasoning for each]
- **State Requirements**: [What needs client state]

#### Backend Implementation
- **Server Actions**:
  ```typescript
  createFeature(data: FeatureInput): Promise<Result<Feature>>
  updateFeature(id: string, data: FeatureUpdate): Promise<Result<Feature>>
  ```
- **API Routes** (if needed):
  ```
  GET /api/features?filter=...&sort=...
  POST /api/features/bulk
  ```
- **Database Schema**:
  ```sql
  features (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    [other columns]
  )
  ```

#### Data Access Pattern
- **Loading Strategy**: [SSR/SSG/ISR/Dynamic]
- **Caching**: [revalidatePath/revalidateTag usage]
- **Real-time**: [Supabase subscriptions if needed]

#### UI/UX Specifications
- **Layout**: [Grid/List/Card view]
- **Interactions**: [Click/Drag/Swipe behaviors]
- **Responsive**: [Mobile vs Desktop differences]
- **Animations**: [Transitions and feedback]

#### Key Design Decisions
- **Pattern**: [Approach chosen and why]
- **Trade-off**: [What we optimized for]

## Progress Log

### [DATE + TIME] - Sprint Planning
- Reviewed requirements and context
- Created implementation plan
- Identified approach for [specific challenge]
- **Next**: Get plan approval

### [DATE + TIME] - Implementation Started
**Completed Today**:
- ✅ [User-facing accomplishment]
- ✅ [Technical implementation detail]

**Files Created**:
```
features/[feature]/
├── components/Thing.tsx    # Main UI component
├── actions/create-thing.ts # Server action
└── types.ts               # TypeScript types
```

**Files Modified**:
- `app/page.tsx` - Added feature section
- `lib/db/schema.ts` - Added things table

**Key Decisions Made**:
- **[Decision]**: [Why this approach]
  - Considered: [alternatives]
  - Chose this because: [reasoning]

**Discovered/Learned**:
- [Gotcha or insight]
- [How it affects implementation]

### [DATE + TIME] - Testing Phase
**Test Results**:
- ✅ Lint: Pass
- ✅ Type Check: Pass
- ✅ Build: Pass (23s)
- ✅ Unit Tests: 12/12 passing
- ✅ Integration Tests: 5/5 passing
- ⏳ E2E Tests: [If Level 2]

**Issues Found & Fixed**:
- [Issue]: [How resolved]

## Technical Details

### Architecture Decisions

**[Major Decision Name]**
- **Context**: [Why we needed to decide]
- **Options Considered**: 
  1. [Option A]: [Pros/cons]
  2. [Option B]: [Pros/cons]
- **Decision**: [What we chose]
- **Reasoning**: [Why this was best]

### Code Patterns Established

```typescript
// Example of pattern for this feature
export async function serverActionPattern(
  data: ValidatedInput
): Promise<Result> {
  // 1. Validate
  // 2. Authorize
  // 3. Execute
  // 4. Return typed result
}
```

### API Design
If applicable, document new endpoints:
```
POST /api/resource
Body: { name: string, ... }
Response: { id: string, ... }
Auth: Required
```

### Database Schema
```sql
-- New or modified tables
CREATE TABLE things (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Testing Summary

### Test Coverage
- **Unit Tests**: Components and utilities
- **Integration Tests**: API routes and server actions  
- **E2E Tests**: Complete user flows (if Level 2)

### Manual Testing Checklist
- [x] Happy path works as expected
- [x] Error states show correct messages
- [x] Loading states appear properly
- [x] Empty states are handled
- [x] Responsive on mobile/tablet/desktop
- [x] Keyboard navigation works
- [x] Screen reader compatible

## Key Learnings

### Technical Insights
- **Gotcha**: [What we encountered]
  **Solution**: [How we solved it]
  **Future Note**: [What to remember]

### Process Improvements
- [What worked well this sprint]
- [What to do differently next time]

### Patterns for Future Sprints
- [Pattern that should be reused]
- [Approach that worked well]

## Handoff Summary

### For Development Team
**Feature Complete**: [Feature Name]

**What It Does**:
[User-facing description in 2-3 sentences]

**How to Test**:
1. Run `bun dev`
2. Navigate to [URL]
3. [Specific user action]
4. Verify [expected result]

**Key Implementation Notes**:
- [Important pattern used]
- [Why certain decisions were made]
- [Anything unusual to be aware of]

### For Next Sprint
- **Foundation Laid**: [What's now available to build on]
- **Consider**: [Suggestion for next feature]
- **Watch Out For**: [Potential issue to address]

---
*Last Updated: [DATE + TIME] - [Phase of sprint]*