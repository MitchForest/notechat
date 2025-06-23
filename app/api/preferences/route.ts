import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { userPreferences, type AIPreferences } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'

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

    // Use raw SQL for upsert since Drizzle's onConflictDoUpdate might have issues with the index
    await db.execute(sql`
      INSERT INTO user_preferences (user_id, preferences, created_at, updated_at)
      VALUES (${user.id}, ${JSON.stringify(updates)}::jsonb, NOW(), NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        preferences = ${JSON.stringify(updates)}::jsonb,
        updated_at = NOW()
    `)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[PREFERENCES PUT]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 