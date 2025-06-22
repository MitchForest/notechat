# Epic: AI Chat UI/UX Redesign

## Epic Overview
Complete redesign of the AI chat interface to match Claude's elegant aesthetic while adding powerful note management features. Transform the current basic chat into a beautiful, intuitive experience for conversing with AI about notes, creating notes from conversations, and managing multi-note contexts.

## Goals
1. **Beautiful Claude-like UI** - Clean, centered, minimal design
2. **Seamless Note Integration** - Multi-note context, visual references
3. **Intuitive Note Creation** - Select text → Create note flow
4. **Enhanced Interactions** - Drag & drop, rich previews, smart actions
5. **Production Quality** - Fix all bugs, ensure smooth performance

## Success Metrics
- Zero errors during chat creation/interaction
- Smooth animations and transitions
- Intuitive note management without documentation
- Consistent design with our minimal aesthetic
- High performance with many messages

## Key Features

### 1. Claude-like Message Design
- Centered container (max-width: 48rem)
- Elegant message bubbles with proper spacing
- Subtle backgrounds and borders
- Beautiful typography and spacing

### 2. Multi-Note Context System
- Visual note pills showing active context
- Click pills to open notes in panel
- AI understands multiple note contexts
- Clear indication of which notes AI is referencing

### 3. Selection → Note Creation
- Select any chat text (user or AI)
- Right-click or floating toolbar
- Options: Copy, Create Note, Ask AI
- Inline preview → Save & open in panel

### 4. AI Note Creation Flow
- AI can create notes via tools
- Inline preview cards in chat
- One-click to open in note panel
- Smooth transition from preview to full note

### 5. Enhanced Interactions
- Drag notes from sidebar to add context
- Rich note preview cards in mentions
- Hover actions on messages
- Smart input suggestions

## Technical Requirements
- Use existing design tokens from globals.css
- Maintain resizable panel architecture
- Ensure mobile responsiveness
- Follow established code patterns
- No new dependencies unless critical

## Design Specifications

### Colors
- Primary (Green): Send button, primary actions
- Secondary: User message background
- Muted: AI message border
- Card: Note preview backgrounds

### Spacing
- Container padding: 2rem (desktop), 1rem (mobile)
- Message gap: 1.5rem
- Message padding: 16px
- Border radius: 18px (messages)

### Typography
- Use system font stack
- Message text: 15px
- Metadata: 13px
- Proper line height for readability

## Sprint Breakdown

### Sprint 1: Core Layout & Messaging
- Fix message layout and centering
- Implement Claude-like message design
- Fix send button color
- Fix chat creation error
- Add proper spacing and padding

### Sprint 2: Selection & Note Creation
- Implement text selection system
- Add right-click context menu
- Create note from selection flow
- Inline note preview component
- Integration with note panel

### Sprint 3: Multi-Note Context
- Note pills UI component
- Context management system
- Visual indicators in chat
- AI context awareness
- Drag & drop from sidebar

### Sprint 4: AI Note Tools
- Implement note creation tool
- Tool confirmation UI
- Note preview in chat
- Success/error handling
- Update existing note tool

### Sprint 5: Polish & Enhancement
- Message hover actions
- Smooth animations
- Loading states
- Error handling
- Mobile optimization

### Sprint 6: Testing & Refinement
- Cross-browser testing
- Mobile responsiveness
- Performance optimization
- Accessibility audit
- Bug fixes

## Risk Mitigation
- **Complexity**: Break into small, testable sprints
- **Performance**: Virtual scrolling for long chats
- **State Management**: Use existing stores, add minimal complexity
- **Design Consistency**: Follow established patterns

## Dependencies
- Existing chat infrastructure
- Note management system
- Resizable panels
- AI SDK integration

## Definition of Done
- All tests passing (lint, typecheck, build)
- Mobile responsive
- Smooth animations
- No console errors
- Accessibility compliant
- Design matches specifications
- Features work as described 