import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { collections } from '@/lib/db/schema'
import { and, eq, ne } from 'drizzle-orm'

export async function PUT(
  request: Request,
  context: { params: Promise<{ collectionId:string }> }
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name } = await request.json()
    const { collectionId } = await context.params

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const [updatedCollection] = await db
      .update(collections)
      .set({ name, updatedAt: new Date() })
      .where(and(
        eq(collections.id, collectionId), 
        eq(collections.userId, user.id),
        ne(collections.type, 'default') // Prevent renaming default collections
      ))
      .returning()

    if (!updatedCollection) {
      return NextResponse.json({ error: 'Collection not found or cannot be updated' }, { status: 404 })
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

  try {
    const { collectionId } = await context.params

    const [deletedCollection] = await db
      .delete(collections)
      .where(and(
        eq(collections.id, collectionId), 
        eq(collections.userId, user.id),
        ne(collections.type, 'default') // Prevent deleting default collections
      ))
      .returning()

    if (!deletedCollection) {
      return NextResponse.json({ error: 'Collection not found or cannot be deleted' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Collection deleted successfully' })
  } catch (error) {
    console.error('Failed to delete collection:', error)
    return NextResponse.json({ error: 'Failed to delete collection' }, { status: 500 })
  }
} 