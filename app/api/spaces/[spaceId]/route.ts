import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { spaces } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(
  request: Request,
  context: { params: Promise<{ spaceId: string }> }
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { spaceId } = await context.params

  try {
    const space = await db.query.spaces.findFirst({
      where: and(
        eq(spaces.id, spaceId),
        eq(spaces.userId, user.id)
      ),
      with: {
        collections: true,
      },
    })

    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 })
    }

    return NextResponse.json(space)
  } catch (error) {
    console.error('Failed to fetch space:', error)
    return NextResponse.json({ error: 'Failed to fetch space' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ spaceId: string }> }
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { spaceId } = await context.params

  try {
    const data = await request.json()
    
    // Only allow updating name and emoji
    const updateData: Partial<typeof spaces.$inferInsert> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.emoji !== undefined) updateData.emoji = data.emoji

    const [updatedSpace] = await db
      .update(spaces)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(spaces.id, spaceId),
          eq(spaces.userId, user.id)
        )
      )
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
  context: { params: Promise<{ spaceId: string }> }
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { spaceId } = await context.params

  try {
    // Don't allow deleting permanent or seeded spaces
    const space = await db.query.spaces.findFirst({
      where: and(
        eq(spaces.id, spaceId),
        eq(spaces.userId, user.id)
      ),
    })

    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 })
    }

    if (space.type !== 'user') {
      return NextResponse.json({ error: 'Cannot delete system spaces' }, { status: 403 })
    }

    // Delete the space (collections will be cascade deleted)
    await db
      .delete(spaces)
      .where(
        and(
          eq(spaces.id, spaceId),
          eq(spaces.userId, user.id)
        )
      )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete space:', error)
    return NextResponse.json({ error: 'Failed to delete space' }, { status: 500 })
  }
} 