# Technical Architecture

## System Overview

### High-Level Architecture
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│ Server Actions  │────▶│    Supabase     │
│  (Vercel Edge)  │     │  (API Routes)   │     │   PostgreSQL    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                        │                        │
         └────────────────────────┴────────────────────────┘
                          Better-Auth Layer
```

### Tech Stack Decisions

| Layer | Technology | Why This Choice |
|-------|-----------|-----------------|
| Runtime | Bun | Fast, native TypeScript, better DX |
| Framework | Next.js 15 | App Router, RSC, Server Actions |
| Styling | Tailwind CSS v4 | Native CSS variables, no config needed |
| Database | Supabase | Postgres + Auth + Realtime + Storage |
| ORM | Drizzle | Type-safe, performant, great DX |
| Auth | Better-Auth | Modern, flexible, works with Supabase |
| UI Components | shadcn/ui | Customizable, owns the code |
| Testing | Playwright + Bun | E2E + unit tests in one tool |

## Client/Server Architecture

### Rendering Strategy
```typescript
// Default: Server Components
async function Page() {
  const data = await db.select().from(table);
  return <ServerComponent data={data} />;
}

// Client only when needed
'use client';
function InteractiveComponent() {
  const [state, setState] = useState();
  // Interactivity required
}
```

### Data Flow
1. **Server Components**: Fetch data directly from DB
2. **Server Actions**: All mutations go through actions
3. **Client Components**: Receive props or use actions
4. **Real-time**: Supabase subscriptions for live data

### State Management
- **Server State**: Default for all data
- **Client State**: Only for UI state (modals, forms)
- **URL State**: Filters, pagination, tabs
- **Local Storage**: User preferences only

## Performance Architecture

### Targets
- LCP < 2.5s
- FID < 100ms  
- CLS < 0.1
- Bundle < 200KB initial

### Caching Strategy
| Data Type | Strategy | TTL |
|-----------|----------|-----|
| Static Pages | ISR | 1 hour |
| User Data | On-demand | No cache |
| Public Lists | CDN Cache | 5 min |
| API Responses | SWR | While revalidate |

### Optimization Techniques
1. Route-based code splitting
2. Dynamic imports for heavy components
3. Image optimization with next/image
4. Font optimization with next/font
5. Prefetching critical routes

## Security Architecture

### Authentication Flow
```
User Login → Better-Auth → Verify → Supabase → Session → JWT
                ↓
        Set HTTP-only cookie → Middleware validates → Allow access
```

### Authorization Levels
1. **Public**: No auth required
2. **Authenticated**: Valid session  
3. **Owner**: Owns the resource
4. **Team Member**: Belongs to team
5. **Admin**: System privileges

### Data Protection
- Input validation with Zod
- SQL injection prevention (Drizzle)
- XSS protection (React defaults)
- CSRF protection (Server Actions)
- Rate limiting (Vercel Edge)
- RLS policies in Supabase

## Infrastructure

### Environments
| Environment | URL | Branch | Purpose |
|------------|-----|--------|---------|
| Local | localhost:3000 | - | Development |
| Preview | [project]-[branch].vercel.app | feature/* | Testing |
| Staging | staging.[domain].com | dev | Pre-prod |
| Production | [domain].com | main | Live |

### CI/CD Pipeline
```yaml
on: [push]
  1. Install deps (Bun)
  2. Type check
  3. Lint
  4. Unit tests  
  5. Build
  6. E2E tests (Playwright)
  7. Deploy preview (Vercel)
  8. Merge → Deploy production
```

### Monitoring
- **Performance**: Vercel Analytics
- **Errors**: Sentry
- **Logs**: Vercel Functions
- **Uptime**: Better Stack
- **User Analytics**: Plausible

## Scalability Considerations

### Database
- Connection pooling via Supabase
- Read replicas for analytics
- Proper indexes on all foreign keys
- Materialized views for reports

### Application
- Edge functions for global performance
- Static generation where possible
- Incremental Static Regeneration
- API route caching

### Assets
- CDN for all static assets
- Image optimization pipeline
- Lazy loading below fold
- Preload critical resources

## Development Patterns

### Error Handling
```typescript
// Consistent error boundaries
export function ErrorBoundary({ error }: { error: Error }) {
  logError(error);
  return <ErrorUI error={error} />;
}

// Consistent result types
type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: string };
```

### Logging Strategy
- Server: Console + Sentry
- Client: Sentry only
- Development: Verbose
- Production: Errors only

### Feature Flags
```typescript
// Simple runtime flags
const features = {
  newDashboard: process.env.NODE_ENV === 'development',
  aiFeatures: false,
};
```

## External Integrations

### Required Services
| Service | Purpose | Critical? |
|---------|---------|-----------|
| Supabase | Database + Auth | Yes |
| Vercel | Hosting + Edge | Yes |
| Resend | Transactional email | Yes |
| Stripe | Payments | No (future) |

### API Rate Limits
- Supabase: 1000 req/hour
- OpenAI: 10000 tokens/min
- Resend: 100 emails/hour

## Disaster Recovery

### Backup Strategy
- Database: Daily Supabase backups
- Code: Git (GitHub)
- Environments: Infrastructure as Code
- Secrets: Vercel env vars

### Rollback Plan
1. Vercel instant rollback
2. Database migrations reversible
3. Feature flags for quick disable
4. Error monitoring alerts

---

*This document defines HOW we build. For WHAT we build, see the PRD.*