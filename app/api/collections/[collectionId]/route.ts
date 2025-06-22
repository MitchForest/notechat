import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { collections } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(
  request: Request,
  context: { params: Promise<{ collectionId: string }> }
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { collectionId } = await context.params

  try {
    const collection = await db.query.collections.findFirst({
      where: and(
        eq(collections.id, collectionId),
        eq(collections.userId, user.id)
      ),
    })

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    return NextResponse.json(collection)
  } catch (error) {
    console.error('Failed to fetch collection:', error)
    return NextResponse.json({ error: 'Failed to fetch collection' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ collectionId: string }> }
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { collectionId } = await context.params

  try {
    const data = await request.json()
    
    // Only allow updating name
    const updateData: Partial<typeof collections.$inferInsert> = {}
    if (data.name !== undefined) updateData.name = data.name

    const [updatedCollection] = await db
      .update(collections)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(collections.id, collectionId),
          eq(collections.userId, user.id)
        )
      )
      .returning()

    if (!updatedCollection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    return NextResponse.json(updatedCollection)
  } catch (error) {
    console.error('Failed to update collection:', error)
    return NextResponse.json({ error: 'Failed to update collection' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ collectionId: string }> }
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { collectionId } = await context.params

  try {
    // Don't allow deleting system collections
    const collection = await db.query.collections.findFirst({
      where: and(
        eq(collections.id, collectionId),
        eq(collections.userId, user.id)
      ),
    })

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    if (collection.type !== 'user') {
      return NextResponse.json({ error: 'Cannot delete system collections' }, { status: 403 })
    }

    // Delete the collection (items will have their collectionId set to null)
    await db
      .delete(collections)
      .where(
        and(
          eq(collections.id, collectionId),
          eq(collections.userId, user.id)
        )
      )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete collection:', error)
    return NextResponse.json({ error: 'Failed to delete collection' }, { status: 500 })
  }
} 