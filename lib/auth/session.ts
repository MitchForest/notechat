import { db } from '@/lib/db'
import { sessions, users } from '@/lib/db/schema'
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

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
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
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!sessionToken) return null

  const result = await validateSession(sessionToken)
  return result?.user ?? null
})

export async function deleteSession() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!sessionToken) return

  await db.delete(sessions).where(eq(sessions.token, sessionToken))
  cookieStore.delete(SESSION_COOKIE_NAME)
} 