'use client'

import React from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  Star,
  StarOff,
  Palette,
  FolderOpen,
  Copy,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface HoverActionsProps {
  onRename?: () => void
  onDelete?: () => void
  onChangeIcon?: () => void  // For collections
  onChangeEmoji?: () => void // For spaces
  onStar?: () => void        // For notes/chats
  onMove?: () => void        // For notes/chats/collections
  onDuplicate?: () => void   // For notes/chats
  onOpen?: () => void        // For notes/chats
  isStarred?: boolean        // For star/unstar toggle
  className?: string
  variant?: 'space' | 'collection' | 'smart-collection' | 'item'
}

export function HoverActions({
  onRename,
  onDelete,
  onChangeIcon,
  onChangeEmoji,
  onStar,
  onMove,
  onDuplicate,
  onOpen,
  isStarred = false,
  className,
  variant = 'item'
}: HoverActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className={cn(
            "h-6 w-6 p-0 hover-actions-trigger",
            "hover:bg-hover-1",
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-3 w-3" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {/* Item actions (notes/chats) */}
        {variant === 'item' && (
          <>
            {onOpen && (
              <DropdownMenuItem onClick={onOpen}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open
              </DropdownMenuItem>
            )}
            
            {onRename && (
              <DropdownMenuItem onClick={onRename}>
                <Edit2 className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
            )}
            
            {onStar && (
              <DropdownMenuItem onClick={onStar}>
                {isStarred ? (
                  <>
                    <StarOff className="mr-2 h-4 w-4" />
                    Unstar
                  </>
                ) : (
                  <>
                    <Star className="mr-2 h-4 w-4" />
                    Star
                  </>
                )}
              </DropdownMenuItem>
            )}
            
            {onMove && (
              <DropdownMenuItem onClick={onMove}>
                <FolderOpen className="mr-2 h-4 w-4" />
                Move to...
              </DropdownMenuItem>
            )}
            
            {onDuplicate && (
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
            )}
            
            {(onRename || onStar || onMove || onDuplicate) && onDelete && (
              <DropdownMenuSeparator />
            )}
          </>
        )}
        
        {/* Space actions */}
        {variant === 'space' && (
          <>
            {onRename && (
              <DropdownMenuItem onClick={onRename}>
                <Edit2 className="mr-2 h-4 w-4" />
                Rename Space
              </DropdownMenuItem>
            )}
            
            {onChangeEmoji && (
              <DropdownMenuItem onClick={onChangeEmoji}>
                <Palette className="mr-2 h-4 w-4" />
                Change Emoji
              </DropdownMenuItem>
            )}
            
            {(onRename || onChangeEmoji) && onDelete && (
              <DropdownMenuSeparator />
            )}
          </>
        )}
        
        {/* Collection actions */}
        {variant === 'collection' && (
          <>
            {onRename && (
              <DropdownMenuItem onClick={onRename}>
                <Edit2 className="mr-2 h-4 w-4" />
                Rename Collection
              </DropdownMenuItem>
            )}
            
            {onChangeIcon && (
              <DropdownMenuItem onClick={onChangeIcon}>
                <Palette className="mr-2 h-4 w-4" />
                Change Icon
              </DropdownMenuItem>
            )}
            
            {onMove && (
              <DropdownMenuItem onClick={onMove}>
                <FolderOpen className="mr-2 h-4 w-4" />
                Move to Space...
              </DropdownMenuItem>
            )}
            
            {(onRename || onChangeIcon || onMove) && onDelete && (
              <DropdownMenuSeparator />
            )}
          </>
        )}
        
        {/* Smart Collection actions */}
        {variant === 'smart-collection' && (
          <>
            {onRename && (
              <DropdownMenuItem onClick={onRename}>
                <Edit2 className="mr-2 h-4 w-4" />
                Rename Filter
              </DropdownMenuItem>
            )}
            
            {onChangeIcon && (
              <DropdownMenuItem onClick={onChangeIcon}>
                <Palette className="mr-2 h-4 w-4" />
                Change Icon
              </DropdownMenuItem>
            )}
            
            {(onRename || onChangeIcon) && onDelete && (
              <DropdownMenuSeparator />
            )}
          </>
        )}
        
        {/* Delete action (common to all) */}
        {onDelete && (
          <DropdownMenuItem 
            onClick={onDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete {
              variant === 'space' ? 'Space' : 
              variant === 'collection' ? 'Collection' : 
              variant === 'smart-collection' ? 'Filter' : 
              ''
            }
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 