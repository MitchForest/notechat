'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { AppMockup } from '@/components/landing/shared/app-mockup'
import { SectionWrapper } from '@/components/landing/shared/section-wrapper'
import { ArrowRight, Sparkles } from 'lucide-react'

interface HeroSectionProps {
  onGetStarted: () => void
  onLearnMore: () => void
}

export function HeroSection({ onGetStarted, onLearnMore }: HeroSectionProps) {
  return (
    <SectionWrapper className="pt-32 pb-24 lg:pt-40 lg:pb-32">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* Left: Content */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            <span>AI that learns how you write</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Your AI-Powered Second Brain
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-lg">
            A Notion-style editor with deep AI integration that learns how you write 
            and helps you think better
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                size="lg" 
                onClick={onGetStarted}
                className="shadow-sm hover:shadow-md transition-shadow"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                size="lg" 
                variant="outline" 
                onClick={onLearnMore}
              >
                See How It Works
              </Button>
            </motion.div>
          </div>
          
          {/* Trust indicators */}
          <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Free forever plan</span>
            </div>
          </div>
        </motion.div>
        
        {/* Right: Visual */}
        <div className="relative lg:pl-8">
          <AppMockup />
        </div>
      </div>
    </SectionWrapper>
  )
} 