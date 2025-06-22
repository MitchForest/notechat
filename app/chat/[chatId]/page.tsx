/**
 * Page: Chat
 * Purpose: Display individual chat conversations
 * Features:
 * - Full chat interface
 * - Note context support
 * - Real-time updates
 * 
 * Created: December 2024
 */

import { ChatInterface } from '@/features/chat/components/chat-interface'

interface ChatPageProps {
  params: Promise<{
    chatId: string
  }>
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { chatId } = await params
  
  return (
    <div className="h-full">
      <ChatInterface chatId={chatId} />
    </div>
  )
} 