"use client";

import { EditorContent } from "@tiptap/react";
import { useEffect, useState, useRef } from "react";
import { EditorService } from "../services/EditorService";
import { Editor } from "@tiptap/core";
import dynamic from "next/dynamic";

// No longer need a separate dynamic wrapper for the whole component
const NovelEditorContentDynamic = dynamic(() => Promise.resolve(EditorContent), {
  ssr: false,
  loading: () => <div className="min-h-[500px] animate-pulse bg-muted rounded-lg" />
});

interface NovelEditorProps {
  content?: string;
  onChange?: (content: string) => void;
}

export function NovelEditor({ content = "", onChange }: NovelEditorProps) {
  // Use a ref to hold the service instance. It persists across re-renders.
  const editorService = useRef<EditorService | null>(null);
  
  // The editor instance itself is state, so React can render it.
  const [editor, setEditor] = useState<Editor | null>(null);

  // Effect for creating and destroying the service. Runs ONLY ONCE.
  useEffect(() => {
    const service = new EditorService();
    editorService.current = service;
    setEditor(service.editor);

    // Cleanup on component unmount
    return () => {
      service.destroy();
      editorService.current = null;
    };
  }, []); // <-- CRITICAL: Empty dependency array

  // Effect for handling updates and syncing state.
  useEffect(() => {
    if (!editor || !onChange) {
      return;
    }

    const handleUpdate = () => {
      onChange(editor.getHTML());
    };

    editor.on('update', handleUpdate);

    // Sync incoming `content` prop with the editor state, but only if different.
    const editorContent = editor.getHTML();
    if (content !== editorContent) {
      // `emitUpdate: false` prevents an infinite loop.
      editor.commands.setContent(content, false);
    }
    
    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor, content, onChange]); // Dependencies for syncing

  if (!editor) {
    return <div className="min-h-[500px] animate-pulse bg-muted rounded-lg" />;
  }

  return (
    <div className="relative w-full">
      <NovelEditorContentDynamic 
        editor={editor} 
        className="relative"
      />
      {/* Tooltip logic will be re-added in the next phase */}
    </div>
  );
}

// Alternative: Export a fully client-side version
export const NovelEditorClient = dynamic(
  () => Promise.resolve(NovelEditor),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-[500px] animate-pulse bg-muted rounded-lg">
        <div className="p-8">
          <div className="h-4 bg-muted-foreground/20 rounded w-3/4 mb-4" />
          <div className="h-4 bg-muted-foreground/20 rounded w-1/2 mb-4" />
          <div className="h-4 bg-muted-foreground/20 rounded w-5/6" />
        </div>
      </div>
    )
  }
);