/**
 * Page: Canvas - Main Application Canvas
 * Purpose: Flexible main content area that adapts to different view configurations
 * Features:
 * - Handles empty state, single views (chat/note), and split views
 * - Resizable panels for split views
 * - Proper component switching based on view configuration
 * - Close functionality for individual panels
 * 
 * Modified: 2024-12-19 - Updated to use new ViewConfig system and Claude.ai theme
 */
'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useAppShell, OpenItem } from '@/components/layout/app-shell-context'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { Card, CardContent } from '@/components/ui/card'
import { Editor } from "@/features/editor/components/editor"
import { ChatInterface } from '@/features/chat/components/chat-interface'
import { ErrorBoundary } from '@/features/chat/components/error-boundary'
import { PanelHeader } from '@/components/shared/panel-header'
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog'
import { useContentStore, useCollectionStore } from '@/features/organization/stores'
import { useNoteContextStore } from '@/features/chat/stores/note-context-store'
import { toast } from 'sonner'
import type { Note } from '@/lib/db/schema'
import { useSpaceStore } from '@/features/organization/stores/space-store'

// Chat component wrapper
function ChatComponent({
  chat,
  onClose
}: {
  chat: { id: string; title?: string }
  onClose?: () => void
}) {
  return (
    <ErrorBoundary>
      <ChatInterface chatId={chat.id} onClose={onClose} />
    </ErrorBoundary>
  )
}

