/**
 * Chat API Routes
 * Purpose: Handle chat listing and creation with smart filtering
 * Features:
 * - List chats with filters (all, recent, starred, uncategorized)
 * - Create new chats with optional collection assignment
 * - Support for smart collection filtering
 * 
 * Created: 2024-12-19
 * Updated: 2024-12-20 - Added smart collection filtering
 */

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { chats } from '@/lib/db/schema'
import { and, eq, desc, asc, gte, SQL, isNull, ilike, or } from 'drizzle-orm'
import { z } from 'zod'
import { generateId } from '@/lib/utils/id-generator'

const getChatsSchema = z.object({
  // Regular collection filter
  collectionId: z.string().optional(),
  
  // Smart collection filters
  type: z.enum(['note', 'chat', 'all']).optional(),
  since: z.string().datetime().optional(), // ISO datetime for timeRange
  starred: z.enum(['true', 'false']).optional(),
  orderBy: z.enum(['updatedAt', 'createdAt', 'title']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  spaceId: z.string().optional(),
  
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
  
  const validation = getChatsSchema.safeParse(params)
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
    const conditions: SQL[] = [eq(chats.userId, user.id)];

    // Apply search filter
    if (search) {
      conditions.push(
        or(
          ilike(chats.title, `%${search}%`),
          // Note: searching in JSONB content requires special handling
          // For now, we'll just search in titles
        )!
      );
    }

    // Smart collection filters
    if (type && type !== 'all') {
      // For chats API, only return chats when type is specified as 'chat'
      // Return nothing if type is 'note'
      if (type === 'note') {
        return NextResponse.json([])
      }
      // type === 'chat' doesn't need additional filtering
    }

    if (since) {
      conditions.push(gte(chats.updatedAt, new Date(since)));
    }

    if (starred !== undefined) {
      conditions.push(eq(chats.isStarred, starred === 'true'));
    }

    if (spaceId) {
      conditions.push(eq(chats.spaceId, spaceId));
    }

    // Legacy filters (for backward compatibility)
    if (filter) {
      switch (filter) {
        case 'all_starred':
          conditions.push(eq(chats.isStarred, true));
          break;
        case 'all_recent':
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          conditions.push(gte(chats.updatedAt, sevenDaysAgo));
          break;
        case 'uncategorized':
          conditions.push(isNull(chats.collectionId));
          break;
        // 'all' requires no additional conditions
      }
    } else if (collectionId) {
      // Filter by specific collection
      conditions.push(eq(chats.collectionId, collectionId));
    }
    
    // Build order by clause
    let orderByClause;
    switch (orderBy) {
      case 'createdAt':
        orderByClause = order === 'asc' ? asc(chats.createdAt) : desc(chats.createdAt);
        break;
      case 'title':
        orderByClause = order === 'asc' ? asc(chats.title) : desc(chats.title);
        break;
      case 'updatedAt':
      default:
        orderByClause = order === 'asc' ? asc(chats.updatedAt) : desc(chats.updatedAt);
        break;
    }
    
    const results = await db
      .select()
      .from(chats)
      .where(and(...conditions))
      .orderBy(orderByClause);
      
    return NextResponse.json(results)
  } catch (error) {
    console.error('Failed to fetch chats:', error)
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 })
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
      id: string
      userId: string
      spaceId: string | null
      collectionId: string | null
      title: string
    } = {
      id: id && !id.startsWith('chat_') ? id : generateId('chat'),
      userId: user.id,
      spaceId: spaceId || null,
      collectionId: collectionId || null,
      title: title || 'Untitled Chat',
    }

    const [newChat] = await db
      .insert(chats)
      .values(values)
      .returning()

    return NextResponse.json(newChat, { status: 201 })
  } catch (error) {
    console.error('Failed to create chat:', error)
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 })
  }
} 