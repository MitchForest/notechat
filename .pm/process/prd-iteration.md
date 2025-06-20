# PRD Reality Check Process

This process ensures we're building the right thing. Use it at epic boundaries when doing your reality check.

## When to Use This

- **Start of Each Epic**: Major reality check and potential pivot
- **When Blocked**: If something isn't working as planned
- **When Requirements Change**: External factors force reassessment

## The Reality Check Process

### 1. Read Current PRD
Open `.pm/prd.md` and review:
- Original vision and problem statement
- Current epic/sprint roadmap
- Success metrics
- Core principles

### 2. Assess Against Reality

#### What We've Learned
- Which assumptions were wrong?
- What's harder than expected?
- What's easier than expected?
- What do users actually need?

#### Technical Discoveries
- Performance constraints found?
- Integration challenges?
- Scaling issues?
- Better technical approaches?

#### Market/User Changes
- Has the problem evolved?
- New competitors emerged?
- User feedback received?
- Better solutions seen elsewhere?

### 3. Apply the 80/20 Analysis

For remaining features, ask:

#### Value Assessment
1. What 20% delivers 80% of user value?
2. What are we building "just in case"?
3. What would users pay for specifically?
4. What's nice vs. necessary?

#### Simplification Opportunities
1. What if we had half the time?
2. What manual process could work for now?
3. Where are we over-engineering?
4. What's the simplest thing that could work?

#### Risk Evaluation
1. What could completely block progress?
2. What dependencies can we eliminate?
3. What's the riskiest assumption?
4. Where might we fail?

### 4. Document Changes

If changes needed, update PRD:

```markdown
## Revision History

### [Date] - Epic [X] Reality Check
**Context**: [What triggered this review]

**Key Learnings**:
- [Learning 1]: [Impact]
- [Learning 2]: [Impact]

**Changes**:
- [What we're changing]: [Why]
- [What we're removing]: [Why]
- [What we're adding]: [Why]

**Updated Roadmap**:
- [How epic/sprint plan changes]
```

## Anti-Patterns to Catch

Watch for these red flags:

❌ **Feature Creep**
- "While we're at it..."
- "Users might want..."
- "It's almost as easy to..."

❌ **Premature Optimization**
- "When we have millions of users..."
- "For future scalability..."
- "In case we need..."

❌ **Solution Attachment**
- "But we already built..."
- "The plan says..."
- "We committed to..."

## Good Patterns to Encourage

✅ **Ruthless Prioritization**
- "What's absolutely essential?"
- "What can we ship without?"
- "What validates our assumption?"

✅ **Rapid Validation**
- "How can we test this faster?"
- "What's the minimum to learn?"
- "Can we fake it first?"

✅ **User Focus**
- "What problem does this solve?"
- "Would users notice if missing?"
- "Is this our opinion or their need?"

## Output Template

After reality check, summarize:

```markdown
## Reality Check Summary

### Decision: [Continue as Planned | Adjust Approach | Major Pivot]

### If Adjusting:
**What's Changing**: [Specific changes]
**Why**: [Reasoning based on learnings]
**Impact**: [How this affects timeline/scope]

### Key Insights:
1. [Insight that affects future decisions]
2. [Technical learning to remember]
3. [User understanding gained]

### Next Epic Focus:
[Updated 1-2 sentence description]
```

## The Core Question

Throughout this process, keep asking:

> "Are we building the right thing in the simplest way possible?"

If the answer isn't a clear "yes," it's time to adjust.

## Remember

- Plans are guides, not contracts
- Learning and adapting is success
- Simpler is almost always better
- Working software > perfect plans
- User value > technical elegance

The goal isn't to follow the plan—it's to build something valuable efficiently.