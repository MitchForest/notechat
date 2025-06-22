"use client";

import { useEffect, useState, useRef } from "react";
import { Editor as TiptapEditor, EditorContent } from "@tiptap/react";
import { EditorService } from "../services/EditorService";
import { EditorBubbleMenu } from "./editor-bubble-menu";
import "../styles/editor.css";
import { useGhostText } from "@/features/ai/hooks/use-ghost-text";

interface EditorProps {
  content: string;
  onChange: (richText: string) => void;
}

export function Editor({ content = "", onChange }: EditorProps) {
  const editorService = useRef<EditorService | null>(null);
  const [editor, setEditor] = useState<TiptapEditor | null>(null);
  const [isReady, setIsReady] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isBubbleMenuOpen, setIsBubbleMenuOpen] = useState(false);

  console.log('[Editor] Component rendered');

  const { isLoading: ghostLoading } = useGhostText(editor);

  console.log('[Editor] Ghost loading state:', ghostLoading);

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
      if (onChangeRef.current) {
        onChangeRef.current(service.editor.getHTML());
      }
    };
    
    const handleCreate = () => setIsReady(true);

    service.editor.on('update', handleUpdate);
    service.editor.on('create', handleCreate);

    return () => {
      service.editor.off('update', handleUpdate);
      service.editor.off('create', handleCreate);
      service.destroy();
      editorService.current = null;
    };
  }, []);

  useEffect(() => {
    if (editor && isReady) {
      const { from, to } = editor.state.selection;
      if (editor.getHTML() !== content && content) {
        editor.commands.setContent(content, false, {
          preserveWhitespace: 'full'
        });
        editor.commands.setTextSelection({ from, to });
      }
    }
  }, [editor, isReady, content]);

  useEffect(() => {
    if (!editor) return;
    
    const handleSelectionUpdate = () => {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        setIsBubbleMenuOpen(true);
      } else {
        setIsBubbleMenuOpen(false);
      }
    };

    editor.on('selectionUpdate', handleSelectionUpdate);
    
    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
    };
  }, [editor]);

  if (!editor) {
    return <div ref={wrapperRef} className="min-h-[500px] animate-pulse bg-muted rounded-lg" />;
  }

  return (
    <div ref={wrapperRef} className="relative w-full h-full">
      {editor && <EditorBubbleMenu editor={editor} isOpen={isBubbleMenuOpen} setIsOpen={setIsBubbleMenuOpen} />}
      <EditorContent editor={editor} />
    </div>
  );
}