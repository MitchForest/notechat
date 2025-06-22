export const PERMANENT_SPACES_DATA = [
  {
    id: 'permanent-notes',
    name: 'All Notes',
    emoji: '📝',
    type: 'static',
    collections: [
      { id: 'notes-all', name: 'All', type: 'static-all', fetchConfig: { api: 'notes', filter: 'all' } },
      { id: 'notes-recent', name: 'Recent', type: 'static-recent', fetchConfig: { api: 'notes', filter: 'all_recent' } },
      { id: 'notes-saved', name: 'Saved', type: 'static-starred', fetchConfig: { api: 'notes', filter: 'all_starred' } },
      { id: 'notes-uncategorized', name: 'Uncategorized', type: 'static-uncategorized', fetchConfig: { api: 'notes', filter: 'uncategorized' } },
    ],
  },
  {
    id: 'permanent-chats',
    name: 'Chats',
    emoji: '💬',
    type: 'static',
    collections: [
      { id: 'chats-all', name: 'All', type: 'static-all', fetchConfig: { api: 'chats', filter: 'all' } },
      { id: 'chats-recent', name: 'Recent', type: 'static-recent', fetchConfig: { api: 'chats', filter: 'all_recent' } },
      { id: 'chats-saved', name: 'Saved', type: 'static-starred', fetchConfig: { api: 'chats', filter: 'all_starred' } },
      { id: 'chats-uncategorized', name: 'Uncategorized', type: 'static-uncategorized', fetchConfig: { api: 'chats', filter: 'uncategorized' } },
    ],
  },
] as const; 