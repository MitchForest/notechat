# Epic 2: Enhance & Expand 🚀

## Overview
**Goal**: Add power user features and polish to create a best-in-class AI knowledge workspace  
**Duration**: 3 sprints (1.5 weeks)  
**Prerequisites**: Epic 1 completed (core features functional)  
**Outcome**: Advanced AI capabilities, keyboard-driven workflows, and professional polish

## Sprint 2.1: Slash Commands + Smart Collections

### Objectives
- Implement slash command system for text transformations
- Build AI-powered smart collections with dynamic rules
- Create a powerful, extensible command framework

### Feature F10: Slash Commands

#### Implementation Plan

**1. Slash Command Registry**
```typescript
// features/editor/commands/command-registry.ts
import { Editor } from "@tiptap/core"
import { generateText, generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

export interface SlashCommand {
  id: string
  name: string
  description: string
  icon: string
  shortcut?: string
  action: (editor: Editor, selection: string) => Promise<void>
}

class CommandRegistry {
  private commands: Map<string, SlashCommand> = new Map()
  
  constructor() {
    this.registerDefaultCommands()
  }
  
  private registerDefaultCommands() {
    this.register({
      id: "summarize",
      name: "Summarize",
      description: "Create a concise summary",
      icon: "📝",
      shortcut: "sum",
      action: async (editor, selection) => {
        const { text } = await generateText({
          model: openai("gpt-4-turbo"),
          prompt: `Summarize the following text concisely while preserving key information:\n\n${selection}`,
          maxTokens: 200,
        })
        
        editor.chain().focus().insertContent(text).run()
      },
    })
    
    this.register({
      id: "expand",
      name: "Expand",
      description: "Elaborate on the selection",
      icon: "🔍",
      shortcut: "exp",
      action: async (editor, selection) => {
        const { text } = await generateText({
          model: openai("gpt-4-turbo"),
          prompt: `Expand on the following text with more detail and examples:\n\n${selection}`,
          maxTokens: 500,
        })
        
        editor.chain().focus().insertContent(text).run()
      },
    })
    
    this.register({
      id: "bullets",
      name: "Convert to Bullets",
      description: "Transform into bullet points",
      icon: "• ",
      shortcut: "bul",
      action: async (editor, selection) => {
        const { object } = await generateObject({
          model: openai("gpt-4-turbo"),
          schema: z.object({
            bullets: z.array(z.string()),
          }),
          prompt: `Convert this text into clear bullet points:\n\n${selection}`,
        })
        
        const bulletList = object.bullets.map(b => `• ${b}`).join("\n")
        editor.chain().focus().insertContent(bulletList).run()
      },
    })
    
    this.register({
      id: "rewrite",
      name: "Rewrite",
      description: "Rewrite in a different style",
      icon: "✍️",
      shortcut: "rew",
      action: async (editor, selection) => {
        // This will open a submenu for style selection
        this.showRewriteOptions(editor, selection)
      },
    })
    
    this.register({
      id: "explain",
      name: "Explain Simply",
      description: "Explain like I'm five",
      icon: "💡",
      shortcut: "eli5",
      action: async (editor, selection) => {
        const { text } = await generateText({
          model: openai("gpt-4-turbo"),
          prompt: `Explain the following in simple terms that anyone can understand:\n\n${selection}`,
          maxTokens: 300,
        })
        
        editor.chain().focus().insertContent(text).run()
      },
    })
    
    this.register({
      id: "translate",
      name: "Translate",
      description: "Translate to another language",
      icon: "🌐",
      action: async (editor, selection) => {
        // This will open a language selector
        this.showLanguageOptions(editor, selection)
      },
    })
    
    this.register({
      id: "fix",
      name: "Fix Grammar & Style",
      description: "Correct grammar and improve style",
      icon: "✓",
      shortcut: "fix",
      action: async (editor, selection) => {
        const { text } = await generateText({
          model: openai("gpt-4-turbo"),
          prompt: `Fix grammar, spelling, and style issues in this text while preserving the original meaning:\n\n${selection}`,
          temperature: 0.3,
        })
        
        editor.chain().focus().insertContent(text).run()
      },
    })
  }
  
  register(command: SlashCommand) {
    this.commands.set(command.id, command)
  }
  
  getAll(): SlashCommand[] {
    return Array.from(this.commands.values())
  }
  
  search(query: string): SlashCommand[] {
    const normalizedQuery = query.toLowerCase()
    return this.getAll().filter(
      cmd =>
        cmd.name.toLowerCase().includes(normalizedQuery) ||
        cmd.description.toLowerCase().includes(normalizedQuery) ||
        cmd.shortcut?.toLowerCase().includes(normalizedQuery)
    )
  }
  
  execute(commandId: string, editor: Editor, selection: string) {
    const command = this.commands.get(commandId)
    if (command) {
      return command.action(editor, selection)
    }
    throw new Error(`Command ${commandId} not found`)
  }
}

export const commandRegistry = new CommandRegistry()
```

