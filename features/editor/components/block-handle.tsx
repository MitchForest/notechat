import { Plus, GripVertical, Copy, Trash2 } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface BlockHandleProps {
  onDragStart: (event: React.DragEvent) => void;
  onAddBlock: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function BlockHandle({ onDragStart, onAddBlock, onDuplicate, onDelete }: BlockHandleProps) {
  return (
    <div className="flex items-center gap-1" data-testid="block-handle">
      {/* 1. Add Button */}
      <button
        className="p-1 rounded opacity-50 hover:opacity-100 hover:bg-accent"
        onClick={onAddBlock}
        title="Add block below"
      >
        <Plus className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* 2. Drag & Menu Handle */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            draggable="true"
            onDragStart={onDragStart}
            className="p-1 rounded opacity-50 hover:opacity-100 hover:bg-accent cursor-grab active:cursor-grabbing"
            title="Drag to move or click for options"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
        </DropdownMenu.Trigger>
        
        <DropdownMenu.Content 
          side="bottom" 
          align="start"
          className="bg-background border rounded-md shadow-lg p-1 w-48"
        >
          <DropdownMenu.Label className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Actions</DropdownMenu.Label>
          <DropdownMenu.Separator />
          <DropdownMenu.Item 
            className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded cursor-pointer"
            onClick={onDuplicate}
          >
            <Copy className="h-3 w-3" /> Duplicate
          </DropdownMenu.Item>
          <DropdownMenu.Item 
            className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded cursor-pointer text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" /> Delete
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  );
} 