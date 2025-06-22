# Epic: AI Improvements

**Status:** In Progress  
**Priority:** HIGH  
**Start Date:** 2024-12-30  
**Target Completion:** 2025-01-03  

## Overview

This epic addresses critical AI functionality issues and implements personalization features to enhance the user experience. The focus is on getting basic working functionality as soon as possible.

## Goals

1. **Fix Ghost Completions** - Make `++` trigger work properly with Tab to accept
2. **Fix Bubble Menu** - Restore bubble menu functionality for text selection
3. **Fix AI Inline Interface** - Ensure proper formatting and "Edit Prompt" feature
4. **Add AI Command Personalization** - Allow users to customize their AI commands
5. **Implement Basic Learning** - Track user preferences implicitly

## Success Criteria

- [ ] Ghost completions appear when typing `++` and can be accepted with Tab
- [ ] Bubble menu shows when text is selected
- [ ] AI inline interface properly formats code blocks
- [ ] Users can edit prompts after initial submission
- [ ] Settings modal allows customizing AI commands
- [ ] System learns from accepted/rejected completions

## Technical Approach

### Phase 1: Critical Fixes (Day 1)
- Fix ghost completion visibility and interaction
- Fix bubble menu not appearing
- Fix AI inline interface layout issues

### Phase 2: Edit Prompt Feature (Day 1)
- Add edit functionality to AI inline interface
- Improve code block detection and formatting

### Phase 3: Personalization (Day 2)
- Create user preferences table
- Build settings modal
- Integrate custom commands

### Phase 4: Learning System (Day 3)
- Implement interaction tracking
- Create learning feedback loop

## Sprints

1. **Sprint 1:** Ghost Completions & Bubble Menu Fixes
2. **Sprint 2:** AI Interface Improvements  
3. **Sprint 3:** Personalization System
4. **Sprint 4:** Learning Implementation

## Key Decisions

- Use modal/dialog for settings (not full page)
- Implicit learning only (no explicit ratings)
- Track ghost completion and slash command acceptances
- Simple code block detection without complexity

## Risk Mitigation

- Test all fixes in both light/dark themes
- Ensure backward compatibility
- Add proper error handling
- Keep learning data minimal for v1

## Dependencies

- Database migration for user preferences
- New API endpoints for preferences
- UI components (already have dialog/modal components) 