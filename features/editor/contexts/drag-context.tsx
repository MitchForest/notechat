import React, { createContext, useContext } from 'react';
import { Node as ProseMirrorNode } from 'prosemirror-model';

interface DragState {
  isDragging: boolean;
  draggedBlockId: string | null;
  dropTargetId: string | null;
  dropPosition: 'before' | 'after' | null;
}

interface DragContextValue {
  dragState: DragState;
  onDragStart?: (data: { blockId: string; blockNode: ProseMirrorNode; blockPos: number }) => void;
}

const DragContext = createContext<DragContextValue | null>(null);

export const useDragContext = () => {
  const context = useContext(DragContext);
  if (!context) {
    // Return a default value when not in drag context
    return {
      dragState: {
        isDragging: false,
        draggedBlockId: null,
        dropTargetId: null,
        dropPosition: null
      }
    };
  }
  return context;
};

export const DragProvider: React.FC<{
  value: DragContextValue;
  children: React.ReactNode;
}> = ({ value, children }) => {
  return <DragContext.Provider value={value}>{children}</DragContext.Provider>;
}; 