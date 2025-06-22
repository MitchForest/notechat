import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { messages } from '@/lib/db/schema'
import { eq, desc, and, lt } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth/session'

const MESSAGES_PER_PAGE = 50

// Simple UUID v4 validation
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatId } = await params
    
    // If chatId is not a valid UUID (temporary chat), return empty messages
    if (!isValidUUID(chatId)) {
      return NextResponse.json({
        messages: [],
        hasMore: false,
        nextCursor: null
      })
    }
    
    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get('cursor') // Message ID to start from
    const limit = parseInt(searchParams.get('limit') || String(MESSAGES_PER_PAGE))

    // Build query conditions
    const conditions = [eq(messages.chatId, chatId)]
    
    // If cursor provided, get messages before that message
    if (cursor) {
      const cursorMessage = await db
        .select({ createdAt: messages.createdAt })
        .from(messages)
        .where(eq(messages.id, cursor))
        .limit(1)
      
      if (cursorMessage[0]) {
        conditions.push(lt(messages.createdAt, cursorMessage[0].createdAt))
      }
    }

    // Fetch messages
    const messageList = await db
      .select()
      .from(messages)
      .where(and(...conditions))
      .orderBy(desc(messages.createdAt))
      .limit(limit)

    // Reverse to get chronological order
    messageList.reverse()

    // Check if there are more messages
    const hasMore = messageList.length === limit

    return NextResponse.json({
      messages: messageList,
      hasMore,
      nextCursor: hasMore ? messageList[0]?.id : null
    })
  } catch (error) {
    console.error('Failed to fetch messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatId } = await params
    
    // Don't save messages for temporary chats
    if (!isValidUUID(chatId)) {
      return NextResponse.json({
        id: `temp-${Date.now()}`,
        chatId: chatId,
        role: 'system',
        content: 'Message not persisted (temporary chat)',
        metadata: null,
        createdAt: new Date()
      })
    }
    
    const body = await request.json()
    const { message } = body

    if (!message || !message.role || !message.content) {
      return NextResponse.json(
        { error: 'Invalid message format' },
        { status: 400 }
      )
    }

    // Save message to database
    const [savedMessage] = await db
      .insert(messages)
      .values({
        chatId: chatId,
        role: message.role,
        content: message.content,
        metadata: message.metadata || null,
      })
      .returning()

    return NextResponse.json(savedMessage)
  } catch (error) {
    console.error('Failed to save message:', error)
    return NextResponse.json(
      { error: 'Failed to save message' },
      { status: 500 }
    )
  }
} 