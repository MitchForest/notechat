import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { chats } from '@/lib/db/schema'
import { and, eq, isNotNull } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth/session'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatId } = await request.json()
    
    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 })
    }

    // Recover the chat by setting deletedAt to null
    const [recoveredChat] = await db
      .update(chats)
      .set({ 
        deletedAt: null,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(chats.id, chatId),
          eq(chats.userId, user.id),
          isNotNull(chats.deletedAt)
        )
      )
      .returning()

    if (!recoveredChat) {
      return NextResponse.json({ error: 'Chat not found or already recovered' }, { status: 404 })
    }

    return NextResponse.json(recoveredChat)
  } catch (error) {
    console.error('Chat recovery error:', error)
    return NextResponse.json(
      { error: 'Failed to recover chat' },
      { status: 500 }
    )
  }
} 