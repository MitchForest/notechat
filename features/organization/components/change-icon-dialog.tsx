'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getCollectionIcon } from '@/features/organization/lib/collection-icons'
import type { LucideIcon } from 'lucide-react'

interface ChangeIconDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentIcon: string
  itemName: string
  itemType: 'collection' | 'smart-collection'
  onChangeIcon: (newIcon: string) => void
}

// Icon categories with their icon names
const ICON_CATEGORIES = {
  'General': ['folder', 'archive', 'box', 'package', 'layers', 'grid', 'layout', 'book'],
  'Work': ['briefcase', 'clipboard', 'file-text', 'calendar', 'clock', 'target', 'trending-up', 'users'],
  'Creative': ['palette', 'image', 'music', 'video', 'camera', 'edit', 'pen-tool', 'feather'],
  'Development': ['code', 'git-branch', 'terminal', 'database', 'cpu', 'hard-drive', 'wifi', 'cloud'],
  'Communication': ['mail', 'message-square', 'phone', 'globe', 'share-2', 'send', 'at-sign', 'hash'],
  'Finance': ['dollar-sign', 'credit-card', 'trending-up', 'pie-chart', 'bar-chart', 'activity', 'percent', 'calculator'],
  'Health': ['heart', 'activity', 'thermometer', 'pill', 'shield', 'zap', 'sun', 'moon'],
  'Education': ['book', 'graduation-cap', 'pen-tool', 'bookmark', 'award', 'flag', 'map', 'compass'],
}

interface IconButtonProps {
  icon: string
  isSelected: boolean
  onClick: () => void
}

function IconButton({ icon, isSelected, onClick }: IconButtonProps) {
  const Icon = getCollectionIcon(icon) as LucideIcon
  
  return (
    <Button
      variant={isSelected ? "default" : "outline"}
      size="sm"
      className={cn(
        "h-12 w-12 p-0",
        isSelected && "ring-2 ring-primary ring-offset-2"
      )}
      onClick={onClick}
      title={icon}
    >
      <Icon className="h-5 w-5" />
    </Button>
  )
}

export function ChangeIconDialog({
  open,
  onOpenChange,
  currentIcon,
  itemName,
  itemType,
  onChangeIcon,
}: ChangeIconDialogProps) {
  const [selectedIcon, setSelectedIcon] = React.useState(currentIcon)
  
  const handleIconSelect = (icon: string) => {
    setSelectedIcon(icon)
    onChangeIcon(icon)
    onOpenChange(false)
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Change Icon for {itemName}</DialogTitle>
          <DialogDescription>
            Select a new icon for your {itemType === 'collection' ? 'collection' : 'smart collection'}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="mt-4">
          <TabsList className="grid grid-cols-4 lg:grid-cols-8 h-auto">
            {Object.keys(ICON_CATEGORIES).map(category => (
              <TabsTrigger 
                key={category} 
                value={category.toLowerCase()}
                className="text-xs"
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {Object.entries(ICON_CATEGORIES).map(([category, icons]) => (
            <TabsContent 
              key={category} 
              value={category.toLowerCase()}
              className="mt-4"
            >
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {icons.map(icon => (
                  <IconButton
                    key={icon}
                    icon={icon}
                    isSelected={icon === selectedIcon}
                    onClick={() => handleIconSelect(icon)}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 