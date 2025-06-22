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

/**
 * Permanent spaces structure (not stored in database)
 * These are virtual spaces that always exist for all users
 */
export const PERMANENT_SPACES = [
  {
    id: 'permanent-notes',
    name: 'Notes',
    emoji: '📝',
    type: 'static' as const,
    userId: null as string | null,
    createdAt: null as Date | null,
    updatedAt: null as Date | null,
    collections: [
      { 
        id: 'notes-all', 
        name: 'All', 
        type: 'static' as const,
        userId: null as string | null,
        spaceId: 'permanent-notes',
        createdAt: null as Date | null,
        updatedAt: null as Date | null
      },
      { 
        id: 'notes-recent', 
        name: 'Recent', 
        type: 'static' as const,
        userId: null as string | null,
        spaceId: 'permanent-notes',
        createdAt: null as Date | null,
        updatedAt: null as Date | null
      },
      { 
        id: 'notes-saved', 
        name: 'Saved', 
        type: 'static' as const,
        userId: null as string | null,
        spaceId: 'permanent-notes',
        createdAt: null as Date | null,
        updatedAt: null as Date | null
      },
      { 
        id: 'notes-uncategorized', 
        name: 'Uncategorized', 
        type: 'static' as const,
        userId: null as string | null,
        spaceId: 'permanent-notes',
        createdAt: null as Date | null,
        updatedAt: null as Date | null
      }
    ]
  },
  {
    id: 'permanent-chats',
    name: 'Chats',
    emoji: '💬',
    type: 'static' as const,
    userId: null as string | null,
    createdAt: null as Date | null,
    updatedAt: null as Date | null,
    collections: [
      { 
        id: 'chats-all', 
        name: 'All', 
        type: 'static' as const,
        userId: null as string | null,
        spaceId: 'permanent-chats',
        createdAt: null as Date | null,
        updatedAt: null as Date | null
      },
      { 
        id: 'chats-recent', 
        name: 'Recent', 
        type: 'static' as const,
        userId: null as string | null,
        spaceId: 'permanent-chats',
        createdAt: null as Date | null,
        updatedAt: null as Date | null
      },
      { 
        id: 'chats-saved', 
        name: 'Saved', 
        type: 'static' as const,
        userId: null as string | null,
        spaceId: 'permanent-chats',
        createdAt: null as Date | null,
        updatedAt: null as Date | null
      },
      { 
        id: 'chats-uncategorized', 
        name: 'Uncategorized', 
        type: 'static' as const,
        userId: null as string | null,
        spaceId: 'permanent-chats',
        createdAt: null as Date | null,
        updatedAt: null as Date | null
      }
    ]
  }
]

/**
 * Get permanent spaces with the current user's ID filled in
 * @param userId - The current user's ID
 * @returns Permanent spaces with userId populated
 */
export function getPermanentSpacesForUser(userId: string) {
  return PERMANENT_SPACES.map(space => ({
    ...space,
    userId,
    collections: space.collections.map(collection => ({
      ...collection,
      userId
    }))
  }))
} 