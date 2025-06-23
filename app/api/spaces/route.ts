import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { spaces, smartCollections } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { seedUserAccount } from '@/lib/db/seed-user'
import { DEFAULT_SMART_COLLECTIONS } from '@/features/organization/lib/collection-icons'
import { generateId } from '@/lib/utils/id-generator'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch user's spaces from database with smart collections
    const userSpaces = await db.query.spaces.findMany({
      where: eq(spaces.userId, user.id),
      with: {
        collections: true,
      },
      orderBy: (spaces, { asc, desc }) => [
        // Inbox (system) first, then others by creation date
        desc(spaces.type),
        asc(spaces.createdAt)
      ],
    })
    
    // Also fetch smart collections for each space
    const spacesWithSmartCollections = await Promise.all(
      userSpaces.map(async (space) => {
        const spaceSmartCollections = await db.query.smartCollections.findMany({
          where: eq(smartCollections.spaceId, space.id),
          orderBy: (smartCollections, { desc, asc }) => [
            // Protected collections first (All), then by name
            desc(smartCollections.isProtected),
            asc(smartCollections.name)
          ],
        })
        
        return {
          ...space,
          smartCollections: spaceSmartCollections
        }
      })
    )
    
    // Check if user needs seeding (no spaces exist)
    if (userSpaces.length === 0) {
      await seedUserAccount(user.id)
      
      // Fetch again after seeding
      const seededSpaces = await db.query.spaces.findMany({
        where: eq(spaces.userId, user.id),
        with: {
          collections: true,
        },
        orderBy: (spaces, { asc, desc }) => [
          desc(spaces.type),
          asc(spaces.createdAt)
        ],
      })
      
      // Fetch smart collections for seeded spaces
      const seededSpacesWithSmartCollections = await Promise.all(
        seededSpaces.map(async (space) => {
          const spaceSmartCollections = await db.query.smartCollections.findMany({
            where: eq(smartCollections.spaceId, space.id),
            orderBy: (smartCollections, { desc, asc }) => [
              desc(smartCollections.isProtected),
              asc(smartCollections.name)
            ],
          })
          
          return {
            ...space,
            smartCollections: spaceSmartCollections
          }
        })
      )
      
      return NextResponse.json(seededSpacesWithSmartCollections)
    }
    
    return NextResponse.json(spacesWithSmartCollections)
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
        id: generateId('space'),
        userId: user.id,
        name,
        emoji: emoji || '📁',
        type: 'user', // User-created spaces
      })
      .returning()
      
    // Create default smart collections for the new space
    const smartCollectionValues = DEFAULT_SMART_COLLECTIONS.map(col => ({
      id: generateId('smartCollection'),
      userId: user.id,
      spaceId: newSpace.id,
      name: col.name,
      icon: col.icon,
      filterConfig: col.filterConfig,
      isProtected: col.isProtected
    }))
    
    await db.insert(smartCollections).values(smartCollectionValues)

    const newSpaceWithCollections = await db.query.spaces.findFirst({
        where: eq(spaces.id, newSpace.id),
        with: {
            collections: true
        }
    })
    
    // Fetch smart collections
    const spaceSmartCollections = await db.query.smartCollections.findMany({
      where: eq(smartCollections.spaceId, newSpace.id),
      orderBy: (smartCollections, { desc, asc }) => [
        desc(smartCollections.isProtected),
        asc(smartCollections.name)
      ],
    })

    return NextResponse.json({
      ...newSpaceWithCollections,
      smartCollections: spaceSmartCollections
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create space:', error)
    return NextResponse.json({ error: 'Failed to create space' }, { status: 500 })
  }
} 