# Collections System Refactor Plan

## Overview
Complete refactoring of the collections system to separate regular collections (folders) from smart collections (filters). This will provide users with a more flexible and powerful organization system.

## Core Concepts

### 1. Space Types
- **System Spaces**: Inbox (cannot be deleted, but can rename/change icon)
- **Seeded Spaces**: Personal, Work (can be deleted/modified)
- **User Spaces**: Any space created by the user

### 2. Collection Types
- **Regular Collections**: Traditional folders where items belong via `collectionId`
- **Smart Collections**: Dynamic filters that show items matching criteria

### 3. Smart Collection Filters
```typescript
interface FilterConfig {
  // Item type filter
  type: 'all' | 'note' | 'chat';
  
  // Time-based filters
  timeRange?: {
    unit: 'days' | 'weeks' | 'months';
    value: number;
  };
  
  // Status filters
  isStarred?: boolean;
  
  // Sorting
  orderBy: 'updatedAt' | 'createdAt' | 'title';
  orderDirection: 'asc' | 'desc';
}
```

## Database Schema Changes

### 1. Update Entity Type Enum
```sql
-- Add 'system' type for spaces that cannot be deleted
ALTER TYPE entity_type ADD VALUE 'system';
```

### 2. Create Smart Collections Table
```sql
CREATE TABLE smart_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL, -- lucide icon name
  filter_config JSONB NOT NULL,
  is_protected BOOLEAN DEFAULT FALSE, -- for "All" collection
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### 3. Update Collections Table
```sql
-- Add icon field to regular collections
ALTER TABLE collections ADD COLUMN icon TEXT DEFAULT 'folder';
```

### 4. Remove Fake Collections
```sql
-- Delete all Recent, Saved, All collections from the collections table
DELETE FROM collections WHERE name IN ('Recent', 'Saved', 'All');
```

## Default Smart Collections

Each space will get these default smart collections:

```typescript
const DEFAULT_SMART_COLLECTIONS = [
  {
    name: 'All',
    icon: 'files',
    isProtected: true, // Cannot be deleted
    filterConfig: {
      type: 'all',
      orderBy: 'updatedAt',
      orderDirection: 'desc'
    }
  },
  {
    name: 'Recent',
    icon: 'clock',
    isProtected: false,
    filterConfig: {
      type: 'all',
      timeRange: { unit: 'days', value: 7 },
      orderBy: 'updatedAt',
      orderDirection: 'desc'
    }
  },
  {
    name: 'Saved',
    icon: 'star',
    isProtected: false,
    filterConfig: {
      type: 'all',
      isStarred: true,
      orderBy: 'updatedAt',
      orderDirection: 'desc'
    }
  }
];
```

## Lucide Icons for Collections

Standard icons users can choose from:

```typescript
const COLLECTION_ICONS = [
  'folder',        // Default for regular collections
  'files',         // Multiple items
  'file-text',     // Documents
  'message-square', // Chats
  'star',          // Favorites
  'clock',         // Recent
  'archive',       // Archived
  'briefcase',     // Work
  'home',          // Personal
  'book',          // Knowledge
  'lightbulb',     // Ideas
  'list',          // Tasks
  'calendar',      // Date-based
  'tag',           // Tagged items
  'search',        // Search results
  'filter',        // Filtered view
  'inbox',         // Inbox
  'send',          // Sent/Shared
  'users',         // Collaborative
  'lock'           // Private
];
```

## API Endpoints

### 1. Smart Collections CRUD
```typescript
// GET /api/smart-collections - List all smart collections
// POST /api/smart-collections - Create new smart collection
// PATCH /api/smart-collections/[id] - Update smart collection
// DELETE /api/smart-collections/[id] - Delete smart collection
```

### 2. Update Existing Endpoints
- `/api/notes` and `/api/chats` - Add smart collection filter support
- `/api/spaces` - Handle system spaces properly

## Frontend Components

### 1. CreateCollectionDialog
```tsx
interface CreateCollectionDialogProps {
  spaceId: string;
  onSuccess: (collection: Collection | SmartCollection) => void;
}

