# Sprint 2.2 - Task 1.3: Update API Endpoints

## Task Summary
Updated API endpoints to support smart filtering (Recent, Starred, Uncategorized) and created full CRUD endpoints for chats to match the notes functionality.

## Completed Work

### 1. Updated Database Schema (`lib/db/schema.ts`):
- Added `content: jsonb('content')` to chats table
- Added `isStarred: boolean('is_starred').default(false)` to chats table
- Now chats have full parity with notes

### 2. Created Chat API Endpoints:

#### `app/api/chats/route.ts`:
- **GET**: List chats with filtering support
  - `filter=all` - All chats for user
  - `filter=all_recent` - Chats updated in last 7 days
  - `filter=all_starred` - Starred chats only
  - `filter=uncategorized` - Chats with no collection
  - `collectionId=uuid` - Chats in specific collection
- **POST**: Create new chat
  - Optional title (defaults to "Untitled Chat")
  - Optional collectionId (null = uncategorized)

#### `app/api/chats/[chatId]/route.ts`:
- **GET**: Fetch single chat
- **PUT**: Update chat (title, isStarred, collectionId, content)
- **DELETE**: Delete chat

### 3. Enhanced Notes API (`app/api/notes/[noteId]/route.ts`):
- Added validation schema for updates
- Added support for updating `collectionId`
- Improved error handling with Zod validation

### 4. Created Database Migration Script:
- `scripts/add-chat-columns.sql`
- Adds missing columns to chats table
- Creates performance indexes for common queries

## Smart Collection Logic Implemented

### Recent Collections:
- Filter: `updatedAt > (now - 7 days)`
- Exactly 168 hours from current time
- Items also appear in their assigned collections

### Saved Collections:
- Filter: `isStarred = true`
- Binary state (no priority levels)
- Items also appear in their assigned collections

### Uncategorized Collections:
- Filter: `collectionId IS NULL`
- Only appear here (not in other collections)
- Move out when assigned to a collection

### All Collections:
- No filter applied
- Shows all items of that type (notes or chats)

## API Response Examples

```json
// GET /api/chats?filter=all_recent
[
  {
    "id": "uuid",
    "userId": "user-uuid",
    "collectionId": "collection-uuid",
    "title": "Project Discussion",
    "content": null,
    "isStarred": false,
    "createdAt": "2024-12-19T...",
    "updatedAt": "2024-12-19T..." // Within last 7 days
  }
]

// PUT /api/notes/[noteId] - Star a note
{
  "isStarred": true
}

// POST /api/chats - Create uncategorized chat
{
  "title": "New Chat"
  // No collectionId = uncategorized
}
```

## Testing Results
- ✅ TypeScript compilation: No errors
- ✅ ESLint: No warnings or errors
- ✅ Build: Successful production build

## Performance Considerations
- Added indexes for common queries (starred, recent, uncategorized)
- Limited results to 100 items to prevent huge responses
- Ordered by `updatedAt DESC` for relevance

## Next Steps
- Run the SQL migration script on the database
- Update the frontend to use the new chat endpoints
- Implement drag & drop functionality in Phase 2
- Add real-time updates for starred/recent changes

## Files Changed
- Modified: `lib/db/schema.ts` - Added chat columns
- Created: `app/api/chats/route.ts` - Chat list/create endpoints
- Created: `app/api/chats/[chatId]/route.ts` - Individual chat operations
- Modified: `app/api/notes/[noteId]/route.ts` - Enhanced with validation
- Created: `scripts/add-chat-columns.sql` - Database migration

## Important Notes
- The database needs the migration script run before chats will work properly
- The organization store already has placeholder logic for chats
- All filtering logic is consistent between notes and chats 