import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { notes, notesToCollections, collections } from '@/lib/db/schema'
import { and, eq, desc, inArray, gte, SQL } from 'drizzle-orm'
import { z } from 'zod'

const getNotesSchema = z.object({
  spaceId: z.string().uuid().optional(),
  collectionId: z.string().uuid().optional(),
  filter: z.enum(['all', 'all_starred', 'all_recent']).optional(),
}).refine(data => data.filter || (data.spaceId && data.collectionId), {
    message: "Either filter or both spaceId and collectionId must be provided"
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
  
  const { spaceId, collectionId, filter } = validation.data

  try {
    const conditions: (SQL)[] = [eq(notes.userId, user.id)];

    // Global filters
    if (filter) {
        if (filter === 'all_starred') {
            conditions.push(eq(notes.isStarred, true));
        } else if (filter === 'all_recent') {
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            conditions.push(gte(notes.updatedAt, sevenDaysAgo));
        }
    } else { // Space/Collection specific fetching
        conditions.push(eq(notes.spaceId, spaceId!));

        const collection = await db.query.collections.findFirst({
            where: and(eq(collections.id, collectionId!), eq(collections.userId, user.id))
        })

        if (!collection) {
            return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
        }
        
        if (collection.type === 'smart' && collection.name === 'Saved') {
            conditions.push(eq(notes.isStarred, true));
        } else if (collection.type === 'smart' && collection.name === 'Recent') {
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            conditions.push(gte(notes.updatedAt, sevenDaysAgo));
        } else if (collection.type === 'manual') {
            const noteIdsInCollection = await db.select({ noteId: notesToCollections.noteId }).from(notesToCollections).where(eq(notesToCollections.collectionId, collectionId!));
            if (noteIdsInCollection.length === 0) {
                return NextResponse.json([]);
            }
            const noteIds = noteIdsInCollection.map(n => n.noteId);
            conditions.push(inArray(notes.id, noteIds));
        }
    }
    
    const results = await db.select().from(notes).where(and(...conditions)).orderBy(desc(notes.updatedAt));
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
    const { title, spaceId, collectionId } = await request.json()

    if (!spaceId || !collectionId) {
      return NextResponse.json({ error: 'spaceId and collectionId are required' }, { status: 400 })
    }

    const [newNote] = await db
      .insert(notes)
      .values({
        userId: user.id,
        spaceId,
        title: title || 'Untitled Note',
      })
      .returning()

    // Add note to the specified manual collection
    await db.insert(notesToCollections).values({
        noteId: newNote.id,
        collectionId
    })

    return NextResponse.json(newNote, { status: 201 })
  } catch (error) {
    console.error('Failed to create note:', error)
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
  }
} 