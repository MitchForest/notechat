"use client";

import { useEffect, useState, useRef, memo, useCallback } from "react";
import { Editor as TiptapEditor, EditorContent } from "@tiptap/react";
import { EditorService } from "../services/EditorService";
import { EditorBubbleMenu } from "./editor-bubble-menu";
import "../styles/editor.css";
import { useGhostText } from "@/features/ai/hooks/use-ghost-text";
import { useStableEditor } from "../hooks/use-stable-editor";

interface EditorProps {
  content: string;
  onChange: (richText: string) => void;
}

const EditorInner = memo(
  ({
    editor
  }: {
    editor: TiptapEditor;
  }) => {
    console.log('[EditorInner] Component rendered');
    const { isLoading: ghostLoading } = useGhostText(editor || null);
    console.log('[Editor] Ghost loading state:', ghostLoading);

    return (
      <div className="relative w-full h-full">
        <EditorBubbleMenu editor={editor} />
        <EditorContent editor={editor} />
      </div>
    );
  }
);

EditorInner.displayName = 'EditorInner';

export function Editor({ content = "", onChange }: EditorProps) {
  const wrapperRef = useRef<HTMLDivElement>(null!);
  const editorService = useStableEditor({ elementRef: wrapperRef });
  const editor = editorService?.editor;

  console.log('[Editor] Component rendered');

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
    return <div ref={wrapperRef} className="min-h-[500px] animate-pulse bg-muted rounded-lg" />;
  }

  return (
    <div ref={wrapperRef} className="relative w-full h-full">
      <EditorInner
        editor={editor}
      />
    </div>
  );
} 