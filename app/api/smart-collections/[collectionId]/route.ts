import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { smartCollections } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

interface UpdateData {
  name?: string
  icon?: string
  filterConfig?: Record<string, unknown>
  updatedAt?: Date
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ collectionId: string }> }
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { collectionId } = await context.params

  try {
    const { name, icon, filterConfig } = await request.json()
    
    // Check if collection exists and belongs to user
    const existingCollection = await db.query.smartCollections.findFirst({
      where: and(
        eq(smartCollections.id, collectionId),
        eq(smartCollections.userId, user.id)
      ),
    })
    
    if (!existingCollection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }
    
    // Don't allow editing protected collections' filters
    const updates: UpdateData = {}
    if (name !== undefined) updates.name = name
    if (icon !== undefined) updates.icon = icon
    if (filterConfig !== undefined && !existingCollection.isProtected) {
      updates.filterConfig = filterConfig
    }
    
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 })
    }
    
    const [updatedCollection] = await db
      .update(smartCollections)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(smartCollections.id, collectionId),
          eq(smartCollections.userId, user.id)
        )
      )
      .returning()

    return NextResponse.json(updatedCollection)
  } catch (error) {
    console.error('Failed to update smart collection:', error)
    return NextResponse.json({ error: 'Failed to update smart collection' }, { status: 500 })
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
    // Check if collection exists and is not protected
    const existingCollection = await db.query.smartCollections.findFirst({
      where: and(
        eq(smartCollections.id, collectionId),
        eq(smartCollections.userId, user.id)
      ),
    })
    
    if (!existingCollection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }
    
    if (existingCollection.isProtected) {
      return NextResponse.json({ error: 'Cannot delete protected collection' }, { status: 403 })
    }
    
    await db
      .delete(smartCollections)
      .where(
        and(
          eq(smartCollections.id, collectionId),
          eq(smartCollections.userId, user.id)
        )
      )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete smart collection:', error)
    return NextResponse.json({ error: 'Failed to delete smart collection' }, { status: 500 })
  }
} 