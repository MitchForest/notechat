import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

async function resetDatabase() {
  console.log('🗑️  Dropping all tables...')
  
  try {
    // Drop all tables in the correct order to avoid foreign key constraints
    await db.execute(sql`DROP TABLE IF EXISTS ai_feedback CASCADE`)
    await db.execute(sql`DROP TABLE IF EXISTS user_preferences CASCADE`)
    await db.execute(sql`DROP TABLE IF EXISTS messages CASCADE`)
    await db.execute(sql`DROP TABLE IF EXISTS smart_collections CASCADE`)
    await db.execute(sql`DROP TABLE IF EXISTS chats CASCADE`)
    await db.execute(sql`DROP TABLE IF EXISTS notes CASCADE`)
    await db.execute(sql`DROP TABLE IF EXISTS collections CASCADE`)
    await db.execute(sql`DROP TABLE IF EXISTS spaces CASCADE`)
    await db.execute(sql`DROP TABLE IF EXISTS sessions CASCADE`)
    await db.execute(sql`DROP TABLE IF EXISTS accounts CASCADE`)
    await db.execute(sql`DROP TABLE IF EXISTS users CASCADE`)
    
    // Also drop the drizzle migration table
    await db.execute(sql`DROP TABLE IF EXISTS __drizzle_migrations CASCADE`)
    
    console.log('✅ All tables dropped successfully!')
    console.log('📝 Now run: bun drizzle-kit push')
  } catch (error) {
    console.error('❌ Error dropping tables:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

resetDatabase() 