**2. Slash Command Extension**
```typescript
// features/editor/extensions/slash-command.ts
import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "prosemirror-state"
import { Decoration, DecorationSet } from "prosemirror-view"
import tippy from "tippy.js"
import { commandRegistry } from "../commands/command-registry"

export const SlashCommandExtension = Extension.create({
  name: "slashCommand",
  
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("slashCommand"),
        state: {
          init() {
            return {
              active: false,
              query: "",
              position: null,
              selectedIndex: 0,
            }
          },
          apply(tr, oldState, oldPluginState) {
            const meta = tr.getMeta(this)
            if (meta) return { ...oldPluginState, ...meta }
            
            // Check for slash pattern
            const { $from } = tr.selection
            const textBefore = $from.parent.textBetween(
              Math.max(0, $from.parentOffset - 50),
              $from.parentOffset
            )
            
            const match = textBefore.match(/\/(\w*)$/)
            
            if (match) {
              return {
                active: true,
                query: match[1],
                position: $from.pos - match[0].length,
                selectedIndex: 0,
              }
            }
            
            return {
              active: false,
              query: "",
              position: null,
              selectedIndex: 0,
            }
          },
        },
        props: {
          decorations(state) {
            const pluginState = this.getState(state)
            if (!pluginState.active) return DecorationSet.empty
            
            return DecorationSet.create(state.doc, [
              Decoration.inline(
                pluginState.position,
                pluginState.position + pluginState.query.length + 1,
                { class: "slash-command-highlight" }
              ),
            ])
          },
          handleKeyDown(view, event) {
            const state = this.getState(view.state)
            if (!state.active) return false
            
            const commands = commandRegistry.search(state.query)
            
            if (event.key === "ArrowUp") {
              event.preventDefault()
              const newIndex = Math.max(0, state.selectedIndex - 1)
              view.dispatch(
                view.state.tr.setMeta(this, { selectedIndex: newIndex })
              )
              return true
            }
            
            if (event.key === "ArrowDown") {
              event.preventDefault()
              const newIndex = Math.min(commands.length - 1, state.selectedIndex + 1)
              view.dispatch(
                view.state.tr.setMeta(this, { selectedIndex: newIndex })
              )
              return true
            }
            
            if (event.key === "Enter") {
              event.preventDefault()
              const command = commands[state.selectedIndex]
              if (command) {
                this.executeCommand(view, state, command)
              }
              return true
            }
            
            if (event.key === "Escape") {
              event.preventDefault()
              this.cancelCommand(view, state)
              return true
            }
            
            return false
          },
        },
        view() {
          return {
            update: (view) => {
              const state = this.getState(view.state)
              if (state.active) {
                this.showCommandMenu(view, state)
              } else {
                this.hideCommandMenu()
              }
            },
          }
        },
        
        // Helper methods
        showCommandMenu(view: any, state: any) {
          const commands = commandRegistry.search(state.query)
          if (commands.length === 0) return
          
          // Get position for menu
          const coords = view.coordsAtPos(state.position)
          
          // Create or update menu element
          let menu = document.getElementById("slash-command-menu")
          if (!menu) {
            menu = document.createElement("div")
            menu.id = "slash-command-menu"
            menu.className = "slash-command-menu glass"
            document.body.appendChild(menu)
          }
          
          // Render commands
          menu.innerHTML = commands
            .map(
              (cmd, idx) => `
                <div class="slash-command-item ${
                  idx === state.selectedIndex ? "selected" : ""
                }" data-command="${cmd.id}">
                  <span class="icon">${cmd.icon}</span>
                  <div class="content">
                    <div class="name">${cmd.name}</div>
                    <div class="description">${cmd.description}</div>
                  </div>
                  ${cmd.shortcut ? `<span class="shortcut">${cmd.shortcut}</span>` : ""}
                </div>
              `
            )
            .join("")
          
          // Position menu
          menu.style.position = "absolute"
          menu.style.left = `${coords.left}px`
          menu.style.top = `${coords.bottom + 5}px`
          menu.style.display = "block"
          
          // Add click handlers
          menu.querySelectorAll(".slash-command-item").forEach((item, idx) => {
            item.addEventListener("click", () => {
              this.executeCommand(view, state, commands[idx])
            })
          })
        },
        
        hideCommandMenu() {
          const menu = document.getElementById("slash-command-menu")
          if (menu) {
            menu.style.display = "none"
          }
        },
        
        async executeCommand(view: any, state: any, command: any) {
          // Get selection or current paragraph
          const { from, to } = view.state.selection
          let selection = view.state.doc.textBetween(from, to)
          
          if (!selection) {
            // Get current paragraph
            const $from = view.state.selection.$from
            selection = $from.parent.textContent
          }
          
          // Remove slash command text
          view.dispatch(
            view.state.tr.deleteRange(
              state.position,
              state.position + state.query.length + 1
            )
          )
          
          // Show loading state
          const loadingNode = view.state.schema.text("✨ Generating...")
          view.dispatch(
            view.state.tr.insertText("✨ Generating...", state.position)
          )
          
          try {
            // Execute command
            await commandRegistry.execute(command.id, view, selection)
          } catch (error) {
            console.error("Command failed:", error)
            // Remove loading text
            view.dispatch(
              view.state.tr.deleteRange(
                state.position,
                state.position + "✨ Generating...".length
              )
            )
          }
          
          // Reset state
          view.dispatch(
            view.state.tr.setMeta(this.key, {
              active: false,
              query: "",
              position: null,
              selectedIndex: 0,
            })
          )
        },
        
        cancelCommand(view: any, state: any) {
          view.dispatch(
            view.state.tr.setMeta(this.key, {
              active: false,
              query: "",
              position: null,
              selectedIndex: 0,
            })
          )
        },
      }),
    ]
  },
})

// CSS for slash commands
const slashCommandStyles = `
  .slash-command-menu {
    max-width: 400px;
    max-height: 300px;
    overflow-y: auto;
    padding: 0.5rem;
    border-radius: 0.5rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    z-index: 1000;
  }
  
  .slash-command-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.15s;
  }
  
  .slash-command-item:hover,
  .slash-command-item.selected {
    background: hsl(var(--accent));
  }
  
  .slash-command-item .icon {
    font-size: 1.25rem;
    width: 2rem;
    text-align: center;
  }
  
  .slash-command-item .content {
    flex: 1;
  }
  
  .slash-command-item .name {
    font-weight: 500;
  }
  
  .slash-command-item .description {
    font-size: 0.75rem;
    color: hsl(var(--muted-foreground));
  }
  
  .slash-command-item .shortcut {
    font-size: 0.75rem;
    padding: 0.125rem 0.375rem;
    background: hsl(var(--muted));
    border-radius: 0.25rem;
    font-family: var(--font-mono);
  }
  
  .slash-command-highlight {
    background: hsl(var(--accent) / 0.3);
    border-radius: 0.25rem;
  }
