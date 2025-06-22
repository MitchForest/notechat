'use client'

import { motion } from 'framer-motion'
import { 
  Layers, 
  MessageSquare, 
  Folders, 
  Sparkles, 
  Wand2, 
  CheckCircle 
} from 'lucide-react'
import { SectionWrapper } from '@/components/landing/shared/section-wrapper'
import { FeatureCard } from '@/components/landing/shared/feature-card'

const features = [
  {
    icon: <Layers className="w-6 h-6 text-primary" />,
    title: "Notion-Style Block Editor",
    description: "Drag-and-drop blocks with slash commands for quick formatting. Your ideas, beautifully structured."
  },
  {
    icon: <MessageSquare className="w-6 h-6 text-primary" />,
    title: "AI-Powered Chat",
    description: "Ask questions about your notes. Get summaries, find connections, extract insights from your knowledge base."
  },
  {
    icon: <Folders className="w-6 h-6 text-primary" />,
    title: "Smart Organization",
    description: "Spaces and collections that work like you think. Drag, drop, and organize effortlessly."
  },
  {
    icon: <Sparkles className="w-6 h-6 text-primary" />,
    title: "Adaptive Ghost Completions",
    description: "Ghost text that learns from you. The more you write, the better it predicts. Your personal AI writing partner."
  },
  {
    icon: <Wand2 className="w-6 h-6 text-primary" />,
    title: "Custom AI Commands",
    description: "Highlight and transform. Change tone, adjust reading level, target any audience. AI that adapts to your needs."
  },
  {
    icon: <CheckCircle className="w-6 h-6 text-primary" />,
    title: "Advanced Grammar Check",
    description: "Sophisticated grammar checking that goes beyond basics. Write with confidence, polish with intelligence."
  }
]

export function FeaturesSection() {
  return (
    <SectionWrapper id="features" className="bg-muted/30">
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
            Everything you need to think and write better
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features that work together seamlessly. From structured note-taking to AI-powered insights.
          </p>
        </motion.div>
        
        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              {...feature}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </SectionWrapper>
  )
} 