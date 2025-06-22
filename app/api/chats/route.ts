/**
 * Chat API Routes
 * Purpose: Handle chat listing and creation with smart filtering
 * Features:
 * - List chats with filters (all, recent, starred, uncategorized)
 * - Create new chats with optional collection assignment
 * - Support for permanent collection filtering
 * 
 * Created: 2024-12-19
 */

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { chats } from '@/lib/db/schema'
import { and, eq, desc, gte, SQL, isNull, ilike, or } from 'drizzle-orm'
import { z } from 'zod'

const getChatsSchema = z.object({
  collectionId: z.string().uuid().optional(),
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
  
  const { collectionId, filter, search } = validation.data

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

    // Apply filters
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
    
    const results = await db
      .select()
      .from(chats)
      .where(and(...conditions))
      .orderBy(desc(chats.updatedAt));
      
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
    const { title, collectionId, id } = await request.json()

    const values: {
      userId: string
      collectionId: string | null
      title: string
      id?: string
    } = {
      userId: user.id,
      collectionId: collectionId || null,
      title: title || 'Untitled Chat',
    }
    
    // Allow specifying an ID for temporary chats
    if (id) {
      values.id = id
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