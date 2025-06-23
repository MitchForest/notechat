'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface AnimatedCollapseProps {
  isOpen: boolean
  children: React.ReactNode
  className?: string
}

export function AnimatedCollapse({ isOpen, children, className }: AnimatedCollapseProps) {
  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  
  // If user prefers reduced motion, use simple show/hide
  if (prefersReducedMotion) {
    return isOpen ? <div className={className}>{children}</div> : null
  }
  
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="content"
          initial={{ height: 0, opacity: 0 }}
          animate={{ 
            height: 'auto', 
            opacity: 1,
            transition: {
              height: { 
                duration: 0.2, 
                ease: [0.04, 0.62, 0.23, 0.98] // Smooth easing
              },
              opacity: { 
                duration: 0.15,
                ease: 'easeOut'
              }
            }
          }}
          exit={{ 
            height: 0, 
            opacity: 0,
            transition: {
              height: { 
                duration: 0.2, 
                ease: [0.04, 0.62, 0.23, 0.98]
              },
              opacity: { 
                duration: 0.15,
                ease: 'easeIn'
              }
            }
          }}
          style={{ overflow: 'hidden' }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
} 