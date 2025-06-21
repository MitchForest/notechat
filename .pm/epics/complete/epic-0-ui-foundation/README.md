# Epic 0: UI/UX Foundation 🎨

## Overview
**Goal**: Establish a complete, beautiful UI foundation with zero errors before any feature development  
**Duration**: 2 sprints (1 week each)  
**Outcome**: A fully functional UI shell with navigation, theme system, and layout components ready for features

## Sprint 0.1: Project Setup & Design System

### Objectives
- Complete project initialization with all dependencies
- Implement dark/light theme system with turquoise/pink accents
- Create base component library with shadcn/ui
- Set up global styles and design tokens

### Tasks

#### 1. Project Initialization
```bash
# Create Next.js project with TypeScript and Tailwind
bunx create-next-app@latest ai-notes --typescript --tailwind --app --no-src

# Install core dependencies
bun add @ai-sdk/openai ai @supabase/supabase-js drizzle-orm
bun add react-resizable-panels @radix-ui/themes class-variance-authority clsx
bun add -d drizzle-kit @types/node

# Install shadcn/ui CLI and components
bunx shadcn-ui@latest init
bunx shadcn-ui@latest add button card dialog dropdown-menu input label
bunx shadcn-ui@latest add popover select separator sheet skeleton toast
bunx shadcn-ui@latest add tooltip avatar badge command scroll-area

# Install editor and AI dependencies (for later)
bun add novel @tiptap/react @tiptap/starter-kit typo-js
bun add retext retext-english retext-spell retext-repeated-words retext-indefinite-article
bun add fuse.js @dnd-kit/sortable @dnd-kit/core @dnd-kit/utilities

# Install auth dependencies
bun add arctic jose
```

#### 2. Project Structure Setup
```
ai-notes/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── logout/
│   ├── (dashboard)/
│   │   ├── layout.tsx      # Main app layout with sidebar
│   │   └── page.tsx        # Default workspace view
│   ├── api/
│   │   ├── auth/
│   │   └── health/
│   ├── globals.css         # Design tokens
│   ├── layout.tsx          # Root layout
│   └── page.tsx           # Landing page
├── components/
│   ├── ui/                # shadcn components
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   └── panels.tsx
│   └── theme/
│       ├── theme-provider.tsx
│       └── theme-toggle.tsx
├── features/              # Empty, ready for features
├── lib/
│   ├── utils.ts          # cn() helper
│   └── constants.ts      # App constants
├── hooks/
│   ├── use-theme.ts
│   └── use-media-query.ts
└── types/
    └── index.ts          # Global types
```

#### 3. Design System Implementation

**app/globals.css**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Light mode colors */
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 3.9%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96.1%;
    --secondary-foreground: 0 0% 9%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --accent: 0 0% 96.1%;
    --accent-foreground: 0 0% 9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --ring: 0 0% 3.9%;
    --radius: 0.5rem;
    
    /* AI accent colors */
    --ai-primary: 186 93% 44%;      /* #06B6D4 Turquoise */
    --ai-secondary: 330 81% 60%;     /* #EC4899 Pink */
    --ai-gradient: linear-gradient(135deg, hsl(186, 93%, 44%) 0%, hsl(330, 81%, 60%) 100%);
    
    /* Custom colors */
    --success: 142 71% 45%;
    --warning: 38 92% 50%;
    --error: 0 84% 60%;
  }

  .dark {
    /* Dark mode colors */
    --background: 0 0% 3.9%;         /* #0a0a0a Near-black */
    --foreground: 0 0% 98%;
    --card: 0 0% 7.8%;               /* #141414 Elevated surface */
    --card-foreground: 0 0% 98%;
    --popover: 0 0% 7.8%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 9%;
    --secondary: 0 0% 14.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 14.9%;
    --muted-foreground: 0 0% 63.9%;
    --accent: 0 0% 14.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 14.9%;            /* #262626 Subtle borders */
    --input: 0 0% 14.9%;
    --ring: 0 0% 83.1%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  
  /* Editor and code font */
  .font-mono {
    font-family: 'JetBrains Mono', 'SF Mono', 'Consolas', monospace;
  }
}

