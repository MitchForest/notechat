"use client";

import "../styles/editor.css";
import { EditorContent } from "@tiptap/react";
import { useEffect, useState, useRef } from "react";
import { EditorService } from "../services/EditorService";
import { type Editor as TiptapEditor } from "@tiptap/core";
import { EditorBubbleMenu } from "./editor-bubble-menu";
import dynamic from "next/dynamic";
import { BlockHandleContainer } from "./block-handle-container";

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
  const [isReady, setIsReady] = useState(false);

  // Effect for creating and destroying the service. Runs ONLY ONCE.
  useEffect(() => {
    const service = new EditorService();
    editorService.current = service;
    setEditor(service.editor);

    service.editor.on('create', () => {
      setIsReady(true);
    });

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
    <div className="editor-wrapper relative w-full">
      <div id="block-handle-portal-root" />
      {editor && isReady && <BlockHandleContainer editor={editor} />}
      <EditorBubbleMenu editor={editor} />
      <div className="editor-content-wrapper relative">
        <NovelEditorContentDynamic 
          editor={editor} 
          className="editor-content pl-12"
        />
      </div>
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