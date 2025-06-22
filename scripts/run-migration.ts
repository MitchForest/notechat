import { db } from '../lib/db'
import { sql } from 'drizzle-orm'
import fs from 'fs'
import path from 'path'

async function runMigration() {
  try {
    const migrationPath = path.join(process.cwd(), 'drizzle/0004_aromatic_colossus.sql')
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
    
    console.log('✅ Migration completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration() 