import { github, google } from '@/lib/auth/oauth'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'
import { generateState, generateCodeVerifier } from 'arctic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;

  if (provider !== 'github' && provider !== 'google') {
    return new Response('Invalid provider', { status: 400 })
  }

  const state = generateState()
  const cookieStore = await cookies()
  
  // Store state in cookie
  cookieStore.set(`${provider}_oauth_state`, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  })

  let url: URL

  if (provider === 'github') {
    url = await github.createAuthorizationURL(state, ['user:email'])
  } else {
    const codeVerifier = generateCodeVerifier()
    
    // Store code verifier for Google PKCE
    cookieStore.set('google_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    })
    
    url = await google.createAuthorizationURL(state, codeVerifier, [
      'openid',
      'profile',
      'email'
    ])
    url.searchParams.set('access_type', 'offline') // Get refresh token
  }

  return redirect(url.toString())
} 