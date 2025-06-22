'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { COLLECTION_ICONS, getCollectionIcon } from '@/features/organization/lib/collection-icons'
import { cn } from '@/lib/utils'

interface SmartCollectionFilter {
  type: 'all' | 'notes' | 'chats'
  timeRange?: { unit: 'days' | 'months', value: number }
  isStarred?: boolean
  orderBy: 'updatedAt' | 'createdAt' | 'title'
  orderDirection: 'asc' | 'desc'
}

interface CreateCollectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  spaceName: string
  spaceId: string
  onCreateCollection: (data: {
    name: string
    icon: string
    type: 'regular' | 'smart'
    filterConfig?: SmartCollectionFilter
  }) => Promise<void>
}

export function CreateCollectionDialog({ 
  open, 
  onOpenChange, 
  spaceName,
  spaceId,
  onCreateCollection 
}: CreateCollectionDialogProps) {
  const [name, setName] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('folder')
  const [collectionType, setCollectionType] = useState<'regular' | 'smart'>('regular')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Smart collection filter state
  const [filterType, setFilterType] = useState<'all' | 'notes' | 'chats'>('all')
  const [timeRange, setTimeRange] = useState<'all' | '7days' | '30days' | 'custom'>('all')
  const [customDays, setCustomDays] = useState('7')
  const [isStarredOnly, setIsStarredOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'updatedAt' | 'createdAt' | 'title'>('updatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!name.trim()) {
      setError('Collection name is required')
      return
    }
    
    if (name.length > 50) {
      setError('Collection name must be less than 50 characters')
      return
    }

    // Check for reserved names
    const reservedNames = ['All', 'Recent', 'Saved', 'Uncategorized']
    if (reservedNames.includes(name.trim())) {
      setError('This name is reserved for system collections')
      return
    }

    setLoading(true)
    setError('')

    try {
      let filterConfig: SmartCollectionFilter | undefined
      
      if (collectionType === 'smart') {
        filterConfig = {
          type: filterType,
          orderBy: sortBy,
          orderDirection: sortOrder,
          ...(isStarredOnly && { isStarred: true }),
          ...(timeRange !== 'all' && {
            timeRange: {
              unit: 'days',
              value: timeRange === '7days' ? 7 : 
                     timeRange === '30days' ? 30 : 
                     parseInt(customDays)
            }
          })
        }
      }
      
      await onCreateCollection({
        name: name.trim(),
        icon: selectedIcon,
        type: collectionType,
        filterConfig
      })
      
      toast.success(`Created ${collectionType} collection "${name}"`)
      
      // Reset form
      resetForm()
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to create collection:', error)
      setError('Failed to create collection. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setName('')
    setSelectedIcon('folder')
    setCollectionType('regular')
    setError('')
    setFilterType('all')
    setTimeRange('all')
    setCustomDays('7')
    setIsStarredOnly(false)
    setSortBy('updatedAt')
    setSortOrder('desc')
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm()
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Collection</DialogTitle>
            <DialogDescription>
              Create a new collection in {spaceName} to organize your items.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {/* Collection Type Toggle */}
            <div className="space-y-2">
              <Label>Collection Type</Label>
              <ToggleGroup
                type="single"
                value={collectionType}
                onValueChange={(value) => value && setCollectionType(value as 'regular' | 'smart')}
                className="justify-start"
              >
                <ToggleGroupItem value="regular" aria-label="Regular collection">
                  Regular
                </ToggleGroupItem>
                <ToggleGroupItem value="smart" aria-label="Smart collection">
                  Smart
                </ToggleGroupItem>
              </ToggleGroup>
              <p className="text-sm text-muted-foreground">
                {collectionType === 'regular' 
                  ? 'A regular collection where you manually add items'
                  : 'A smart collection that automatically filters items based on criteria'}
              </p>
            </div>

            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError('')
                }}
                placeholder="e.g. Ideas, Archive, Important"
                className={error ? 'border-destructive' : ''}
                disabled={loading}
                autoFocus
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>

            {/* Icon Picker */}
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="grid grid-cols-5 gap-2">
                {COLLECTION_ICONS.map(({ name, label }) => {
                  const Icon = getCollectionIcon(name)
                  return (
                    <Button
                      key={name}
                      type="button"
                      variant={selectedIcon === name ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedIcon(name)}
                      className="h-10 w-full p-0"
                      title={label}
                    >
                      <Icon className="h-4 w-4" />
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Smart Collection Configuration */}
            {collectionType === 'smart' && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="text-sm font-medium">Filter Configuration</h4>
                
                {/* Item Type Filter */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="filter-type" className="text-right">
                    Item Type
                  </Label>
                  <Select value={filterType} onValueChange={(value) => setFilterType(value as 'all' | 'notes' | 'chats')}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Items</SelectItem>
                      <SelectItem value="notes">Notes Only</SelectItem>
                      <SelectItem value="chats">Chats Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Time Range Filter */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="time-range" className="text-right">
                    Time Range
                  </Label>
                  <Select value={timeRange} onValueChange={(value) => setTimeRange(value as 'all' | '7days' | '30days' | 'custom')}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="7days">Last 7 Days</SelectItem>
                      <SelectItem value="30days">Last 30 Days</SelectItem>
                      <SelectItem value="custom">Custom Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Days Input */}
                {timeRange === 'custom' && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="custom-days" className="text-right">
                      Days
                    </Label>
                    <Input
                      id="custom-days"
                      type="number"
                      value={customDays}
                      onChange={(e) => setCustomDays(e.target.value)}
                      className="col-span-3"
                      min="1"
                      max="365"
                    />
                  </div>
                )}

                {/* Starred Only Filter */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="starred-only" className="text-right">
                    Starred Only
                  </Label>
                  <div className="col-span-3 flex items-center">
                    <Checkbox
                      id="starred-only"
                      checked={isStarredOnly}
                      onCheckedChange={(checked) => setIsStarredOnly(checked as boolean)}
                    />
                  </div>
                </div>

                {/* Sort Options */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="sort-by" className="text-right">
                    Sort By
                  </Label>
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'updatedAt' | 'createdAt' | 'title')}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="updatedAt">Last Updated</SelectItem>
                      <SelectItem value="createdAt">Date Created</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Order */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="sort-order" className="text-right">
                    Order
                  </Label>
                  <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'asc' | 'desc')}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Newest First</SelectItem>
                      <SelectItem value="asc">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} variant="default">
              {loading ? 'Creating...' : 'Create Collection'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 