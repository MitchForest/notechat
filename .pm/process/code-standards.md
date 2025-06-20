# Code Standards & Conventions

This document defines all technical standards, file organization rules, and coding conventions for the project.

## File Organization & Structure

### Directory Layout
```
project-root/
├── app/                    # ⚠️ NO /src DIRECTORY
│   ├── (marketing)/       # Route groups for organization
│   ├── (dashboard)/
│   ├── api/               # All API routes (not /apis)
│   │   └── [resource]/    # RESTful structure
│   ├── globals.css        # Design tokens
│   └── layout.tsx
├── components/            # Shared UI components
│   ├── ui/               # shadcn/ui components
│   └── [shared]/         # Other shared components
├── features/             # Feature-driven modules
│   └── [feature-name]/
│       ├── actions/      # Server actions
│       ├── components/   # Feature-specific components
│       ├── hooks/        # Feature-specific hooks
│       ├── utils/        # Feature-specific utilities
│       ├── validations/  # Zod schemas
│       └── types.ts      # Feature types
├── lib/                  # Core utilities & configs
│   ├── utils.ts         # cn(), formatters, etc.
│   └── db.ts            # Database client
├── hooks/                # Shared hooks
├── types/                # Shared types
├── validations/          # Shared validation schemas
└── services/             # External service wrappers
```

### Where Code Goes

**Feature-specific → features/[feature]/**
```
features/todos/components/TodoItem.tsx
features/todos/actions/create-todo.ts
features/todos/validations/todo-schema.ts
features/todos/utils/format-todo.ts
```

**Shared across features → root folders**
```
components/ui/button.tsx          # Shared UI component
lib/format-date.ts               # Utility used everywhere
hooks/use-user.ts                # Shared hook
validations/common.ts            # Shared schemas
services/stripe.ts               # External service wrapper
```

**API routes → app/api/**
```
app/api/todos/route.ts           # /api/todos
app/api/todos/[id]/route.ts      # /api/todos/:id
```

## Naming Conventions

### Files & Folders
- **Components**: PascalCase (`UserProfile.tsx`)
- **All other files**: kebab-case (`user-profile.ts`)
- **Folders**: kebab-case (`user-profile/`)

### Code Naming
- **Components**: PascalCase (`UserProfile`)
- **Functions**: camelCase (`getUserProfile`)
- **Server Actions**: verb-noun (`createUser`, `updateProfile`)
- **Constants**: SCREAMING_SNAKE_CASE (`API_TIMEOUT`)
- **Types/Interfaces**: PascalCase (`UserProfile`, not `IUserProfile`)
- **Enums**: PascalCase with PascalCase values

### API Routes
- RESTful conventions (`/api/users`, not `/api/getUsers`)
- Plural for collections (`/users`, not `/user`)
- Nested resources (`/users/[id]/posts`)

## TypeScript/JavaScript Standards

### Type Safety
```typescript
// ❌ Bad
const processData = (data: any) => {
  return data.value * 2;
}

// ✅ Good
interface ProcessInput {
  value: number;
  metadata?: Record<string, unknown>;
}

const processData = (data: ProcessInput): number => {
  return data.value * 2;
}
```

### Function Guidelines
```typescript
// ❌ Bad - unclear, no types
function calc(x, y, z) {
  return x * 0.1 + y - z;
}

// ✅ Good - clear, typed, documented
/**
 * Calculates total price including tax and discount
 */
function calculateTotalPrice(
  subtotal: number,
  taxRate: number,
  discount: number = 0
): number {
  const withTax = subtotal * (1 + taxRate);
  return Math.max(0, withTax - discount);
}
```

### Variable Naming
```typescript
// ❌ Bad
const d = new Date();
const u = users.filter(x => x.a > 18);
const temp = calculateValue();

// ✅ Good
const currentDate = new Date();
const adultUsers = users.filter(user => user.age >= MINIMUM_AGE);
const calculatedDiscount = calculateValue();
```

## React/Next.js Patterns

### Component Structure
```tsx
/**
 * Component: ComponentName
 * Purpose: Clear, specific description of what this component does
 * Features:
 * - Feature or capability 1
 * - Feature or capability 2
 * 
 * Modified: [Date] - [What changed and why]
 */

// Imports grouped and ordered
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

import type { UserProfile } from '@/types/user';

// Types/interfaces for this component
interface ComponentProps {
  user: UserProfile;
  onUpdate?: (user: UserProfile) => void;
}