function NoteComponent({
  note,
  onClose,
}: {
  note: { id: string; title?: string; content?: string };
  onClose?: () => void;
}) {
  const [content, setContent] = useState<string>(note.content || "");
  const [noteTitle, setNoteTitle] = useState(note.title || 'Untitled Note');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isTemporary, setIsTemporary] = useState(true); // Track if note is temporary
  const [hasEverHadContent, setHasEverHadContent] = useState(false);
  const { updateNote, deleteNote, createNote, notes } = useContentStore();
  const { setCurrentNote } = useNoteContextStore();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const realNoteIdRef = useRef<string | null>(null); // Track the real UUID

  // Check if this note exists in the store (i.e., has been persisted)
  useEffect(() => {
    const existingNote = notes.find(n => n.id === note.id || n.id === realNoteIdRef.current);
    if (existingNote) {
      realNoteIdRef.current = existingNote.id;
      setIsTemporary(false);
      setHasEverHadContent(true);
      setContent(existingNote.content as string || '');
      setNoteTitle(existingNote.title || 'Untitled Note');
      
      // Set as current note in context store with full data
      setCurrentNote({
        id: existingNote.id,
        title: existingNote.title || 'Untitled Note',
        content: existingNote.content as string || '',
        collectionId: existingNote.collectionId || undefined,
        isStarred: existingNote.isStarred || false,
        createdAt: existingNote.createdAt,
        updatedAt: existingNote.updatedAt,
      });
    }
  }, [note.id, notes, setCurrentNote]);

  // Update note context when content or title changes
  useEffect(() => {
    if (!isTemporary && realNoteIdRef.current) {
      const existingNote = notes.find(n => n.id === realNoteIdRef.current);
      if (existingNote) {
        setCurrentNote({
          id: existingNote.id,
          title: noteTitle,
          content: content,
          collectionId: existingNote.collectionId || undefined,
          isStarred: existingNote.isStarred || false,
          createdAt: existingNote.createdAt,
          updatedAt: existingNote.updatedAt,
        });
      }
    }
  }, [content, noteTitle, isTemporary, notes, setCurrentNote]);

  // Clear current note on unmount
  useEffect(() => {
    return () => {
      setCurrentNote(null);
      // Clear any pending save timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [setCurrentNote]);

  // Extract title from content
  const extractTitleFromContent = useCallback((htmlContent: string) => {
    // Strip HTML tags and get plain text
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    
    // Get first line or first 50 characters
    const firstLine = text.split('\n')[0].trim();
    if (firstLine.length > 0) {
      return firstLine.substring(0, 50) + (firstLine.length > 50 ? '...' : '');
    }
    return 'Untitled Note';
  }, []);

  // Debounced save function
  const debouncedSave = useCallback((noteId: string, newContent: string, newTitle?: string) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const updateData: Partial<Note> = { content: newContent };
        
        // Auto-extract title if not manually set
        if (!newTitle && noteTitle === 'Untitled Note') {
          const extractedTitle = extractTitleFromContent(newContent);
          if (extractedTitle !== 'Untitled Note') {
            updateData.title = extractedTitle;
            setNoteTitle(extractedTitle);
          }
        }

        await updateNote(noteId, updateData);
      } catch (error) {
        console.error('Failed to save note:', error);
        toast.error('Failed to save note');
      }
    }, 1000); // Save after 1 second of inactivity
  }, [updateNote, noteTitle, extractTitleFromContent]);

  const handleUpdate = useCallback(async (newContent: string) => {
    setContent(newContent);
    
    // If this is the first content and note is temporary, persist it
    if (isTemporary && newContent.trim().length > 0 && !hasEverHadContent) {
      setHasEverHadContent(true);
      try {
        // Create the note in the database
        // Get the active collection from the organization store or default to null (uncategorized)
        const { activeCollectionId } = useCollectionStore.getState();
        const { activeSpaceId } = useSpaceStore.getState();
        
        // Check if it's a virtual collection (permanent collections)
        const virtualCollectionIds = [
          'notes-all', 'notes-recent', 'notes-saved', 'notes-uncategorized',
          'chats-all', 'chats-recent', 'chats-saved', 'chats-uncategorized',
          'inbox-all', 'inbox-recent', 'inbox-saved'
        ];
        
        const collectionId = virtualCollectionIds.includes(activeCollectionId || '') 
          ? null 
          : activeCollectionId;
        
        // Use the active space ID directly
        const spaceId = activeSpaceId;
        
        const createdNote = await createNote(noteTitle, spaceId, collectionId);
        if (createdNote) {
          realNoteIdRef.current = createdNote.id; // Store the real UUID
          setIsTemporary(false);
          toast.success('Note created');
          
          // Now save the content using the created note's ID
          debouncedSave(createdNote.id, newContent);
        }
      } catch {
        toast.error('Failed to create note');
      }
    } else if (!isTemporary && realNoteIdRef.current) {
      // For existing notes, use the real UUID
      debouncedSave(realNoteIdRef.current, newContent);
    }
  }, [isTemporary, hasEverHadContent, noteTitle, createNote, debouncedSave]);

  const handleTitleChange = async (newTitle: string) => {
    setNoteTitle(newTitle);
    
    // Only update in database if note is not temporary
    if (!isTemporary && realNoteIdRef.current) {
      try {
        await updateNote(realNoteIdRef.current, { title: newTitle });
        toast.success('Note renamed');
      } catch {
        toast.error('Failed to rename note');
        // Revert title
        setNoteTitle(note.title || 'Untitled Note');
      }
    }
  };

  const handleAction = (action: 'rename' | 'delete' | 'clear' | 'close') => {
    switch (action) {
      case 'rename':
        // Handled by PanelHeader inline edit
        break;
      case 'delete':
        setShowDeleteDialog(true);
        break;
      case 'close':
        handleClose();
        break;
    }
  };

  const handleClose = async () => {
    // Clear any pending saves
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // If note is temporary and has no content, just close without saving
    if (isTemporary && content.trim().length === 0) {
      onClose?.();
      return;
    }

    // If note exists but has no content, delete it
    if (!isTemporary && content.trim().length === 0 && realNoteIdRef.current) {
      try {
        await deleteNote(realNoteIdRef.current);
        toast.success('Empty note deleted');
      } catch {
        toast.error('Failed to delete empty note');
      }
    }
    
    onClose?.();
  };

  const handleDelete = async () => {
    try {
      if (!isTemporary && realNoteIdRef.current) {
        await deleteNote(realNoteIdRef.current);
        toast.success('Note deleted');
      }
      onClose?.();
    } catch {
      toast.error('Failed to delete note');
    }
  };

  return (
    <>
      <Card className="h-full flex flex-col">
        <PanelHeader 
          title={noteTitle}
          type="note"
          onTitleChange={handleTitleChange}
          onAction={handleAction}
        />

        <CardContent className="flex-1 p-0 overflow-y-auto">
          <Editor 
            noteId={note.id}
            onChange={handleUpdate}
            content={content}
          />
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete note?"
        description="This will permanently delete this note. This action cannot be undone."
        confirmText="Delete Note"
        onConfirm={handleDelete}
        isDestructive
      />
    </>
  )
}

