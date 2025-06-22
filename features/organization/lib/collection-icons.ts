import {
  Folder,
  Files,
  FileText,
  MessageSquare,
  Star,
  Clock,
  Archive,
  Briefcase,
  Home,
  Book,
  Lightbulb,
  List,
  Calendar,
  Tag,
  Search,
  Filter,
  Inbox,
  Send,
  Users,
  Lock,
  LucideIcon
} from 'lucide-react'

export const COLLECTION_ICONS = [
  { name: 'folder', label: 'Folder' },
  { name: 'files', label: 'Files' },
  { name: 'file-text', label: 'Document' },
  { name: 'message-square', label: 'Chat' },
  { name: 'star', label: 'Star' },
  { name: 'clock', label: 'Clock' },
  { name: 'archive', label: 'Archive' },
  { name: 'briefcase', label: 'Work' },
  { name: 'home', label: 'Home' },
  { name: 'book', label: 'Book' },
  { name: 'lightbulb', label: 'Ideas' },
  { name: 'list', label: 'List' },
  { name: 'calendar', label: 'Calendar' },
  { name: 'tag', label: 'Tag' },
  { name: 'search', label: 'Search' },
  { name: 'filter', label: 'Filter' },
  { name: 'inbox', label: 'Inbox' },
  { name: 'send', label: 'Send' },
  { name: 'users', label: 'Team' },
  { name: 'lock', label: 'Private' }
] as const

export const DEFAULT_SMART_COLLECTIONS = [
  {
    name: 'All',
    icon: 'files',
    isProtected: true,
    filterConfig: {
      type: 'all' as const,
      orderBy: 'updatedAt' as const,
      orderDirection: 'desc' as const
    }
  },
  {
    name: 'Recent',
    icon: 'clock',
    isProtected: false,
    filterConfig: {
      type: 'all' as const,
      timeRange: { unit: 'days' as const, value: 7 },
      orderBy: 'updatedAt' as const,
      orderDirection: 'desc' as const
    }
  },
  {
    name: 'Saved',
    icon: 'star',
    isProtected: false,
    filterConfig: {
      type: 'all' as const,
      isStarred: true,
      orderBy: 'updatedAt' as const,
      orderDirection: 'desc' as const
    }
  }
] as const

export type CollectionIconName = typeof COLLECTION_ICONS[number]['name']

// Icon mapping function
export const getCollectionIcon = (iconName: string): LucideIcon => {
  const icons: Record<string, LucideIcon> = {
    'folder': Folder,
    'files': Files,
    'file-text': FileText,
    'message-square': MessageSquare,
    'star': Star,
    'clock': Clock,
    'archive': Archive,
    'briefcase': Briefcase,
    'home': Home,
    'book': Book,
    'lightbulb': Lightbulb,
    'list': List,
    'calendar': Calendar,
    'tag': Tag,
    'search': Search,
    'filter': Filter,
    'inbox': Inbox,
    'send': Send,
    'users': Users,
    'lock': Lock
  }
  
  return icons[iconName] || Folder
} 