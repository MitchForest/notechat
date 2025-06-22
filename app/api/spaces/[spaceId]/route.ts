import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { spaces } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

export async function PUT(
  request: Request,
  { params }: { params: { spaceId: string } }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, emoji } = await request.json()
    const spaceId = params.spaceId

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const [updatedSpace] = await db
      .update(spaces)
      .set({ name, emoji, updatedAt: new Date() })
      .where(and(eq(spaces.id, spaceId), eq(spaces.userId, session.user.id)))
      .returning()

    if (!updatedSpace) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 })
    }

    return NextResponse.json(updatedSpace)
  } catch (error) {
    console.error('Failed to update space:', error)
    return NextResponse.json({ error: 'Failed to update space' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { spaceId: string } }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const spaceId = params.spaceId

    const [deletedSpace] = await db
      .delete(spaces)
      .where(and(eq(spaces.id, spaceId), eq(spaces.userId, session.user.id)))
      .returning()

    if (!deletedSpace) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 })
    }
    
    // Note: related collections and notes are deleted via 'onDelete: cascade'

    return NextResponse.json({ message: 'Space deleted successfully' })
  } catch (error) {
    console.error('Failed to delete space:', error)
    return NextResponse.json({ error: 'Failed to delete space' }, { status: 500 })
  }
} 