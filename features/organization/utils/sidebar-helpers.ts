/**
 * Utility functions for sidebar components
 */

export const getInitials = (name: string | null | undefined, email: string) => {
  if (name) {
    const names = name.split(' ')
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }
  return email.substring(0, 2).toUpperCase()
} 