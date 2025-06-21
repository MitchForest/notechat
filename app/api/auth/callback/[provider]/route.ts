import { github, google } from '@/lib/auth/oauth'
import { findOrCreateUser } from '@/lib/auth/utils'
import { createSession } from '@/lib/auth/session'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import * as arctic from 'arctic'

interface GitHubUser {
  id: number;
  login: string;
  name: string;
  avatar_url: string;
}

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: 'public' | 'private' | null;
}

interface IdTokenClaims {
  sub: string;
  name: string;
  email: string;
  picture: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }  // ← Promise type
) {
  // Await the params
  const { provider } = await params  // ← Added await
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')

  if (!code || !state) {
    return new Response('Invalid request', { status: 400 })
  }

  // Await cookies
  const cookieStore = await cookies()  // ← Added await
  const storedState = cookieStore.get(`${provider}_oauth_state`)?.value

  if (!storedState || state !== storedState) {
    return new Response('Invalid state', { status: 400 })
  }

  try {
    let userInfo: {
        id: string,
        email: string,
        name?: string,
        avatarUrl?: string
    };
    let tokenData: {
        accessToken: string,
        refreshToken?: string | null,
        accessTokenExpiresAt?: Date | null
    };

    if (provider === 'github') {
      const tokens = await github.validateAuthorizationCode(code)
      const accessToken = tokens.accessToken()

      // Get user info from GitHub
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      const githubUser: GitHubUser = await userResponse.json()

      // Get primary email
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      const emails: GitHubEmail[] = await emailsResponse.json()
      const primaryEmail =
        emails.find((e) => e.primary)?.email || githubUser.name

      userInfo = {
        id: githubUser.id.toString(),
        email: primaryEmail,
        name: githubUser.name,
        avatarUrl: githubUser.avatar_url,
      }

      tokenData = {
        accessToken,
        refreshToken: tokens.hasRefreshToken() ? tokens.refreshToken() : null,
        accessTokenExpiresAt: tokens.hasRefreshToken()
          ? tokens.accessTokenExpiresAt()
          : null,
      }
    } else if (provider === 'google') {
      const codeVerifier = cookieStore.get('google_code_verifier')?.value  // ← Using cookieStore

      if (!codeVerifier) {
        return new Response('Missing code verifier', { status: 400 })
      }

      const tokens = await google.validateAuthorizationCode(code, codeVerifier)
      const idToken = tokens.idToken()

      if (!idToken) {
        return new Response('Missing id token', { status: 400 })
      }

      // Decode ID token to get user info
      const claims = arctic.decodeIdToken(idToken) as IdTokenClaims

      userInfo = {
        id: claims.sub,
        email: claims.email,
        name: claims.name,
        avatarUrl: claims.picture,
      }

      tokenData = {
        accessToken: tokens.accessToken(),
        refreshToken: tokens.hasRefreshToken() ? tokens.refreshToken() : null,
        accessTokenExpiresAt: tokens.accessTokenExpiresAt(),
      }

      // Clean up code verifier
      cookieStore.delete('google_code_verifier')  // ← Using cookieStore
    } else {
      return new Response('Invalid provider', { status: 400 })
    }

    // Find or create user
    const user = await findOrCreateUser(
      provider as 'github' | 'google',
      userInfo,
      tokenData
    )

    // Create session
    const userAgent = request.headers.get('user-agent') || undefined
    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      undefined

    await createSession(user.id, userAgent, ipAddress)

    // Clean up oauth state
    cookieStore.delete(`${provider}_oauth_state`)  // ← Using cookieStore

    redirect('/')
  } catch (error) {
    console.error('OAuth callback error:', error)
    redirect('/error')
  }
}