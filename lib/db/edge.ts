/**
 * Edge-compatible database client using Supabase
 * This uses the Data API which works perfectly in Edge Runtime
 */

import { createClient } from '@supabase/supabase-js'
// import type { Database } from './database.types' // You'll need to generate this

// Create a Supabase client for Edge Runtime
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for server-side
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)

// Helper function to get chats with proper typing
export async function getChats(userId: string) {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('userId', userId)
    .order('updatedAt', { ascending: false })

  if (error) throw error
  return data
}

// Helper function to save a message
export async function saveMessage(chatId: string, message: { role: string; content: string }) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      chatId,
      role: message.role,
      content: message.content,
    })
    .select()
    .single()

  if (error) throw error
  return data
} 