/**
 * Edge-compatible Postgres client using Supavisor
 * Uses transaction mode pooler for serverless/edge environments
 */

import postgres from 'postgres'

// Get the transaction pooler URL from Supabase dashboard
// Format: postgres://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
const connectionString = process.env.DATABASE_POOLER_URL!

// Create client with Edge-compatible settings
export const sql = postgres(connectionString, {
  // Disable prepared statements for transaction mode
  prepare: false,
  // SSL is required for Supabase
  ssl: 'require',
  // Connection timeout
  connect_timeout: 10,
  // Idle timeout (for connection pooling)
  idle_timeout: 20,
  // Max lifetime for connections
  max_lifetime: 60 * 30,
})

// Example: Get chats using raw SQL
export async function getChatsSQL(userId: string) {
  return await sql`
    SELECT * FROM chats 
    WHERE "userId" = ${userId}
    ORDER BY "updatedAt" DESC
  `
}

// Example: Save message with raw SQL
export async function saveMessageSQL(chatId: string, message: any) {
  const [result] = await sql`
    INSERT INTO messages (chat_id, role, content)
    VALUES (${chatId}, ${message.role}, ${message.content})
    RETURNING *
  `
  return result
} 