@layer components {
  /* Glass morphism effect */
  .glass {
    @apply bg-background/50 backdrop-blur-lg border border-border/50;
  }
  
  /* AI gradient text */
  .ai-gradient-text {
    @apply bg-gradient-to-r from-[hsl(var(--ai-primary))] to-[hsl(var(--ai-secondary))] bg-clip-text text-transparent;
  }
  
  /* AI gradient background */
  .ai-gradient-bg {
    background: var(--ai-gradient);
  }
  
  /* Smooth transitions */
  .transition-smooth {
    @apply transition-all duration-200 ease-in-out;
  }
}

/* Custom scrollbar */
@layer utilities {
  .scrollbar-thin {
    scrollbar-width: thin;
    scrollbar-color: hsl(var(--muted-foreground) / 0.3) transparent;
  }
  
  .scrollbar-thin::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  .scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background-color: hsl(var(--muted-foreground) / 0.3);
    border-radius: 3px;
  }
  
  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background-color: hsl(var(--muted-foreground) / 0.5);
  }
}
```

#### 4. Theme Provider Setup
```typescript
// components/theme/theme-provider.tsx
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

// components/theme/theme-toggle.tsx
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="transition-smooth"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
```

### Deliverables
- ✅ Complete project structure with no errors
- ✅ Dark/light theme system with smooth transitions
- ✅ Design tokens in CSS variables
- ✅ Base component library installed
- ✅ Typography system (Inter + JetBrains Mono)
- ✅ Glass morphism and AI gradient utilities

---

## Sprint 0.2: Layout & Navigation System

### Objectives
- Implement complete sidebar navigation with drag & drop
- Create resizable panel system for chat/notes
- Build organizational structure (spaces, collections)
- Add search interface and command palette

### Tasks

#### 1. Sidebar Navigation Component
```typescript
// components/layout/sidebar.tsx
"use client"

