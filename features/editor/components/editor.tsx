"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Editor as TiptapEditor, EditorContent } from "@tiptap/react";
import { EditorService } from "../services/EditorService";
import { EditorBubbleMenu } from "./editor-bubble-menu";
import { EditorErrorBoundary } from "./editor-error-boundary";
import "../styles/editor.css";
import { useStableEditor } from "../hooks/use-stable-editor";
import { GhostTextHandler } from "@/features/ai/components/ghost-text-handler";

interface EditorProps {
  noteId?: string;
  noteTitle?: string;
  content: string;
  onChange: (richText: string) => void;
}

export function Editor({ noteId, noteTitle, content = "", onChange }: EditorProps) {
  const wrapperRef = useRef<HTMLDivElement>(null!);
  const [editorReady, setEditorReady] = useState(false);
  const [editorInstance, setEditorInstance] = useState<TiptapEditor | null>(null);
  const [showBubbleMenu, setShowBubbleMenu] = useState(false);
  
  // Force cleanup when noteId changes
  useEffect(() => {
    return () => {
      if (editorInstance) {
        editorInstance.destroy();
        setEditorInstance(null);
        setEditorReady(false);
        setShowBubbleMenu(false);
      }
    };
  }, [noteId]); // Re-run when noteId changes
  
  // Memoize the onEditorReady callback to prevent infinite loops
  const onEditorReady = useCallback((service: EditorService) => {
    console.log('[Editor] onEditorReady called')
    setEditorReady(true);
    setEditorInstance(service.editor);
    
    // Debug: Check for drag handle extension
    const extensions = service.editor.extensionManager.extensions
    const dragHandle = extensions.find(ext => ext.name === 'dragHandle')
    console.log('[Editor] Drag handle extension found:', !!dragHandle)
    
    if (dragHandle) {
      console.log('[Editor] Drag handle config:', (dragHandle as any).options)
    }
    
    // Delay BubbleMenu mounting to prevent it from destroying drag handle's Tippy
    setTimeout(() => {
      setShowBubbleMenu(true);
    }, 100);
    
    // Debug: Check DOM after a delay
    setTimeout(() => {
      const dragHandles = document.querySelectorAll('.tiptap-drag-handle')
      console.log('[Editor] Drag handles in DOM:', dragHandles.length)
      dragHandles.forEach((handle, i) => {
        console.log(`[Editor] Handle ${i}:`, {
          element: handle,
          parent: handle.parentElement,
          rect: handle.getBoundingClientRect(),
          styles: window.getComputedStyle(handle),
        })
      })
      
      // Also check for tippy instances
      const tippyElements = document.querySelectorAll('[data-tippy-root]')
      console.log('[Editor] Tippy elements:', tippyElements.length)
      
      // Check editor DOM structure
      const editorDom = service.editor.view.dom
      console.log('[Editor] Editor DOM structure:', {
        editorDom,
        parentElement: editorDom.parentElement,
        parentElementId: editorDom.parentElement?.id,
        parentElementClass: editorDom.parentElement?.className,
        grandParent: editorDom.parentElement?.parentElement,
      })
      
      // Check for wrapper elements
      const wrappers = editorDom.parentElement?.querySelectorAll('div[style*="position: absolute"]')
      console.log('[Editor] Absolute positioned wrappers:', wrappers?.length || 0)
      wrappers?.forEach((wrapper, i) => {
        console.log(`[Editor] Wrapper ${i}:`, {
          element: wrapper,
          children: wrapper.children,
          style: wrapper.getAttribute('style'),
        })
      })
    }, 1000)
  }, []);

  const editorService = useStableEditor({ 
    elementRef: wrapperRef,
    onEditorReady
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
      <div ref={wrapperRef} className="editor-wrapper relative w-full h-full" id="tiptap-editor-wrapper">
        {showBubbleMenu && <EditorBubbleMenu editor={editor} noteId={noteId} noteTitle={noteTitle} />}
        <EditorContent editor={editor} />
        <GhostTextHandler editor={editor} />
      </div>
    </EditorErrorBoundary>
  );
} 