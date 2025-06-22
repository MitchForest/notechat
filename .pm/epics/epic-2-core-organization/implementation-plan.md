# Implementation Plan: Epic 2 - Core Organization

This document outlines the detailed technical plan for implementing the core organizational features, including persistent spaces, collections, and notes, backed by a database.

### Guiding Principles
- **User-Centric Data:** All organizational entities (`spaces`, `collections`, `notes`) will be tied to a `userId`.
- **Scalable by Default:** The database schema and state management will be designed to support future features like persistent chats and advanced smart collections with minimal refactoring.
- **Optimistic UI:** State will be updated optimistically for a fluid user experience, with backend validation and error handling.

---

## Sprint 2.1: Foundational Backend & State Management

**Goal**: Build the data models, API endpoints, and client-side state management foundation for the entire organization system.

### **Step 1: Database Schema Definition**
*   **File to Modify**: `lib/db/schema.ts`
*   **Actions**:
    1.  **Create `notes` table**:
        -   `id` (uuid, pk)
        -   `userId` (uuid, fk to `users.id`, not null)
        -   `title` (text, default "Untitled Note")
        -   `content` (jsonb, for TipTap editor content)
        -   `spaceId` (uuid, fk to `spaces.id`, not null)
        -   `isStarred` (boolean, default false)
        -   `createdAt`, `updatedAt` (timestamps)
    2.  **Create `spaces` table**:
        -   `id` (uuid, pk)
        -   `userId` (uuid, fk to `users.id`, not null)
        -   `name` (text, not null)
        -   `emoji` (text)
        -   `isDefault` (boolean, default false)
        -   `createdAt`, `updatedAt` (timestamps)
    3.  **Create `collections` table**:
        -   `id` (uuid, pk)
        -   `userId` (uuid, fk to `users.id`, not null)
        -   `spaceId` (uuid, fk to `spaces.id`, not null)
        -   `name` (text, not null)
        -   `type` (enum: 'manual', 'smart', 'default', not null)
        -   `smartRules` (jsonb, nullable, for future use)
        -   `createdAt`, `updatedAt` (timestamps)
    4.  **Create `notes_to_collections` join table**:
        -   `noteId` (uuid, fk to `notes.id`)
        -   `collectionId` (uuid, fk to `collections.id`)
        -   Primary key on (`noteId`, `collectionId`)
    5.  **Define relations** for all new tables using `drizzle-orm/relations`.
*   **Task**: Run `bun drizzle:generate` to create the migration file and `bun drizzle:push` to apply it to the database.

### **Step 2: Install Dependencies**
*   **File to Modify**: `package.json`
*   **Action**: Add `zustand` for global state management.
    ```bash
    bun add zustand
    ```

### **Step 3: Backend API Development**
*   **Create Files**:
    -   `/app/api/spaces/route.ts` (GET, POST)
    -   `/app/api/spaces/[spaceId]/route.ts` (PUT, DELETE)
    -   `/app/api/collections/route.ts` (GET, POST)
    -   `/app/api/collections/[collectionId]/route.ts` (PUT, DELETE)
    -   `/app/api/notes/route.ts` (GET, POST)
    -   `/app/api/notes/[noteId]/route.ts` (GET, PUT, DELETE)
*   **Actions**:
    -   Implement standard CRUD logic for each route.
    -   Ensure all operations are authenticated and authorized, checking `userId` on every query.
    -   The `GET /spaces` endpoint should eagerly load its `collections`.
    -   The `GET /notes` endpoint for a space/collection should handle filtering for smart collections (initially, `isStarred` and `updatedAt`).

### **Step 4: Global State Management**
*   **File to Create**: `features/organization/store/organization-store.ts`
*   **Actions**:
    1.  Create a Zustand store (`useOrganizationStore`).
    2.  Define the store's state:
        -   `spaces`: `Space[]`
        -   `notes`: `Note[]`
        -   `activeSpaceId`: `string | null`
        -   `loading`: `boolean`
    3.  Define actions:
        -   `fetchInitialData(userId)`: Action to fetch all spaces, collections, and notes for a user.
        -   CRUD actions for `spaces`, `collections`, and `notes` that perform optimistic updates and then call the backend API.

### **Step 5: Default Data Seeding**
*   **File to Modify**: `lib/auth/session.ts` (or wherever user session is first created/checked).
*   **Action**:
    -   After a new user is created, create their default data:
        1.  "All Notes" Space (special, non-deletable)
        2.  "Work" Space
        3.  "Personal" Space
    -   For each space, create the three default collections: "All," "Recent," and "Saved."

---

## Sprint 2.2: Frontend Integration & Note Persistence

**Goal**: Connect the frontend UI to the new backend, enable note persistence, and implement core organizational interactions.

### **Step 1: Connect Sidebar to State**
*   **File to Modify**: `components/layout/sidebar-nav.tsx`
*   **Actions**:
    1.  Remove all mock data (`spacesState`, etc.).
    2.  Integrate `useOrganizationStore` to get spaces and collections.
    3.  On component mount, call the store's `fetchInitialData` action.
    4.  Render the dynamic list of spaces and their collections from the store.
    5.  Implement UI for creating a new space (e.g., a modal triggered by the '+' button).
    6.  Implement UI for creating new manual collections within a space.

### **Step 2: Note Persistence**
*   **File to Modify**: `features/editor/components/editor.tsx`
*   **Actions**:
    1.  When a note is opened, use an effect to fetch its full content using the `/api/notes/[noteId]` endpoint.
    2.  Display a loading state while the note content is being fetched.
    3.  Implement a debounced `save` function that is called on editor content changes (`onUpdate`).
    4.  The `save` function will make a `PUT` request to `/api/notes/[noteId]` with the updated title and content.
    5.  Integrate the `isStarred` status with a star icon/button in the editor toolbar, which updates the note via the API.

### **Step 3: Note Organization Logic**
*   **File to Modify**: `components/layout/sidebar-nav.tsx`
*   **Actions**:
    1.  **Displaying Notes**: When a collection is clicked, fetch and display the notes belonging to it.
        -   For **manual** collections, show notes from the `notes_to_collections` table.
        -   For the **"All"** collection, show all notes in that `spaceId`.
        -   For the **"Saved"** collection, show all notes in the space where `isStarred` is true.
        -   For the **"Recent"** collection, show all notes in the space modified in the last 7 days.
    2.  **Adding to Collections**: Implement a context menu or drag-and-drop functionality to add the currently open note to a manual collection. This will call an endpoint to create an entry in the `notes_to_collections` table.

### **Step 4: Final Polish & Testing**
*   **Actions**:
    -   Ensure loading states are handled gracefully across the UI (sidebar, editor).
    -   Implement empty states (e.g., "No notes in this collection").
    -   Allow users to rename and delete spaces and manual collections.
    -   When a manual collection is deleted, ensure notes are unaffected and simply removed from that collection.
    -   When a space is deleted, confirm with the user that all nested notes and collections will also be deleted.
    -   Thoroughly test all CRUD operations and user flows. 