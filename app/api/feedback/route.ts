import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { aiFeedback } from '@/lib/db/schema'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { operation, action, prompt, input, output, finalText, metadata } = body

    await db.insert(aiFeedback).values({
      userId: user.id,
      operation,
      action,
      prompt,
      input,
      output,
      finalText,
      metadata
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[FEEDBACK POST]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 