// Component definition
export function ComponentName({ user, onUpdate }: ComponentProps) {
  // Hooks first
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Event handlers
  const handleSubmit = async () => {
    // Implementation
  };
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### Server vs Client Components
```tsx
// Default to Server Components
// app/components/user-list.tsx
export async function UserList() {
  const users = await fetchUsers(); // Direct data fetching
  return <div>{/* render */}</div>;
}

// Use Client Components only when needed
// 'use client' directive at top
'use client';
import { useState } from 'react';

export function InteractiveForm() {
  const [value, setValue] = useState('');
  // Needs interactivity
}
```

### Server Actions Pattern
```typescript
// features/users/actions/update-user.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const UpdateUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

export async function updateUser(data: unknown) {
  // 1. Validate input
  const validated = UpdateUserSchema.parse(data);
  
  // 2. Check authorization
  const user = await getUser();
  if (!user || user.id !== validated.id) {
    throw new Error('Unauthorized');
  }
  
  // 3. Execute business logic
  const updated = await db.user.update({
    where: { id: validated.id },
    data: validated,
  });
  
  // 4. Revalidate cache
  revalidatePath('/users');
  
  // 5. Return typed result
  return { success: true, data: updated };
}
```

## API Design Standards

### RESTful Conventions
```typescript
// app/api/users/route.ts
export async function GET(request: Request) {
  // List users - returns array
  return Response.json(users);
}

export async function POST(request: Request) {
  // Create user - returns created resource
  const data = await request.json();
  const user = await createUser(data);
  return Response.json(user, { status: 201 });
}

// app/api/users/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Get single user
  const user = await getUser(params.id);
  if (!user) {
    return Response.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }
  return Response.json(user);
}
```

### Error Response Format
```typescript
// Consistent error structure
interface ErrorResponse {
  error: string;           // Human-readable message
  code?: string;          // Machine-readable code
  details?: unknown;      // Additional context
}

// Example usage
return Response.json(
  {
    error: 'Validation failed',
    code: 'VALIDATION_ERROR',
    details: { field: 'email', issue: 'Invalid format' }
  },
  { status: 400 }
);
```

### Status Codes
- `200` - OK (GET, PUT, PATCH)
- `201` - Created (POST)
- `204` - No Content (DELETE)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (not authorized)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

## CSS & Styling Rules

### Design Token Usage
```css
/* ❌ Never hardcode values */
.component {
  color: #3B82F6;
  padding: 8px 16px;
  border-radius: 6px;
}

/* ✅ Always use design tokens */
.component {
  color: var(--primary);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
}
```

### Tailwind Guidelines
```tsx
// ❌ Bad - arbitrary values when tokens exist
<div className="p-[13px] text-[#3B82F6] rounded-[7px]">

// ✅ Good - use Tailwind utilities
<div className="p-3 text-primary rounded-md">

// ✅ Good - CSS variables for custom values
<div className="p-[var(--space-custom)] text-[var(--brand-color)]">
```

### Component Styling Pattern
```tsx
// Use cn() for conditional classes
import { cn } from '@/lib/utils';

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  className,
  ...props 
}: ButtonProps) {
  return (
    <button
      className={cn(
        // Base styles
        'inline-flex items-center justify-center rounded-md font-medium',
        // Variant styles
        {
          'bg-primary text-white hover:bg-primary/90': variant === 'primary',
          'bg-secondary text-secondary-foreground': variant === 'secondary',
        },
        // Size styles
        {
          'px-3 py-1 text-sm': size === 'sm',
          'px-4 py-2': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',
        },
        // Custom classes
        className
      )}
      {...props}
    />
  );
}
```

## Database & Data Layer

### Schema Design
```typescript
// Use clear, consistent naming
export const users = pgTable('users', {
  // Always use 'id' for primary key
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Use snake_case for DB, camelCase in app
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  
  // Clear, descriptive column names
  emailAddress: text('email_address').notNull().unique(),
  isActive: boolean('is_active').default(true).notNull(),
});
```

### Query Patterns
```typescript
// ❌ Bad - N+1 queries
const posts = await db.select().from(postsTable);
for (const post of posts) {
  const author = await db.select().from(usersTable)
    .where(eq(usersTable.id, post.authorId));
}

// ✅ Good - Single query with join
const postsWithAuthors = await db
  .select({
    post: postsTable,
    author: usersTable,
  })
  .from(postsTable)
  .leftJoin(usersTable, eq(postsTable.authorId, usersTable.id));
```

## Testing Standards

### Test Structure
```typescript
describe('ComponentName', () => {
  // Group related tests
  describe('when user is authenticated', () => {
    it('should display user profile', () => {
      // Arrange
      const user = { id: '1', name: 'Test User' };
      
      // Act
      render(<Component user={user} />);
      
      // Assert
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });
  
  describe('when user clicks submit', () => {
    it('should call onSubmit with form data', async () => {
      // Test implementation
    });
  });
});
```

### Naming Convention
```typescript
// Test files: component.test.tsx or function.test.ts
// Test names: should describe behavior

// ❌ Bad
it('test 1', () => {});
it('works', () => {});

// ✅ Good
it('should return user data when ID exists', () => {});
it('should throw error when user is not authenticated', () => {});
```

## Performance Guidelines

### Image Optimization
```tsx
import Image from 'next/image';

// ✅ Always use Next.js Image component
<Image
  src="/hero.jpg"
  alt="Descriptive alt text"
  width={1200}
  height={600}
  priority // for above-fold images
/>
```

### Code Splitting
```tsx
// Dynamic imports for heavy components
const HeavyComponent = dynamic(
  () => import('@/components/heavy-component'),
  { 
    loading: () => <Skeleton />,
    ssr: false // if client-only
  }
);
```

### Data Fetching
```tsx
// Parallel data fetching
const [users, posts, comments] = await Promise.all([
  fetchUsers(),
  fetchPosts(),
  fetchComments(),
]);
```

## Security Guidelines

### Input Validation
- Always validate on the server
- Use Zod schemas for validation
- Never trust client input
- Sanitize user-generated content

### Authentication Checks
```typescript
// Always verify auth in server actions/API routes
export async function serverAction() {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  
  // Proceed with action
}
```

### Environment Variables
```typescript
// Type your env vars
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      NEXT_PUBLIC_APP_URL: string;
      // etc
    }
  }
}
```

---

Remember: These standards ensure consistency, maintainability, and quality across the entire codebase. When in doubt, prioritize clarity and simplicity.