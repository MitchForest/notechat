/**
 * User Account Seeding
 * Purpose: Automatically create default spaces and collections for new users
 * Features:
 * - Seeds Personal and Work spaces on first access
 * - Defines permanent Notes and Chats spaces
 * - Creates default collections (All, Recent, Saved) in each space
 * 
 * Created: 2024-12-19
 */

import { db } from '@/lib/db'
import { spaces, collections } from '@/lib/db/schema'

// Seeded spaces that are created for each new user
const SEEDED_SPACES = [
  { name: 'Personal', emoji: '👤' },
  { name: 'Work', emoji: '💼' }
]

// Default collections for each seeded space
const DEFAULT_COLLECTIONS = ['All', 'Recent', 'Saved']

/**
 * Seeds a new user account with default spaces and collections
 * @param userId - The ID of the user to seed
 * @returns Promise that resolves when seeding is complete
 */
export async function seedUserAccount(userId: string) {
  try {
    // Use a transaction to ensure atomicity
    await db.transaction(async (tx) => {
      // Create each seeded space
      for (const spaceData of SEEDED_SPACES) {
        const [space] = await tx
          .insert(spaces)
          .values({
            userId,
            name: spaceData.name,
            emoji: spaceData.emoji,
            type: 'seeded'
          })
          .returning()
        
        // Create default collections for this space
        const collectionValues = DEFAULT_COLLECTIONS.map(name => ({
          userId,
          spaceId: space.id,
          name,
          type: 'seeded' as const
        }))
        
        await tx.insert(collections).values(collectionValues)
      }
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