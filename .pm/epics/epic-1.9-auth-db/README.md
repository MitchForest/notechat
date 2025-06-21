# Complete Authentication Setup Guide: Next.js + Arctic + Supabase + Drizzle

This guide will walk you through setting up OAuth authentication with Google and GitHub in your existing Next.js project using Arctic, Supabase, and Drizzle ORM with Bun.

## Prerequisites

- Existing Next.js project
- Bun installed
- Supabase project created
- OAuth apps created in Google Cloud Console and GitHub

## 1. Install Dependencies

```bash
bun add arctic drizzle-orm @supabase/supabase-js
bun add -D drizzle-kit @types/node
```

## 2. Environment Variables

Create or update your `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OAuth - GitHub
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# OAuth - Google
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Session Secret (generate a random string)
SESSION_SECRET=your_random_session_secret
```

## 3. Database Schema with Drizzle

Create `src/db/schema.ts`:

```typescript
import { pgTable, text, timestamp, uuid, jsonb, boolean } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  provider: text('provider').notNull(), // 'github' or 'google'
  providerAccountId: text('provider_account_id').notNull(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Type exports
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Account = typeof accounts.$inferSelect
export type NewAccount = typeof accounts.$inferInsert
export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
```

Create `src/db/index.ts`:

```typescript
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

const client = postgres(connectionString, { prepare: false })
export const db = drizzle(client, { schema })
```

Create `drizzle.config.ts`:

```typescript
import type { Config } from 'drizzle-kit'

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config
```

## 4. OAuth Configuration

Create `src/lib/auth/oauth.ts`:

```typescript
import * as arctic from 'arctic'

export const github = new arctic.GitHub(
  process.env.GITHUB_CLIENT_ID!,
  process.env.GITHUB_CLIENT_SECRET!,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/github`
)

