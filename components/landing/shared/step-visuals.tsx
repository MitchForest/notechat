'use client'

import { motion, Variants } from 'framer-motion'
import { Sparkles, Folder, Bot, BrainCircuit } from 'lucide-react'

const visualVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

const commonCardClasses = "bg-card rounded-lg border p-6 shadow-lg aspect-[4/3] flex flex-col justify-center items-center text-center"
const commonIconWrapperClasses = "absolute -bottom-4 -right-4 bg-primary text-primary-foreground rounded-full p-3 shadow-lg"

export const CreateNoteVisual = () => (
  <motion.div variants={visualVariants} className="relative">
    <div className={commonCardClasses}>
      <div className="space-y-4 w-full">
        <p className="text-sm font-semibold text-muted-foreground">New Note.md</p>
        <div className="h-4 bg-foreground/5 rounded w-3/4 mx-auto" />
        <div className="h-4 bg-foreground/10 rounded w-full mx-auto" />
        <div className="h-4 bg-primary/20 rounded w-1/2 mx-auto" />
      </div>
    </div>
    <div className={commonIconWrapperClasses}>
      <Sparkles className="w-5 h-5" />
    </div>
  </motion.div>
)

export const OrganizeVisual = () => (
  <motion.div variants={visualVariants} className="relative">
    <div className={commonCardClasses}>
      <div className="flex gap-4">
        <Folder className="w-16 h-16 text-primary/30" />
        <Folder className="w-16 h-16 text-primary/50 translate-y-2" />
        <Folder className="w-16 h-16 text-primary/70" />
      </div>
      <p className="text-sm font-semibold mt-4">Organized Spaces</p>
    </div>
    <div className={commonIconWrapperClasses}>
      <BrainCircuit className="w-5 h-5" />
    </div>
  </motion.div>
)

export const ChatVisual = () => (
  <motion.div variants={visualVariants} className="relative">
    <div className={commonCardClasses}>
      <div className="w-full space-y-3">
        <div className="flex justify-start">
          <div className="bg-muted rounded-lg p-2 text-xs w-3/4">What&apos;s the main idea?</div>
        </div>
        <div className="flex justify-end">
          <div className="bg-primary/10 rounded-lg p-2 text-xs w-3/4">The core concept is...</div>
        </div>
      </div>
    </div>
    <div className={commonIconWrapperClasses}>
      <Bot className="w-5 h-5" />
    </div>
  </motion.div>
)

export const ExtractVisual = () => (
  <motion.div variants={visualVariants} className="relative">
    <div className={commonCardClasses}>
      <div className="text-center">
        <p className="text-xs text-muted-foreground">Conversation Summary</p>
        <div className="mt-2 bg-card border rounded-md p-3 space-y-2">
          <div className="h-2 bg-foreground/10 rounded w-full" />
          <div className="h-2 bg-foreground/10 rounded w-5/6" />
          <div className="h-2 bg-foreground/10 rounded w-3/4" />
        </div>
        <p className="text-2xl font-bold my-2">→</p>
        <p className="text-xs text-muted-foreground">New Note.md</p>
      </div>
    </div>
    <div className={commonIconWrapperClasses}>
      <Sparkles className="w-5 h-5" />
    </div>
  </motion.div>
) 