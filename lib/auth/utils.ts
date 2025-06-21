import { db } from '@/lib/db'
import { users, accounts } from '@/lib/db/schema'
import type { User } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

interface OAuthUserInfo {
  id: string
  email: string
  name?: string
  avatarUrl?: string
}

interface TokenData {
  accessToken: string
  refreshToken?: string | null
  accessTokenExpiresAt?: Date | null
}

export async function findOrCreateUser(
  provider: 'github' | 'google',
  userInfo: OAuthUserInfo,
  tokenData: TokenData  // ← Use the interface
): Promise<User> {
  // Check if account exists
  const [existingAccount] = await db.query.accounts.findMany({
    where: and(
      eq(accounts.provider, provider),
      eq(accounts.providerAccountId, userInfo.id)
    ),
    with: {
      user: true,
    },
  })

  if (existingAccount) {
    // Update tokens
    await db
      .update(accounts)
      .set({
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        accessTokenExpiresAt: tokenData.accessTokenExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, existingAccount.id))

    return existingAccount.user
  }

  // Check if user exists with same email
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, userInfo.email),
  })

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