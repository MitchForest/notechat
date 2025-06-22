/**
 * User Account Seeding
 * Purpose: Automatically create default spaces and smart collections for new users
 * Features:
 * - Seeds Inbox (system), Personal, and Work spaces on first access
 * - Creates default smart collections (Recent, Saved, All) in each space
 * 
 * Created: 2024-12-19
 * Updated: 2024-12-20 - Refactored to use smart collections
 */

import { db } from '@/lib/db'
import { spaces, smartCollections } from '@/lib/db/schema'
import { DEFAULT_SMART_COLLECTIONS } from '@/features/organization/lib/collection-icons'

/**
 * Seeds a new user account with default spaces and smart collections
 * @param userId - The ID of the user to seed
 * @returns Promise that resolves when seeding is complete
 */
export async function seedUserAccount(userId: string) {
  try {
    // Use a transaction to ensure atomicity
    await db.transaction(async (tx) => {
      // Create Inbox (system space)
      const [inbox] = await tx
        .insert(spaces)
        .values({
          userId,
          name: 'Inbox',
          emoji: '📥',
          type: 'system'
        })
        .returning()
      
      // Create smart collections for Inbox
      const inboxCollections = DEFAULT_SMART_COLLECTIONS.map(col => ({
        userId,
        spaceId: inbox.id,
        name: col.name,
        icon: col.icon,
        filterConfig: col.filterConfig,
        isProtected: col.isProtected
      }))
      
      await tx.insert(smartCollections).values(inboxCollections)
      
      // Create Personal space
      const [personal] = await tx
        .insert(spaces)
        .values({
          userId,
          name: 'Personal',
          emoji: '🏠',
          type: 'seeded'
        })
        .returning()
      
      // Create smart collections for Personal
      const personalCollections = DEFAULT_SMART_COLLECTIONS.map(col => ({
        userId,
        spaceId: personal.id,
        name: col.name,
        icon: col.icon,
        filterConfig: col.filterConfig,
        isProtected: col.isProtected
      }))
      
      await tx.insert(smartCollections).values(personalCollections)
      
      // Create Work space
      const [work] = await tx
        .insert(spaces)
        .values({
          userId,
          name: 'Work',
          emoji: '💼',
          type: 'seeded'
        })
        .returning()
      
      // Create smart collections for Work
      const workCollections = DEFAULT_SMART_COLLECTIONS.map(col => ({
        userId,
        spaceId: work.id,
        name: col.name,
        icon: col.icon,
        filterConfig: col.filterConfig,
        isProtected: col.isProtected
      }))
      
      await tx.insert(smartCollections).values(workCollections)
    })
    
    console.log(`Successfully seeded account for user ${userId}`)
  } catch (error) {
    console.error('Failed to seed user account:', error)
    // Don't throw - allow user to continue even if seeding fails
  }
} 