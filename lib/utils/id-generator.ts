import { customAlphabet } from 'nanoid'

// Create a custom nanoid with URL-safe characters
// Excluding similar looking characters for better readability
const nanoid = customAlphabet('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz', 12)

// ID prefixes for different entity types
export const ID_PREFIXES = {
  note: 'note_',
  chat: 'chat_',
  space: 'space_',
  collection: 'coll_',
  smartCollection: 'scoll_',
  user: 'user_',
  session: 'sess_',
  message: 'msg_',
  account: 'acc_',
  feedback: 'fb_',
  preferences: 'pref_',
} as const

export type EntityType = keyof typeof ID_PREFIXES

/**
 * Generate a prefixed ID for a given entity type
 * Format: {prefix}{nanoid}
 * Example: note_Ab3Cd5Fg7Hj9
 */
export function generateId(type: EntityType): string {
  return `${ID_PREFIXES[type]}${nanoid()}`
}

/**
 * Extract the entity type from a prefixed ID
 * Returns null if the ID doesn't match any known prefix
 */
export function getEntityType(id: string): EntityType | null {
  for (const [type, prefix] of Object.entries(ID_PREFIXES)) {
    if (id.startsWith(prefix)) {
      return type as EntityType
    }
  }
  return null
}

/**
 * Check if an ID is of a specific entity type
 */
export function isEntityType(id: string, type: EntityType): boolean {
  return id.startsWith(ID_PREFIXES[type])
}

/**
 * Type guards for common entity types
 */
export const isNoteId = (id: string): boolean => isEntityType(id, 'note')
export const isChatId = (id: string): boolean => isEntityType(id, 'chat')
export const isSpaceId = (id: string): boolean => isEntityType(id, 'space')
export const isCollectionId = (id: string): boolean => isEntityType(id, 'collection')
export const isSmartCollectionId = (id: string): boolean => isEntityType(id, 'smartCollection')

/**
 * Validate that an ID has the correct format
 */
export function isValidId(id: string): boolean {
  const type = getEntityType(id)
  if (!type) return false
  
  const prefix = ID_PREFIXES[type]
  const idPart = id.substring(prefix.length)
  
  // Check that the ID part has the expected length and characters
  return idPart.length === 12 && /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/.test(idPart)
} 