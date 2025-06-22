# Epic: Core Organization - Implementation Plan

## Overview
This document outlines the implementation plan for the "Core Organization" epic. The goal is to transition the application from a static, mock-data-driven interface to a fully persistent, user-configurable system for organizing notes and chats within Spaces and Collections.

## Sprint 2.1: Backend Foundation & Data Modeling (Completed)

- [x] **Task 2.1.1:** Update Database Schema (`lib/db/schema.ts`)
  - ~~Status: In Progress~~
  - ~~Notes: Added `spaces`, `collections`, and `notes` tables.~~
  - **Status: Completed.**
- [x] **Task 2.1.2:** Implement Database Migrations
  - ~~Status: In Progress~~
  - ~~Notes: Encountered issues with `drizzle-kit db push`. Created a temporary script to apply the migration. The database schema is now up-to-date.~~
  - **Status: Completed.**
- [x] **Task 2.1.3:** Create Backend API Routes
  - ~~Status: In Progress~~
  - ~~Notes: Created all necessary `GET`, `POST`, `PUT`, `DELETE` endpoints for spaces, collections, and notes.~~
  - **Status: Completed.**
- [x] **Task 2.1.4:** Implement State Management with Zustand
  - ~~Status: In Progress~~
  - ~~Notes: Created the `organization-store` to manage the client-side state for spaces, collections, and notes.~~
  - **Status: Completed.**
- [x] **Task 2.1.5:** Fix All Linter and Type-Checking Errors
  - **Status: Completed.**
  - Notes: Corrected all type errors in API routes (including the Next.js 15 `params` Promise pattern) and Zustand store. The build is now successful.

## Sprint 2.2: Comprehensive Sidebar Overhaul & Interactivity

This sprint focuses on completely rebuilding the sidebar UI and implementing all related user interaction features as per the new requirements.

### Phase 1: Backend & Data Model Enhancements
- **Task 2.2.1:** Enhance Database Schema (`lib/db/schema.ts`)
  - **Status: Not Started**
  - **Details:**
    - Add a `title` column to the `notes` table.
    - Create a new `chats` table with a similar structure (`id`, `userId`, `title`, `collectionId`, `createdAt`, `updatedAt`).
    - Add a `collectionId` (nullable) to both `notes` and `chats` tables for categorization.
    - Add a `type` enum column (`static`, `seeded`, `user`) to `spaces` and `collections` tables.
- **Task 2.2.2:** Refactor API Endpoints
  - **Status: Not Started**
  - **Details:**
    - Update `POST /api/notes` (and create for chats) to assign a default title.
    - Update `PUT /api/notes/[noteId]` (and create for chats) to handle `title` and `collectionId` updates.
    - Rewrite `GET /api/spaces` to return a nested structure: `spaces -> collections -> notes/chats`.
- **Task 2.2.3:** Implement User Account Seeding
  - **Status: Not Started**
  - **Details:** Create a function to run on new user signup that populates their account with `Personal` and `Work` spaces, each containing `All`, `Recent`, and `Saved` collections.

### Phase 2: Global Styling & UI Implementation
- **Task 2.2.4:** Define & Apply Consistent Global Styles
  - **Status: Not Started**
  - **Details:**
    - Audit `app/globals.css` for existing patterns.
    - Add new utility classes for subtle `hover`, `active`, and `focus` states directly into `app/globals.css`.
    - Refactor all interactive components (`sidebar-nav`, `dropdown-menu`, `user-menu`, etc.) to use these new styles.
- **Task 2.2.5:** Rebuild Sidebar UI (`sidebar-nav.tsx`)
  - **Status: Not Started**
  - **Details:**
    - Rebuild the component to render the new nested data structure from the API.
    - Integrate a `Collapsible` component for expandable/collapsible spaces and collections.
    - Position `+ New Space` and `+ New Collection` buttons correctly.

### Phase 3: Core Interactivity
- **Task 2.2.6:** Implement Right-Click Context Menus
  - **Status: Not Started**
  - **Details:**
    - Use a `ContextMenu` component from `shadcn/ui`.
    - Wrap sidebar items to trigger the menu on right-click.
    - Hook up "Edit" and "Delete" actions to the appropriate APIs.
- **Task 2.2.7:** Implement Drag-and-Drop
  - **Status: Not Started**
  - **Details:**
    - Install and configure `dnd-kit`.
    - Make notes/chats `Draggable` and collections/spaces `Droppable`.
    - Implement the `onDragEnd` handler to update state optimistically and call the API to persist the move (`collectionId` change).

### Phase 4: Advanced Features
- **Task 2.2.8:** Implement Editable Titles
  - **Status: Not Started**
  - **Details:** Add an editable title input to the main note/chat view that syncs with the database.
- **Task 2.2.9:** Implement Intelligent Auto-Naming
  - **Status: Not Started**
  - **Details:**
    - Use a debounced hook on the editor content.
    - On pause, extract the first line of text from a new note/chat.
    - Call the API to update the item's `title` automatically, providing a seamless "auto-naming" experience.

## Sprint 2.3: Editor Integration (Pending Approval)
- **Task 2.3.1:** Connect Editor to Persistence Layer
  - **Status: Blocked**
  - **Notes:** This task is pending a full review and approval of the new sidebar implementation. The goal is to integrate note creation, saving, and updating directly with the editor component, using the new API and state management structure. 