export const google = new arctic.Google(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`
)
```

## 5. Session Management

Create `src/lib/auth/session.ts`:

```typescript
import { db } from '@/db'
import { sessions, users } from '@/db/schema'
import { eq, and, gt } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { cache } from 'react'
import crypto from 'crypto'

const SESSION_COOKIE_NAME = 'session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export async function createSession(userId: string, userAgent?: string, ipAddress?: string) {
  const token = generateSessionToken()
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000)

  await db.insert(sessions).values({
    userId,
    token,
    expiresAt,
    userAgent,
    ipAddress,
  })

  cookies().set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })

  return token
}

export async function validateSession(token: string) {
  const [session] = await db
    .select({
      session: sessions,
      user: users,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1)

  return session
}

export const getCurrentUser = cache(async () => {
  const sessionToken = cookies().get(SESSION_COOKIE_NAME)?.value
  if (!sessionToken) return null

  const result = await validateSession(sessionToken)
  return result?.user ?? null
})

export async function deleteSession() {
  const sessionToken = cookies().get(SESSION_COOKIE_NAME)?.value
  if (!sessionToken) return

  await db.delete(sessions).where(eq(sessions.token, sessionToken))
  cookies().delete(SESSION_COOKIE_NAME)
}
```

## 6. Authentication Utilities

Create `src/lib/auth/utils.ts`:

```typescript
import { db } from '@/db'
import { users, accounts, type NewUser, type NewAccount } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

interface OAuthUserInfo {
  id: string
  email: string
  name?: string
  avatarUrl?: string
}

export async function findOrCreateUser(
  provider: 'github' | 'google',
  userInfo: OAuthUserInfo,
  tokenData: {
    accessToken: string
    refreshToken?: string | null
    accessTokenExpiresAt?: Date | null
    refreshTokenExpiresAt?: Date | null
    scope?: string | null
  }
) {
  // Check if account exists
  const [existingAccount] = await db
    .select({
      user: users,
      account: accounts,
    })
    .from(accounts)
    .innerJoin(users, eq(accounts.userId, users.id))
    .where(
      and(
        eq(accounts.provider, provider),
        eq(accounts.providerAccountId, userInfo.id)
      )
    )
    .limit(1)

  if (existingAccount) {
    // Update tokens
    await db
      .update(accounts)
      .set({
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        accessTokenExpiresAt: tokenData.accessTokenExpiresAt,
        refreshTokenExpiresAt: tokenData.refreshTokenExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, existingAccount.account.id))

    return existingAccount.user
  }

  // Check if user exists with same email
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, userInfo.email))
    .limit(1)

  if (existingUser) {
    // Link new provider to existing user
    await db.insert(accounts).values({
      userId: existingUser.id,
      provider,
      providerAccountId: userInfo.id,
      ...tokenData,
    })

    return existingUser
  }

  // Create new user and account
  const [newUser] = await db
    .insert(users)
    .values({
      email: userInfo.email,
      name: userInfo.name,
      avatarUrl: userInfo.avatarUrl,
    })
    .returning()

  await db.insert(accounts).values({
    userId: newUser.id,
    provider,
    providerAccountId: userInfo.id,
    ...tokenData,
  })

  return newUser
}
```

## 7. API Routes

Create `src/app/api/auth/signin/[provider]/route.ts`:

```typescript
import { github, google } from '@/lib/auth/oauth'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import * as arctic from 'arctic'

export async function GET(
  request: Request,
  { params }: { params: { provider: string } }
) {
  const provider = params.provider

  if (provider !== 'github' && provider !== 'google') {
    return new Response('Invalid provider', { status: 400 })
  }

  const state = arctic.generateState()
  
  // Store state in cookie
  cookies().set(`${provider}_oauth_state`, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  })

  let url: URL

  if (provider === 'github') {
    const scopes = ['user:email']
    url = github.createAuthorizationURL(state, scopes)
  } else {
    const codeVerifier = arctic.generateCodeVerifier()
    
    // Store code verifier for Google PKCE
    cookies().set('google_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    })
    
    const scopes = ['openid', 'profile', 'email']
    url = google.createAuthorizationURL(state, codeVerifier, scopes)
    url.searchParams.set('access_type', 'offline') // Get refresh token
  }

  redirect(url.toString())
}
```

Create `src/app/api/auth/callback/[provider]/route.ts`:

```typescript
import { github, google } from '@/lib/auth/oauth'
import { findOrCreateUser } from '@/lib/auth/utils'
import { createSession } from '@/lib/auth/session'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import * as arctic from 'arctic'

export async function GET(
  request: Request,
  { params }: { params: { provider: string } }
) {
  const provider = params.provider
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  
  if (!code || !state) {
    return new Response('Invalid request', { status: 400 })
  }

  const storedState = cookies().get(`${provider}_oauth_state`)?.value
  
  if (!storedState || state !== storedState) {
    return new Response('Invalid state', { status: 400 })
  }

  try {
    let userInfo: any
    let tokenData: any

    if (provider === 'github') {
      const tokens = await github.validateAuthorizationCode(code)
      const accessToken = tokens.accessToken()
      
      // Get user info from GitHub
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      const githubUser = await userResponse.json()
      
      // Get primary email
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      const emails = await emailsResponse.json()
      const primaryEmail = emails.find((e: any) => e.primary)?.email || githubUser.email
      
      userInfo = {
        id: githubUser.id.toString(),
        email: primaryEmail,
        name: githubUser.name,
        avatarUrl: githubUser.avatar_url,
      }
      
      tokenData = {
        accessToken,
        refreshToken: tokens.hasRefreshToken() ? tokens.refreshToken() : null,
        accessTokenExpiresAt: tokens.hasRefreshToken() ? tokens.accessTokenExpiresAt() : null,
        scope: 'user:email',
      }
    } else if (provider === 'google') {
      const codeVerifier = cookies().get('google_code_verifier')?.value
      
      if (!codeVerifier) {
        return new Response('Missing code verifier', { status: 400 })
      }
      
      const tokens = await google.validateAuthorizationCode(code, codeVerifier)
      const accessToken = tokens.accessToken()
      const idToken = tokens.idToken()
      
      // Decode ID token to get user info
      const claims = arctic.decodeIdToken(idToken!)
      
      userInfo = {
        id: claims.sub,
        email: claims.email as string,
        name: claims.name as string,
        avatarUrl: claims.picture as string,
      }
      
      tokenData = {
        accessToken,
        refreshToken: tokens.hasRefreshToken() ? tokens.refreshToken() : null,
        accessTokenExpiresAt: tokens.accessTokenExpiresAt(),
        scope: 'openid profile email',
      }
      
      // Clean up code verifier
      cookies().delete('google_code_verifier')
    } else {
      return new Response('Invalid provider', { status: 400 })
    }

    // Find or create user
    const user = await findOrCreateUser(provider as 'github' | 'google', userInfo, tokenData)
    
    // Create session
    const userAgent = request.headers.get('user-agent') || undefined
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     undefined
    
    await createSession(user.id, userAgent, ipAddress)
    
    // Clean up oauth state
    cookies().delete(`${provider}_oauth_state`)
    
    redirect('/dashboard')
  } catch (error) {
    console.error('OAuth callback error:', error)
    redirect('/auth/error')
  }
}
```

Create `src/app/api/auth/signout/route.ts`:

```typescript
import { deleteSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'

export async function POST() {
  await deleteSession()
  redirect('/')
}
```

Create `src/app/api/auth/me/route.ts`:

```typescript
import { getCurrentUser } from '@/lib/auth/session'
import { NextResponse } from 'next/server'

export async function GET() {
  const user = await getCurrentUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  
  return NextResponse.json({ user })
}
```

## 8. Middleware

Create `src/middleware.ts`:

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Add paths that require authentication
const protectedPaths = ['/dashboard', '/profile', '/settings']

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')
  const pathname = request.nextUrl.pathname
  
  // Check if the path requires authentication
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
  
  if (isProtectedPath && !sessionCookie) {
    // Redirect to login page
    const url = new URL('/auth/signin', request.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }
  
  // Add security headers
  const response = NextResponse.next()
  
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  }
  
  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

## 9. UI Components

Create `src/app/auth/signin/page.tsx`:

```tsx
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'

export default async function SignInPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string }
}) {
  const user = await getCurrentUser()
  
  if (user) {
    redirect(searchParams.callbackUrl || '/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <div className="mt-8 space-y-4">
          <Link
            href="/api/auth/signin/github"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
            </svg>
            Continue with GitHub
          </Link>
          
          <Link
            href="/api/auth/signin/google"
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Link>
        </div>
      </div>
    </div>
  )
}
```

Create `src/app/auth/error/page.tsx`:

```tsx
import Link from 'next/link'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            There was an error signing you in. Please try again.
          </p>
        </div>
        <Link
          href="/auth/signin"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  )
}
```

Create `src/components/auth/UserMenu.tsx`:

```tsx
'use client'

import { User } from '@/db/schema'
import { useState } from 'react'

export default function UserMenu({ user }: { user: User }) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' })
    window.location.href = '/'
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <img
          className="h-8 w-8 rounded-full"
          src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}`}
          alt={user.name || user.email}
        />
        <span className="hidden md:block">{user.name || user.email}</span>
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5">
          <a
            href="/profile"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Your Profile
          </a>
          <a
            href="/settings"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Settings
          </a>
          <button
            onClick={handleSignOut}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
