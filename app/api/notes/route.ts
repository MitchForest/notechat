import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { notes } from '@/lib/db/schema'
import { and, eq, desc, asc, gte, SQL, isNull, ilike, or } from 'drizzle-orm'
import { z } from 'zod'

const getNotesSchema = z.object({
  // Regular collection filter
  collectionId: z.string().uuid().optional(),
  
  // Smart collection filters
  type: z.enum(['note', 'chat', 'all']).optional(),
  since: z.string().datetime().optional(), // ISO datetime for timeRange
  starred: z.enum(['true', 'false']).optional(),
  orderBy: z.enum(['updatedAt', 'createdAt', 'title']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  spaceId: z.string().uuid().optional(),
  
  // Legacy filters (for backward compatibility)
  filter: z.enum(['all', 'all_starred', 'all_recent', 'uncategorized']).optional(),
  search: z.string().optional(),
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
  
  const { 
    collectionId, 
    type,
    since,
    starred,
    orderBy = 'updatedAt',
    order = 'desc',
    spaceId,
    filter, 
    search 
  } = validation.data

  try {
    const conditions: SQL[] = [eq(notes.userId, user.id)];

    // Apply search filter
    if (search) {
      conditions.push(
        or(
          ilike(notes.title, `%${search}%`),
          // Note: searching in JSONB content requires special handling
          // For now, we'll just search in titles
        )!
      );
    }

    // Smart collection filters
    if (type && type !== 'all') {
      // For notes API, only return notes when type is specified as 'note'
      // Return nothing if type is 'chat'
      if (type === 'chat') {
        return NextResponse.json([])
      }
      // type === 'note' doesn't need additional filtering
    }

    if (since) {
      conditions.push(gte(notes.updatedAt, new Date(since)));
    }

    if (starred !== undefined) {
      conditions.push(eq(notes.isStarred, starred === 'true'));
    }

    if (spaceId) {
      conditions.push(eq(notes.spaceId, spaceId));
    }

    // Legacy filters (for backward compatibility)
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
    
    // Build order by clause
    let orderByClause;
    switch (orderBy) {
      case 'createdAt':
        orderByClause = order === 'asc' ? asc(notes.createdAt) : desc(notes.createdAt);
        break;
      case 'title':
        orderByClause = order === 'asc' ? asc(notes.title) : desc(notes.title);
        break;
      case 'updatedAt':
      default:
        orderByClause = order === 'asc' ? asc(notes.updatedAt) : desc(notes.updatedAt);
        break;
    }
    
    const results = await db
      .select()
      .from(notes)
      .where(and(...conditions))
      .orderBy(orderByClause);
      
    return NextResponse.json(results)
  } catch (error) {
    console.error('Failed to fetch notes - Details:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      params: { collectionId, filter, search }
    })
    return NextResponse.json({ 
      error: 'Failed to fetch notes',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { title, collectionId, spaceId, id } = await request.json()

    const values: {
      userId: string
      spaceId: string | null
      collectionId: string | null
      title: string
      isStarred: boolean
      id?: string
    } = {
      userId: user.id,
      spaceId: spaceId || null,
      collectionId: collectionId || null,
      title: title || 'Untitled Note',
      isStarred: false, // Ensure default value
    }
    
    // Allow specifying an ID for temporary notes
    if (id) {
      values.id = id
    }

    const [newNote] = await db
      .insert(notes)
      .values(values)
      .returning()

    return NextResponse.json(newNote, { status: 201 })
  } catch (error) {
    console.error('Failed to create note:', error)
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
  }
} 