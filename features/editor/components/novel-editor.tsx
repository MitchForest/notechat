"use client";

import { useEffect, useState, useMemo } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  SpellCheckExtension,
  type SpellError,
  type GrammarError,
} from "../extensions/spellcheck";
import { EditorBubbleMenu } from "./editor-bubble-menu";
import { cn } from "@/lib/utils";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import { SuggestionTooltip } from "./suggestion-tooltip";
import { CheckManager } from "../services/check-manager";

interface TooltipState {
  from: number;
  to: number;
  rect: DOMRect;
  type: "spell" | "grammar";
}

interface NovelEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  onSelectionChange?: (selection: { from: number; to: number }) => void;
  className?: string;
  editable?: boolean;
}

export function NovelEditor({
  content = "",
  onChange,
  onSelectionChange,
  className,
  editable = true,
}: NovelEditorProps) {
  const [hydrated, setHydrated] = useState(false);
  const [tooltipState, setTooltipState] = useState<TooltipState | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const checkManager = useMemo(() => new CheckManager(), []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: "list-disc list-outside leading-3",
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: "list-decimal list-outside leading-3",
          },
        },
        listItem: {
          HTMLAttributes: {
            class: "leading-normal",
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: "border-l-4 border-border pl-4",
          },
        },
        codeBlock: {
          HTMLAttributes: {
            class: "rounded-lg bg-muted p-4 font-mono text-sm",
          },
        },
        code: {
          HTMLAttributes: {
            class: "rounded-md bg-muted px-1.5 py-1 font-mono text-sm",
          },
        },
        heading: {
          levels: [1, 2, 3],
          HTMLAttributes: {
            class: "font-heading",
          },
        },
        paragraph: {
          HTMLAttributes: {
            class: "leading-7",
          },
        },
      }),
      Placeholder.configure({
        placeholder: "Start writing...",
        emptyEditorClass: "is-empty",
      }),
      SpellCheckExtension.configure({
        enabled: true,
        debounceMs: 300,
        language: "en_US",
        checkManager,
      }),
      Highlight,
      TaskList,
      TaskItem,
      HorizontalRule,
    ],
    content,
    editable,
    autofocus: "end",
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-neutral dark:prose-invert max-w-none",
          "focus:outline-none",
          "min-h-[500px]",
          className
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      onSelectionChange?.({ from, to });
    },
    onTransaction: ({ transaction }) => {
      const tooltip = transaction.getMeta("spellAndGrammarCheck")?.tooltip;
      setTooltipState(tooltip ?? null);
    },
  });

  useEffect(() => {
    if (tooltipState && editor) {
      const { from, to, type } = tooltipState;
      if (type === "spell") {
        setLoadingSuggestions(true);
        const text = editor.state.doc.textBetween(from, to);
        checkManager.getSuggestions(text).then((sugs: string[]) => {
          setSuggestions(sugs);
          setLoadingSuggestions(false);
        });
      } else {
        // Handle grammar suggestions if any
        setSuggestions([]);
      }
    }
  }, [tooltipState, editor, checkManager]);

  const handleApplySuggestion = (suggestion: string) => {
    if (tooltipState && editor) {
      editor
        .chain()
        .focus()
        .command(({ tr, state }) => {
          const textNode = state.schema.text(suggestion);
          tr.replaceWith(tooltipState.from, tooltipState.to, textNode);
          return true;
        })
        .run();
      setTooltipState(null);
    }
  };

  const handleAddToDictionary = () => {
     if (tooltipState && editor) {
      const text = editor.state.doc.textBetween(tooltipState.from, tooltipState.to);
      checkManager.addToUserDictionary(text);
      setTooltipState(null);
    }
  };

  // Hydration fix for SSR
  useEffect(() => {
    if (!hydrated) {
      setHydrated(true);
    }
  }, [hydrated]);

  if (!editor || !hydrated) {
    return (
      <div
        className={cn(
          "min-h-[500px] animate-pulse rounded-lg bg-muted",
          className
        )}
      />
    );
  }

  return (
    <div className="relative">
      <EditorContent editor={editor} />
      {tooltipState && (
        <SuggestionTooltip
          word={editor.state.doc.textBetween(tooltipState.from, tooltipState.to)}
          suggestions={suggestions}
          position={{
            top: tooltipState.rect.bottom,
            left: tooltipState.rect.left,
          }}
          onApply={handleApplySuggestion}
          onIgnore={() => setTooltipState(null)}
          onAddToDictionary={handleAddToDictionary}
          onClose={() => setTooltipState(null)}
        />
      )}
      <EditorBubbleMenu editor={editor} />
    </div>
  );
} 