`
```

### Feature F11: Smart Collections

#### Implementation Plan

**1. Smart Collection Engine**
```typescript
// features/organization/services/smart-collections.ts
import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"
import { Note } from "@/types"

export interface SmartCollectionRule {
  id: string
  field: "title" | "content" | "tags" | "created" | "modified"
  operator: "contains" | "equals" | "startsWith" | "after" | "before"
  value: string
}

export interface SmartCollection {
  id: string
  name: string
  description: string
  icon: string
  rules: SmartCollectionRule[]
  suggestedNoteIds: string[]
  confirmedNoteIds: string[]
  rejectedNoteIds: string[]
}

class SmartCollectionEngine {
  async analyzeNotes(notes: Note[]) {
    // Use AI to find patterns and suggest collections
    const { object: analysis } = await generateObject({
      model: openai("gpt-4-turbo"),
      schema: z.object({
        patterns: z.array(
          z.object({
            name: z.string(),
            description: z.string(),
            icon: z.string(),
            commonKeywords: z.array(z.string()),
            noteIds: z.array(z.string()),
            confidence: z.number().min(0).max(1),
          })
        ),
      }),
      prompt: `Analyze these notes and identify natural groupings or collections:
      
      ${notes.map(n => `ID: ${n.id}\nTitle: ${n.title}\nContent preview: ${n.content.slice(0, 200)}...\nTags: ${n.tags?.join(", ")}\n`).join("\n---\n")}
      
      Find patterns based on:
      - Topic similarity
      - Project groupings
      - Content type (meeting notes, ideas, research, etc.)
      - Time-based patterns
      
      Suggest 3-5 meaningful collections with high confidence scores.`,
    })
    
    return analysis.patterns
  }
  
  evaluateNoteForCollection(
    note: Note,
    rules: SmartCollectionRule[]
  ): boolean {
    return rules.every(rule => {
      const noteValue = this.getNoteFieldValue(note, rule.field)
      
      switch (rule.operator) {
        case "contains":
          return noteValue.toLowerCase().includes(rule.value.toLowerCase())
        case "equals":
          return noteValue.toLowerCase() === rule.value.toLowerCase()
        case "startsWith":
          return noteValue.toLowerCase().startsWith(rule.value.toLowerCase())
        case "after":
          return new Date(noteValue) > new Date(rule.value)
        case "before":
          return new Date(noteValue) < new Date(rule.value)
        default:
          return false
      }
    })
  }
  
  private getNoteFieldValue(note: Note, field: string): string {
    switch (field) {
      case "title":
        return note.title
      case "content":
        return note.content
      case "tags":
        return note.tags?.join(" ") || ""
      case "created":
        return note.createdAt.toISOString()
      case "modified":
        return note.updatedAt.toISOString()
      default:
        return ""
    }
  }
  
  async suggestNewMembers(
    collection: SmartCollection,
    notes: Note[]
  ): Promise<string[]> {
    // Filter out already processed notes
    const candidateNotes = notes.filter(
      n =>
        !collection.confirmedNoteIds.includes(n.id) &&
        !collection.rejectedNoteIds.includes(n.id)
    )
    
    // Use rules first
    const ruleMatches = candidateNotes
      .filter(n => this.evaluateNoteForCollection(n, collection.rules))
      .map(n => n.id)
    
    // Use AI for fuzzy matching
    if (candidateNotes.length > 0 && collection.confirmedNoteIds.length > 0) {
      const confirmedNotes = notes.filter(n =>
        collection.confirmedNoteIds.includes(n.id)
      )
      
      const { object: suggestions } = await generateObject({
        model: openai("gpt-4-turbo"),
        schema: z.object({
          noteIds: z.array(z.string()),
        }),
        prompt: `Given this collection "${collection.name}" with description "${collection.description}", which contains these notes:
        
        ${confirmedNotes.map(n => `- ${n.title}`).join("\n")}
        
        Which of these candidate notes should also be included?
        
        ${candidateNotes.map(n => `ID: ${n.id} - ${n.title}`).join("\n")}
        
        Only include notes that strongly match the collection theme.`,
      })
      
      return [...new Set([...ruleMatches, ...suggestions.noteIds])]
    }
    
    return ruleMatches
  }
}

export const smartCollectionEngine = new SmartCollectionEngine()
```

