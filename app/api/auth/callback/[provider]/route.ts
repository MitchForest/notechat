import { github, google } from '@/lib/auth/oauth'
import { findOrCreateUser } from '@/lib/auth/utils'
import { createSession } from '@/lib/auth/session'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'
import { decodeIdToken } from 'arctic'

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const url = request.nextUrl;
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const cookieStore = await cookies()
  
  if (!code || !state) {
    return new Response('Invalid request', { status: 400 })
  }

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
      
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${tokens.accessToken()}`,
        },
      })
      const githubUser: GitHubUser = await userResponse.json()
      
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${tokens.accessToken()}`,
        },
      })
      const emails: GitHubEmail[] = await emailsResponse.json()
      const primaryEmail = emails.find((e) => e.primary)?.email
      
      if (!primaryEmail) {
        return new Response('No primary email found for GitHub user', { status: 400 })
      }

      userInfo = {
        id: githubUser.id.toString(),
        email: primaryEmail,
        name: githubUser.name,
        avatarUrl: githubUser.avatar_url,
      }
      
      tokenData = {
        accessToken: tokens.accessToken(),
      }
    } else if (provider === 'google') {
      const codeVerifier = cookieStore.get('google_code_verifier')?.value
      
      if (!codeVerifier) {
        return new Response('Missing code verifier', { status: 400 })
      }
      
      const tokens = await google.validateAuthorizationCode(code, codeVerifier)
      const idToken = tokens.idToken()

      if (!idToken) {
        return new Response('Missing ID token', { status: 400 })
      }
      
      const claims = decodeIdToken(idToken) as {
        sub: string;
        name: string;
        email: string;
        picture: string;
      }
      
      userInfo = {
        id: claims.sub,
        email: claims.email,
        name: claims.name,
        avatarUrl: claims.picture,
      }
      
      tokenData = {
        accessToken: tokens.accessToken(),
        refreshToken: tokens.refreshToken(),
        accessTokenExpiresAt: tokens.accessTokenExpiresAt(),
      }
      
      cookieStore.delete('google_code_verifier')
    } else {
      return new Response('Invalid provider', { status: 400 })
    }

    const user = await findOrCreateUser(provider as 'github' | 'google', userInfo, tokenData)
    
    const userAgent = request.headers.get('user-agent') || undefined
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     undefined
    
    await createSession(user.id, userAgent, ipAddress)
    
    cookieStore.delete(`${provider}_oauth_state`)
    
    return redirect('/canvas')
  } catch (error) {
    console.error('OAuth callback error:', error)
    return redirect('/auth/error')
  }
} 