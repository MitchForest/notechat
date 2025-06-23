/**
 * Individual Chat API Routes
 * Purpose: Handle operations on specific chats
 * Features:
 * - Get single chat details
 * - Update chat (title, starred status, collection)
 * - Delete chat
 * 
 * Created: 2024-12-19
 */

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { chats } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const updateChatSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.any().optional(),
  isStarred: z.boolean().optional(),
  collectionId: z.string().nullable().optional(),
  spaceId: z.string().nullable().optional(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { chatId } = await params

  try {
    const [chat] = await db
      .select()
      .from(chats)
      .where(and(eq(chats.id, chatId), eq(chats.userId, user.id)))
      .limit(1)

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    return NextResponse.json(chat)
  } catch (error) {
    console.error('Failed to fetch chat:', error)
    return NextResponse.json({ error: 'Failed to fetch chat' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { chatId } = await params

  try {
    const body = await request.json()
    const validation = updateChatSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors }, { status: 400 })
    }

    const [updatedChat] = await db
      .update(chats)
      .set({
        ...validation.data,
        updatedAt: new Date(),
      })
      .where(and(eq(chats.id, chatId), eq(chats.userId, user.id)))
      .returning()

    if (!updatedChat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    return NextResponse.json(updatedChat)
  } catch (error) {
    console.error('Failed to update chat:', error)
    return NextResponse.json({ error: 'Failed to update chat' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { chatId } = await params

  try {
    const [deletedChat] = await db
      .delete(chats)
      .where(and(eq(chats.id, chatId), eq(chats.userId, user.id)))
      .returning()

    if (!deletedChat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete chat:', error)
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 })
  }
} 