**2. Smart Collection UI**
```typescript
// features/organization/components/smart-collection-creator.tsx
"use client"

import { useState } from "react"
import { Sparkles, Plus, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { smartCollectionEngine } from "../services/smart-collections"
import { useNotesStore } from "@/features/notes/stores/notes-store"
import { useSpacesStore } from "../stores/spaces-store"

interface SmartCollectionCreatorProps {
  spaceId: string
  onClose: () => void
}

export function SmartCollectionCreator({
  spaceId,
  onClose,
}: SmartCollectionCreatorProps) {
  const [mode, setMode] = useState<"ai" | "rules">("ai")
  const [analyzing, setAnalyzing] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null)
  const [rules, setRules] = useState<SmartCollectionRule[]>([])
  
  const { notes } = useNotesStore()
  const { createCollection } = useSpacesStore()
  
  const handleAIAnalysis = async () => {
    setAnalyzing(true)
    try {
      const patterns = await smartCollectionEngine.analyzeNotes(notes)
      setSuggestions(patterns)
    } catch (error) {
      console.error("Analysis failed:", error)
    } finally {
      setAnalyzing(false)
    }
  }
  
  const handleCreateFromSuggestion = async (suggestion: any) => {
    await createCollection(spaceId, {
      name: suggestion.name,
      type: "smart",
      icon: suggestion.icon,
      rules: suggestion.commonKeywords.map((keyword: string) => ({
        id: `rule-${Date.now()}-${Math.random()}`,
        field: "content",
        operator: "contains",
        value: keyword,
      })),
      noteIds: suggestion.noteIds,
    })
    
    onClose()
  }
  
  const addRule = () => {
    setRules([
      ...rules,
      {
        id: `rule-${Date.now()}`,
        field: "content",
        operator: "contains",
        value: "",
      },
    ])
  }
  
  const updateRule = (id: string, updates: Partial<SmartCollectionRule>) => {
    setRules(rules.map(r => (r.id === id ? { ...r, ...updates } : r)))
  }
  
  const removeRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id))
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Create Smart Collection</h3>
        <p className="text-sm text-muted-foreground">
          Let AI analyze your notes or define custom rules
        </p>
      </div>
      
      <div className="flex gap-2">
        <Button
          variant={mode === "ai" ? "default" : "outline"}
          onClick={() => setMode("ai")}
          className="flex-1"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          AI Suggestions
        </Button>
        <Button
          variant={mode === "rules" ? "default" : "outline"}
          onClick={() => setMode("rules")}
          className="flex-1"
        >
          Custom Rules
        </Button>
      </div>
      
      {mode === "ai" ? (
        <div className="space-y-4">
          {suggestions.length === 0 ? (
            <Card className="p-8 text-center">
              <Sparkles className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-4 text-muted-foreground">
                AI will analyze your notes to find natural groupings
              </p>
              <Button onClick={handleAIAnalysis} disabled={analyzing}>
                {analyzing ? "Analyzing..." : "Analyze Notes"}
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {suggestions.map((suggestion) => (
                <Card
                  key={suggestion.name}
                  className={cn(
                    "cursor-pointer p-4 transition-all",
                    selectedSuggestion?.name === suggestion.name &&
                      "ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedSuggestion(suggestion)}
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{suggestion.icon}</span>
                      <h4 className="font-medium">{suggestion.name}</h4>
                    </div>
                    <Badge variant="secondary">
                      {Math.round(suggestion.confidence * 100)}% match
                    </Badge>
                  </div>
                  <p className="mb-2 text-sm text-muted-foreground">
                    {suggestion.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{suggestion.noteIds.length} notes</span>
                    <span>
                      Keywords: {suggestion.commonKeywords.slice(0, 3).join(", ")}
                    </span>
                  </div>
                  {selectedSuggestion?.name === suggestion.name && (
                    <Button
                      className="mt-3 w-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCreateFromSuggestion(suggestion)
                      }}
                    >
                      Create Collection
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Collection Name</Label>
            <Input id="name" placeholder="Project Ideas" />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Notes related to project planning and ideation"
            />
          </div>
          
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Rules</Label>
              <Button variant="outline" size="sm" onClick={addRule}>
                <Plus className="mr-1 h-3 w-3" />
                Add Rule
              </Button>
            </div>
            
            <div className="space-y-2">
              {rules.map((rule) => (
                <div key={rule.id} className="flex gap-2">
                  <Select
                    value={rule.field}
                    onValueChange={(value) =>
                      updateRule(rule.id, { field: value as any })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="title">Title</SelectItem>
                      <SelectItem value="content">Content</SelectItem>
                      <SelectItem value="tags">Tags</SelectItem>
                      <SelectItem value="created">Created</SelectItem>
                      <SelectItem value="modified">Modified</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={rule.operator}
                    onValueChange={(value) =>
                      updateRule(rule.id, { operator: value as any })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="startsWith">Starts with</SelectItem>
                      {rule.field === "created" || rule.field === "modified" ? (
                        <>
                          <SelectItem value="after">After</SelectItem>
                          <SelectItem value="before">Before</SelectItem>
                        </>
                      ) : null}
                    </SelectContent>
                  </Select>
                  
                  <Input
                    value={rule.value}
                    onChange={(e) =>
                      updateRule(rule.id, { value: e.target.value })
                    }
                    placeholder="Value"
                    className="flex-1"
                  />
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRule(rule.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {rules.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  No rules defined. Add rules to automatically organize notes.
                </p>
              )}
            </div>
          </div>
          
          <Button className="w-full" disabled={rules.length === 0}>
            Create Smart Collection
          </Button>
        </div>
      )}
    </div>
  )
}
```

