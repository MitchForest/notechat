import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { notes } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

export async function GET(
  request: Request,
  context: { params: Promise<{ noteId: string }> }
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { noteId } = await context.params
    const note = await db.query.notes.findFirst({
      where: and(eq(notes.id, noteId), eq(notes.userId, user.id)),
    })

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    return NextResponse.json(note)
  } catch (error) {
    console.error('Failed to fetch note:', error)
    return NextResponse.json({ error: 'Failed to fetch note' }, { status: 500 })
  }
}


export async function PUT(
  request: Request,
  context: { params: Promise<{ noteId: string }> }
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { title, content, isStarred } = await request.json()
    const { noteId } = await context.params

    const [updatedNote] = await db
      .update(notes)
      .set({ 
        title, 
        content,
        isStarred,
        updatedAt: new Date() 
      })
      .where(and(eq(notes.id, noteId), eq(notes.userId, user.id)))
      .returning()

    if (!updatedNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    return NextResponse.json(updatedNote)
  } catch (error) {
    console.error('Failed to update note:', error)
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ noteId: string }> }
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { noteId } = await context.params

    const [deletedNote] = await db
      .delete(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, user.id)))
      .returning()

    if (!deletedNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Note deleted successfully' })
  } catch (error) {
    console.error('Failed to delete note:', error)
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 })
  }
} 