import { useState } from "react"
import { Plus, Search, ChevronDown, ChevronRight, Star, Clock, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const [spaces, setSpaces] = useState([
    { id: "all", name: "All Notes", icon: "🌐", expanded: true },
    { id: "work", name: "Work", icon: "💼", expanded: false },
    { id: "school", name: "School", icon: "🎓", expanded: false },
    { id: "personal", name: "Personal", icon: "🏠", expanded: false },
  ])
  
  const [activeChats, setActiveChats] = useState([
    { id: "chat-1", name: "Current conversation" },
    { id: "chat-2", name: "Python help" },
  ])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  return (
    <div className={cn("flex h-full w-64 flex-col border-r bg-card", className)}>
      {/* Action Buttons */}
      <div className="flex gap-2 p-4">
        <Button size="sm" className="flex-1">
          <Plus className="mr-1 h-4 w-4" />
          New Note
        </Button>
        <Button size="sm" variant="outline" className="flex-1">
          <Plus className="mr-1 h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Search */}
      <div className="px-4 pb-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-8"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 px-2">
        {/* Active Chats */}
        <div className="mb-4">
          <h3 className="mb-2 px-2 text-sm font-semibold text-muted-foreground">
            💬 Active Chats ({activeChats.length})
          </h3>
          <div className="space-y-1">
            {activeChats.map((chat) => (
              <Button
                key={chat.id}
                variant="ghost"
                size="sm"
                className="w-full justify-start"
              >
                <span className="truncate">{chat.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Spaces */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
        >
          <div className="space-y-2">
            {spaces.map((space) => (
              <div key={space.id}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setSpaces(spaces.map(s => 
                      s.id === space.id ? { ...s, expanded: !s.expanded } : s
                    ))
                  }}
                >
                  {space.expanded ? (
                    <ChevronDown className="mr-1 h-4 w-4" />
                  ) : (
                    <ChevronRight className="mr-1 h-4 w-4" />
                  )}
                  <span className="mr-2">{space.icon}</span>
                  <span className="flex-1 text-left">{space.name}</span>
                </Button>
                
                {space.expanded && (
                  <div className="ml-4 space-y-1">
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <Clock className="mr-2 h-4 w-4" />
                      Recent
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <Star className="mr-2 h-4 w-4" />
                      Favorites
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </DndContext>
      </ScrollArea>

      {/* Bottom Actions */}
      <div className="border-t p-2">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="flex-1">
            <Plus className="mr-1 h-4 w-4" />
            New Space
          </Button>
          <Button variant="ghost" size="icon">
            ⚙️
          </Button>
        </div>
      </div>
    </div>
  )
}
```

#### 2. Resizable Panels Layout
```typescript
// components/layout/panels.tsx
"use client"

import { ReactNode } from "react"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

interface PanelsProps {
  defaultLayout?: number[]
  children: [ReactNode, ReactNode]
}

export function Panels({ defaultLayout = [60, 40], children }: PanelsProps) {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full"
    >
      <ResizablePanel defaultSize={defaultLayout[0]} minSize={30}>
        <div className="h-full overflow-auto scrollbar-thin">
          {children[0]}
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={defaultLayout[1]} minSize={20}>
        <div className="h-full overflow-auto scrollbar-thin">
          {children[1]}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
```

#### 3. Main Dashboard Layout
```typescript
// app/(dashboard)/layout.tsx
import { Sidebar } from "@/components/layout/sidebar"
import { Panels } from "@/components/layout/panels"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}

// app/(dashboard)/page.tsx
import { Panels } from "@/components/layout/panels"

export default function DashboardPage() {
  return (
    <Panels>
      <div className="p-8">
        <div className="glass rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-semibold">Welcome to AI Notes</h2>
          <p className="text-muted-foreground">
            Start a new chat or create a note to begin your knowledge journey.
          </p>
        </div>
      </div>
      <div className="border-l p-8">
        <div className="glass rounded-lg border p-6">
          <h3 className="mb-4 text-lg font-semibold">AI Assistant</h3>
          <p className="text-muted-foreground">
            Your AI collaborator will appear here when you start writing or chatting.
          </p>
        </div>
      </div>
    </Panels>
  )
}
```

#### 4. Command Palette (Cmd+K)
```typescript
// components/command-palette.tsx
"use client"

import { useEffect, useState } from "react"
import { Command } from "cmdk"
import { Search, FileText, MessageSquare, FolderPlus } from "lucide-react"

export function CommandPalette() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
    >
      <div className="glass w-full max-w-2xl rounded-lg border shadow-2xl">
        <Command.Input
          placeholder="Search or type a command..."
          className="w-full border-0 bg-transparent p-4 text-lg outline-none"
        />
        <Command.List className="max-h-[400px] overflow-auto p-2">
          <Command.Group heading="Actions" className="mb-2">
            <Command.Item className="flex items-center gap-2 rounded p-2 hover:bg-accent">
              <FileText className="h-4 w-4" />
              New Note
            </Command.Item>
            <Command.Item className="flex items-center gap-2 rounded p-2 hover:bg-accent">
              <MessageSquare className="h-4 w-4" />
              New Chat
            </Command.Item>
            <Command.Item className="flex items-center gap-2 rounded p-2 hover:bg-accent">
              <FolderPlus className="h-4 w-4" />
              New Collection
            </Command.Item>
          </Command.Group>
        </Command.List>
      </div>
    </Command.Dialog>
  )
}
```

### Additional Components

#### 5. Drag & Drop Collections
- Implement sortable collections within spaces
- Add/remove/rename collection functionality
- Visual feedback during drag operations

#### 6. Empty States
- Beautiful empty states for each section
- Helpful prompts to guide users

#### 7. Loading States
- Skeleton screens for content loading
- Smooth transitions between states

### Testing Checklist
- [ ] Theme toggle works smoothly
- [ ] Sidebar navigation is responsive
- [ ] Drag & drop reorders items correctly
- [ ] Panels resize without glitches
- [ ] Command palette opens with Cmd+K
- [ ] No console errors
- [ ] Mobile responsive (sidebar becomes sheet)
- [ ] Keyboard navigation works
- [ ] Focus states are visible
- [ ] Animations are smooth (60fps)

### Deliverables
- ✅ Complete sidebar with organizational structure
- ✅ Resizable panels system
- ✅ Drag & drop functionality
- ✅ Command palette
- ✅ Beautiful empty states
- ✅ Mobile responsive design
- ✅ Zero errors, production-ready UI

## Success Criteria
By the end of Epic 0:
1. **Beautiful Foundation**: The app looks polished and professional even without features
2. **Zero Errors**: No console warnings or errors
3. **Smooth Interactions**: All animations at 60fps, no jank
4. **Responsive**: Works perfectly on desktop, tablet, and mobile
5. **Intuitive Navigation**: Users understand the organizational structure immediately
6. **Theme System**: Dark/light modes with smooth transitions
7. **Ready for Features**: Clear structure where features can be plugged in

## Next Steps
After Epic 0 completion:
- Epic 1 begins with F01 (Rich Text Editor) and F02 (AI Chat)
- All UI components are ready to receive feature implementations
- Design system is locked in and consistent