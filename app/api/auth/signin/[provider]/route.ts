import { github, google } from '@/lib/auth/oauth'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import * as arctic from 'arctic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }  // ← Add Promise
) {
  const { provider } = await params  // ← Add await

  if (provider !== 'github' && provider !== 'google') {
    return new Response('Invalid provider', { status: 400 })
  }

  const state = arctic.generateState()
  const cookieStore = await cookies()  // ← Add await

  // Store state in cookie
  cookieStore.set(`${provider}_oauth_state`, state, {  // ← Use cookieStore
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  })

  let url: URL

  if (provider === 'github') {
    const scopes = ['user:email']
    url = github.createAuthorizationURL(state, scopes)  // ← Remove await (not async)
  } else {
    const codeVerifier = arctic.generateCodeVerifier()

    // Store code verifier for Google PKCE
    cookieStore.set('google_code_verifier', codeVerifier, {  // ← Use cookieStore
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    })

    const scopes = ['openid', 'profile', 'email']
    url = google.createAuthorizationURL(state, codeVerifier, scopes)  // ← Remove await
    url.searchParams.set('access_type', 'offline') // Get refresh token
  }

  redirect(url.toString())
}