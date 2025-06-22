import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { chats } from '@/lib/db/schema'
import { and, lt, isNull, isNotNull, eq } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

// This endpoint should be called by a cron job
// It supports both Vercel cron (via CRON_SECRET env var) and manual triggers
export async function POST(request: Request) {
  try {
    // Check if this is a Vercel cron request
    const authHeader = request.headers.get('authorization')
    const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`
    
    // For manual triggers, check the secret in query params
    const { searchParams } = new URL(request.url)
    const cronSecret = searchParams.get('secret')
    const isManualTrigger = cronSecret === process.env.CRON_SECRET
    
    if (!isVercelCron && !isManualTrigger) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const thirtySevenDaysAgo = new Date(now.getTime() - 37 * 24 * 60 * 60 * 1000)

    // Step 1: Soft delete chats older than 30 days that aren't starred and haven't been deleted yet
    const softDeleted = await db
      .update(chats)
      .set({ 
        deletedAt: now,
        updatedAt: now 
      })
      .where(
        and(
          lt(chats.createdAt, thirtyDaysAgo),
          eq(chats.isStarred, false),
          isNull(chats.deletedAt)
        )
      )
      .returning({ id: chats.id })

    // Step 2: Hard delete chats that were soft deleted more than 7 days ago
    const hardDeleted = await db
      .delete(chats)
      .where(
        and(
          isNotNull(chats.deletedAt),
          lt(chats.deletedAt, thirtySevenDaysAgo)
        )
      )
      .returning({ id: chats.id })

    // Log the cleanup results
    console.log(`Cleanup completed: ${softDeleted.length} chats soft deleted, ${hardDeleted.length} chats hard deleted`)

    return NextResponse.json({
      success: true,
      softDeleted: softDeleted.length,
      hardDeleted: hardDeleted.length,
      timestamp: now.toISOString()
    })
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json(
      { error: 'Cleanup failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check cleanup status (for monitoring)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cronSecret = searchParams.get('secret')
    
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const thirtySevenDaysAgo = new Date(now.getTime() - 37 * 24 * 60 * 60 * 1000)

    // Count chats that will be soft deleted
    const [pendingSoftDelete] = await db
      .select({ count: sql<number>`count(*)` })
      .from(chats)
      .where(
        and(
          lt(chats.createdAt, thirtyDaysAgo),
          eq(chats.isStarred, false),
          isNull(chats.deletedAt)
        )
      )

    // Count chats that will be hard deleted
    const [pendingHardDelete] = await db
      .select({ count: sql<number>`count(*)` })
      .from(chats)
      .where(
        and(
          isNotNull(chats.deletedAt),
          lt(chats.deletedAt, thirtySevenDaysAgo)
        )
      )

    return NextResponse.json({
      pendingSoftDelete: pendingSoftDelete.count,
      pendingHardDelete: pendingHardDelete.count,
      nextRunRecommended: pendingSoftDelete.count > 0 || pendingHardDelete.count > 0
    })
  } catch (error) {
    console.error('Cleanup status error:', error)
    return NextResponse.json(
      { error: 'Failed to get cleanup status' },
      { status: 500 }
    )
  }
} 