```

## 10. Usage Example

Create `src/app/dashboard/page.tsx`:

```tsx
import { getCurrentUser } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import UserMenu from '@/components/auth/UserMenu'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Dashboard</h1>
            </div>
            <div className="flex items-center">
              <UserMenu user={user} />
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-4">
            <h2 className="text-2xl font-bold mb-4">Welcome, {user.name || user.email}!</h2>
            <p>You're successfully logged in.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
```

## 11. Database Migration

Run the following commands to set up your database:

```bash
# Generate migration
bun run drizzle-kit generate:pg

# Push schema to database
bun run drizzle-kit push:pg
```

## 12. Additional Security Considerations

### CSRF Protection

Add CSRF token validation for state-changing operations:

```typescript
// src/lib/auth/csrf.ts
import crypto from 'crypto'
import { cookies } from 'next/headers'

const CSRF_TOKEN_NAME = 'csrf_token'

export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function getCSRFToken(): string {
  const token = cookies().get(CSRF_TOKEN_NAME)?.value
  if (token) return token
  
  const newToken = generateCSRFToken()
  cookies().set(CSRF_TOKEN_NAME, newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
  })
  
  return newToken
}

export function validateCSRFToken(token: string): boolean {
  const storedToken = cookies().get(CSRF_TOKEN_NAME)?.value
  return storedToken === token
}
```

### Rate Limiting

Implement rate limiting for authentication endpoints:

```typescript
// src/lib/auth/rate-limit.ts
const attempts = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(identifier: string, maxAttempts = 5, windowMs = 15 * 60 * 1000): boolean {
  const now = Date.now()
  const userAttempts = attempts.get(identifier)
  
  if (!userAttempts || userAttempts.resetAt < now) {
    attempts.set(identifier, { count: 1, resetAt: now + windowMs })
    return true
  }
  
  if (userAttempts.count >= maxAttempts) {
    return false
  }
  
  userAttempts.count++
  return true
}
```

## 13. Environment-Specific Configuration

### Production Considerations

1. **Database URL**: Use Supabase connection pooling URL for production
2. **Session Security**: Ensure secure cookies and HTTPS
3. **OAuth Redirect URIs**: Update to production URLs in OAuth providers
4. **Environment Variables**: Use proper secret management (Vercel, Railway, etc.)

### Development Setup

1. Use `localhost:3000` for OAuth redirect URIs
2. Set `secure: false` for cookies in development
3. Enable detailed error logging

## Conclusion

You now have a complete authentication system with:

- OAuth login with GitHub and Google
- Session management with secure cookies
- Database persistence with Drizzle ORM
- Middleware protection for routes
- User profile management
- Type safety throughout
- Security best practices

Remember to:
1. Update OAuth redirect URIs in your provider dashboards
2. Generate secure random strings for session secrets
3. Test the flow thoroughly before deploying
4. Monitor for any authentication errors in production
5. Implement additional features like account linking, email verification, and 2FA as needed