**3. Smart Collection Suggestions**
```typescript
// features/organization/components/smart-collection-suggestions.tsx
"use client"

import { useEffect, useState } from "react"
import { Sparkles, Check, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { smartCollectionEngine } from "../services/smart-collections"
import { useNotesStore } from "@/features/notes/stores/notes-store"

interface SmartCollectionSuggestionsProps {
  collection: SmartCollection
  onAccept: (noteId: string) => void
  onReject: (noteId: string) => void
}

export function SmartCollectionSuggestions({
  collection,
  onAccept,
  onReject,
}: SmartCollectionSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const { notes } = useNotesStore()
  
  useEffect(() => {
    const loadSuggestions = async () => {
      setLoading(true)
      try {
        const noteIds = await smartCollectionEngine.suggestNewMembers(
          collection,
          notes
        )
        setSuggestions(noteIds)
      } catch (error) {
        console.error("Failed to load suggestions:", error)
      } finally {
        setLoading(false)
      }
    }
    
    loadSuggestions()
  }, [collection, notes])
  
  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 animate-pulse" />
          <span className="text-sm">Finding notes for this collection...</span>
        </div>
      </Card>
    )
  }
  
  if (suggestions.length === 0) {
    return null
  }
  
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-ai-primary" />
          <span className="font-medium">Suggested Notes</span>
        </div>
        <Badge variant="secondary">{suggestions.length} found</Badge>
      </div>
      
      <ScrollArea className="max-h-48">
        <div className="space-y-2">
          {suggestions.map((noteId) => {
            const note = notes.find((n) => n.id === noteId)
            if (!note) return null
            
            return (
              <div
                key={noteId}
                className="flex items-center justify-between rounded-lg border p-2"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{note.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {note.content}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onAccept(noteId)}
                  >
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onReject(noteId)}
                  >
                    <X className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </Card>
  )
}
```

### Testing for Sprint 2.1
- [ ] Slash command menu appears on typing /
- [ ] All commands execute correctly
- [ ] Commands work with selection or current paragraph
- [ ] Loading state shows during generation
- [ ] Arrow keys navigate command menu
- [ ] Smart collection AI analysis works
- [ ] Rules-based collections filter correctly
- [ ] Suggestions appear for existing collections
- [ ] Accept/reject suggestions updates collection
- [ ] Performance: Command menu renders <50ms

---

## Sprint 2.2: Multi-Note Context + Keyboard Shortcuts

### Objectives
- Enable referencing multiple notes in chat conversations
- Implement comprehensive keyboard shortcuts
- Create power user workflows

### Feature F12: Multi-Note Chat Context

#### Implementation Plan

**1. Note Reference System**
```typescript
// features/chat/services/note-references.ts
import { Note } from "@/types"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export class NoteReferenceManager {
  private referencedNotes: Map<string, Note> = new Map()
  private maxNotes = 5
  
  addNote(note: Note): boolean {
    if (this.referencedNotes.size >= this.maxNotes) {
      return false
    }
    
    this.referencedNotes.set(note.id, note)
    return true
  }
  
  removeNote(noteId: string): void {
    this.referencedNotes.delete(noteId)
  }
  
  getNotes(): Note[] {
    return Array.from(this.referencedNotes.values())
  }
  
  getContext(): string {
    const notes = this.getNotes()
    if (notes.length === 0) return ""
    
    return notes
      .map(
        (note) =>
          `Note: "${note.title}"\nContent: ${note.content.slice(0, 500)}...\n`
      )
      .join("\n---\n")
  }
  
  async generateContextSummary(): Promise<string> {
    const notes = this.getNotes()
    if (notes.length === 0) return ""
    
    const { text } = await generateText({
      model: openai("gpt-4-turbo"),
      prompt: `Summarize the key information from these ${notes.length} notes that might be relevant for a conversation:
      
      ${this.getContext()}
      
      Provide a brief summary that captures the main themes and important details.`,
      maxTokens: 200,
    })
    
    return text
  }
  
  findRelevantSections(query: string): string {
    // Use embeddings or keyword matching to find relevant sections
    // For now, simple keyword matching
    const keywords = query.toLowerCase().split(" ")
    const relevantSections: string[] = []
    
    this.getNotes().forEach((note) => {
      const content = note.content.toLowerCase()
      const sentences = note.content.split(/[.!?]+/)
      
      sentences.forEach((sentence) => {
        const sentenceLower = sentence.toLowerCase()
        const matchCount = keywords.filter((kw) =>
          sentenceLower.includes(kw)
        ).length
        
        if (matchCount >= Math.ceil(keywords.length / 2)) {
          relevantSections.push(
            `From "${note.title}": ${sentence.trim()}`
          )
        }
      })
    })
    
    return relevantSections.slice(0, 5).join("\n\n")
  }
}
```

