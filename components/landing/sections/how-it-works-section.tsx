'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { SectionWrapper } from '@/components/landing/shared/section-wrapper'
import { 
  CreateNoteVisual, 
  OrganizeVisual, 
  ChatVisual, 
  ExtractVisual 
} from '@/components/landing/shared/step-visuals'

interface Step {
  number: number
  title: string
  description: string
  visual: React.ReactNode
}

const steps: Step[] = [
  {
    number: 1,
    title: "Create your first note",
    description: "Start typing and watch as AI understands your context and offers intelligent suggestions. Ghost completions learn from your writing style.",
    visual: <CreateNoteVisual />
  },
  {
    number: 2,
    title: "Organize with spaces",
    description: "Group related notes into spaces and collections. Drag and drop to arrange your knowledge exactly how you think.",
    visual: <OrganizeVisual />
  },
  {
    number: 3,
    title: "Chat with your knowledge",
    description: "Ask questions about your notes. Get summaries, find connections, and discover insights you might have missed.",
    visual: <ChatVisual />
  },
  {
    number: 4,
    title: "Extract and iterate",
    description: "Turn conversations into new notes. Build on your ideas and watch your knowledge base grow organically.",
    visual: <ExtractVisual />
  }
]

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0)

  return (
    <SectionWrapper id="how-it-works" className="bg-muted/30">
      <div className="space-y-12">
        {/* Section header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center space-y-4"
        >
          <h2 className="text-3xl md:text-4xl font-bold">
            How it works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get started in minutes. NoteChat adapts to your workflow, not the other way around.
          </p>
        </motion.div>

        {/* Timeline navigation */}
        <div className="space-y-12">
          <div className="flex justify-between items-center relative max-w-2xl mx-auto">
            {/* Progress line background */}
            <div className="absolute left-0 right-0 h-0.5 bg-border top-1/2 -translate-y-1/2 -z-10" />
            
            {/* Progress line fill */}
            <motion.div 
              className="absolute left-0 h-0.5 bg-primary top-1/2 -translate-y-1/2 -z-10"
              initial={{ width: "0%" }}
              animate={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
            
            {/* Step indicators */}
            {steps.map((step, index) => (
              <button
                key={step.number}
                onClick={() => setActiveStep(index)}
                className={cn(
                  "relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                  "border-2 bg-background font-semibold text-sm",
                  "hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  activeStep >= index 
                    ? "border-primary bg-primary text-primary-foreground shadow-lg" 
                    : "border-border hover:border-primary/50"
                )}
                aria-label={`Step ${step.number}: ${step.title}`}
              >
                {step.number}
              </button>
            ))}
          </div>
          
          {/* Step content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="grid lg:grid-cols-2 gap-12 items-center"
            >
              <div className="space-y-4 order-2 lg:order-1">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <span className="text-sm font-medium text-primary">
                    Step {steps[activeStep].number}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-bold mt-2">
                    {steps[activeStep].title}
                  </h3>
                </motion.div>
                <motion.p 
                  className="text-lg text-muted-foreground leading-relaxed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {steps[activeStep].description}
                </motion.p>
              </div>
              
              <motion.div 
                className="relative order-1 lg:order-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                {steps[activeStep].visual}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Quick navigation dots for mobile */}
        <div className="flex justify-center gap-2 lg:hidden">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveStep(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                activeStep === index 
                  ? "w-6 bg-primary" 
                  : "bg-border hover:bg-primary/50"
              )}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </SectionWrapper>
  )
} 