// UI Flow:
// 1. Select type: Regular or Smart Collection
// 2. Enter name
// 3. Select icon
// 4. If smart: Configure filters
// 5. Create
```

### 2. SmartCollectionFilterBuilder
```tsx
interface FilterBuilderProps {
  value: FilterConfig;
  onChange: (config: FilterConfig) => void;
}

// Simple UI with dropdowns for:
// - Type: All / Notes / Chats
// - Time: Any time / Last 7 days / Last 30 days / Last 3 months
// - Status: [ ] Starred only
// - Sort: Updated / Created / Title
```

### 3. IconPicker
```tsx
interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  icons?: string[]; // defaults to COLLECTION_ICONS
}
```

### 4. EditSmartCollectionDialog
- Edit name, icon, and filters
- Cannot edit protected collections' filters

## Store Architecture

### 1. Split Collection Stores
```typescript
// stores/collection-store.ts - Regular collections only
// stores/smart-collection-store.ts - Smart collections only
// stores/content-store.ts - Handles filtering based on smart collections
```

### 2. Content Fetching Logic
```typescript
// When a smart collection is selected:
async function fetchSmartCollectionContent(smartCollection: SmartCollection) {
  const { filterConfig } = smartCollection;
  
  // Build query parameters
  const params = new URLSearchParams();
  
  if (filterConfig.type !== 'all') {
    params.append('type', filterConfig.type);
  }
  
  if (filterConfig.timeRange) {
    const date = new Date();
    date.setDate(date.getDate() - filterConfig.timeRange.value);
    params.append('since', date.toISOString());
  }
  
  if (filterConfig.isStarred) {
    params.append('starred', 'true');
  }
  
  params.append('orderBy', filterConfig.orderBy);
  params.append('order', filterConfig.orderDirection);
  
  // Fetch both notes and chats if type is 'all'
  const results = await Promise.all([
    fetch(`/api/notes?${params}`),
    fetch(`/api/chats?${params}`)
  ]);
  
  // Combine and sort results
}
```

## Migration Steps

### Phase 1: Database Setup (30 min)
1. [ ] Wipe development database
2. [ ] Update schema.ts with new tables and fields
3. [ ] Create migration files
4. [ ] Run migrations

### Phase 2: Backend Implementation (2 hours)
1. [ ] Create smart collections API routes
2. [ ] Update notes/chats APIs to support filters
3. [ ] Update spaces API for system spaces
4. [ ] Update seed-user.ts to create Inbox and default smart collections

### Phase 3: Store Refactor (1 hour)
1. [ ] Create smart-collection-store.ts
2. [ ] Update collection-store.ts to remove filter logic
3. [ ] Update content-store.ts to handle smart collection filters
4. [ ] Update UI store for new collection types

### Phase 4: UI Components (2 hours)
1. [ ] Create IconPicker component
2. [ ] Create SmartCollectionFilterBuilder
3. [ ] Update CreateCollectionDialog
4. [ ] Create EditSmartCollectionDialog
5. [ ] Update context menus

### Phase 5: Integration (1 hour)
1. [ ] Update sidebar-nav.tsx
2. [ ] Test all CRUD operations
3. [ ] Test filtering logic
4. [ ] Fix any edge cases

## Success Criteria
1. ✅ Inbox appears as a regular space (first in list, cannot be deleted)
2. ✅ Users can create both regular and smart collections
3. ✅ Smart collections show filtered content correctly
4. ✅ Recent shows only items from last 7 days
5. ✅ All collections have Lucide icons
6. ✅ Smart collections can be edited/deleted (except protected ones)
7. ✅ Clean separation between folders and filters

## Future Enhancements
- Advanced filters (title/content search, tags)
- Filter combinations (AND/OR logic)
- Saved searches as smart collections
- Share smart collection configurations
- Export smart collection results 