function EmptyState() {
  const { openChat, openNote } = useAppShell()

  const handleNewChat = () => {
    openChat({
      id: `chat-${Date.now()}`,
      type: 'chat',
      title: 'New Chat'
    })
  }

  const handleNewNote = () => {
    openNote({
      id: `note-${Date.now()}`,
      type: 'note',
      title: 'New Note'
    })
  }

  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome to NoteChat.AI
          </h1>
          <p className="text-muted-foreground text-lg">
            Choose how you&apos;d like to start
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Card
            onClick={handleNewChat}
            className="group w-48 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all duration-200 hover:scale-105"
          >
            <CardContent className="p-6 flex flex-col items-center">
              <div className="text-2xl mb-3 ai-gradient-text">💬</div>
              <div className="text-foreground font-medium">Start Chat</div>
              <div className="text-muted-foreground text-sm">Chat with AI</div>
            </CardContent>
          </Card>

          <Card
            onClick={handleNewNote}
            className="group w-48 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all duration-200 hover:scale-105"
          >
            <CardContent className="p-6 flex flex-col items-center">
              <div className="text-2xl mb-3 ai-gradient-text">📝</div>
              <div className="text-foreground font-medium">Create Note</div>
              <div className="text-muted-foreground text-sm">Start writing</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function CanvasView() {
  const { viewConfig, activeChat, activeNote, closeChat, closeNote } = useAppShell()

  // Empty state
  if (viewConfig.primary === 'empty') {
    return <EmptyState />
  }

  // Single view (no secondary panel)
  if (!viewConfig.secondary) {
    if (viewConfig.primary === 'chat' && activeChat) {
      return (
        <div className="h-full p-4">
          <ChatComponent 
            key={`chat-${activeChat.id}`} 
            chat={activeChat} 
            onClose={closeChat}
          />
        </div>
      )
    }
    if (viewConfig.primary === 'note' && activeNote) {
      return (
        <div className="h-full p-4">
          <NoteComponent 
            key={`note-${activeNote.id}`} 
            note={activeNote} 
            onClose={closeNote}
          />
        </div>
      )
    }
    return <EmptyState />
  }

  // Split view
  const renderPanel = (item: OpenItem | null, type: 'chat' | 'note') => {
    if (!item) return <EmptyState />
    if (type === 'chat') {
      return <ChatComponent key={`chat-${item.id}`} chat={item} onClose={closeChat} />
    }
    if (type === 'note') {
      return <NoteComponent key={`note-${item.id}`} note={item} onClose={closeNote} />
    }
    return <EmptyState />
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      <ResizablePanel>
        <div className="h-full p-4">
          {renderPanel(
            viewConfig.primary === 'chat' ? activeChat : activeNote,
            viewConfig.primary as 'chat' | 'note'
          )}
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel>
        <div className="h-full p-4">
          {renderPanel(
            viewConfig.secondary === 'chat' ? activeChat : activeNote,
            viewConfig.secondary as 'chat' | 'note'
          )}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
} 