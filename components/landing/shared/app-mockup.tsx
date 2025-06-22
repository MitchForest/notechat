'use client'

import { motion } from 'framer-motion'
import { GripVertical, Hash, FileText, MessageSquare, Clock, Star } from 'lucide-react'

export function AppMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="relative"
    >
      {/* Floating animation wrapper */}
      <motion.div
        animate={{ 
          y: [-10, 10, -10],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="relative w-full aspect-[16/10] bg-card rounded-xl shadow-2xl overflow-hidden border">
          {/* Sidebar */}
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-muted border-r">
            {/* Sidebar header */}
            <div className="p-4 border-b">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary">N</span>
                </div>
                <span className="font-semibold text-sm">NoteChat.AI</span>
              </div>
            </div>
            
            {/* Sidebar content */}
            <div className="p-4 space-y-4">
              {/* Notes section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                  <FileText className="w-3 h-3" />
                  <span>NOTES</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-background">
                    <Hash className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm">All Notes</span>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-background/50">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm">Recent</span>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-background/50">
                    <Star className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm">Starred</span>
                  </div>
                </div>
              </div>
              
              {/* Chats section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                  <MessageSquare className="w-3 h-3" />
                  <span>CHATS</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-background/50">
                    <Hash className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm">All Chats</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main content area */}
          <div className="absolute left-64 top-0 right-0 bottom-0 flex">
            {/* Editor panel with blocks */}
            <div className="flex-1 border-r bg-background">
              <div className="p-6 space-y-4">
                {/* Title */}
                <h2 className="text-xl font-semibold">Project Planning</h2>
                
                {/* Block with drag handle */}
                <div className="group relative">
                  <div className="absolute -left-6 top-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
                    <GripVertical className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-foreground/10 rounded w-3/4" />
                    <div className="h-4 bg-foreground/10 rounded w-full" />
                  </div>
                </div>
                
                {/* Block with slash command menu */}
                <div className="relative">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">/</span>
                    <div className="absolute top-6 left-0 bg-card border rounded-lg shadow-lg p-2 z-10 min-w-[200px]">
                      <div className="space-y-1 text-sm">
                        <div className="px-3 py-2 hover:bg-muted rounded-md cursor-pointer flex items-center gap-2">
                          <span className="text-lg">#</span>
                          <span>Heading 1</span>
                        </div>
                        <div className="px-3 py-2 hover:bg-muted rounded-md cursor-pointer flex items-center gap-2">
                          <span className="text-lg">☐</span>
                          <span>To-do list</span>
                        </div>
                        <div className="px-3 py-2 hover:bg-muted rounded-md cursor-pointer flex items-center gap-2 bg-muted">
                          <span className="text-lg">✨</span>
                          <span>AI Write</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Block with ghost text completion */}
                <div className="space-y-2">
                  <div className="h-4 bg-foreground/10 rounded w-2/3" />
                  <div className="flex items-center">
                    <div className="h-4 bg-foreground/10 rounded w-1/3" />
                    <span className="text-muted-foreground/50 italic ml-2 text-sm">
                      and ensure all stakeholders are aligned...
                    </span>
                  </div>
                </div>
                
                {/* Another block */}
                <div className="group relative">
                  <div className="absolute -left-6 top-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
                    <GripVertical className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="h-4 bg-foreground/10 rounded w-5/6" />
                </div>
              </div>
            </div>
            
            {/* Chat panel */}
            <div className="flex-1 bg-background">
              <div className="flex flex-col h-full">
                {/* Chat header */}
                <div className="p-4 border-b">
                  <h3 className="font-semibold">AI Chat</h3>
                </div>
                
                {/* Chat messages */}
                <div className="flex-1 p-4 space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs">You</span>
                    </div>
                    <div className="bg-card rounded-lg p-3 max-w-[80%]">
                      <p className="text-sm">What are the key points in my project planning note?</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-primary-foreground">AI</span>
                    </div>
                    <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                      <p className="text-sm">Based on your project planning note, here are the key points:</p>
                      <ul className="mt-2 space-y-1 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-muted-foreground">•</span>
                          <span>Timeline: 3-month development cycle</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-muted-foreground">•</span>
                          <span>Team size: 5 developers, 2 designers</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                {/* Chat input */}
                <div className="p-4 border-t">
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      placeholder="Ask about your notes..."
                      className="flex-1 px-3 py-2 text-sm bg-muted rounded-lg border-0 outline-none"
                    />
                    <button className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
} 