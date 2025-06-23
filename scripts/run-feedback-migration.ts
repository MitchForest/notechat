import { db } from '../lib/db'
import { sql } from 'drizzle-orm'
import fs from 'fs'
import path from 'path'

async function runFeedbackMigration() {
  try {
    // Check if table exists
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ai_feedback'
      );
    `)
    
    const tableExists = (result as any)[0]?.exists
    
    if (tableExists) {
      console.log('✅ Table ai_feedback already exists')
      process.exit(0)
    }
    
    const migrationPath = path.join(process.cwd(), 'drizzle/0006_marvelous_iron_man.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    const statements = migrationSQL.split('--> statement-breakpoint')
    
    for (const statement of statements) {
      const trimmed = statement.trim()
      if (trimmed) {
        console.log('Executing:', trimmed.substring(0, 50) + '...')
        await db.execute(sql.raw(trimmed))
      }
    }
    
    console.log('✅ AI feedback migration completed!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runFeedbackMigration() 