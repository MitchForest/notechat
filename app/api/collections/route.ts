import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { collections, spaces } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

const createCollectionSchema = z.object({
  name: z.string().min(1).max(50),
  spaceId: z.string().uuid(),
})

export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { searchParams } = new URL(request.url)
  const spaceId = searchParams.get('spaceId')

  if (!spaceId) {
    return NextResponse.json({ error: 'spaceId is required' }, { status: 400 })
  }

  try {
    const spaceCollections = await db.query.collections.findMany({
      where: and(
        eq(collections.userId, user.id),
        eq(collections.spaceId, spaceId)
      ),
    })
    return NextResponse.json(spaceCollections)
  } catch (error) {
    console.error('Failed to fetch collections:', error)
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validation = createCollectionSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors }, { status: 400 })
    }
    
    const { name, spaceId } = validation.data

    // Verify the space exists and belongs to the user
    const space = await db.query.spaces.findFirst({
      where: and(
        eq(spaces.id, spaceId),
        eq(spaces.userId, user.id)
      ),
    })

    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 })
    }

    // Create the collection
    const [newCollection] = await db
      .insert(collections)
      .values({
        userId: user.id,
        spaceId,
        name,
        type: 'user',
      })
      .returning()

    return NextResponse.json(newCollection, { status: 201 })
  } catch (error) {
    console.error('Failed to create collection:', error)
    return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 })
  }
} 