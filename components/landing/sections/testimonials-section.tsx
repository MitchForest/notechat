'use client'

import { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { SectionWrapper } from '@/components/landing/shared/section-wrapper'
import { TestimonialCard } from '@/components/landing/shared/testimonial-card'
import { Star } from 'lucide-react'

const testimonials = [
  {
    quote: "NoteChat has transformed how I manage my research. The AI chat feature helps me find connections I never noticed before.",
    author: "Sarah Chen",
    role: "PhD Researcher",
    company: "Stanford University"
  },
  {
    quote: "The ghost completions are incredible. It's like having a writing partner who knows exactly what I'm thinking.",
    author: "Marcus Johnson",
    role: "Content Strategist",
    company: "TechCorp"
  },
  {
    quote: "I've tried every note-taking app. NoteChat is the first that actually helps me think better, not just organize better.",
    author: "Emily Rodriguez",
    role: "Product Designer",
    company: "Designlab"
  },
  {
    quote: "The ability to chat with my notes has been a game-changer for my workflow. It's like having a personal knowledge assistant.",
    author: "David Kim",
    role: "Software Engineer",
    company: "StartupXYZ"
  },
  {
    quote: "The block editor feels so natural. Combined with AI features, it's the perfect tool for creative work.",
    author: "Lisa Wang",
    role: "Creative Director",
    company: "Studio One"
  },
  {
    quote: "Grammar checking that actually understands context. It's helped me write with more confidence and clarity.",
    author: "James Miller",
    role: "Technical Writer",
    company: "DocuTech"
  }
]

export function TestimonialsSection() {
  const [isPaused, setIsPaused] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollPosition, setScrollPosition] = useState(0)

  useEffect(() => {
    if (isPaused || !scrollRef.current) return

    const scrollContainer = scrollRef.current
    const scrollStep = 1 // pixels per frame
    const resetThreshold = scrollContainer.scrollWidth / 2

    const animate = () => {
      if (!isPaused && scrollRef.current) {
        const newPosition = scrollPosition + scrollStep
        
        if (newPosition >= resetThreshold) {
          setScrollPosition(0)
          scrollRef.current.scrollLeft = 0
        } else {
          setScrollPosition(newPosition)
          scrollRef.current.scrollLeft = newPosition
        }
      }
    }

    const animationId = requestAnimationFrame(animate)
    
    return () => cancelAnimationFrame(animationId)
  }, [scrollPosition, isPaused])

  return (
    <SectionWrapper id="testimonials">
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
            Loved by thinkers and writers
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands who&apos;ve transformed their workflow with NoteChat
          </p>
          
          {/* Rating */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-primary text-primary" />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              4.9/5 from 2,000+ users
            </span>
          </div>
        </motion.div>

        {/* Testimonials carousel */}
        <div className="relative -mx-4 md:-mx-8 lg:-mx-12">
          {/* Gradient masks for smooth edges */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          
          <div
            ref={scrollRef}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
            className="flex gap-6 overflow-x-hidden px-4 md:px-8 lg:px-12 py-4"
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch' 
            }}
          >
            {/* Duplicate testimonials for seamless loop */}
            {[...testimonials, ...testimonials].map((testimonial, index) => (
              <motion.div 
                key={index} 
                className="flex-none w-[350px] md:w-[400px]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: (index % testimonials.length) * 0.1 }}
                viewport={{ once: true, margin: "-50px" }}
              >
                <TestimonialCard {...testimonial} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Trust indicators */}
        <motion.div 
          className="text-center text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
        >
          Trusted by researchers, writers, and thinkers at leading institutions
        </motion.div>
      </div>
    </SectionWrapper>
  )
} 