**2. Note Reference UI**
```typescript
// features/chat/components/note-reference-panel.tsx
"use client"

import { useState } from "react"
import { X, FileText, Maximize2, Minimize2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Note } from "@/types"
import { cn } from "@/lib/utils"

interface NoteReferencePanelProps {
  notes: Note[]
  onRemove: (noteId: string) => void
  onOpen: (noteId: string) => void
  maxNotes?: number
}

export function NoteReferencePanel({
  notes,
  onRemove,
  onOpen,
  maxNotes = 5,
}: NoteReferencePanelProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  
  if (notes.length === 0) return null
  
  return (
    <div className="mb-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Referenced Notes ({notes.length}/{maxNotes})
        </span>
      </div>
      
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {notes.map((note) => (
          <Card
            key={note.id}
            className={cn(
              "group relative overflow-hidden transition-all",
              expanded === note.id && "sm:col-span-2 lg:col-span-3"
            )}
          >
            <div className="p-3">
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-medium line-clamp-1">
                    {note.title}
                  </h4>
                </div>
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          setExpanded(expanded === note.id ? null : note.id)
                        }
                      >
                        {expanded === note.id ? (
                          <Minimize2 className="h-3 w-3" />
                        ) : (
                          <Maximize2 className="h-3 w-3" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {expanded === note.id ? "Collapse" : "Expand"}
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onRemove(note.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Remove reference</TooltipContent>
                  </Tooltip>
                </div>
              </div>
              
              <ScrollArea
                className={cn(
                  "transition-all",
                  expanded === note.id ? "max-h-48" : "max-h-16"
                )}
              >
                <p className="text-xs text-muted-foreground">
                  {note.content}
                </p>
              </ScrollArea>
              
              {note.tags && note.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {note.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {note.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{note.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-7 w-full text-xs"
                onClick={() => onOpen(note.id)}
              >
                Open in panel →
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

**3. @Mention System**
```typescript
// features/chat/components/mention-input.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { FileText } from "lucide-react"
import { useNotesStore } from "@/features/notes/stores/notes-store"
import Fuse from "fuse.js"

interface MentionInputProps {
  value: string
  onChange: (value: string) => void
  onMention: (noteId: string) => void
  placeholder?: string
  disabled?: boolean
}

