"use client";

import { useState, useEffect, useRef } from "react";
import { Check, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SuggestionTooltipProps {
  word: string;
  suggestions: string[];
  position: { top: number; left: number };
  onApply: (suggestion: string) => void;
  onIgnore: () => void;
  onAddToDictionary: () => void;
  onClose: () => void;
}

export function SuggestionTooltip({
  word,
  suggestions,
  position,
  onApply,
  onIgnore,
  onAddToDictionary,
  onClose,
}: SuggestionTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

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
    <div
      ref={tooltipRef}
      className="spell-check-tooltip"
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      role="tooltip"
    >
      <div className="mb-2 text-sm font-medium text-muted-foreground">
        Suggestions for "{word}"
      </div>

      {suggestions.length > 0 ? (
        <div className="space-y-1">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              className={cn(
                "flex w-full items-center rounded px-2 py-1 text-left text-sm transition-colors",
                index === selectedIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              )}
              onClick={() => onApply(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : (
        <div className="py-2 text-sm text-muted-foreground">
          No suggestions available
        </div>
      )}

      <div className="mt-3 flex gap-1 border-t pt-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={onIgnore}
          className="h-7 text-xs"
        >
          <X className="mr-1 h-3 w-3" />
          Ignore
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onAddToDictionary}
          className="h-7 text-xs"
        >
          <Plus className="mr-1 h-3 w-3" />
          Add to dictionary
        </Button>
      </div>
    </div>
  );
} 