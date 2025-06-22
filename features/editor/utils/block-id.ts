/**
 * Utility for generating unique block IDs
 */

export function generateBlockId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  return `block-${timestamp}-${random}`
} 