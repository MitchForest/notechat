# Product Requirements Document: [PROJECT NAME]

*This is the master feature roadmap. Technical details are in supporting documents.*

## 1. Vision & Context

### Problem Statement
[1-2 paragraphs clearly describing the problem we're solving and why it matters]

### Target Users
- **Primary**: [Specific user persona] - [Their core need]
- **Secondary**: [Additional user type] - [Their need]

### Core Principles
1. **[Principle]**: [How this shapes our decisions]
2. **[Principle]**: [How this shapes our decisions]
3. **[Principle]**: [How this shapes our decisions]

## 2. Feature Inventory

### Feature Map
| ID | Feature Name | User Value | Complexity | Dependencies | Epic | Sprint |
|----|-------------|------------|------------|--------------|------|--------|
| F01 | [Core Feature] | [Why users need this] | L/M/S | None | 1 | 1 |
| F02 | [Data Persistence] | [Value provided] | M | F01 | 1 | 2 |
| F03 | [User Auth] | [Value provided] | M | None | 1 | 3 |
| F04 | [Feature] | [Value provided] | L | F03 | 2 | 1 |

### Feature Prioritization
- **🎯 MVP (Epic 1)**: F01, F02, F03 - Core value loop
- **🚀 Enhance (Epic 2)**: F04, F05, F06 - Expand capabilities  
- **📈 Scale (Epic 3)**: F07, F08 - Growth features

### Dependency Graph
```
F01 (Core Feature)
├── F02 (Persistence)
└── F07 (Analytics)
    └── F08 (AI Features)

F03 (Auth)
├── F04 (Teams)
└── F05 (Permissions)
    └── F06 (Sharing)
```

## 3. Feature Specifications

### F01: [Core Feature Name]
**Epic**: 1 | **Sprint**: 1 | **Complexity**: Large

#### User Story
As a [user type], I want to [action] so that [benefit].

#### Acceptance Criteria
- [ ] User can [specific action]
- [ ] System [specific response]
- [ ] Data is [specific state]
- [ ] Works on mobile devices
- [ ] Accessible via keyboard

#### UI/UX Flow
```
1. User lands on [page]
2. Sees [initial state] 
3. Clicks [action] → [response]
4. Success: [what they see]
5. Error: [fallback behavior]
```

#### Key Components
- `FeatureList` - Server component for data display
- `FeatureForm` - Client component for interactions
- `FeatureItem` - Hybrid with optimistic updates

#### Technical Scope
- **Frontend**: [Key technical decisions]
- **Backend**: Server Actions for all mutations
- **Data**: See `data-architecture.md#F01`
- **API**: See `api-design.md#F01`

#### Business Rules
1. [Rule]: [Specific constraint/logic]
2. [Rule]: [Specific constraint/logic]

---

### F02: [Feature Name]
[Repeat above structure for each feature]

## 4. Epic Roadmap

### Epic 1: Foundation + Core Value 🏗️
**Goal**: Users can [achieve core value] immediately  
**Duration**: 4-5 sprints

| Sprint | Feature | Deliverable |
|--------|---------|-------------|
| 0 | Setup | Design system, component library |
| 1 | F01 | Core feature with mock data |
| 2 | F02 | Database integration |
| 3 | F03 | User authentication |
| 4 | Refactor | Polish, test, optimize |

### Epic 2: Enhance & Expand 🚀
**Goal**: Enable [advanced use cases]  
**Duration**: 3-4 sprints

[Sprint breakdown with features]

### Epic 3: Intelligence & Scale 📈
**Goal**: Make the product smarter
**Duration**: TBD based on Epic 1-2 learnings

## 5. Technical Overview

### Architecture
See `technical-architecture.md` for:
- System diagrams
- Tech stack decisions
- Performance requirements
- Security architecture
- Deployment strategy

### Data Model
See `data-architecture.md` for:
- Complete ERD
- Schema definitions
- Migration strategy
- Access patterns

### API Design
See `api-design.md` for:
- Server Action specifications
- REST endpoint documentation
- Real-time subscriptions
- External integrations

### UI/UX Design
See `ui-ux-design.md` for:
- Design system
- Component library
- Interaction patterns
- Responsive strategy
- Accessibility standards

## 6. Risks & Assumptions

### Technical Risks
1. **[Risk]**: [Impact] → [Mitigation]
2. **[Risk]**: [Impact] → [Mitigation]

### Key Assumptions
1. **[Assumption]**: [What we're betting on]
2. **[Assumption]**: [What we're betting on]

### Out of Scope
- ❌ [Feature]: [Why we're not building this]
- ❌ [Feature]: [Why we're not building this]

## 7. Appendices

### Supporting Documents
- 📐 `technical-architecture.md` - System design and decisions
- 🗄️ `data-architecture.md` - Database schema and models
- 🔌 `api-design.md` - Detailed API specifications
- 🎨 `ui-ux-design.md` - Design system and patterns

### Revision History
| Date | Version | Changes | Author |
|------|---------|---------|--------|
| [Date] | 1.0 | Initial PRD | [Name] |
| [Date] | 1.1 | Post-Epic 1 updates | [Name] |

---

## Quick Reference

**Current Status**: Epic [X], Sprint [Y]  
**Next Feature**: F[XX] - [Name]  
**Blocking Issues**: [Any blockers]  
**Key Decision Needed**: [If any]

*This document focuses on WHAT we're building and WHY. For HOW, see the supporting technical documents.*