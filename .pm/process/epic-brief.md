# Epic Brief: Start & End Process

This document guides the epic-level process. Use at the START of a new epic and at the END before moving to the next epic.

## Starting a New Epic

### 1. Reality Check (10-15 minutes)

**Read the PRD** (`.pm/prd.md`) and ask:

#### Vision Check
- Is the core problem still the same?
- Has our understanding of users evolved?
- Is the value proposition still valid?
- Should we pivot based on learnings?

#### Technical Learnings
- What technical constraints have we discovered?
- What's harder than originally expected?
- What's easier than expected?
- Any performance/scaling concerns?

#### Scope Refinement
- What features turned out to be unnecessary?
- What new requirements emerged?
- Can we simplify further?
- Are we over-engineering anything?

### 2. Update PRD if Needed

If significant changes:
```markdown
## Revision History
### [Date] - Epic [X] Start
- **Learning**: [What we discovered]
- **Change**: [What we're adjusting]
- **Impact**: [How this affects the plan]
```

### 3. Plan Epic Breakdown

**This is where you plan ALL sprints for the entire epic, including technical architecture.**

Review the PRD's technical specifications and plan sprints:
- Define 3-5 feature sprints with clear technical scope
- **Always include a final refactoring sprint**
- Each sprint should deliver specific components/APIs
- Consider technical dependencies between features
- Map out:
  - Which components will be Server vs Client
  - What Server Actions each sprint needs
  - Database schema evolution
  - API endpoint requirements
  
The last sprint is ALWAYS for:
- Code review and refactoring
- DRY improvements  
- Comprehensive testing (Level 2)
- Performance optimization
- Documentation updates

Example Epic Structure:
```
Sprint 1: User Dashboard (Server Components + mock data)
Sprint 2: Task Management (CRUD Server Actions + DB)
Sprint 3: Real-time Collab (WebSockets + Subscriptions)
Sprint 4: Refactor & Polish (mandatory)
```

Technical questions to consider:
- Can any sprints be combined?
- Should any be split up?
- Is the order still optimal?
- Any new dependencies?

### 4. Set Epic Success Criteria

Define what "done" means:
- [ ] Core functionality complete
- [ ] All tests passing
- [ ] Performance acceptable
- [ ] UI polished and consistent
- [ ] Documentation updated

### 5. Technical Preparation

- Ensure on `dev` branch
- Review current codebase state
- Check for any technical debt to address
- Identify patterns to establish

## Ending an Epic

### 1. Comprehensive Testing (Level 2)

Run full test suite:
```bash
# All the basics
bun run lint
bun run type-check  
bun run build
bun test

# Plus comprehensive E2E
bun run test:e2e

# Performance check
bun run lighthouse

# Accessibility audit
bun run test:a11y
```

### 2. Code Review & Refactoring

**This should have been done in the final refactoring sprint, but double-check:**

#### Pattern Extraction
- What code is duplicated across sprints?
- What should be extracted to shared utilities?
- Any components that should be generalized?

#### Technical Debt
- Any "quick fixes" that need proper solutions?
- Performance optimizations needed?
- Better error handling needed?

#### Code Quality
- All files have proper header comments?
- Complex logic documented?
- Consistent patterns throughout?

### 3. Documentation Updates

#### Update Project Status
```markdown
## Completed Epics
### Epic [X]: [Name]
- **Completed**: [DATE]
- **Sprints**: [X] sprints  
- **Key Features**:
  - [Feature 1]
  - [Feature 2]
- **Major Decisions**:
  - [Decision and why]
```

#### Update Reference Docs
- Architecture decisions made?
- New patterns established?
- Lessons learned?
- API documentation current?

### 4. Git Operations

```bash
# Ensure all changes committed
git add .
git commit -m "feat: complete epic [X] - [name]"

# Merge to main
git checkout main
git merge dev

# Tag the release
git tag -a "epic-[X]-complete" -m "Epic [X]: [Name]"
git push origin main --tags

# Create fresh dev branch
git checkout -b dev
git push -u origin dev
```

### 5. Epic Retrospective

Answer these questions:

#### Success Analysis
- Did we achieve the epic goals?
- What went better than expected?
- What was harder than expected?

#### Time Analysis
- Planned sprints: [X]
- Actual sprints: [Y]
- Why the difference?

#### Learning Synthesis
- Top 3 technical learnings?
- Top 3 product learnings?
- What would we do differently?

#### Next Epic Impact
- How do these learnings affect the next epic?
- Any plan adjustments needed?
- Technical prerequisites?

### 6. Prepare Next Epic Brief

Create summary for next epic:
```markdown
## Context from Epic [X]
- **Key Patterns**: [What was established]
- **Technical Decisions**: [What affects next epic]
- **Warnings**: [What to watch out for]
```

## Checklist

### Epic Start ✓
- [ ] Reality check completed
- [ ] PRD updated if needed
- [ ] Sprint plan adjusted
- [ ] Success criteria defined
- [ ] On dev branch

### Epic End ✓
- [ ] All tests passing (Level 2)
- [ ] Code refactored and clean
- [ ] Documentation updated
- [ ] Merged to main and tagged
- [ ] Fresh dev branch created
- [ ] Retrospective completed
- [ ] Next epic context prepared

## Remember

Epics are major milestones. Take time to:
- Celebrate what was built
- Learn from the experience
- Set up the next epic for success

The epic boundaries are where we step back, assess, and ensure we're building the right thing the right way.