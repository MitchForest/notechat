/**
 * Type Definitions: Ghost Text Feature
 * Purpose: Type safety for ghost text implementation
 * Features:
 * - Storage interface for ProseMirror extension
 * - Component props for handler
 * - State management types
 * 
 * Created: 2024-12-20
 */

import { Editor } from '@tiptap/core';

export interface GhostTextStorage {
  ghostText: string;
  isActive: boolean;
  position: number | null;
  triggerTimeout?: NodeJS.Timeout;
  disabled?: boolean; // For drag-and-drop integration
}

export interface GhostTextHandlerProps {
  editor: Editor;
}

export interface GhostTextState {
  isLoading: boolean;
  error?: string;
} 