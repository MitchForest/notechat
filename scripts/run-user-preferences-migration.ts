import { db } from '../lib/db'
import { sql } from 'drizzle-orm'
import fs from 'fs'
import path from 'path'

async function runUserPreferencesMigration() {
  try {
    // First check if the table already exists
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_preferences'
      );
    `)
    
    const tableExists = (result as any)[0]?.exists
    
    if (tableExists) {
      console.log('✅ Table user_preferences already exists, skipping migration')
      process.exit(0)
    }
    
    const migrationPath = path.join(process.cwd(), 'drizzle/0005_busy_hellion.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Split by statement-breakpoint and execute each statement
    const statements = migrationSQL.split('--> statement-breakpoint')
    
    for (const statement of statements) {
      const trimmed = statement.trim()
      if (trimmed) {
        console.log('Executing:', trimmed.substring(0, 50) + '...')
        await db.execute(sql.raw(trimmed))
      }
    }
    
    console.log('✅ User preferences migration completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runUserPreferencesMigration() 