export function MentionInput({
  value,
  onChange,
  onMention,
  placeholder,
  disabled,
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState("")
  const [mentionPosition, setMentionPosition] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { notes } = useNotesStore()
  
  const fuse = new Fuse(notes, {
    keys: ["title", "content"],
    threshold: 0.3,
  })
  
  const suggestions = mentionQuery
    ? fuse.search(mentionQuery).slice(0, 5)
    : notes.slice(0, 5)
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showSuggestions) return
      
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex(Math.max(0, selectedIndex - 1))
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex(Math.min(suggestions.length - 1, selectedIndex + 1))
      } else if (e.key === "Enter") {
        e.preventDefault()
        const selected = suggestions[selectedIndex]
        if (selected) {
          insertMention(selected.item || selected)
        }
      } else if (e.key === "Escape") {
        setShowSuggestions(false)
      }
    }
    
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [showSuggestions, selectedIndex, suggestions])
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursorPos = e.target.selectionStart
    
    // Check for @ symbol
    const textBeforeCursor = newValue.slice(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf("@")
    
    if (lastAtIndex !== -1 && lastAtIndex === cursorPos - 1) {
      // Just typed @
      setShowSuggestions(true)
      setMentionQuery("")
      setMentionPosition(lastAtIndex)
      setSelectedIndex(0)
    } else if (
      showSuggestions &&
      lastAtIndex !== -1 &&
      lastAtIndex >= mentionPosition
    ) {
      // Continue typing after @
      const query = textBeforeCursor.slice(lastAtIndex + 1)
      if (query.includes(" ")) {
        setShowSuggestions(false)
      } else {
        setMentionQuery(query)
      }
    } else {
      setShowSuggestions(false)
    }
    
    onChange(newValue)
  }
  
  const insertMention = (note: Note) => {
    const beforeMention = value.slice(0, mentionPosition)
    const afterMention = value.slice(
      mentionPosition + mentionQuery.length + 1
    )
    const newValue = `${beforeMention}@${note.title} ${afterMention}`
    
    onChange(newValue)
    onMention(note.id)
    setShowSuggestions(false)
    
    // Focus back to input
    setTimeout(() => {
      inputRef.current?.focus()
      const newCursorPos = beforeMention.length + note.title.length + 2
      inputRef.current?.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }
  
  return (
    <div className="relative">
      <textarea
        ref={inputRef}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className="min-h-[80px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
      
      {showSuggestions && (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-full max-w-sm rounded-md border bg-popover p-1 shadow-md">
          <div className="text-xs font-medium text-muted-foreground px-2 py-1">
            Type to search notes
          </div>
          {suggestions.map((result, index) => {
            const note = result.item || result
            return (
              <button
                key={note.id}
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent",
                  index === selectedIndex && "bg-accent"
                )}
                onClick={() => insertMention(note)}
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 overflow-hidden">
                  <div className="font-medium line-clamp-1">{note.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">
                    {note.content}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

### Feature F13: Keyboard Shortcuts

#### Implementation Plan

**1. Keyboard Shortcuts Manager**
```typescript
// lib/keyboard/shortcuts-manager.ts
import { toast } from "@/components/ui/use-toast"

export interface KeyboardShortcut {
  id: string
  name: string
  description: string
  keys: string[]
  action: () => void | Promise<void>
  category: "navigation" | "editing" | "ai" | "organization"
  enabled: boolean
}

class KeyboardShortcutsManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map()
  private activeKeys: Set<string> = new Set()
  private enabled = true
  
  constructor() {
    this.setupEventListeners()
  }
  
  private setupEventListeners() {
    document.addEventListener("keydown", this.handleKeyDown.bind(this))
    document.addEventListener("keyup", this.handleKeyUp.bind(this))
    document.addEventListener("blur", this.clearActiveKeys.bind(this))
  }
  
  private handleKeyDown(e: KeyboardEvent) {
    if (!this.enabled) return
    
    // Don't trigger in input fields unless it's a global shortcut
    const target = e.target as HTMLElement
    const isInput =
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.contentEditable === "true"
    
    const key = this.normalizeKey(e)
    this.activeKeys.add(key)
    
    // Check for matching shortcuts
    for (const shortcut of this.shortcuts.values()) {
      if (!shortcut.enabled) continue
      
      const isGlobalShortcut = shortcut.keys.includes("cmd") || 
                               shortcut.keys.includes("ctrl")
      
      if (isInput && !isGlobalShortcut) continue
      
      if (this.matchesShortcut(shortcut)) {
        e.preventDefault()
        e.stopPropagation()
        
        try {
          Promise.resolve(shortcut.action()).catch((error) => {
            console.error(`Shortcut ${shortcut.id} failed:`, error)
            toast({
              title: "Shortcut failed",
              description: error.message,
              variant: "destructive",
            })
          })
        } catch (error) {
          console.error(`Shortcut ${shortcut.id} failed:`, error)
        }
        
        break
      }
    }
  }
  
  private handleKeyUp(e: KeyboardEvent) {
    const key = this.normalizeKey(e)
    this.activeKeys.delete(key)
  }
  
  private clearActiveKeys() {
    this.activeKeys.clear()
  }
  
  private normalizeKey(e: KeyboardEvent): string {
    if (e.key === "Control") return "ctrl"
    if (e.key === "Meta") return "cmd"
    if (e.key === "Alt") return "alt"
    if (e.key === "Shift") return "shift"
    if (e.key === " ") return "space"
    return e.key.toLowerCase()
  }
  
  private matchesShortcut(shortcut: KeyboardShortcut): boolean {
    // All shortcut keys must be pressed
    for (const key of shortcut.keys) {
      if (!this.activeKeys.has(key)) return false
    }
    
    // No extra modifier keys should be pressed
    const modifiers = ["cmd", "ctrl", "alt", "shift"]
    for (const mod of modifiers) {
      if (this.activeKeys.has(mod) && !shortcut.keys.includes(mod)) {
        return false
      }
    }
    
    return true
  }
  
  register(shortcut: KeyboardShortcut) {
    this.shortcuts.set(shortcut.id, shortcut)
  }
  
  unregister(id: string) {
    this.shortcuts.delete(id)
  }
  
  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }
  
  getShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values())
  }
  
  getShortcutsByCategory(category: string): KeyboardShortcut[] {
    return this.getShortcuts().filter((s) => s.category === category)
  }
}

export const shortcutsManager = new KeyboardShortcutsManager()
```

**2. Default Shortcuts Configuration**
```typescript
// lib/keyboard/default-shortcuts.ts
import { shortcutsManager } from "./shortcuts-manager"
import { commandPalette } from "@/features/search/services/command-palette"
import { notesStore } from "@/features/notes/stores/notes-store"
import { chatStore } from "@/features/chat/stores/chat-store"
import { router } from "next/navigation"

export function registerDefaultShortcuts() {
  // Navigation shortcuts
  shortcutsManager.register({
    id: "command-palette",
    name: "Command Palette",
    description: "Open command palette",
    keys: ["cmd", "k"],
    category: "navigation",
    enabled: true,
    action: () => commandPalette.open(),
  })
  
  shortcutsManager.register({
    id: "search",
    name: "Search",
    description: "Focus on search",
    keys: ["cmd", "shift", "f"],
    category: "navigation",
    enabled: true,
    action: () => {
      const searchInput = document.querySelector(
        'input[placeholder="Search..."]'
      ) as HTMLInputElement
      searchInput?.focus()
    },
  })
  
  shortcutsManager.register({
    id: "new-note",
    name: "New Note",
    description: "Create a new note",
    keys: ["cmd", "n"],
    category: "navigation",
    enabled: true,
    action: () => notesStore.createNote(),
  })
  
  shortcutsManager.register({
    id: "new-chat",
    name: "New Chat",
    description: "Start a new chat",
    keys: ["cmd", "shift", "n"],
    category: "navigation",
    enabled: true,
    action: () => chatStore.createChat(),
  })
  
  shortcutsManager.register({
    id: "toggle-sidebar",
    name: "Toggle Sidebar",
    description: "Show/hide sidebar",
    keys: ["cmd", "\\"],
    category: "navigation",
    enabled: true,
    action: () => {
      document.dispatchEvent(new CustomEvent("toggle-sidebar"))
    },
  })
  
  shortcutsManager.register({
    id: "toggle-chat",
    name: "Toggle Chat Panel",
    description: "Show/hide chat panel",
    keys: ["cmd", "/"],
    category: "navigation",
    enabled: true,
    action: () => {
      document.dispatchEvent(new CustomEvent("toggle-chat-panel"))
    },
  })
  
  // Editing shortcuts
  shortcutsManager.register({
    id: "save",
    name: "Save",
    description: "Save current note",
    keys: ["cmd", "s"],
    category: "editing",
    enabled: true,
    action: () => notesStore.saveCurrentNote(),
  })
  
  shortcutsManager.register({
    id: "undo",
    name: "Undo",
    description: "Undo last action",
    keys: ["cmd", "z"],
    category: "editing",
    enabled: true,
    action: () => {
      document.execCommand("undo")
    },
  })
  
  shortcutsManager.register({
    id: "redo",
    name: "Redo",
    description: "Redo last action",
    keys: ["cmd", "shift", "z"],
    category: "editing",
    enabled: true,
    action: () => {
      document.execCommand("redo")
    },
  })
  
  // AI shortcuts
  shortcutsManager.register({
    id: "send-to-chat",
    name: "Send to Chat",
    description: "Send selection to AI chat",
    keys: ["cmd", "enter"],
    category: "ai",
    enabled: true,
    action: () => {
      const selection = window.getSelection()?.toString()
      if (selection) {
        document.dispatchEvent(
          new CustomEvent("send-to-chat", { detail: selection })
        )
      }
    },
  })
  
  shortcutsManager.register({
    id: "continue-writing",
    name: "Continue Writing",
    description: "AI continues from cursor",
    keys: ["cmd", "j"],
    category: "ai",
    enabled: true,
    action: () => {
      document.dispatchEvent(new CustomEvent("continue-writing"))
    },
  })
  
  shortcutsManager.register({
    id: "accept-suggestion",
    name: "Accept Suggestion",
    description: "Accept AI suggestion",
    keys: ["tab"],
    category: "ai",
    enabled: true,
    action: () => {
      document.dispatchEvent(new CustomEvent("accept-suggestion"))
    },
  })
  
  // Organization shortcuts
  shortcutsManager.register({
    id: "quick-move",
    name: "Quick Move",
    description: "Move note to collection",
    keys: ["cmd", "shift", "m"],
    category: "organization",
    enabled: true,
    action: () => {
      document.dispatchEvent(new CustomEvent("quick-move"))
    },
  })
  
  shortcutsManager.register({
    id: "star-note",
    name: "Star/Unstar",
    description: "Toggle star on current note",
    keys: ["cmd", "shift", "s"],
    category: "organization",
    enabled: true,
    action: () => {
      notesStore.toggleStar()
    },
  })
  
  // Quick switching
  for (let i = 1; i <= 9; i++) {
    shortcutsManager.register({
      id: `switch-space-${i}`,
      name: `Switch to Space ${i}`,
      description: `Quick switch to space ${i}`,
      keys: ["cmd", i.toString()],
      category: "navigation",
      enabled: true,
      action: () => {
        const spaces = spacesStore.getState().spaces
        if (spaces[i - 1]) {
          spacesStore.setActiveSpace(spaces[i - 1].id)
        }
      },
    })
  }
}
```

**3. Shortcuts Help Dialog**
```typescript
// features/keyboard/components/shortcuts-dialog.tsx
"use client"

import { useState } from "react"
import { Keyboard, Search } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { shortcutsManager } from "@/lib/keyboard/shortcuts-manager"

interface ShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
  const [search, setSearch] = useState("")
  const shortcuts = shortcutsManager.getShortcuts()
  
  const categories = [
    { id: "navigation", label: "Navigation", icon: "🧭" },
    { id: "editing", label: "Editing", icon: "✏️" },
    { id: "ai", label: "AI Features", icon: "✨" },
    { id: "organization", label: "Organization", icon: "📁" },
  ]
  
  const filteredShortcuts = shortcuts.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase()) ||
      s.keys.join(" ").toLowerCase().includes(search.toLowerCase())
  )
  
  const formatKeys = (keys: string[]) => {
    return keys.map((key) => {
      switch (key) {
        case "cmd":
          return "⌘"
        case "ctrl":
          return "Ctrl"
        case "alt":
          return "⌥"
        case "shift":
          return "⇧"
        case "enter":
          return "↵"
        case "space":
          return "Space"
        case "escape":
          return "Esc"
        default:
          return key.toUpperCase()
      }
    })
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Quick reference for all keyboard shortcuts
          </DialogDescription>
        </DialogHeader>
        
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search shortcuts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            {categories.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.id}>
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <ScrollArea className="h-[400px] w-full">
            <TabsContent value="all" className="space-y-4">
              {categories.map((category) => {
                const categoryShortcuts = filteredShortcuts.filter(
                  (s) => s.category === category.id
                )
                
                if (categoryShortcuts.length === 0) return null
                
                return (
                  <div key={category.id}>
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <span>{category.icon}</span>
                      {category.label}
                    </h3>
                    <div className="space-y-2">
                      {categoryShortcuts.map((shortcut) => (
                        <ShortcutItem
                          key={shortcut.id}
                          shortcut={shortcut}
                          formatKeys={formatKeys}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </TabsContent>
            
            {categories.map((category) => (
              <TabsContent
                key={category.id}
                value={category.id}
                className="space-y-2"
              >
                {filteredShortcuts
                  .filter((s) => s.category === category.id)
                  .map((shortcut) => (
                    <ShortcutItem
                      key={shortcut.id}
                      shortcut={shortcut}
                      formatKeys={formatKeys}
                    />
                  ))}
              </TabsContent>
            ))}
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function ShortcutItem({
  shortcut,
  formatKeys,
}: {
  shortcut: KeyboardShortcut
  formatKeys: (keys: string[]) => string[]
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div>
        <div className="font-medium">{shortcut.name}</div>
        <div className="text-sm text-muted-foreground">
          {shortcut.description}
        </div>
      </div>
      <div className="flex gap-1">
        {formatKeys(shortcut.keys).map((key, idx) => (
          <Badge
            key={idx}
            variant="secondary"
            className="font-mono text-xs"
          >
            {key}
          </Badge>
        ))}
      </div>
    </div>
  )
}