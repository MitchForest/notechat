import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { collections } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) {
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
        eq(collections.userId, session.user.id),
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
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, spaceId, type, smartRules } = await request.json()

    if (!name || !spaceId || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (type !== 'manual') {
        // For now, only allow creating manual collections
        return NextResponse.json({ error: 'Only manual collections can be created directly' }, { status: 400 })
    }

    const [newCollection] = await db
      .insert(collections)
      .values({
        userId: session.user.id,
        spaceId,
        name,
        type,
        smartRules,
      })
      .returning()

    return NextResponse.json(newCollection, { status: 201 })
  } catch (error) {
    console.error('Failed to create collection:', error)
    return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 })
  }
} 