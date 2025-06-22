"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Editor as TiptapEditor, EditorContent } from "@tiptap/react";
import { EditorService } from "../services/EditorService";
import { EditorBubbleMenu } from "./editor-bubble-menu";
import { EditorErrorBoundary } from "./editor-error-boundary";
import "../styles/editor.css";
import { useStableEditor } from "../hooks/use-stable-editor";
import { useBlockDragDrop } from "../hooks/use-block-drag-drop";
import { DragProvider } from "../contexts/drag-context";
import { GhostTextHandler } from "@/features/ai/components/ghost-text-handler";

// Import test utility in development
if (process.env.NODE_ENV === 'development') {
  import('../utils/test-block-ui');
}

interface EditorProps {
  content: string;
  onChange: (richText: string) => void;
}



export function Editor({ content = "", onChange }: EditorProps) {
  const wrapperRef = useRef<HTMLDivElement>(null!);
  const [editorReady, setEditorReady] = useState(false);
  const [editorInstance, setEditorInstance] = useState<TiptapEditor | null>(null);
  
  // Initialize drag and drop hook with the editor instance
  const {
    dragState,
    startDrag,
    updateDropTarget,
    completeDrop
  } = useBlockDragDrop({ 
    editor: editorInstance,
    enabled: true 
  });
  
  // Memoize the onEditorReady callback to prevent infinite loops
  const onEditorReady = useCallback((service: EditorService) => {
    setEditorReady(true);
    setEditorInstance(service.editor);
  }, []);

  // Memoize drag handlers to prevent recreation
  const dragHandlers = useMemo(() => ({
    onDragStart: startDrag,
    onDrop: completeDrop,
    onUpdateDropTarget: updateDropTarget
  }), [startDrag, completeDrop, updateDropTarget]);

  const editorService = useStableEditor({ 
    elementRef: wrapperRef,
    onEditorReady,
    dragHandlers
  });
  
  const editor = editorService?.editor;

  const handleUpdate = useCallback(() => {
    if (onChange && editor) {
      onChange(editor.getHTML());
    }
  }, [onChange, editor]);

  useEffect(() => {
    if (editor) {
      editor.on('update', handleUpdate);
      return () => {
        editor.off('update', handleUpdate);
      };
    }
  }, [editor, handleUpdate]);

  useEffect(() => {
    if (editor) {
      const { from, to } = editor.state.selection;
      if (editor.getHTML() !== content && content) {
        editor.commands.setContent(content, false, {
          preserveWhitespace: 'full'
        });
        editor.commands.setTextSelection({ from, to });
      }
    }
  }, [editor, content]);

  if (!editor) {
    return (
      <div 
        ref={wrapperRef} 
        className="editor-wrapper min-h-[500px] animate-pulse bg-muted rounded-lg" 
      />
    );
  }

  return (
    <EditorErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Editor initialization failed:', error);
        // Could send to error tracking service here
      }}
    >
      <DragProvider value={{
        dragState: {
          isDragging: dragState.isDragging,
          draggedBlockId: dragState.draggedBlockId,
          dropTargetId: dragState.dropTargetId,
          dropPosition: dragState.dropPosition
        },
        onDragStart: startDrag
      }}>
        <div ref={wrapperRef} className="editor-wrapper relative w-full h-full">
          <EditorBubbleMenu editor={editor} />
          <EditorContent editor={editor} />
          <GhostTextHandler editor={editor} />
        </div>
      </DragProvider>
    </EditorErrorBoundary>
  );
} 