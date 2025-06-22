import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { notes } from '@/lib/db/schema'
import { and, eq, desc, gte, SQL, isNull } from 'drizzle-orm'
import { z } from 'zod'

const getNotesSchema = z.object({
  collectionId: z.string().uuid().optional(),
  filter: z.enum(['all', 'all_starred', 'all_recent', 'uncategorized']).optional(),
})

export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const params = Object.fromEntries(searchParams)
  
  const validation = getNotesSchema.safeParse(params)
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.errors }, { status: 400 })
  }
  
  const { collectionId, filter } = validation.data

  try {
    const conditions: SQL[] = [eq(notes.userId, user.id)];

    // Apply filters
    if (filter) {
      switch (filter) {
        case 'all_starred':
          conditions.push(eq(notes.isStarred, true));
          break;
        case 'all_recent':
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          conditions.push(gte(notes.updatedAt, sevenDaysAgo));
          break;
        case 'uncategorized':
          conditions.push(isNull(notes.collectionId));
          break;
        // 'all' requires no additional conditions
      }
    } else if (collectionId) {
      // Filter by specific collection
      conditions.push(eq(notes.collectionId, collectionId));
    }
    
    const results = await db
      .select()
      .from(notes)
      .where(and(...conditions))
      .orderBy(desc(notes.updatedAt));
      
    return NextResponse.json(results)
  } catch (error) {
    console.error('Failed to fetch notes:', error)
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { title, collectionId } = await request.json()

    const [newNote] = await db
      .insert(notes)
      .values({
        userId: user.id,
        collectionId: collectionId || null, // Can be null for uncategorized
        title: title || 'Untitled Note',
      })
      .returning()

    return NextResponse.json(newNote, { status: 201 })
  } catch (error) {
    console.error('Failed to create note:', error)
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
  }
} 