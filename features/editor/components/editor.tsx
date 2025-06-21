"use client";

import "../styles/editor.css";
import { EditorContent } from "@tiptap/react";
import { useEffect, useState, useRef } from "react";
import { EditorService } from "../services/EditorService";
import { type Editor as TiptapEditor } from "@tiptap/core";
import { EditorBubbleMenu } from "./bubble-menu";
import dynamic from "next/dynamic";

// No longer need a separate dynamic wrapper for the whole component
const NovelEditorContentDynamic = dynamic(() => Promise.resolve(EditorContent), {
  ssr: false,
  loading: () => <div className="min-h-[500px] animate-pulse bg-muted rounded-lg" />
});

interface EditorProps {
  content?: string;
  onChange?: (content: string) => void;
}

export function Editor({ content = "", onChange }: EditorProps) {
  // Use a ref to hold the service instance. It persists across re-renders.
  const editorService = useRef<EditorService | null>(null);
  
  // The editor instance itself is state, so React can render it.
  const [editor, setEditor] = useState<TiptapEditor | null>(null);

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
  }, []);

  useEffect(() => {
    if (!editor || !onChange) {
      return;
    }

    const handleUpdate = () => {
      onChange(editor.getHTML());
    };

    editor.on('update', handleUpdate);

    const editorContent = editor.getHTML();
    if (content !== editorContent) {
      editor.commands.setContent(content, false);
    }
    
    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor, content, onChange]);

  if (!editor) {
    return <div className="min-h-[500px] animate-pulse bg-muted rounded-lg" />;
  }

  return (
    <div className="relative w-full">
      <EditorBubbleMenu editor={editor} />
      <NovelEditorContentDynamic 
        editor={editor} 
        className="relative"
      />
      {/* Tooltip logic will be re-added in the next phase */}
    </div>
  );
}

// Alternative: Export a fully client-side version
export const EditorClient = dynamic(
  () => Promise.resolve(Editor),
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