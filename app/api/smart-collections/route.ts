import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { smartCollections } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get('spaceId')
    
    if (!spaceId) {
      return NextResponse.json({ error: 'Space ID is required' }, { status: 400 })
    }
    
    const collections = await db.query.smartCollections.findMany({
      where: and(
        eq(smartCollections.userId, user.id),
        eq(smartCollections.spaceId, spaceId)
      ),
      orderBy: (smartCollections, { desc, asc }) => [
        desc(smartCollections.isProtected),
        asc(smartCollections.name)
      ],
    })
    
    return NextResponse.json(collections)
  } catch (error) {
    console.error('Failed to fetch smart collections:', error)
    return NextResponse.json({ error: 'Failed to fetch smart collections' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { spaceId, name, icon, filterConfig } = await request.json()

    if (!spaceId || !name || !icon || !filterConfig) {
      return NextResponse.json({ 
        error: 'Space ID, name, icon, and filter config are required' 
      }, { status: 400 })
    }

    const [newCollection] = await db
      .insert(smartCollections)
      .values({
        userId: user.id,
        spaceId,
        name,
        icon,
        filterConfig,
        isProtected: false
      })
      .returning()

    return NextResponse.json(newCollection, { status: 201 })
  } catch (error) {
    console.error('Failed to create smart collection:', error)
    return NextResponse.json({ error: 'Failed to create smart collection' }, { status: 500 })
  }
} 