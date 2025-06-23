import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { userPreferences, type AIPreferences } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const preferences = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, user.id)
    })

    return NextResponse.json(preferences?.preferences || {})
  } catch (error) {
    console.error('[PREFERENCES GET]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const updates: AIPreferences = await req.json()

    // Validate the structure
    if (updates.customCommands && !Array.isArray(updates.customCommands)) {
      return new NextResponse('Invalid preferences format', { status: 400 })
    }

    await db
      .insert(userPreferences)
      .values({
        userId: user.id,
        preferences: updates
      })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          preferences: updates,
          updatedAt: new Date()
        }
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[PREFERENCES PUT]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 