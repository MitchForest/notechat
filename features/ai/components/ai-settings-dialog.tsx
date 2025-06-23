'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { usePreferencesStore, type Command } from '@/features/ai/stores/preferences-store'
import { useState, useEffect } from 'react'
import { Trash2, Edit2, Plus, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface AISettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AISettingsDialog({ open, onOpenChange }: AISettingsDialogProps) {
  const { 
    loadPreferences, 
    getCommands, 
    addCommand, 
    updateCommand, 
    deleteCommand, 
    toggleDefaultCommand,
    isLoading 
  } = usePreferencesStore()
  
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ label: '', prompt: '' })
  const [newCommand, setNewCommand] = useState({ label: '', prompt: '' })

  useEffect(() => {
    if (open) {
      loadPreferences()
    }
  }, [open, loadPreferences])

  const commands = getCommands()
  const defaultCommands = commands.filter((cmd: Command) => !cmd.isCustom)
  const customCommands = commands.filter((cmd: Command) => cmd.isCustom)

  const handleSaveEdit = async () => {
    if (!editingId || !editForm.label.trim() || !editForm.prompt.trim()) return
    
    await updateCommand(editingId, editForm)
    setEditingId(null)
    setEditForm({ label: '', prompt: '' })
  }

  const handleAddCommand = async () => {
    if (!newCommand.label.trim() || !newCommand.prompt.trim()) {
      toast.error('Please fill in both fields')
      return
    }
    
    await addCommand(newCommand)
    setNewCommand({ label: '', prompt: '' })
  }

  const handleStartEdit = (id: string, label: string, prompt: string) => {
    setEditingId(id)
    setEditForm({ label, prompt })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm({ label: '', prompt: '' })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Command Settings
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 pr-4">
            {/* Default Commands */}
            <div>
              <h3 className="text-sm font-medium mb-3">Default Commands</h3>
              <div className="space-y-2">
                {defaultCommands.map((cmd: Command) => (
                  <div key={cmd.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex-1">
                      <div className="font-medium">{cmd.label}</div>
                      <div className="text-sm text-muted-foreground">{cmd.prompt}</div>
                    </div>
                    <Switch
                      checked={!cmd.isHidden}
                      onCheckedChange={() => toggleDefaultCommand(cmd.id)}
                      aria-label={`Toggle ${cmd.label}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Commands */}
            <div>
              <h3 className="text-sm font-medium mb-3">Custom Commands</h3>
              <div className="space-y-2">
                {customCommands.map((cmd: Command) => (
                  <div key={cmd.id} className="p-3 rounded-lg border bg-card">
                    {editingId === cmd.id ? (
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor={`label-${cmd.id}`}>Command Name</Label>
                          <Input
                            id={`label-${cmd.id}`}
                            value={editForm.label}
                            onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                            placeholder="e.g., Make it funnier"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`prompt-${cmd.id}`}>AI Prompt</Label>
                          <Textarea
                            id={`prompt-${cmd.id}`}
                            value={editForm.prompt}
                            onChange={(e) => setEditForm({ ...editForm, prompt: e.target.value })}
                            placeholder="e.g., Rewrite this text to be more humorous and entertaining"
                            rows={2}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveEdit}>
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{cmd.label}</div>
                          <div className="text-sm text-muted-foreground">{cmd.prompt}</div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleStartEdit(cmd.id, cmd.label, cmd.prompt)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteCommand(cmd.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add New Command */}
                <div className="p-3 rounded-lg border border-dashed bg-muted/50">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="new-label">Command Name</Label>
                      <Input
                        id="new-label"
                        value={newCommand.label}
                        onChange={(e) => setNewCommand({ ...newCommand, label: e.target.value })}
                        placeholder="e.g., Make it funnier"
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-prompt">AI Prompt</Label>
                      <Textarea
                        id="new-prompt"
                        value={newCommand.prompt}
                        onChange={(e) => setNewCommand({ ...newCommand, prompt: e.target.value })}
                        placeholder="e.g., Rewrite this text to be more humorous and entertaining"
                        rows={2}
                      />
                    </div>
                    <Button 
                      onClick={handleAddCommand} 
                      disabled={!newCommand.label.trim() || !newCommand.prompt.trim()}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Command
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
} 