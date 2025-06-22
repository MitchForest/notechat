import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { spaces, collections } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { seedUserAccount, getPermanentSpacesForUser } from '@/lib/db/seed-user'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch user's spaces from database
    const userSpaces = await db.query.spaces.findMany({
      where: eq(spaces.userId, user.id),
      with: {
        collections: true,
      },
      orderBy: (spaces, { asc }) => [asc(spaces.createdAt)],
    })
    
    // Check if user needs seeding (no spaces exist)
    if (userSpaces.length === 0) {
      await seedUserAccount(user.id)
      
      // Fetch again after seeding
      const seededSpaces = await db.query.spaces.findMany({
        where: eq(spaces.userId, user.id),
        with: {
          collections: true,
        },
        orderBy: (spaces, { asc }) => [asc(spaces.createdAt)],
      })
      
      // Combine permanent spaces with seeded spaces
      const permanentSpaces = getPermanentSpacesForUser(user.id)
      return NextResponse.json([...permanentSpaces, ...seededSpaces])
    }
    
    // Combine permanent spaces with existing user spaces
    const permanentSpaces = getPermanentSpacesForUser(user.id)
    return NextResponse.json([...permanentSpaces, ...userSpaces])
  } catch (error) {
    console.error('Failed to fetch spaces:', error)
    return NextResponse.json({ error: 'Failed to fetch spaces' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, emoji } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const [newSpace] = await db
      .insert(spaces)
      .values({
        userId: user.id,
        name,
        emoji: emoji || '📁',
        type: 'user', // User-created spaces
      })
      .returning()
      
    // Create default collections for the new space
    await db.insert(collections).values([
        {
            userId: user.id,
            spaceId: newSpace.id,
            name: 'All',
            type: 'user',
        },
        {
            userId: user.id,
            spaceId: newSpace.id,
            name: 'Recent',
            type: 'user',
        },
        {
            userId: user.id,
            spaceId: newSpace.id,
            name: 'Saved',
            type: 'user',
        }
    ])

    const newSpaceWithCollections = await db.query.spaces.findFirst({
        where: eq(spaces.id, newSpace.id),
        with: {
            collections: true
        }
    })

    return NextResponse.json(newSpaceWithCollections, { status: 201 })
  } catch (error) {
    console.error('Failed to create space:', error)
    return NextResponse.json({ error: 'Failed to create space' }, { status: 500 })
  }
} 