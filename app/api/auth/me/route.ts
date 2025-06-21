import { getCurrentUser } from '@/lib/auth/session'
import { NextResponse } from 'next/server'

export async function GET() {
  const user = await getCurrentUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  
  return NextResponse.json({ user })
} 