"use client";

import { useState, useEffect, useRef } from "react";
import { Check, X, Plus, ThumbsDown, BookCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export interface SuggestionTooltipProps {
  error: any;
  suggestions: string[];
  position: { top: number; left: number };
  onApply: (suggestion: string) => void;
  onIgnore: () => void;
  onAddToDictionary: () => void;
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function SuggestionTooltip({
  error,
  suggestions,
  position,
  onApply,
  onIgnore,
  onAddToDictionary,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: SuggestionTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const isGrammarError = error?.type === 'grammar';
  const hasSuggestions = suggestions && suggestions.length > 0;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => Math.max(0, i - 1));
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) =>
            Math.min(suggestions.length - 1, i + 1)
          );
          break;
        case "Enter":
          e.preventDefault();
          if (suggestions[selectedIndex]) {
            onApply(suggestions[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, suggestions, onApply, onClose]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Position tooltip to avoid viewport edges
  useEffect(() => {
    if (tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newLeft = position.left;
      let newTop = position.top;

      // Adjust horizontal position
      if (rect.right > viewportWidth) {
        newLeft = viewportWidth - rect.width - 10;
      }

      // Adjust vertical position
      if (rect.bottom > viewportHeight) {
        newTop = position.top - rect.height - 10;
      }

      tooltipRef.current.style.left = `${newLeft}px`;
      tooltipRef.current.style.top = `${newTop}px`;
    }
  }, [position]);

  return (
    <Card
      ref={tooltipRef}
      className="absolute z-10 w-64 shadow-lg spell-check-tooltip"
      style={{ top: position.top, left: position.left }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <CardContent className="p-2">
        <div className="text-sm font-semibold mb-1 px-2">
          {isGrammarError ? "Grammar" : "Spelling"}
        </div>
        
        {isGrammarError && (
          <div className="px-2 py-1 text-sm text-muted-foreground italic">
            {error.message}
          </div>
        )}

        {(hasSuggestions || !isGrammarError) && <Separator />}

        {hasSuggestions ? (
          <div className="mt-1 max-h-32 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion}
                variant="ghost"
                size="sm"
                className="w-full justify-start h-8"
                onClick={() => onApply(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        ) : (
          !isGrammarError && (
            <div className="px-2 py-3 text-sm text-center text-muted-foreground">
              No suggestions available.
            </div>
          )
        )}
      </CardContent>
      <Separator />
      <CardFooter className="p-1 flex justify-end gap-1">
        <Button
          title="Ignore"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onIgnore}
        >
          <ThumbsDown className="h-4 w-4" />
        </Button>
        {!isGrammarError && (
          <Button
            title="Add to dictionary"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onAddToDictionary}
          >
            <BookCheck className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 