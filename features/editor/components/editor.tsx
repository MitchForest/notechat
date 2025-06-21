"use client";

import { useEffect, useState, useRef } from "react";
import { type Editor as TiptapEditor } from "@tiptap/core";
import { EditorContent } from "@tiptap/react";
import { EditorService } from "../services/EditorService";
import { EditorBubbleMenu } from "./editor-bubble-menu";
import "../styles/editor.css";

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
}

export function Editor({ content = "", onChange }: EditorProps) {
  const editorService = useRef<EditorService | null>(null);
  const [editor, setEditor] = useState<TiptapEditor | null>(null);
  const [isReady, setIsReady] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!wrapperRef.current) return;
    
    const service = new EditorService(wrapperRef.current);
    editorService.current = service;
    setEditor(service.editor);

    const handleUpdate = () => {
      onChangeRef.current(service.editor.getHTML());
    };
    service.editor.on('update', handleUpdate);

    service.editor.on('create', () => {
      setIsReady(true);
      service.editor.commands.setContent(content, false);
    });

    return () => {
      service.editor.off('update', handleUpdate);
      service.destroy();
      editorService.current = null;
    };
  }, []); 

  useEffect(() => {
    if (editor && isReady) {
      const editorContent = editor.getHTML();
      if (content !== editorContent) {
        editor.commands.setContent(content, false);
      }
    }
  }, [content, editor, isReady]);

  if (!editor) {
    return <div ref={wrapperRef} className="min-h-[500px] animate-pulse bg-muted rounded-lg" />;
  }

  return (
    <div ref={wrapperRef} className="editor-wrapper relative w-full">
      <EditorBubbleMenu editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}